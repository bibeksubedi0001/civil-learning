/* ============================================
   SHARED SUB-CHAPTER UTILITIES
   Common helpers for all sub-chapter pages
   ============================================ */

/* ── Resolve site base path from this script's URL (e.g. "../") ── */
(function () {
    const src = document.currentScript && document.currentScript.src;
    const base = src ? src.replace(/\/js\/sub-common\.js.*$/, '') : '..';
    window.__CE_BASE__ = base;
})();

/* ── Auto-inject enhancements stylesheet ── */
(function () {
    if (document.querySelector('link[data-enhancements]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = window.__CE_BASE__ + '/css/enhancements.css';
    link.dataset.enhancements = 'true';
    document.head.appendChild(link);
})();

/* ── Auto-load shared search index (needed by recommender + rollups) ── */
(function () {
    if (window.CE_SEARCH_INDEX || document.querySelector('script[data-ce-search-index]')) return;
    const s = document.createElement('script');
    s.src = window.__CE_BASE__ + '/js/search-index.js';
    s.defer = true;
    s.dataset.ceSearchIndex = 'true';
    document.head.appendChild(s);
})();

/* ── Auto-load flashcards engine (needed for auto-collect on sub pages) ── */
(function () {
    if (window.CE_Flashcards || document.querySelector('script[data-ce-flashcards]')) return;
    const s = document.createElement('script');
    s.src = window.__CE_BASE__ + '/js/flashcards.js';
    s.defer = true;
    s.dataset.ceFlashcards = 'true';
    document.head.appendChild(s);
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
            BG:     dark ? '#161a26' : '#f1f3f8',
            TEXT:   dark ? 'rgba(255,255,255,0.78)' : 'rgba(0,0,0,0.6)',
            DIM:    dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            GRID:   dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            NODE:   dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            STROKE: dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)',
            WHITE:  dark ? '#fff' : '#1a1a2e',
            MUTED:  dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)'
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
    const LS_BOOKMARKS  = LS_PREFIX + 'bookmarks';  // {"chapter1/sub1.html": {addedAt: "..."}}

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
        if (target) {
            target.insertBefore(nav, target.firstChild);
        } else {
            // Chapter hubs without a <main> element: insert after the site nav
            // so the breadcrumb sits between the global header and the hero.
            const after = document.querySelector('body > nav, body > header, .main-nav');
            nav.classList.add('breadcrumbs--standalone');
            if (after && after.parentNode) after.parentNode.insertBefore(nav, after.nextSibling);
            else document.body.insertBefore(nav, document.body.firstChild);
        }

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
                maybeMarkCompleteFromQuiz();
            }, 0);
        }, { passive: true });
    }

    /* Mark page complete when every quiz on the page is answered correctly. */
    function maybeMarkCompleteFromQuiz() {
        const blocks = document.querySelectorAll('.quiz-block');
        if (!blocks.length) return;
        const store = readJSON(LS_QUIZ, {})[pageKey] || {};
        for (const b of blocks) {
            if (!b.id || store[b.id] !== 'correct') return;
        }
        markPageComplete('quiz');
    }

    function markPageComplete(reason) {
        const store = readJSON(LS_PROGRESS, {});
        if (store[pageKey]) return;
        store[pageKey] = {
            completedAt: new Date().toISOString(),
            via: reason || 'scroll'
        };
        writeJSON(LS_PROGRESS, store);
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
                markPageComplete('scroll');
                window.removeEventListener('scroll', onScroll);
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        // Also check on init in case the page already has a perfect quiz score from a prior visit
        maybeMarkCompleteFromQuiz();
    }

    /* ----- Bookmark / save-for-later ----- */
    function isSubPage() {
        return /\/chapter\d+\/sub\d+\.html?$/i.test(location.pathname);
    }

    function getBookmarks() {
        return readJSON(LS_BOOKMARKS, {});
    }

    function isBookmarked() {
        return !!getBookmarks()[pageKey];
    }

    function toggleBookmark() {
        const store = getBookmarks();
        if (store[pageKey]) {
            delete store[pageKey];
        } else {
            const titleEl = document.querySelector('.chapter-hero__title, h1');
            store[pageKey] = {
                addedAt: new Date().toISOString(),
                title: titleEl ? titleEl.textContent.trim() : document.title
            };
        }
        writeJSON(LS_BOOKMARKS, store);
        renderBookmarkButton();
    }

    function renderBookmarkButton() {
        const btn = document.getElementById('bookmark-btn');
        if (!btn) return;
        const on = isBookmarked();
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        btn.setAttribute('title', on ? 'Remove bookmark' : 'Save for later');
        btn.innerHTML = on
            ? '<i class="fa-solid fa-bookmark"></i><span>Saved</span>'
            : '<i class="fa-regular fa-bookmark"></i><span>Save</span>';
    }

    function injectBookmarkButton() {
        if (!isSubPage()) return;
        if (document.getElementById('bookmark-btn')) return;
        const btn = document.createElement('button');
        btn.id = 'bookmark-btn';
        btn.type = 'button';
        btn.className = 'bookmark-btn';
        btn.setAttribute('aria-label', 'Save this lesson for later');
        btn.addEventListener('click', toggleBookmark);
        document.body.appendChild(btn);
        renderBookmarkButton();
    }

    /* ----- "Next up" smart recommender -----
       Picks:
         1. The next uncompleted lesson in the current chapter (skips current).
         2. Up to 2 related lessons from OTHER chapters via tag-token overlap.
       Renders below the prev/next nav. Requires window.CE_SEARCH_INDEX. */
    function tokenize(s) {
        return (s || '')
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, ' ')
            .split(/\s+/)
            .filter(t => t.length > 2);
    }

    const STOP = new Set([
        'the','and','for','with','from','what','that','this','are','was','were','into',
        'sub','chapter','lesson','intro','introduction','case','study','using','your'
    ]);

    function buildRecommendations(currentEntry, allEntries, completedSet) {
        const sameCh = allEntries.filter(e =>
            e.ch === currentEntry.ch && e.n > 0 && e.href !== currentEntry.href);
        const otherCh = allEntries.filter(e =>
            e.ch !== currentEntry.ch && e.n > 0);

        // 1) Next uncompleted in same chapter
        const nextInChapter = sameCh
            .filter(e => !completedSet.has(e.href))
            .sort((a, b) => a.n - b.n)[0]
            || sameCh.sort((a, b) => a.n - b.n)[0];

        // 2) Related from other chapters by token overlap of title+tags
        const myTokens = new Set(
            [...tokenize(currentEntry.title), ...tokenize(currentEntry.tags)]
                .filter(t => !STOP.has(t))
        );
        const scored = otherCh.map(e => {
            const theirs = new Set(
                [...tokenize(e.title), ...tokenize(e.tags)].filter(t => !STOP.has(t))
            );
            let score = 0;
            theirs.forEach(t => { if (myTokens.has(t)) score++; });
            // small boost for uncompleted, so users discover new material
            if (!completedSet.has(e.href)) score += 0.25;
            return { e, score };
        })
        .filter(x => x.score >= 1)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map(x => x.e);

        const picks = [];
        if (nextInChapter) picks.push({ entry: nextInChapter, reason: 'Next in this chapter' });
        scored.forEach(e => picks.push({ entry: e, reason: 'Related topic' }));
        return picks;
    }

    function renderRecommender(picks) {
        if (!picks.length) return;
        const main = document.querySelector('main, .chapter-content');
        if (!main) return;
        if (document.querySelector('.next-up')) return;

        const section = document.createElement('section');
        section.className = 'next-up';
        section.setAttribute('aria-label', 'Recommended next lessons');
        section.innerHTML = `
            <h3 class="next-up__title"><i class="fa-solid fa-compass"></i> Next up</h3>
            <div class="next-up__grid">
                ${picks.map(p => {
                    const e = p.entry;
                    // Resolve href relative to current page (current is in /chapterX/)
                    const m = location.pathname.match(/\/chapter(\d+)\//);
                    const here = m ? parseInt(m[1], 10) : null;
                    const href = (here && e.ch === here)
                        ? e.href.replace(/^chapter\d+\//, '')
                        : '../' + e.href;
                    return `
                        <a class="next-up__card" href="${href}">
                            <span class="next-up__reason">${p.reason}</span>
                            <span class="next-up__lesson">${e.title}</span>
                            <span class="next-up__cta">Open <i class="fa-solid fa-arrow-right"></i></span>
                        </a>
                    `;
                }).join('')}
            </div>
        `;

        // Place after the prev/next nav if present, else at end of main
        const pageNav = main.querySelector('.page-nav');
        if (pageNav && pageNav.parentNode === main) {
            main.insertBefore(section, pageNav);
        } else {
            main.appendChild(section);
        }
    }

    function injectNextUp() {
        if (!isSubPage()) return;
        const tryRender = () => {
            const index = window.CE_SEARCH_INDEX;
            if (!Array.isArray(index)) return false;
            const m = location.pathname.match(/\/(chapter\d+\/sub\d+\.html?)$/i);
            if (!m) return true;
            const relHref = m[1].toLowerCase();
            const current = index.find(e => (e.href || '').toLowerCase() === relHref);
            if (!current) return true;
            const completedKeys = new Set(
                Object.keys(readJSON(LS_PROGRESS, {}))
                    .map(k => {
                        // progress keys are full paths like "chapter1/sub1.html"; normalise
                        const i = k.indexOf('chapter');
                        return i >= 0 ? k.slice(i) : k;
                    })
            );
            const picks = buildRecommendations(current, index, completedKeys);
            renderRecommender(picks);
            return true;
        };
        if (!tryRender()) {
            // Search index loads with defer; retry once it's available
            let tries = 0;
            const iv = setInterval(() => {
                tries++;
                if (tryRender() || tries > 20) clearInterval(iv);
            }, 200);
        }
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
        injectBookmarkButton();
        injectNextUp();
        collectFlashcardsIfReady();
    }

    /* Auto-collect flashcards from this page's quiz blocks. The flashcards
       engine loads via defer, so we retry briefly until it's available. */
    function collectFlashcardsIfReady() {
        let tries = 0;
        const iv = setInterval(() => {
            tries++;
            if (window.CE_Flashcards && typeof window.CE_Flashcards.collectFromCurrentPage === 'function') {
                try { window.CE_Flashcards.collectFromCurrentPage(); } catch {}
                clearInterval(iv);
            } else if (tries > 20) {
                clearInterval(iv);
            }
        }, 200);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();



/* =====================================================================
   INTERACTIVE CASE STUDY v2 — tabs + KPI counters
   ===================================================================== */
(function () {
    function initCaseV2(root) {
        // ── Tab switching ──
        root.querySelectorAll('.case-v2').forEach(function (cs) {
            var tabs = cs.querySelectorAll('.case-v2__tab');
            var panels = cs.querySelectorAll('.case-v2__panel');
            tabs.forEach(function (tab) {
                tab.setAttribute('role', 'tab');
                tab.addEventListener('click', function () {
                    var target = tab.getAttribute('data-tab');
                    tabs.forEach(function (t) {
                        var on = t === tab;
                        t.classList.toggle('is-active', on);
                        t.setAttribute('aria-selected', on ? 'true' : 'false');
                    });
                    panels.forEach(function (p) {
                        p.classList.toggle('is-active', p.getAttribute('data-panel') === target);
                    });
                });
                tab.setAttribute('aria-selected', tab.classList.contains('is-active') ? 'true' : 'false');
            });
            var tabList = cs.querySelector('.case-v2__tabs');
            if (tabList) {
                tabList.addEventListener('keydown', function (e) {
                    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                    var list = Array.prototype.slice.call(tabs);
                    var idx = list.indexOf(document.activeElement);
                    if (idx < 0) return;
                    e.preventDefault();
                    var next = e.key === 'ArrowRight' ? (idx + 1) % list.length : (idx - 1 + list.length) % list.length;
                    list[next].focus();
                    list[next].click();
                });
            }
        });

        // ── KPI counter animation ──
        var counters = root.querySelectorAll('.case-v2__kpi-val[data-count-to]');
        if (!counters.length) return;
        var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function fmt(v, decimals) {
            return v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        }
        function animateCount(el) {
            var target = parseFloat(el.getAttribute('data-count-to'));
            if (!isFinite(target)) return;
            var suffix = el.getAttribute('data-count-suffix') || '';
            var prefix = el.getAttribute('data-count-prefix') || '';
            var decimals = parseInt(el.getAttribute('data-count-decimals') || '0', 10);
            var unitHTML = el.dataset.unit ? '<span class="kpi-unit">' + el.dataset.unit + '</span>' : '';
            if (prefersReduced) {
                el.innerHTML = prefix + fmt(target, decimals) + suffix + unitHTML;
                return;
            }
            var duration = 1100;
            var start = performance.now();
            function tick(now) {
                var t = Math.min(1, (now - start) / duration);
                var eased = 1 - Math.pow(1 - t, 3);
                var val = target * eased;
                el.innerHTML = prefix + fmt(val, decimals) + suffix + unitHTML;
                if (t < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        }

        if (!('IntersectionObserver' in window)) {
            counters.forEach(animateCount);
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateCount(entry.target);
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.35 });
        counters.forEach(function (el) { io.observe(el); });
    }

    function boot() { initCaseV2(document); }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();


/* =====================================================================
   CASE STUDY v2 — INLINE WIDGETS: charts, sortable tables, sliders
   ===================================================================== */
(function () {
    'use strict';

    // ── Shared tooltip ──
    var tooltip;
    function getTip() {
        if (tooltip) return tooltip;
        tooltip = document.createElement('div');
        tooltip.className = 'cv2-chart-tooltip';
        document.body.appendChild(tooltip);
        return tooltip;
    }
    function showTip(x, y, html) {
        var t = getTip();
        t.innerHTML = html;
        t.style.left = x + 'px';
        t.style.top = y + 'px';
        t.classList.add('is-visible');
    }
    function hideTip() { if (tooltip) tooltip.classList.remove('is-visible'); }

    // ── SVG namespace helper ──
    var SVG = 'http://www.w3.org/2000/svg';
    function el(tag, attrs) {
        var n = document.createElementNS(SVG, tag);
        if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
        return n;
    }

    function renderBarChart(host, data) {
        // data = { labels:[], series:[{name,values,color}], ymax?, yLabel?, valueSuffix? }
        var w = 560, h = 280;
        var padL = 44, padR = 18, padT = 16, padB = 46;
        var iw = w - padL - padR, ih = h - padT - padB;
        var groups = data.labels.length;
        var sers = data.series.length;
        var maxVal = data.ymax || Math.max.apply(null, data.series.reduce(function (a, s) { return a.concat(s.values); }, [])) * 1.15;
        var groupW = iw / groups;
        var barW = Math.min(46, (groupW - 10) / sers);

        var svg = el('svg', {
            'class': 'cv2-chart',
            viewBox: '0 0 ' + w + ' ' + h,
            preserveAspectRatio: 'xMidYMid meet',
            role: 'img'
        });

        // Grid lines + Y labels (5 ticks)
        var grid = el('g', { 'class': 'cv2-chart__grid' });
        var axis = el('g', { 'class': 'cv2-chart__axis' });
        for (var t = 0; t <= 4; t++) {
            var y = padT + ih - (ih * t / 4);
            grid.appendChild(el('line', { x1: padL, x2: w - padR, y1: y, y2: y }));
            var val = (maxVal * t / 4);
            var lbl = el('text', { x: padL - 6, y: y + 4, 'class': 'cv2-chart__y-label' });
            lbl.textContent = (val >= 100 ? val.toFixed(0) : val.toFixed(val < 10 ? 1 : 0)) + (data.valueSuffix || '');
            axis.appendChild(lbl);
        }
        svg.appendChild(grid);
        svg.appendChild(axis);

        // Bars
        data.labels.forEach(function (label, gi) {
            var gx = padL + gi * groupW + (groupW - barW * sers) / 2;
            data.series.forEach(function (s, si) {
                var v = s.values[gi];
                var bh = (v / maxVal) * ih;
                var bx = gx + si * barW;
                var by = padT + ih - bh;
                var rect = el('rect', {
                    'class': 'cv2-chart__bar',
                    x: bx, y: padT + ih, width: barW - 4, height: 0,
                    rx: 3, fill: s.color || '#00d4aa'
                });
                rect.dataset.targetY = by;
                rect.dataset.targetH = bh;
                rect.addEventListener('mouseenter', function (e) {
                    var r = e.target.getBoundingClientRect();
                    showTip(r.left + r.width / 2, r.top, '<strong>' + label + '</strong><br>' + s.name + ': ' + v + (data.valueSuffix || ''));
                });
                rect.addEventListener('mouseleave', hideTip);
                svg.appendChild(rect);

                // Value label on top
                if (sers === 1) {
                    var vl = el('text', {
                        'class': 'cv2-chart__bar-label',
                        x: bx + (barW - 4) / 2,
                        y: by - 5,
                        opacity: 0
                    });
                    vl.textContent = v + (data.valueSuffix || '');
                    vl.dataset.role = 'value-label';
                    svg.appendChild(vl);
                }
            });

            // X label
            var xl = el('text', {
                'class': 'cv2-chart__x-label',
                x: padL + gi * groupW + groupW / 2,
                y: h - padB + 18
            });
            xl.textContent = label;
            svg.appendChild(xl);
        });

        host.appendChild(svg);

        // Legend (if multi-series)
        if (sers > 1) {
            var leg = document.createElement('div');
            leg.className = 'cv2-chart__legend';
            data.series.forEach(function (s) {
                var it = document.createElement('span');
                it.className = 'cv2-chart__legend-item';
                it.innerHTML = '<span class="cv2-chart__legend-swatch" style="background:' + (s.color || '#00d4aa') + '"></span>' + s.name;
                leg.appendChild(it);
            });
            host.appendChild(leg);
        }

        return svg;
    }

    function renderLineChart(host, data) {
        // data = { labels:[], series:[{name,values,color}], ymax?, valueSuffix?, xLabel? }
        var w = 560, h = 260;
        var padL = 44, padR = 18, padT = 16, padB = 44;
        var iw = w - padL - padR, ih = h - padT - padB;
        var maxVal = data.ymax || Math.max.apply(null, data.series.reduce(function (a, s) { return a.concat(s.values); }, [])) * 1.15;
        var minVal = data.ymin != null ? data.ymin : 0;
        var n = data.labels.length;
        var stepX = iw / Math.max(1, n - 1);

        var svg = el('svg', {
            'class': 'cv2-chart',
            viewBox: '0 0 ' + w + ' ' + h,
            preserveAspectRatio: 'xMidYMid meet'
        });

        var grid = el('g', { 'class': 'cv2-chart__grid' });
        var axis = el('g', { 'class': 'cv2-chart__axis' });
        for (var t = 0; t <= 4; t++) {
            var y = padT + ih - (ih * t / 4);
            grid.appendChild(el('line', { x1: padL, x2: w - padR, y1: y, y2: y }));
            var val = minVal + (maxVal - minVal) * t / 4;
            var lbl = el('text', { x: padL - 6, y: y + 4, 'class': 'cv2-chart__y-label' });
            lbl.textContent = (val >= 100 ? val.toFixed(0) : val.toFixed(val < 10 ? 2 : 1)) + (data.valueSuffix || '');
            axis.appendChild(lbl);
        }
        svg.appendChild(grid);
        svg.appendChild(axis);

        // X labels
        data.labels.forEach(function (label, i) {
            var xl = el('text', {
                'class': 'cv2-chart__x-label',
                x: padL + i * stepX,
                y: h - padB + 18
            });
            xl.textContent = label;
            svg.appendChild(xl);
        });

        function yFor(v) { return padT + ih - ((v - minVal) / (maxVal - minVal)) * ih; }

        data.series.forEach(function (s) {
            var d = '';
            s.values.forEach(function (v, i) {
                var px = padL + i * stepX;
                var py = yFor(v);
                d += (i === 0 ? 'M' : 'L') + px + ',' + py + ' ';
            });
            var pathLen;
            var path = el('path', { 'class': 'cv2-chart__line', d: d, stroke: s.color || '#00d4aa' });
            svg.appendChild(path);
            pathLen = path.getTotalLength();
            path.style.strokeDasharray = pathLen;
            path.style.strokeDashoffset = pathLen;
            path.dataset.pathLen = pathLen;

            s.values.forEach(function (v, i) {
                var px = padL + i * stepX;
                var py = yFor(v);
                var dot = el('circle', {
                    'class': 'cv2-chart__point',
                    cx: px, cy: py, r: 0,
                    fill: s.color || '#00d4aa'
                });
                dot.dataset.targetR = 4;
                dot.addEventListener('mouseenter', function (e) {
                    var r = e.target.getBoundingClientRect();
                    showTip(r.left + r.width / 2, r.top, '<strong>' + data.labels[i] + '</strong><br>' + s.name + ': ' + v + (data.valueSuffix || ''));
                });
                dot.addEventListener('mouseleave', hideTip);
                svg.appendChild(dot);
            });
        });

        host.appendChild(svg);

        if (data.series.length > 1) {
            var leg = document.createElement('div');
            leg.className = 'cv2-chart__legend';
            data.series.forEach(function (s) {
                var it = document.createElement('span');
                it.className = 'cv2-chart__legend-item';
                it.innerHTML = '<span class="cv2-chart__legend-swatch" style="background:' + (s.color || '#00d4aa') + '"></span>' + s.name;
                leg.appendChild(it);
            });
            host.appendChild(leg);
        }

        return svg;
    }

    function animateChart(svg) {
        // Bars
        svg.querySelectorAll('.cv2-chart__bar').forEach(function (b, i) {
            var ty = parseFloat(b.dataset.targetY), th = parseFloat(b.dataset.targetH);
            setTimeout(function () {
                b.style.transition = 'y 800ms cubic-bezier(.2,.7,.3,1), height 800ms cubic-bezier(.2,.7,.3,1)';
                b.setAttribute('y', ty);
                b.setAttribute('height', th);
            }, 60 * i);
        });
        // Value labels
        svg.querySelectorAll('[data-role="value-label"]').forEach(function (l, i) {
            setTimeout(function () { l.style.transition = 'opacity 400ms'; l.setAttribute('opacity', 1); }, 60 * i + 600);
        });
        // Lines
        svg.querySelectorAll('.cv2-chart__line').forEach(function (p) {
            var len = parseFloat(p.dataset.pathLen);
            setTimeout(function () {
                p.style.transition = 'stroke-dashoffset 1200ms cubic-bezier(.2,.7,.3,1)';
                p.style.strokeDashoffset = 0;
            }, 80);
        });
        // Points
        svg.querySelectorAll('.cv2-chart__point').forEach(function (c, i) {
            var tr = parseFloat(c.dataset.targetR);
            setTimeout(function () { c.setAttribute('r', tr); }, 800 + 60 * i);
        });
    }

    function initCharts(root) {
        var hosts = root.querySelectorAll('.cv2-chart-host');
        hosts.forEach(function (host) {
            if (host.dataset.cvBuilt) return;
            host.dataset.cvBuilt = '1';
            var raw = host.getAttribute('data-chart');
            if (!raw) return;
            var data;
            try { data = JSON.parse(raw); } catch (e) { return; }
            var svg = data.type === 'line'
                ? renderLineChart(host, data)
                : renderBarChart(host, data);

            var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (reduced) {
                svg.querySelectorAll('.cv2-chart__bar').forEach(function (b) {
                    b.setAttribute('y', b.dataset.targetY); b.setAttribute('height', b.dataset.targetH);
                });
                svg.querySelectorAll('[data-role="value-label"]').forEach(function (l) { l.setAttribute('opacity', 1); });
                svg.querySelectorAll('.cv2-chart__line').forEach(function (p) { p.style.strokeDashoffset = 0; });
                svg.querySelectorAll('.cv2-chart__point').forEach(function (c) { c.setAttribute('r', c.dataset.targetR); });
                return;
            }
            var seen = false;
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (en.isIntersecting && !seen) { seen = true; animateChart(svg); io.disconnect(); }
                });
            }, { threshold: 0.3 });
            io.observe(host);
        });
    }

    // ── Sortable tables ──
    function initTables(root) {
        root.querySelectorAll('.cv2-table[data-sortable]').forEach(function (table) {
            if (table.dataset.cvBuilt) return;
            table.dataset.cvBuilt = '1';
            var ths = table.querySelectorAll('thead th');
            ths.forEach(function (th, ci) {
                th.addEventListener('click', function () {
                    var dir = th.classList.contains('cv2-sort-asc') ? 'desc' : 'asc';
                    ths.forEach(function (o) { o.classList.remove('cv2-sort-asc', 'cv2-sort-desc'); });
                    th.classList.add('cv2-sort-' + dir);
                    var tbody = table.querySelector('tbody');
                    var rows = Array.prototype.slice.call(tbody.querySelectorAll('tr'));
                    var type = th.getAttribute('data-type') || 'string';
                    rows.sort(function (a, b) {
                        var av = a.children[ci].getAttribute('data-sort') || a.children[ci].textContent.trim();
                        var bv = b.children[ci].getAttribute('data-sort') || b.children[ci].textContent.trim();
                        if (type === 'number') { av = parseFloat(av) || 0; bv = parseFloat(bv) || 0; return dir === 'asc' ? av - bv : bv - av; }
                        return dir === 'asc' ? av.localeCompare(bv, undefined, { numeric: true }) : bv.localeCompare(av, undefined, { numeric: true });
                    });
                    rows.forEach(function (r) { tbody.appendChild(r); });
                });
            });
        });
    }

    // ── Threshold sliders ──
    function initSliders(root) {
        root.querySelectorAll('.cv2-slider').forEach(function (s) {
            if (s.dataset.cvBuilt) return;
            s.dataset.cvBuilt = '1';
            var input = s.querySelector('input[type=range]');
            var readout = s.querySelector('.cv2-slider__readout');
            var meta = s.querySelectorAll('.cv2-slider__meta div[data-curve]');
            function update() {
                var v = parseFloat(input.value);
                if (readout) {
                    var suf = s.getAttribute('data-suffix') || '';
                    readout.textContent = (Math.round(v * 100) / 100) + suf;
                }
                meta.forEach(function (m) {
                    // data-curve = "p0,v0;p1,v1;..." piecewise-linear
                    var pts = m.getAttribute('data-curve').split(';').map(function (p) { var x = p.split(','); return [parseFloat(x[0]), parseFloat(x[1])]; });
                    var out = pts[0][1];
                    for (var i = 1; i < pts.length; i++) {
                        if (v <= pts[i][0]) {
                            var t = (v - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]);
                            out = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t;
                            break;
                        }
                        out = pts[i][1];
                    }
                    var fmt = m.getAttribute('data-fmt') || '.2f';
                    var str;
                    if (fmt === '.0f') str = Math.round(out).toString();
                    else if (fmt === '.1f') str = out.toFixed(1);
                    else if (fmt === '.0%') str = Math.round(out * 100) + '%';
                    else str = out.toFixed(2);
                    var strong = m.querySelector('strong');
                    if (strong) strong.textContent = str + (m.getAttribute('data-suf') || '');
                });
            }
            input.addEventListener('input', update);
            update();
        });
    }

    // ── Heatmap (Grad-CAM-style) ──
    function initHeatmaps(root) {
        root.querySelectorAll('.cv2-heatmap[data-grid]').forEach(function (h) {
            if (h.dataset.cvBuilt) return;
            h.dataset.cvBuilt = '1';
            var rows = h.getAttribute('data-grid').split(';').map(function (r) {
                return r.split(',').map(function (v) { return parseFloat(v); });
            });
            var n = rows.length;
            h.style.gridTemplateColumns = 'repeat(' + n + ', 1fr)';
            h.style.gridTemplateRows = 'repeat(' + n + ', 1fr)';
            rows.forEach(function (row, ri) {
                row.forEach(function (v, ci) {
                    var c = document.createElement('div');
                    c.className = 'cv2-heatmap__cell';
                    // map v in [0..1] → cool→hot
                    var r, g, b;
                    if (v < 0.5) { r = Math.round(14 + (245 - 14) * (v * 2)); g = Math.round(165 - (165 - 158) * (v * 2)); b = Math.round(233 - (233 - 11) * (v * 2)); }
                    else { r = Math.round(245 + (239 - 245) * ((v - 0.5) * 2)); g = Math.round(158 + (68 - 158) * ((v - 0.5) * 2)); b = Math.round(11 + (68 - 11) * ((v - 0.5) * 2)); }
                    c.style.background = 'rgba(' + r + ',' + g + ',' + b + ',' + (0.20 + v * 0.75) + ')';
                    c.title = 'activation: ' + (Math.round(v * 100) / 100);
                    h.appendChild(c);
                });
            });
        });
    }

    function initAllWidgets(root) {
        root = root || document;
        initCharts(root);
        initTables(root);
        initSliders(root);
        initHeatmaps(root);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { initAllWidgets(document); });
    } else {
        initAllWidgets(document);
    }
    window.initCaseV2Widgets = initAllWidgets;
})();

