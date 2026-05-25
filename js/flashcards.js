/* ============================================
   FLASHCARDS  ·  Spaced-Repetition from Quiz Questions
   - Extracts cards from any sub-chapter's `.quiz-block` elements
   - Stores them in localStorage under `ce-ai:cards`
   - Schedules reviews using a simplified SM-2 algorithm
   - Powers both auto-collection on sub pages and the standalone
     flashcards.html review interface.
   ============================================ */
(function () {
    'use strict';

    const LS_CARDS = 'ce-ai:cards';

    // ---------- Storage ----------
    function readJSON(key, fb) {
        try { return JSON.parse(localStorage.getItem(key)) || fb; }
        catch { return fb; }
    }
    function writeJSON(key, val) {
        try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
    }

    function getCards()     { return readJSON(LS_CARDS, {}); }
    function saveCards(map) { writeJSON(LS_CARDS, map); }

    // ---------- Extraction ----------
    /**
     * Extract flashcards from a parsed sub-chapter document.
     * @param {Document|HTMLElement} root - document or container with `.quiz-block` children.
     * @param {string} pageHref - relative href like "chapter1/sub1.html".
     * @param {string} [pageTitle] - optional title; auto-derived from `h1` if omitted.
     * @returns {Array<Card>}
     */
    function extractCards(root, pageHref, pageTitle) {
        if (!root) return [];
        const blocks = root.querySelectorAll('.quiz-block');
        if (!blocks.length) return [];

        const title = pageTitle ||
            (root.querySelector('h1')?.textContent || pageHref).trim();

        const out = [];
        blocks.forEach(block => {
            const blockId = block.id;
            if (!blockId) return;

            const qEl = block.querySelector('.quiz-question');
            const question = (qEl?.textContent || '').replace(/\s+/g, ' ').trim();
            if (!question) return;

            const opts = Array.from(block.querySelectorAll('.quiz-option')).map(o => ({
                text: stripLeadingIcon(o.textContent),
                correct: o.getAttribute('data-correct') === 'true'
            }));
            if (!opts.length || !opts.some(o => o.correct)) return;

            const explEl = block.querySelector('.quiz-feedback.correct');
            const explanation = explEl
                ? stripLeadingIcon(explEl.textContent).replace(/^Correct!?\s*/i, '').trim()
                : '';

            out.push({
                id: pageHref + '#' + blockId,
                page: pageHref,
                pageTitle: title,
                blockId,
                question,
                options: opts,
                explanation
            });
        });
        return out;
    }

    function stripLeadingIcon(text) {
        // Buttons start with a Font Awesome icon node; once stringified the icon
        // becomes whitespace, so normalising whitespace and trimming is enough.
        return (text || '').replace(/\s+/g, ' ').trim();
    }

    // ---------- Spaced repetition (SM-2 lite) ----------
    // Ratings: 0 = Again, 1 = Hard, 2 = Good, 3 = Easy
    function freshSR(now) {
        return {
            ease: 2.5,
            interval: 0,
            reps: 0,
            lapses: 0,
            due: now,
            lastReviewed: null
        };
    }

    function scheduleReview(sr, rating, nowMs) {
        const s = Object.assign({}, sr);
        if (rating === 0) {
            // Again — relearn in ~10 minutes
            s.lapses += 1;
            s.reps = 0;
            s.interval = 10 / (60 * 24);          // 10 min in days
            s.ease = Math.max(1.3, s.ease - 0.20);
        } else if (rating === 1) {
            // Hard
            const base = s.reps === 0 ? 1 : Math.max(1, s.interval) * 1.2;
            s.interval = base;
            s.reps += 1;
            s.ease = Math.max(1.3, s.ease - 0.15);
        } else if (rating === 2) {
            // Good
            if (s.reps === 0) s.interval = 1;
            else if (s.reps === 1) s.interval = 3;
            else s.interval = s.interval * s.ease;
            s.reps += 1;
        } else {
            // Easy
            if (s.reps === 0) s.interval = 2;
            else if (s.reps === 1) s.interval = 5;
            else s.interval = s.interval * s.ease * 1.3;
            s.reps += 1;
            s.ease = Math.min(3.0, s.ease + 0.10);
        }
        const dayMs = 24 * 60 * 60 * 1000;
        s.due = new Date(nowMs + s.interval * dayMs).toISOString();
        s.lastReviewed = new Date(nowMs).toISOString();
        return s;
    }

    // ---------- Card-collection helpers ----------
    /**
     * Add cards to the store. New cards get a fresh SR state; existing cards keep
     * their SR state but get question/option/explanation refreshed in case the
     * source was edited.
     */
    function mergeCards(newCards) {
        const store = getCards();
        const nowISO = new Date().toISOString();
        let added = 0, updated = 0;
        newCards.forEach(c => {
            const existing = store[c.id];
            if (existing) {
                existing.question    = c.question;
                existing.options     = c.options;
                existing.explanation = c.explanation;
                existing.pageTitle   = c.pageTitle;
                existing.updatedAt   = nowISO;
                updated++;
            } else {
                store[c.id] = Object.assign({}, c, {
                    addedAt: nowISO,
                    updatedAt: nowISO,
                    sr: freshSR(nowISO)
                });
                added++;
            }
        });
        saveCards(store);
        return { added, updated, total: Object.keys(store).length };
    }

    /**
     * Auto-collect cards from the current sub-chapter page (no-op if not a sub page).
     */
    function collectFromCurrentPage() {
        const m = location.pathname.match(/\/(chapter\d+\/sub\d+\.html?)$/i);
        if (!m) return null;
        const pageHref = m[1];
        const cards = extractCards(document, pageHref);
        if (!cards.length) return null;
        return mergeCards(cards);
    }

    // ---------- Bulk build (fetch every sub page once) ----------
    async function buildFullDeck(onProgress) {
        const index = (window.CE_SEARCH_INDEX || []).filter(e => e.n > 0 && e.href);
        if (!index.length) throw new Error('Search index unavailable');

        // Compute base path relative to current page (flashcards.html lives at site root)
        const base = location.pathname.replace(/[^/]+$/, '');
        const parser = new DOMParser();
        let done = 0;
        let added = 0, updated = 0;
        const CONCURRENCY = 4;

        async function fetchOne(entry) {
            try {
                const res = await fetch(base + entry.href, { credentials: 'same-origin' });
                if (!res.ok) return;
                const html = await res.text();
                const doc = parser.parseFromString(html, 'text/html');
                const cards = extractCards(doc, entry.href, entry.title);
                if (cards.length) {
                    const r = mergeCards(cards);
                    added += r.added;
                    updated += r.updated;
                }
            } catch { /* swallow per-page errors */ }
            finally {
                done++;
                if (typeof onProgress === 'function') {
                    onProgress({ done, total: index.length, added, updated });
                }
            }
        }

        // Simple concurrency pool
        const queue = index.slice();
        const workers = Array.from({ length: CONCURRENCY }, async () => {
            while (queue.length) {
                const job = queue.shift();
                await fetchOne(job);
            }
        });
        await Promise.all(workers);
        return { added, updated, total: Object.keys(getCards()).length };
    }

    // ---------- Stats ----------
    function getStats(nowMs = Date.now()) {
        const store = getCards();
        const arr = Object.values(store);
        const due  = arr.filter(c => new Date(c.sr.due).getTime() <= nowMs);
        const learning = arr.filter(c => c.sr.reps > 0 && c.sr.reps < 2);
        const known    = arr.filter(c => c.sr.reps >= 2);
        const fresh    = arr.filter(c => c.sr.reps === 0);
        const nextDue  = arr
            .map(c => new Date(c.sr.due).getTime())
            .filter(t => t > nowMs)
            .sort((a, b) => a - b)[0];
        return {
            total: arr.length,
            due: due.length,
            fresh: fresh.length,
            learning: learning.length,
            known: known.length,
            nextDueAt: nextDue || null
        };
    }

    function pickDueQueue(nowMs = Date.now(), limit = Infinity) {
        const arr = Object.values(getCards())
            .filter(c => new Date(c.sr.due).getTime() <= nowMs)
            // Show new cards first, then by how overdue they are
            .sort((a, b) => {
                if (a.sr.reps === 0 && b.sr.reps !== 0) return -1;
                if (b.sr.reps === 0 && a.sr.reps !== 0) return 1;
                return new Date(a.sr.due) - new Date(b.sr.due);
            });
        return limit === Infinity ? arr : arr.slice(0, limit);
    }

    function rateCard(cardId, rating) {
        const store = getCards();
        const card = store[cardId];
        if (!card) return null;
        card.sr = scheduleReview(card.sr, rating, Date.now());
        saveCards(store);
        return card;
    }

    function resetAll() {
        saveCards({});
    }

    function exportJson() {
        return JSON.stringify(getCards(), null, 2);
    }

    // ---------- Public API ----------
    window.CE_Flashcards = {
        extractCards,
        mergeCards,
        collectFromCurrentPage,
        buildFullDeck,
        getCards,
        getStats,
        pickDueQueue,
        rateCard,
        scheduleReview,
        resetAll,
        exportJson
    };
})();


