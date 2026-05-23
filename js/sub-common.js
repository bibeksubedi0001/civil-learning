/* ============================================
   SHARED SUB-CHAPTER UTILITIES
   Common helpers for all sub-chapter pages
   ============================================ */

/* ── Auto-inject enhancements stylesheet ── */
(function () {
    if (document.querySelector('link[data-enhancements]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = (document.currentScript && document.currentScript.src
        ? document.currentScript.src.replace(/\/js\/sub-common\.js.*$/, '')
        : '..') + '/css/enhancements.css';
    link.dataset.enhancements = 'true';
    document.head.appendChild(link);
})();

/* ── Auto-inject default head meta (theme-color, manifest, og:image) ── */
(function () {
    const head = document.head;
    const has = sel => !!head.querySelector(sel);
    const meta = (attrs) => {
        const el = document.createElement('meta');
        for (const k in attrs) el.setAttribute(k, attrs[k]);
        head.appendChild(el);
    };
    const link = (attrs) => {
        const el = document.createElement('link');
        for (const k in attrs) el.setAttribute(k, attrs[k]);
        head.appendChild(el);
    };

    const origin = 'https://civil-learning.bibeksubedi0001.com.np';
    const ogImg  = origin + '/assets/og-image.png';
    const title  = (document.querySelector('h1')?.textContent || document.title).trim();
    const desc   = head.querySelector('meta[name="description"]')?.content || title;
    const canon  = origin + location.pathname;

    if (!has('meta[name="theme-color"]')) {
        meta({ name: 'theme-color', content: '#0a0a0f', media: '(prefers-color-scheme: dark)' });
        meta({ name: 'theme-color', content: '#ffffff', media: '(prefers-color-scheme: light)' });
    }
    if (!has('link[rel="manifest"]')) {
        link({ rel: 'manifest', href: '/manifest.webmanifest' });
    }
    if (!has('link[rel="canonical"]')) {
        link({ rel: 'canonical', href: canon });
    }
    if (!has('meta[property="og:type"]')) {
        meta({ property: 'og:type', content: 'article' });
        meta({ property: 'og:title', content: title });
        meta({ property: 'og:description', content: desc });
        meta({ property: 'og:url', content: canon });
        meta({ property: 'og:site_name', content: "Civil Engineer's Guide to AI" });
        meta({ property: 'og:image', content: ogImg });
        meta({ property: 'og:image:width', content: '1200' });
        meta({ property: 'og:image:height', content: '630' });
    }
    if (!has('meta[name="twitter:card"]')) {
        meta({ name: 'twitter:card', content: 'summary_large_image' });
        meta({ name: 'twitter:title', content: title });
        meta({ name: 'twitter:description', content: desc });
        meta({ name: 'twitter:image', content: ogImg });
    }
})();

/* ── KaTeX math rendering (auto-load from CDN) ── */
(function loadKaTeX() {
    'use strict';
    var KATEX_VER = '0.16.11';
    var CDN = 'https://cdn.jsdelivr.net/npm/katex@' + KATEX_VER + '/dist/';

    // Inject KaTeX stylesheet
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = CDN + 'katex.min.css';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    // Load KaTeX core then auto-render extension
    var script = document.createElement('script');
    script.src = CDN + 'katex.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = function () {
        var ar = document.createElement('script');
        ar.src = CDN + 'contrib/auto-render.min.js';
        ar.crossOrigin = 'anonymous';
        ar.onload = function () {
            // Render all $...$ and $$...$$ on the page once DOM + scripts ready
            function renderMath() {
                if (window.renderMathInElement) {
                    window.renderMathInElement(document.body, {
                        delimiters: [
                            { left: '$$', right: '$$', display: true },
                            { left: '$', right: '$', display: false },
                            { left: '\\(', right: '\\)', display: false },
                            { left: '\\[', right: '\\]', display: true }
                        ],
                        throwOnError: false,
                        trust: true,
                        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
                    });
                }
            }
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', renderMath);
            } else {
                renderMath();
            }
        };
        document.head.appendChild(ar);
    };
    document.head.appendChild(script);
})();

