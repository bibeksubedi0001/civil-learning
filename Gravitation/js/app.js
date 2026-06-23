/* ============================================================
   Gravitation — Interactive logic (B&W glass build)
   - Renders IOE past-question MCQs into their sections
   - Answering, scoring, explanations, exam-year filter
   - LIVE interactives: inverse-square force, variation of g,
     satellite orbit simulator, escape-velocity explorer
   - Animated particles, scroll-reveal, theme, progress
   ============================================================ */

(function () {
    "use strict";

    const state = { answered: {}, correctCount: 0, activeYear: "all" };

    const ICONS = {
        bolt: '<path fill="currentColor" d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/>',
        tag: '<path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3 11V4a1 1 0 0 1 1-1h7l9 9-8 8-9-9z"/><circle cx="7.5" cy="7.5" r="1.4" fill="currentColor"/>'
    };

    /* physical constants */
    const G = 6.674e-11;            // N m² / kg²
    const M_EARTH = 5.972e24;       // kg
    const R_EARTH = 6.371e6;        // m
    const G_SURF = 9.8;             // m/s²

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

    /* lightweight live-formula helpers (instant, no MathJax re-typeset) */
    function fr(n, d) {
        return `<span class="frac"><span class="fr-n">${n}</span><span class="fr-d">${d}</span></span>`;
    }
    function rad(inner) {
        return `<span class="sqrt"><span class="rad-sign">\u221a</span><span class="rad-body">${inner}</span></span>`;
    }
    function setEqn(id, html) {
        const e = document.getElementById(id);
        if (e) e.innerHTML = html;
    }
    function sup(n) {
        const map = { '-': '\u207b', '0': '\u2070', '1': '\u00b9', '2': '\u00b2', '3': '\u00b3', '4': '\u2074', '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079' };
        return String(n).split('').map(c => map[c] || c).join('');
    }
    function sci(x, dp) {
        if (x === 0) return "0";
        const exp = Math.floor(Math.log10(Math.abs(x)));
        const mant = x / Math.pow(10, exp);
        return mant.toFixed(dp == null ? 2 : dp) + "\u00d710" + sup(exp);
    }
    function fmtTime(s) {
        const h = Math.floor(s / 3600);
        const m = Math.round((s % 3600) / 60);
        if (h > 0) return h + "h " + (m < 10 ? "0" : "") + m + "m";
        return m + " min";
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
            container.appendChild(el("div", "no-result", "No questions match the selected exam year."));
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

    /* ---------- exam-year filter ---------- */
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

    /* ============================================================
       INVERSE-SQUARE FORCE EXPLORER
       ============================================================ */
    function setupForce() {
        const stage = document.getElementById("forceStage");
        if (!stage) return;
        const m1 = document.getElementById("forceM1");
        const m2 = document.getElementById("forceM2");
        const rEl = document.getElementById("forceR");
        const m1Val = document.getElementById("forceM1Val");
        const m2Val = document.getElementById("forceM2Val");
        const rVal = document.getElementById("forceRVal");
        const massA = document.getElementById("forceMassA");
        const massB = document.getElementById("forceMassB");
        const arrowA = document.getElementById("forceArrowA");
        const arrowB = document.getElementById("forceArrowB");
        const rLine = document.getElementById("forceRLine");
        const rLbl = document.getElementById("forceRLbl");
        const fOut = document.getElementById("forceOut");
        const CX = 220, CY = 96;

        function draw() {
            const a = +m1.value, b = +m2.value, r = +rEl.value;
            m1Val.textContent = a + " kg";
            m2Val.textContent = b + " kg";
            rVal.textContent = r + " m";
            const F = G * a * b / (r * r);
            const rA = 9 + (a / 100) * 17;
            const rB = 9 + (b / 100) * 17;
            const sep = 56 + (r / 10) * 210;
            const ax = CX - sep / 2, bx = CX + sep / 2;
            massA.setAttribute("cx", ax); massA.setAttribute("cy", CY); massA.setAttribute("r", rA.toFixed(1));
            massB.setAttribute("cx", bx); massB.setAttribute("cy", CY); massB.setAttribute("r", rB.toFixed(1));
            // attraction arrows in the gap, length follows inverse-square (capped to fit)
            const gap = sep - rA - rB;
            let len = 76 / (r * r);
            len = Math.max(6, Math.min(len, gap / 2 - 7));
            arrowA.setAttribute("x1", (ax + rA).toFixed(1)); arrowA.setAttribute("y1", CY);
            arrowA.setAttribute("x2", (ax + rA + len).toFixed(1)); arrowA.setAttribute("y2", CY);
            arrowB.setAttribute("x1", (bx - rB).toFixed(1)); arrowB.setAttribute("y1", CY);
            arrowB.setAttribute("x2", (bx - rB - len).toFixed(1)); arrowB.setAttribute("y2", CY);
            rLine.setAttribute("x1", ax); rLine.setAttribute("y1", CY + 34);
            rLine.setAttribute("x2", bx); rLine.setAttribute("y2", CY + 34);
            rLbl.setAttribute("x", CX); rLbl.setAttribute("y", CY + 50);
            rLbl.textContent = "r = " + r + " m";
            fOut.textContent = sci(F) + " N";
            setEqn("forceEqn",
                `<span class="eqn">F = ${fr('G\u00b7m\u2081\u00b7m\u2082', 'r\u00b2')} = ${fr('G\u00b7' + a + '\u00b7' + b, r + '\u00b2')} = <b>${sci(F)} N</b></span>` +
                `<span class="eqn">G = 6.674\u00d710\u207b\u00b9\u00b9 N\u00b7m\u00b2/kg\u00b2</span>`
            );
        }
        [m1, m2, rEl].forEach(s => s.addEventListener("input", draw));
        draw();
    }

    /* ============================================================
       VARIATION OF g WITH DEPTH & HEIGHT
       ============================================================ */
    function setupGravityVar() {
        const stage = document.getElementById("gvarStage");
        if (!stage) return;
        const pos = document.getElementById("gvarPos");
        const posVal = document.getElementById("gvarPosVal");
        const curve = document.getElementById("gvarCurve");
        const dot = document.getElementById("gvarDot");
        const dropX = document.getElementById("gvarDropX");
        const dropY = document.getElementById("gvarDropY");
        const gOut = document.getElementById("gvarG");
        const modeOut = document.getElementById("gvarMode");
        const xL = 56, xR = 432, yB = 250, yT = 46, XMAX = 3;   // x axis: r/R from 0..3
        const mapX = xr => xL + (xr / XMAX) * (xR - xL);
        const mapY = g => yB - (g / G_SURF) * (yB - yT);
        const gOf = xr => xr <= 1 ? G_SURF * xr : G_SURF / (xr * xr);

        // static curve
        let dp = "M " + mapX(0).toFixed(1) + " " + mapY(gOf(0.0001)).toFixed(1);
        for (let i = 1; i <= 300; i++) { const xr = i / 100; dp += " L " + mapX(xr).toFixed(1) + " " + mapY(gOf(xr)).toFixed(1); }
        curve.setAttribute("d", dp);

        function draw() {
            const xr = +pos.value / 100;             // r / R
            const g = gOf(xr);
            const x = mapX(xr), y = mapY(g);
            dot.setAttribute("cx", x.toFixed(1)); dot.setAttribute("cy", y.toFixed(1));
            dropX.setAttribute("x1", x.toFixed(1)); dropX.setAttribute("y1", y.toFixed(1));
            dropX.setAttribute("x2", x.toFixed(1)); dropX.setAttribute("y2", yB);
            dropY.setAttribute("x1", xL); dropY.setAttribute("y1", y.toFixed(1));
            dropY.setAttribute("x2", x.toFixed(1)); dropY.setAttribute("y2", y.toFixed(1));
            gOut.textContent = g.toFixed(2);
            const rkm = (xr * R_EARTH / 1000);
            if (xr < 1) {
                const d = (1 - xr) * R_EARTH / 1000;
                posVal.textContent = "depth " + d.toFixed(0) + " km";
                modeOut.textContent = "Inside (depth)";
                setEqn("gvarEqn",
                    `<span class="eqn">g = g\u209b(1 \u2212 ${fr('d', 'R')}) = g\u209b\u00b7${fr('r', 'R')} = 9.8\u00b7${xr.toFixed(2)} = <b>${g.toFixed(2)} m/s\u00b2</b></span>`
                );
            } else {
                const h = (xr - 1) * R_EARTH / 1000;
                posVal.textContent = "height " + h.toFixed(0) + " km";
                modeOut.textContent = xr === 1 ? "Surface" : "Outside (altitude)";
                setEqn("gvarEqn",
                    `<span class="eqn">g = g\u209b${fr('R\u00b2', 'r\u00b2')} = ${fr('9.8', xr.toFixed(2) + '\u00b2')} = <b>${g.toFixed(2)} m/s\u00b2</b></span>`
                );
            }
        }
        pos.addEventListener("input", draw);
        draw();
    }

    /* ============================================================
       SATELLITE ORBIT SIMULATOR
       ============================================================ */
    function setupOrbit() {
        const stage = document.getElementById("orbitStage");
        if (!stage) return;
        const alt = document.getElementById("orbitAlt");
        const altVal = document.getElementById("orbitAltVal");
        const orbitPath = document.getElementById("orbitPath");
        const sat = document.getElementById("satellite");
        const geoRing = document.getElementById("orbitGeo");
        const vOut = document.getElementById("orbitV");
        const tOut = document.getElementById("orbitT");
        const statusEl = document.getElementById("orbitStatus");
        const CX = 230, CY = 180;
        let curPxR = 120, curT = 5400, angle = 0, lastTs = null;

        // geostationary ring (fixed altitude 35786 km)
        const geoRatio = (R_EARTH + 35786e3) / R_EARTH;
        const pxOf = ratio => 66 + (ratio - 1) * 13.5;
        if (geoRing) geoRing.setAttribute("r", Math.min(pxOf(geoRatio), 168).toFixed(1));

        function compute() {
            const h = +alt.value * 1000;
            const r = R_EARTH + h;
            const v = Math.sqrt(G * M_EARTH / r);
            const T = 2 * Math.PI * Math.sqrt(r * r * r / (G * M_EARTH));
            return { h, r, v, T };
        }
        function draw() {
            const m = compute();
            altVal.textContent = (+alt.value).toLocaleString() + " km";
            const ratio = m.r / R_EARTH;
            curPxR = Math.min(pxOf(ratio), 168);
            curT = m.T;
            orbitPath.setAttribute("r", curPxR.toFixed(1));
            vOut.textContent = (m.v / 1000).toFixed(2);
            tOut.textContent = fmtTime(m.T);
            const geo = Math.abs(m.T - 86164) / 86164 < 0.03;
            statusEl.textContent = geo ? "Geostationary \u2713  (T \u2248 24 h)" : "";
            statusEl.classList.toggle("on", geo);
            setEqn("orbitEqn",
                `<span class="eqn">v\u2080 = ${rad(fr('GM', 'r'))} = <b>${(m.v / 1000).toFixed(2)} km/s</b></span>` +
                `<span class="eqn">T = 2\u03c0${rad(fr('r\u00b3', 'GM'))} = <b>${fmtTime(m.T)}</b></span>`
            );
        }
        function place() {
            sat.setAttribute("cx", (CX + curPxR * Math.cos(angle)).toFixed(1));
            sat.setAttribute("cy", (CY + curPxR * Math.sin(angle)).toFixed(1));
        }
        function frame(ts) {
            if (lastTs == null) lastTs = ts;
            const dt = (ts - lastTs) / 1000; lastTs = ts;
            const animDur = Math.max(3, Math.min(34, curT / 850));   // s per revolution on screen
            angle += (2 * Math.PI / animDur) * dt;
            place();
            requestAnimationFrame(frame);
        }
        alt.addEventListener("input", draw);
        draw(); place();
        requestAnimationFrame(frame);
    }

    /* ============================================================
       ESCAPE-VELOCITY EXPLORER
       ============================================================ */
    function setupEscape() {
        const stage = document.getElementById("escStage");
        if (!stage) return;
        const PLANETS = {
            Earth: { M: 5.972e24, R: 6.371e6 },
            Moon: { M: 7.342e22, R: 1.737e6 },
            Mars: { M: 6.417e23, R: 3.390e6 },
            Jupiter: { M: 1.898e27, R: 6.991e7 },
            Sun: { M: 1.989e30, R: 6.963e8 }
        };
        const planet = document.getElementById("escPlanet");
        const ball = document.getElementById("escBall");
        const bar = document.getElementById("escBar");
        const veOut = document.getElementById("escVe");
        const voOut = document.getElementById("escVo");
        const CX = 110, CY = 250;
        let curVe = 11.2, ballY = CY, lastTs = null;

        function draw(name) {
            const p = PLANETS[name];
            const ve = Math.sqrt(2 * G * p.M / p.R);
            const vo = ve / Math.SQRT2;
            curVe = ve / 1000;
            veOut.textContent = (ve / 1000).toFixed(2);
            voOut.textContent = (vo / 1000).toFixed(2);
            const pct = Math.min(100, (ve / 1000) / 620 * 100);
            if (bar) bar.setAttribute("width", (pct / 100 * 250).toFixed(1));
            setEqn("escEqn",
                `<span class="eqn">v\u2091 = ${rad(fr('2GM', 'R'))} = ${rad(fr('2\u00b7G\u00b7M', 'R'))} = <b>${(ve / 1000).toFixed(2)} km/s</b></span>` +
                `<span class="eqn">v\u2091 = \u221a2\u00b7v\u2080 = <b>${(vo / 1000).toFixed(2)} km/s</b> \u00d7 \u221a2</span>`
            );
        }
        function frame(ts) {
            if (lastTs == null) lastTs = ts;
            const dt = (ts - lastTs) / 1000; lastTs = ts;
            const speed = Math.max(34, Math.min(230, curVe * 5.5));   // px/s, faster for bigger v_e
            ballY -= speed * dt;
            if (ballY < 20) ballY = CY - 4;
            ball.setAttribute("cx", CX);
            ball.setAttribute("cy", ballY.toFixed(1));
            ball.setAttribute("opacity", Math.max(0.15, (CY - ballY) / (CY - 20) < 0.9 ? 1 : 0.2).toFixed(2));
            requestAnimationFrame(frame);
        }
        document.querySelectorAll(".planet-pill").forEach(p => {
            p.addEventListener("click", () => {
                document.querySelectorAll(".planet-pill").forEach(x => x.classList.toggle("active", x === p));
                draw(p.dataset.planet);
            });
        });
        draw("Earth");
        requestAnimationFrame(frame);
    }

    /* ---------- theme toggle (white ⇄ inverted, both B&W) ---------- */
    function setupTheme() {
        const btn = document.getElementById("themeBtn");
        const saved = localStorage.getItem("grav-theme");
        if (saved) document.documentElement.setAttribute("data-theme", saved);
        btn.addEventListener("click", () => {
            const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
            const next = cur === "dark" ? "light" : "dark";
            document.documentElement.setAttribute("data-theme", next);
            localStorage.setItem("grav-theme", next);
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
        setupForce();
        setupGravityVar();
        setupOrbit();
        setupEscape();
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