/* ============================================
   FLASHCARDS PAGE CONTROLLER  (runs only on flashcards.html)
   ============================================ */
(function () {
    'use strict';
    const root = document.getElementById('flashcards-app');
    if (!root) return;

    const FC = window.CE_Flashcards;
    let session = { queue: [], current: null, reviewed: 0, ratings: { 0:0,1:0,2:0,3:0 } };

    const els = {
        stats:   root.querySelector('#fc-stats'),
        empty:   root.querySelector('#fc-empty'),
        review:  root.querySelector('#fc-review'),
        finish:  root.querySelector('#fc-finish'),
        qText:   root.querySelector('#fc-question'),
        qSource: root.querySelector('#fc-source'),
        opts:    root.querySelector('#fc-options'),
        expl:    root.querySelector('#fc-explanation'),
        showBtn: root.querySelector('#fc-show'),
        rating:  root.querySelector('#fc-rating'),
        progress:root.querySelector('#fc-progress'),
        startBtn:root.querySelector('#fc-start'),
        buildBtn:root.querySelector('#fc-build'),
        buildLog:root.querySelector('#fc-build-log'),
        resetBtn:root.querySelector('#fc-reset'),
        exportBtn:root.querySelector('#fc-export'),
        finishStats: root.querySelector('#fc-finish-stats'),
        finishAgain: root.querySelector('#fc-finish-again')
    };

    function fmtCountdown(ms) {
        if (ms <= 0) return 'now';
        const s = Math.round(ms / 1000);
        if (s < 60)        return s + ' s';
        if (s < 3600)      return Math.round(s / 60) + ' min';
        if (s < 86400)     return Math.round(s / 3600) + ' hr';
        return Math.round(s / 86400) + ' d';
    }

    function renderStats() {
        const s = FC.getStats();
        const next = s.nextDueAt ? fmtCountdown(s.nextDueAt - Date.now()) : '—';
        els.stats.innerHTML = `
            <div class="fc-stat"><span class="fc-stat__num">${s.due}</span><span class="fc-stat__lbl">Due now</span></div>
            <div class="fc-stat"><span class="fc-stat__num">${s.fresh}</span><span class="fc-stat__lbl">New</span></div>
            <div class="fc-stat"><span class="fc-stat__num">${s.learning}</span><span class="fc-stat__lbl">Learning</span></div>
            <div class="fc-stat"><span class="fc-stat__num">${s.known}</span><span class="fc-stat__lbl">Known</span></div>
            <div class="fc-stat"><span class="fc-stat__num">${s.total}</span><span class="fc-stat__lbl">Total cards</span></div>
            <div class="fc-stat"><span class="fc-stat__num">${next}</span><span class="fc-stat__lbl">Next due in</span></div>
        `;
        els.startBtn.disabled = s.due === 0;
        els.startBtn.textContent = s.due === 0
            ? (s.total === 0 ? 'No cards yet' : 'All caught up')
            : `Review ${s.due} card${s.due === 1 ? '' : 's'}`;
    }

    function showStartScreen() {
        els.review.hidden = true;
        els.finish.hidden = true;
        els.empty.hidden = FC.getStats().total > 0;
        renderStats();
    }

    function startSession() {
        const queue = FC.pickDueQueue();
        if (!queue.length) return;
        session = { queue, current: null, reviewed: 0, ratings: { 0:0,1:0,2:0,3:0 } };
        els.empty.hidden = true;
        els.finish.hidden = true;
        els.review.hidden = false;
        nextCard();
    }

    function nextCard() {
        if (!session.queue.length) {
            finishSession();
            return;
        }
        session.current = session.queue.shift();
        renderCard(session.current);
        updateProgress();
    }

    function renderCard(card) {
        els.qText.textContent = card.question;
        els.qSource.innerHTML = `<i class="fa-solid fa-link"></i> <a href="${card.page}#${card.blockId}">${card.pageTitle}</a>`;
        els.opts.innerHTML = card.options.map((o, i) => `
            <li class="fc-option" data-correct="${o.correct}">
                <span class="fc-option__letter">${String.fromCharCode(65 + i)}</span>
                <span class="fc-option__text">${escapeHtml(o.text)}</span>
            </li>
        `).join('');
        els.opts.classList.remove('revealed');
        els.expl.hidden = true;
        els.expl.textContent = '';
        els.rating.hidden = true;
        els.showBtn.hidden = false;
        els.showBtn.disabled = false;
    }

    function revealAnswer() {
        els.opts.classList.add('revealed');
        const card = session.current;
        if (card.explanation) {
            els.expl.hidden = false;
            els.expl.textContent = card.explanation;
        }
        els.rating.hidden = false;
        els.showBtn.hidden = true;
    }

    function rate(rating) {
        if (!session.current) return;
        FC.rateCard(session.current.id, rating);
        session.reviewed += 1;
        session.ratings[rating] = (session.ratings[rating] || 0) + 1;
        nextCard();
    }

    function updateProgress() {
        const done = session.reviewed;
        const total = done + 1 + session.queue.length;
        const pct = total ? Math.round((done / total) * 100) : 0;
        els.progress.style.setProperty('--pct', pct + '%');
        els.progress.setAttribute('aria-valuenow', String(pct));
        els.progress.querySelector('.fc-progress__label').textContent =
            `${done} of ${total} reviewed`;
    }

    function finishSession() {
        els.review.hidden = true;
        els.finish.hidden = false;
        const r = session.ratings;
        els.finishStats.innerHTML = `
            <div class="fc-stat"><span class="fc-stat__num">${session.reviewed}</span><span class="fc-stat__lbl">Reviewed</span></div>
            <div class="fc-stat"><span class="fc-stat__num">${r[3] || 0}</span><span class="fc-stat__lbl">Easy</span></div>
            <div class="fc-stat"><span class="fc-stat__num">${r[2] || 0}</span><span class="fc-stat__lbl">Good</span></div>
            <div class="fc-stat"><span class="fc-stat__num">${r[1] || 0}</span><span class="fc-stat__lbl">Hard</span></div>
            <div class="fc-stat"><span class="fc-stat__num">${r[0] || 0}</span><span class="fc-stat__lbl">Again</span></div>
        `;
        renderStats();
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, m => ({
            '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
        }[m]));
    }

    async function handleBuild() {
        if (!Array.isArray(window.CE_SEARCH_INDEX)) {
            els.buildLog.textContent = 'Search index not loaded yet. Try again in a moment.';
            return;
        }
        els.buildBtn.disabled = true;
        els.buildLog.textContent = 'Fetching lessons…';
        try {
            const result = await FC.buildFullDeck(p => {
                els.buildLog.textContent =
                    `Fetched ${p.done}/${p.total} lessons · ${p.added} new, ${p.updated} updated`;
            });
            els.buildLog.textContent =
                `Done! ${result.added} new cards added, ${result.updated} refreshed · ${result.total} total in deck`;
        } catch (e) {
            els.buildLog.textContent = 'Build failed: ' + (e && e.message || e);
        } finally {
            els.buildBtn.disabled = false;
            renderStats();
            els.empty.hidden = FC.getStats().total > 0;
        }
    }

    function handleReset() {
        if (!confirm('Erase ALL flashcards and progress? This cannot be undone.')) return;
        FC.resetAll();
        showStartScreen();
    }

    function handleExport() {
        const blob = new Blob([FC.exportJson()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ce-ai-flashcards.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    function bind() {
        els.startBtn.addEventListener('click', startSession);
        els.showBtn.addEventListener('click', revealAnswer);
        els.rating.addEventListener('click', e => {
            const btn = e.target.closest('button[data-rating]');
            if (!btn) return;
            rate(parseInt(btn.dataset.rating, 10));
        });
        els.buildBtn.addEventListener('click', handleBuild);
        els.resetBtn.addEventListener('click', handleReset);
        els.exportBtn.addEventListener('click', handleExport);
        els.finishAgain.addEventListener('click', () => {
            renderStats();
            const s = FC.getStats();
            if (s.due > 0) startSession();
            else showStartScreen();
        });
        // Keyboard: Space to reveal, 1-4 to rate
        document.addEventListener('keydown', e => {
            if (els.review.hidden) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === ' ' || e.key === 'Enter') {
                if (!els.showBtn.hidden) { e.preventDefault(); revealAnswer(); }
            } else if (!els.rating.hidden && /^[1-4]$/.test(e.key)) {
                e.preventDefault();
                rate(parseInt(e.key, 10) - 1);
            }
        });
    }

    function start() {
        bind();
        showStartScreen();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