/* =====================================================================
   GLOSSARY TOOLTIPS  (auto-tags first occurrence of each known term)
   ===================================================================== */
(function () {
    'use strict';
    if (window.__gloss_init) return;
    window.__gloss_init = true;

    var GLOSSARY = {
        // --- evaluation metrics -------------------------------------------------
        'RMSE': 'Root Mean Squared Error - square root of the mean squared difference between predictions and targets. Punishes large errors more than MAE.',
        'MSE': 'Mean Squared Error - average of squared prediction errors; the loss that linear regression minimises.',
        'MAE': 'Mean Absolute Error - average of absolute prediction errors; more robust to outliers than RMSE.',
        'R-squared': 'Coefficient of determination - fraction of variance in the target explained by the model. 1.0 = perfect, 0.0 = predicting the mean.',
        'precision': 'Of items the model flagged as positive, the fraction that really are. High precision = few false alarms.',
        'recall': 'Of all true positives, the fraction the model caught. High recall = few misses. Also called sensitivity.',
        'F1 score': 'Harmonic mean of precision and recall - a single number for imbalanced classification.',
        'accuracy': 'Fraction of predictions that are correct. Misleading on imbalanced data where a constant prediction can score high.',
        'specificity': 'Of all true negatives, the fraction the model correctly rejected. The mirror image of recall.',
        'ROC curve': 'Plot of true-positive rate vs false-positive rate as the decision threshold sweeps. AUC summarises it.',
        'AUC': 'Area Under the ROC Curve - threshold-free ranking quality measure. 1.0 = perfect, 0.5 = random.',
        'confusion matrix': '2x2 (or NxN) table counting true/false positives and negatives. The atomic unit of every classification metric.',
        'IoU': 'Intersection over Union - overlap area divided by union area between predicted and true bounding boxes or masks.',
        'mAP': 'Mean Average Precision - the standard object-detection metric; averages precision-recall area across classes and IoU thresholds.',

        // --- core ML concepts ---------------------------------------------------
        'overfitting': 'The model memorises training data and fails to generalise. Diagnosed by a large train-vs-validation gap.',
        'underfitting': 'The model is too simple to capture the pattern; both train and validation errors stay high.',
        'bias-variance tradeoff': 'Simple models have high bias (systematic error); complex models have high variance (overfit to noise). Good models balance both.',
        'regularization': 'Any technique that constrains a model to reduce overfitting - L1, L2, dropout, early stopping, data augmentation.',
        'L1 regularization': 'Penalty proportional to the sum of |weights|. Drives weights to exactly zero, giving sparse models.',
        'L2 regularization': 'Penalty proportional to the sum of squared weights. Shrinks weights smoothly; the default in most networks.',
        'dropout': 'During training, randomly zero a fraction of neurons each step. A cheap, powerful regulariser introduced by Srivastava et al. (2014).',
        'cross-validation': 'Split data into K folds; train on K-1, validate on the remaining fold; rotate. Robust generalisation estimate on small datasets.',
        'hyperparameter': 'A model setting fixed before training (learning rate, layers, regularisation strength) - tuned by search, not learned by gradient descent.',
        'transfer learning': 'Start from weights pretrained on a large dataset, then fine-tune on your smaller target task.',
        'data augmentation': 'Generate synthetic training samples by perturbing real ones (crop, rotate, jitter). Boosts effective dataset size cheaply.',
        'feature engineering': 'Hand-crafting input variables (ratios, interactions, domain physics) before feeding them to the model.',
        'normalization': 'Rescaling features so each has comparable magnitude - usually min-max to [0,1].',
        'standardization': 'Rescaling features to zero mean and unit variance (z-score). The default preprocessing for most MLPs.',
        'one-hot encoding': 'Convert a categorical variable to a binary vector with one position per category.',

        // --- training plumbing --------------------------------------------------
        'gradient descent': 'Iteratively move model weights opposite to the loss gradient. The foundation of almost all modern ML training.',
        'SGD': 'Stochastic Gradient Descent - compute gradients on small mini-batches instead of the full dataset. Faster and adds beneficial noise.',
        'Adam': 'Adaptive Moment Estimation (Kingma & Ba, 2014) - SGD with per-parameter adaptive learning rates. The default optimiser today.',
        'AdamW': 'Adam with decoupled weight decay (Loshchilov & Hutter, 2017). Fixes a subtle L2 bug in plain Adam; current best practice.',
        'RMSProp': 'Adaptive optimiser that divides the gradient by a running RMS of recent gradients. Predecessor of Adam.',
        'momentum': 'Optimiser tweak that adds a velocity term so updates smooth across noisy gradients - like a ball rolling downhill.',
        'learning rate': 'Step size of each gradient-descent update. Too small = slow; too large = divergence. The single most important hyperparameter.',
        'epoch': 'One complete pass of the training algorithm over the entire training dataset.',
        'batch size': 'Number of samples processed before each weight update. Trades memory vs gradient noise.',
        'mini-batch': 'A small subset of the training data used to compute one stochastic-gradient step (typically 16-512 samples).',
        'backpropagation': 'The chain rule applied to a neural network to compute gradients of the loss w.r.t. every weight in one reverse pass.',
        'forward propagation': 'Running inputs through the network layer-by-layer to produce a prediction.',
        'early stopping': 'Stop training when validation loss stops improving. The simplest, cheapest regulariser.',

        // --- loss functions -----------------------------------------------------
        'loss function': 'Scalar measure of how wrong the model is; the quantity gradient descent minimises.',
        'cross-entropy': 'Standard classification loss; measures the distance between predicted and true class probabilities.',
        'binary cross-entropy': 'Cross-entropy specialised for two-class problems; pairs with a sigmoid output.',
        'focal loss': 'Cross-entropy variant (Lin et al., 2017) that down-weights easy examples; essential for imbalanced classification.',
        'Huber loss': 'Quadratic for small errors, linear for large ones - robust to outliers, used in robust regression.',

        // --- architectures ------------------------------------------------------
        'perceptron': 'The original single-neuron classifier (Rosenblatt, 1958). Cannot solve non-linearly-separable problems.',
        'MLP': 'Multi-Layer Perceptron - the basic feed-forward neural network with one or more hidden layers and non-linear activations.',
        'neural network': 'A model composed of layers of weighted-sum-plus-non-linearity units, trained by gradient descent.',
        'deep learning': 'Machine learning with neural networks of many layers, trained end-to-end on large datasets.',
        'hidden layer': 'Any neural-network layer between the input and output; where representations are learned.',
        'activation function': 'Element-wise non-linearity applied after a layer\u2019s linear transform - ReLU, sigmoid, tanh, etc.',
        'ReLU': 'Rectified Linear Unit: max(0, x). Cheap, sparse gradients, the default activation in most modern networks.',
        'sigmoid': 'Squashes any real number to (0,1). Used for binary-classification outputs; rarely as a hidden activation today.',
        'tanh': 'Hyperbolic tangent: squashes to (-1,1). Zero-centred but saturates - mostly replaced by ReLU.',
        'softmax': 'Squashes a vector of scores into a probability distribution that sums to one. The canonical multi-class output.',
        'SiLU': 'Sigmoid-weighted Linear Unit (also called Swish): x * sigmoid(x). Smooth, non-monotonic; default in modern transformers.',
        'GELU': 'Gaussian Error Linear Unit - smooth approximation to ReLU using the Gaussian CDF. Used in BERT, GPT.',
        'CNN': 'Convolutional Neural Network - shares weights across spatial locations with learnable filters; the workhorse of computer vision.',
        'convolution': 'Sliding a small learned filter over an input and computing a weighted sum at each position.',
        'pooling': 'Aggregate a small spatial neighbourhood into a single value (typically max or average). Shrinks feature maps and adds invariance.',
        'stride': 'How many pixels a convolution filter slides at each step. Stride > 1 downsamples the output.',
        'padding': 'Extra pixels added around an input so a convolution can keep the same spatial size.',
        'RNN': 'Recurrent Neural Network - processes sequences one step at a time, sharing weights across timesteps.',
        'LSTM': 'Long Short-Term Memory - an RNN cell with gating that learns long-range dependencies without vanishing gradients.',
        'GRU': 'Gated Recurrent Unit - simpler than LSTM, similar performance.',
        'transformer': 'Sequence model built entirely on attention (Vaswani et al., 2017). Foundation of every modern LLM.',
        'attention': 'Mechanism that lets a model focus on relevant parts of the input by computing a weighted sum over all positions.',
        'self-attention': 'Attention where queries, keys and values all come from the same sequence - lets each position attend to every other.',
        'embedding': 'A learned dense vector representation of a discrete item (a word, a token, an asset ID).',
        'tokenization': 'Splitting raw text into the discrete units (tokens) a language model actually consumes.',
        'positional encoding': 'Information added to token embeddings so a transformer knows the order of the sequence.',
        'BERT': 'Bidirectional Encoder Representations from Transformers (Google, 2018) - an encoder-only transformer pretrained on masked-language modelling.',
        'GPT': 'Generative Pre-trained Transformer - a decoder-only transformer pretrained for next-token prediction.',
        'LLM': 'Large Language Model - a transformer with billions of parameters trained on internet-scale text.',
        'RAG': 'Retrieval-Augmented Generation - inject relevant document chunks into the LLM context window so answers are grounded and citable.',
        'fine-tuning': 'Continue training a pretrained model on a smaller task-specific dataset.',
        'prompt engineering': 'Crafting the input prompt to steer an LLM\u2019s behaviour without retraining.',
        'hallucination': 'When an LLM confidently fabricates incorrect facts or citations.',
        'PINN': 'Physics-Informed Neural Network - a network whose loss includes the residual of a governing PDE, so it learns physics, not just data.',
        'U-Net': 'Encoder-decoder CNN with skip connections (Ronneberger et al., 2015). Standard architecture for semantic segmentation.',
        'ResNet': 'Residual Network (He et al., 2015) - introduced skip connections that let networks go hundreds of layers deep without vanishing gradients.',
        'YOLO': 'You Only Look Once - real-time object detector that predicts bounding boxes and classes in a single forward pass.',
        'Grad-CAM': 'Gradient-weighted Class Activation Mapping (Selvaraju et al., 2017) - heatmap showing which pixels drove a CNN\u2019s prediction.',
        'autoencoder': 'Network trained to reconstruct its input through a low-dimensional bottleneck. Used for compression, denoising, anomaly detection.',
        'GAN': 'Generative Adversarial Network - a generator and a discriminator trained in opposition to produce realistic synthetic samples.',
        'diffusion model': 'Generative model that learns to reverse a step-by-step noising process. Powers Stable Diffusion, DALL\u00b7E 3 and many CE design-generation tools.',

        // --- learning paradigms -------------------------------------------------
        'supervised learning': 'Learning from labelled examples - inputs paired with correct outputs.',
        'unsupervised learning': 'Learning structure from unlabelled data - clustering, dimensionality reduction, density estimation.',
        'reinforcement learning': 'An agent learns a policy by acting in an environment and receiving rewards.',
        'self-supervised learning': 'Construct pseudo-labels from the data itself (next-word prediction, masked patches) so no human labelling is needed.',
        'classification': 'Predict a discrete class label.',
        'regression': 'Predict a continuous numeric value.',
        'clustering': 'Group similar samples without labels.',
        'anomaly detection': 'Flag samples that deviate from the bulk of the data distribution.',

        // --- classical algorithms ----------------------------------------------
        'k-means': 'Classical clustering algorithm that alternates between assigning points to nearest centroid and recomputing centroids.',
        'DBSCAN': 'Density-Based Spatial Clustering of Applications with Noise - finds arbitrarily-shaped clusters and labels low-density points as outliers.',
        'hierarchical clustering': 'Builds a tree (dendrogram) of clusters by successively merging or splitting groups.',
        'PCA': 'Principal Component Analysis - linear dimensionality reduction that projects data onto axes of maximum variance.',
        't-SNE': 't-distributed Stochastic Neighbor Embedding - non-linear dimensionality reduction for visualising clusters in 2-D or 3-D.',
        'UMAP': 'Uniform Manifold Approximation and Projection - faster, more globally faithful alternative to t-SNE.',
        'SVM': 'Support Vector Machine - finds the maximum-margin hyperplane separating classes; kernels lift it to non-linear boundaries.',
        'random forest': 'Ensemble of decorrelated decision trees trained on bootstrap samples; majority vote (classification) or average (regression).',
        'gradient boosting': 'Sequentially add trees, each fitting the residual errors of the current ensemble. Family includes XGBoost, LightGBM, CatBoost.',
        'XGBoost': 'Optimised, regularised gradient-boosted-tree library. Dominant on tabular ML competitions and many CE problems.',
        'KNN': 'k-Nearest Neighbors - classify or regress by averaging the labels of the k closest training points.',
        'decision tree': 'Recursive yes/no splits on features, ending in leaf predictions. Building block of forests and boosting.',
        'logistic regression': 'Linear model that outputs a probability via a sigmoid; the simplest classification baseline.',
        'linear regression': 'Fit a line (or hyperplane) by minimising squared error. The simplest regression baseline.',

        // --- infrastructure -----------------------------------------------------
        'GPU': 'Graphics Processing Unit - massively-parallel hardware that executes the matrix multiplies at the heart of deep learning.',
        'TPU': 'Tensor Processing Unit - Google\u2019s custom ASIC for ML training and inference.',
        'CUDA': 'NVIDIA\u2019s parallel-computing platform; the lingua franca of GPU-accelerated deep learning.',
        'PyTorch': 'Meta\u2019s open-source deep-learning framework; now the dominant choice in research and most engineering teams.',
        'TensorFlow': 'Google\u2019s open-source deep-learning framework; still common in production at large companies.',
        'tensor': 'A multi-dimensional array - the data structure deep-learning frameworks operate on.',
        'digital twin': 'A live, data-connected virtual replica of a physical asset, used for monitoring, simulation and control.'
    };

    var SKIP_TAGS = { A:1, CODE:1, PRE:1, SCRIPT:1, STYLE:1, BUTTON:1, TEXTAREA:1, INPUT:1, LABEL:1, KBD:1, H1:1, H2:1, H3:1, H4:1, H5:1, H6:1, OPTION:1, SELECT:1, NOSCRIPT:1, SVG:1, CANVAS:1 };
    var SKIP_CLASS_SUBSTRINGS = ['gloss', 'katex', 'mathjax', 'quiz-block__feedback', 'cv2-chart', 'cv2-table', 'cv2-pill', 'cv2-tl-year', 'breadcrumb', 'case-v2__tab', 'case-v2__kpi-lbl', 'case-v2__kpi-val', 'badge', 'tag', 'pill', 'progress-display'];

    function isInSkipped(node) {
        var p = node.parentNode;
        while (p && p.nodeType === 1) {
            if (SKIP_TAGS[p.tagName]) return true;
            var cls = p.className;
            if (cls && typeof cls === 'string') {
                for (var i = 0; i < SKIP_CLASS_SUBSTRINGS.length; i++) {
                    if (cls.indexOf(SKIP_CLASS_SUBSTRINGS[i]) !== -1) return true;
                }
            }
            p = p.parentNode;
        }
        return false;
    }

    function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    function buildRegex(terms, caseSensitive) {
        var sorted = terms.slice().sort(function (a, b) { return b.length - a.length; });
        var alts = sorted.map(escapeRegex).join('|');
        var flags = caseSensitive ? 'g' : 'gi';
        return new RegExp('(?:^|[^A-Za-z0-9_-])(' + alts + ')(?=$|[^A-Za-z0-9_-])', flags);
    }

    function tagRoot(root) {
        var terms = Object.keys(GLOSSARY);
        // Case-sensitive set: any term containing an uppercase letter (acronyms, proper nouns)
        // Case-insensitive set: pure-lowercase common words
        var csTerms = [], ciTerms = [];
        var ciKey = {};
        terms.forEach(function (t) {
            if (/[A-Z]/.test(t)) csTerms.push(t);
            else { ciTerms.push(t); ciKey[t.toLowerCase()] = t; }
        });
        var csMap = {};
        csTerms.forEach(function (t) { csMap[t] = t; });
        var reCs = csTerms.length ? buildRegex(csTerms, true) : null;
        var reCi = ciTerms.length ? buildRegex(ciTerms, false) : null;
        var placed = Object.create(null);

        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: function (n) {
                if (!n.nodeValue || n.nodeValue.length < 3) return NodeFilter.FILTER_REJECT;
                if (isInSkipped(n)) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        var nodes = [];
        var node;
        while ((node = walker.nextNode())) nodes.push(node);

        for (var ni = 0; ni < nodes.length; ni++) {
            var tn = nodes[ni];
            var text = tn.nodeValue;
            var matches = [];
            function scan(re, resolveKey) {
                if (!re) return;
                re.lastIndex = 0;
                var m;
                while ((m = re.exec(text))) {
                    var raw = m[1];
                    var key = resolveKey(raw);
                    if (!key || placed[key]) continue;
                    var start = m.index + (m[0].length - raw.length);
                    var end = start + raw.length;
                    // skip if overlaps already-claimed range
                    var overlap = false;
                    for (var k = 0; k < matches.length; k++) {
                        if (start < matches[k].end && end > matches[k].start) { overlap = true; break; }
                    }
                    if (overlap) continue;
                    placed[key] = true;
                    matches.push({ start: start, end: end, raw: raw, key: key });
                }
            }
            scan(reCs, function (raw) { return csMap[raw]; });
            scan(reCi, function (raw) { return ciKey[raw.toLowerCase()]; });
            if (!matches.length) continue;
            matches.sort(function (a, b) { return a.start - b.start; });
            var frag = document.createDocumentFragment();
            var cursor = 0;
            for (var mi = 0; mi < matches.length; mi++) {
                var mm = matches[mi];
                if (mm.start > cursor) frag.appendChild(document.createTextNode(text.slice(cursor, mm.start)));
                var span = document.createElement('span');
                span.className = 'gloss';
                span.tabIndex = 0;
                span.setAttribute('role', 'button');
                span.setAttribute('aria-label', mm.raw + ': ' + GLOSSARY[mm.key]);
                span.appendChild(document.createTextNode(mm.raw));
                var tip = document.createElement('span');
                tip.className = 'gloss__tip';
                tip.setAttribute('role', 'tooltip');
                tip.textContent = GLOSSARY[mm.key];
                span.appendChild(tip);
                frag.appendChild(span);
                cursor = mm.end;
            }
            if (cursor < text.length) frag.appendChild(document.createTextNode(text.slice(cursor)));
            tn.parentNode.replaceChild(frag, tn);
        }
    }

    function init() {
        var root = document.querySelector('main.chapter-content') || document.querySelector('main') || document.body;
        if (!root) return;
        try { tagRoot(root); } catch (e) { /* fail-safe */ }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    window.GLOSSARY = GLOSSARY;
})();

/* ============================================================================
   "Try it on your project" checklists + "References & Codes" sidebar
   Injected into the bottom of every sub-page, just before the .next-up block
   (or, failing that, at the end of <main>). Chapter-keyed content, no
   per-file HTML edits required.
   ============================================================================ */
(function () {
    'use strict';
    if (window.__tryref_init) return;
    window.__tryref_init = true;

    /* ---- Page identification ---- */
    function chapterFromPath() {
        var m = (location.pathname || '').match(/\/chapter(\d+)\//i);
        return m ? parseInt(m[1], 10) : 0;
    }
    function subFromPath() {
        var m = (location.pathname || '').match(/\/sub(\d+)\.html?$/i);
        return m ? parseInt(m[1], 10) : 0;
    }
    function isSubPageLocal() {
        return /\/chapter\d+\/sub\d+\.html?$/i.test(location.pathname);
    }

    /* ---- Try-it: chapter-level checklists (extended optionally by sub) ---- */
    var TRY_IT = {
        1: {
            tag: 'AI literacy',
            items: [
                'Pick one current project and list 3 decisions that are still made on gut feel &mdash; those are your candidate AI tasks.',
                'Inventory the data you already collect (drone scans, inspection PDFs, sensor logs, schedule snapshots). Note the format and rough volume of each.',
                'For one of those data sources, sketch what a "labelled" version would look like (e.g.&nbsp;crack&nbsp;/&nbsp;no-crack on photos, RFI&nbsp;category on emails).',
                'Identify the simplest non-ML baseline you would have to beat (rule of thumb, last-year average, spec table). Write down its current accuracy or error.'
            ]
        },
        2: {
            tag: 'Supervised regression / classification',
            items: [
                'Choose a continuous quantity on your project (concrete strength, settlement, energy use). Frame it as a regression problem and write the feature list.',
                'Or pick a binary outcome (defect / no-defect, safe / unsafe). Frame it as classification &mdash; what is the cost of a false negative vs a false positive?',
                'Decide on the right evaluation metric <em>before</em> training: RMSE / MAE for regression, F1 or recall@high-precision for safety-critical classification.',
                'Set a hold-out split that respects your structure (by project, by time, by site) so you don\u2019t leak the future into the past.',
                'Try a 5-line scikit-learn baseline (LinearRegression / RandomForest) on <a href="../data/concrete/concrete_strength.csv" download>concrete_strength.csv</a> as a warm-up.'
            ]
        },
        3: {
            tag: 'Unsupervised / pattern mining',
            items: [
                'Pick a dataset you have <em>without</em> labels &mdash; sensor traces, GIS parcels, work-order text. State the question you want clusters to answer.',
                'Standardise your features (zero-mean, unit-variance) before any distance-based algorithm &mdash; otherwise units dominate.',
                'Try k-means with k = 2&hellip;8 and plot the silhouette score; then try DBSCAN to see if the data really has density-based clusters.',
                'Project to 2D with PCA <em>and</em> UMAP and overlay your domain labels (if any) &mdash; if they fall in the same blob, your features are too weak.',
                'Run anomaly detection on your sensor data; cross-check the top 10 anomalies against your incident log.'
            ]
        },
        4: {
            tag: 'Computer vision / CNNs',
            items: [
                'Take 50&ndash;100 phone photos of one defect on your site (cracks, spalling, corrosion). Label them in 30&nbsp;min with Label Studio or CVAT.',
                'Start with a pre-trained backbone (ResNet-18 or EfficientNet-B0) and fine-tune the last 1&ndash;2 layers &mdash; do <em>not</em> train from scratch on &lt; 1k images.',
                'Use heavy augmentation (rotate, flip, crop, brightness) &mdash; field photos vary far more than ImageNet.',
                'Run Grad-CAM on a few correctly &amp; incorrectly classified images to make sure the model is looking at the crack, not the watermark.',
                'Measure precision@high-recall on a hold-out site you didn\u2019t train on &mdash; that\u2019s your real deployment number.'
            ]
        },
        5: {
            tag: 'NLP / LLMs',
            items: [
                'Pick a stack of contracts, RFIs or inspection reports from one project. Run a free embedding model on them and cluster &mdash; you\u2019ll instantly see the topics.',
                'Try a small open-source LLM (Llama-3-8B, Phi-3) <em>locally</em> first before paying for an API &mdash; most CE tasks fit in a 4-bit quantised model.',
                'For any LLM you ship, set up a RAG layer over <em>your</em> codebook (IS / BS / ACI / project specs) so the answers cite a clause, not a hallucination.',
                'Write a 20-question evaluation set with known answers from your specs. Re-run it on every model / prompt change.',
                'Log every prompt + response. You\u2019ll need this for audit and for fine-tuning when you have enough examples.'
            ]
        },
        6: {
            tag: 'Deep learning fundamentals',
            items: [
                'Implement a 2-layer MLP in PyTorch (~40 lines) on <a href="../data/concrete/concrete_strength.csv" download>concrete_strength.csv</a>. Beat your linear-regression baseline.',
                'Try three optimisers (SGD, Adam, AdamW) at the same learning rate; plot the loss curves on the same chart.',
                'Sweep learning rate on a log scale (1e-4 &rarr; 1e-1, &times;3). Note where loss diverges &mdash; that\u2019s your "edge of chaos".',
                'Add dropout (p=0.2) and weight decay (1e-4). Compare train vs validation curves &mdash; the gap should shrink.',
                'Use early stopping with patience = 10 epochs. Don\u2019t hand-pick the "best" epoch from the curve &mdash; that\u2019s a leak.'
            ]
        }
    };

    /* ---- References & codes: chapter-keyed standards + landmark papers ---- */
    function R(label, url, kind) { return { label: label, url: url, kind: kind || 'paper' }; }
    var REFERENCES = {
        1: {
            title: 'Foundations &amp; industry reports',
            codes: [
                R('ISO 19650:2018 &mdash; BIM information management', 'https://www.iso.org/standard/68078.html', 'code'),
                R('FIDIC AI Discussion Paper (2023)', 'https://fidic.org/sites/default/files/FIDIC%20AI%20Discussion%20Paper%202023.pdf', 'code'),
                R('NIST AI Risk Management Framework 1.0', 'https://www.nist.gov/itl/ai-risk-management-framework', 'code')
            ],
            papers: [
                R('McKinsey: Imagining construction\u2019s digital future (2016)', 'https://www.mckinsey.com/capabilities/operations/our-insights/imagining-constructions-digital-future'),
                R('Russell &amp; Norvig &mdash; AI: A Modern Approach (4th ed.)', 'https://aima.cs.berkeley.edu/'),
                R('Silver et&nbsp;al. &mdash; Mastering Go without human knowledge (AlphaGo Zero)', 'https://doi.org/10.1038/nature24270')
            ]
        },
        2: {
            title: 'Regression, classification &amp; structural codes',
            codes: [
                R('ACI 318-19 &mdash; Building code requirements for structural concrete', 'https://www.concrete.org/store/productdetail.aspx?ItemID=318U19'),
                R('IS 456:2000 &mdash; Plain &amp; reinforced concrete (India)', 'https://law.resource.org/pub/in/bis/S03/is.456.2000.pdf', 'code'),
                R('BS EN 1992-1-1:2004 &mdash; Eurocode&nbsp;2: design of concrete structures', 'https://www.phd.eng.br/wp-content/uploads/2015/02/en.1992.1.1.2004.pdf', 'code'),
                R('ASCE 7-22 &mdash; Minimum design loads', 'https://ascelibrary.org/doi/book/10.1061/9780784415788')
            ],
            papers: [
                R('Yeh &mdash; Modeling of strength of HPC using ANNs (1998)', 'https://doi.org/10.1016/S0008-8846(98)00165-3'),
                R('Boulanger &amp; Idriss &mdash; CPT-based liquefaction triggering (2014)', 'https://doi.org/10.1061/(ASCE)GT.1943-5606.0001388'),
                R('Hastie, Tibshirani &amp; Friedman &mdash; The Elements of Statistical Learning', 'https://hastie.su.domains/ElemStatLearn/')
            ]
        },
        3: {
            title: 'Unsupervised methods &amp; pattern discovery',
            codes: [
                R('USGS NLCD 2021 classification scheme', 'https://www.usgs.gov/centers/eros/science/national-land-cover-database'),
                R('USDA NRCS Soil Taxonomy (12th ed.)', 'https://www.nrcs.usda.gov/resources/guides-and-instructions/soil-taxonomy', 'code')
            ],
            papers: [
                R('Ester et&nbsp;al. &mdash; DBSCAN (KDD 1996)', 'https://www.dbs.ifi.lmu.de/Publikationen/Papers/KDD-96.final.frame.pdf'),
                R('McInnes et&nbsp;al. &mdash; UMAP (2018)', 'https://arxiv.org/abs/1802.03426'),
                R('van der Maaten &amp; Hinton &mdash; t-SNE (JMLR 2008)', 'https://www.jmlr.org/papers/v9/vandermaaten08a.html'),
                R('Liu et&nbsp;al. &mdash; Isolation Forest (ICDM 2008)', 'https://doi.org/10.1109/ICDM.2008.17')
            ]
        },
        4: {
            title: 'Convolutional networks &amp; vision',
            codes: [
                R('ASTM C42/C42M &mdash; Concrete cores: test method', 'https://www.astm.org/c0042_c0042m-20.html', 'code'),
                R('AASHTO Bridge Inspector\u2019s Reference Manual', 'https://www.fhwa.dot.gov/bridge/nbis/pubs/nhi12049.pdf', 'code')
            ],
            papers: [
                R('Cha et&nbsp;al. &mdash; Deep learning-based crack detection (2017)', 'https://doi.org/10.1111/mice.12263'),
                R('He et&nbsp;al. &mdash; Deep Residual Learning (ResNet, 2015)', 'https://arxiv.org/abs/1512.03385'),
                R('Ronneberger et&nbsp;al. &mdash; U-Net (2015)', 'https://arxiv.org/abs/1505.04597'),
                R('Redmon et&nbsp;al. &mdash; YOLO v3 (2018)', 'https://arxiv.org/abs/1804.02767'),
                R('Selvaraju et&nbsp;al. &mdash; Grad-CAM (2017)', 'https://arxiv.org/abs/1610.02391')
            ]
        },
        5: {
            title: 'Sequence models, transformers &amp; LLMs',
            codes: [
                R('Singapore BCA CORENET&nbsp;X submission guide', 'https://www.corenet-x.gov.sg/'),
                R('ISO/IEC 23053:2022 &mdash; AI framework for ML systems', 'https://www.iso.org/standard/74438.html', 'code')
            ],
            papers: [
                R('Vaswani et&nbsp;al. &mdash; Attention is All You Need (2017)', 'https://arxiv.org/abs/1706.03762'),
                R('Devlin et&nbsp;al. &mdash; BERT (2019)', 'https://arxiv.org/abs/1810.04805'),
                R('Lewis et&nbsp;al. &mdash; Retrieval-Augmented Generation (2020)', 'https://arxiv.org/abs/2005.11401'),
                R('Hochreiter &amp; Schmidhuber &mdash; LSTM (1997)', 'https://doi.org/10.1162/neco.1997.9.8.1735'),
                R('Lim et&nbsp;al. &mdash; Temporal Fusion Transformer (2021)', 'https://arxiv.org/abs/1912.09363')
            ]
        },
        6: {
            title: 'Deep-learning fundamentals',
            codes: [
                R('IEEE 754 &mdash; floating-point arithmetic (fp16/bf16/fp32)', 'https://standards.ieee.org/ieee/754/6210/'),
                R('NVIDIA Deep Learning Performance Guide', 'https://docs.nvidia.com/deeplearning/performance/index.html', 'code')
            ],
            papers: [
                R('Rumelhart, Hinton &amp; Williams &mdash; Backprop (Nature 1986)', 'https://doi.org/10.1038/323533a0'),
                R('Kingma &amp; Ba &mdash; Adam optimiser (2014)', 'https://arxiv.org/abs/1412.6980'),
                R('Loshchilov &amp; Hutter &mdash; AdamW (2019)', 'https://arxiv.org/abs/1711.05101'),
                R('Srivastava et&nbsp;al. &mdash; Dropout (JMLR 2014)', 'https://jmlr.org/papers/v15/srivastava14a.html'),
                R('Raissi et&nbsp;al. &mdash; Physics-Informed Neural Networks (2019)', 'https://doi.org/10.1016/j.jcp.2018.10.045'),
                R('Lam et&nbsp;al. &mdash; GraphCast (Science 2023)', 'https://doi.org/10.1126/science.adi2336')
            ]
        }
    };

    /* ---- DOM helpers ---- */
    function findMain() {
        return document.querySelector('main.chapter-content')
            || document.querySelector('main')
            || document.body;
    }
    function findAnchor(main) {
        // Prefer to place above the .next-up block; otherwise above .page-nav; otherwise end of main.
        return main.querySelector('.next-up')
            || main.querySelector('.page-nav')
            || null;
    }
    function placeBefore(node, main) {
        var anchor = findAnchor(main);
        if (anchor && anchor.parentNode === main) main.insertBefore(node, anchor);
        else main.appendChild(node);
    }

    /* ---- Try-it card ---- */
    function injectTryIt() {
        if (!isSubPageLocal()) return;
        if (document.querySelector('.try-it')) return;
        var ch = chapterFromPath();
        var data = TRY_IT[ch];
        if (!data) return;
        var main = findMain();
        if (!main) return;
        var section = document.createElement('section');
        section.className = 'try-it';
        section.setAttribute('aria-labelledby', 'try-it-title');
        var itemsHtml = data.items.map(function (txt) {
            return '<li class="try-it__item"><label><input type="checkbox" class="try-it__cb"><span>' + txt + '</span></label></li>';
        }).join('');
        section.innerHTML = ''
            + '<div class="try-it__head">'
            +   '<div class="try-it__icon"><i class="fa-solid fa-clipboard-check"></i></div>'
            +   '<div>'
            +     '<h2 id="try-it-title" class="try-it__title">Try it on your project</h2>'
            +     '<p class="try-it__sub">A short checklist to apply this chapter &mdash; '
            +       '<span class="try-it__tag">' + data.tag + '</span></p>'
            +   '</div>'
            + '</div>'
            + '<ol class="try-it__list">' + itemsHtml + '</ol>'
            + '<p class="try-it__hint"><i class="fa-solid fa-circle-info"></i> '
            + 'Your ticks are saved in this browser only &mdash; they survive refresh but never leave your machine.</p>';
        placeBefore(section, main);

        // Persist ticks per chapter (not per sub, so the checklist accumulates).
        var key = 'ce_tryit_ch' + ch;
        var saved = {};
        try { saved = JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (e) {}
        var cbs = section.querySelectorAll('.try-it__cb');
        for (var i = 0; i < cbs.length; i++) {
            if (saved[i]) { cbs[i].checked = true; cbs[i].parentNode.parentNode.classList.add('try-it__item--done'); }
            (function (cb, idx) {
                cb.addEventListener('change', function () {
                    saved[idx] = cb.checked ? 1 : 0;
                    try { localStorage.setItem(key, JSON.stringify(saved)); } catch (e) {}
                    cb.parentNode.parentNode.classList.toggle('try-it__item--done', cb.checked);
                });
            })(cbs[i], i);
        }
    }

    /* ---- References sidebar ---- */
    function injectReferences() {
        if (!isSubPageLocal()) return;
        if (document.querySelector('.refbox')) return;
        var ch = chapterFromPath();
        var data = REFERENCES[ch];
        if (!data) return;
        var main = findMain();
        if (!main) return;

        function renderGroup(label, icon, items) {
            if (!items || !items.length) return '';
            var rows = items.map(function (r) {
                return '<li class="refbox__row"><a href="' + r.url + '" target="_blank" rel="noopener noreferrer">'
                    +    '<span class="refbox__label">' + r.label + '</span>'
                    +    '<i class="fa-solid fa-arrow-up-right-from-square refbox__ext"></i>'
                    +  '</a></li>';
            }).join('');
            return '<div class="refbox__group">'
                +    '<h3 class="refbox__group-title"><i class="fa-solid ' + icon + '"></i> ' + label + '</h3>'
                +    '<ul class="refbox__list">' + rows + '</ul>'
                + '</div>';
        }

        var section = document.createElement('details');
        section.className = 'refbox';
        section.open = false;
        section.innerHTML = ''
            + '<summary class="refbox__summary">'
            +   '<span class="refbox__chip"><i class="fa-solid fa-book-bookmark"></i> References &amp; codes</span>'
            +   '<span class="refbox__topic">' + data.title + '</span>'
            +   '<i class="fa-solid fa-chevron-down refbox__chev" aria-hidden="true"></i>'
            + '</summary>'
            + '<div class="refbox__body">'
            +   renderGroup('Standards &amp; codes', 'fa-gavel',       data.codes)
            +   renderGroup('Papers &amp; landmark works', 'fa-flask-vial', data.papers)
            +   '<p class="refbox__foot"><i class="fa-solid fa-circle-info"></i> External links open in a new tab. Specific clause numbers and DOIs may differ by edition &mdash; always cross-check with your project\u2019s controlling code.</p>'
            + '</div>';
        placeBefore(section, main);
    }

    function go() { injectTryIt(); injectReferences(); }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', go);
    } else { go(); }
})();

/* ============================================================================
   NAV & UX ENHANCEMENTS  (sticky TOC, chapter-hub prev/next, search-highlight,
   time-remaining ribbon). Hooks into the existing sub-common runtime; no
   per-page HTML edits required.
   ============================================================================ */
(function () {
    'use strict';
    if (window.__navux_init) return;
    window.__navux_init = true;

    function isSub() { return /\/chapter\d+\/sub\d+\.html?$/i.test(location.pathname); }
    function isHub() { return /\/chapter\d+\/(?:index\.html?)?$/i.test(location.pathname); }
    function chapterNum() {
        var m = (location.pathname || '').match(/\/chapter(\d+)\//i);
        return m ? parseInt(m[1], 10) : 0;
    }
    function subNum() {
        var m = (location.pathname || '').match(/\/sub(\d+)\.html?$/i);
        return m ? parseInt(m[1], 10) : 0;
    }
    // Mirror of the sub-counts used by injectPrevNext (declared earlier in this file)
    var SUB_COUNTS_LOCAL = { 1: 12, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10 };
    var CHAPTER_TITLES = {
        1: 'AI vs Machine Learning',
        2: 'Supervised Learning',
        3: 'Unsupervised Learning',
        4: 'Computer Vision &amp; CNNs',
        5: 'Sequence Models, Transformers &amp; LLMs',
        6: 'Neural Networks &amp; Deep Learning'
    };
    var LAST_CHAPTER = 6;

    /* ====================================================================
       1. STICKY TABLE OF CONTENTS (sub-pages only)
       ==================================================================== */
    function buildToc() {
        if (!isSub()) return;
        if (document.querySelector('.toc-rail')) return;
        var main = document.querySelector('main.chapter-content') || document.querySelector('main');
        if (!main) return;
        var heads = Array.prototype.slice.call(main.querySelectorAll('h2, h3'));
        // Skip headings inside injected widgets / cards
        heads = heads.filter(function (h) {
            return !h.closest('.try-it') && !h.closest('.refbox')
                && !h.closest('.next-up') && !h.closest('.case-v2')
                && !h.closest('.cv2-widget') && !h.closest('.flash-card')
                && !h.closest('.quiz-block');
        });
        if (heads.length < 3) return;

        // Ensure every heading has an id
        var used = {};
        function slug(s) {
            return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'section';
        }
        heads.forEach(function (h) {
            if (!h.id) {
                var base = slug(h.textContent || 'section');
                var id = base, i = 2;
                while (used[id] || document.getElementById(id)) { id = base + '-' + i++; }
                used[id] = 1;
                h.id = id;
            }
        });

        var rail = document.createElement('aside');
        rail.className = 'toc-rail';
        rail.setAttribute('aria-label', 'On this page');
        var items = heads.map(function (h) {
            var lvl = h.tagName === 'H3' ? 'lvl-3' : 'lvl-2';
            return '<li class="toc-rail__item ' + lvl + '">'
                + '<a class="toc-rail__link" href="#' + h.id + '" data-toc-id="' + h.id + '">'
                + (h.textContent || '').trim() + '</a></li>';
        }).join('');
        rail.innerHTML = ''
            + '<button class="toc-rail__toggle" type="button" aria-expanded="true" aria-controls="toc-rail-body" title="Toggle table of contents">'
            +   '<i class="fa-solid fa-list-ul"></i>'
            + '</button>'
            + '<div class="toc-rail__body" id="toc-rail-body">'
            +   '<h2 class="toc-rail__title">On this page</h2>'
            +   '<ol class="toc-rail__list">' + items + '</ol>'
            + '</div>';
        document.body.appendChild(rail);

        // Collapse on small screens by default
        var mq = window.matchMedia('(max-width: 1280px)');
        function applyCollapsed(forceState) {
            var collapsed = (typeof forceState === 'boolean') ? forceState : mq.matches;
            rail.classList.toggle('toc-rail--collapsed', collapsed);
            rail.querySelector('.toc-rail__toggle').setAttribute('aria-expanded', String(!collapsed));
        }
        applyCollapsed();
        if (mq.addEventListener) mq.addEventListener('change', function () { applyCollapsed(); });
        rail.querySelector('.toc-rail__toggle').addEventListener('click', function () {
            applyCollapsed(!rail.classList.contains('toc-rail--collapsed'));
        });

        // Scroll-spy using IntersectionObserver
        var links = rail.querySelectorAll('.toc-rail__link');
        var byId = {};
        for (var i = 0; i < links.length; i++) byId[links[i].getAttribute('data-toc-id')] = links[i];

        var visible = {};
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) visible[en.target.id] = en.intersectionRatio;
                else delete visible[en.target.id];
            });
            var bestId = null, best = -1;
            for (var id in visible) { if (visible[id] > best) { best = visible[id]; bestId = id; } }
            if (!bestId) {
                // Fall back to nearest above
                var y = window.scrollY + 80;
                var nearest = heads[0];
                for (var k = 0; k < heads.length; k++) {
                    if (heads[k].offsetTop <= y) nearest = heads[k];
                }
                bestId = nearest && nearest.id;
            }
            for (var lid in byId) byId[lid].classList.toggle('is-active', lid === bestId);
        }, { rootMargin: '-80px 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] });
        heads.forEach(function (h) { io.observe(h); });
    }

    /* ====================================================================
       2. CHAPTER-HUB PREV / NEXT (chapter index pages)
       ==================================================================== */
    function injectHubPrevNext() {
        if (!isHub()) return;
        if (document.querySelector('.page-nav--hub')) return;
        var ch = chapterNum();
        if (!ch) return;
        var prev = ch > 1
            ? { href: '../chapter' + (ch - 1) + '/index.html', label: 'Chapter ' + (ch - 1), title: CHAPTER_TITLES[ch - 1] || '' }
            : { href: '../index.html', label: 'Home', title: 'Civil Engineer\u2019s Guide to AI' };
        var next = ch < LAST_CHAPTER
            ? { href: '../chapter' + (ch + 1) + '/index.html', label: 'Chapter ' + (ch + 1), title: CHAPTER_TITLES[ch + 1] || '' }
            : { href: '../index.html', label: 'All chapters', title: 'Back to home' };

        var nav = document.createElement('nav');
        nav.className = 'page-nav page-nav--hub';
        nav.setAttribute('aria-label', 'Chapter navigation');
        nav.innerHTML = ''
            + '<a class="page-nav__link page-nav__prev" href="' + prev.href + '">'
            +   '<span class="page-nav__hint"><i class="fa-solid fa-arrow-left"></i> Previous chapter</span>'
            +   '<span class="page-nav__title">' + prev.label + '<small class="page-nav__sub"> &middot; ' + prev.title + '</small></span>'
            + '</a>'
            + '<a class="page-nav__link page-nav__next" href="' + next.href + '">'
            +   '<span class="page-nav__hint">Next chapter <i class="fa-solid fa-arrow-right"></i></span>'
            +   '<span class="page-nav__title">' + next.label + '<small class="page-nav__sub"> &middot; ' + next.title + '</small></span>'
            + '</a>';
        // Place after the last hub-sub-cards grid or just before footer.
        var main = document.querySelector('main') || document.body;
        var anchor = document.querySelector('.hub-sub-cards') || document.querySelector('main > section:last-of-type');
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(nav, anchor.nextSibling);
        else main.appendChild(nav);
    }

    /* ====================================================================
       3. SEARCH-RESULT HIGHLIGHT  (works on every page; reads ?q= or #q=)
       ==================================================================== */
    function getSearchQuery() {
        try {
            var u = new URL(location.href);
            var q = u.searchParams.get('q');
            if (q) return q;
            var hash = (location.hash || '').match(/(?:^|&|#)q=([^&]+)/);
            if (hash) return decodeURIComponent(hash[1].replace(/\+/g, ' '));
        } catch (e) {}
        return '';
    }
    var SEARCH_SKIP_TAGS = { A: 1, CODE: 1, PRE: 1, SCRIPT: 1, STYLE: 1, BUTTON: 1, TEXTAREA: 1, INPUT: 1, LABEL: 1, KBD: 1, OPTION: 1, SELECT: 1, NOSCRIPT: 1, SVG: 1, CANVAS: 1, MARK: 1 };
    function escSearch(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
    function isInSkippedSearch(node) {
        var p = node.parentNode;
        while (p && p.nodeType === 1) {
            if (SEARCH_SKIP_TAGS[p.tagName]) return true;
            var cls = p.className;
            if (cls && typeof cls === 'string') {
                if (cls.indexOf('toc-rail') !== -1) return true;
                if (cls.indexOf('breadcrumbs') !== -1) return true;
                if (cls.indexOf('page-nav') !== -1) return true;
                if (cls.indexOf('next-up') !== -1) return true;
                if (cls.indexOf('try-it') !== -1) return true;
                if (cls.indexOf('refbox') !== -1) return true;
                if (cls.indexOf('gloss') !== -1) return true;
                if (cls.indexOf('cv2-') !== -1) return true;
                if (cls.indexOf('case-v2') !== -1) return true;
                if (cls.indexOf('quiz-block') !== -1) return true;
                if (cls.indexOf('flash-card') !== -1) return true;
            }
            p = p.parentNode;
        }
        return false;
    }
    function highlightSearch() {
        var q = getSearchQuery();
        if (!q) return;
        var terms = q.split(/\s+/).filter(function (t) { return t && t.length >= 2; });
        if (!terms.length) return;
        var root = document.querySelector('main.chapter-content') || document.querySelector('main') || document.body;
        if (!root) return;
        var re = new RegExp('(' + terms.map(escSearch).join('|') + ')', 'gi');

        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: function (n) {
                if (!n.nodeValue || n.nodeValue.length < 2) return NodeFilter.FILTER_REJECT;
                if (isInSkippedSearch(n)) return NodeFilter.FILTER_REJECT;
                return re.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            }
        });
        var nodes = [], node, hits = 0, first = null;
        while ((node = walker.nextNode())) nodes.push(node);
        for (var i = 0; i < nodes.length; i++) {
            var tn = nodes[i], text = tn.nodeValue;
            re.lastIndex = 0;
            var frag = document.createDocumentFragment();
            var cursor = 0, m;
            while ((m = re.exec(text))) {
                if (m.index > cursor) frag.appendChild(document.createTextNode(text.slice(cursor, m.index)));
                var mark = document.createElement('mark');
                mark.className = 'ce-search-hl';
                mark.textContent = m[0];
                frag.appendChild(mark);
                if (!first) first = mark;
                hits++;
                cursor = m.index + m[0].length;
            }
            if (cursor < text.length) frag.appendChild(document.createTextNode(text.slice(cursor)));
            tn.parentNode.replaceChild(frag, tn);
        }
        if (!hits) return;

        // Banner
        var banner = document.createElement('div');
        banner.className = 'ce-search-banner';
        banner.innerHTML = ''
            + '<i class="fa-solid fa-magnifying-glass"></i> '
            + '<span><strong>' + hits + '</strong> match' + (hits === 1 ? '' : 'es') + ' for &ldquo;'
            +   (q.replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]); }))
            + '&rdquo;</span>'
            + '<button type="button" class="ce-search-banner__btn" aria-label="Jump to first match"><i class="fa-solid fa-arrow-down"></i> First</button>'
            + '<button type="button" class="ce-search-banner__btn ce-search-banner__close" aria-label="Clear highlights">Clear</button>';
        document.body.appendChild(banner);
        banner.querySelector('.ce-search-banner__btn').addEventListener('click', function () {
            if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        banner.querySelector('.ce-search-banner__close').addEventListener('click', function () {
            // Strip the ?q= param and reload to clean up DOM
            try { var u = new URL(location.href); u.searchParams.delete('q'); history.replaceState(null, '', u.toString()); } catch (e) {}
            banner.remove();
            var marks = document.querySelectorAll('mark.ce-search-hl');
            for (var k = 0; k < marks.length; k++) {
                var pt = marks[k].parentNode;
                pt.replaceChild(document.createTextNode(marks[k].textContent), marks[k]);
                pt.normalize();
            }
        });

        // Auto-scroll to first hit after a beat (so layout settles)
        setTimeout(function () {
            if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 250);
    }

    /* Hook the site-search input so Enter / click navigates with ?q= */
    function hookSearchInput() {
        var input = document.getElementById('site-search-input');
        var resultsEl = document.getElementById('site-search-results');
        if (!input || !resultsEl) return;
        input.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter') return;
            var first = resultsEl.querySelector('a');
            if (!first) return;
            // Append ?q= so the landing page can highlight + scroll.
            e.preventDefault();
            e.stopPropagation();
            var q = input.value.trim();
            try {
                var u = new URL(first.href, location.href);
                if (q) u.searchParams.set('q', q);
                location.href = u.toString();
            } catch (err) { location.href = first.href; }
        }, true);
        resultsEl.addEventListener('click', function (e) {
            var a = e.target.closest('a');
            if (!a) return;
            var q = input.value.trim();
            if (!q) return;
            e.preventDefault();
            try {
                var u = new URL(a.href, location.href);
                u.searchParams.set('q', q);
                location.href = u.toString();
            } catch (err) { location.href = a.href; }
        }, true);
    }

    /* ====================================================================
       4. TIME-REMAINING-IN-CHAPTER RIBBON  (sub-pages + hub)
       ==================================================================== */
    var AVG_MIN_PER_SUB = 7;   // calibrated against existing reading-time meta
    function readProgress() {
        try { return JSON.parse(localStorage.getItem('ce-ai:progress') || '{}') || {}; }
        catch (e) { return {}; }
    }
    function injectTimeRibbon() {
        var ch = chapterNum();
        if (!ch || !SUB_COUNTS_LOCAL[ch]) return;
        if (document.querySelector('.time-ribbon')) return;
        var total = SUB_COUNTS_LOCAL[ch];
        var progress = readProgress();
        var done = 0;
        for (var i = 1; i <= total; i++) {
            var key = 'chapter' + ch + '/sub' + i + '.html';
            if (progress[key]) done++;
        }
        var remaining = Math.max(0, total - done);
        var mins = remaining * AVG_MIN_PER_SUB;
        var ribbon = document.createElement('div');
        ribbon.className = 'time-ribbon';
        ribbon.setAttribute('role', 'status');
        ribbon.setAttribute('aria-live', 'polite');
        ribbon.innerHTML = ''
            + '<button class="time-ribbon__close" type="button" aria-label="Hide time-remaining ribbon">&times;</button>'
            + '<i class="fa-regular fa-clock"></i> '
            + (remaining === 0
                ? '<strong>Chapter ' + ch + ' complete</strong> &middot; nice work'
                : '<strong>~' + mins + ' min</strong> left in Chapter ' + ch
                  + ' <span class="time-ribbon__sub">&middot; ' + remaining + ' lesson' + (remaining === 1 ? '' : 's') + ' to go</span>');
        document.body.appendChild(ribbon);
        ribbon.querySelector('.time-ribbon__close').addEventListener('click', function () {
            ribbon.classList.add('time-ribbon--hidden');
            try { sessionStorage.setItem('ce_time_ribbon_hidden_ch' + ch, '1'); } catch (e) {}
        });
        try {
            if (sessionStorage.getItem('ce_time_ribbon_hidden_ch' + ch) === '1') {
                ribbon.classList.add('time-ribbon--hidden');
            }
        } catch (e) {}
    }

    /* ---- Init ---- */
    function go() {
        // TOC rail ("On this page") removed per UX feedback — too noisy on long lessons.
        try { injectHubPrevNext(); } catch (e) {}
        try { hookSearchInput(); } catch (e) {}
        try { highlightSearch(); } catch (e) {}
        try { injectTimeRibbon(); } catch (e) {}
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', go);
    } else { go(); }
})();

