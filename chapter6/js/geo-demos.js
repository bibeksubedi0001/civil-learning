/* ============================================================
   Chapter 6 – Neural Networks & Deep Learning | Interactive 3D Demos
   One IIFE per sub-chapter, auto-injected by URL.
   ============================================================ */
(function () {
    'use strict';

    /* ── Helpers ─────────────────────────────────────── */
    const $ = s => document.querySelector(s);
    const CE = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
    const colours = { teal: '#00d4aa', cyan: '#0ea5e9', amber: '#f59e0b', purple: '#a855f7', red: '#ef4444', slate: '#94a3b8' };
    const demoBoxCSS = `position:relative;background:#0f1923;border:1px solid #1e2d3d;border-radius:16px;padding:0;margin:32px auto;max-width:800px;overflow:hidden;`;
    const demoTitleCSS = `margin:0;padding:16px 20px 8px;font-size:1rem;font-weight:700;color:#e2e8f0;`;
    const demoSubCSS = `margin:0;padding:0 20px 12px;font-size:.82rem;color:#94a3b8;line-height:1.5;`;
    const canvasCSS = `display:block;width:100%;background:#0a0f14;border-radius:0 0 16px 16px;cursor:crosshair;`;
    const btnCSS = `background:rgba(0,212,170,.12);border:1px solid rgba(0,212,170,.3);color:#00d4aa;padding:6px 16px;border-radius:8px;font-size:.78rem;cursor:pointer;font-family:inherit;margin:4px;`;

    function makeDemo(title, subtitle, h) {
        const wrap = CE('div', '', '');
        wrap.style.cssText = demoBoxCSS;
        const t = CE('h3', '', `<i class="fa-solid fa-cube" style="color:${colours.teal};margin-right:8px;"></i>${title}`);
        t.style.cssText = demoTitleCSS;
        const s = CE('p', '', subtitle);
        s.style.cssText = demoSubCSS;
        const controls = CE('div', '', '');
        controls.style.cssText = 'padding:0 20px 12px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;';
        const canvas = document.createElement('canvas');
        canvas.style.cssText = canvasCSS;
        canvas.height = h || 380;
        wrap.append(t, s, controls, canvas);
        return { wrap, canvas, controls, ctx: null };
    }

    function initCanvas(c) {
        const dpr = window.devicePixelRatio || 1;
        const r = c.canvas.getBoundingClientRect();
        c.canvas.width = r.width * dpr;
        c.canvas.height = (c.canvas.height || 380) * dpr;
        c.canvas.style.height = (c.canvas.height / dpr) + 'px';
        c.ctx = c.canvas.getContext('2d');
        c.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        c.W = r.width;
        c.H = c.canvas.height / dpr;
        return c;
    }

    function addBtn(parent, label, cb) {
        const b = CE('button');
        b.innerHTML = label;
        b.style.cssText = btnCSS;
        b.addEventListener('click', cb);
        parent.append(b);
        return b;
    }

    function injectBefore(anchor, el) {
        if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(el, anchor);
    }

    function findQuizSection() {
        // Find the quiz section using multiple strategies
        const sections = document.querySelectorAll('.ch-section, .ch-section--alt, section');
        for (const s of sections) {
            if (s.querySelector('.quiz-block')) return s;
        }
        // Look for quiz heading
        const headings = document.querySelectorAll('h2, h3');
        for (const h of headings) {
            if (/quiz/i.test(h.textContent)) {
                let el = h.closest('section') || h.parentElement;
                return el;
            }
        }
        return null;
    }

    /* ── Sub-page detection ──────────────────────────── */
    const path = window.location.pathname;
    const match = path.match(/sub(\d+)\.html/);
    if (!match) return;
    const subNum = parseInt(match[1], 10);

    /* ================================================================
       DEMO 1 — Sub1: The Perceptron as a Soil Classifier (3D)
       ================================================================ */
    if (subNum === 1) {
        const d = makeDemo(
            '3D Perceptron — Soil Type Classifier',
            'A single neuron classifies soil by SPT N-value (x), moisture % (y), and plasticity index (z). Drag to rotate. The green plane is the decision boundary.',
            400
        );
        const quiz = findQuizSection();
        if (quiz) injectBefore(quiz, d.wrap);
        else document.querySelector('.chapter-nav-footer')?.before(d.wrap);

        setTimeout(() => {
            initCanvas(d);
            const ctx = d.ctx, W = d.W, H = d.H;
            let angleX = 0.4, angleY = 0.6, dragging = false, lastMx, lastMy;
            // Soil data points [SPT_N, moisture%, PI, label]
            const data = [
                [5,35,22,1],[8,30,18,1],[3,40,28,1],[6,32,20,1],[4,38,25,1],[7,28,15,1],[2,42,30,1],
                [25,12,4,0],[30,8,2,0],[22,15,6,0],[28,10,3,0],[35,6,1,0],[20,18,8,0],[32,9,2,0]
            ];
            let weights = [0.5, -0.3, 0.4], bias = -0.1, lr = 0.05;
            let trained = false;

            function proj(x, y, z) {
                const cx = Math.cos(angleX), sx = Math.sin(angleX);
                const cy = Math.cos(angleY), sy = Math.sin(angleY);
                let ry = y * cx - z * sx, rz = y * sx + z * cx;
                let rx = x * cy - rz * sy; rz = x * sy + rz * cy;
                const sc = 300 / (300 + rz + 150);
                return { sx: W / 2 + rx * sc, sy: H / 2 + ry * sc, sc };
            }

            function norm(v, min, max) { return (v - min) / (max - min) * 100 - 50; }

            function draw() {
                ctx.clearRect(0, 0, W, H);
                ctx.fillStyle = '#0a0f14'; ctx.fillRect(0, 0, W, H);
                // Draw axes
                const axes = [[[-50,0,0],[50,0,0],'SPT N','#ef4444'],[[0,-50,0],[0,50,0],'Moisture%','#0ea5e9'],[[0,0,-50],[0,0,50],'PI','#f59e0b']];
                axes.forEach(([a, b, lbl, col]) => {
                    const pa = proj(...a), pb = proj(...b);
                    ctx.strokeStyle = col + '60'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
                    ctx.fillStyle = col; ctx.font = '11px Inter'; ctx.fillText(lbl, pb.sx + 4, pb.sy - 4);
                });
                // Decision plane
                if (trained) {
                    const pts = [[-50, -50], [50, -50], [50, 50], [-50, 50]].map(([px, pz]) => {
                        const py = weights[0] !== 0 ? -(weights[1] * px + weights[2] * pz + bias) / (weights[0] + 0.001) * 0.5 : 0;
                        return proj(px, Math.max(-50, Math.min(50, py)), pz);
                    });
                    ctx.fillStyle = 'rgba(0,212,170,0.08)';
                    ctx.beginPath(); pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy)); ctx.closePath(); ctx.fill();
                    ctx.strokeStyle = 'rgba(0,212,170,0.3)'; ctx.stroke();
                }
                // Data points
                data.forEach(([n, m, pi, label]) => {
                    const px = norm(n, 0, 40), py = norm(m, 0, 50), pz = norm(pi, 0, 35);
                    const p = proj(px, py, pz);
                    const col = label === 1 ? colours.amber : colours.cyan;
                    ctx.beginPath(); ctx.arc(p.sx, p.sy, 6 * p.sc, 0, Math.PI * 2);
                    ctx.fillStyle = col; ctx.fill();
                    ctx.strokeStyle = col + '80'; ctx.lineWidth = 1; ctx.stroke();
                });
                // Legend
                ctx.fillStyle = colours.amber; ctx.font = '11px Inter';
                ctx.beginPath(); ctx.arc(20, H - 40, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillText('Clay (cohesive)', 32, H - 36);
                ctx.fillStyle = colours.cyan;
                ctx.beginPath(); ctx.arc(20, H - 22, 5, 0, Math.PI * 2); ctx.fill();
                ctx.fillText('Sand (granular)', 32, H - 18);
            }

            function trainStep() {
                data.forEach(([n, m, pi, label]) => {
                    const inputs = [n / 40, m / 50, pi / 35];
                    const sum = inputs[0] * weights[0] + inputs[1] * weights[1] + inputs[2] * weights[2] + bias;
                    const pred = sum > 0 ? 1 : 0;
                    const err = label - pred;
                    weights[0] += lr * err * inputs[0];
                    weights[1] += lr * err * inputs[1];
                    weights[2] += lr * err * inputs[2];
                    bias += lr * err;
                });
                trained = true;
            }

            addBtn(d.controls, '<i class="fa-solid fa-play"></i> Train 1 Epoch', () => { trainStep(); draw(); });
            addBtn(d.controls, '<i class="fa-solid fa-forward"></i> Train 50 Epochs', () => { for (let i = 0; i < 50; i++) trainStep(); draw(); });
            addBtn(d.controls, '<i class="fa-solid fa-rotate"></i> Reset', () => { weights = [0.5, -0.3, 0.4]; bias = -0.1; trained = false; draw(); });

            d.canvas.addEventListener('mousedown', e => { dragging = true; lastMx = e.clientX; lastMy = e.clientY; });
            d.canvas.addEventListener('mousemove', e => { if (!dragging) return; angleY += (e.clientX - lastMx) * 0.01; angleX += (e.clientY - lastMy) * 0.01; lastMx = e.clientX; lastMy = e.clientY; draw(); });
            d.canvas.addEventListener('mouseup', () => dragging = false);
            d.canvas.addEventListener('mouseleave', () => dragging = false);
            draw();
        }, 100);
    }

    /* ================================================================
       DEMO 2 — Sub2: MLP Forward Pass — Concrete Strength Prediction
       ================================================================ */
    if (subNum === 2) {
        const d = makeDemo(
            '3D Neural Network Forward Pass',
            'Watch signals flow through a 4→6→6→1 network predicting concrete compressive strength (f\'c). Click neurons to see values.',
            420
        );
        const quiz = findQuizSection();
        if (quiz) injectBefore(quiz, d.wrap);
        else document.querySelector('.chapter-nav-footer')?.before(d.wrap);

        setTimeout(() => {
            initCanvas(d);
            const ctx = d.ctx, W = d.W, H = d.H;
            const arch = [4, 6, 6, 1];
            const layerLabels = ['Cement\nWater\nAgg.\nFly Ash', 'Hidden 1', 'Hidden 2', 'f\'c (MPa)'];
            const neurons = [];
            let angle = 0;

            arch.forEach((n, li) => {
                const lx = -200 + li * 130;
                const startY = -((n - 1) * 50) / 2;
                for (let i = 0; i < n; i++) {
                    neurons.push({ x: lx, y: startY + i * 50, z: (Math.random() - 0.5) * 40, layer: li, val: Math.random(), active: false });
                }
            });

            let signals = [], running = false;

            function proj(x, y, z) {
                const c = Math.cos(angle), s = Math.sin(angle);
                const rx = x * c - z * s, rz = x * s + z * c;
                const sc = 350 / (350 + rz + 100);
                return { sx: W / 2 + rx * sc, sy: H / 2 + y * sc * 0.5, sc, rz };
            }

            function draw(t) {
                ctx.clearRect(0, 0, W, H);
                angle = -0.15 + Math.sin(t * 0.0003) * 0.12;
                // Connections
                let off = 0;
                for (let li = 0; li < arch.length - 1; li++) {
                    const nxt = off + arch[li];
                    for (let a = 0; a < arch[li]; a++) {
                        for (let b = 0; b < arch[li + 1]; b++) {
                            const na = neurons[off + a], nb = neurons[nxt + b];
                            const pa = proj(na.x, na.y, na.z), pb = proj(nb.x, nb.y, nb.z);
                            ctx.strokeStyle = `rgba(0,212,170,${0.06 + na.val * 0.08})`;
                            ctx.lineWidth = 0.5;
                            ctx.beginPath(); ctx.moveTo(pa.sx, pa.sy); ctx.lineTo(pb.sx, pb.sy); ctx.stroke();
                        }
                    }
                    off = nxt;
                }
                // Signals
                signals = signals.filter(s => s.t < 1);
                signals.forEach(s => {
                    s.t += 0.012;
                    const na = neurons[s.from], nb = neurons[s.to];
                    const pa = proj(na.x, na.y, na.z), pb = proj(nb.x, nb.y, nb.z);
                    const sx = pa.sx + (pb.sx - pa.sx) * s.t, sy = pa.sy + (pb.sy - pa.sy) * s.t;
                    const alpha = Math.sin(s.t * Math.PI);
                    ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(14,165,233,${alpha})`; ctx.fill();
                });
                // Neurons
                const pts = neurons.map((n, i) => ({ ...proj(n.x, n.y, n.z), i }));
                pts.sort((a, b) => a.rz - b.rz);
                pts.forEach(p => {
                    const n = neurons[p.i];
                    const r = (n.layer === 3 ? 10 : 6) * p.sc;
                    const col = [colours.teal, colours.cyan, colours.amber, '#ef4444'][n.layer];
                    const glow = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, r * 2.5);
                    glow.addColorStop(0, col + '30'); glow.addColorStop(1, col + '00');
                    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(p.sx, p.sy, r * 2.5, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2);
                    ctx.fillStyle = n.active ? '#ffffff' : col; ctx.fill();
                    if (n.layer === 3) {
                        ctx.fillStyle = '#0a0f14'; ctx.font = 'bold 9px JetBrains Mono'; ctx.textAlign = 'center';
                        ctx.fillText((n.val * 60 + 10).toFixed(0), p.sx, p.sy + 3);
                    }
                });
                // Labels
                ctx.textAlign = 'center'; ctx.font = '10px Inter'; ctx.fillStyle = '#94a3b8';
                arch.forEach((n, li) => {
                    const p = proj(-200 + li * 130, -((n - 1) * 50) / 2 - 40, 0);
                    layerLabels[li].split('\n').forEach((l, idx) => ctx.fillText(l, p.sx, p.sy + idx * 12));
                });
                if (running || signals.length > 0) requestAnimationFrame(draw);
            }

            function fireForward() {
                running = true; signals = [];
                neurons.forEach(n => { n.val = Math.random(); n.active = false; });
                let off = 0;
                for (let li = 0; li < arch.length - 1; li++) {
                    const nxt = off + arch[li];
                    for (let a = 0; a < arch[li]; a++) {
                        for (let b = 0; b < arch[li + 1]; b++) {
                            signals.push({ from: off + a, to: nxt + b, t: -li * 0.3 - Math.random() * 0.1 });
                        }
                    }
                    off = nxt;
                }
                requestAnimationFrame(draw);
                setTimeout(() => { running = false; }, 4000);
            }

            addBtn(d.controls, '<i class="fa-solid fa-play"></i> Forward Pass', fireForward);
            addBtn(d.controls, '<i class="fa-solid fa-shuffle"></i> New Mix Design', () => { neurons.forEach(n => n.val = Math.random()); fireForward(); });
            requestAnimationFrame(draw);
        }, 100);
    }

    /* ================================================================
       DEMO 3 — Sub3: Activation Functions Interactive Comparison
       ================================================================ */
    if (subNum === 3) {
        const d = makeDemo(
            'Activation Functions — Interactive Explorer',
            'See how ReLU, Sigmoid, Tanh, and Leaky ReLU transform input signals. The x-axis is the weighted sum from a neuron processing soil data. The y-axis is the activation output.',
            360
        );
        const quiz = findQuizSection();
        if (quiz) injectBefore(quiz, d.wrap);
        else document.querySelector('.chapter-nav-footer')?.before(d.wrap);

        setTimeout(() => {
            initCanvas(d);
            const ctx = d.ctx, W = d.W, H = d.H;
            const funcs = {
                'ReLU': x => Math.max(0, x),
                'Sigmoid': x => 1 / (1 + Math.exp(-x)),
                'Tanh': x => Math.tanh(x),
                'Leaky ReLU': x => x > 0 ? x : 0.01 * x,
                'GELU': x => x * 0.5 * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x * x * x)))
            };
            const funcColors = { 'ReLU': colours.teal, 'Sigmoid': colours.cyan, 'Tanh': colours.amber, 'Leaky ReLU': colours.purple, 'GELU': colours.red };
            let active = { 'ReLU': true, 'Sigmoid': true, 'Tanh': false, 'Leaky ReLU': false, 'GELU': false };
            let mouseX = null;

            function draw() {
                ctx.clearRect(0, 0, W, H);
                ctx.fillStyle = '#0a0f14'; ctx.fillRect(0, 0, W, H);
                const ox = W / 2, oy = H / 2, sx = W / 12, sy = H / 3;
                // Grid
                ctx.strokeStyle = '#1e2d3d'; ctx.lineWidth = 0.5;
                for (let i = -6; i <= 6; i++) {
                    ctx.beginPath(); ctx.moveTo(ox + i * sx, 0); ctx.lineTo(ox + i * sx, H); ctx.stroke();
                }
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath(); ctx.moveTo(0, oy + i * sy); ctx.lineTo(W, oy + i * sy); ctx.stroke();
                }
                // Axes
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke();
                ctx.fillStyle = '#94a3b8'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
                for (let i = -5; i <= 5; i++) if (i !== 0) ctx.fillText(i, ox + i * sx, oy + 14);
                ctx.textAlign = 'right';
                ctx.fillText('1', ox - 6, oy - sy + 4);
                ctx.fillText('-1', ox - 6, oy + sy + 4);
                // Functions
                Object.entries(funcs).forEach(([name, fn]) => {
                    if (!active[name]) return;
                    ctx.strokeStyle = funcColors[name]; ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    for (let px = 0; px <= W; px++) {
                        const x = (px - ox) / sx;
                        const y = fn(x);
                        const py = oy - y * sy;
                        px === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                    }
                    ctx.stroke();
                });
                // Hover line
                if (mouseX !== null) {
                    const x = (mouseX - ox) / sx;
                    ctx.strokeStyle = '#ffffff30'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
                    ctx.beginPath(); ctx.moveTo(mouseX, 0); ctx.lineTo(mouseX, H); ctx.stroke();
                    ctx.setLineDash([]);
                    let yOff = 20;
                    ctx.font = '11px JetBrains Mono'; ctx.textAlign = 'left';
                    ctx.fillStyle = '#e2e8f0'; ctx.fillText(`x = ${x.toFixed(2)}`, mouseX + 8, yOff);
                    Object.entries(funcs).forEach(([name, fn]) => {
                        if (!active[name]) return;
                        yOff += 16;
                        ctx.fillStyle = funcColors[name];
                        ctx.fillText(`${name}: ${fn(x).toFixed(4)}`, mouseX + 8, yOff);
                        const py = oy - fn(x) * sy;
                        ctx.beginPath(); ctx.arc(mouseX, py, 4, 0, Math.PI * 2); ctx.fill();
                    });
                }
                // Legend
                ctx.font = '11px Inter'; ctx.textAlign = 'left';
                ctx.fillStyle = '#94a3b8'; ctx.fillText('Hover to compare values', 10, H - 10);
            }

            Object.keys(funcs).forEach(name => {
                const b = addBtn(d.controls, name, () => { active[name] = !active[name]; b.style.opacity = active[name] ? 1 : 0.4; draw(); });
                b.style.borderColor = funcColors[name] + '60';
                b.style.color = funcColors[name];
                if (!active[name]) b.style.opacity = 0.4;
            });

            d.canvas.addEventListener('mousemove', e => { const r = d.canvas.getBoundingClientRect(); mouseX = e.clientX - r.left; draw(); });
            d.canvas.addEventListener('mouseleave', () => { mouseX = null; draw(); });
            draw();
        }, 100);
    }

    /* ================================================================
       DEMO 4 — Sub4: Loss Functions — 3D Loss Surface
       ================================================================ */
    if (subNum === 4) {
        const d = makeDemo(
            '3D Loss Surface — MSE vs MAE vs Huber',
            'Visualize how different loss functions create different error landscapes for concrete strength prediction. The ball shows the current prediction error.',
            400
        );
        const quiz = findQuizSection();
        if (quiz) injectBefore(quiz, d.wrap);
        else document.querySelector('.chapter-nav-footer')?.before(d.wrap);

        setTimeout(() => {
            initCanvas(d);
            const ctx = d.ctx, W = d.W, H = d.H;
            let angleX = 0.5, angleY = -0.4, dragging = false, lastMx, lastMy;
            let lossType = 'MSE';
            let ballW = 2, ballB = 1;

            const lossFn = {
                MSE: (w, b) => { let s = 0; for (let i = 0; i < 5; i++) { const x = i + 1, y = x * 3 + 2; const p = w * x + b; s += (p - y) ** 2; } return s / 5; },
                MAE: (w, b) => { let s = 0; for (let i = 0; i < 5; i++) { const x = i + 1, y = x * 3 + 2; const p = w * x + b; s += Math.abs(p - y); } return s / 5; },
                Huber: (w, b) => { let s = 0; const d = 1; for (let i = 0; i < 5; i++) { const x = i + 1, y = x * 3 + 2; const p = w * x + b; const a = Math.abs(p - y); s += a <= d ? 0.5 * a * a : d * (a - 0.5 * d); } return s / 5; }
            };

            function proj(x, y, z) {
                const cx = Math.cos(angleX), sx2 = Math.sin(angleX);
                const cy = Math.cos(angleY), sy = Math.sin(angleY);
                let ry = y * cx - z * sx2, rz = y * sx2 + z * cx;
                let rx = x * cy - rz * sy; rz = x * sy + rz * cy;
                const sc = 300 / (300 + rz + 200);
                return { sx: W / 2 + rx * sc, sy: H / 2 + ry * sc, sc };
            }

            function draw() {
                ctx.clearRect(0, 0, W, H);
                ctx.fillStyle = '#0a0f14'; ctx.fillRect(0, 0, W, H);
                const fn = lossFn[lossType];
                const grid = 20, range = 6;
                const pts = [];
                for (let i = 0; i <= grid; i++) {
                    for (let j = 0; j <= grid; j++) {
                        const w = (i / grid - 0.5) * range * 2;
                        const b = (j / grid - 0.5) * range * 2;
                        const loss = Math.min(fn(w, b), 80);
                        pts.push({ w, b, loss, p: proj(w * 15, -loss * 1.2, b * 15) });
                    }
                }
                // Wireframe
                for (let i = 0; i < grid; i++) {
                    for (let j = 0; j < grid; j++) {
                        const a = pts[i * (grid + 1) + j], b2 = pts[(i + 1) * (grid + 1) + j];
                        const c = pts[i * (grid + 1) + j + 1];
                        const hue = Math.min(a.loss / 40, 1);
                        ctx.strokeStyle = `rgba(${Math.floor(hue * 239 + (1 - hue) * 0)},${Math.floor((1 - hue) * 212)},${Math.floor((1 - hue) * 170)},0.3)`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath(); ctx.moveTo(a.p.sx, a.p.sy); ctx.lineTo(b2.p.sx, b2.p.sy); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(a.p.sx, a.p.sy); ctx.lineTo(c.p.sx, c.p.sy); ctx.stroke();
                    }
                }
                // Ball
                const bLoss = Math.min(fn(ballW, ballB), 80);
                const bp = proj(ballW * 15, -bLoss * 1.2, ballB * 15);
                ctx.beginPath(); ctx.arc(bp.sx, bp.sy, 8, 0, Math.PI * 2);
                ctx.fillStyle = colours.red; ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
                // Info
                ctx.fillStyle = '#e2e8f0'; ctx.font = '12px JetBrains Mono'; ctx.textAlign = 'left';
                ctx.fillText(`${lossType} Loss: ${bLoss.toFixed(2)}`, 15, 25);
                ctx.fillText(`w = ${ballW.toFixed(2)}, b = ${ballB.toFixed(2)}`, 15, 42);
                ctx.fillStyle = '#94a3b8'; ctx.font = '10px Inter';
                ctx.fillText('Target: y = 3x + 2 (concrete strength model)', 15, 60);
                ctx.fillText('Drag surface to rotate | Click buttons to optimize', 15, H - 10);
            }

            function gradStep() {
                const fn = lossFn[lossType];
                const eps = 0.01, lr2 = 0.05;
                const gw = (fn(ballW + eps, ballB) - fn(ballW - eps, ballB)) / (2 * eps);
                const gb = (fn(ballW, ballB + eps) - fn(ballW, ballB - eps)) / (2 * eps);
                ballW -= lr2 * gw;
                ballB -= lr2 * gb;
            }

            addBtn(d.controls, 'MSE', () => { lossType = 'MSE'; draw(); });
            addBtn(d.controls, 'MAE', () => { lossType = 'MAE'; draw(); });
            addBtn(d.controls, 'Huber', () => { lossType = 'Huber'; draw(); });
            addBtn(d.controls, '<i class="fa-solid fa-shoe-prints"></i> Gradient Step', () => { gradStep(); draw(); });
            addBtn(d.controls, '<i class="fa-solid fa-forward"></i> Optimize 50x', () => { for (let i = 0; i < 50; i++) gradStep(); draw(); });
            addBtn(d.controls, '<i class="fa-solid fa-rotate"></i> Reset', () => { ballW = 2; ballB = 1; draw(); });

            d.canvas.addEventListener('mousedown', e => { dragging = true; lastMx = e.clientX; lastMy = e.clientY; });
            d.canvas.addEventListener('mousemove', e => { if (!dragging) return; angleY += (e.clientX - lastMx) * 0.01; angleX += (e.clientY - lastMy) * 0.01; lastMx = e.clientX; lastMy = e.clientY; draw(); });
            d.canvas.addEventListener('mouseup', () => dragging = false);
            d.canvas.addEventListener('mouseleave', () => dragging = false);
            draw();
        }, 100);
    }

    /* ================================================================
       DEMO 5 — Sub5: Gradient Descent — 3D Loss Landscape Walker
       ================================================================ */
    if (subNum === 5) {
        const d = makeDemo(
            '3D Gradient Descent — Walk the Loss Landscape',
            'Watch SGD, Momentum, and Adam navigate a complex 3D terrain to find the minimum. Like surveying a valley to find the lowest point for a foundation.',
            420
        );
        const quiz = findQuizSection();
        if (quiz) injectBefore(quiz, d.wrap);
        else document.querySelector('.chapter-nav-footer')?.before(d.wrap);

        setTimeout(() => {
            initCanvas(d);
            const ctx = d.ctx, W = d.W, H = d.H;
            let angleX = 0.6, angleY = -0.3, dragging = false, lastMx, lastMy;

            const landscape = (x, y) => Math.sin(x * 0.3) * Math.cos(y * 0.3) * 3 + (x * x + y * y) * 0.05 + Math.sin(x * 0.7 + y * 0.5) * 1.5;
            const walkers = [];
            let animFrame = null;

            function proj(x, y, z) {
                const cx = Math.cos(angleX), sx2 = Math.sin(angleX);
                const cy = Math.cos(angleY), sy = Math.sin(angleY);
                let ry = y * cx - z * sx2, rz = y * sx2 + z * cx;
                let rx = x * cy - rz * sy; rz = x * sy + rz * cy;
                const sc = 250 / (250 + rz + 200);
                return { sx: W / 2 + rx * sc, sy: H / 2 + ry * sc, sc };
            }

            function draw() {
                ctx.clearRect(0, 0, W, H);
                ctx.fillStyle = '#0a0f14'; ctx.fillRect(0, 0, W, H);
                // Terrain mesh
                const grid = 25, r = 8;
                for (let i = -grid; i < grid; i++) {
                    for (let j = -grid; j < grid; j++) {
                        const x = i * r / grid * 1.5, z = j * r / grid * 1.5;
                        const y = landscape(x, z);
                        const x2 = (i + 1) * r / grid * 1.5;
                        const y2 = landscape(x2, z);
                        const z2 = (j + 1) * r / grid * 1.5;
                        const y3 = landscape(x, z2);
                        const p1 = proj(x * 12, -y * 8, z * 12);
                        const p2 = proj(x2 * 12, -y2 * 8, z * 12);
                        const p3 = proj(x * 12, -y3 * 8, z2 * 12);
                        const h = Math.max(0, Math.min(1, (y + 5) / 12));
                        ctx.strokeStyle = `rgba(0,212,170,${0.05 + (1 - h) * 0.15})`;
                        ctx.lineWidth = 0.4;
                        ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p3.sx, p3.sy); ctx.stroke();
                    }
                }
                // Walkers
                const wColors = [colours.red, colours.cyan, colours.amber];
                const wNames = ['SGD', 'Momentum', 'Adam'];
                walkers.forEach((w, wi) => {
                    // Trail
                    ctx.strokeStyle = wColors[wi] + '60'; ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    w.trail.forEach((t, ti) => {
                        const p = proj(t[0] * 12, -t[1] * 8, t[2] * 12);
                        ti === 0 ? ctx.moveTo(p.sx, p.sy) : ctx.lineTo(p.sx, p.sy);
                    });
                    ctx.stroke();
                    // Ball
                    const p = proj(w.x * 12, -w.y * 8, w.z * 12);
                    ctx.beginPath(); ctx.arc(p.sx, p.sy, 7, 0, Math.PI * 2);
                    ctx.fillStyle = wColors[wi]; ctx.fill();
                    ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Inter'; ctx.textAlign = 'center';
                    ctx.fillText(wNames[wi], p.sx, p.sy - 12);
                });
                // Legend
                ctx.textAlign = 'left'; ctx.font = '10px Inter';
                walkers.forEach((w, wi) => {
                    ctx.fillStyle = wColors[wi];
                    ctx.fillText(`${wNames[wi]}: loss=${w.y.toFixed(3)}`, 12, 20 + wi * 16);
                });
            }

            function initWalkers() {
                walkers.length = 0;
                const starts = [[5, 4], [5.2, 3.8], [4.8, 4.2]];
                starts.forEach(([sx, sz]) => {
                    const sy = landscape(sx, sz);
                    walkers.push({ x: sx, y: sy, z: sz, vx: 0, vz: 0, mx: 0, mz: 0, vx2: 0, vz2: 0, t: 0, trail: [[sx, sy, sz]] });
                });
            }

            function step() {
                const eps = 0.01, lr2 = 0.15;
                walkers.forEach((w, wi) => {
                    const gx = (landscape(w.x + eps, w.z) - landscape(w.x - eps, w.z)) / (2 * eps);
                    const gz = (landscape(w.x, w.z + eps) - landscape(w.x, w.z - eps)) / (2 * eps);
                    if (wi === 0) { w.x -= lr2 * gx; w.z -= lr2 * gz; }
                    else if (wi === 1) { w.vx = 0.9 * w.vx + lr2 * gx; w.vz = 0.9 * w.vz + lr2 * gz; w.x -= w.vx; w.z -= w.vz; }
                    else { w.t++; const b1 = 0.9, b2 = 0.999, e2 = 1e-8; w.mx = b1 * w.mx + (1 - b1) * gx; w.mz = b1 * w.mz + (1 - b1) * gz; w.vx2 = b2 * w.vx2 + (1 - b2) * gx * gx; w.vz2 = b2 * w.vz2 + (1 - b2) * gz * gz; const mhx = w.mx / (1 - b1 ** w.t), mhz = w.mz / (1 - b1 ** w.t); const vhx = w.vx2 / (1 - b2 ** w.t), vhz = w.vz2 / (1 - b2 ** w.t); w.x -= lr2 * mhx / (Math.sqrt(vhx) + e2); w.z -= lr2 * mhz / (Math.sqrt(vhz) + e2); }
                    w.y = landscape(w.x, w.z);
                    w.trail.push([w.x, w.y, w.z]);
                    if (w.trail.length > 200) w.trail.shift();
                });
            }

            let running = false;
            function animate() {
                if (!running) return;
                step(); draw();
                animFrame = requestAnimationFrame(animate);
            }

            addBtn(d.controls, '<i class="fa-solid fa-play"></i> Start Descent', () => { if (walkers.length === 0) initWalkers(); running = true; animate(); });
            addBtn(d.controls, '<i class="fa-solid fa-pause"></i> Pause', () => { running = false; });
            addBtn(d.controls, '<i class="fa-solid fa-shoe-prints"></i> Single Step', () => { if (walkers.length === 0) initWalkers(); step(); draw(); });
            addBtn(d.controls, '<i class="fa-solid fa-rotate"></i> Reset', () => { running = false; initWalkers(); draw(); });

            d.canvas.addEventListener('mousedown', e => { dragging = true; lastMx = e.clientX; lastMy = e.clientY; });
            d.canvas.addEventListener('mousemove', e => { if (!dragging) return; angleY += (e.clientX - lastMx) * 0.008; angleX += (e.clientY - lastMy) * 0.008; lastMx = e.clientX; lastMy = e.clientY; draw(); });
            d.canvas.addEventListener('mouseup', () => dragging = false);
            d.canvas.addEventListener('mouseleave', () => dragging = false);
            initWalkers(); draw();
        }, 100);
    }

    /* ================================================================
       DEMO 6 — Sub6: Backpropagation — Animated Gradient Flow
       ================================================================ */
    if (subNum === 6) {
        const d = makeDemo(
            'Backpropagation — Watch Gradients Flow',
            'Error propagates backwards through the network. Red = large gradient (big weight update), blue = small gradient. Like stress redistribution in a loaded structure.',
            380
        );
        const quiz = findQuizSection();
        if (quiz) injectBefore(quiz, d.wrap);
        else document.querySelector('.chapter-nav-footer')?.before(d.wrap);

        setTimeout(() => {
            initCanvas(d);
            const ctx = d.ctx, W = d.W, H = d.H;
            const arch = [3, 5, 5, 2];
            const nodes = [];
            let off = 0;
            arch.forEach((n, li) => {
                const sy = H / 2 - ((n - 1) * 48) / 2;
                for (let i = 0; i < n; i++) {
                    nodes.push({ x: 80 + li * (W - 160) / (arch.length - 1), y: sy + i * 48, layer: li, grad: 0, val: Math.random() });
                }
            });
            const edges = [];
            off = 0;
            for (let li = 0; li < arch.length - 1; li++) {
                const nxt = off + arch[li];
                for (let a = 0; a < arch[li]; a++) for (let b = 0; b < arch[li + 1]; b++) edges.push({ from: off + a, to: nxt + b, grad: 0 });
                off = nxt;
            }

            let phase = 'idle', step2 = 0, signals = [];

            function draw() {
                ctx.clearRect(0, 0, W, H);
                ctx.fillStyle = '#0a0f14'; ctx.fillRect(0, 0, W, H);
                // Edges
                edges.forEach(e => {
                    const a = nodes[e.from], b = nodes[e.to];
                    const g = Math.abs(e.grad);
                    const col = g > 0.5 ? `rgba(239,68,68,${0.2 + g * 0.6})` : `rgba(14,165,233,${0.15 + g * 0.3})`;
                    ctx.strokeStyle = col; ctx.lineWidth = 0.5 + g * 3;
                    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                });
                // Backward signals
                signals = signals.filter(s => s.t >= 0 && s.t <= 1);
                signals.forEach(s => {
                    s.t += 0.015;
                    const a = nodes[edges[s.e].to], b = nodes[edges[s.e].from]; // reversed for backward
                    const sx = a.x + (b.x - a.x) * s.t, sy = a.y + (b.y - a.y) * s.t;
                    const alpha = Math.sin(s.t * Math.PI);
                    ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(239,68,68,${alpha})`; ctx.fill();
                });
                // Nodes
                nodes.forEach(n => {
                    const g = Math.abs(n.grad);
                    const col = n.layer === arch.length - 1 ? colours.red : g > 0.3 ? colours.amber : colours.teal;
                    ctx.beginPath(); ctx.arc(n.x, n.y, 10, 0, Math.PI * 2);
                    ctx.fillStyle = col; ctx.fill();
                    if (g > 0) {
                        ctx.fillStyle = '#0a0f14'; ctx.font = 'bold 7px JetBrains Mono'; ctx.textAlign = 'center';
                        ctx.fillText(g.toFixed(1), n.x, n.y + 3);
                    }
                });
                // Labels
                ctx.font = '10px Inter'; ctx.textAlign = 'center'; ctx.fillStyle = '#94a3b8';
                const lbls = ['Input\n(Mix Design)', 'Hidden 1', 'Hidden 2', 'Output\n(Error)'];
                arch.forEach((n, li) => {
                    const x = 80 + li * (W - 160) / (arch.length - 1);
                    const y2 = H / 2 - ((n - 1) * 48) / 2 - 25;
                    lbls[li].split('\n').forEach((l, idx) => ctx.fillText(l, x, y2 + idx * 12));
                });
                if (phase === 'backward') ctx.fillText('← Gradients flowing backward (like stress redistribution)', W / 2, H - 15);
                if (signals.length > 0) requestAnimationFrame(draw);
            }

            function backprop() {
                phase = 'backward'; signals = [];
                // Simulate gradients
                const total = nodes.length;
                nodes.forEach((n, i) => { n.grad = n.layer === arch.length - 1 ? 1 : 0; });
                for (let li = arch.length - 1; li > 0; li--) {
                    edges.forEach((e, ei) => {
                        if (nodes[e.to].layer === li) {
                            e.grad = nodes[e.to].grad * (0.3 + Math.random() * 0.7);
                            nodes[e.from].grad += e.grad * 0.3;
                            signals.push({ e: ei, t: -(arch.length - 1 - li) * 0.3 - Math.random() * 0.2 });
                        }
                    });
                }
                requestAnimationFrame(draw);
            }

            addBtn(d.controls, '<i class="fa-solid fa-play"></i> Run Backprop', backprop);
            addBtn(d.controls, '<i class="fa-solid fa-rotate"></i> Reset', () => { phase = 'idle'; signals = []; nodes.forEach(n => n.grad = 0); edges.forEach(e => e.grad = 0); draw(); });
            draw();
        }, 100);
    }

    /* ================================================================
       DEMO 7 — Sub7: Training Loop — Live Learning Curve
       ================================================================ */
    if (subNum === 7) {
        const d = makeDemo(
            'Training Loop — Live Learning Curve',
            'Watch a neural network learn in real time. Adjust batch size and learning rate. The curve shows training vs validation loss — like monitoring settlement over time.',
            380
        );
        const quiz = findQuizSection();
        if (quiz) injectBefore(quiz, d.wrap);
        else document.querySelector('.chapter-nav-footer')?.before(d.wrap);

        setTimeout(() => {
            initCanvas(d);
            const ctx = d.ctx, W = d.W, H = d.H;
            let trainLoss = [], valLoss = [], epoch = 0, running = false;
            let batchSize = 32, lr2 = 0.01;
            const maxEpochs = 150;
            let animId = null;

            // Simulated training: loss decays with noise, val diverges if overfitting
            function simStep() {
                epoch++;
                const tBase = 3 * Math.exp(-epoch * lr2 * 0.5) + 0.1;
                const noise = (Math.random() - 0.5) * 0.15 / Math.sqrt(batchSize / 4);
                trainLoss.push(Math.max(0.05, tBase + noise));
                const overfit = epoch > 60 ? (epoch - 60) * 0.003 : 0;
                const vBase = tBase + 0.15 + overfit;
                valLoss.push(Math.max(0.1, vBase + (Math.random() - 0.5) * 0.2));
            }

            function draw() {
                ctx.clearRect(0, 0, W, H);
                ctx.fillStyle = '#0a0f14'; ctx.fillRect(0, 0, W, H);
                const padL = 50, padR = 20, padT = 30, padB = 40;
                const gW = W - padL - padR, gH = H - padT - padB;
                // Grid
                ctx.strokeStyle = '#1e2d3d'; ctx.lineWidth = 0.5;
                for (let i = 0; i <= 5; i++) { const y = padT + (gH / 5) * i; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke(); }
                // Axes
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, H - padB); ctx.lineTo(W - padR, H - padB); ctx.stroke();
                ctx.fillStyle = '#94a3b8'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
                ctx.fillText('Epoch', W / 2, H - 8);
                ctx.save(); ctx.translate(14, H / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('Loss', 0, 0); ctx.restore();
                // Y-axis labels
                ctx.textAlign = 'right'; ctx.font = '9px JetBrains Mono';
                for (let i = 0; i <= 5; i++) { const v = (3 / 5) * (5 - i); ctx.fillText(v.toFixed(1), padL - 5, padT + (gH / 5) * i + 4); }
                // Curves
                function plotCurve(data, col) {
                    if (data.length < 2) return;
                    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath();
                    data.forEach((v, i) => {
                        const x = padL + (i / maxEpochs) * gW;
                        const y = padT + gH - (v / 3) * gH;
                        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                    });
                    ctx.stroke();
                }
                plotCurve(trainLoss, colours.teal);
                plotCurve(valLoss, colours.amber);
                // Legend
                ctx.font = '11px Inter'; ctx.textAlign = 'left';
                ctx.fillStyle = colours.teal; ctx.fillText('● Train Loss', padL + 10, padT + 16);
                ctx.fillStyle = colours.amber; ctx.fillText('● Val Loss', padL + 110, padT + 16);
                // Current values
                if (trainLoss.length > 0) {
                    ctx.fillStyle = '#e2e8f0'; ctx.font = '11px JetBrains Mono'; ctx.textAlign = 'right';
                    ctx.fillText(`Epoch ${epoch} | Train: ${trainLoss[trainLoss.length - 1].toFixed(3)} | Val: ${valLoss[valLoss.length - 1].toFixed(3)}`, W - padR, padT + 16);
                }
                // Overfit warning
                if (valLoss.length > 10 && valLoss[valLoss.length - 1] > valLoss[valLoss.length - 10] + 0.1) {
                    ctx.fillStyle = colours.red; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'center';
                    ctx.fillText(' Overfitting detected! Val loss is rising.', W / 2, H - padB - 10);
                }
            }

            function animate() {
                if (!running || epoch >= maxEpochs) { running = false; return; }
                simStep(); draw();
                animId = requestAnimationFrame(animate);
            }

            // Batch size slider
            const bsLabel = CE('span', '', `Batch: ${batchSize}`);
            bsLabel.style.cssText = 'color:#94a3b8;font-size:.78rem;margin-right:8px;';
            d.controls.append(bsLabel);

            addBtn(d.controls, '<i class="fa-solid fa-play"></i> Train', () => { running = true; animate(); });
            addBtn(d.controls, '<i class="fa-solid fa-pause"></i> Pause', () => running = false);
            addBtn(d.controls, 'Batch=8', () => { batchSize = 8; bsLabel.textContent = 'Batch: 8'; });
            addBtn(d.controls, 'Batch=32', () => { batchSize = 32; bsLabel.textContent = 'Batch: 32'; });
            addBtn(d.controls, 'Batch=128', () => { batchSize = 128; bsLabel.textContent = 'Batch: 128'; });
            addBtn(d.controls, '<i class="fa-solid fa-rotate"></i> Reset', () => { running = false; epoch = 0; trainLoss = []; valLoss = []; draw(); });
            draw();
        }, 100);
    }

    /* ================================================================
       DEMO 8 — Sub8: Regularization — Dropout Visualization
       ================================================================ */
    if (subNum === 8) {
        const d = makeDemo(
            'Dropout Regularization — Live Visualization',
            'Watch neurons randomly "drop out" during training. This prevents co-adaptation — like redundancy in structural systems. Adjust dropout rate to see the effect.',
            380
        );
        const quiz = findQuizSection();
        if (quiz) injectBefore(quiz, d.wrap);
        else document.querySelector('.chapter-nav-footer')?.before(d.wrap);

        setTimeout(() => {
            initCanvas(d);
            const ctx = d.ctx, W = d.W, H = d.H;
            const arch = [4, 8, 8, 2];
            const neurons = [];
            arch.forEach((n, li) => {
                const sy = H / 2 - ((n - 1) * 36) / 2;
                for (let i = 0; i < n; i++) {
                    neurons.push({ x: 60 + li * (W - 120) / (arch.length - 1), y: sy + i * 36, layer: li, dropped: false, val: Math.random() });
                }
            });
            let dropRate = 0.3;
            let animating = false;

            function applyDropout() {
                neurons.forEach(n => {
                    n.dropped = (n.layer > 0 && n.layer < arch.length - 1) ? Math.random() < dropRate : false;
                });
            }

            function draw() {
                ctx.clearRect(0, 0, W, H);
                ctx.fillStyle = '#0a0f14'; ctx.fillRect(0, 0, W, H);
                // Edges
                let off = 0;
                for (let li = 0; li < arch.length - 1; li++) {
                    const nxt = off + arch[li];
                    for (let a = 0; a < arch[li]; a++) {
                        for (let b = 0; b < arch[li + 1]; b++) {
                            const na = neurons[off + a], nb = neurons[nxt + b];
                            if (na.dropped || nb.dropped) continue;
                            ctx.strokeStyle = 'rgba(0,212,170,0.12)'; ctx.lineWidth = 0.8;
                            ctx.beginPath(); ctx.moveTo(na.x, na.y); ctx.lineTo(nb.x, nb.y); ctx.stroke();
                        }
                    }
                    off = nxt;
                }
                // Neurons
                neurons.forEach(n => {
                    ctx.beginPath(); ctx.arc(n.x, n.y, 12, 0, Math.PI * 2);
                    if (n.dropped) {
                        ctx.strokeStyle = '#ef444460'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
                        ctx.fillStyle = '#ef444420'; ctx.fill();
                        ctx.fillStyle = '#ef4444'; ctx.font = 'bold 10px Inter'; ctx.textAlign = 'center';
                        ctx.fillText('', n.x, n.y + 4);
                    } else {
                        const col = [colours.teal, colours.cyan, colours.amber, colours.purple][n.layer];
                        ctx.fillStyle = col; ctx.fill();
                        const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 20);
                        glow.addColorStop(0, col + '30'); glow.addColorStop(1, col + '00');
                        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(n.x, n.y, 20, 0, Math.PI * 2); ctx.fill();
                    }
                });
                // Labels
                ctx.font = '10px Inter'; ctx.textAlign = 'center'; ctx.fillStyle = '#94a3b8';
                ['Input', 'Hidden 1', 'Hidden 2', 'Output'].forEach((l, i) => {
                    const x = 60 + i * (W - 120) / (arch.length - 1);
                    ctx.fillText(l, x, 20);
                });
                // Stats
                const activeCount = neurons.filter(n => !n.dropped && n.layer > 0 && n.layer < arch.length - 1).length;
                const totalHidden = neurons.filter(n => n.layer > 0 && n.layer < arch.length - 1).length;
                ctx.fillStyle = '#e2e8f0'; ctx.font = '11px JetBrains Mono'; ctx.textAlign = 'left';
                ctx.fillText(`Dropout: ${(dropRate * 100).toFixed(0)}% | Active: ${activeCount}/${totalHidden} hidden neurons`, 10, H - 12);
            }

            function cycle() {
                if (!animating) return;
                applyDropout(); draw();
                setTimeout(() => requestAnimationFrame(cycle), 600);
            }

            addBtn(d.controls, '<i class="fa-solid fa-play"></i> Animate Dropout', () => { animating = true; cycle(); });
            addBtn(d.controls, '<i class="fa-solid fa-pause"></i> Pause', () => animating = false);
            addBtn(d.controls, '<i class="fa-solid fa-droplet"></i> Single Drop', () => { applyDropout(); draw(); });
            addBtn(d.controls, 'Rate 10%', () => { dropRate = 0.1; applyDropout(); draw(); });
            addBtn(d.controls, 'Rate 30%', () => { dropRate = 0.3; applyDropout(); draw(); });
            addBtn(d.controls, 'Rate 50%', () => { dropRate = 0.5; applyDropout(); draw(); });
            addBtn(d.controls, 'Rate 80%', () => { dropRate = 0.8; applyDropout(); draw(); });
            draw();
        }, 100);
    }

    /* ================================================================
       DEMO 9 — Sub9: GPU vs CPU — Speed Comparison
       ================================================================ */
    if (subNum === 9) {
        const d = makeDemo(
            'GPU vs CPU — Training Speed Comparison',
            'See why GPUs dominate deep learning. Both process the same matrix operations, but the GPU parallelizes thousands of operations at once — like 1000 workers vs 8.',
            360
        );
        const quiz = findQuizSection();
        if (quiz) injectBefore(quiz, d.wrap);
        else document.querySelector('.chapter-nav-footer')?.before(d.wrap);

        setTimeout(() => {
            initCanvas(d);
            const ctx = d.ctx, W = d.W, H = d.H;
            let cpuProg = 0, gpuProg = 0, running = false;
            const cpuCores = 8, gpuCores = 256;
            const cpuGrid = [], gpuGrid = [];
            const gridSize = 16;
            for (let i = 0; i < gridSize; i++) for (let j = 0; j < gridSize; j++) { cpuGrid.push({ x: i, y: j, done: false }); gpuGrid.push({ x: i, y: j, done: false }); }

            function draw() {
                ctx.clearRect(0, 0, W, H);
                ctx.fillStyle = '#0a0f14'; ctx.fillRect(0, 0, W, H);
                const halfW = W / 2 - 20;
                // CPU side
                ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'center';
                ctx.fillText('CPU (8 cores)', halfW / 2 + 10, 30);
                const cellS = Math.min(16, (halfW - 40) / gridSize);
                const cpuStartX = (halfW - gridSize * cellS) / 2 + 10;
                cpuGrid.forEach(c => {
                    ctx.fillStyle = c.done ? colours.cyan + '80' : '#1e2d3d';
                    ctx.fillRect(cpuStartX + c.x * cellS, 50 + c.y * cellS, cellS - 1, cellS - 1);
                });
                const cpuDone = cpuGrid.filter(c => c.done).length;
                ctx.fillStyle = colours.cyan; ctx.font = '10px JetBrains Mono';
                ctx.fillText(`${cpuDone}/${gridSize * gridSize} ops`, halfW / 2 + 10, 50 + gridSize * cellS + 20);
                // Progress bar CPU
                ctx.fillStyle = '#1e2d3d'; ctx.fillRect(20, 50 + gridSize * cellS + 30, halfW - 20, 16);
                ctx.fillStyle = colours.cyan; ctx.fillRect(20, 50 + gridSize * cellS + 30, (halfW - 20) * (cpuDone / (gridSize * gridSize)), 16);

                // GPU side
                ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'center';
                ctx.fillText('GPU (256+ cores)', W / 2 + halfW / 2, 30);
                const gpuStartX = W / 2 + (halfW - gridSize * cellS) / 2;
                gpuGrid.forEach(c => {
                    ctx.fillStyle = c.done ? colours.teal + '80' : '#1e2d3d';
                    ctx.fillRect(gpuStartX + c.x * cellS, 50 + c.y * cellS, cellS - 1, cellS - 1);
                });
                const gpuDone = gpuGrid.filter(c => c.done).length;
                ctx.fillStyle = colours.teal; ctx.font = '10px JetBrains Mono';
                ctx.fillText(`${gpuDone}/${gridSize * gridSize} ops`, W / 2 + halfW / 2, 50 + gridSize * cellS + 20);
                // Progress bar GPU
                ctx.fillStyle = '#1e2d3d'; ctx.fillRect(W / 2 + 10, 50 + gridSize * cellS + 30, halfW - 20, 16);
                ctx.fillStyle = colours.teal; ctx.fillRect(W / 2 + 10, 50 + gridSize * cellS + 30, (halfW - 20) * (gpuDone / (gridSize * gridSize)), 16);
                // Separator
                ctx.strokeStyle = '#1e2d3d'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(W / 2, 20); ctx.lineTo(W / 2, H - 20); ctx.stroke();
                // Speedup
                if (cpuDone > 0 && gpuDone > 0) {
                    ctx.fillStyle = colours.amber; ctx.font = 'bold 14px Inter'; ctx.textAlign = 'center';
                    const speedup = gpuDone > cpuDone ? (gpuDone / Math.max(cpuDone, 1)).toFixed(1) : '...';
                    ctx.fillText(`GPU is ~${speedup}x faster`, W / 2, H - 30);
                }
                ctx.fillStyle = '#94a3b8'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
                ctx.fillText('Matrix multiply: Each cell = one multiply-accumulate operation', W / 2, H - 10);
            }

            function tick() {
                if (!running) return;
                const remaining1 = cpuGrid.filter(c => !c.done);
                for (let i = 0; i < Math.min(cpuCores, remaining1.length); i++) { const idx = Math.floor(Math.random() * remaining1.length); remaining1[idx].done = true; remaining1.splice(idx, 1); }
                const remaining2 = gpuGrid.filter(c => !c.done);
                for (let i = 0; i < Math.min(gpuCores, remaining2.length); i++) { const idx = Math.floor(Math.random() * remaining2.length); remaining2[idx].done = true; remaining2.splice(idx, 1); }
                draw();
                if (cpuGrid.some(c => !c.done) || gpuGrid.some(c => !c.done)) setTimeout(tick, 80);
                else running = false;
            }

            addBtn(d.controls, '<i class="fa-solid fa-bolt"></i> Race!', () => { cpuGrid.forEach(c => c.done = false); gpuGrid.forEach(c => c.done = false); running = true; tick(); });
            addBtn(d.controls, '<i class="fa-solid fa-rotate"></i> Reset', () => { running = false; cpuGrid.forEach(c => c.done = false); gpuGrid.forEach(c => c.done = false); draw(); });
            draw();
        }, 100);
    }

    /* ================================================================
       DEMO 10 — Sub10: Mini Neural Network Trainer — Concrete f'c
       ================================================================ */
    if (subNum === 10) {
        const d = makeDemo(
            'Train a Neural Network — Concrete f\'c Predictor',
            'A simplified 3→4→1 network learns to predict 28-day compressive strength from w/c ratio, cement content, and aggregate ratio. Watch loss drop in real time!',
            400
        );
        const quiz = findQuizSection();
        if (quiz) injectBefore(quiz, d.wrap);
        else document.querySelector('.chapter-nav-footer')?.before(d.wrap);

        setTimeout(() => {
            initCanvas(d);
            const ctx = d.ctx, W = d.W, H = d.H;
            // Simple dataset: [w/c, cement_kg, agg_ratio] → f'c (MPa)
            const dataset = [
                [0.35, 450, 0.6, 55], [0.40, 400, 0.65, 48], [0.45, 380, 0.60, 42],
                [0.50, 350, 0.70, 35], [0.55, 320, 0.65, 30], [0.60, 300, 0.70, 25],
                [0.38, 420, 0.62, 50], [0.42, 410, 0.58, 46], [0.48, 370, 0.67, 38],
                [0.52, 340, 0.68, 32], [0.33, 470, 0.55, 60], [0.58, 310, 0.72, 27]
            ];
            // Normalize
            const mins = [0.3, 280, 0.5], maxs = [0.65, 500, 0.75], yMin = 20, yMax = 65;
            const normX = d2 => d2.map((v, i) => (v - mins[i]) / (maxs[i] - mins[i]));
            const normY = y => (y - yMin) / (yMax - yMin);
            const denormY = y => y * (yMax - yMin) + yMin;

            // Tiny NN: 3→4→1
            let w1 = Array.from({ length: 4 }, () => Array.from({ length: 3 }, () => (Math.random() - 0.5) * 0.5));
            let b1 = Array.from({ length: 4 }, () => 0);
            let w2 = Array.from({ length: 4 }, () => (Math.random() - 0.5) * 0.5);
            let b2 = 0;
            const relu = x => Math.max(0, x);

            function predict(inp) {
                const h = w1.map((w, i) => relu(w[0] * inp[0] + w[1] * inp[1] + w[2] * inp[2] + b1[i]));
                return h.reduce((s, v, i) => s + v * w2[i], 0) + b2;
            }

            let losses = [], epoch = 0, running = false;

            function trainEpoch() {
                epoch++;
                let totalLoss = 0;
                const lr2 = 0.02;
                dataset.forEach(row => {
                    const inp = normX(row.slice(0, 3));
                    const target = normY(row[3]);
                    // Forward
                    const z1 = w1.map((w, i) => w[0] * inp[0] + w[1] * inp[1] + w[2] * inp[2] + b1[i]);
                    const h = z1.map(relu);
                    const out = h.reduce((s, v, i) => s + v * w2[i], 0) + b2;
                    const err = out - target;
                    totalLoss += err * err;
                    // Backward
                    const dOut = 2 * err;
                    w2 = w2.map((w, i) => w - lr2 * dOut * h[i]);
                    b2 -= lr2 * dOut;
                    w1 = w1.map((wRow, i) => {
                        const dh = z1[i] > 0 ? dOut * w2[i] : 0;
                        b1[i] -= lr2 * dh;
                        return wRow.map((w, j) => w - lr2 * dh * inp[j]);
                    });
                });
                losses.push(totalLoss / dataset.length);
            }

            function draw() {
                ctx.clearRect(0, 0, W, H);
                ctx.fillStyle = '#0a0f14'; ctx.fillRect(0, 0, W, H);
                const leftW = W * 0.55, rightW = W - leftW;
                // Left: Loss curve
                const padL = 50, padT = 40, padB = 40, padR = 20;
                const gW = leftW - padL - padR, gH = H - padT - padB;
                ctx.strokeStyle = '#1e2d3d'; ctx.lineWidth = 0.5;
                for (let i = 0; i <= 4; i++) { const y = padT + (gH / 4) * i; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(leftW - padR, y); ctx.stroke(); }
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, H - padB); ctx.lineTo(leftW - padR, H - padB); ctx.stroke();
                ctx.fillStyle = '#94a3b8'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
                ctx.fillText('Epoch', (padL + leftW - padR) / 2, H - 8);
                ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'left';
                ctx.fillText('Training Loss', padL, padT - 10);
                if (losses.length > 1) {
                    const maxL = Math.max(...losses, 0.1);
                    ctx.strokeStyle = colours.teal; ctx.lineWidth = 2; ctx.beginPath();
                    losses.forEach((l, i) => {
                        const x = padL + (i / Math.max(losses.length - 1, 1)) * gW;
                        const y = padT + gH - (l / maxL) * gH;
                        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                    });
                    ctx.stroke();
                }
                // Right: Predictions table
                const tx = leftW + 10;
                ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'left';
                ctx.fillText('Predictions vs Actual (MPa)', tx, padT);
                ctx.font = '9px JetBrains Mono';
                ctx.fillStyle = '#94a3b8';
                ctx.fillText('w/c Cem Agg Actual Pred', tx, padT + 18);
                dataset.slice(0, 8).forEach((row, i) => {
                    const inp = normX(row.slice(0, 3));
                    const pred = denormY(predict(inp));
                    const actual = row[3];
                    const err = Math.abs(pred - actual);
                    ctx.fillStyle = err < 3 ? colours.teal : err < 8 ? colours.amber : colours.red;
                    const yPos = padT + 34 + i * 16;
                    ctx.fillText(`${row[0].toFixed(2)} ${row[1]} ${row[2].toFixed(2)} ${actual.toFixed(0)} ${pred.toFixed(1)}`, tx, yPos);
                });
                // Epoch info
                ctx.fillStyle = '#e2e8f0'; ctx.font = '11px JetBrains Mono'; ctx.textAlign = 'left';
                ctx.fillText(`Epoch: ${epoch}`, tx, H - 50);
                if (losses.length > 0) ctx.fillText(`Loss: ${losses[losses.length - 1].toFixed(4)}`, tx, H - 34);
            }

            function animate() {
                if (!running) return;
                for (let i = 0; i < 5; i++) trainEpoch();
                draw();
                if (epoch < 500) requestAnimationFrame(animate);
                else running = false;
            }

            addBtn(d.controls, '<i class="fa-solid fa-play"></i> Train', () => { running = true; animate(); });
            addBtn(d.controls, '<i class="fa-solid fa-pause"></i> Pause', () => running = false);
            addBtn(d.controls, '<i class="fa-solid fa-forward"></i> 10 Epochs', () => { for (let i = 0; i < 10; i++) trainEpoch(); draw(); });
            addBtn(d.controls, '<i class="fa-solid fa-rotate"></i> Reset', () => {
                running = false; epoch = 0; losses = [];
                w1 = Array.from({ length: 4 }, () => Array.from({ length: 3 }, () => (Math.random() - 0.5) * 0.5));
                b1 = Array.from({ length: 4 }, () => 0);
                w2 = Array.from({ length: 4 }, () => (Math.random() - 0.5) * 0.5);
                b2 = 0; draw();
            });
            draw();
        }, 100);
    }

    /* ================================================================
       BONUS DEMO A — Soil Bearing Capacity Neural Network (sub3, sub7)
       ================================================================ */
    if (subNum === 3 || subNum === 7) {
        setTimeout(() => {
            const d = initDemo(
                'Neural Network Soil Capacity Estimator',
                'Adjust soil parameters and watch a neural network estimate ultimate bearing capacity in real-time. Compare the NN prediction with Terzaghi\'s analytical solution.'
            );
            if (!d) return;
            let phi = 30, c = 20, gamma = 18, Df = 1.5, B = 2;
            function terzaghi(ph, co, g, df, b) {
                const phRad = ph * Math.PI / 180;
                const Nq = Math.exp(Math.PI * Math.tan(phRad)) * Math.tan(Math.PI / 4 + phRad / 2) ** 2;
                const Nc = (Nq - 1) / Math.tan(phRad || 0.001);
                const Ng = 2 * (Nq + 1) * Math.tan(phRad);
                return co * Nc + g * df * Nq + 0.5 * g * b * Ng;
            }
            function nnPredict(ph, co, g, df, b) {
                const x = [ph / 45, co / 50, g / 22, df / 3, b / 5];
                const h1 = [0, 0, 0, 0];
                const w1 = [[0.8, 0.3, 0.2, 0.1, 0.4], [0.5, 0.7, 0.3, 0.6, 0.2], [0.3, 0.2, 0.8, 0.4, 0.5], [0.6, 0.4, 0.1, 0.7, 0.3]];
                const b1 = [-0.2, -0.1, 0.1, -0.3];
                for (let i = 0; i < 4; i++) {
                    let sum = b1[i]; for (let j = 0; j < 5; j++) sum += w1[i][j] * x[j];
                    h1[i] = Math.max(0, sum);
                }
                const w2 = [0.9, 0.7, 0.5, 0.8]; const b2 = 0.1;
                let out = b2; for (let i = 0; i < 4; i++) out += w2[i] * h1[i];
                return out * terzaghi(ph, co, g, df, b) * (0.9 + Math.random() * 0.2);
            }
            const sliders = [
                { label: 'φ (°)', min: 15, max: 45, val: 30, set: v => phi = v },
                { label: 'c (kPa)', min: 0, max: 50, val: 20, set: v => c = v },
                { label: 'γ (kN/m³)', min: 14, max: 22, val: 18, set: v => gamma = v },
                { label: 'Df (m)', min: 0.5, max: 3, val: 1.5, set: v => Df = v },
                { label: 'B (m)', min: 1, max: 5, val: 2, set: v => B = v }
            ];
            sliders.forEach(s => {
                const row = CE('div');
                row.style.cssText = 'display:flex;align-items:center;gap:8px;margin:4px 0';
                row.innerHTML = `<span style="color:${colors.muted};font-size:.82rem;min-width:80px">${s.label}</span><input type="range" min="${s.min}" max="${s.max}" value="${s.val}" step="${s.max > 10 ? 1 : 0.5}" style="flex:1;accent-color:${colors.teal}"><span style="color:${colors.amber};font-size:.82rem;font-family:JetBrains Mono,monospace;min-width:40px">${s.val}</span>`;
                const inp = row.querySelector('input');
                const valSpan = row.querySelectorAll('span')[1];
                inp.addEventListener('input', () => { s.set(+inp.value); valSpan.textContent = inp.value; draw(); });
                d.controls.append(row);
            });
            function draw() {
                const { ctx, W, H } = d;
                ctx.clearRect(0, 0, W, H);
                const qTerz = terzaghi(phi, c, gamma, Df, B);
                const qNN = nnPredict(phi, c, gamma, Df, B);
                const maxQ = Math.max(qTerz, qNN) * 1.3;
                const pad = { l: 120, r: 40, t: 30, b: 50 };
                const barW = (W - pad.l - pad.r) * 0.3;
                // Terzaghi bar
                const h1 = (qTerz / maxQ) * (H - pad.t - pad.b);
                ctx.fillStyle = colors.cyan + '80';
                ctx.fillRect(pad.l + 20, H - pad.b - h1, barW, h1);
                ctx.strokeStyle = colors.cyan; ctx.lineWidth = 2;
                ctx.strokeRect(pad.l + 20, H - pad.b - h1, barW, h1);
                // NN bar
                const h2 = (qNN / maxQ) * (H - pad.t - pad.b);
                const nnX = pad.l + barW + 80;
                ctx.fillStyle = colors.teal + '80';
                ctx.fillRect(nnX, H - pad.b - h2, barW, h2);
                ctx.strokeStyle = colors.teal; ctx.lineWidth = 2;
                ctx.strokeRect(nnX, H - pad.b - h2, barW, h2);
                // Labels
                ctx.fillStyle = colors.text; ctx.font = '12px JetBrains Mono';
                ctx.fillText(qTerz.toFixed(0) + ' kPa', pad.l + 20 + barW / 2 - 25, H - pad.b - h1 - 8);
                ctx.fillText(qNN.toFixed(0) + ' kPa', nnX + barW / 2 - 25, H - pad.b - h2 - 8);
                ctx.fillStyle = colors.cyan; ctx.font = '11px Inter';
                ctx.fillText('Terzaghi', pad.l + 20 + barW / 2 - 25, H - pad.b + 18);
                ctx.fillStyle = colors.teal;
                ctx.fillText('Neural Net', nnX + barW / 2 - 25, H - pad.b + 18);
                const err = ((qNN - qTerz) / qTerz * 100);
                ctx.fillStyle = Math.abs(err) < 10 ? colors.teal : colors.amber;
                ctx.font = '11px JetBrains Mono';
                ctx.fillText(`Difference: ${err > 0 ? '+' : ''}${err.toFixed(1)}%`, pad.l + 20, H - pad.b + 38);
                // Axis
                ctx.strokeStyle = colors.border; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
                ctx.fillStyle = colors.muted; ctx.font = '11px Inter';
                ctx.save(); ctx.translate(14, H / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('q_ult (kPa)', 0, 0); ctx.restore();
            }
            draw();
        }, 120);
    }

    /* ================================================================
       BONUS DEMO B — Pile Load Test Analyzer (sub5, sub9)
       ================================================================ */
    if (subNum === 5 || subNum === 9) {
        setTimeout(() => {
            const d = initDemo(
                'Pile Load-Settlement Analyzer',
                'Simulate a pile load test: the neural network learns from load-settlement data to predict ultimate pile capacity. Adjust pile parameters and see how the NN identifies the failure load from the settlement curve.'
            );
            if (!d) return;
            let pileLen = 15, pileDia = 0.6, soilType = 'clay';
            const soilBtn = (name) => {
                const b = addBtn(d.controls, name, () => { soilType = name.toLowerCase(); draw(); });
                return b;
            };
            soilBtn('Clay'); soilBtn('Sand'); soilBtn('Rock');
            const lenRow = CE('div');
            lenRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin:6px 0';
            lenRow.innerHTML = `<span style="color:${colors.muted};font-size:.82rem;min-width:80px">Length (m)</span><input type="range" min="5" max="30" value="15" style="flex:1;accent-color:${colors.teal}"><span style="color:${colors.amber};font-size:.82rem;font-family:JetBrains Mono,monospace">15</span>`;
            lenRow.querySelector('input').addEventListener('input', e => { pileLen = +e.target.value; lenRow.querySelectorAll('span')[1].textContent = pileLen; draw(); });
            d.controls.append(lenRow);
            const diaRow = CE('div');
            diaRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin:6px 0';
            diaRow.innerHTML = `<span style="color:${colors.muted};font-size:.82rem;min-width:80px">Dia (m)</span><input type="range" min="0.3" max="1.5" value="0.6" step="0.1" style="flex:1;accent-color:${colors.teal}"><span style="color:${colors.amber};font-size:.82rem;font-family:JetBrains Mono,monospace">0.6</span>`;
            diaRow.querySelector('input').addEventListener('input', e => { pileDia = +e.target.value; diaRow.querySelectorAll('span')[1].textContent = pileDia; draw(); });
            d.controls.append(diaRow);
            addBtn(d.controls, '<i class="fa-solid fa-rotate"></i> New Test', () => draw());
            function draw() {
                const { ctx, W, H } = d;
                ctx.clearRect(0, 0, W, H);
                const pad = { l: 60, r: 30, t: 30, b: 50 };
                const gw = W - pad.l - pad.r, gh = H - pad.t - pad.b;
                const soilFactor = soilType === 'rock' ? 3 : soilType === 'sand' ? 1.5 : 1;
                const Qult = Math.PI * pileDia * pileLen * (soilFactor * 30) + Math.PI * (pileDia / 2) ** 2 * 9 * (soilFactor * 50);
                const maxLoad = Qult * 1.5;
                const maxSettl = pileDia * 100 * 0.15;
                // Generate load-settlement curve points
                const pts = [];
                for (let i = 0; i <= 20; i++) {
                    const load = (i / 20) * maxLoad;
                    const ratio = load / Qult;
                    let settl;
                    if (ratio < 0.5) settl = ratio * 5 * (1 + (Math.random() - 0.5) * 0.15);
                    else if (ratio < 1) settl = 2.5 + (ratio - 0.5) * 20 * (1 + (Math.random() - 0.5) * 0.15);
                    else settl = 12.5 + (ratio - 1) * 50;
                    pts.push({ load, settl: Math.min(settl, maxSettl) + (Math.random() - 0.5) * 0.5 });
                }
                // Axes
                ctx.strokeStyle = colors.border; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
                ctx.fillStyle = colors.muted; ctx.font = '11px Inter';
                ctx.fillText('Load (kN)', W / 2 - 20, H - 8);
                ctx.save(); ctx.translate(12, H / 2 + 20); ctx.rotate(-Math.PI / 2); ctx.fillText('Settlement (mm)', 0, 0); ctx.restore();
                // Data points
                pts.forEach(p => {
                    const x = pad.l + (p.load / maxLoad) * gw;
                    const y = pad.t + (p.settl / maxSettl) * gh;
                    ctx.fillStyle = colors.cyan + 'bb'; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
                });
                // NN predicted curve (smooth)
                ctx.strokeStyle = colors.teal; ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i <= 100; i++) {
                    const load = (i / 100) * maxLoad;
                    const ratio = load / Qult;
                    const settl = ratio < 0.5 ? ratio * 5 : ratio < 1 ? 2.5 + (ratio - 0.5) * 20 : 12.5 + (ratio - 1) * 50;
                    const x = pad.l + (load / maxLoad) * gw;
                    const y = pad.t + (Math.min(settl, maxSettl) / maxSettl) * gh;
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.stroke();
                // Ultimate capacity line
                const qx = pad.l + (Qult / maxLoad) * gw;
                ctx.strokeStyle = colors.amber; ctx.setLineDash([5, 5]);
                ctx.beginPath(); ctx.moveTo(qx, pad.t); ctx.lineTo(qx, H - pad.b); ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = colors.amber; ctx.font = '11px JetBrains Mono';
                ctx.fillText('Q_ult = ' + Qult.toFixed(0) + ' kN', qx + 5, pad.t + 15);
                ctx.fillText('Q_safe = ' + (Qult / 2.5).toFixed(0) + ' kN (FoS=2.5)', qx + 5, pad.t + 30);
                // Pile info
                ctx.fillStyle = colors.muted; ctx.font = '10px JetBrains Mono';
                ctx.fillText(`L=${pileLen}m | D=${pileDia}m | Soil: ${soilType}`, pad.l + 5, pad.t + 12);
            }
            draw();
        }, 130);
    }

})();
