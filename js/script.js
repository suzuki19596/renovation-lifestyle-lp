// ==============================================
// A/Bテスト & AI最適化システム
// ==============================================

const ABTestSystem = {
    // テストバリエーション定義
    variants: {
        ctaButton: {
            control: {
                text: '理想の住まいを無料で相談',
                color: '#E67E22'
            },
            variantA: {
                text: '今すぐ無料相談を予約する',
                color: '#D35400'
            },
            variantB: {
                text: '理想の住まいを無料で相談',
                color: '#F39C12'
            }
        },
        heroTitle: {
            control: '「私らしく、生きる部屋。」',
            variantA: '「自分を取り戻す、理想の空間。」',
            variantB: '「毎日が特別になる、私だけの部屋。」'
        },
        ctaBadge: {
            control: '＼ 今だけ特典付き／',
            variantA: '＼ 今だけ特典付き ／',
            variantB: '＼ 女性プランナーが対応 ／'
        }
    },

    // ユーザーセッション管理
    sessionId: null,
    assignedVariants: {},
    interactionData: [],

    // 初期化
    init() {
        this.sessionId = this.getOrCreateSessionId();
        this.assignVariants();
        this.applyVariants();
        this.setupTracking();
        this.loadPreviousData();
        console.log('[A/Bテスト] 初期化完了 - Session:', this.sessionId);
    },

    // セッションID取得または生成
    getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem('ab_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('ab_session_id', sessionId);
        }
        return sessionId;
    },

    // バリエーション割り当て（一貫性を保つためセッションに保存）
    assignVariants() {
        const stored = sessionStorage.getItem('ab_variants');
        if (stored) {
            this.assignedVariants = JSON.parse(stored);
            return;
        }

        // 新規ユーザーにはランダムに割り当て
        for (const testName in this.variants) {
            const variantKeys = Object.keys(this.variants[testName]);
            const randomIndex = Math.floor(Math.random() * variantKeys.length);
            this.assignedVariants[testName] = variantKeys[randomIndex];
        }
        sessionStorage.setItem('ab_variants', JSON.stringify(this.assignedVariants));
    },

    // バリエーション適用
    applyVariants() {
        // CTAボタンのバリエーション適用
        const ctaVariant = this.assignedVariants.ctaButton;
        const ctaConfig = this.variants.ctaButton[ctaVariant];

        const heroCta = document.querySelector('.hero-cta');
        if (heroCta && ctaConfig) {
            heroCta.textContent = ctaConfig.text;
            heroCta.style.backgroundColor = ctaConfig.color;
            heroCta.dataset.variant = ctaVariant;
        }

        // CTAバッジのバリエーション適用
        const badgeVariant = this.assignedVariants.ctaBadge;
        const badgeText = this.variants.ctaBadge[badgeVariant];

        const ctaBadges = document.querySelectorAll('.cta-badge');
        ctaBadges.forEach(badge => {
            if (badgeText) {
                badge.textContent = badgeText;
                badge.dataset.variant = badgeVariant;
            }
        });

        console.log('[A/Bテスト] 適用バリエーション:', this.assignedVariants);
    },

    // トラッキング設定
    setupTracking() {
        // CTAクリックトラッキング
        document.querySelectorAll('.cta-button, .nav-cta').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.trackEvent('cta_click', {
                    element: e.target.className,
                    variant: e.target.dataset.variant || 'default',
                    text: e.target.textContent.trim().substring(0, 50)
                });
            });
        });

        // フォーム送信トラッキング
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', () => {
                this.trackEvent('form_submit', {
                    variants: this.assignedVariants
                });
                this.trackConversion();
            });
        }

        // スクロール深度トラッキング
        this.setupScrollTracking();

        // 滞在時間トラッキング
        this.setupTimeTracking();

        // セクション表示トラッキング
        this.setupSectionTracking();
    },

    // スクロール深度トラッキング
    setupScrollTracking() {
        const milestones = [25, 50, 75, 100];
        const tracked = new Set();

        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );

            milestones.forEach(milestone => {
                if (scrollPercent >= milestone && !tracked.has(milestone)) {
                    tracked.add(milestone);
                    this.trackEvent('scroll_depth', { depth: milestone });
                }
            });
        });
    },

    // 滞在時間トラッキング
    setupTimeTracking() {
        const startTime = Date.now();
        const checkpoints = [30, 60, 120, 300]; // 秒
        const tracked = new Set();

        setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            checkpoints.forEach(checkpoint => {
                if (elapsed >= checkpoint && !tracked.has(checkpoint)) {
                    tracked.add(checkpoint);
                    this.trackEvent('time_on_page', { seconds: checkpoint });
                }
            });
        }, 5000);
    },

    // セクション表示トラッキング
    setupSectionTracking() {
        const sections = ['hero', 'empathy', 'case-study', 'reasons', 'voice', 'contact'];
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.trackEvent('section_view', {
                        section: entry.target.id,
                        variants: this.assignedVariants
                    });
                }
            });
        }, { threshold: 0.3 });

        sections.forEach(id => {
            const section = document.getElementById(id);
            if (section) observer.observe(section);
        });
    },

    // イベントトラッキング
    trackEvent(eventName, data = {}) {
        const event = {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            event: eventName,
            data: data,
            variants: this.assignedVariants,
            url: window.location.href,
            userAgent: navigator.userAgent.substring(0, 100)
        };

        this.interactionData.push(event);
        this.saveData();

        console.log('[A/Bテスト] イベント:', eventName, data);
    },

    // コンバージョントラッキング
    trackConversion() {
        const conversionData = {
            sessionId: this.sessionId,
            variants: this.assignedVariants,
            timestamp: new Date().toISOString(),
            interactions: this.interactionData.length
        };

        // LocalStorageにコンバージョン記録
        const conversions = JSON.parse(localStorage.getItem('ab_conversions') || '[]');
        conversions.push(conversionData);
        localStorage.setItem('ab_conversions', JSON.stringify(conversions));

        console.log('[A/Bテスト] コンバージョン記録:', conversionData);
    },

    // データ保存
    saveData() {
        sessionStorage.setItem('ab_interactions', JSON.stringify(this.interactionData));
    },

    // 以前のデータ読み込み
    loadPreviousData() {
        const stored = sessionStorage.getItem('ab_interactions');
        if (stored) {
            this.interactionData = JSON.parse(stored);
        }
    },

    // 分析レポート生成
    generateReport() {
        const conversions = JSON.parse(localStorage.getItem('ab_conversions') || '[]');
        const report = {
            totalSessions: new Set(conversions.map(c => c.sessionId)).size,
            totalConversions: conversions.length,
            variantPerformance: {}
        };

        // バリエーション別パフォーマンス集計
        conversions.forEach(conv => {
            for (const [test, variant] of Object.entries(conv.variants)) {
                if (!report.variantPerformance[test]) {
                    report.variantPerformance[test] = {};
                }
                if (!report.variantPerformance[test][variant]) {
                    report.variantPerformance[test][variant] = 0;
                }
                report.variantPerformance[test][variant]++;
            }
        });

        console.log('[A/Bテスト] レポート:', report);
        return report;
    }
};