/* ============================================================================
   CHAPTER-END CAPSTONE QUIZ
   - 12 mixed-difficulty MCQs per chapter, baked into [js/sub-common.js]
   - Auto-injected on every chapter hub (chapterN/index.html); skipped elsewhere
   - Options shuffled per attempt; score + retry; best score persisted in
     localStorage under 'ce-ai:capstone' keyed by chapter number
   ============================================================================ */
(function () {
    'use strict';
    if (window.__capstone_init) return;
    window.__capstone_init = true;

    /* ---------- Question banks (12 per chapter, kept terse on purpose) ---------- */
    var BANKS = {
        1: [
            { q: 'Which Russell & Norvig approach to AI is closest to how modern engineering decision-support systems are framed?',
              opts: ['Thinking humanly', 'Acting humanly (Turing Test)', 'Thinking rationally (pure logic)', 'Acting rationally (optimal action under constraints)'], a: 3,
              x: 'Engineering AI is judged by the quality of the action it recommends given constraints, not by whether it "thinks" like a human.' },
            { q: 'A model that memorises the training set but performs poorly on new data is best described as:',
              opts: ['Underfitting', 'Overfitting', 'Regularised', 'Well calibrated'], a: 1,
              x: 'Overfitting = low training error, high generalisation error. Classic remedies: more data, regularisation, simpler model.' },
            { q: 'Which of these is a supervised-learning task?',
              opts: ['Clustering boreholes by similarity', 'Predicting 28-day concrete strength from mix proportions', 'Discovering association rules in crash data', 'Reducing 50 sensor channels to 2 components'], a: 1,
              x: 'Supervised = labelled outcome (here, the measured strength). The others are unsupervised.' },
            { q: 'The "data, features, labels" triad maps to which civil-engineering analogy?',
              opts: ['Loads, materials, drawings', 'Samples, measured properties, target outcome', 'Survey, design, construction', 'Specs, codes, reports'], a: 1,
              x: 'A row = a sample (e.g. one cylinder); columns of measurements = features; the target column (e.g. fc′) = label.' },
            { q: 'Which statement about traditional programming vs ML is most accurate?',
              opts: ['Traditional code = data + rules → output; ML = data + output → rules', 'ML eliminates the need for domain expertise', 'Traditional code cannot use statistics', 'ML always outperforms hand-written rules'], a: 0,
              x: 'In ML the program induces the rules (model parameters) from examples; traditional code applies rules you wrote.' },
            { q: 'Reinforcement learning is best characterised by:',
              opts: ['Labelled input/output pairs', 'Clustering unlabelled samples', 'An agent learning a policy from reward signals', 'Reducing dimensionality of sensors'], a: 2,
              x: 'RL learns by interacting with an environment and maximising cumulative reward — used in robotics, control, scheduling.' },
            { q: 'Which is NOT typically considered a feature-engineering step?',
              opts: ['One-hot encoding of soil type', 'Computing water/cement ratio from two columns', 'Standardising numeric columns', 'Increasing GPU clock speed'], a: 3,
              x: 'Feature engineering shapes the input matrix; hardware tuning is a deployment concern.' },
            { q: 'A model that always predicts the mean target value would score what R² on the training set?',
              opts: ['1.0', '0.5', '0.0', 'Negative'], a: 2,
              x: 'R² of the mean predictor is exactly 0 on the data it was fitted to; negative R² happens on hold-out sets only.' },
            { q: 'Which combination is most aligned with "narrow AI" rather than AGI?',
              opts: ['ChatGPT writing poems and translating languages and coding', 'A vision model trained only to detect rebar in X-ray scans', 'A robot that learns any new skill from one demo', 'A system that passes any university exam'], a: 1,
              x: 'Narrow AI excels at one well-scoped task. The other options describe broader/general capabilities.' },
            { q: 'Why is ethics / fairness a first-class concern in civil-engineering AI?',
              opts: ['Models can amplify bias in historical inspection or permitting data', 'Codes forbid all use of AI', 'AI never makes mistakes once deployed', 'Ethics only matters in social media'], a: 0,
              x: 'If training data systematically under-represents a region or population, predictions will too — a safety and equity issue.' },
            { q: 'During the AI winters, progress stalled mainly because:',
              opts: ['Compute and data were too limited for the ambitions of the time', 'No one was interested in AI', 'AI achieved AGI and stopped', 'Mathematics of learning was undiscovered'], a: 0,
              x: 'Symbolic systems hit combinatorial walls, neural nets lacked compute/data; both led to funding cuts.' },
            { q: 'Which workflow stage should a civil engineer "own" most strongly on an ML project?',
              opts: ['Choosing the GPU model', 'Defining the problem, success metric, and acceptable failure modes', 'Implementing CUDA kernels', 'Compiling PyTorch from source'], a: 1,
              x: 'Domain framing — what to predict, at what cost of error, against which baseline — is where engineering judgement is irreplaceable.' }
        ],
        2: [
            { q: 'For predicting continuous concrete strength, which algorithm family is the natural starting point?',
              opts: ['k-means clustering', 'Linear / polynomial regression', 'Apriori association rules', 'PCA'], a: 1,
              x: 'Continuous targets ⇒ regression; linear is the obvious, interpretable baseline.' },
            { q: 'Logistic regression outputs values bounded in [0, 1] because of which function?',
              opts: ['ReLU', 'Sigmoid (logistic)', 'Softmax over 10 classes', 'Identity'], a: 1,
              x: 'σ(z) = 1/(1+e^-z) squashes the linear score into a probability.' },
            { q: 'Which metric is most appropriate for an imbalanced bridge-defect classifier (1 % defective)?',
              opts: ['Accuracy', 'F1 / Recall on the defect class', 'R²', 'Silhouette'], a: 1,
              x: 'Accuracy is misleading when one class dominates; F1/recall on the rare class measures what you actually care about.' },
            { q: 'A decision tree that achieves 100 % training accuracy with depth 30 on 200 samples is almost certainly:',
              opts: ['Optimally regularised', 'Overfit', 'Underfit', 'Linearly separable'], a: 1,
              x: 'Unbounded-depth trees memorise; prune via max-depth, min-samples-leaf, or use an ensemble.' },
            { q: 'Random forests reduce variance primarily by:',
              opts: ['Boosting weak learners sequentially', 'Bagging + random feature subsets at each split', 'Using deeper trees', 'L1 regularisation'], a: 1,
              x: 'Bootstrap-aggregating decorrelated trees averages out individual quirks → lower variance, similar bias.' },
            { q: 'Which is true of gradient-boosted trees vs random forests?',
              opts: ['Boosting fits trees sequentially on the residuals', 'Boosting trees are always shallower than RF trees', 'Boosting cannot overfit', 'Boosting is unsupervised'], a: 0,
              x: 'Each new tree focuses on what the ensemble got wrong so far; learning rate × trees controls capacity.' },
            { q: 'A kernel SVM with an RBF kernel is conceptually:',
              opts: ['A linear separator in an implicit, higher-dimensional space', 'A nearest-neighbour rule', 'A decision tree', 'A clustering algorithm'], a: 0,
              x: 'The kernel trick lets the linear margin live in φ(x)-space without ever computing φ explicitly.' },
            { q: 'k-NN with k = 1 has which characteristic?',
              opts: ['Zero training error, high variance', 'High bias, low variance', 'Cannot make predictions', 'Requires gradient descent'], a: 0,
              x: '1-NN fits every training point exactly (0 error) but is extremely sensitive to noise — classic high-variance regime.' },
            { q: 'When is naïve Bayes a reasonable choice?',
              opts: ['Spam / document classification with many roughly-independent word features', 'Predicting concrete strength from 8 correlated mix proportions', 'Image segmentation', 'Time-series forecasting of stresses'], a: 0,
              x: 'Its independence assumption is wrong but useful when features are many and weakly dependent — fast, strong baseline for text.' },
            { q: 'For a regression model, which metric most penalises occasional huge errors?',
              opts: ['MAE', 'RMSE', 'MAPE', 'R² of the mean'], a: 1,
              x: 'Squaring residuals before averaging makes large errors dominate — useful when big misses are unacceptable.' },
            { q: 'Stratified k-fold cross-validation is preferable when:',
              opts: ['Class proportions matter and dataset is small', 'Data is purely time-ordered', 'You have millions of balanced rows', 'You only care about training loss'], a: 0,
              x: 'Stratification keeps each fold class-balanced; for time-ordered data use forward-chaining splits instead.' },
            { q: 'Which is the correct order of a typical supervised-learning pipeline?',
              opts: ['Deploy → train → split → collect data', 'Collect → clean/feature → split → train → validate → test → deploy', 'Train → collect → test → deploy → split', 'Test → train → collect → deploy'], a: 1,
              x: 'Data first, then features, then a strict split before any model touches the test set.' }
        ],
        3: [
            { q: 'Unsupervised learning is distinguished from supervised learning by:',
              opts: ['Larger datasets', 'No labelled target — the algorithm discovers structure', 'Always using neural networks', 'Always producing a classification'], a: 1,
              x: 'No y; the model groups, projects or scores points based on the geometry of X alone.' },
            { q: 'k-means assumes which cluster shape?',
              opts: ['Arbitrary, non-convex blobs', 'Roughly spherical, similar-sized clusters', 'Hierarchical chains', 'Density-connected regions'], a: 1,
              x: 'It minimises within-cluster Euclidean variance — biased toward isotropic blobs of comparable size.' },
            { q: 'The elbow / silhouette methods help you choose:',
              opts: ['Learning rate', 'Number of clusters k', 'Regularisation strength', 'Test-set size'], a: 1,
              x: 'Both are model-selection heuristics for unsupervised k.' },
            { q: 'DBSCAN is preferred over k-means when:',
              opts: ['Clusters have arbitrary shape and noise must be flagged', 'You need exactly k clusters', 'Data is one-dimensional', 'You want a dendrogram'], a: 0,
              x: 'DBSCAN finds density-connected regions and labels low-density points as noise (-1).' },
            { q: 'Agglomerative hierarchical clustering produces:',
              opts: ['A single partition', 'A dendrogram you can cut at any height', 'A linear regression', 'A neural embedding'], a: 1,
              x: 'It merges nearest clusters iteratively; the dendrogram lets you choose granularity post-hoc.' },
            { q: 'PCA finds directions that:',
              opts: ['Maximise variance and are mutually orthogonal', 'Maximise classification accuracy', 'Minimise the number of clusters', 'Preserve local neighbourhoods like t-SNE'], a: 0,
              x: 'Eigenvectors of the covariance matrix; the first PC has the largest variance, the second is orthogonal to it, etc.' },
            { q: 'A key difference between t-SNE and PCA is that t-SNE:',
              opts: ['Is a linear method', 'Preserves global distances', 'Preserves local neighbourhoods and is non-linear', 'Always returns 1 dimension'], a: 2,
              x: 't-SNE/UMAP are non-linear; great for visualising clusters, but distances between clusters are not faithful.' },
            { q: 'Which is an example of anomaly detection in CE?',
              opts: ['Flagging a strain-gauge reading that deviates strongly from the seasonal norm', 'Predicting concrete strength', 'Tagging photos', 'Routing trucks'], a: 0,
              x: 'Unsupervised SHM: learn the "normal" envelope, alarm on residuals beyond it.' },
            { q: 'Association-rule mining (e.g. Apriori) produces statements of the form:',
              opts: ['"If A then B with support s and confidence c"', '"A causes B"', '"y = wx + b"', '"x ∈ cluster k"'], a: 0,
              x: 'Co-occurrence patterns; useful for crash factors, failure patterns, maintenance bundles.' },
            { q: 'Silhouette score ranges from:',
              opts: ['0 to 1', '−1 to +1', '0 to ∞', '−∞ to +∞'], a: 1,
              x: 'Close to +1 = well-clustered; ~0 = on a boundary; negative = likely in the wrong cluster.' },
            { q: 'Standardising features before k-means matters because:',
              opts: ['Euclidean distance is dominated by large-scale features', 'It changes the cluster count', 'k-means cannot handle floats', 'It always improves silhouette'], a: 0,
              x: 'Without scaling, a feature in MPa swamps one in fractions — scale (z-score / min-max) before distance-based methods.' },
            { q: 'UMAP versus t-SNE — which is generally true?',
              opts: ['UMAP preserves more of the global structure and is faster on large datasets', 'UMAP is a supervised method', 'UMAP always produces 3 components', 'UMAP requires labels'], a: 0,
              x: 'UMAP often runs faster than t-SNE and tends to preserve broader topology better, especially at scale.' }
        ],
        4: [
            { q: 'A grayscale image of 256×256 pixels stored as a tensor has shape:',
              opts: ['(256, 256, 3)', '(256, 256, 1) or (256, 256)', '(1, 1, 256)', '(3, 256, 256, 3)'], a: 1,
              x: 'Grayscale = one channel; RGB would add a 3-channel axis.' },
            { q: 'A 3×3 convolution kernel slid over an H×W image with stride 1 and "valid" padding produces an output of size:',
              opts: ['H × W', '(H+2) × (W+2)', '(H−2) × (W−2)', 'H/3 × W/3'], a: 2,
              x: 'Valid padding loses (kernel−1) pixels at each border; with 3×3 that is 2 per dimension.' },
            { q: 'Max-pooling layers do which two things primarily?',
              opts: ['Down-sample spatial dims and add small translation invariance', 'Increase the number of parameters', 'Replace ReLU', 'Compute the loss'], a: 0,
              x: 'Pooling shrinks the feature map and makes the output less sensitive to small shifts of the input.' },
            { q: 'A common CNN block pattern is:',
              opts: ['conv → pool → conv → pool → flatten → dense', 'dense → conv → dense → conv', 'pool → dense → pool → dense', 'softmax → conv → pool'], a: 0,
              x: 'Stack conv+pool to extract hierarchical features, then flatten/global-pool and feed dense layers for the decision.' },
            { q: 'Why share weights across spatial positions in a convolution?',
              opts: ['It reduces parameters and exploits the translation-invariance of image features', 'It makes the network deeper', 'It is required by GPUs', 'It eliminates the need for activation functions'], a: 0,
              x: 'An edge detector should work anywhere in the image; weight sharing makes that an explicit prior.' },
            { q: 'A residual (skip) connection in ResNet helps mainly by:',
              opts: ['Making the loss surface easier to optimise for very deep networks', 'Reducing image resolution', 'Removing convolutions', 'Replacing the classifier'], a: 0,
              x: 'Adding x to f(x) gives a gradient highway, mitigating vanishing gradients and letting 50+ layer nets train.' },
            { q: 'Object detection differs from image classification because it must also:',
              opts: ['Output bounding boxes (or masks) for each object', 'Use only grayscale images', 'Avoid using CNNs', 'Predict a single label per image'], a: 0,
              x: 'Classification = one label per image; detection = label + location for many objects per image.' },
            { q: 'Semantic segmentation assigns:',
              opts: ['One label per image', 'One label per object', 'One label per pixel', 'One label per channel'], a: 2,
              x: 'Per-pixel labelling — U-Net, FCN, DeepLab. Instance segmentation also separates individual objects of the same class.' },
            { q: 'Data augmentation in CV (random crops, flips, brightness) primarily:',
              opts: ['Reduces overfitting and improves generalisation', 'Replaces the convolution', 'Increases inference latency', 'Forces use of grayscale'], a: 0,
              x: 'Effectively multiplies dataset size with plausible variations the model should be invariant to.' },
            { q: 'Grad-CAM is used to:',
              opts: ['Highlight which image regions influenced a CNN’s prediction', 'Train a new model from scratch', 'Compress the network', 'Detect adversarial inputs'], a: 0,
              x: 'A class-discriminative heat-map computed from gradients flowing into the last conv layer.' },
            { q: 'For a crack-detection CNN on 10 000 labelled bridge images, a reasonable training split is:',
              opts: ['100 % train, no validation', '80 / 10 / 10 train / val / test, with stratification', '50 / 50 train / test', 'Use the same images for train and test'], a: 1,
              x: 'Keep a held-out test set untouched; use validation for tuning, with stratification on the crack/no-crack label.' },
            { q: 'Which architecture introduced the "very deep, all-3×3 conv" recipe and won ILSVRC 2014 runner-up?',
              opts: ['LeNet-5', 'AlexNet', 'VGG', 'YOLOv8'], a: 2,
              x: 'VGG-16/19 showed that depth + small kernels works; its main downside is parameter count.' }
        ],
        5: [
            { q: 'An RNN’s key idea is:',
              opts: ['Sharing a hidden state across time steps to model sequences', 'Convolving over images', 'Clustering tokens', 'Performing PCA'], a: 0,
              x: 'h_t = f(h_{t-1}, x_t); the same weights are re-used at every position.' },
            { q: 'A practical limitation of vanilla RNNs that LSTMs/GRUs were designed to address:',
              opts: ['They cannot learn linear functions', 'Vanishing/exploding gradients over long sequences', 'They cannot use embeddings', 'They require GPUs'], a: 1,
              x: 'Gated units preserve a long-range cell state, mitigating gradient decay through many time steps.' },
            { q: 'Attention computes its output as:',
              opts: ['A learned bias plus ReLU', 'A weighted sum of values, where weights = softmax(QKᵀ / √d)', 'A convolution of queries and keys', 'A k-means clustering of tokens'], a: 1,
              x: 'Scaled dot-product attention is the heart of the transformer block.' },
            { q: 'Transformers replaced recurrence with self-attention mainly to:',
              opts: ['Reduce parameter count', 'Enable parallel processing of all positions', 'Eliminate the need for embeddings', 'Avoid the use of GPUs'], a: 1,
              x: 'Self-attention lets every position attend to every other in one matmul — massively parallel on accelerators.' },
            { q: 'BERT is an example of which transformer family?',
              opts: ['Encoder-only', 'Decoder-only', 'Encoder–decoder', 'Convolutional'], a: 0,
              x: 'BERT stacks transformer encoders and is pre-trained with masked-LM + next-sentence-prediction.' },
            { q: 'GPT models are:',
              opts: ['Encoder-only, bidirectional', 'Decoder-only, autoregressive', 'Encoder–decoder with cross-attention', 'CNN-based'], a: 1,
              x: 'They predict the next token given all previous tokens, using causal (masked) self-attention.' },
            { q: 'Byte-pair encoding (BPE) tokenisation:',
              opts: ['Splits text into characters only', 'Learns a vocabulary of frequent subword merges', 'Uses whole words only', 'Requires a parser'], a: 1,
              x: 'BPE/WordPiece/Unigram give a sweet spot between character and word vocabularies; rare words are decomposed.' },
            { q: 'A "context window" of 8 192 tokens is roughly:',
              opts: ['8 KB of source code', '6 000 English words (a long essay or short chapter)', 'One image', 'One sentence'], a: 1,
              x: 'Token ≈ 0.75 words on average for English; LLM context limits matter for RAG chunking and document summarisation.' },
            { q: 'Fine-tuning vs prompting — which statement is most accurate?',
              opts: ['Fine-tuning changes model weights; prompting only changes the inputs', 'Both alter the weights', 'Prompting changes weights more than fine-tuning', 'Fine-tuning is always cheaper'], a: 0,
              x: 'Prompt-engineering / in-context learning is weightless; LoRA, full FT, or RLHF actually update parameters.' },
            { q: 'Retrieval-Augmented Generation (RAG) is mostly used to:',
              opts: ['Speed up training', 'Ground answers in a private/up-to-date knowledge base instead of relying on parametric memory', 'Replace fine-tuning entirely', 'Compress the model'], a: 1,
              x: 'Embed your docs, retrieve top-k relevant chunks, then condition the LLM on them — drastically reduces hallucinations on closed-book queries.' },
            { q: 'Which is a known limitation of LLMs?',
              opts: ['They never produce text', 'They can fabricate confident but false statements ("hallucinations")', 'They cannot use tokenisers', 'They only output numbers'], a: 1,
              x: 'Without grounding, LLMs interpolate over their training distribution and will confidently invent code clauses, citations, etc.' },
            { q: 'For an "AI-assisted design review" use-case on a building project, which design choice most improves trustworthiness?',
              opts: ['Train a tiny model from scratch on 100 projects', 'Use an LLM with RAG over the firm’s standards library + cite sources in the answer', 'Disable temperature and hope for the best', 'Always answer in 3 sentences'], a: 1,
              x: 'Grounding (RAG) + citations let the engineer verify; small bespoke models rarely beat a strong base + retrieval here.' }
        ],
        6: [
            { q: 'A single perceptron computes:',
              opts: ['ReLU of a convolution', 'A weighted sum of inputs, plus bias, passed through an activation', 'A softmax over the entire dataset', 'A clustering assignment'], a: 1,
              x: 'y = φ(w·x + b). Stacking many in layers gives an MLP.' },
            { q: 'A linear activation function in a deep MLP collapses the network to:',
              opts: ['A non-linear universal approximator', 'A single equivalent linear layer', 'A CNN', 'A transformer'], a: 1,
              x: 'Without non-linearities the composition of linears is itself linear — no depth gain.' },
            { q: 'ReLU = max(0, x) is popular because:',
              opts: ['It saturates at both ends', 'It is cheap, sparse, and avoids the vanishing-gradient problem of sigmoids in deep nets', 'It bounds outputs to [0, 1]', 'It is required by all optimisers'], a: 1,
              x: 'Gradient is exactly 1 for positive inputs, helping signals flow in very deep networks.' },
            { q: 'Back-propagation is fundamentally:',
              opts: ['Random search', 'Reverse-mode automatic differentiation applied to the loss', 'A clustering algorithm', 'A pruning method'], a: 1,
              x: 'Chain rule, computed backwards through the computation graph, gives ∂L/∂w for every weight in O(forward) work.' },
            { q: 'Stochastic / mini-batch gradient descent uses small random batches mainly to:',
              opts: ['Trade variance for compute efficiency and to escape sharp minima', 'Eliminate the learning rate', 'Make the loss convex', 'Avoid the need for a GPU'], a: 0,
              x: 'Each step is noisy but cheap; the noise also acts as implicit regularisation.' },
            { q: 'A loss curve that decreases on training but rises on validation indicates:',
              opts: ['Underfitting', 'Overfitting', 'A bug in the data loader', 'Successful generalisation'], a: 1,
              x: 'Standard overfitting signature — add regularisation, dropout, early stopping, or more data.' },
            { q: 'Dropout regularises a network by:',
              opts: ['Permanently removing neurons', 'Randomly zeroing activations during training', 'Reducing the learning rate', 'Scaling weights by 2'], a: 1,
              x: 'Each forward pass trains a different sub-network; at inference all neurons are active (with weight scaling).' },
            { q: 'Adam combines which two ideas?',
              opts: ['Momentum + per-parameter adaptive learning rates (RMSProp-style)', 'L1 + L2 regularisation', 'Mini-batch + full-batch', 'Convolution + pooling'], a: 0,
              x: 'First and second moment estimates of the gradient, bias-corrected — works well out of the box on most problems.' },
            { q: 'Batch normalisation primarily:',
              opts: ['Normalises layer pre-activations per mini-batch, stabilising training', 'Replaces dropout', 'Pools spatial dims', 'Compresses the model'], a: 0,
              x: 'BN reduces internal covariate shift, often allowing higher learning rates and faster convergence.' },
            { q: 'A physics-informed neural network (PINN) is special because:',
              opts: ['It needs no data', 'Its loss includes residuals of governing PDEs in addition to data terms', 'It uses only linear layers', 'It is unsupervised'], a: 1,
              x: 'The PDE loss embeds physics as soft constraints — useful when data is scarce but laws are known.' },
            { q: 'A weight decay of 1e-4 added to a deep model acts as:',
              opts: ['L2 regularisation, shrinking weights toward zero', 'A learning-rate schedule', 'Data augmentation', 'A new optimiser'], a: 0,
              x: 'Equivalent to adding λ‖w‖² to the loss — discourages large weights, reducing overfitting.' },
            { q: 'For deploying a CNN structural-health-monitoring model on edge hardware, which is most relevant?',
              opts: ['Increasing model size to maximum', 'Quantisation (e.g. INT8) and pruning to reduce memory & latency', 'Disabling all regularisation', 'Training on the test set'], a: 1,
              x: 'Edge devices have tight memory/power budgets — INT8 quantisation + structured pruning often cut size 4× with minimal accuracy loss.' }
        ]
    };

    /* ---------- Helpers ---------- */
    function chapterNum() {
        var m = (location.pathname || '').match(/\/chapter(\d+)\//i);
        return m ? parseInt(m[1], 10) : 0;
    }
    function isHub() { return /\/chapter\d+\/(?:index\.html?)?$/i.test(location.pathname); }
    function shuffled(arr, rng) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(rng() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }
    function lcg(seed) { return function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
    function escapeHtml(s) { return (s || '').replace(/[&<>"']/g, function (c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]); }); }
    function readBest(ch) {
        try {
            var all = JSON.parse(localStorage.getItem('ce-ai:capstone') || '{}') || {};
            return all[ch] || null;
        } catch (e) { return null; }
    }
    function writeBest(ch, payload) {
        try {
            var all = JSON.parse(localStorage.getItem('ce-ai:capstone') || '{}') || {};
            var prev = all[ch];
            if (!prev || payload.pct > prev.pct) all[ch] = payload;
            localStorage.setItem('ce-ai:capstone', JSON.stringify(all));
        } catch (e) {}
    }

    /* ---------- Renderer ---------- */
    function render(ch, bank, host) {
        var seed = Date.now() & 0x7fffffff;
        var rng = lcg(seed);
        // Per-attempt: shuffle question order and option order, remember the new correct index.
        var items = shuffled(bank, rng).map(function (item, qi) {
            var pairs = item.opts.map(function (txt, i) { return { txt: txt, isCorrect: i === item.a }; });
            pairs = shuffled(pairs, rng);
            var newCorrect = -1;
            for (var k = 0; k < pairs.length; k++) if (pairs[k].isCorrect) { newCorrect = k; break; }
            return { q: item.q, x: item.x, pairs: pairs, a: newCorrect, picked: -1, qi: qi };
        });

        var best = readBest(ch);
        var bestLine = best
            ? '<span class="cap-quiz__best"><i class="fa-solid fa-trophy"></i> Best: ' + best.score + ' / ' + best.total + ' (' + best.pct + '%)</span>'
            : '<span class="cap-quiz__best cap-quiz__best--none">Not attempted yet</span>';

        host.innerHTML = ''
            + '<header class="cap-quiz__head">'
            +   '<div class="cap-quiz__icon"><i class="fa-solid fa-graduation-cap"></i></div>'
            +   '<div>'
            +     '<h2 class="cap-quiz__title">Chapter ' + ch + ' capstone quiz</h2>'
            +     '<p class="cap-quiz__sub">' + items.length + ' mixed-difficulty questions &middot; options shuffled each attempt &middot; ' + bestLine + '</p>'
            +   '</div>'
            +   '<button type="button" class="cap-quiz__reshuffle" title="Reshuffle and start over"><i class="fa-solid fa-rotate"></i> Reshuffle</button>'
            + '</header>'
            + '<ol class="cap-quiz__list">'
            +   items.map(function (it, qi) {
                  return '<li class="cap-quiz__item" data-qi="' + qi + '">'
                       + '<p class="cap-quiz__q"><span class="cap-quiz__qnum">Q' + (qi + 1) + '.</span> ' + escapeHtml(it.q) + '</p>'
                       + '<div class="cap-quiz__opts" role="radiogroup" aria-label="Options for Q' + (qi + 1) + '">'
                       + it.pairs.map(function (p, oi) {
                            return '<button type="button" class="cap-quiz__opt" role="radio" aria-checked="false" data-qi="' + qi + '" data-oi="' + oi + '">'
                                 + '<span class="cap-quiz__letter">' + String.fromCharCode(65 + oi) + '</span>'
                                 + '<span class="cap-quiz__opt-txt">' + escapeHtml(p.txt) + '</span>'
                                 + '</button>';
                         }).join('')
                       + '</div>'
                       + '<div class="cap-quiz__expl" hidden></div>'
                       + '</li>';
              }).join('')
            + '</ol>'
            + '<footer class="cap-quiz__foot">'
            +   '<button type="button" class="cap-quiz__submit" disabled><i class="fa-solid fa-check-double"></i> Submit answers</button>'
            +   '<button type="button" class="cap-quiz__retry" hidden><i class="fa-solid fa-rotate-right"></i> Retry</button>'
            +   '<div class="cap-quiz__result" aria-live="polite"></div>'
            + '</footer>';

        var submitBtn = host.querySelector('.cap-quiz__submit');
        var retryBtn  = host.querySelector('.cap-quiz__retry');
        var resultEl  = host.querySelector('.cap-quiz__result');
        var reshuffleBtn = host.querySelector('.cap-quiz__reshuffle');

        function checkCanSubmit() {
            var done = items.every(function (it) { return it.picked >= 0; });
            submitBtn.disabled = !done;
        }

        host.querySelectorAll('.cap-quiz__opt').forEach(function (btn) {
            btn.addEventListener('click', function () {
                if (host.classList.contains('cap-quiz--scored')) return;
                var qi = +btn.getAttribute('data-qi');
                var oi = +btn.getAttribute('data-oi');
                items[qi].picked = oi;
                var sibs = host.querySelectorAll('.cap-quiz__item[data-qi="' + qi + '"] .cap-quiz__opt');
                sibs.forEach(function (s) {
                    s.classList.remove('is-selected');
                    s.setAttribute('aria-checked', 'false');
                });
                btn.classList.add('is-selected');
                btn.setAttribute('aria-checked', 'true');
                checkCanSubmit();
            });
        });

        submitBtn.addEventListener('click', function () {
            var score = 0;
            items.forEach(function (it, qi) {
                var itemEl = host.querySelector('.cap-quiz__item[data-qi="' + qi + '"]');
                var btns = itemEl.querySelectorAll('.cap-quiz__opt');
                var correct = it.picked === it.a;
                if (correct) score++;
                btns.forEach(function (b, bi) {
                    b.disabled = true;
                    if (bi === it.a) b.classList.add('is-correct');
                    if (bi === it.picked && bi !== it.a) b.classList.add('is-wrong');
                });
                var expl = itemEl.querySelector('.cap-quiz__expl');
                expl.hidden = false;
                expl.innerHTML = (correct
                    ? '<i class="fa-solid fa-check"></i> <strong>Correct.</strong> '
                    : '<i class="fa-solid fa-xmark"></i> <strong>Not quite.</strong> ')
                    + escapeHtml(it.x);
                expl.classList.add(correct ? 'is-correct' : 'is-wrong');
            });
            var total = items.length;
            var pct = Math.round((score / total) * 100);
            var tier = pct >= 90 ? 'gold' : pct >= 75 ? 'silver' : pct >= 50 ? 'bronze' : 'fail';
            var label = pct >= 90 ? 'Excellent' : pct >= 75 ? 'Solid pass' : pct >= 50 ? 'Keep going' : 'Review the chapter';
            resultEl.innerHTML = '<div class="cap-quiz__score cap-quiz__score--' + tier + '">'
                + '<strong>' + score + ' / ' + total + '</strong>'
                + '<span class="cap-quiz__pct">' + pct + '%</span>'
                + '<span class="cap-quiz__tier">' + label + '</span>'
                + '</div>';
            host.classList.add('cap-quiz--scored');
            submitBtn.hidden = true;
            retryBtn.hidden = false;
            writeBest(ch, { score: score, total: total, pct: pct, at: new Date().toISOString() });
            // If all six chapters are now passed (>=75%), surface a certificate CTA.
            try {
                var all = JSON.parse(localStorage.getItem('ce-ai:capstone') || '{}') || {};
                var passed = 0;
                for (var k = 1; k <= 6; k++) { if (all[k] && all[k].pct >= 75) passed++; }
                var certHref = (location.pathname.indexOf('/chapter') !== -1 ? '../' : '') + 'certificate.html';
                var cta;
                if (passed === 6) {
                    cta = '<a class="cap-quiz__cert cap-quiz__cert--ready" href="' + certHref + '">'
                        + '<i class="fa-solid fa-award"></i> <strong>All 6 chapters passed!</strong> '
                        + 'Claim your certificate <i class="fa-solid fa-arrow-right"></i></a>';
                } else {
                    cta = '<a class="cap-quiz__cert" href="' + certHref + '">'
                        + '<i class="fa-regular fa-circle-check"></i> '
                        + passed + ' / 6 chapter capstones passed (\u2265 75 %). '
                        + '<strong>See progress toward your certificate</strong> <i class="fa-solid fa-arrow-right"></i></a>';
                }
                resultEl.insertAdjacentHTML('beforeend', cta);
            } catch (e) {}
            retryBtn.focus();
            // Scroll the result into view
            try { resultEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
        });

        function retry() { render(ch, bank, host); }
        retryBtn.addEventListener('click', retry);
        reshuffleBtn.addEventListener('click', retry);
    }

    /* ---------- Injection ---------- */
    function inject() {
        if (!isHub()) return;
        if (document.querySelector('.cap-quiz')) return;
        var ch = chapterNum();
        var bank = BANKS[ch];
        if (!bank || !bank.length) return;

        var wrap = document.createElement('section');
        wrap.className = 'cap-quiz';
        wrap.setAttribute('aria-label', 'Chapter ' + ch + ' capstone quiz');

        // Anchor: before the chapter-nav-footer if present, else before page-nav--hub,
        // else before site footer, else append to body.
        var anchors = [
            '.chapter-nav-footer',
            '.page-nav--hub',
            'footer.site-footer',
            'footer'
        ];
        var placed = false;
        for (var i = 0; i < anchors.length; i++) {
            var el = document.querySelector(anchors[i]);
            if (el && el.parentNode) { el.parentNode.insertBefore(wrap, el); placed = true; break; }
        }
        if (!placed) document.body.appendChild(wrap);

        render(ch, bank, wrap);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else { inject(); }
})();


/* ============================================
   SEO: JSON-LD LearningResource per sub-page +
   Atom feed discovery on chapter hubs.
   Auto-runs from sub-common.js (loaded on all chapter pages).
   ============================================ */
(function __seo_init() {
    'use strict';
    var SITE = 'https://civil-learning.bibeksubedi0001.com.np';
    var AUTHOR = 'Bibek Subedi';
    var AUTHOR_URL = 'https://bibeksubedi0001.com.np';

    function chapterFromPath() {
        var m = location.pathname.match(/\/chapter(\d+)\//);
        return m ? parseInt(m[1], 10) : null;
    }
    function subFromPath() {
        var m = location.pathname.match(/\/chapter\d+\/sub(\d+)\.html/);
        return m ? parseInt(m[1], 10) : null;
    }
    function isHub() {
        var p = location.pathname;
        return /\/chapter\d+\/(index\.html)?$/.test(p);
    }
    function getTitle() {
        var t = document.title || '';
        return t.replace(/\s*\|\s*Civil Engineer'?s Guide to AI\s*$/i, '').trim();
    }
    function getDescription() {
        var el = document.querySelector('meta[name="description"]');
        return el ? el.getAttribute('content') || '' : '';
    }
    function getCanonical() {
        var el = document.querySelector('link[rel="canonical"]');
        if (el) return el.getAttribute('href');
        // Build canonical from path
        var rel = location.pathname.replace(/^\/+/, '');
        return SITE + '/' + rel;
    }

    function injectJsonLd(obj) {
        // Avoid double-injection if a static JSON-LD already exists with the same @type
        var existing = document.querySelectorAll('script[type="application/ld+json"]');
        for (var i = 0; i < existing.length; i++) {
            try {
                var parsed = JSON.parse(existing[i].textContent);
                if (parsed && parsed['@type'] === obj['@type']) return;
            } catch (e) {}
        }
        var s = document.createElement('script');
        s.type = 'application/ld+json';
        s.textContent = JSON.stringify(obj);
        document.head.appendChild(s);
    }

    function injectFeedLink(ch) {
        if (document.querySelector('link[rel="alternate"][type="application/atom+xml"]')) return;
        var link = document.createElement('link');
        link.rel = 'alternate';
        link.type = 'application/atom+xml';
        link.title = 'Chapter ' + ch + ' updates (Atom)';
        link.href = SITE + '/chapter' + ch + '/feed.xml';
        document.head.appendChild(link);
    }

    var ch = chapterFromPath();
    var sub = subFromPath();

    if (ch && sub) {
        // Sub-page → LearningResource
        injectJsonLd({
            '@context': 'https://schema.org',
            '@type': 'LearningResource',
            'name': getTitle(),
            'description': getDescription(),
            'url': getCanonical(),
            'inLanguage': 'en',
            'isAccessibleForFree': true,
            'learningResourceType': 'Lesson',
            'educationalLevel': 'Professional development',
            'audience': { '@type': 'EducationalAudience', 'audienceType': 'Civil Engineers' },
            'about': ['Artificial Intelligence', 'Machine Learning', 'Civil Engineering'],
            'isPartOf': {
                '@type': 'Course',
                'name': "The Civil Engineer's Guide to AI",
                'url': SITE + '/'
            },
            'position': sub,
            'author': { '@type': 'Person', 'name': AUTHOR, 'url': AUTHOR_URL }
        });
        injectFeedLink(ch);
    } else if (ch && isHub()) {
        // Chapter hub → CollectionPage + feed discovery
        injectJsonLd({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            'name': getTitle(),
            'description': getDescription(),
            'url': getCanonical(),
            'inLanguage': 'en',
            'isPartOf': {
                '@type': 'Course',
                'name': "The Civil Engineer's Guide to AI",
                'url': SITE + '/'
            },
            'author': { '@type': 'Person', 'name': AUTHOR, 'url': AUTHOR_URL }
        });
        injectFeedLink(ch);
    }
})();


/* ============================================
   Difficulty badges on chapter hub sub-cards
   Auto-tags every <a class="sub-card" href="subN.html"> on chapter index
   pages with a Beginner / Intermediate / Advanced chip. Mapping is
   per-chapter so it reflects each chapter's pacing.
   ============================================ */
(function __diff_badges_init() {
    'use strict';

    // Map each (chapter, sub) -> 'beginner' | 'intermediate' | 'advanced'.
    // Default rule: subs 1-2 beginner, mid intermediate, last 2-3 advanced.
    // Chapter 1 is longer (12 subs) so the bands shift.
    var BANDS = {
        1: { B: [1, 4], I: [5, 9], A: [10, 12] },
        2: { B: [1, 2], I: [3, 7], A: [8, 10] },
        3: { B: [1, 2], I: [3, 7], A: [8, 10] },
        4: { B: [1, 2], I: [3, 6], A: [7, 10] },
        5: { B: [1, 2], I: [3, 6], A: [7, 10] },
        6: { B: [1, 2], I: [3, 6], A: [7, 10] }
    };

    function chFromPath() {
        var m = location.pathname.match(/\/chapter(\d+)\//);
        return m ? parseInt(m[1], 10) : null;
    }
    function isHubPage() {
        var p = location.pathname;
        return /\/chapter\d+\/(index\.html)?$/.test(p);
    }
    function difficultyFor(ch, sub) {
        var b = BANDS[ch];
        if (!b) return null;
        if (sub >= b.B[0] && sub <= b.B[1]) return 'beginner';
        if (sub >= b.I[0] && sub <= b.I[1]) return 'intermediate';
        if (sub >= b.A[0] && sub <= b.A[1]) return 'advanced';
        return 'intermediate';
    }
    var LABELS = {
        beginner: { text: 'Beginner', icon: 'fa-seedling' },
        intermediate: { text: 'Intermediate', icon: 'fa-bolt' },
        advanced: { text: 'Advanced', icon: 'fa-mountain' }
    };

    function inject() {
        if (!isHubPage()) return;
        var ch = chFromPath();
        if (!ch) return;
        var cards = document.querySelectorAll('a.sub-card');
        cards.forEach(function (card) {
            if (card.querySelector('.diff-badge')) return;
            var href = card.getAttribute('href') || '';
            var m = href.match(/sub(\d+)\.html/);
            if (!m) return;
            var sub = parseInt(m[1], 10);
            var level = difficultyFor(ch, sub);
            if (!level) return;
            var l = LABELS[level];
            var badge = document.createElement('span');
            badge.className = 'diff-badge diff-badge--' + level;
            badge.setAttribute('aria-label', 'Difficulty: ' + l.text);
            badge.setAttribute('title', 'Difficulty: ' + l.text);
            badge.innerHTML = '<i class="fa-solid ' + l.icon + '" aria-hidden="true"></i> ' + l.text;
            card.appendChild(badge);
            card.classList.add('sub-card--has-diff');
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
})();


/* ============================================
   Community / sharing features
   1. Anchor "share" buttons next to each h2/h3 on sub-pages
   2. "Was this helpful?" feedback widget → prefilled GitHub issue
   3. Giscus comments (GitHub Discussions, no backend)
   ============================================ */
(function __community_init() {
    'use strict';

    // Edit these once after enabling Giscus on the GitHub repo. The first
    // two values are public; the *Id values come from https://giscus.app.
    var COMMUNITY_CONFIG = {
        github: {
            owner: 'bibeksubedi0001',
            repo: 'civil-learning'
        },
        giscus: {
            enabled: false, // flip to true after filling repoId / categoryId
            repo: 'bibeksubedi0001/civil-learning',
            repoId: 'REPLACE_WITH_REPO_ID',
            category: 'Comments',
            categoryId: 'REPLACE_WITH_CATEGORY_ID',
            mapping: 'pathname',
            reactionsEnabled: '1',
            theme: 'dark_dimmed'
        }
    };

    function isSubPage() {
        return /\/chapter\d+\/sub\d+\.html?$/.test(location.pathname);
    }
    function pageTitle() {
        return (document.title || location.pathname).split('|')[0].trim();
    }

    /* ---------- 1. Anchor share buttons on headings ---------- */
    function slug(s) {
        return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'section';
    }
    function ensureHeadingIds(main) {
        var used = {};
        var heads = main.querySelectorAll('h2, h3');
        heads.forEach(function (h) {
            if (h.closest('.try-it') || h.closest('.refbox') || h.closest('.next-up')
                || h.closest('.case-v2') || h.closest('.cv2-widget') || h.closest('.flash-card')
                || h.closest('.quiz-block') || h.closest('.community-block')) return;
            if (!h.id) {
                var base = slug(h.textContent || 'section');
                var id = base, i = 2;
                while (used[id] || document.getElementById(id)) { id = base + '-' + i++; }
                used[id] = 1;
                h.id = id;
            }
        });
        return heads;
    }
    function showToast(msg) {
        var t = document.createElement('div');
        t.className = 'share-toast';
        t.textContent = msg;
        document.body.appendChild(t);
        requestAnimationFrame(function () { t.classList.add('share-toast--in'); });
        setTimeout(function () {
            t.classList.remove('share-toast--in');
            setTimeout(function () { t.remove(); }, 250);
        }, 1800);
    }
    function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        return new Promise(function (resolve, reject) {
            try {
                var ta = document.createElement('textarea');
                ta.value = text;
                ta.setAttribute('readonly', '');
                ta.style.position = 'absolute';
                ta.style.left = '-9999px';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                resolve();
            } catch (e) { reject(e); }
        });
    }
    function injectShareButtons() {
        if (!isSubPage()) return;
        var main = document.querySelector('main.chapter-content') || document.querySelector('main');
        if (!main) return;
        var heads = ensureHeadingIds(main);
        heads.forEach(function (h) {
            if (!h.id) return;
            if (h.querySelector('.share-anchor')) return;
            if (h.closest('.try-it') || h.closest('.refbox') || h.closest('.next-up')
                || h.closest('.case-v2') || h.closest('.cv2-widget') || h.closest('.flash-card')
                || h.closest('.quiz-block') || h.closest('.community-block')) return;
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'share-anchor';
            btn.setAttribute('aria-label', 'Copy link to this section');
            btn.setAttribute('title', 'Copy link to this section');
            btn.innerHTML = '<i class="fa-solid fa-link" aria-hidden="true"></i>';
            btn.addEventListener('click', function (ev) {
                ev.preventDefault();
                var url = location.origin + location.pathname + '#' + h.id;
                copyText(url).then(function () {
                    showToast('Section link copied');
                    history.replaceState(null, '', '#' + h.id);
                }, function () { showToast('Could not copy link'); });
            });
            h.appendChild(btn);
            h.classList.add('has-share-anchor');
        });
    }

    /* ---------- 2. Feedback widget ---------- */
    function buildIssueUrl(helpful) {
        var cfg = COMMUNITY_CONFIG.github;
        var title = '[Feedback] ' + (helpful ? '👍 helpful' : '👎 needs work') + ' — ' + pageTitle();
        var body = [
            '**Page:** ' + location.origin + location.pathname,
            '**Vote:** ' + (helpful ? '👍 Helpful' : '👎 Needs improvement'),
            '',
            '### What worked / what didn\'t',
            '<!-- A sentence or two is plenty. Feel free to delete this template. -->',
            '',
            '### Suggested improvement (optional)',
            ''
        ].join('\n');
        return 'https://github.com/' + cfg.owner + '/' + cfg.repo + '/issues/new?'
            + 'title=' + encodeURIComponent(title)
            + '&body=' + encodeURIComponent(body)
            + '&labels=' + encodeURIComponent(helpful ? 'feedback,positive' : 'feedback,needs-work');
    }
    function pageKey() { return 'ce-ai:fb:' + location.pathname; }
    function injectFeedback() {
        if (!isSubPage()) return;
        if (document.querySelector('.feedback-widget')) return;
        var main = document.querySelector('main.chapter-content') || document.querySelector('main');
        if (!main) return;

        var wrap = document.createElement('section');
        wrap.className = 'community-block feedback-widget';
        wrap.setAttribute('aria-label', 'Page feedback');
        wrap.innerHTML = ''
            + '<div class="feedback-widget__inner">'
            +   '<span class="feedback-widget__label"><i class="fa-solid fa-comment-dots" aria-hidden="true"></i> Was this section helpful?</span>'
            +   '<div class="feedback-widget__buttons" role="group" aria-label="Feedback">'
            +     '<button type="button" class="feedback-btn feedback-btn--up" data-vote="up" aria-label="Yes, this was helpful">'
            +       '<i class="fa-regular fa-thumbs-up" aria-hidden="true"></i><span>Yes</span>'
            +     '</button>'
            +     '<button type="button" class="feedback-btn feedback-btn--down" data-vote="down" aria-label="No, this needs work">'
            +       '<i class="fa-regular fa-thumbs-down" aria-hidden="true"></i><span>No</span>'
            +     '</button>'
            +   '</div>'
            +   '<p class="feedback-widget__msg" hidden></p>'
            + '</div>';
        main.appendChild(wrap);

        var msg = wrap.querySelector('.feedback-widget__msg');
        var key = pageKey();
        try {
            var prev = localStorage.getItem(key);
            if (prev === 'up' || prev === 'down') {
                wrap.querySelector('[data-vote="' + prev + '"]').classList.add('is-selected');
            }
        } catch (e) {}

        wrap.querySelectorAll('.feedback-btn').forEach(function (b) {
            b.addEventListener('click', function () {
                var vote = b.getAttribute('data-vote');
                wrap.querySelectorAll('.feedback-btn').forEach(function (x) { x.classList.remove('is-selected'); });
                b.classList.add('is-selected');
                try { localStorage.setItem(key, vote); } catch (e) {}
                var url = buildIssueUrl(vote === 'up');
                msg.hidden = false;
                msg.innerHTML = (vote === 'up'
                    ? 'Glad it helped! '
                    : 'Thanks — your notes help us improve. ')
                    + '<a class="feedback-issue-link" href="' + url + '" target="_blank" rel="noopener">'
                    + '<i class="fa-brands fa-github" aria-hidden="true"></i> Add a quick note on GitHub</a>';
            });
        });
    }

    /* ---------- 3. Giscus comments ---------- */
    function injectGiscus() {
        if (!isSubPage()) return;
        if (document.querySelector('.giscus-block')) return;
        var main = document.querySelector('main.chapter-content') || document.querySelector('main');
        if (!main) return;

        var wrap = document.createElement('section');
        wrap.className = 'community-block giscus-block';
        wrap.id = 'comments';
        wrap.setAttribute('aria-label', 'Discussion');
        wrap.innerHTML = ''
            + '<h2 class="community-block__title"><i class="fa-regular fa-comments" aria-hidden="true"></i> Discussion</h2>'
            + '<p class="community-block__sub">Ask questions or share how you applied this section. Sign in with GitHub to post.</p>';
        var slot = document.createElement('div');
        slot.className = 'giscus';
        wrap.appendChild(slot);

        var cfg = COMMUNITY_CONFIG.giscus;
        if (!cfg.enabled || /REPLACE_WITH/.test(cfg.repoId) || /REPLACE_WITH/.test(cfg.categoryId)) {
            slot.innerHTML = '<div class="giscus-placeholder">'
                + '<i class="fa-solid fa-circle-info" aria-hidden="true"></i> '
                + 'Comments will appear here once the maintainer enables the Giscus app on the GitHub repo '
                + 'and fills in <code>repoId</code> / <code>categoryId</code> in <code>js/sub-common.js</code>. '
                + 'See <a href="https://giscus.app" target="_blank" rel="noopener">giscus.app</a> for setup.'
                + '</div>';
        } else {
            var s = document.createElement('script');
            s.src = 'https://giscus.app/client.js';
            s.async = true;
            s.crossOrigin = 'anonymous';
            s.setAttribute('data-repo', cfg.repo);
            s.setAttribute('data-repo-id', cfg.repoId);
            s.setAttribute('data-category', cfg.category);
            s.setAttribute('data-category-id', cfg.categoryId);
            s.setAttribute('data-mapping', cfg.mapping);
            s.setAttribute('data-strict', '0');
            s.setAttribute('data-reactions-enabled', cfg.reactionsEnabled);
            s.setAttribute('data-emit-metadata', '0');
            s.setAttribute('data-input-position', 'top');
            s.setAttribute('data-theme', cfg.theme);
            s.setAttribute('data-lang', 'en');
            s.setAttribute('data-loading', 'lazy');
            slot.appendChild(s);
        }
        main.appendChild(wrap);
    }

    function run() {
        try { injectShareButtons(); } catch (e) {}
        try { injectFeedback(); } catch (e) {}
        try { injectGiscus(); } catch (e) {}
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();
