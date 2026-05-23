/* ============================================
   PROGRESS DISPLAY
   Reads ce-ai:progress / ce-ai:quiz from localStorage
   and annotates chapter / sub cards on the homepage and hubs.
   ============================================ */
(function () {
    'use strict';

    function readJSON(key) {
        try { return JSON.parse(localStorage.getItem(key)) || {}; }
        catch { return {}; }
    }

    function init() {
        const progress = readJSON('ce-ai:progress');
        const completedKeys = new Set(Object.keys(progress));
        if (!completedKeys.size) return;

        // Annotate chapter cards on the homepage
        document.querySelectorAll('a.chapter-card, a.sub-card').forEach(card => {
            const href = card.getAttribute('href');
            if (!href) return;
            // Normalise relative href -> path key matching pageKey from sub-common
            const normalized = href.replace(/^\.\//, '').replace(/^\//, '');
            // Match either exact or any progress key that ends with this href
            const isDone = completedKeys.has(normalized)
                || [...completedKeys].some(k => k.endsWith('/' + normalized) || k === normalized);
            if (isDone) card.setAttribute('data-progress', 'completed');
        });

        // Summary banner on the homepage
        const hero = document.querySelector('.hero-stats');
        if (hero && !document.getElementById('progress-resume')) {
            const total = (window.CE_SEARCH_INDEX || []).filter(e => e.n > 0).length;
            const done  = completedKeys.size;
            if (done > 0) {
                const banner = document.createElement('div');
                banner.id = 'progress-resume';
                banner.style.cssText = 'margin:1.5rem auto 0;max-width:520px;padding:.8rem 1.2rem;background:rgba(0,212,170,.08);border:1px solid rgba(0,212,170,.25);border-radius:12px;font-size:.85rem;color:var(--text-secondary);display:flex;gap:.75rem;align-items:center;justify-content:center;flex-wrap:wrap;';
                banner.innerHTML = `<i class="fa-solid fa-bookmark" style="color:var(--accent-primary)"></i> You've completed <strong>${done}</strong>${total ? ' of ' + total : ''} lessons. <a href="#chapters" style="color:var(--accent-primary);text-decoration:underline;">Continue</a>`;
                hero.parentNode.insertBefore(banner, hero.nextSibling);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