// AI最適化システム
const AIOptimizer = {
    // ユーザー行動パターン分析
    patterns: {
        highEngagement: false,
        fastScroller: false,
        hesitant: false,
        interested: false
    },

    init() {
        this.analyzeUserBehavior();
        console.log('[AI最適化] 初期化完了');
    },

    // ユーザー行動分析
    analyzeUserBehavior() {
        let scrollEvents = 0;
        let lastScrollTime = Date.now();
        let hoverOnCTA = 0;

        // スクロール速度分析
        window.addEventListener('scroll', () => {
            scrollEvents++;
            const currentTime = Date.now();
            const timeDiff = currentTime - lastScrollTime;

            if (timeDiff < 100 && scrollEvents > 5) {
                this.patterns.fastScroller = true;
            }

            lastScrollTime = currentTime;
        });

        // CTA要素へのホバー分析
        document.querySelectorAll('.cta-button, .cta-box').forEach(el => {
            el.addEventListener('mouseenter', () => {
                hoverOnCTA++;
                if (hoverOnCTA > 2) {
                    this.patterns.interested = true;
                    this.showPersonalizedMessage();
                }
            });
        });

        // 迷いの検出（同じエリアを行き来）
        let sectionViews = {};
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id;
                    sectionViews[id] = (sectionViews[id] || 0) + 1;

                    if (sectionViews[id] > 2) {
                        this.patterns.hesitant = true;
                        this.showHelpMessage();
                    }
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('section[id]').forEach(section => {
            observer.observe(section);
        });

        // ページ滞在時間による高エンゲージメント判定
        setTimeout(() => {
            this.patterns.highEngagement = true;
            this.offerSpecialContent();
        }, 120000); // 2分後
    },

    // パーソナライズメッセージ表示
    showPersonalizedMessage() {
        if (sessionStorage.getItem('personalized_shown')) return;
        sessionStorage.setItem('personalized_shown', 'true');

        // CTAボタンのテキストを更新
        const heroCta = document.querySelector('.hero-cta');
        if (heroCta && !heroCta.dataset.personalized) {
            heroCta.dataset.personalized = 'true';
            // 興味を持っているユーザーには具体的なアクションを促す
            console.log('[AI最適化] 興味関心の高いユーザーを検出');
        }
    },

    // ヘルプメッセージ表示（迷っているユーザー向け）
    showHelpMessage() {
        if (sessionStorage.getItem('help_shown')) return;
        sessionStorage.setItem('help_shown', 'true');

        console.log('[AI最適化] 迷っているユーザーを検出 - サポート提案');
    },

    // 特別コンテンツ提供（高エンゲージメントユーザー向け）
    offerSpecialContent() {
        if (sessionStorage.getItem('special_offered')) return;
        sessionStorage.setItem('special_offered', 'true');

        console.log('[AI最適化] 高エンゲージメントユーザー - 特別コンテンツ提供');
    },

    // コンバージョン予測スコア
    getConversionScore() {
        let score = 50; // ベーススコア

        if (this.patterns.highEngagement) score += 20;
        if (this.patterns.interested) score += 15;
        if (this.patterns.hesitant) score -= 10;
        if (this.patterns.fastScroller) score -= 5;

        return Math.min(100, Math.max(0, score));
    }
};

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    ABTestSystem.init();
    AIOptimizer.init();
});

