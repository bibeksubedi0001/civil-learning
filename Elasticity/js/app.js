/* ============================================================
   Elasticity — Interactive logic (B&W glass build)
   - Renders the quiz questions into their sections
   - Answering, scoring, explanations, year filter
   - Animated particles, scroll-reveal, theme, progress
   ============================================================ */

(function () {
    "use strict";

    const state = { answered: {}, correctCount: 0, activeYear: "all" };

    const ICONS = {
        bolt: '<path fill="currentColor" d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/>',
        calendar: '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M8 2v4M16 2v4M3 9h18"/><rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>'
    };

    function el(tag, cls, html) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html != null) e.innerHTML = html;
        return e;
    }

    function typeset(node) {
        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise(node ? [node] : undefined).catch(() => { });
        }
    }

    /* ---------- build one question card ---------- */
    function buildQuestion(q, displayNo) {
        const card = el("div", "question");
        card.dataset.id = q.id;
        card.dataset.year = q.year;

        const top = el("div", "q-top");
        top.appendChild(el("div", "q-no", displayNo));
        top.appendChild(el("p", "q-text", q.text));
        card.appendChild(top);

        if (/^\d{4}$/.test(String(q.year))) {
            const tags = el("div", "q-tags");
            tags.appendChild(el("span", "tag year",
                `<svg viewBox="0 0 24 24">${ICONS.calendar}</svg>${q.year}`));
            card.appendChild(tags);
        }

        const opts = el("div", "options");
        q.options.forEach(opt => {
            const b = el("button", "option");
            b.type = "button";
            b.dataset.key = opt.key;
            b.innerHTML =
                `<span class="key">${opt.key}</span>` +
                `<span class="otext">${opt.text}</span>` +
                `<span class="mark"></span>`;
            b.addEventListener("click", () => choose(q, card, b));
            opts.appendChild(b);
        });
        card.appendChild(opts);

        card.appendChild(el("div", "explanation", `<b>Answer (${q.answer}).</b> ${q.explanation}`));
        return card;
    }

    function choose(q, card, btn) {
        if (state.answered[q.id]) return;
        const chosen = btn.dataset.key;
        state.answered[q.id] = chosen;

        card.querySelectorAll(".option").forEach(b => {
            b.disabled = true;
            const mark = b.querySelector(".mark");
            if (b.dataset.key === q.answer) {
                b.classList.add("correct");
                mark.innerHTML = "&#10003;";
            }
            if (b.dataset.key === chosen && chosen !== q.answer) {
                b.classList.add("incorrect");
                mark.innerHTML = "&#10007;";
            }
        });

        if (chosen === q.answer) state.correctCount++;
        card.querySelector(".explanation").classList.add("show");
        updateScore();
        updateProgress();
    }

    /* ---------- render sections ---------- */
    function render() {
        document.querySelectorAll(".questions[data-section]").forEach(container => {
            const sec = container.dataset.section;
            const qs = QUESTIONS.filter(q => q.section === sec);
            if (!qs.length) return;

            const head = el("div", "q-header");
            head.innerHTML =
                `<h3><svg viewBox="0 0 24 24">${ICONS.bolt}</svg>Practice Questions</h3>` +
                `<span class="q-count">${qs.length} item${qs.length > 1 ? "s" : ""}</span>`;
            container.appendChild(head);

            qs.forEach((q, i) => container.appendChild(buildQuestion(q, i + 1)));
            container.appendChild(el("div", "no-result", "No questions match the selected year."));
        });
        typeset();
        updateProgress();
    }

    function updateScore() {
        const chip = document.getElementById("scoreChip");
        if (!chip) return;
        const done = Object.keys(state.answered).length;
        chip.textContent =
            `Score ${state.correctCount}/${done} · ${QUESTIONS.length} total`;
    }

    function updateProgress() {
        const total = QUESTIONS.length;
        const done = Object.keys(state.answered).length;
        const pct = total ? Math.round((done / total) * 100) : 0;
        document.getElementById("progressBar").style.width = pct + "%";
        const hp = document.getElementById("heroProgress");
        if (hp) hp.textContent = pct + "%";
    }

    /* ---------- year filter ---------- */
    function applyFilter(year) {
        state.activeYear = year;
        document.querySelectorAll(".filter-pill").forEach(p =>
            p.classList.toggle("active", p.dataset.year === year));

        document.querySelectorAll(".questions[data-section]").forEach(container => {
            let visible = 0;
            container.querySelectorAll(".question").forEach(card => {
                const show = year === "all" || card.dataset.year === year;
                card.classList.toggle("hidden", !show);
                if (show) visible++;
            });
            const empty = container.querySelector(".no-result");
            const head = container.querySelector(".q-header");
            if (empty) empty.style.display = (head && visible === 0) ? "block" : "none";
            if (head) head.querySelector(".q-count").textContent = `${visible} item${visible !== 1 ? "s" : ""}`;
        });
    }

    function resetQuiz() {
        state.answered = {};
        state.correctCount = 0;
        document.querySelectorAll(".question").forEach(card => {
            card.querySelector(".explanation").classList.remove("show");
            card.querySelectorAll(".option").forEach(b => {
                b.disabled = false;
                b.classList.remove("correct", "incorrect");
                b.querySelector(".mark").innerHTML = "";
            });
        });
        updateScore();
        updateProgress();
    }

    /* ---------- theme toggle (white ⇄ inverted, both B&W) ---------- */
    function setupTheme() {
        const btn = document.getElementById("themeBtn");
        const saved = localStorage.getItem("el-theme");
        if (saved) document.documentElement.setAttribute("data-theme", saved);
        btn.addEventListener("click", () => {
            const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
            const next = cur === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", next);
            localStorage.setItem("el-theme", next);
        });
    }

    /* ---------- section badge accents ---------- */
    function setupBackground() {
        document.querySelectorAll(".section-head .badge").forEach(b => {
            if (!b.querySelector("i")) b.appendChild(el("i"));
        });
    }

    /* ---------- scroll reveal ---------- */
    function revealOnScroll() {
        const targets = document.querySelectorAll(".card, .question, .diagram, .hy-item, .stat");
        targets.forEach(t => t.classList.add("reveal"));
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
            });
        }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
        targets.forEach(t => io.observe(t));
        setTimeout(() => targets.forEach(t => t.classList.add("in")), 1800);
    }

    /* ---------- back to top ---------- */
    function setupToTop() {
        const btn = document.getElementById("toTop");
        window.addEventListener("scroll", () => {
            btn.classList.toggle("show", window.scrollY > 600);
        }, { passive: true });
        btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    }

    /* ---------- init ---------- */
    document.addEventListener("DOMContentLoaded", () => {
        render();
        setupBackground();
        revealOnScroll();
        setupTheme();
        setupToTop();
        updateScore();
        document.querySelectorAll(".filter-pill").forEach(p =>
            p.addEventListener("click", () => applyFilter(p.dataset.year)));
        const resetBtn = document.getElementById("resetBtn");
        if (resetBtn) resetBtn.addEventListener("click", resetQuiz);
    });
})();
