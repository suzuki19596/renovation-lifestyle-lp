// ==============================================
// A/Bテスト & AI最適化システム
// ==============================================

const ABTestSystem = {
    // テストバリエーション定義
    variants: {
        ctaButton: {
            control: {
                text: '無料相談で「私らしい暮らし」を見つける',
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
            control: '＼ 簡単30秒 ／',
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

        // 実際の送信処理はここに実装
        // 例: fetch APIでサーバーに送信

        console.log('フォームデータ:', data);

        // デモ用のアラート
        alert('お問い合わせありがとうございます！\n担当者より3営業日以内にご連絡させていただきます。');

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

// 物件データ（gallery1〜8に対応）
// budget: 選択された予算に厳密にマッチする物件のみ表示
const propertyData = [
    {
        image: 'images/gallery1.jpg',
        title: 'ナチュラルモダン',
        specs: '築18年・2LDK・62㎡',
        description: '木の温もりを感じるナチュラルなデザイン。開放感のあるリビングで、心地よい暮らしを実現します。',
        price: '約2,480万円',
        budget: ['2000-2999'],
        layout: ['2']
    },
    {
        image: 'images/gallery2.jpg',
        title: 'シンプルスタイリッシュ',
        specs: '築22年・1LDK・45㎡',
        description: '洗練されたモノトーンデザイン。コンパクトながら機能的な空間で、都会的な暮らしを。',
        price: '約1,580万円',
        budget: ['1000-1999'],
        layout: ['1']
    },
    {
        image: 'images/gallery3.jpg',
        title: 'ヴィンテージリゾート',
        specs: '築15年・3LDK・78㎡',
        description: '落ち着いたヴィンテージ感のあるデザイン。家族でゆったり過ごせる広々とした空間。',
        price: '約3,280万円',
        budget: ['3000-3999'],
        layout: ['3']
    },
    {
        image: 'images/gallery4.jpg',
        title: 'ブルックリンスタイル',
        specs: '築20年・2LDK・58㎡',
        description: 'レンガ調のアクセントがおしゃれなブルックリンスタイル。カフェのような居心地の良さ。',
        price: '約2,180万円',
        budget: ['2000-2999'],
        layout: ['2']
    },
    {
        image: 'images/gallery5.jpg',
        title: 'ミニマルリュクス',
        specs: '築25年・1DK・38㎡',
        description: '贅沢なシンプルさ。上質な素材とミニマルなデザインが融合した、洗練された大人の空間。',
        price: '約980万円',
        budget: ['0-999'],
        layout: ['1']
    },
    {
        image: 'images/gallery6.jpg',
        title: '和モダン',
        specs: '築12年・3LDK・85㎡',
        description: '日本の伝統美と現代的なデザインを融合。落ち着きのある大人のための住まい。',
        price: '約3,680万円',
        budget: ['3000-3999'],
        layout: ['3']
    },
    {
        image: 'images/gallery7.jpg',
        title: 'スカンジナビアン',
        specs: '築19年・2DK・52㎡',
        description: '北欧デザインを取り入れた明るく温かみのある空間。シンプルな暮らしを楽しむ方に。',
        price: '約1,880万円',
        budget: ['1000-1999'],
        layout: ['2']
    },
    {
        image: 'images/gallery8.jpg',
        title: 'インダストリアル',
        specs: '築10年・4LDK・95㎡',
        description: '無骨でかっこいいインダストリアルデザイン。広々とした空間で家族の時間を大切に。',
        price: '約4,280万円',
        budget: ['4000+'],
        layout: ['4+']
    },
    {
        image: 'images/gallery1.jpg',
        title: 'プレミアムナチュラル',
        specs: '築8年・3LDK・92㎡',
        description: '上質な天然素材をふんだんに使用した贅沢なナチュラル空間。大きな窓から光が降り注ぐ開放的なリビング。',
        price: '約4,580万円',
        budget: ['4000+'],
        layout: ['3']
    },
    {
        image: 'images/gallery3.jpg',
        title: 'ラグジュアリーモダン',
        specs: '築5年・4LDK・110㎡',
        description: '高級感あふれるモダンデザイン。広々としたリビングと充実した収納で、快適な暮らしを。',
        price: '約5,280万円',
        budget: ['4000+'],
        layout: ['4+']
    }
];

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
        layout: null,
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
                quizAnswers.layout = value;
                break;
            case 4:
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

        // 結果を見るボタンを非表示（質問4から戻った場合）
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

    // 予算と間取りでフィルタリング（両方に一致するものを優先）
    let matchedProperties = propertyData.filter(prop => {
        const budgetMatch = prop.budget.includes(quizAnswers.budget);
        const layoutMatch = prop.layout.includes(quizAnswers.layout);
        return budgetMatch && layoutMatch;
    });

    // 両方一致がなければ、どちらか一致
    if (matchedProperties.length === 0) {
        matchedProperties = propertyData.filter(prop => {
            const budgetMatch = prop.budget.includes(quizAnswers.budget);
            const layoutMatch = prop.layout.includes(quizAnswers.layout);
            return budgetMatch || layoutMatch;
        });
    }

    // マッチする物件がない場合はランダムに1件
    const displayProperty = matchedProperties.length > 0
        ? matchedProperties[Math.floor(Math.random() * matchedProperties.length)]
        : propertyData[Math.floor(Math.random() * propertyData.length)];

    // 結果カードを生成（1件のみ）
    if (quizResultCards) {
        quizResultCards.innerHTML = `
            <div class="quiz-result-card">
                <img src="${displayProperty.image}" alt="${displayProperty.title}">
                <div class="quiz-result-card-content">
                    <h4 class="quiz-result-card-title">${displayProperty.title}</h4>
                    <p class="quiz-result-card-specs">${displayProperty.specs}</p>
                    <p class="quiz-result-card-desc">${displayProperty.description}</p>
                    <p class="quiz-result-card-price">物件費用：${displayProperty.price}</p>
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