// ハンバーガーメニュー
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // メニューリンクをクリックしたらメニューを閉じる
    navMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// ヘッダースクロール制御
const header = document.getElementById('header');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
    const currentScrollY = window.pageYOffset;

    if (currentScrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    lastScrollY = currentScrollY;
});

// スムーススクロール
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');

        // #のみの場合はスキップ
        if (href === '#') {
            e.preventDefault();
            return;
        }

        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();

            // ヘッダーの高さを考慮
            const headerHeight = header.offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// フォーム送信処理
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // フォームデータの取得
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);

        // チェックボックスの値を取得（複数選択対応）
        const interests = formData.getAll('interests').join('、');

        // メール本文を作成
        const subject = `【お問い合わせ】${data['inquiry-type']}`;
        const body = `
お問い合わせ項目：${data['inquiry-type']}
お名前：${data['name']}
フリガナ：${data['furigana']}
電話番号：${data['phone']}
メールアドレス：${data['email']}
住所：${data['address']}
やってみたい事・考えている事：${interests}
お問い合わせ内容：
${data['message'] || 'なし'}
        `.trim();

        // mailto:リンクでメールを開く
        const mailtoLink = `mailto:suzuki199534st@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;

        // フォームのリセット
        this.reset();
    });
}

// スクロールアニメーション（要素が表示されたらフェードイン）
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// 基本アニメーション対象の要素
const animateElements = document.querySelectorAll(
    '.benefit-item, .case-study, .reason-item, .voice-item, .gift-item'
);

animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// 痛みポイント - 右から順に現れるアニメーション
const painPoints = document.querySelectorAll('.pain-point');
const painObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            const index = Array.from(painPoints).indexOf(entry.target);
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateX(0)';
                entry.target.classList.add('animated');
            }, index * 150); // 順番に150msずつ遅延
        }
    });
}, observerOptions);

painPoints.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(50px)'; // 右から
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    painObserver.observe(el);
});

// FAQ - 左から順に現れるアニメーション
const faqItems = document.querySelectorAll('.faq-item');
const faqObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            const index = Array.from(faqItems).indexOf(entry.target);
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateX(0)';
                entry.target.classList.add('animated');
            }, index * 150); // 順番に150msずつ遅延
        }
    });
}, observerOptions);

faqItems.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-50px)'; // 左から
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    faqObserver.observe(el);
});

// 固定CTAバーの表示制御
let isContactVisible = false;

// 問い合わせセクションの表示検知
const contactSection = document.getElementById('contact');
const fixedCtaBar = document.getElementById('fixedCtaBar');

if (contactSection && fixedCtaBar) {
    const contactObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isContactVisible = entry.isIntersecting;
            if (isContactVisible) {
                fixedCtaBar.classList.add('hidden');
            } else {
                fixedCtaBar.classList.remove('hidden');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '-50px 0px 0px 0px'
    });

    contactObserver.observe(contactSection);
}

// 固定CTAバーのクリックでフォームの問い合わせ項目を自動選択
document.querySelectorAll('.fixed-cta-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const inquiryType = this.dataset.inquiry;
        const inquirySelect = document.getElementById('inquiry-type');
        if (inquirySelect && inquiryType) {
            // 少し遅延させてスクロール後に選択
            setTimeout(() => {
                inquirySelect.value = inquiryType;
            }, 500);
        }
    });
});

// FAQ アコーディオン機能（オプション - 今回はシンプルに全表示）
// faqItemsは上で既に定義されているので再利用
faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
        question.style.cursor = 'pointer';
        question.addEventListener('click', () => {
            const answer = item.querySelector('.faq-answer');
            if (answer) {
                const isVisible = answer.style.display !== 'none';
                answer.style.display = isVisible ? 'none' : 'flex';
            }
        });
    }
});

// リノベ不動産カルーセルの自動スクロール機能
const renoveFeatures = document.querySelector('.renove-features');
if (renoveFeatures) {
    let autoScrollInterval;
    let userInteracted = false;
    let interactionTimeout;

    // 自動スクロール関数
    function startAutoScroll() {
        autoScrollInterval = setInterval(() => {
            if (!userInteracted) {
                const scrollAmount = 1; // スクロール速度
                renoveFeatures.scrollLeft += scrollAmount;

                // 最後まで到達したら最初に戻る
                const maxScroll = renoveFeatures.scrollWidth - renoveFeatures.clientWidth;
                if (renoveFeatures.scrollLeft >= maxScroll) {
                    renoveFeatures.scrollLeft = 0;
                }
            }
        }, 20);
    }

    // ユーザーがスクロールしたら自動スクロールを一時停止
    renoveFeatures.addEventListener('scroll', () => {
        userInteracted = true;
        clearTimeout(interactionTimeout);

        // 3秒後に自動スクロールを再開
        interactionTimeout = setTimeout(() => {
            userInteracted = false;
        }, 3000);
    });

    // マウス操作時も一時停止
    renoveFeatures.addEventListener('mouseenter', () => {
        userInteracted = true;
    });

    renoveFeatures.addEventListener('mouseleave', () => {
        clearTimeout(interactionTimeout);
        interactionTimeout = setTimeout(() => {
            userInteracted = false;
        }, 1000);
    });

    // タッチ操作時も一時停止
    renoveFeatures.addEventListener('touchstart', () => {
        userInteracted = true;
    });

    renoveFeatures.addEventListener('touchend', () => {
        clearTimeout(interactionTimeout);
        interactionTimeout = setTimeout(() => {
            userInteracted = false;
        }, 3000);
    });

    // 自動スクロール開始
    startAutoScroll();
}

// ==============================================
// クイズ機能
// ==============================================
const quizModal = document.getElementById('quizModal');
const openQuizBtn = document.getElementById('openQuizBtn');
const quizClose = document.getElementById('quizClose');
const quizOverlay = document.getElementById('quizOverlay');
const quizSubmit = document.getElementById('quizSubmit');
const quizRestart = document.getElementById('quizRestart');
const quizResult = document.getElementById('quizResult');
const quizResultCards = document.getElementById('quizResultCards');

// リフォームデータ（箇所別の費用目安）
const reformData = {
    living: {
        name: 'リビング',
        description: '床・壁・天井の張替え、間取り変更など',
        priceRange: {
            '0-200': '50万円〜150万円',
            '201-400': '150万円〜350万円',
            '401-600': '350万円〜550万円',
            '601+': '550万円〜'
        },
        details: '床材の張替え、壁紙の交換、照明器具の変更、間仕切りの撤去など、お好みのスタイルに合わせてカスタマイズできます。'
    },
    kitchen: {
        name: 'キッチン',
        description: 'システムキッチン交換、レイアウト変更など',
        priceRange: {
            '0-200': '80万円〜180万円',
            '201-400': '180万円〜380万円',
            '401-600': '380万円〜580万円',
            '601+': '580万円〜'
        },
        details: 'システムキッチンの交換、収納の増設、対面式への変更など、使いやすさとデザイン性を両立したキッチンをご提案します。'
    },
    bathroom: {
        name: '浴室',
        description: 'ユニットバス交換、在来工法からの変更など',
        priceRange: {
            '0-200': '60万円〜150万円',
            '201-400': '150万円〜350万円',
            '401-600': '350万円〜500万円',
            '601+': '500万円〜'
        },
        details: 'ユニットバスの交換、浴室暖房乾燥機の設置、バリアフリー対応など、快適なバスタイムを実現します。'
    },
    toilet: {
        name: 'トイレ',
        description: '便器交換、内装リフォームなど',
        priceRange: {
            '0-200': '15万円〜80万円',
            '201-400': '80万円〜150万円',
            '401-600': '150万円〜250万円',
            '601+': '250万円〜'
        },
        details: '最新のタンクレストイレへの交換、手洗い器の設置、収納の増設など、清潔で快適なトイレ空間をご提案します。'
    },
    exterior: {
        name: '外壁',
        description: '外壁塗装、サイディング張替えなど',
        priceRange: {
            '0-200': '80万円〜180万円',
            '201-400': '180万円〜380万円',
            '401-600': '380万円〜580万円',
            '601+': '580万円〜'
        },
        details: '外壁塗装、サイディングの張替え、断熱材の追加など、建物の美観と性能を向上させます。'
    }
};

let quizAnswers = {
    gender: null,
    age: null,
    layout: null,
    budget: null
};

let currentStep = 1;

// モーダルを開く
if (openQuizBtn && quizModal) {
    openQuizBtn.addEventListener('click', () => {
        quizModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        resetQuiz();
    });
}

// モーダルを閉じる
function closeQuizModal() {
    quizModal.classList.remove('active');
    document.body.style.overflow = '';
}

if (quizClose) {
    quizClose.addEventListener('click', closeQuizModal);
}

if (quizOverlay) {
    quizOverlay.addEventListener('click', closeQuizModal);
}

// クイズをリセット
function resetQuiz() {
    currentStep = 1;
    quizAnswers = {
        gender: null,
        age: null,
        location: null,
        timing: null,
        budget: null
    };

    // すべてのステップを非表示
    document.querySelectorAll('.quiz-step').forEach((step, index) => {
        step.style.display = index === 0 ? 'block' : 'none';
    });

    // 結果を非表示
    if (quizResult) {
        quizResult.style.display = 'none';
    }

    // すべての選択をリセット
    document.querySelectorAll('.quiz-option').forEach(option => {
        option.classList.remove('selected');
    });

    // 結果を見るボタンを非表示
    if (quizSubmit) {
        quizSubmit.style.display = 'none';
    }
}

// オプションクリック処理
document.querySelectorAll('.quiz-option').forEach(option => {
    option.addEventListener('click', function() {
        const step = this.closest('.quiz-step');
        const stepNumber = parseInt(step.dataset.step);
        const value = this.dataset.value;

        // 同じステップ内の選択をリセット
        step.querySelectorAll('.quiz-option').forEach(opt => {
            opt.classList.remove('selected');
        });

        // 選択状態にする
        this.classList.add('selected');

        // 回答を保存
        switch(stepNumber) {
            case 1:
                quizAnswers.gender = value;
                break;
            case 2:
                quizAnswers.age = value;
                break;
            case 3:
                quizAnswers.location = value;
                break;
            case 4:
                quizAnswers.timing = value;
                break;
            case 5:
                quizAnswers.budget = value;
                // 最後の質問では「結果を見る」ボタンを表示
                if (quizSubmit) {
                    quizSubmit.style.display = 'block';
                }
                return; // 自動で次に進まない
        }

        // 次のステップへ（0.5秒後）
        setTimeout(() => {
            goToStep(stepNumber + 1);
        }, 500);
    });
});

// ステップ移動
function goToStep(stepNumber) {
    document.querySelectorAll('.quiz-step').forEach(step => {
        step.style.display = 'none';
    });

    const nextStep = document.querySelector(`.quiz-step[data-step="${stepNumber}"]`);
    if (nextStep) {
        nextStep.style.display = 'block';
        currentStep = stepNumber;
    }
}

// 戻るボタン処理
document.querySelectorAll('.quiz-back').forEach(backBtn => {
    backBtn.addEventListener('click', function() {
        const targetStep = parseInt(this.dataset.back);
        goToStep(targetStep);

        // 結果を見るボタンを非表示（質問5から戻った場合）
        if (quizSubmit) {
            quizSubmit.style.display = 'none';
        }
    });
});

// 結果を表示
if (quizSubmit) {
    quizSubmit.addEventListener('click', () => {
        showResults();
    });
}

function showResults() {
    // すべてのステップを非表示
    document.querySelectorAll('.quiz-step').forEach(step => {
        step.style.display = 'none';
    });

    // 結果を表示
    if (quizResult) {
        quizResult.style.display = 'block';
    }

    // 選択されたリフォーム箇所と予算を取得
    const selectedLocation = quizAnswers.location;
    const selectedBudget = quizAnswers.budget;

    // リフォームデータから該当箇所を取得
    const reformInfo = reformData[selectedLocation];

    if (reformInfo && quizResultCards) {
        const priceEstimate = reformInfo.priceRange[selectedBudget] || '要相談';

        quizResultCards.innerHTML = `
            <div class="quiz-result-card">
                <div class="quiz-result-card-content">
                    <h4 class="quiz-result-card-title">${reformInfo.name}リフォーム</h4>
                    <p class="quiz-result-card-specs">${reformInfo.description}</p>
                    <p class="quiz-result-card-desc">${reformInfo.details}</p>
                    <p class="quiz-result-card-price">費用目安：${priceEstimate}</p>
                </div>
            </div>
        `;
    }
}

// 問い合わせフォームへ移動時にモーダルを閉じる
const quizContactBtn = document.getElementById('quizContactBtn');
if (quizContactBtn) {
    quizContactBtn.addEventListener('click', () => {
        closeQuizModal();
    });
}

// CTAセクション（生き方の選択後）到達時に自動でクイズモーダルを開く
let quizAutoOpened = false; // 一度だけ開くためのフラグ

const ctaAfterLifestyle = document.getElementById('ctaAfterLifestyle');
if (ctaAfterLifestyle && quizModal) {
    const ctaObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !quizAutoOpened) {
                quizAutoOpened = true;
                // 少し遅延させてスムーズに開く
                setTimeout(() => {
                    quizModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                    resetQuiz();
                }, 500);
                // 一度開いたらオブザーバーを解除
                ctaObserver.disconnect();
            }
        });
    }, {
        threshold: 0.3, // セクションの30%が見えたら発火
        rootMargin: '0px'
    });

    ctaObserver.observe(ctaAfterLifestyle);
}

// ==============================================
// プライバシーポリシーモーダル
// ==============================================
const privacyModal = document.getElementById('privacyModal');
const openPrivacyBtn = document.getElementById('openPrivacyBtn');
const privacyClose = document.getElementById('privacyClose');
const privacyOverlay = document.getElementById('privacyOverlay');
const privacyAgreeBtn = document.getElementById('privacyAgreeBtn');
const privacyCheckbox = document.querySelector('input[name="privacy"]');

// モーダルを開く
if (openPrivacyBtn && privacyModal) {
    openPrivacyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        privacyModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
}

// モーダルを閉じる
function closePrivacyModal() {
    privacyModal.classList.remove('active');
    document.body.style.overflow = '';
}

if (privacyClose) {
    privacyClose.addEventListener('click', closePrivacyModal);
}

if (privacyOverlay) {
    privacyOverlay.addEventListener('click', closePrivacyModal);
}

// 同意して閉じるボタン
if (privacyAgreeBtn) {
    privacyAgreeBtn.addEventListener('click', () => {
        // チェックボックスにチェックを入れる
        if (privacyCheckbox) {
            privacyCheckbox.checked = true;
        }
        closePrivacyModal();
    });
}

// ESCキーでモーダルを閉じる
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (privacyModal && privacyModal.classList.contains('active')) {
            closePrivacyModal();
        }
    }
});
