/* ============================================
   PROGRESS DISPLAY
   Reads ce-ai:progress / ce-ai:quiz / ce-ai:bookmarks from localStorage
   and annotates chapter / sub cards on the homepage and chapter hubs.
   Also injects a chapter-level rollup (total reading time + completion bar)
   on each chapter hub.
   ============================================ */
(function () {
    'use strict';

    function readJSON(key) {
        try { return JSON.parse(localStorage.getItem(key)) || {}; }
        catch { return {}; }
    }

    /* Parse "20 min" / "1 hr 5 min" style strings into total minutes. */
    function parseMinutes(text) {
        if (!text) return 0;
        const t = text.toLowerCase();
        let m = 0;
        const hr  = t.match(/(\d+)\s*(?:h|hr|hour)/);
        const min = t.match(/(\d+)\s*(?:m|min|minute)/);
        if (hr)  m += parseInt(hr[1], 10) * 60;
        if (min) m += parseInt(min[1], 10);
        if (!hr && !min) {
            const n = t.match(/(\d+)/);
            if (n) m = parseInt(n[1], 10);
        }
        return m;
    }

    function formatMinutes(total) {
        if (total >= 60) {
            const h = Math.floor(total / 60);
            const m = total % 60;
            return m ? `${h} hr ${m} min` : `${h} hr`;
        }
        return `${total} min`;
    }

    function isCompletedHref(href, completedKeys) {
        if (!href) return false;
        const normalized = href.replace(/^\.\//, '').replace(/^\//, '');
        if (completedKeys.has(normalized)) return true;
        for (const k of completedKeys) {
            if (k === normalized || k.endsWith('/' + normalized)) return true;
        }
        return false;
    }

    /* Annotate chapter cards on the homepage and sub cards on chapter hubs. */
    function annotateCards(completedKeys, bookmarkedKeys) {
        document.querySelectorAll('a.chapter-card, a.sub-card').forEach(card => {
            const href = card.getAttribute('href');
            if (!href) return;
            if (isCompletedHref(href, completedKeys)) {
                card.setAttribute('data-progress', 'completed');
            }
            if (isCompletedHref(href, bookmarkedKeys)) {
                card.setAttribute('data-bookmarked', 'true');
            }
        });
    }

    /* Homepage resume banner. */
    function injectHomepageBanner(completedKeys) {
        const hero = document.querySelector('.hero-stats');
        if (!hero || document.getElementById('progress-resume')) return;
        const total = (window.CE_SEARCH_INDEX || []).filter(e => e.n > 0).length;
        const done  = completedKeys.size;
        if (!done) return;
        const banner = document.createElement('div');
        banner.id = 'progress-resume';
        banner.style.cssText = 'margin:1.5rem auto 0;max-width:520px;padding:.8rem 1.2rem;background:rgba(0,212,170,.08);border:1px solid rgba(0,212,170,.25);border-radius:12px;font-size:.85rem;color:var(--text-secondary);display:flex;gap:.75rem;align-items:center;justify-content:center;flex-wrap:wrap;';
        banner.innerHTML = `<i class="fa-solid fa-bookmark" style="color:var(--accent-primary)"></i> You've completed <strong>${done}</strong>${total ? ' of ' + total : ''} lessons. <a href="#chapters" style="color:var(--accent-primary);text-decoration:underline;">Continue</a>`;
        hero.parentNode.insertBefore(banner, hero.nextSibling);
    }

    /* Chapter-hub rollup: total reading time, completed minutes, progress bar. */
    function injectChapterRollup(completedKeys) {
        // Only run on chapter hubs (page with .sub-grid + .hub-hero)
        const subGrid = document.querySelector('.sub-grid');
        const heroStats = document.querySelector('.hub-stats');
        if (!subGrid || !heroStats) return;
        if (document.getElementById('chapter-rollup')) return;

        const cards = Array.from(subGrid.querySelectorAll('a.sub-card'));
        if (!cards.length) return;

        let totalMin = 0, doneMin = 0, doneCount = 0;
        cards.forEach(card => {
            const metaItems = card.querySelectorAll('.sub-card__meta-item, .sub-card__meta span');
            let mins = 0;
            metaItems.forEach(el => {
                const t = el.textContent || '';
                if (/min|hr|hour/i.test(t)) mins = Math.max(mins, parseMinutes(t));
            });
            totalMin += mins;
            const href = card.getAttribute('href');
            if (isCompletedHref(href, completedKeys)) {
                doneCount++;
                doneMin += mins;
            }
        });

        if (!totalMin && !doneCount) return;
        const pct = totalMin ? Math.round((doneMin / totalMin) * 100) : 0;
        const remaining = Math.max(0, totalMin - doneMin);

        const rollup = document.createElement('section');
        rollup.id = 'chapter-rollup';
        rollup.className = 'chapter-rollup';
        rollup.setAttribute('aria-label', 'Chapter progress');
        rollup.innerHTML = `
            <div class="chapter-rollup__head">
                <div class="chapter-rollup__stat">
                    <span class="chapter-rollup__num">${doneCount}<span class="chapter-rollup__den">/${cards.length}</span></span>
                    <span class="chapter-rollup__label">Lessons complete</span>
                </div>
                <div class="chapter-rollup__stat">
                    <span class="chapter-rollup__num">${formatMinutes(totalMin)}</span>
                    <span class="chapter-rollup__label">Total reading time</span>
                </div>
                <div class="chapter-rollup__stat">
                    <span class="chapter-rollup__num">${formatMinutes(remaining)}</span>
                    <span class="chapter-rollup__label">Remaining</span>
                </div>
            </div>
            <div class="chapter-rollup__bar" role="progressbar"
                 aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"
                 aria-label="Chapter ${pct}% complete">
                <div class="chapter-rollup__fill" style="width:${pct}%"></div>
                <span class="chapter-rollup__pct">${pct}%</span>
            </div>
        `;
        // Insert directly after the hub-hero
        const hero = document.querySelector('.hub-hero');
        if (hero && hero.parentNode) {
            hero.parentNode.insertBefore(rollup, hero.nextSibling);
        } else {
            subGrid.parentNode.insertBefore(rollup, subGrid);
        }
    }

    function init() {
        const progress  = readJSON('ce-ai:progress');
        const bookmarks = readJSON('ce-ai:bookmarks');
        const completedKeys  = new Set(Object.keys(progress));
        const bookmarkedKeys = new Set(Object.keys(bookmarks));

        annotateCards(completedKeys, bookmarkedKeys);
        injectChapterRollup(completedKeys);
        if (completedKeys.size) injectHomepageBanner(completedKeys);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
