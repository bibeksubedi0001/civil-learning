/**
 * Chapter 2 — Supervised Learning: Geotechnical & Water Resources Interactive Demos
 * Auto-injected into sub-chapters based on URL path.
 *
 * Demos:
 *  1. Settlement Regression — interactive linear regression on consolidation data
 *  2. Soil Classifier — k-NN-style soil classification from SPT + LL + PI
 *  3. Liquefaction Predictor — logistic regression / sigmoid for liquefaction yes/no
 *  4. Bearing Capacity Forest — random forest-style bearing capacity prediction
 *  5. Flood Regression — multiple regression on catchment params → peak discharge
 *  6. Model Evaluator — interactive precision/recall/F1 for dam safety classification
 */

(function () {
    'use strict';

    /* ── Helpers ── */
    const $ = s => document.querySelector(s);
    const ce = (tag, cls, html) => {
        const el = document.createElement(tag);
        if (cls) el.className = cls;
        if (html) el.innerHTML = html;
        return el;
    };
    const colors = {
        teal: '#00d4aa', cyan: '#0ea5e9', amber: '#f59e0b',
        red: '#ef4444', bg: '#0f1923', card: '#151f2b', border: '#1e2d3d',
        text: '#e2e8f0', muted: '#94a3b8'
    };

    /* ── Shared demo wrapper ── */
    function createDemoSection(title, icon, subtitle) {
        const section = ce('section', 'ch-section geo-demo-section');
        section.innerHTML = `
            <div class="section-container" style="max-width:900px;margin:0 auto;padding:40px 24px;">
                <h2 style="display:flex;align-items:center;gap:12px;font-size:1.5rem;margin-bottom:8px;color:${colors.text}">
                    <i class="${icon}" style="color:${colors.cyan}"></i> ${title}
                </h2>
                <p style="color:${colors.muted};margin-bottom:24px;font-size:.95rem">${subtitle}</p>
                <div class="demo-canvas-wrap" style="background:${colors.card};border:1px solid ${colors.border};border-radius:16px;padding:24px;position:relative;overflow:hidden"></div>
            </div>`;
        return { section, container: section.querySelector('.demo-canvas-wrap') };
    }

    function makeSlider(label, min, max, value, step, unit, onChange) {
        const wrap = ce('div', '', '');
        wrap.style.cssText = 'display:flex;align-items:center;gap:12px;margin:10px 0;flex-wrap:wrap';
        const lbl = ce('label', '', '');
        lbl.style.cssText = `font-size:.85rem;color:${colors.muted};min-width:160px`;
        lbl.textContent = label;
        const inp = document.createElement('input');
        inp.type = 'range'; inp.min = min; inp.max = max; inp.value = value; inp.step = step;
        inp.style.cssText = 'flex:1;min-width:120px;accent-color:' + colors.cyan;
        const val = ce('span', '', `${value}${unit}`);
        val.style.cssText = `font-family:'JetBrains Mono',monospace;font-size:.85rem;color:${colors.teal};min-width:70px;text-align:right`;
        inp.addEventListener('input', () => {
            val.textContent = `${inp.value}${unit}`;
            onChange(+inp.value);
        });
        wrap.append(lbl, inp, val);
        return wrap;
    }

    function makeCanvas(w, h) {
        const c = document.createElement('canvas');
        c.style.cssText = `width:100%;max-width:${w}px;height:${h}px;display:block;margin:16px auto;border-radius:10px;background:#0a1018`;
        const dpr = window.devicePixelRatio || 1;
        c.width = w * dpr; c.height = h * dpr;
        const ctx = c.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { canvas: c, ctx, W: w, H: h };
    }

    /* ══════════════════════════════════════════════════════════
       DEMO 1: Settlement Regression (Linear Regression)
       Simulates: load (kPa) vs settlement (mm) with best-fit line
       ══════════════════════════════════════════════════════════ */
    function createSettlementDemo(container) {
        const { canvas, ctx, W, H } = makeCanvas(700, 400);
        const pad = { l: 70, r: 30, t: 30, b: 50 };

        // Generate synthetic consolidation data
        let noise = 15;
        let slope = 0.12;  // mm per kPa
        let intercept = 5; // initial settlement
        let data = [];

        function genData() {
            data = [];
            for (let i = 0; i < 25; i++) {
                const load = 20 + Math.random() * 280;
                const settlement = intercept + slope * load + (Math.random() - 0.5) * noise;
                data.push({ x: load, y: Math.max(0, settlement) });
            }
        }

        function leastSquares() {
            const n = data.length;
            let sx = 0, sy = 0, sxy = 0, sx2 = 0;
            data.forEach(d => { sx += d.x; sy += d.y; sxy += d.x * d.y; sx2 += d.x * d.x; });
            const m = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
            const b = (sy - m * sx) / n;
            // R²
            const yMean = sy / n;
            let ssTot = 0, ssRes = 0;
            data.forEach(d => { ssTot += (d.y - yMean) ** 2; ssRes += (d.y - (m * d.x + b)) ** 2; });
            const r2 = 1 - ssRes / ssTot;
            return { m, b, r2 };
        }

        function draw() {
            ctx.clearRect(0, 0, W, H);
            const pW = W - pad.l - pad.r, pH = H - pad.t - pad.b;

            // Grid
            ctx.strokeStyle = '#1e2d3d'; ctx.lineWidth = 0.5;
            for (let i = 0; i <= 5; i++) {
                const x = pad.l + (pW / 5) * i;
                const y = pad.t + (pH / 5) * i;
                ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, H - pad.b); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
            }

            // Axes labels
            ctx.fillStyle = colors.muted; ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Applied Load (kPa)', W / 2, H - 8);
            ctx.save(); ctx.translate(16, H / 2); ctx.rotate(-Math.PI / 2);
            ctx.fillText('Settlement (mm)', 0, 0); ctx.restore();

            // Scale
            const xMin = 0, xMax = 320, yMin = 0, yMax = 60;
            const sx = v => pad.l + ((v - xMin) / (xMax - xMin)) * pW;
            const sy = v => pad.t + ((v - yMin) / (yMax - yMin)) * pH;

            // Tick labels
            ctx.fillStyle = colors.muted; ctx.font = '10px JetBrains Mono';
            ctx.textAlign = 'center';
            for (let v = 0; v <= 320; v += 80) ctx.fillText(v, sx(v), H - pad.b + 18);
            ctx.textAlign = 'right';
            for (let v = 0; v <= 60; v += 15) ctx.fillText(v, pad.l - 8, sy(v) + 4);

            // Data points
            data.forEach(d => {
                ctx.beginPath();
                ctx.arc(sx(d.x), sy(d.y), 5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(14,165,233,0.7)';
                ctx.fill();
                ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 1.5; ctx.stroke();
            });

            // Best-fit line
            const fit = leastSquares();
            ctx.beginPath();
            ctx.moveTo(sx(xMin), sy(fit.m * xMin + fit.b));
            ctx.lineTo(sx(xMax), sy(fit.m * xMax + fit.b));
            ctx.strokeStyle = colors.teal; ctx.lineWidth = 2.5; ctx.stroke();

            // Residuals
            ctx.setLineDash([3, 3]);
            data.forEach(d => {
                const pred = fit.m * d.x + fit.b;
                ctx.beginPath();
                ctx.moveTo(sx(d.x), sy(d.y));
                ctx.lineTo(sx(d.x), sy(pred));
                ctx.strokeStyle = 'rgba(245,158,11,0.3)'; ctx.lineWidth = 1; ctx.stroke();
            });
            ctx.setLineDash([]);

            // Stats box
            ctx.fillStyle = 'rgba(15,25,35,0.9)';
            ctx.fillRect(W - pad.r - 210, pad.t + 5, 200, 80);
            ctx.strokeStyle = colors.border; ctx.lineWidth = 1;
            ctx.strokeRect(W - pad.r - 210, pad.t + 5, 200, 80);
            ctx.fillStyle = colors.text; ctx.font = '12px JetBrains Mono'; ctx.textAlign = 'left';
            ctx.fillText(`Settlement = ${fit.m.toFixed(3)} × Load + ${fit.b.toFixed(1)}`, W - pad.r - 200, pad.t + 28);
            ctx.fillText(`R² = ${fit.r2.toFixed(4)}`, W - pad.r - 200, pad.t + 48);
            ctx.fillStyle = fit.r2 > 0.85 ? colors.teal : fit.r2 > 0.6 ? colors.amber : colors.red;
            ctx.fillText(fit.r2 > 0.85 ? '✓ Good fit' : fit.r2 > 0.6 ? '⚠ Moderate fit' : '✗ Poor fit', W - pad.r - 200, pad.t + 68);
        }

        genData(); draw();

        container.appendChild(makeSlider('Noise (scatter)', 0, 40, noise, 1, ' mm', v => { noise = v; genData(); draw(); }));
        container.appendChild(makeSlider('True Slope', 0.02, 0.25, slope, 0.01, ' mm/kPa', v => { slope = v; genData(); draw(); }));
        container.appendChild(canvas);

        const btnWrap = ce('div', '', '');
        btnWrap.style.cssText = 'text-align:center;margin-top:12px';
        const btn = ce('button', '', '<i class="fa-solid fa-shuffle"></i> New Data');
        btn.style.cssText = `padding:10px 24px;border-radius:10px;border:1px solid ${colors.border};background:${colors.card};color:${colors.text};cursor:pointer;font-size:.9rem;transition:all .3s`;
        btn.addEventListener('click', () => { genData(); draw(); });
        btnWrap.appendChild(btn);
        container.appendChild(btnWrap);
    }

    /* ══════════════════════════════════════════════════════════
       DEMO 2: Soil Classifier (k-NN style)
       SPT N-value and Liquid Limit → classify soil type
       ══════════════════════════════════════════════════════════ */
    function createSoilClassifierDemo(container) {
        const { canvas, ctx, W, H } = makeCanvas(700, 420);
        const pad = { l: 65, r: 30, t: 30, b: 55 };

        const soilTypes = [
            { name: 'Gravel (GP/GW)', color: '#f59e0b', nRange: [30, 50], llRange: [0, 25] },
            { name: 'Sand (SP/SW)', color: '#0ea5e9', nRange: [10, 35], llRange: [0, 30] },
            { name: 'Silt (ML)', color: '#00d4aa', nRange: [4, 20], llRange: [25, 50] },
            { name: 'Clay (CL/CH)', color: '#ef4444', nRange: [2, 15], llRange: [35, 80] }
        ];

        let samples = [];
        let testPoint = { n: 20, ll: 35 };

        function genSamples() {
            samples = [];
            soilTypes.forEach(st => {
                for (let i = 0; i < 15; i++) {
                    const n = st.nRange[0] + Math.random() * (st.nRange[1] - st.nRange[0]);
                    const ll = st.llRange[0] + Math.random() * (st.llRange[1] - st.llRange[0]);
                    samples.push({ n, ll, type: st.name, color: st.color });
                }
            });
        }

        function classify(pt, k) {
            const dists = samples.map(s => ({
                type: s.type, color: s.color,
                d: Math.sqrt(((s.n - pt.n) / 50) ** 2 + ((s.ll - pt.ll) / 80) ** 2)
            }));
            dists.sort((a, b) => a.d - b.d);
            const neighbors = dists.slice(0, k);
            const votes = {};
            neighbors.forEach(n => { votes[n.type] = (votes[n.type] || 0) + 1; });
            let best = '', bestCount = 0;
            Object.entries(votes).forEach(([t, c]) => { if (c > bestCount) { best = t; bestCount = c; } });
            const conf = bestCount / k;
            const clr = neighbors.find(n => n.type === best).color;
            return { type: best, confidence: conf, color: clr, neighbors };
        }

        let k = 5;

        function draw() {
            ctx.clearRect(0, 0, W, H);
            const pW = W - pad.l - pad.r, pH = H - pad.t - pad.b;

            // Grid
            ctx.strokeStyle = '#1e2d3d'; ctx.lineWidth = 0.5;
            for (let i = 0; i <= 5; i++) {
                const x = pad.l + (pW / 5) * i, y = pad.t + (pH / 5) * i;
                ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, H - pad.b); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
            }

            // Axis labels
            ctx.fillStyle = colors.muted; ctx.font = '12px Inter'; ctx.textAlign = 'center';
            ctx.fillText('SPT N-value', W / 2, H - 8);
            ctx.save(); ctx.translate(16, H / 2); ctx.rotate(-Math.PI / 2);
            ctx.fillText('Liquid Limit (%)', 0, 0); ctx.restore();

            // Scale
            const sx = v => pad.l + (v / 55) * pW;
            const sy = v => pad.t + pH - (v / 85) * pH;

            // Tick labels
            ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'center';
            for (let v = 0; v <= 50; v += 10) ctx.fillText(v, sx(v), H - pad.b + 16);
            ctx.textAlign = 'right';
            for (let v = 0; v <= 80; v += 20) ctx.fillText(v, pad.l - 8, sy(v) + 4);

            // Samples
            samples.forEach(s => {
                ctx.beginPath();
                ctx.arc(sx(s.n), sy(s.ll), 5, 0, Math.PI * 2);
                ctx.fillStyle = s.color + '99'; ctx.fill();
            });

            // Classification
            const result = classify(testPoint, k);

            // Draw connections to neighbors
            result.neighbors.forEach(nb => {
                const s = samples.find(sa => sa.type === nb.type);
                if (!s) return;
                // Find closest matching sample
                const matching = samples.filter(sa => sa.type === nb.type);
                matching.sort((a, b) => {
                    const da = Math.sqrt(((a.n - testPoint.n) / 50) ** 2 + ((a.ll - testPoint.ll) / 80) ** 2);
                    const db = Math.sqrt(((b.n - testPoint.n) / 50) ** 2 + ((b.ll - testPoint.ll) / 80) ** 2);
                    return da - db;
                });
            });

            // Draw test point
            ctx.beginPath();
            ctx.arc(sx(testPoint.n), sy(testPoint.ll), 10, 0, Math.PI * 2);
            ctx.fillStyle = result.color; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Inter'; ctx.textAlign = 'center';
            ctx.fillText('?', sx(testPoint.n), sy(testPoint.ll) + 3);

            // Result box
            ctx.fillStyle = 'rgba(15,25,35,0.92)';
            ctx.fillRect(W - pad.r - 220, pad.t + 5, 210, 72);
            ctx.strokeStyle = result.color; ctx.lineWidth = 1.5;
            ctx.strokeRect(W - pad.r - 220, pad.t + 5, 210, 72);
            ctx.fillStyle = result.color; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'left';
            ctx.fillText(`Predicted: ${result.type}`, W - pad.r - 210, pad.t + 28);
            ctx.fillStyle = colors.text; ctx.font = '11px JetBrains Mono';
            ctx.fillText(`Confidence: ${(result.confidence * 100).toFixed(0)}% (k=${k})`, W - pad.r - 210, pad.t + 48);
            ctx.fillText(`N=${testPoint.n.toFixed(0)}, LL=${testPoint.ll.toFixed(0)}%`, W - pad.r - 210, pad.t + 65);

            // Legend
            const ly = H - pad.b - 5;
            ctx.font = '10px Inter'; ctx.textAlign = 'left';
            soilTypes.forEach((st, i) => {
                const lx = pad.l + i * 140;
                ctx.fillStyle = st.color;
                ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = colors.muted;
                ctx.fillText(st.name, lx + 8, ly + 3);
            });
        }

        genSamples(); draw();

        container.appendChild(makeSlider('SPT N-value', 1, 50, testPoint.n, 1, '', v => { testPoint.n = v; draw(); }));
        container.appendChild(makeSlider('Liquid Limit (%)', 0, 80, testPoint.ll, 1, '%', v => { testPoint.ll = v; draw(); }));
        container.appendChild(makeSlider('k (neighbors)', 1, 15, k, 2, '', v => { k = v; draw(); }));
        container.appendChild(canvas);
    }

    /* ══════════════════════════════════════════════════════════
       DEMO 3: Liquefaction Predictor (Logistic / Sigmoid)
       CSR vs CRR → P(liquefaction)
       ══════════════════════════════════════════════════════════ */
    function createLiquefactionDemo(container) {
        const { canvas, ctx, W, H } = makeCanvas(700, 380);
        const pad = { l: 65, r: 30, t: 30, b: 50 };

        let nSPT = 15, depth = 5, magnitude = 7.0, waterTable = 2;

        function calcCSR() {
            const amax = 0.1 * Math.pow(10, 0.3 * (magnitude - 5));
            const sigmaV = depth * 18; // kPa (unit weight ~18 kN/m³)
            const sigmaVPrime = sigmaV - (depth - waterTable) * 9.81;
            const rd = 1 - 0.00765 * depth;
            return 0.65 * (sigmaV / Math.max(sigmaVPrime, 1)) * amax * rd;
        }

        function calcCRR() {
            const n160 = nSPT * 0.9; // simplified correction
            if (n160 < 30) {
                return 1 / (34 - n160) + n160 / 135 + 1 / (200 + n160 * 10) - 1 / 200;
            }
            return 2.0; // non-liquefiable
        }

        function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

        function draw() {
            ctx.clearRect(0, 0, W, H);
            const pW = W - pad.l - pad.r, pH = H - pad.t - pad.b;

            const CSR = calcCSR();
            const CRR = calcCRR();
            const FOS = CRR / Math.max(CSR, 0.001);
            const probLiq = sigmoid(-(FOS - 1) * 8); // map FOS around 1 to probability

            // Draw sigmoid curve
            ctx.strokeStyle = '#1e2d3d'; ctx.lineWidth = 0.5;
            for (let i = 0; i <= 5; i++) {
                const x = pad.l + (pW / 5) * i, y = pad.t + (pH / 5) * i;
                ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, H - pad.b); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
            }

            // Axes
            ctx.fillStyle = colors.muted; ctx.font = '12px Inter'; ctx.textAlign = 'center';
            ctx.fillText('Factor of Safety (CRR/CSR)', W / 2, H - 8);
            ctx.save(); ctx.translate(16, H / 2); ctx.rotate(-Math.PI / 2);
            ctx.fillText('P(Liquefaction)', 0, 0); ctx.restore();

            // Scale: FOS 0 to 3, P 0 to 1
            const sx = v => pad.l + (v / 3) * pW;
            const sy = v => pad.t + pH - v * pH;

            // Ticks
            ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'center';
            for (let v = 0; v <= 3; v += 0.5) ctx.fillText(v.toFixed(1), sx(v), H - pad.b + 16);
            ctx.textAlign = 'right';
            for (let v = 0; v <= 1; v += 0.2) ctx.fillText(v.toFixed(1), pad.l - 8, sy(v) + 4);

            // Danger zone
            ctx.fillStyle = 'rgba(239,68,68,0.06)';
            ctx.fillRect(pad.l, pad.t, sx(1) - pad.l, pH);
            ctx.fillStyle = 'rgba(0,212,170,0.04)';
            ctx.fillRect(sx(1), pad.t, W - pad.r - sx(1), pH);

            // FOS = 1 line
            ctx.setLineDash([5, 5]);
            ctx.beginPath(); ctx.moveTo(sx(1), pad.t); ctx.lineTo(sx(1), H - pad.b);
            ctx.strokeStyle = colors.amber; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = colors.amber; ctx.font = '10px Inter'; ctx.textAlign = 'center';
            ctx.fillText('FOS = 1', sx(1), pad.t - 6);

            // Sigmoid curve
            ctx.beginPath();
            for (let f = 0; f <= 3; f += 0.02) {
                const p = sigmoid(-(f - 1) * 8);
                const px = sx(f), py = sy(p);
                f === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
            }
            ctx.strokeStyle = colors.cyan; ctx.lineWidth = 2.5; ctx.stroke();

            // Current point
            const px = sx(Math.min(FOS, 3)), py = sy(probLiq);
            ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2);
            ctx.fillStyle = probLiq > 0.5 ? colors.red : colors.teal;
            ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

            // Result box
            const boxW = 240, boxH = 105;
            ctx.fillStyle = 'rgba(15,25,35,0.92)';
            ctx.fillRect(W - pad.r - boxW - 10, pad.t + 10, boxW, boxH);
            ctx.strokeStyle = probLiq > 0.5 ? colors.red : colors.teal;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(W - pad.r - boxW - 10, pad.t + 10, boxW, boxH);

            const bx = W - pad.r - boxW;
            ctx.fillStyle = colors.text; ctx.font = '11px JetBrains Mono'; ctx.textAlign = 'left';
            ctx.fillText(`CSR = ${CSR.toFixed(3)}`, bx, pad.t + 32);
            ctx.fillText(`CRR = ${CRR.toFixed(3)}`, bx, pad.t + 50);
            ctx.fillText(`FOS = ${FOS.toFixed(2)}`, bx, pad.t + 68);
            ctx.fillStyle = probLiq > 0.5 ? colors.red : colors.teal;
            ctx.font = 'bold 13px Inter';
            ctx.fillText(`P(Liq) = ${(probLiq * 100).toFixed(1)}%`, bx, pad.t + 90);
            ctx.font = '11px Inter';
            ctx.fillText(probLiq > 0.5 ? '⚠ LIQUEFIABLE' : '✓ SAFE', bx + 140, pad.t + 90);
        }

        draw();

        container.appendChild(makeSlider('SPT N-value', 2, 40, nSPT, 1, '', v => { nSPT = v; draw(); }));
        container.appendChild(makeSlider('Depth (m)', 1, 20, depth, 0.5, ' m', v => { depth = v; draw(); }));
        container.appendChild(makeSlider('Earthquake Magnitude', 5.0, 8.5, magnitude, 0.1, '', v => { magnitude = v; draw(); }));
        container.appendChild(makeSlider('Water Table (m)', 0, 10, waterTable, 0.5, ' m', v => { waterTable = v; draw(); }));
        container.appendChild(canvas);
    }

    /* ══════════════════════════════════════════════════════════
       DEMO 4: Bearing Capacity Random Forest
       Shows feature importance + prediction bars
       ══════════════════════════════════════════════════════════ */
    function createBearingCapacityRFDemo(container) {
        const { canvas, ctx, W, H } = makeCanvas(700, 400);

        let cohesion = 20, phi = 28, gamma = 18, depth = 1.5, width = 2.0;

        const features = [
            { name: 'Cohesion (c)', importance: 0 },
            { name: 'Friction (φ)', importance: 0 },
            { name: 'Unit Wt (γ)', importance: 0 },
            { name: 'Depth (Df)', importance: 0 },
            { name: 'Width (B)', importance: 0 }
        ];

        function terzaghi() {
            const phiRad = phi * Math.PI / 180;
            const Nq = Math.exp(Math.PI * Math.tan(phiRad)) * Math.pow(Math.tan(Math.PI / 4 + phiRad / 2), 2);
            const Nc = (Nq - 1) / Math.tan(phiRad + 0.001);
            const Ng = 2 * (Nq + 1) * Math.tan(phiRad);
            const qu = cohesion * Nc + gamma * depth * Nq + 0.5 * gamma * width * Ng;
            return { qu, Nc, Nq, Ng };
        }

        function calcImportances() {
            // Simulate feature importance by sensitivity
            const base = terzaghi().qu;
            const deltas = [
                Math.abs(terzaghi().qu - (() => { const oc = cohesion; cohesion += 5; const r = terzaghi().qu; cohesion = oc; return r; })()),
                Math.abs(terzaghi().qu - (() => { const op = phi; phi += 2; const r = terzaghi().qu; phi = op; return r; })()),
                Math.abs(terzaghi().qu - (() => { const og = gamma; gamma += 2; const r = terzaghi().qu; gamma = og; return r; })()),
                Math.abs(terzaghi().qu - (() => { const od = depth; depth += 0.5; const r = terzaghi().qu; depth = od; return r; })()),
                Math.abs(terzaghi().qu - (() => { const ow = width; width += 0.5; const r = terzaghi().qu; width = ow; return r; })())
            ];
            const total = deltas.reduce((a, b) => a + b, 0) || 1;
            features.forEach((f, i) => { f.importance = deltas[i] / total; });
        }

        function draw() {
            ctx.clearRect(0, 0, W, H);
            calcImportances();
            const result = terzaghi();

            // Left: Feature importance bars
            const barX = 40, barW = 260, barH = 28, gap = 12;
            ctx.fillStyle = colors.text; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'left';
            ctx.fillText('Feature Importance (Random Forest)', barX, 28);

            const barColors = [colors.amber, colors.cyan, colors.teal, '#a855f7', colors.red];
            features.forEach((f, i) => {
                const y = 48 + i * (barH + gap);
                // Label
                ctx.fillStyle = colors.muted; ctx.font = '11px Inter'; ctx.textAlign = 'left';
                ctx.fillText(f.name, barX, y + 10);
                // Background
                ctx.fillStyle = '#1a2535';
                ctx.fillRect(barX, y + 16, barW, barH);
                // Bar
                const w = f.importance * barW;
                ctx.fillStyle = barColors[i];
                ctx.fillRect(barX, y + 16, w, barH);
                // Percentage
                ctx.fillStyle = colors.text; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'right';
                ctx.fillText(`${(f.importance * 100).toFixed(1)}%`, barX + barW + 40, y + 34);
            });

            // Right: Prediction gauge
            const gx = 420, gy = 50, gw = 240, gh = 300;
            ctx.fillStyle = 'rgba(15,25,35,0.6)';
            ctx.fillRect(gx - 10, gy - 10, gw + 20, gh + 20);
            ctx.strokeStyle = colors.border; ctx.lineWidth = 1;
            ctx.strokeRect(gx - 10, gy - 10, gw + 20, gh + 20);

            ctx.fillStyle = colors.text; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'center';
            ctx.fillText('Predicted Bearing Capacity', gx + gw / 2, gy + 10);

            // Gauge
            const maxQ = 2000;
            const barFill = Math.min(result.qu / maxQ, 1);
            const gaugeY = gy + 30, gaugeH = gh - 100;

            // Background
            const grad = ctx.createLinearGradient(0, gaugeY + gaugeH, 0, gaugeY);
            grad.addColorStop(0, 'rgba(239,68,68,0.15)');
            grad.addColorStop(0.5, 'rgba(245,158,11,0.15)');
            grad.addColorStop(1, 'rgba(0,212,170,0.15)');
            ctx.fillStyle = grad;
            ctx.fillRect(gx + 40, gaugeY, gw - 80, gaugeH);

            // Fill
            const fillGrad = ctx.createLinearGradient(0, gaugeY + gaugeH, 0, gaugeY + gaugeH * (1 - barFill));
            fillGrad.addColorStop(0, colors.cyan);
            fillGrad.addColorStop(1, colors.teal);
            ctx.fillStyle = fillGrad;
            ctx.fillRect(gx + 40, gaugeY + gaugeH * (1 - barFill), gw - 80, gaugeH * barFill);

            // Value
            ctx.fillStyle = colors.text; ctx.font = 'bold 22px JetBrains Mono'; ctx.textAlign = 'center';
            ctx.fillText(`${result.qu.toFixed(0)} kPa`, gx + gw / 2, gaugeY + gaugeH + 35);
            ctx.fillStyle = colors.muted; ctx.font = '11px Inter';
            ctx.fillText(`Nc=${result.Nc.toFixed(1)}  Nq=${result.Nq.toFixed(1)}  Nγ=${result.Ng.toFixed(1)}`, gx + gw / 2, gaugeY + gaugeH + 55);

            // Safety verdict
            const allowable = result.qu / 3;
            ctx.fillStyle = colors.amber; ctx.font = '11px JetBrains Mono';
            ctx.fillText(`Allowable (FOS=3): ${allowable.toFixed(0)} kPa`, gx + gw / 2, gaugeY + gaugeH + 75);
        }

        draw();
        container.appendChild(makeSlider('Cohesion c (kPa)', 0, 100, cohesion, 1, ' kPa', v => { cohesion = v; draw(); }));
        container.appendChild(makeSlider('Friction Angle φ (°)', 10, 45, phi, 1, '°', v => { phi = v; draw(); }));
        container.appendChild(makeSlider('Unit Weight γ (kN/m³)', 14, 22, gamma, 0.5, ' kN/m³', v => { gamma = v; draw(); }));
        container.appendChild(makeSlider('Foundation Depth Df (m)', 0.5, 5, depth, 0.5, ' m', v => { depth = v; draw(); }));
        container.appendChild(makeSlider('Foundation Width B (m)', 0.5, 6, width, 0.5, ' m', v => { width = v; draw(); }));
        container.appendChild(canvas);
    }

    /* ══════════════════════════════════════════════════════════
       DEMO 5: Flood Discharge Regression
       Catchment area, rainfall intensity, slope → peak Q
       ══════════════════════════════════════════════════════════ */
    function createFloodRegressionDemo(container) {
        const { canvas, ctx, W, H } = makeCanvas(700, 380);
        const pad = { l: 65, r: 30, t: 30, b: 50 };

        let area = 50, intensity = 40, slope = 0.05, cn = 75;

        function rationalQ() {
            // Modified rational method + SCS adjustments
            const C = 0.1 + (cn / 100) * 0.7 + slope * 2;
            const Cclamp = Math.min(C, 0.95);
            return Cclamp * intensity * area / 360; // Q in m³/s
        }

        function draw() {
            ctx.clearRect(0, 0, W, H);
            const pW = W - pad.l - pad.r, pH = H - pad.t - pad.b;
            const Q = rationalQ();

            // Draw hydrograph
            ctx.strokeStyle = '#1e2d3d'; ctx.lineWidth = 0.5;
            for (let i = 0; i <= 5; i++) {
                const x = pad.l + (pW / 5) * i, y = pad.t + (pH / 5) * i;
                ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, H - pad.b); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
            }

            ctx.fillStyle = colors.muted; ctx.font = '12px Inter'; ctx.textAlign = 'center';
            ctx.fillText('Time (hours)', W / 2, H - 8);
            ctx.save(); ctx.translate(16, H / 2); ctx.rotate(-Math.PI / 2);
            ctx.fillText('Discharge (m³/s)', 0, 0); ctx.restore();

            const maxT = 24, maxQ = Math.max(Q * 1.3, 10);
            const sx = t => pad.l + (t / maxT) * pW;
            const sy = q => pad.t + pH - (q / maxQ) * pH;

            // Ticks
            ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'center';
            for (let t = 0; t <= 24; t += 4) ctx.fillText(t, sx(t), H - pad.b + 16);
            ctx.textAlign = 'right';
            for (let q = 0; q <= maxQ; q += Math.ceil(maxQ / 5)) ctx.fillText(q.toFixed(0), pad.l - 8, sy(q) + 4);

            // Hydrograph shape (gamma-like)
            const tp = 4 + (area / 100) * 3; // time to peak
            ctx.beginPath();
            const fillPts = [];
            for (let t = 0; t <= maxT; t += 0.1) {
                let q;
                if (t <= tp) {
                    q = Q * Math.pow(t / tp, 2.5);
                } else {
                    q = Q * Math.exp(-1.5 * (t - tp) / tp);
                }
                const px = sx(t), py = sy(q);
                t === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
                fillPts.push({ x: px, y: py });
            }
            ctx.strokeStyle = colors.cyan; ctx.lineWidth = 2.5; ctx.stroke();

            // Fill under curve
            ctx.beginPath();
            fillPts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.lineTo(sx(maxT), sy(0)); ctx.lineTo(sx(0), sy(0)); ctx.closePath();
            ctx.fillStyle = 'rgba(14,165,233,0.1)'; ctx.fill();

            // Peak marker
            ctx.beginPath();
            ctx.arc(sx(tp), sy(Q), 6, 0, Math.PI * 2);
            ctx.fillStyle = colors.amber; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();

            // Rainfall bar at top
            const rainH = 30;
            ctx.fillStyle = 'rgba(14,165,233,0.15)';
            ctx.fillRect(sx(0), pad.t, sx(tp) - sx(0), rainH);
            ctx.fillStyle = colors.cyan; ctx.font = '9px Inter'; ctx.textAlign = 'center';
            ctx.fillText(`Rainfall: ${intensity} mm/hr`, sx(tp / 2), pad.t + 18);

            // Result box
            ctx.fillStyle = 'rgba(15,25,35,0.92)';
            ctx.fillRect(W - pad.r - 200, pad.t + rainH + 10, 190, 80);
            ctx.strokeStyle = colors.cyan; ctx.lineWidth = 1;
            ctx.strokeRect(W - pad.r - 200, pad.t + rainH + 10, 190, 80);
            const bx = W - pad.r - 190;
            ctx.fillStyle = colors.text; ctx.font = '11px JetBrains Mono'; ctx.textAlign = 'left';
            ctx.fillText(`Q_peak = ${Q.toFixed(1)} m³/s`, bx, pad.t + rainH + 32);
            ctx.fillText(`T_peak = ${tp.toFixed(1)} hrs`, bx, pad.t + rainH + 50);
            ctx.fillStyle = colors.muted; ctx.font = '10px Inter';
            ctx.fillText(`C = ${(0.1 + (cn / 100) * 0.7 + slope * 2).toFixed(2)}`, bx, pad.t + rainH + 68);
            ctx.fillText(`Volume ≈ ${(Q * tp * 1800 / 1000).toFixed(0)} ×10³ m³`, bx, pad.t + rainH + 82);
        }

        draw();
        container.appendChild(makeSlider('Catchment Area (km²)', 5, 200, area, 5, ' km²', v => { area = v; draw(); }));
        container.appendChild(makeSlider('Rainfall Intensity (mm/hr)', 10, 120, intensity, 5, ' mm/hr', v => { intensity = v; draw(); }));
        container.appendChild(makeSlider('Catchment Slope', 0.01, 0.2, slope, 0.01, '', v => { slope = v; draw(); }));
        container.appendChild(makeSlider('Curve Number (CN)', 40, 98, cn, 1, '', v => { cn = v; draw(); }));
        container.appendChild(canvas);
    }

    /* ══════════════════════════════════════════════════════════
       DEMO 6: Model Evaluator — Precision/Recall for Dam Safety
       Interactive confusion matrix with CE context
       ══════════════════════════════════════════════════════════ */
    function createModelEvaluatorDemo(container) {
        const { canvas, ctx, W, H } = makeCanvas(700, 420);

        let threshold = 0.5;
        // Simulated predictions: dam safety (0=safe, 1=at-risk)
        const rawData = [];
        for (let i = 0; i < 100; i++) {
            const actual = Math.random() < 0.2 ? 1 : 0; // 20% actually at risk
            const score = actual === 1
                ? 0.3 + Math.random() * 0.6
                : Math.random() * 0.5;
            rawData.push({ actual, score });
        }

        function getMetrics() {
            let TP = 0, FP = 0, TN = 0, FN = 0;
            rawData.forEach(d => {
                const pred = d.score >= threshold ? 1 : 0;
                if (pred === 1 && d.actual === 1) TP++;
                else if (pred === 1 && d.actual === 0) FP++;
                else if (pred === 0 && d.actual === 0) TN++;
                else FN++;
            });
            const precision = TP / (TP + FP) || 0;
            const recall = TP / (TP + FN) || 0;
            const f1 = 2 * precision * recall / (precision + recall) || 0;
            const accuracy = (TP + TN) / rawData.length;
            return { TP, FP, TN, FN, precision, recall, f1, accuracy };
        }

        function draw() {
            ctx.clearRect(0, 0, W, H);
            const m = getMetrics();

            // Title
            ctx.fillStyle = colors.text; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'left';
            ctx.fillText('Dam Safety Classification — Confusion Matrix', 30, 28);

            // Confusion Matrix (left side)
            const mx = 30, my = 50, cellW = 120, cellH = 70;
            const matrixColors = {
                TP: 'rgba(0,212,170,0.2)', FP: 'rgba(239,68,68,0.15)',
                FN: 'rgba(239,68,68,0.25)', TN: 'rgba(0,212,170,0.12)'
            };

            // Headers
            ctx.fillStyle = colors.muted; ctx.font = '10px Inter'; ctx.textAlign = 'center';
            ctx.fillText('Predicted Safe', mx + cellW / 2, my - 5);
            ctx.fillText('Predicted At-Risk', mx + cellW + cellW / 2, my - 5);
            ctx.save(); ctx.translate(mx - 15, my + cellH); ctx.rotate(-Math.PI / 2);
            ctx.fillText('Actually At-Risk', 0, 0); ctx.restore();
            ctx.save(); ctx.translate(mx - 15, my + cellH * 2); ctx.rotate(-Math.PI / 2);
            ctx.fillText('Actually Safe', 0, 0); ctx.restore();

            // Cells
            const cells = [
                { x: mx + cellW, y: my, val: m.TP, label: 'TP', clr: matrixColors.TP, borderClr: colors.teal },
                { x: mx, y: my, val: m.FN, label: 'FN', clr: matrixColors.FN, borderClr: colors.red },
                { x: mx, y: my + cellH, val: m.TN, label: 'TN', clr: matrixColors.TN, borderClr: colors.teal },
                { x: mx + cellW, y: my + cellH, val: m.FP, label: 'FP', clr: matrixColors.FP, borderClr: colors.red }
            ];
            cells.forEach(c => {
                ctx.fillStyle = c.clr;
                ctx.fillRect(c.x, c.y, cellW, cellH);
                ctx.strokeStyle = c.borderClr; ctx.lineWidth = 1.5;
                ctx.strokeRect(c.x, c.y, cellW, cellH);
                ctx.fillStyle = colors.text; ctx.font = 'bold 24px JetBrains Mono'; ctx.textAlign = 'center';
                ctx.fillText(c.val, c.x + cellW / 2, c.y + cellH / 2 + 4);
                ctx.fillStyle = colors.muted; ctx.font = '10px Inter';
                ctx.fillText(c.label, c.x + cellW / 2, c.y + cellH / 2 + 22);
            });

            // CE interpretation below matrix
            const iy = my + cellH * 2 + 30;
            ctx.fillStyle = colors.muted; ctx.font = '10px Inter'; ctx.textAlign = 'left';
            if (m.FN > 0) {
                ctx.fillStyle = colors.red;
                ctx.fillText(`⚠ ${m.FN} at-risk dams classified as SAFE — DANGEROUS!`, mx, iy);
            } else {
                ctx.fillStyle = colors.teal;
                ctx.fillText('✓ No at-risk dams misclassified as safe', mx, iy);
            }
            ctx.fillStyle = colors.muted;
            ctx.fillText(`${m.FP} safe dams flagged for inspection (false alarms — costly but not dangerous)`, mx, iy + 18);

            // Right side: metrics bars
            const rx = 310, ry = 50, rw = 340;
            const metrics = [
                { name: 'Accuracy', val: m.accuracy, clr: '#a855f7' },
                { name: 'Precision', val: m.precision, clr: colors.cyan },
                { name: 'Recall (Sensitivity)', val: m.recall, clr: colors.amber },
                { name: 'F1 Score', val: m.f1, clr: colors.teal }
            ];

            metrics.forEach((met, i) => {
                const y = ry + i * 55;
                ctx.fillStyle = colors.muted; ctx.font = '11px Inter'; ctx.textAlign = 'left';
                ctx.fillText(met.name, rx, y);
                // bar bg
                ctx.fillStyle = '#1a2535';
                ctx.fillRect(rx, y + 8, rw - 80, 22);
                // bar fill
                ctx.fillStyle = met.clr;
                ctx.fillRect(rx, y + 8, (rw - 80) * met.val, 22);
                // value
                ctx.fillStyle = colors.text; ctx.font = '11px JetBrains Mono'; ctx.textAlign = 'right';
                ctx.fillText(`${(met.val * 100).toFixed(1)}%`, rx + rw - 10, y + 24);
            });

            // Key insight
            const ky = ry + metrics.length * 55 + 20;
            ctx.fillStyle = 'rgba(14,165,233,0.08)';
            ctx.fillRect(rx, ky, rw - 20, 70);
            ctx.strokeStyle = 'rgba(14,165,233,0.2)'; ctx.lineWidth = 1;
            ctx.strokeRect(rx, ky, rw - 20, 70);
            ctx.fillStyle = colors.cyan; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'left';
            ctx.fillText('💡 For dam safety:', rx + 10, ky + 18);
            ctx.fillStyle = colors.text; ctx.font = '10px Inter';
            ctx.fillText('RECALL matters most — missing a failing dam is', rx + 10, ky + 36);
            ctx.fillText('catastrophic. Accept more false alarms (lower precision)', rx + 10, ky + 50);
            ctx.fillText('to catch every at-risk case (higher recall).', rx + 10, ky + 64);

            // Threshold indicator
            ctx.fillStyle = colors.text; ctx.font = '12px JetBrains Mono'; ctx.textAlign = 'center';
            ctx.fillText(`Threshold: ${threshold.toFixed(2)}`, W / 2, H - 10);
        }

        draw();
        container.appendChild(makeSlider('Decision Threshold', 0.1, 0.9, threshold, 0.05, '', v => { threshold = v; draw(); }));
        container.appendChild(canvas);

        // CE insight note
        const note = ce('div', '', `
            <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:16px;margin-top:16px">
                <strong style="color:${colors.amber}">🎯 Engineer's Rule:</strong>
                <span style="color:${colors.text};font-size:.9rem"> Lower the threshold for safety-critical systems (dams, bridges, slopes) — 
                it's better to inspect 10 safe dams than miss 1 failing dam.</span>
            </div>
        `);
        container.appendChild(note);
    }

    /* ══════════════════════════════════════════════════════════
       AUTO-INJECTION LOGIC
       ══════════════════════════════════════════════════════════ */
    const demoMap = {
        'sub1': [
            { fn: createSettlementDemo, title: 'Interactive: Settlement Regression',
              icon: 'fa-solid fa-chart-line', sub: 'Click & drag sliders to see how noise and true slope affect the best-fit regression line' }
        ],
        'sub2': [
            { fn: createSettlementDemo, title: 'CE Demo: Consolidation Settlement Prediction',
              icon: 'fa-solid fa-arrow-down-up-across-line', sub: 'Predict settlement from applied load using linear regression — adjust noise and slope' }
        ],
        'sub3': [
            { fn: createFloodRegressionDemo, title: 'CE Demo: Flood Discharge — Multiple Regression',
              icon: 'fa-solid fa-water', sub: 'Adjust catchment parameters to see how multiple factors predict peak flood discharge' }
        ],
        'sub4': [
            { fn: createSoilClassifierDemo, title: 'CE Demo: Soil Type Classification (k-NN)',
              icon: 'fa-solid fa-layer-group', sub: 'Classify soil type from SPT N-value and Liquid Limit using k-Nearest Neighbors' }
        ],
        'sub5': [
            { fn: createLiquefactionDemo, title: 'CE Demo: Liquefaction Prediction (Logistic Regression)',
              icon: 'fa-solid fa-house-crack', sub: 'Predict liquefaction probability using the sigmoid function on CSR/CRR ratio' }
        ],
        'sub6': [
            { fn: createBearingCapacityRFDemo, title: 'CE Demo: Bearing Capacity — Random Forest',
              icon: 'fa-solid fa-weight-hanging', sub: 'Explore feature importance and predict bearing capacity using Terzaghi\'s equation' }
        ],
        'sub7': [
            { fn: createLiquefactionDemo, title: 'CE Demo: SVM for Liquefaction Classification',
              icon: 'fa-solid fa-vector-square', sub: 'Adjust soil parameters and earthquake intensity to classify liquefaction risk' }
        ],
        'sub8': [
            { fn: createModelEvaluatorDemo, title: 'CE Demo: Dam Safety — Precision vs Recall',
              icon: 'fa-solid fa-gauge-high', sub: 'Adjust the decision threshold and see how it affects false negatives vs false alarms' }
        ],
        'sub9': [
            { fn: createSettlementDemo, title: 'CE Demo: Overfitting in Settlement Prediction',
              icon: 'fa-solid fa-sliders', sub: 'Increase noise to see how the model struggles — this is where regularization helps' },
            { fn: createBearingCapacityRFDemo, title: 'CE Demo: Feature Importance for Regularization',
              icon: 'fa-solid fa-tree', sub: 'See which features matter most — Lasso would zero out the least important ones' }
        ],
        'sub10': [
            { fn: createSoilClassifierDemo, title: 'Case Study Demo: Site Soil Classification',
              icon: 'fa-solid fa-layer-group', sub: 'Classify site soils using k-NN — part of the site response analysis pipeline' },
            { fn: createBearingCapacityRFDemo, title: 'Case Study Demo: Feature Importance Analysis',
              icon: 'fa-solid fa-chart-bar', sub: 'Identify which geotechnical parameters drive site amplification predictions' }
        ]
    };

    function inject() {
        const path = window.location.pathname;
        const match = path.match(/sub(\d+)\.html/);
        if (!match) return;
        const key = 'sub' + match[1];
        const demos = demoMap[key];
        if (!demos) return;

        // Find quiz section to insert before
        const quizSection = document.querySelector('#quiz-section, #knowledge-check, #sec-quiz, #quiz, [id*="quiz"]');
        const insertTarget = quizSection || document.querySelector('.ch-section:last-of-type');

        demos.forEach(d => {
            const { section, container } = createDemoSection(d.title, d.icon, d.sub);
            if (insertTarget && insertTarget.parentNode) {
                insertTarget.parentNode.insertBefore(section, insertTarget);
            } else {
                document.body.appendChild(section);
            }
            d.fn(container);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }

    window.Ch2GeoDemo = {
        createSettlementDemo,
        createSoilClassifierDemo,
        createLiquefactionDemo,
        createBearingCapacityRFDemo,
        createFloodRegressionDemo,
        createModelEvaluatorDemo
    };
})();
