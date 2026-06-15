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

    /* lightweight live-formula helpers (instant, no MathJax re-typeset) */
    function fr(n, d) {
        return `<span class="frac"><span class="fr-n">${n}</span><span class="fr-d">${d}</span></span>`;
    }
    function rad(inner) {
        return `<span class="sqrt"><span class="rad-sign">\u221a</span><span class="rad-body">${inner}</span></span>`;
    }
    function trim2(x) { return +(x).toFixed(2); }
    function setEqn(id, html) {
        const e = document.getElementById(id);
        if (e) e.innerHTML = html;
    }

    /* ---------- build one question card ---------- */
    function buildQuestion(q, displayNo) {
        const card = el("div", "question");
        card.dataset.id = q.id;
        card.dataset.year = q.year;          // filter key = exam year

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

            // live formulas (symbolic = substituted = result)
            setEqn("simEqn",
                `<span class="eqn">R = ${fr('u\u00b2\u00b7sin2\u03b8', 'g')} = ${fr(u + '\u00b2\u00b7sin' + (2 * ang) + '\u00b0', g)} = <b>${main.R.toFixed(1)} m</b></span>` +
                `<span class="eqn">H = ${fr('u\u00b2\u00b7sin\u00b2\u03b8', '2g')} = ${fr(u + '\u00b2\u00b7sin\u00b2' + ang + '\u00b0', trim2(2 * g))} = <b>${main.H.toFixed(1)} m</b></span>` +
                `<span class="eqn">T = ${fr('2u\u00b7sin\u03b8', 'g')} = ${fr('2\u00b7' + u + '\u00b7sin' + ang + '\u00b0', g)} = <b>${main.T.toFixed(2)} s</b></span>`
            );

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

    /* ============================================================
       DROP vs LAUNCH RACE — vertical motion is independent of x
       ============================================================ */
    function setupRace() {
        const stage = document.getElementById("raceStage");
        if (!stage) return;
        const spd = document.getElementById("raceSpeed");
        const hEl = document.getElementById("raceH");
        const spdVal = document.getElementById("raceSpeedVal");
        const hVal = document.getElementById("raceHVal");
        const btn = document.getElementById("raceBtn");
        const ballA = document.getElementById("raceBallA");
        const ballB = document.getElementById("raceBallB");
        const guide = document.getElementById("raceGuide");
        const arc = document.getElementById("raceArc");
        const axis = document.getElementById("raceAxis");
        const tOut = document.getElementById("raceT");
        const rOut = document.getElementById("raceR");
        const g = 9.8, OX = 64, GY = 244, TOPMIN = 40;
        const SX = 320 / (32 * Math.sqrt(2 * 5 / g));   // px per metre so max range fits
        let raf = null, startTs = null;

        function geom() {
            const H = +hEl.value, u = +spd.value;
            const T = Math.sqrt(2 * H / g);
            const R = u * T;
            const pxDrop = (H / 5) * (GY - TOPMIN);
            const topY = GY - pxDrop;
            const endX = OX + R * SX;
            return { H, u, T, R, pxDrop, topY, endX };
        }

        function drawStatic() {
            const m = geom();
            spdVal.textContent = (+spd.value) + " m/s";
            hVal.textContent = (+hEl.value).toFixed(1) + " m";
            tOut.textContent = m.T.toFixed(2);
            rOut.textContent = m.R.toFixed(1);
            setEqn("raceEqn",
                `<span class="eqn">T = ${rad(fr('2H', 'g'))} = ${rad(fr(2 * m.H, g))} = <b>${m.T.toFixed(2)} s</b></span>` +
                `<span class="eqn">R = u\u00b7T = ${m.u} \u00b7 ${m.T.toFixed(2)} = <b>${m.R.toFixed(1)} m</b></span>`
            );
            axis.setAttribute("x1", OX); axis.setAttribute("y1", m.topY);
            axis.setAttribute("x2", OX); axis.setAttribute("y2", GY);
            let d = "M " + OX + " " + m.topY.toFixed(1);
            for (let i = 1; i <= 32; i++) {
                const p = i / 32;
                d += " L " + (OX + (m.endX - OX) * p).toFixed(1) + " " + (m.topY + m.pxDrop * p * p).toFixed(1);
            }
            arc.setAttribute("d", d);
            ballA.setAttribute("cx", OX); ballA.setAttribute("cy", m.topY);
            ballB.setAttribute("cx", OX); ballB.setAttribute("cy", m.topY);
            guide.setAttribute("x1", OX); guide.setAttribute("y1", m.topY);
            guide.setAttribute("x2", OX); guide.setAttribute("y2", m.topY);
            return m;
        }

        function run() {
            const m = drawStatic();
            cancelAnimationFrame(raf);
            const dur = Math.max(850, Math.min(1900, m.T * 650));
            startTs = null;
            function step(ts) {
                if (!startTs) startTs = ts;
                const p = Math.min(1, (ts - startTs) / dur);
                const y = m.topY + m.pxDrop * p * p;
                const xB = OX + (m.endX - OX) * p;
                ballA.setAttribute("cy", y);
                ballB.setAttribute("cx", xB); ballB.setAttribute("cy", y);
                guide.setAttribute("x1", OX); guide.setAttribute("y1", y);
                guide.setAttribute("x2", xB); guide.setAttribute("y2", y);
                if (p < 1) raf = requestAnimationFrame(step);
            }
            raf = requestAnimationFrame(step);
        }

        spd.addEventListener("input", drawStatic);
        hEl.addEventListener("input", drawStatic);
        spd.addEventListener("change", run);
        hEl.addEventListener("change", run);
        btn.addEventListener("click", run);
        drawStatic();
        const io = new IntersectionObserver((e) => {
            e.forEach(en => { if (en.isIntersecting) { run(); io.disconnect(); } });
        }, { threshold: 0.4 });
        io.observe(stage);
    }

    /* ============================================================
       VELOCITY RESOLVER — u into u cosθ and u sinθ
       ============================================================ */
    function setupDecomposer() {
        const stage = document.getElementById("decStage");
        if (!stage) return;
        const ang = document.getElementById("decAng");
        const spd = document.getElementById("decSpd");
        const angVal = document.getElementById("decAngVal");
        const spdVal = document.getElementById("decSpdVal");
        const uxOut = document.getElementById("decUx");
        const uyOut = document.getElementById("decUy");
        const vU = document.getElementById("decU");
        const vUx = document.getElementById("decUxLine");
        const vUy = document.getElementById("decUyLine");
        const arc = document.getElementById("decArc");
        const lU = document.getElementById("decULbl");
        const lUx = document.getElementById("decUxLbl");
        const lUy = document.getElementById("decUyLbl");
        const OX = 70, OY = 208;

        function draw() {
            const a = +ang.value, u = +spd.value;
            const r = a * Math.PI / 180;
            angVal.textContent = a + "\u00b0";
            spdVal.textContent = u + " m/s";
            const L = u * 3.6;
            const tx = OX + L * Math.cos(r), ty = OY - L * Math.sin(r);
            vU.setAttribute("x1", OX); vU.setAttribute("y1", OY);
            vU.setAttribute("x2", tx.toFixed(1)); vU.setAttribute("y2", ty.toFixed(1));
            vUx.setAttribute("x1", OX); vUx.setAttribute("y1", OY);
            vUx.setAttribute("x2", tx.toFixed(1)); vUx.setAttribute("y2", OY);
            vUy.setAttribute("x1", tx.toFixed(1)); vUy.setAttribute("y1", OY);
            vUy.setAttribute("x2", tx.toFixed(1)); vUy.setAttribute("y2", ty.toFixed(1));
            const ar = 30;
            arc.setAttribute("d", `M ${OX + ar} ${OY} A ${ar} ${ar} 0 0 1 ${(OX + ar * Math.cos(r)).toFixed(1)} ${(OY - ar * Math.sin(r)).toFixed(1)}`);
            lU.setAttribute("x", (tx + 8).toFixed(1)); lU.setAttribute("y", (ty - 2).toFixed(1));
            lUx.setAttribute("x", ((OX + tx) / 2 - 16).toFixed(1)); lUx.setAttribute("y", OY + 18);
            lUy.setAttribute("x", (tx + 7).toFixed(1)); lUy.setAttribute("y", ((OY + ty) / 2).toFixed(1));
            uxOut.textContent = (u * Math.cos(r)).toFixed(1);
            uyOut.textContent = (u * Math.sin(r)).toFixed(1);
            setEqn("decEqn",
                `<span class="eqn">u<sub>x</sub> = u\u00b7cos\u03b8 = ${u}\u00b7cos${a}\u00b0 = <b>${(u * Math.cos(r)).toFixed(1)} m/s</b></span>` +
                `<span class="eqn">u<sub>y</sub> = u\u00b7sin\u03b8 = ${u}\u00b7sin${a}\u00b0 = <b>${(u * Math.sin(r)).toFixed(1)} m/s</b></span>`
            );
        }
        ang.addEventListener("input", draw);
        spd.addEventListener("input", draw);
        draw();
    }

    /* ============================================================
       RANGE vs ANGLE EXPLORER — R = (u²/g) sin2θ
       ============================================================ */
    function setupRangeAngle() {
        const stage = document.getElementById("raStage");
        if (!stage) return;
        const ang = document.getElementById("raAng");
        const spd = document.getElementById("raSpd");
        const angVal = document.getElementById("raAngVal");
        const spdVal = document.getElementById("raSpdVal");
        const rOut = document.getElementById("raR");
        const cOut = document.getElementById("raComp");
        const curve = document.getElementById("raCurve");
        const dot = document.getElementById("raDot");
        const dot2 = document.getElementById("raDot2");
        const drop = document.getElementById("raDrop");
        const conn = document.getElementById("raConn");
        const g = 9.8, xL = 54, xR = 432, yB = 250, yT = 48;
        const mapX = d => xL + (d / 90) * (xR - xL);

        function draw() {
            const a = +ang.value, u = +spd.value;
            angVal.textContent = a + "\u00b0";
            spdVal.textContent = u + " m/s";
            const Rmax = u * u / g;
            const mapY = R => yB - (R / Rmax) * (yB - yT);
            const Rof = d => Rmax * Math.sin(2 * d * Math.PI / 180);
            let dp = "M " + mapX(0).toFixed(1) + " " + mapY(Rof(0)).toFixed(1);
            for (let d = 1; d <= 90; d++) dp += " L " + mapX(d).toFixed(1) + " " + mapY(Rof(d)).toFixed(1);
            curve.setAttribute("d", dp);
            const R = Rof(a), comp = 90 - a;
            const x1 = mapX(a), y1 = mapY(R), x2 = mapX(comp), y2 = mapY(Rof(comp));
            dot.setAttribute("cx", x1.toFixed(1)); dot.setAttribute("cy", y1.toFixed(1));
            dot2.setAttribute("cx", x2.toFixed(1)); dot2.setAttribute("cy", y2.toFixed(1));
            drop.setAttribute("x1", x1.toFixed(1)); drop.setAttribute("y1", y1.toFixed(1));
            drop.setAttribute("x2", x1.toFixed(1)); drop.setAttribute("y2", yB);
            conn.setAttribute("x1", x1.toFixed(1)); conn.setAttribute("y1", y1.toFixed(1));
            conn.setAttribute("x2", x2.toFixed(1)); conn.setAttribute("y2", y2.toFixed(1));
            rOut.textContent = R.toFixed(1);
            cOut.textContent = comp + "\u00b0";
            setEqn("raEqn",
                `<span class="eqn">R = ${fr('u\u00b2', 'g')}\u00b7sin2\u03b8 = ${fr(u + '\u00b2', g)}\u00b7sin${2 * a}\u00b0 = <b>${R.toFixed(1)} m</b></span>` +
                `<span class="eqn">\u03b8\u2032 = 90\u00b0\u2212\u03b8 = <b>${comp}\u00b0</b> &nbsp;(equal R)</span>`
            );
        }
        ang.addEventListener("input", draw);
        spd.addEventListener("input", draw);
        draw();
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
        setupRace();
        setupDecomposer();
        setupRangeAngle();
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