(function () {
    'use strict';

    /* ── DOM helpers ── */
    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    /* ── Math helpers ── */
    const lerp = (a, b, t) => a + (b - a) * t;
    const rand = (a, b) => Math.random() * (b - a) + a;
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const PI = Math.PI, TAU = PI * 2;

    /* ── Theme-aware colors ── */
    function getColors() {
        const dark = window.isDarkMode ? window.isDarkMode() : true;
        return {
            TEAL:   dark ? '#2dd4bf' : '#059669',
            CYAN:   dark ? '#22d3ee' : '#0284c7',
            AMBER:  dark ? '#fbbf24' : '#d97706',
            RED:    dark ? '#ef4444' : '#dc2626',
            GREEN:  dark ? '#22c55e' : '#16a34a',
            BG:     dark ? '#0a0a0f' : '#f8f9fc',
            TEXT:   dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            DIM:    dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            GRID:   dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)',
            NODE:   dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            STROKE: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            WHITE:  dark ? '#fff' : '#1a1a2e',
            MUTED:  dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
        };
    }

    /* ── DPI-aware canvas init ── */
    function initCanvas(canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width  = rect.width  * dpr;
        canvas.height = rect.height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        return { ctx, w: rect.width, h: rect.height };
    }

    /* ── Scroll progress bar ── */
    window.addEventListener('scroll', () => {
        const bar = $('#scroll-progress');
        if (!bar) return;
        const pct = window.scrollY / (document.body.scrollHeight - innerHeight);
        bar.style.width = (pct * 100) + '%';
    });

    /* ── Section reveal (IntersectionObserver) ── */
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) e.target.classList.add('visible');
        });
    }, { threshold: 0.08 });

    document.addEventListener('DOMContentLoaded', () => {
        $$('.ch-section, .demo-panel, .info-card, .process-step, .quiz-block, .concept-block, .interactive-panel, .sub-section').forEach(el => observer.observe(el));

        /* ── Hub page sub-card staggered reveal ── */
        const subCards = $$('.sub-card');
        if (subCards.length) {
            const cardObs = new IntersectionObserver(entries => {
                entries.forEach((e, i) => {
                    if (e.isIntersecting) {
                        setTimeout(() => e.target.classList.add('visible'), i * 80);
                    }
                });
            }, { threshold: 0.06 });
            subCards.forEach(c => cardObs.observe(c));
        }
    });

    /* ── Nav shrink on scroll ── */
    window.addEventListener('scroll', () => {
        const nav = $('#main-nav');
        if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
    });

    /* ── Quiz logic ── */
    window.checkQuiz = function (optEl, quizId) {
        const block = document.getElementById(quizId);
        if (!block) return;
        const options = block.querySelectorAll('.quiz-option');
        const correct = optEl.getAttribute('data-correct') === 'true';

        options.forEach(o => {
            o.style.pointerEvents = 'none';
            o.style.opacity = '0.5';
        });
        optEl.style.opacity = '1';

        if (correct) {
            optEl.classList.add('correct');
            const fb = document.getElementById(quizId + '-correct');
            if (fb) fb.style.display = 'block';
        } else {
            optEl.classList.add('wrong');
            const fb = document.getElementById(quizId + '-wrong');
            if (fb) fb.style.display = 'block';
            options.forEach(o => {
                if (o.getAttribute('data-correct') === 'true') {
                    o.classList.add('correct');
                    o.style.opacity = '1';
                }
            });
        }
    };

    /* ── Sidebar navigation toggle ── */
    document.addEventListener('DOMContentLoaded', () => {
        const toggle = $('#sidebar-toggle');
        const sidebar = $('#sub-sidebar');
        if (toggle && sidebar) {
            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }
    });

    /* ── Expose utilities globally ── */
    window.ChapterUtils = { $, $$, lerp, rand, clamp, PI, TAU, getColors, initCanvas };

})();


/* =====================================================================
   ENHANCEMENTS (added):
   - Skip-to-content link
   - Reading time auto-estimate
   - Breadcrumbs auto-injection
   - Prev / Next sub-chapter navigation
   - Copy-to-clipboard for code blocks
   - Quiz score persistence (per page) via event delegation
   - Page-completion progress tracking via IntersectionObserver
   ===================================================================== */
