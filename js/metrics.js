/* metrics.js — Interactive confusion matrix, ROC and PR curves.
 *
 * Self-contained, pure JS. Generates synthetic preset datasets
 * (pairs of true label + predicted score in [0,1]) and lets the user
 * drag a decision threshold while every cell + curve marker updates.
 */
(function () {
    'use strict';

    // ───────── Seeded RNG (mulberry32) ─────────
    function mulberry32(seed) {
        let s = seed >>> 0;
        return function () {
            s = (s + 0x6D2B79F5) >>> 0;
            let t = s;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function randn(rng) { // Box–Muller
        let u = 0, v = 0;
        while (u === 0) u = rng();
        while (v === 0) v = rng();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
    const clamp01 = (x) => Math.max(0, Math.min(1, x));

    // ───────── Preset generators ─────────
    // Each returns { y: Uint8Array, s: Float64Array, name, blurb }
    function genPreset(kind) {
        const rng = mulberry32(20260525);
        const presets = {
            strong: {
                n: 600, prevalence: 0.45, posMean: 0.78, posStd: 0.13, negMean: 0.22, negStd: 0.13,
                name: 'Strong crack detector',
                blurb: '600 concrete-surface images scored by a well-trained crack-classification CNN. Positive class (cracked) and negative class (intact) overlap only at the tails — easy AUC ≈ 0.95.'
            },
            medium: {
                n: 500, prevalence: 0.40, posMean: 0.68, posStd: 0.18, negMean: 0.34, negStd: 0.18,
                name: 'Medium beam-safety classifier',
                blurb: '500 RC beams scored as “safe / unsafe” by a moderately trained gradient-boosted model. Distributions overlap visibly — AUC ≈ 0.85.'
            },
            weak: {
                n: 500, prevalence: 0.50, posMean: 0.58, posStd: 0.22, negMean: 0.45, negStd: 0.22,
                name: 'Weak baseline',
                blurb: 'A barely-better-than-coin-flip baseline (e.g. logistic regression on two poorly-correlated soil features). Heavy overlap — AUC ≈ 0.65.'
            },
            random: {
                n: 500, prevalence: 0.50, posMean: 0.50, posStd: 0.25, negMean: 0.50, negStd: 0.25,
                name: 'Random guesser',
                blurb: 'No signal at all: both classes drawn from the same distribution. ROC sits on the diagonal, AUC ≈ 0.50.'
            },
            imbalanced: {
                n: 800, prevalence: 0.05, posMean: 0.72, posStd: 0.16, negMean: 0.20, negStd: 0.16,
                name: 'Rare-event detector (5 % positives)',
                blurb: '800 bridge inspections — only 5 % of decks are actually deteriorated. Even a strong AUC produces poor precision at low thresholds; PR curve tells the real story.'
            },
        };
        const p = presets[kind] || presets.strong;
        const y = new Uint8Array(p.n);
        const s = new Float64Array(p.n);
        for (let i = 0; i < p.n; i++) {
            const isPos = rng() < p.prevalence ? 1 : 0;
            y[i] = isPos;
            const mu = isPos ? p.posMean : p.negMean;
            const sd = isPos ? p.posStd : p.negStd;
            s[i] = clamp01(mu + sd * randn(rng));
        }
        return { y, s, name: p.name, blurb: p.blurb };
    }

    // ───────── Metric machinery ─────────
    // Pre-sort by score (descending) for fast ROC/PR sweeps.
    function buildSorted(ds) {
        const n = ds.y.length;
        const idx = Array.from({ length: n }, (_, i) => i);
        idx.sort((a, b) => ds.s[b] - ds.s[a]);
        const ys = new Uint8Array(n);
        const ss = new Float64Array(n);
        for (let i = 0; i < n; i++) { ys[i] = ds.y[idx[i]]; ss[i] = ds.s[idx[i]]; }
        return { ys, ss };
    }

    // Confusion matrix at threshold t (predict positive iff score >= t)
    function confusion(ds, t) {
        let tp = 0, fp = 0, tn = 0, fn = 0;
        for (let i = 0; i < ds.y.length; i++) {
            const pred = ds.s[i] >= t ? 1 : 0;
            if (pred === 1 && ds.y[i] === 1) tp++;
            else if (pred === 1 && ds.y[i] === 0) fp++;
            else if (pred === 0 && ds.y[i] === 0) tn++;
            else fn++;
        }
        return { tp, fp, tn, fn };
    }

    function metricsFromCM(c) {
        const n = c.tp + c.fp + c.tn + c.fn;
        const acc = n ? (c.tp + c.tn) / n : 0;
        const prec = (c.tp + c.fp) ? c.tp / (c.tp + c.fp) : 0;
        const rec = (c.tp + c.fn) ? c.tp / (c.tp + c.fn) : 0;
        const spec = (c.tn + c.fp) ? c.tn / (c.tn + c.fp) : 0;
        const fpr = 1 - spec;
        const f1 = (prec + rec) ? 2 * prec * rec / (prec + rec) : 0;
        return { acc, prec, rec, spec, fpr, f1 };
    }

    // ROC: returns arrays of fpr, tpr from threshold +∞ down to −∞.
    function rocCurve(sorted) {
        const { ys, ss } = sorted;
        const n = ys.length;
        let P = 0, N = 0;
        for (let i = 0; i < n; i++) (ys[i] ? P++ : N++);
        const fpr = [0], tpr = [0], thr = [Infinity];
        let tp = 0, fp = 0;
        for (let i = 0; i < n; i++) {
            if (ys[i] === 1) tp++; else fp++;
            // Only emit a point when score changes (proper step)
            if (i === n - 1 || ss[i] !== ss[i + 1]) {
                fpr.push(N ? fp / N : 0);
                tpr.push(P ? tp / P : 0);
                thr.push(ss[i]);
            }
        }
        // AUC by trapezoid on (fpr, tpr) — already sorted ascending in fpr.
        let auc = 0;
        for (let i = 1; i < fpr.length; i++) {
            auc += (fpr[i] - fpr[i - 1]) * (tpr[i] + tpr[i - 1]) / 2;
        }
        return { fpr, tpr, thr, auc };
    }

    // PR: returns precision/recall arrays from highest threshold down.
    function prCurve(sorted) {
        const { ys, ss } = sorted;
        const n = ys.length;
        let P = 0;
        for (let i = 0; i < n; i++) if (ys[i]) P++;
        const prec = [], rec = [], thr = [];
        let tp = 0, fp = 0;
        for (let i = 0; i < n; i++) {
            if (ys[i] === 1) tp++; else fp++;
            if (i === n - 1 || ss[i] !== ss[i + 1]) {
                prec.push((tp + fp) ? tp / (tp + fp) : 1);
                rec.push(P ? tp / P : 0);
                thr.push(ss[i]);
            }
        }
        // Average Precision: sum of (R_k − R_{k-1}) · P_k
        let ap = 0, prevR = 0;
        for (let i = 0; i < prec.length; i++) {
            ap += (rec[i] - prevR) * prec[i];
            prevR = rec[i];
        }
        return { prec, rec, thr, ap };
    }

    // ───────── Canvas helpers ─────────
    function setupHiDPI(canvas) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { ctx, w: rect.width, h: rect.height };
    }

    function drawAxes(ctx, x0, y0, x1, y1, xLabel, yLabel) {
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1);
        ctx.stroke();
        // Gridlines + tick labels
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        for (let t = 0; t <= 1.001; t += 0.2) {
            const x = x0 + (x1 - x0) * t;
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
            ctx.fillText(t.toFixed(1), x, y1 + 4);
        }
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        for (let t = 0; t <= 1.001; t += 0.2) {
            const y = y1 - (y1 - y0) * t;
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
            ctx.fillText(t.toFixed(1), x0 - 6, y);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '600 12px "Inter", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(xLabel, (x0 + x1) / 2, y1 + 22);
        ctx.save();
        ctx.translate(x0 - 38, (y0 + y1) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(yLabel, 0, 0);
        ctx.restore();
    }

    function drawCurve(ctx, xs, ys, x0, y0, x1, y1, color, fill) {
        if (xs.length === 0) return;
        const mapX = (v) => x0 + (x1 - x0) * v;
        const mapY = (v) => y1 - (y1 - y0) * v;
        if (fill) {
            ctx.beginPath();
            ctx.moveTo(mapX(xs[0]), y1);
            for (let i = 0; i < xs.length; i++) ctx.lineTo(mapX(xs[i]), mapY(ys[i]));
            ctx.lineTo(mapX(xs[xs.length - 1]), y1);
            ctx.closePath();
            ctx.fillStyle = fill;
            ctx.fill();
        }
        ctx.beginPath();
        ctx.moveTo(mapX(xs[0]), mapY(ys[0]));
        for (let i = 1; i < xs.length; i++) ctx.lineTo(mapX(xs[i]), mapY(ys[i]));
        ctx.strokeStyle = color; ctx.lineWidth = 2.2;
        ctx.stroke();
    }

    function drawThresholdDot(ctx, x, y, color, label) {
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#0a0a0f'; ctx.stroke();
        if (label) {
            ctx.fillStyle = 'rgba(255,255,255,0.95)';
            ctx.font = '600 11px "JetBrains Mono", monospace';
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText(label, x + 11, y);
        }
    }

    // Find curve point with threshold closest to (but >=, in ROC convention) t
    function findClosestThr(thr, t) {
        // thr arrays are sorted descending from +Inf
        let best = 0, bestDiff = Infinity;
        for (let i = 0; i < thr.length; i++) {
            const d = Math.abs(thr[i] - t);
            if (d < bestDiff) { bestDiff = d; best = i; }
        }
        return best;
    }

    // ───────── State ─────────
    const state = {
        ds: null,
        sorted: null,
        roc: null,
        pr: null,
        t: 0.50,
    };

    function recomputeCurves() {
        state.sorted = buildSorted(state.ds);
        state.roc = rocCurve(state.sorted);
        state.pr = prCurve(state.sorted);
    }

    // ───────── Render ─────────
    const fmt = (x, d = 3) => (isFinite(x) ? x.toFixed(d) : '—');
    const pct = (x) => (isFinite(x) ? (x * 100).toFixed(1) + '%' : '—');

    function renderCM(cm) {
        document.getElementById('mx-tp').textContent = cm.tp;
        document.getElementById('mx-fp').textContent = cm.fp;
        document.getElementById('mx-tn').textContent = cm.tn;
        document.getElementById('mx-fn').textContent = cm.fn;
        // Color intensity scaling
        const maxV = Math.max(cm.tp, cm.fp, cm.tn, cm.fn, 1);
        const map = { tp: cm.tp, fn: cm.fn, fp: cm.fp, tn: cm.tn };
        const tints = { tp: '0,212,170', fn: '239,68,68', fp: '239,68,68', tn: '0,212,170' };
        for (const k of ['tp', 'fn', 'fp', 'tn']) {
            const cell = document.querySelector(`.mx-cm__cell[data-cell="${k}"]`);
            if (!cell) continue;
            const a = 0.10 + 0.55 * (map[k] / maxV);
            cell.style.background = `rgba(${tints[k]}, ${a.toFixed(3)})`;
        }
    }

    function renderMetrics(m, cm) {
        const items = [
            { k: 'Accuracy', v: pct(m.acc), tone: m.acc >= 0.85 ? 'good' : m.acc >= 0.7 ? 'ok' : 'warn' },
            { k: 'Precision', v: pct(m.prec), tone: m.prec >= 0.85 ? 'good' : m.prec >= 0.6 ? 'ok' : 'warn' },
            { k: 'Recall (TPR)', v: pct(m.rec), tone: m.rec >= 0.85 ? 'good' : m.rec >= 0.6 ? 'ok' : 'warn' },
            { k: 'Specificity', v: pct(m.spec), tone: m.spec >= 0.85 ? 'good' : m.spec >= 0.6 ? 'ok' : 'warn' },
            { k: 'F1 score', v: fmt(m.f1), tone: m.f1 >= 0.8 ? 'good' : m.f1 >= 0.6 ? 'ok' : 'warn' },
            { k: 'False Positive Rate', v: pct(m.fpr), tone: m.fpr <= 0.15 ? 'good' : m.fpr <= 0.3 ? 'ok' : 'warn' },
        ];
        const el = document.getElementById('mx-metrics');
        el.innerHTML = items.map(it =>
            `<li class="mx-metric mx-metric--${it.tone}">
                <span class="mx-metric__k">${it.k}</span>
                <span class="mx-metric__v">${it.v}</span>
            </li>`
        ).join('');

        // Plain-language explanation
        const total = cm.tp + cm.fp + cm.tn + cm.fn;
        const expl = document.getElementById('mx-explain');
        if (!total) { expl.textContent = ''; return; }
        const missed = cm.fn, false_alarms = cm.fp;
        expl.innerHTML =
            `At threshold <strong>${state.t.toFixed(2)}</strong>, the model flags
             <strong>${cm.tp + cm.fp}</strong> of ${total} cases as positive.
             It correctly catches <strong>${cm.tp}</strong> true positives,
             misses <strong>${missed}</strong>, and raises
             <strong>${false_alarms}</strong> false alarms.
             ${m.prec < 0.5 && cm.tp + cm.fp > 0
                ? 'Most positive predictions are wrong — raise the threshold to improve precision.'
                : m.rec < 0.5
                    ? 'You\u2019re missing more than half of the real positives — lower the threshold to improve recall.'
                    : 'Precision and recall are reasonably balanced here.'}`;
    }

    function renderROC() {
        const c = document.getElementById('mx-roc');
        const { ctx, w, h } = setupHiDPI(c);
        ctx.clearRect(0, 0, w, h);
        const pad = { l: 56, r: 18, t: 16, b: 42 };
        const x0 = pad.l, y0 = pad.t, x1 = w - pad.r, y1 = h - pad.b;

        drawAxes(ctx, x0, y0, x1, y1, 'False Positive Rate', 'True Positive Rate');

        // Diagonal
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.setLineDash([6, 6]); ctx.beginPath();
        ctx.moveTo(x0, y1); ctx.lineTo(x1, y0); ctx.stroke();
        ctx.setLineDash([]);

        // ROC curve
        drawCurve(ctx, state.roc.fpr, state.roc.tpr, x0, y0, x1, y1,
            '#00d4aa', 'rgba(0,212,170,0.10)');

        // Threshold dot
        const i = findClosestThr(state.roc.thr, state.t);
        const fx = state.roc.fpr[i], fy = state.roc.tpr[i];
        const cx = x0 + (x1 - x0) * fx;
        const cy = y1 - (y1 - y0) * fy;
        drawThresholdDot(ctx, cx, cy, '#f59e0b',
            `t=${state.t.toFixed(2)}  FPR=${fx.toFixed(2)}  TPR=${fy.toFixed(2)}`);

        document.getElementById('mx-auc').textContent = `AUC: ${state.roc.auc.toFixed(3)}`;
    }

    function renderPR() {
        const c = document.getElementById('mx-pr');
        const { ctx, w, h } = setupHiDPI(c);
        ctx.clearRect(0, 0, w, h);
        const pad = { l: 56, r: 18, t: 16, b: 42 };
        const x0 = pad.l, y0 = pad.t, x1 = w - pad.r, y1 = h - pad.b;

        drawAxes(ctx, x0, y0, x1, y1, 'Recall', 'Precision');

        // Baseline = positive prevalence
        let P = 0;
        for (let i = 0; i < state.ds.y.length; i++) if (state.ds.y[i]) P++;
        const prev = state.ds.y.length ? P / state.ds.y.length : 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.setLineDash([6, 6]); ctx.beginPath();
        const baseY = y1 - (y1 - y0) * prev;
        ctx.moveTo(x0, baseY); ctx.lineTo(x1, baseY);
        ctx.stroke(); ctx.setLineDash([]);

        drawCurve(ctx, state.pr.rec, state.pr.prec, x0, y0, x1, y1,
            '#0ea5e9', 'rgba(14,165,233,0.10)');

        const i = findClosestThr(state.pr.thr, state.t);
        const rr = state.pr.rec[i], pp = state.pr.prec[i];
        const cx = x0 + (x1 - x0) * rr;
        const cy = y1 - (y1 - y0) * pp;
        drawThresholdDot(ctx, cx, cy, '#f59e0b',
            `t=${state.t.toFixed(2)}  R=${rr.toFixed(2)}  P=${pp.toFixed(2)}`);

        document.getElementById('mx-ap').textContent = `AP: ${state.pr.ap.toFixed(3)}`;
    }

    function renderScoreHist() {
        const c = document.getElementById('mx-scores');
        const { ctx, w, h } = setupHiDPI(c);
        ctx.clearRect(0, 0, w, h);
        const pad = { l: 48, r: 18, t: 14, b: 38 };
        const x0 = pad.l, y0 = pad.t, x1 = w - pad.r, y1 = h - pad.b;

        const BINS = 30;
        const pos = new Array(BINS).fill(0);
        const neg = new Array(BINS).fill(0);
        for (let i = 0; i < state.ds.y.length; i++) {
            let b = Math.floor(state.ds.s[i] * BINS);
            if (b >= BINS) b = BINS - 1;
            if (state.ds.y[i]) pos[b]++; else neg[b]++;
        }
        let maxV = 1;
        for (let i = 0; i < BINS; i++) maxV = Math.max(maxV, pos[i], neg[i]);

        // Axes
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        for (let t = 0; t <= 1.001; t += 0.1) {
            const x = x0 + (x1 - x0) * t;
            ctx.fillText(t.toFixed(1), x, y1 + 4);
        }
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText('count', x0 - 4, y0 + 8);

        const bw = (x1 - x0) / BINS;
        for (let i = 0; i < BINS; i++) {
            const xLeft = x0 + i * bw;
            // negatives (cyan, left half of bin)
            const hN = (neg[i] / maxV) * (y1 - y0);
            ctx.fillStyle = 'rgba(14,165,233,0.75)';
            ctx.fillRect(xLeft + 1, y1 - hN, bw / 2 - 1, hN);
            // positives (teal, right half)
            const hP = (pos[i] / maxV) * (y1 - y0);
            ctx.fillStyle = 'rgba(0,212,170,0.85)';
            ctx.fillRect(xLeft + bw / 2, y1 - hP, bw / 2 - 1, hP);
        }

        // Threshold line
        const tx = x0 + (x1 - x0) * state.t;
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(tx, y0); ctx.lineTo(tx, y1); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#f59e0b';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(`t = ${state.t.toFixed(2)}`, tx, y0 - 2);

        // Legend
        ctx.font = '600 11px "Inter", sans-serif';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0,212,170,0.95)';
        ctx.fillRect(x1 - 150, y0 + 6, 12, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText('Positive class', x1 - 132, y0 + 12);
        ctx.fillStyle = 'rgba(14,165,233,0.95)';
        ctx.fillRect(x1 - 150, y0 + 24, 12, 12);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText('Negative class', x1 - 132, y0 + 30);
    }

    function renderAll() {
        const cm = confusion(state.ds, state.t);
        const m = metricsFromCM(cm);
        renderCM(cm);
        renderMetrics(m, cm);
        renderROC();
        renderPR();
        renderScoreHist();
    }

    // ───────── CSV upload ─────────
    function parseCSV(text) {
        // Tiny CSV parser: handles quoted fields with "" escapes.
        const rows = [];
        let i = 0, field = '', row = [], inQ = false;
        while (i < text.length) {
            const ch = text[i];
            if (inQ) {
                if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue; }
                if (ch === '"') { inQ = false; i++; continue; }
                field += ch; i++;
            } else {
                if (ch === '"') { inQ = true; i++; continue; }
                if (ch === ',') { row.push(field); field = ''; i++; continue; }
                if (ch === '\r') { i++; continue; }
                if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
                field += ch; i++;
            }
        }
        if (field.length || row.length) { row.push(field); rows.push(row); }
        return rows.filter(r => r.length && !(r.length === 1 && r[0] === ''));
    }

    function loadCSV(text) {
        const rows = parseCSV(text);
        if (rows.length < 2) throw new Error('CSV needs a header row and at least one data row.');
        const header = rows[0].map(h => h.trim().toLowerCase());
        const iY = header.indexOf('y_true');
        const iS = header.indexOf('y_score');
        if (iY < 0 || iS < 0) {
            throw new Error('CSV must have columns named "y_true" (0/1) and "y_score" (number in [0,1]).');
        }
        const y = [], s = [];
        for (let r = 1; r < rows.length; r++) {
            const yv = Number(rows[r][iY]);
            const sv = Number(rows[r][iS]);
            if (!Number.isFinite(yv) || !Number.isFinite(sv)) continue;
            y.push(yv >= 0.5 ? 1 : 0);
            s.push(clamp01(sv));
        }
        if (!y.length) throw new Error('No valid rows after parsing.');
        let P = 0; for (const v of y) if (v) P++;
        return {
            y: Uint8Array.from(y),
            s: Float64Array.from(s),
            name: 'Uploaded CSV',
            blurb: `${y.length} rows · ${P} positives (${((P / y.length) * 100).toFixed(1)}%) · ${y.length - P} negatives.`,
        };
    }

    // ───────── Wire-up ─────────
    function setDataset(ds) {
        state.ds = ds;
        recomputeCurves();
        document.getElementById('mx-dataset-note').textContent =
            `${ds.name} — ${ds.blurb}`;
        renderAll();
    }

    function init() {
        setDataset(genPreset('strong'));

        const presetSel = document.getElementById('mx-preset');
        presetSel.addEventListener('change', () => setDataset(genPreset(presetSel.value)));

        const slider = document.getElementById('mx-threshold');
        const out = document.getElementById('mx-threshold-out');
        slider.addEventListener('input', () => {
            state.t = Number(slider.value);
            out.textContent = state.t.toFixed(2);
            renderAll();
        });

        const fileInput = document.getElementById('mx-file');
        document.getElementById('mx-upload-btn').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', () => {
            const f = fileInput.files && fileInput.files[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const ds = loadCSV(String(reader.result));
                    presetSel.value = '';
                    const opt = document.createElement('option');
                    opt.value = '__uploaded__'; opt.textContent = 'Uploaded CSV';
                    opt.selected = true;
                    // Avoid duplicate "Uploaded CSV" options
                    Array.from(presetSel.options).filter(o => o.value === '__uploaded__').forEach(o => o.remove());
                    presetSel.appendChild(opt);
                    setDataset(ds);
                } catch (e) {
                    alert('Could not load CSV: ' + e.message);
                }
                fileInput.value = '';
            };
            reader.readAsText(f);
        });

        window.addEventListener('resize', () => { renderROC(); renderPR(); renderScoreHist(); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
