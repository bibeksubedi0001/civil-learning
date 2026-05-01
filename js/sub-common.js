/* ============================================
   SHARED SUB-CHAPTER UTILITIES
   Common helpers for all sub-chapter pages
   ============================================ */

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