(function () {
    'use strict';

    const LS_PREFIX     = 'ce-ai:';
    const LS_PROGRESS   = LS_PREFIX + 'progress';   // {"chapter1/sub1.html": true, ...}
    const LS_QUIZ       = LS_PREFIX + 'quiz';       // {"chapter1/sub1.html": {"quiz-1": "correct", ...}}

    const pageKey = (() => {
        const p = location.pathname.replace(/^\//, '');
        // collapse trailing "/" to "/index.html"
        return p.endsWith('/') ? p + 'index.html' : p;
    })();

    function readJSON(key, fallback) {
        try { return JSON.parse(localStorage.getItem(key)) || fallback; }
        catch { return fallback; }
    }
    function writeJSON(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }

    /* ----- Skip-to-content link (a11y) ----- */
    function injectSkipLink() {
        if (document.querySelector('.skip-to-content')) return;
        const main = document.querySelector('main, .chapter-content, [role="main"]');
        if (!main) return;
        if (!main.id) main.id = 'main-content';
        const a = document.createElement('a');
        a.href = '#' + main.id;
        a.className = 'skip-to-content';
        a.textContent = 'Skip to main content';
        document.body.insertBefore(a, document.body.firstChild);
    }

    /* ----- Reading time estimate ----- */
    function estimateReadingTime() {
        const main = document.querySelector('main, .chapter-content');
        if (!main) return null;
        const text = main.innerText || main.textContent || '';
        const words = text.trim().split(/\s+/).length;
        return Math.max(1, Math.round(words / 220));   // ~220 wpm
    }

    function updateReadingTimeMeta() {
        const minutes = estimateReadingTime();
        if (!minutes) return;
        // Update an existing "X min read" span if present, otherwise inject
        const metaContainer = document.querySelector('.chapter-hero__meta, .ch-stats');
        if (!metaContainer) return;
        const existing = Array.from(metaContainer.querySelectorAll('span, div'))
            .find(el => /min\s+read/i.test(el.textContent));
        const label = `${minutes} min read`;
        if (existing) {
            existing.innerHTML = `<i class="fa-solid fa-clock"></i> ${label}`;
        }
        // Expose for breadcrumbs / other consumers
        window.__readingMinutes = minutes;
    }

    /* ----- Breadcrumbs ----- */
    function injectBreadcrumbs() {
        if (document.querySelector('.breadcrumbs')) return;
        const m = location.pathname.match(/\/(chapter(\d+))\/(sub(\d+)|index)\.html?$/i);
        if (!m) return;
        const [, chapterDir, chapterNum, , subNum] = m;
        const titleEl = document.querySelector('.chapter-hero__title, h1');
        const pageTitle = titleEl ? titleEl.textContent.trim() : document.title;

        const nav = document.createElement('nav');
        nav.className = 'breadcrumbs';
        nav.setAttribute('aria-label', 'Breadcrumb');
        nav.innerHTML = `
            <ol>
                <li><a href="/"><i class="fa-solid fa-house"></i> Home</a></li>
                <li><a href="/${chapterDir}/index.html">Chapter ${chapterNum}</a></li>
                <li aria-current="page">${subNum ? 'Lesson ' + chapterNum + '.' + subNum : 'Overview'}</li>
            </ol>
        `;

        const target = document.querySelector('.chapter-content, main');
        if (target) target.insertBefore(nav, target.firstChild);

        // JSON-LD BreadcrumbList for SEO
        const origin = location.origin;
        const json = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": origin + "/" },
                { "@type": "ListItem", "position": 2, "name": "Chapter " + chapterNum, "item": `${origin}/${chapterDir}/index.html` },
                { "@type": "ListItem", "position": 3, "name": pageTitle, "item": location.href }
            ]
        };
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(json);
        document.head.appendChild(script);
    }

    /* ----- Prev / Next navigation ----- */
    // Chapter sub-page counts (from sitemap.xml)
    const SUB_COUNTS = { 1: 12, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10 };

    function injectPrevNext() {
        const m = location.pathname.match(/\/chapter(\d+)\/sub(\d+)\.html?$/i);
        if (!m) return;
        const chNum = parseInt(m[1], 10);
        const subNum = parseInt(m[2], 10);
        const count = SUB_COUNTS[chNum];
        if (!count) return;

        const prev = subNum > 1
            ? { href: `sub${subNum - 1}.html`, label: `Lesson ${chNum}.${subNum - 1}` }
            : { href: `index.html`, label: `Chapter ${chNum} hub` };

        let next;
        if (subNum < count) {
            next = { href: `sub${subNum + 1}.html`, label: `Lesson ${chNum}.${subNum + 1}` };
        } else if (chNum < 6 && SUB_COUNTS[chNum + 1]) {
            next = { href: `../chapter${chNum + 1}/index.html`, label: `Chapter ${chNum + 1}` };
        } else {
            next = { href: `../index.html`, label: `All chapters` };
        }

        const nav = document.createElement('nav');
        nav.className = 'page-nav';
        nav.setAttribute('aria-label', 'Lesson navigation');
        nav.innerHTML = `
            <a class="page-nav__link page-nav__prev" href="${prev.href}">
                <span class="page-nav__hint"><i class="fa-solid fa-arrow-left"></i> Previous</span>
                <span class="page-nav__title">${prev.label}</span>
            </a>
            <a class="page-nav__link page-nav__next" href="${next.href}">
                <span class="page-nav__hint">Next <i class="fa-solid fa-arrow-right"></i></span>
                <span class="page-nav__title">${next.label}</span>
            </a>
        `;
        const main = document.querySelector('main, .chapter-content');
        if (main) main.appendChild(nav);
    }

    /* ----- Copy-to-clipboard on <pre> code blocks ----- */
    function attachCodeCopy() {
        document.querySelectorAll('pre').forEach(pre => {
            if (pre.querySelector('.copy-btn')) return;
            if (pre.closest('.no-copy')) return;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'copy-btn';
            btn.setAttribute('aria-label', 'Copy code to clipboard');
            btn.innerHTML = '<i class="fa-regular fa-copy"></i>';
            pre.style.position = pre.style.position || 'relative';
            pre.appendChild(btn);
            btn.addEventListener('click', async () => {
                const code = pre.querySelector('code')?.innerText ?? pre.innerText;
                try {
                    await navigator.clipboard.writeText(code.replace(/\n?Copy$/, ''));
                    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
                    setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i>'; }, 1500);
                } catch {
                    btn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                }
            });
        });
    }

    /* ----- Quiz score persistence via event delegation -----
       Works regardless of which checkQuiz() implementation the page uses,
       because the page already adds the .correct / .wrong classes itself. */
    function attachQuizTracking() {
        document.addEventListener('click', evt => {
            const opt = evt.target.closest('.quiz-option');
            if (!opt) return;
            const block = opt.closest('.quiz-block');
            if (!block || !block.id) return;
            // Defer one tick so the page's own checkQuiz can apply classes first
            setTimeout(() => {
                const correct = opt.classList.contains('correct')
                    ? true
                    : opt.classList.contains('wrong')
                        ? false
                        : opt.getAttribute('data-correct') === 'true';
                const store = readJSON(LS_QUIZ, {});
                store[pageKey] = store[pageKey] || {};
                // Don't overwrite a previous "correct" with a later wrong click
                if (store[pageKey][block.id] !== 'correct') {
                    store[pageKey][block.id] = correct ? 'correct' : 'wrong';
                    writeJSON(LS_QUIZ, store);
                }
                renderQuizScore();
            }, 0);
        }, { passive: true });
    }

    function renderQuizScore() {
        const store = readJSON(LS_QUIZ, {})[pageKey] || {};
        const total = document.querySelectorAll('.quiz-block').length;
        if (!total) return;
        const answered = Object.keys(store).length;
        const correct = Object.values(store).filter(v => v === 'correct').length;
        let badge = document.getElementById('quiz-score-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'quiz-score-badge';
            badge.className = 'quiz-score-badge';
            badge.setAttribute('role', 'status');
            badge.setAttribute('aria-live', 'polite');
            document.body.appendChild(badge);
        }
        badge.innerHTML = `<i class="fa-solid fa-graduation-cap"></i> ${correct}/${total} correct &middot; ${answered}/${total} answered`;
        badge.classList.toggle('complete', answered === total && correct === total);
    }

    /* ----- Page-completion progress tracking ----- */
    function trackPageCompletion() {
        // Mark as completed when user scrolls to within 200px of bottom
        const onScroll = () => {
            if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 200) {
                const store = readJSON(LS_PROGRESS, {});
                if (!store[pageKey]) {
                    store[pageKey] = { completedAt: new Date().toISOString() };
                    writeJSON(LS_PROGRESS, store);
                }
                window.removeEventListener('scroll', onScroll);
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* ----- Init ----- */
    function init() {
        injectSkipLink();
        updateReadingTimeMeta();
        injectBreadcrumbs();
        injectPrevNext();
        attachCodeCopy();
        attachQuizTracking();
        renderQuizScore();
        trackPageCompletion();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

