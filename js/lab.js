/* ==========================================================================
   HYPERPARAMETER LAB  (lab.html)

   Two real, browser-trained models with live loss curves:
     1. Polynomial regression  →  gradient descent on MSE
     2. Tiny MLP classifier    →  mini-batch SGD on BCE, real backprop

   No frameworks. Everything is plain JS so users can read the training loop.
   ========================================================================== */
(function () {
    'use strict';

    /* ───────────────────────── shared helpers ───────────────────────── */
    const $ = (id) => document.getElementById(id);
    const COLORS = {
        teal: '#00d4aa', cyan: '#0ea5e9', amber: '#f59e0b',
        red: '#ef4444', purple: '#a855f7', text: 'rgba(255,255,255,0.78)',
        muted: 'rgba(255,255,255,0.45)', grid: 'rgba(255,255,255,0.06)',
        bg: '#161a26'
    };

    function bindRange(id, fmt) {
        const inp = $(id);
        const out = $(id + '-out');
        if (!inp || !out) return null;
        const update = () => {
            const raw = parseFloat(inp.value);
            const v = inp.dataset.log === 'true' ? Math.pow(10, raw) : raw;
            out.textContent = fmt ? fmt(v) : String(raw);
        };
        inp.addEventListener('input', update);
        update();
        return inp;
    }
    function getVal(id) {
        const inp = $(id);
        const raw = parseFloat(inp.value);
        return inp.dataset.log === 'true' ? Math.pow(10, raw) : raw;
    }
    function renderStats(id, rows) {
        const ul = $(id);
        if (!ul) return;
        ul.innerHTML = rows
            .map(([k, v]) => `<li><span>${k}</span><strong>${v}</strong></li>`)
            .join('');
    }
    function clearCanvas(c) {
        const ctx = c.getContext('2d');
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, c.width, c.height);
    }
    function drawAxes(ctx, w, h, pad, xLabel, yLabel, xMin, xMax, yMin, yMax) {
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        ctx.fillStyle = COLORS.muted;
        ctx.font = '11px "JetBrains Mono", monospace';
        // grid
        for (let i = 0; i <= 5; i++) {
            const y = pad + ((h - 2 * pad) * i) / 5;
            ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
            const yv = yMax - ((yMax - yMin) * i) / 5;
            ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            ctx.fillText(yv.toFixed(2), pad - 4, y);
        }
        for (let i = 0; i <= 5; i++) {
            const x = pad + ((w - 2 * pad) * i) / 5;
            ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, h - pad); ctx.stroke();
            const xv = xMin + ((xMax - xMin) * i) / 5;
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText(xv.toFixed(2), x, h - pad + 4);
        }
        ctx.fillStyle = COLORS.text;
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(xLabel, w / 2, h - 2);
        ctx.save();
        ctx.translate(12, h / 2); ctx.rotate(-Math.PI / 2);
        ctx.textBaseline = 'top';
        ctx.fillText(yLabel, 0, 0);
        ctx.restore();
    }
    function drawLossCurve(canvas, losses, { color = COLORS.cyan, label = 'Loss' } = {}) {
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height, pad = 44;
        clearCanvas(canvas);
        if (!losses.length) {
            ctx.fillStyle = COLORS.muted;
            ctx.font = '14px "Inter", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('Hit "Train" to start fitting.', W / 2, H / 2);
            return;
        }
        const maxL = Math.max(...losses);
        const minL = Math.min(...losses);
        const yMax = maxL * 1.05 + 1e-6;
        const yMin = Math.max(0, minL - (maxL - minL) * 0.05);
        drawAxes(ctx, W, H, pad, 'epoch', label, 0, losses.length, yMin, yMax);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        losses.forEach((l, i) => {
            const x = pad + ((W - 2 * pad) * i) / Math.max(1, losses.length - 1);
            const y = pad + (H - 2 * pad) * (1 - (l - yMin) / Math.max(1e-9, yMax - yMin));
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
        // final loss bubble
        const lastY = pad + (H - 2 * pad) * (1 - (losses[losses.length - 1] - yMin) / Math.max(1e-9, yMax - yMin));
        const lastX = W - pad;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(lastX, lastY, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = COLORS.text;
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText('loss=' + losses[losses.length - 1].toFixed(4), lastX - 6, lastY - 6);
    }

    function frame() { return new Promise(r => requestAnimationFrame(r)); }

    /* ════════════════════════════════════════════════════════════════════
       1.  POLYNOMIAL REGRESSION  —  real gradient descent on MSE
       ════════════════════════════════════════════════════════════════════ */
    const Reg = (() => {
        const fitCanvas  = $('r-fit');
        const lossCanvas = $('r-loss');
        let xs = [], ys = [], yTrue = [];
        let weights = [];
        let losses = [];
        let training = false;
        const X_MIN = -1, X_MAX = 1;

        // Target curves (normalised to roughly [-1, 1])
        const TARGETS = {
            sine:   (x) => Math.sin(2.5 * x),
            cubic:  (x) => 0.7 * (x ** 3) - 0.6 * x,
            abrams: (x) => Math.tanh(-2.5 * x)
        };

        function genData(n, noise, target) {
            xs = []; ys = []; yTrue = [];
            const f = TARGETS[target] || TARGETS.sine;
            for (let i = 0; i < n; i++) {
                const x = X_MIN + (X_MAX - X_MIN) * (i + Math.random() * 0.6) / n;
                const yt = f(x);
                xs.push(x);
                yTrue.push(yt);
                ys.push(yt + (Math.random() * 2 - 1) * noise);
            }
        }

        function design(x, deg) {
            const row = new Array(deg + 1);
            row[0] = 1;
            for (let p = 1; p <= deg; p++) row[p] = row[p - 1] * x;
            return row;
        }

        function predict(x, w) {
            let s = 0;
            let xp = 1;
            for (let p = 0; p < w.length; p++) { s += w[p] * xp; xp *= x; }
            return s;
        }

        function mse(w) {
            let s = 0;
            for (let i = 0; i < xs.length; i++) {
                const d = predict(xs[i], w) - ys[i];
                s += d * d;
            }
            return s / xs.length;
        }

        function drawFit() {
            const ctx = fitCanvas.getContext('2d');
            const W = fitCanvas.width, H = fitCanvas.height, pad = 44;
            clearCanvas(fitCanvas);
            const yMin = -1.6, yMax = 1.6;
            drawAxes(ctx, W, H, pad, 'x', 'y', X_MIN, X_MAX, yMin, yMax);
            const xToPx = (x) => pad + (W - 2 * pad) * (x - X_MIN) / (X_MAX - X_MIN);
            const yToPx = (y) => pad + (H - 2 * pad) * (1 - (y - yMin) / (yMax - yMin));

            // true curve
            ctx.strokeStyle = COLORS.muted;
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let i = 0; i <= 120; i++) {
                const x = X_MIN + (X_MAX - X_MIN) * i / 120;
                const target = $('r-target').value;
                const y = (TARGETS[target] || TARGETS.sine)(x);
                const px = xToPx(x), py = yToPx(y);
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // fitted curve
            if (weights.length) {
                ctx.strokeStyle = COLORS.teal;
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                for (let i = 0; i <= 200; i++) {
                    const x = X_MIN + (X_MAX - X_MIN) * i / 200;
                    const y = predict(x, weights);
                    const px = xToPx(x), py = yToPx(Math.max(yMin, Math.min(yMax, y)));
                    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.stroke();
            }

            // data points
            ctx.fillStyle = COLORS.cyan;
            for (let i = 0; i < xs.length; i++) {
                ctx.beginPath();
                ctx.arc(xToPx(xs[i]), yToPx(ys[i]), 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        async function train() {
            if (training) return;
            training = true;
            $('r-train').disabled = true;
            const deg = parseInt($('r-degree').value, 10);
            const lr = getVal('r-lr');
            const epochs = parseInt($('r-epochs').value, 10);
            // re-init weights
            weights = new Array(deg + 1).fill(0).map(() => (Math.random() - 0.5) * 0.1);
            losses = [];
            const n = xs.length;
            const stride = Math.max(1, Math.floor(epochs / 80));

            for (let e = 0; e < epochs; e++) {
                // full-batch gradient
                const grad = new Array(weights.length).fill(0);
                for (let i = 0; i < n; i++) {
                    const x = xs[i];
                    const err = predict(x, weights) - ys[i];
                    let xp = 1;
                    for (let p = 0; p < weights.length; p++) {
                        grad[p] += 2 * err * xp / n;
                        xp *= x;
                    }
                }
                for (let p = 0; p < weights.length; p++) weights[p] -= lr * grad[p];

                if (e % stride === 0 || e === epochs - 1) {
                    const L = mse(weights);
                    losses.push(L);
                    if (!Number.isFinite(L) || L > 1e6) {
                        renderStats('r-stats', [
                            ['Status', '⚠ Diverged — try a lower learning rate'],
                            ['Epoch', `${e + 1} / ${epochs}`],
                            ['Final loss', L.toExponential(2)]
                        ]);
                        drawFit();
                        drawLossCurve(lossCanvas, losses.filter(Number.isFinite), { label: 'MSE' });
                        training = false;
                        $('r-train').disabled = false;
                        return;
                    }
                    drawFit();
                    drawLossCurve(lossCanvas, losses, { label: 'MSE' });
                    updateStats(e + 1, epochs);
                    await frame();
                }
            }
            updateStats(epochs, epochs);
            training = false;
            $('r-train').disabled = false;
        }

        function updateStats(epoch, total) {
            const L = mse(weights);
            renderStats('r-stats', [
                ['Status',          epoch >= total ? 'Finished' : 'Training…'],
                ['Epoch',           `${epoch} / ${total}`],
                ['Polynomial degree', String(weights.length - 1)],
                ['Train MSE',       L.toFixed(5)],
                ['‖w‖ (weight magnitude)', Math.sqrt(weights.reduce((s, x) => s + x*x, 0)).toFixed(3)]
            ]);
        }

        function reset() {
            const n = parseInt($('r-n').value, 10);
            const noise = parseFloat($('r-noise').value);
            const target = $('r-target').value;
            genData(n, noise, target);
            weights = [];
            losses = [];
            drawFit();
            drawLossCurve(lossCanvas, []);
            renderStats('r-stats', [
                ['Status', 'Ready'],
                ['Samples', String(xs.length)],
                ['Target', $('r-target').selectedOptions[0].text]
            ]);
        }

        bindRange('r-degree', v => Math.round(v).toString());
        bindRange('r-lr',     v => v.toExponential(1));
        bindRange('r-epochs', v => Math.round(v).toString());
        bindRange('r-noise',  v => v.toFixed(2));
        bindRange('r-n',      v => Math.round(v).toString());
        ['r-n', 'r-noise', 'r-target'].forEach(id =>
            $(id).addEventListener('change', reset));
        $('r-train').addEventListener('click', train);
        $('r-reset').addEventListener('click', reset);
        reset();
        return { reset, train };
    })();

    /* ════════════════════════════════════════════════════════════════════
       2.  TINY MLP CLASSIFIER  —  real backprop, mini-batch SGD, BCE
       ════════════════════════════════════════════════════════════════════ */
    const NN = (() => {
        const boundCanvas = $('n-boundary');
        const lossCanvas  = $('n-loss');
        let data = [];     // [{x, y, label}]
        let net = null;    // [{W, b}], W is matrix (out × in), b is vector
        let losses = [];
        let training = false;
        const VIEW = { min: -1.2, max: 1.2 };

        /* ── datasets ── */
        function genMoons(n) {
            const out = [];
            const half = Math.floor(n / 2);
            for (let i = 0; i < half; i++) {
                const t = Math.PI * i / half;
                out.push({ x: Math.cos(t) - 0.3 + rn() * 0.12,
                           y: Math.sin(t) * 0.6 - 0.1 + rn() * 0.12, label: 0 });
                out.push({ x: 1 - Math.cos(t) - 0.7 + rn() * 0.12,
                           y: 0.4 - Math.sin(t) * 0.6 + rn() * 0.12, label: 1 });
            }
            return out;
        }
        function genCircles(n) {
            const out = [];
            for (let i = 0; i < n; i++) {
                const inner = i % 2 === 0;
                const r = inner ? 0.25 + rn() * 0.12 : 0.75 + rn() * 0.12;
                const t = Math.random() * Math.PI * 2;
                out.push({ x: r * Math.cos(t), y: r * Math.sin(t), label: inner ? 0 : 1 });
            }
            return out;
        }
        function genXor(n) {
            const out = [];
            for (let i = 0; i < n; i++) {
                const x = (Math.random() * 2 - 1) * 0.95;
                const y = (Math.random() * 2 - 1) * 0.95;
                const lab = (x * y > 0) ? 0 : 1;
                out.push({ x: x + rn() * 0.05, y: y + rn() * 0.05, label: lab });
            }
            return out;
        }
        function genSpiral(n) {
            const out = [];
            const half = Math.floor(n / 2);
            for (let cls = 0; cls < 2; cls++) {
                for (let i = 0; i < half; i++) {
                    const r = i / half;
                    const t = 1.75 * i / half * 2 * Math.PI + cls * Math.PI + rn() * 0.2;
                    out.push({ x: r * Math.sin(t), y: r * Math.cos(t), label: cls });
                }
            }
            return out;
        }
        function rn() { return (Math.random() * 2 - 1) * 0.5; }

        /* ── tiny MLP ── */
        function makeNet(arch) {
            const layers = [];
            for (let i = 0; i < arch.length - 1; i++) {
                const fin = arch[i], fout = arch[i + 1];
                const scale = Math.sqrt(2 / fin);     // He init
                const W = new Array(fout);
                for (let r = 0; r < fout; r++) {
                    W[r] = new Array(fin);
                    for (let c = 0; c < fin; c++) W[r][c] = (Math.random() * 2 - 1) * scale;
                }
                const b = new Array(fout).fill(0);
                layers.push({ W, b });
            }
            return layers;
        }
        function actFn(name, x) {
            if (name === 'relu')    return x > 0 ? x : 0;
            if (name === 'tanh')    return Math.tanh(x);
            return 1 / (1 + Math.exp(-x));            // sigmoid
        }
        function actDx(name, a) {
            // a = activation output
            if (name === 'relu')    return a > 0 ? 1 : 0;
            if (name === 'tanh')    return 1 - a * a;
            return a * (1 - a);
        }
        const sig = (x) => 1 / (1 + Math.exp(-x));

        function forward(net, input, actName) {
            const cache = [];
            let a = input.slice();
            for (let l = 0; l < net.length; l++) {
                const { W, b } = net[l];
                const z = new Array(W.length);
                for (let r = 0; r < W.length; r++) {
                    let s = b[r];
                    const row = W[r];
                    for (let c = 0; c < row.length; c++) s += row[c] * a[c];
                    z[r] = s;
                }
                const isLast = (l === net.length - 1);
                const aOut = z.map(v => isLast ? sig(v) : actFn(actName, v));
                cache.push({ aIn: a, aOut });
                a = aOut;
            }
            return { out: a, cache };
        }

        function backward(net, cache, target, actName) {
            // BCE w/ sigmoid: dL/dz_last = (p - y)
            const grads = net.map(({ W, b }) => ({
                dW: W.map(row => row.map(() => 0)),
                db: b.map(() => 0)
            }));
            const last = cache.length - 1;
            let delta = cache[last].aOut.map((p, i) => p - target[i]);

            for (let l = last; l >= 0; l--) {
                const layerW = net[l].W;
                const aIn = cache[l].aIn;
                // accumulate grads
                for (let r = 0; r < layerW.length; r++) {
                    grads[l].db[r] += delta[r];
                    for (let c = 0; c < layerW[r].length; c++) {
                        grads[l].dW[r][c] += delta[r] * aIn[c];
                    }
                }
                if (l > 0) {
                    // propagate to prev layer
                    const fin = layerW[0].length;
                    const dPrev = new Array(fin).fill(0);
                    for (let c = 0; c < fin; c++) {
                        let s = 0;
                        for (let r = 0; r < layerW.length; r++) s += layerW[r][c] * delta[r];
                        dPrev[c] = s;
                    }
                    const aPrev = cache[l - 1].aOut;
                    delta = aPrev.map((a, i) => dPrev[i] * actDx(actName, a));
                }
            }
            return grads;
        }

        function applyGrads(net, grads, lr) {
            for (let l = 0; l < net.length; l++) {
                const W = net[l].W, b = net[l].b;
                const dW = grads[l].dW, db = grads[l].db;
                for (let r = 0; r < W.length; r++) {
                    b[r] -= lr * db[r];
                    for (let c = 0; c < W[r].length; c++) W[r][c] -= lr * dW[r][c];
                }
            }
        }

        function bceLoss() {
            const actName = $('n-act').value;
            let s = 0;
            for (const p of data) {
                const { out } = forward(net, [p.x, p.y], actName);
                const y = p.label;
                const pr = Math.min(1 - 1e-7, Math.max(1e-7, out[0]));
                s += -(y * Math.log(pr) + (1 - y) * Math.log(1 - pr));
            }
            return s / data.length;
        }

        function accuracy() {
            const actName = $('n-act').value;
            let ok = 0;
            for (const p of data) {
                const { out } = forward(net, [p.x, p.y], actName);
                if ((out[0] > 0.5 ? 1 : 0) === p.label) ok++;
            }
            return ok / data.length;
        }

        /* ── draw decision surface + points ── */
        function drawBoundary() {
            const ctx = boundCanvas.getContext('2d');
            const W = boundCanvas.width, H = boundCanvas.height;
            clearCanvas(boundCanvas);
            const actName = $('n-act').value;
            const grid = 96;
            const cellW = W / grid, cellH = H / grid;
            if (net) {
                for (let gx = 0; gx < grid; gx++) {
                    for (let gy = 0; gy < grid; gy++) {
                        const x = VIEW.min + (VIEW.max - VIEW.min) * gx / (grid - 1);
                        const y = VIEW.max - (VIEW.max - VIEW.min) * gy / (grid - 1);
                        const { out } = forward(net, [x, y], actName);
                        const p = out[0];
                        // blue (class 0) → teal (class 1)
                        const r = Math.round(14 * (1 - p) + 0   * p);
                        const g = Math.round(165 * (1 - p) + 212 * p);
                        const b = Math.round(233 * (1 - p) + 170 * p);
                        ctx.fillStyle = `rgba(${r},${g},${b},${0.18 + 0.18 * Math.abs(p - 0.5) * 2})`;
                        ctx.fillRect(gx * cellW, gy * cellH, cellW + 1, cellH + 1);
                    }
                }
            }
            // points
            const xToPx = (x) => (x - VIEW.min) / (VIEW.max - VIEW.min) * W;
            const yToPx = (y) => H - (y - VIEW.min) / (VIEW.max - VIEW.min) * H;
            for (const p of data) {
                ctx.fillStyle = p.label === 0 ? COLORS.cyan : COLORS.teal;
                ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(xToPx(p.x), yToPx(p.y), 4, 0, Math.PI * 2);
                ctx.fill(); ctx.stroke();
            }
        }

        async function train() {
            if (training) return;
            training = true;
            $('n-train').disabled = true;
            const hidden = parseInt($('n-hidden').value, 10);
            const layersN = parseInt($('n-layers').value, 10);
            const lr = getVal('n-lr');
            const epochs = parseInt($('n-epochs').value, 10);
            const batch = parseInt($('n-batch').value, 10);
            const actName = $('n-act').value;

            const arch = [2];
            for (let i = 0; i < layersN; i++) arch.push(hidden);
            arch.push(1);
            net = makeNet(arch);
            losses = [];

            const stride = Math.max(1, Math.floor(epochs / 60));
            const n = data.length;

            for (let e = 0; e < epochs; e++) {
                // shuffle
                for (let i = n - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [data[i], data[j]] = [data[j], data[i]];
                }
                // mini-batches
                for (let i = 0; i < n; i += batch) {
                    const end = Math.min(n, i + batch);
                    // accumulate grads across batch
                    let batchGrads = null;
                    for (let k = i; k < end; k++) {
                        const p = data[k];
                        const { cache } = forward(net, [p.x, p.y], actName);
                        const g = backward(net, cache, [p.label], actName);
                        if (!batchGrads) batchGrads = g;
                        else {
                            for (let l = 0; l < g.length; l++) {
                                const a = batchGrads[l], b = g[l];
                                for (let r = 0; r < a.dW.length; r++) {
                                    a.db[r] += b.db[r];
                                    for (let c = 0; c < a.dW[r].length; c++) a.dW[r][c] += b.dW[r][c];
                                }
                            }
                        }
                    }
                    // average + step
                    const sz = end - i;
                    for (let l = 0; l < batchGrads.length; l++) {
                        for (let r = 0; r < batchGrads[l].dW.length; r++) {
                            batchGrads[l].db[r] /= sz;
                            for (let c = 0; c < batchGrads[l].dW[r].length; c++)
                                batchGrads[l].dW[r][c] /= sz;
                        }
                    }
                    applyGrads(net, batchGrads, lr);
                }

                if (e % stride === 0 || e === epochs - 1) {
                    const L = bceLoss();
                    losses.push(L);
                    if (!Number.isFinite(L) || L > 1e6) {
                        renderStats('n-stats', [
                            ['Status', '⚠ Diverged — lower learning rate'],
                            ['Epoch', `${e + 1} / ${epochs}`],
                            ['Loss', String(L)]
                        ]);
                        drawBoundary();
                        drawLossCurve(lossCanvas, losses.filter(Number.isFinite), { label: 'BCE', color: COLORS.amber });
                        training = false;
                        $('n-train').disabled = false;
                        return;
                    }
                    drawBoundary();
                    drawLossCurve(lossCanvas, losses, { label: 'BCE', color: COLORS.amber });
                    updateStats(e + 1, epochs, L);
                    await frame();
                }
            }
            updateStats(epochs, epochs, bceLoss());
            training = false;
            $('n-train').disabled = false;
        }

        function updateStats(epoch, total, L) {
            const acc = accuracy();
            const arch = [2];
            const hidden = parseInt($('n-hidden').value, 10);
            const layersN = parseInt($('n-layers').value, 10);
            for (let i = 0; i < layersN; i++) arch.push(hidden);
            arch.push(1);
            const params = countParams(net || makeNet(arch));
            renderStats('n-stats', [
                ['Status',         epoch >= total ? 'Finished' : 'Training…'],
                ['Epoch',          `${epoch} / ${total}`],
                ['Architecture',   arch.join(' → ')],
                ['Trainable params', String(params)],
                ['BCE loss',       L.toFixed(4)],
                ['Train accuracy', (acc * 100).toFixed(1) + '%']
            ]);
        }
        function countParams(net) {
            let p = 0;
            for (const { W, b } of net) p += W.length * W[0].length + b.length;
            return p;
        }

        function reset() {
            const kind = $('n-data').value;
            const n = 200;
            if (kind === 'moons') data = genMoons(n);
            else if (kind === 'circles') data = genCircles(n);
            else if (kind === 'xor') data = genXor(n);
            else data = genSpiral(n);
            net = null;
            losses = [];
            drawBoundary();
            drawLossCurve(lossCanvas, [], { label: 'BCE', color: COLORS.amber });
            renderStats('n-stats', [
                ['Status', 'Ready'],
                ['Dataset', $('n-data').selectedOptions[0].text],
                ['Samples', String(data.length)]
            ]);
        }

        bindRange('n-hidden', v => Math.round(v).toString());
        bindRange('n-layers', v => Math.round(v).toString());
        bindRange('n-lr',     v => v.toExponential(1));
        bindRange('n-epochs', v => Math.round(v).toString());
        bindRange('n-batch',  v => Math.round(v).toString());
        $('n-data').addEventListener('change', reset);
        $('n-train').addEventListener('click', train);
        $('n-reset').addEventListener('click', reset);
        reset();
        return { reset, train };
    })();
})();
