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

// ヘッダーのスクロール時の背景変更（オプション）
let lastScroll = 0;
let isContactVisible = false; // 問い合わせセクションが見えているかどうか

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    // 固定CTAの表示制御
    const fixedCta = document.getElementById('fixedCta');
    if (fixedCta) {
        // 問い合わせセクションが見えている場合は非表示
        if (isContactVisible) {
            fixedCta.classList.remove('visible');
        } else if (currentScroll > 300) {
            // 300px以上スクロールしたら表示
            fixedCta.classList.add('visible');
        } else {
            fixedCta.classList.remove('visible');
        }
    }

    lastScroll = currentScroll;
});

// 問い合わせセクションの表示検知
const contactSection = document.getElementById('contact');
if (contactSection) {
    const contactObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isContactVisible = entry.isIntersecting;
            const fixedCta = document.getElementById('fixedCta');
            if (fixedCta && isContactVisible) {
                fixedCta.classList.remove('visible');
            }
        });
    }, {
        threshold: 0.1, // セクションの10%が見えたら反応
        rootMargin: '-100px 0px 0px 0px' // 少し余裕を持たせる
    });

    contactObserver.observe(contactSection);
}

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
