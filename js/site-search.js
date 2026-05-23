/* ============================================
   SITE SEARCH
   Client-side fuzzy filter over CE_SEARCH_INDEX.
   No dependencies, no network calls.
   ============================================ */
(function () {
    'use strict';
    const input    = document.getElementById('site-search-input');
    const resultsEl = document.getElementById('site-search-results');
    if (!input || !resultsEl || !window.CE_SEARCH_INDEX) return;

    const INDEX = window.CE_SEARCH_INDEX;
    const MAX_RESULTS = 12;

    function escape(s) {
        return s.replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function score(entry, terms) {
        const haystack = (entry.title + ' ' + (entry.tags || '')).toLowerCase();
        let s = 0;
        for (const t of terms) {
            if (!t) continue;
            const idx = haystack.indexOf(t);
            if (idx === -1) return -1;
            s += 10;
            if (entry.title.toLowerCase().indexOf(t) !== -1) s += 8;
            if (idx === 0) s += 4;
        }
        return s;
    }

    function render(matches, query) {
        if (!matches.length) {
            resultsEl.innerHTML = `<div class="ssr-empty">No lessons match "<strong>${escape(query)}</strong>". Try a broader term.</div>`;
            resultsEl.classList.add('open');
            return;
        }
        resultsEl.innerHTML = matches.slice(0, MAX_RESULTS).map(m => `
            <a href="${m.href}" role="option">
                <span class="ssr-chapter">Chapter ${m.ch}${m.n ? ' · Lesson ' + m.ch + '.' + m.n : ' · Hub'}</span>
                ${escape(m.title)}
            </a>
        `).join('');
        resultsEl.classList.add('open');
    }

    function search(q) {
        const query = q.trim().toLowerCase();
        if (!query) { resultsEl.classList.remove('open'); return; }
        const terms = query.split(/\s+/);
        const matches = INDEX
            .map(e => ({ e, s: score(e, terms) }))
            .filter(x => x.s > 0)
            .sort((a, b) => b.s - a.s)
            .map(x => x.e);
        render(matches, query);
    }

    let timer;
    input.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => search(input.value), 80);
    });
    input.addEventListener('focus', () => { if (input.value.trim()) search(input.value); });
    document.addEventListener('click', e => {
        if (!e.target.closest('.site-search')) resultsEl.classList.remove('open');
    });
    input.addEventListener('keydown', e => {
        if (e.key === 'Escape') { input.value = ''; resultsEl.classList.remove('open'); }
        if (e.key === 'Enter') {
            const first = resultsEl.querySelector('a');
            if (first) location.href = first.href;
        }
    });
})();
