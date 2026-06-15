/* ============================================================
   Projectile Motion — Interactive logic (B&W glass build)
   - Renders past-question MCQs into their sections
   - Answering, scoring, explanations, exam-board filter
   - LIVE projectile launch simulator (angle / speed / gravity)
   - Animated particles, scroll-reveal, theme, progress
   ============================================================ */

(function () {
    "use strict";

    const state = { answered: {}, correctCount: 0, activeBoard: "all" };

    const ICONS = {
        bolt: '<path fill="currentColor" d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/>',
        tag: '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3 11V4a1 1 0 0 1 1-1h7l9 9-8 8-9-9z"/><circle cx="7.5" cy="7.5" r="1.4" fill="currentColor"/>'
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
        card.dataset.year = q.board;          // filter key = exam board

        const top = el("div", "q-top");
        top.appendChild(el("div", "q-no", displayNo));
        top.appendChild(el("p", "q-text", q.text));
        card.appendChild(top);

        const tags = el("div", "q-tags");
        tags.appendChild(el("span", "tag year",
            `<svg viewBox="0 0 24 24">${ICONS.tag}</svg>${q.exam}`));
        card.appendChild(tags);

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
        const exp = card.querySelector(".explanation");
        exp.classList.add("show");
        typeset(exp);
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
                `<h3><svg viewBox="0 0 24 24">${ICONS.bolt}</svg>Exam-Asked Questions</h3>` +
                `<span class="q-count">${qs.length} item${qs.length > 1 ? "s" : ""}</span>`;
            container.appendChild(head);

            qs.forEach((q, i) => container.appendChild(buildQuestion(q, i + 1)));
            container.appendChild(el("div", "no-result", "No questions match the selected exam board."));
        });
        typeset();
        updateProgress();
    }

    function updateScore() {
        const done = Object.keys(state.answered).length;
        document.getElementById("scoreChip").textContent =
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

    /* ---------- exam-board filter ---------- */
    function applyFilter(board) {
        state.activeBoard = board;
        document.querySelectorAll(".filter-pill").forEach(p =>
            p.classList.toggle("active", p.dataset.year === board));

        document.querySelectorAll(".questions[data-section]").forEach(container => {
            let visible = 0;
            container.querySelectorAll(".question").forEach(card => {
                const show = board === "all" || card.dataset.year === board;
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

    /* ============================================================
       INTERACTIVE PROJECTILE LAUNCH SIMULATOR
       ============================================================ */
    function setupSimulator() {
        const stage = document.getElementById("simStage");
        if (!stage) return;

        const NS = "http://www.w3.org/2000/svg";
        const angleEl = document.getElementById("simAngle");
        const speedEl = document.getElementById("simSpeed");
        const angleOut = document.getElementById("simAngleVal");
        const speedOut = document.getElementById("simSpeedVal");
        const twinEl = document.getElementById("simTwin");
        const launchBtn = document.getElementById("simLaunch");

        const els = {
            ground: document.getElementById("simGround"),
            path: document.getElementById("simPath"),
            twin: document.getElementById("simTwinPath"),
            vel: document.getElementById("simVel"),
            rangeLine: document.getElementById("simRange"),
            heightLine: document.getElementById("simHeight"),
            apex: document.getElementById("simApex"),
            ball: document.getElementById("simBall"),
            rLbl: document.getElementById("simRangeLbl"),
            hLbl: document.getElementById("simHeightLbl"),
            aLbl: document.getElementById("simAngleArc")
        };
        const out = {
            R: document.getElementById("outR"),
            H: document.getElementById("outH"),
            T: document.getElementById("outT"),
            V: document.getElementById("outV")
        };

        const OX = 60, GY = 322, PW = 556, PH = 296;
        let g = 9.8;
        let cur = null, raf = null, startTs = null;

        function flight(u, angDeg, gg) {
            const a = angDeg * Math.PI / 180;
            const ux = u * Math.cos(a), uy = u * Math.sin(a);
            const T = 2 * uy / gg;
            const R = ux * T;
            const H = (uy * uy) / (2 * gg);
            const pts = [];
            const N = 64;
            for (let i = 0; i <= N; i++) {
                const t = T * i / N;
                pts.push([ux * t, uy * t - 0.5 * gg * t * t]);
            }
            return { T, R, H, ux, uy, pts, ang: angDeg };
        }

        function draw() {
            const u = +speedEl.value;
            const ang = +angleEl.value;
            angleOut.textContent = ang + "°";
            speedOut.textContent = u + " m/s";

            const main = flight(u, ang, g);
            const showTwin = twinEl.checked && ang !== 45;
            const twin = showTwin ? flight(u, 90 - ang, g) : null;

            const maxX = main.R;
            const maxY = Math.max(main.H, twin ? twin.H : 0);
            const scale = Math.min(PW / Math.max(maxX, 0.6), PH / Math.max(maxY, 0.6));

            const S = p => [OX + p[0] * scale, GY - p[1] * scale];
            const toD = pts => "M " + pts.map(S).map(p => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L ");

            els.path.setAttribute("d", toD(main.pts));
            if (twin) {
                els.twin.setAttribute("d", toD(twin.pts));
                els.twin.style.display = "";
            } else {
                els.twin.style.display = "none";
            }

            // apex + height line
            const apex = S([main.R / 2, main.H]);
            els.apex.setAttribute("cx", apex[0]);
            els.apex.setAttribute("cy", apex[1]);
            els.heightLine.setAttribute("x1", apex[0]);
            els.heightLine.setAttribute("y1", apex[1]);
            els.heightLine.setAttribute("x2", apex[0]);
            els.heightLine.setAttribute("y2", GY);
            els.hLbl.setAttribute("x", apex[0] + 6);
            els.hLbl.setAttribute("y", (apex[1] + GY) / 2);
            els.hLbl.textContent = "H = " + main.H.toFixed(1) + " m";

            // range line + label
            const land = S([main.R, 0]);
            els.rangeLine.setAttribute("x1", OX);
            els.rangeLine.setAttribute("y1", GY + 16);
            els.rangeLine.setAttribute("x2", land[0]);
            els.rangeLine.setAttribute("y2", GY + 16);
            els.rLbl.setAttribute("x", (OX + land[0]) / 2);
            els.rLbl.setAttribute("y", GY + 32);
            els.rLbl.textContent = "R = " + main.R.toFixed(1) + " m";

            // launch velocity vector (fixed visual length)
            const L = 66;
            const a = ang * Math.PI / 180;
            els.vel.setAttribute("x1", OX);
            els.vel.setAttribute("y1", GY);
            els.vel.setAttribute("x2", OX + L * Math.cos(a));
            els.vel.setAttribute("y2", GY - L * Math.sin(a));

            // launch-angle arc label
            els.aLbl.setAttribute("x", OX + 30);
            els.aLbl.setAttribute("y", GY - 8);
            els.aLbl.textContent = "θ = " + ang + "°";

            // readouts
            out.R.textContent = main.R.toFixed(1);
            out.H.textContent = main.H.toFixed(1);
            out.T.textContent = main.T.toFixed(2);
            out.V.textContent = main.ux.toFixed(1);

            cur = { main, scale, S };
            // park the ball at the start
            const s0 = S([0, 0]);
            els.ball.setAttribute("cx", s0[0]);
            els.ball.setAttribute("cy", s0[1]);
        }

        function launch() {
            if (!cur) draw();
            cancelAnimationFrame(raf);
            const { main, S } = cur;
            const dur = Math.min(2300, Math.max(950, main.T * 250));
            startTs = null;
            els.ball.classList.add("flying");
            function step(ts) {
                if (!startTs) startTs = ts;
                const p = Math.min(1, (ts - startTs) / dur);
                const t = p * main.T;
                const x = main.ux * t;
                const y = main.uy * t - 0.5 * g * t * t;
                const s = S([x, Math.max(0, y)]);
                els.ball.setAttribute("cx", s[0]);
                els.ball.setAttribute("cy", s[1]);
                if (p < 1) {
                    raf = requestAnimationFrame(step);
                } else {
                    els.ball.classList.remove("flying");
                }
            }
            raf = requestAnimationFrame(step);
        }

        angleEl.addEventListener("input", draw);
        speedEl.addEventListener("input", draw);
        twinEl.addEventListener("change", draw);
        angleEl.addEventListener("change", launch);
        speedEl.addEventListener("change", launch);
        launchBtn.addEventListener("click", launch);

        document.querySelectorAll(".g-pill").forEach(p => {
            p.addEventListener("click", () => {
                g = parseFloat(p.dataset.g);
                document.querySelectorAll(".g-pill").forEach(x =>
                    x.classList.toggle("active", x === p));
                draw();
                launch();
            });
        });

        els.ground.setAttribute("x1", 18);
        els.ground.setAttribute("y1", GY);
        els.ground.setAttribute("x2", 632);
        els.ground.setAttribute("y2", GY);

        draw();
        // gentle auto-launch once visible
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) { launch(); io.disconnect(); } });
        }, { threshold: 0.4 });
        io.observe(stage);
    }

    /* ---------- theme toggle (white ⇄ inverted, both B&W) ---------- */
    function setupTheme() {
        const btn = document.getElementById("themeBtn");
        const saved = localStorage.getItem("pm-theme");
        if (saved) document.documentElement.setAttribute("data-theme", saved);
        btn.addEventListener("click", () => {
            const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
            const next = cur === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", next);
            localStorage.setItem("pm-theme", next);
        });
    }

    /* ---------- animated background particles ---------- */
    function setupBackground() {
        const box = document.getElementById("bgParticles");
        if (!box) return;
        for (let i = 0; i < 26; i++) {
            const p = el("span", "p");
            p.style.left = (Math.random() * 100).toFixed(2) + "%";
            p.style.top = (Math.random() * 100).toFixed(2) + "%";
            const s = (2 + Math.random() * 3).toFixed(1) + "px";
            p.style.width = s; p.style.height = s;
            p.style.setProperty("--dur", (3 + Math.random() * 5).toFixed(2) + "s");
            p.style.setProperty("--delay", (Math.random() * 5).toFixed(2) + "s");
            box.appendChild(p);
        }
        for (let i = 0; i < 6; i++) {
            const o = el("span", "orbiter" + (i % 2 ? " rev" : ""));
            o.style.setProperty("--x", (8 + Math.random() * 84).toFixed(0) + "%");
            o.style.setProperty("--y", (10 + Math.random() * 80).toFixed(0) + "%");
            o.style.setProperty("--size", (90 + Math.random() * 170).toFixed(0) + "px");
            o.style.setProperty("--dur", (12 + Math.random() * 16).toFixed(0) + "s");
            box.appendChild(o);
        }
        document.querySelectorAll(".section-head .badge").forEach(b => {
            if (!b.querySelector("i")) b.appendChild(el("i"));
        });
    }

    /* ---------- scroll reveal ---------- */
    function revealOnScroll() {
        const targets = document.querySelectorAll(".card, .question, .diagram, .hy-item, .stat, .sim-wrap");
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
        setupSimulator();
        setupBackground();
        revealOnScroll();
        setupTheme();
        setupToTop();
        updateScore();
        document.querySelectorAll(".filter-pill").forEach(p =>
            p.addEventListener("click", () => applyFilter(p.dataset.year)));
        document.getElementById("resetBtn").addEventListener("click", resetQuiz);
    });
})();
