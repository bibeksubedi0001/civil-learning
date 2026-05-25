/* compare.js — Traditional (NEHRP) vs ML side-by-side for Vs30 prediction.
 *
 * Loads 318 real Kathmandu-valley boreholes from data/soil_profiles.json,
 * trains a closed-form linear regression in the browser on geotechnical
 * inputs only (no shear-wave required), then lets the user pick any
 * borehole and see both predictions update live.
 */
(function () {
    'use strict';

    // ───────── Pure linear algebra (no libraries) ─────────
    // Gauss-Jordan inverse for a small square matrix.
    function inv(A) {
        const n = A.length;
        const M = A.map((row, i) => {
            const r = row.slice();
            for (let j = 0; j < n; j++) r.push(i === j ? 1 : 0);
            return r;
        });
        for (let i = 0; i < n; i++) {
            // Partial pivoting
            let pivot = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(M[k][i]) > Math.abs(M[pivot][i])) pivot = k;
            }
            [M[i], M[pivot]] = [M[pivot], M[i]];
            const div = M[i][i];
            if (Math.abs(div) < 1e-12) throw new Error('Singular matrix');
            for (let j = 0; j < 2 * n; j++) M[i][j] /= div;
            for (let k = 0; k < n; k++) {
                if (k === i) continue;
                const f = M[k][i];
                if (!f) continue;
                for (let j = 0; j < 2 * n; j++) M[k][j] -= f * M[i][j];
            }
        }
        return M.map(r => r.slice(n));
    }

    function matMul(A, B) {
        const m = A.length, k = A[0].length, n = B[0].length;
        const out = Array.from({ length: m }, () => new Array(n).fill(0));
        for (let i = 0; i < m; i++) {
            for (let p = 0; p < k; p++) {
                const a = A[i][p];
                if (!a) continue;
                for (let j = 0; j < n; j++) out[i][j] += a * B[p][j];
            }
        }
        return out;
    }

    // OLS via normal equations: β = (XᵀX + λI)⁻¹ Xᵀy   (ridge for stability)
    function fitOLS(X, y, ridge = 1e-3) {
        const n = X.length, p = X[0].length;
        const Xt = Array.from({ length: p }, () => new Array(n).fill(0));
        for (let i = 0; i < n; i++) for (let j = 0; j < p; j++) Xt[j][i] = X[i][j];
        const XtX = matMul(Xt, X);
        for (let i = 0; i < p; i++) XtX[i][i] += ridge;     // ridge on all incl. intercept (tiny)
        const Xty = matMul(Xt, y.map(v => [v]));
        const beta = matMul(inv(XtX), Xty).map(r => r[0]);
        return beta;
    }

    function predict(beta, x) {
        let s = 0;
        for (let i = 0; i < beta.length; i++) s += beta[i] * x[i];
        return s;
    }

    // ───────── Feature engineering ─────────
    // Cheap, log-readable features — none of them require Vs measurement.
    //   x0 = 1                    (intercept)
    //   x1 = mean density         (kg/m³, scaled)
    //   x2 = total depth          (m)
    //   x3 = sand fraction        (depth-weighted, 0..1)
    //   x4 = silt fraction        (depth-weighted, 0..1)
    //   x5 = clay fraction        (depth-weighted, 0..1)
    //   x6 = top-3 m mean density (kg/m³, scaled)
    //   x7 = density gradient     (kg/m³ per m depth)
    function featurize(layers) {
        let totalH = 0, totalRho = 0, top3Rho = 0, top3H = 0;
        let sandH = 0, siltH = 0, clayH = 0;
        let zMid = [];
        for (const l of layers) {
            totalH += l.h;
            totalRho += l.rho * l.h;
            const z0 = totalH - l.h;
            if (z0 < 3) {
                const take = Math.min(l.h, 3 - z0);
                top3Rho += l.rho * take;
                top3H += take;
            }
            const st = (l.st || '').toLowerCase();
            if (st.includes('sand') || st === 'gravel') sandH += l.h;
            else if (st.includes('silt')) siltH += l.h;
            else if (st.includes('clay')) clayH += l.h;
            zMid.push({ z: z0 + l.h / 2, rho: l.rho });
        }
        const denom = totalH || 1;
        const meanRho = totalRho / denom;
        const top3MeanRho = (top3H > 0) ? top3Rho / top3H : meanRho;
        const sandFr = sandH / denom;
        const siltFr = siltH / denom;
        const clayFr = clayH / denom;
        // Density gradient via simple linear regression of rho vs depth
        let mz = 0, mr = 0;
        for (const p of zMid) { mz += p.z; mr += p.rho; }
        mz /= zMid.length; mr /= zMid.length;
        let num = 0, den = 0;
        for (const p of zMid) { num += (p.z - mz) * (p.rho - mr); den += (p.z - mz) ** 2; }
        const gradient = den > 0 ? num / den : 0;
        // Scale density to a friendlier range (~1.5..2.0)
        return [1, meanRho / 1000, totalH, sandFr, siltFr, clayFr, top3MeanRho / 1000, gradient];
    }

    // NEHRP V_s30: harmonic mean of Vs over the top 30 m.
    function vs30NEHRP(layers) {
        let remaining = 30, denom = 0, used = 0;
        for (const l of layers) {
            if (remaining <= 0) break;
            const take = Math.min(l.h, remaining);
            denom += take / l.vs;
            remaining -= take;
            used += take;
        }
        return denom > 0 ? used / denom : null;
    }

    // NEHRP site class lookup
    function siteClass(vs30) {
        if (vs30 == null) return { letter: '—', label: '—', color: '#888' };
        if (vs30 > 1500) return { letter: 'A', label: 'Hard rock',          color: '#22c55e' };
        if (vs30 >  760) return { letter: 'B', label: 'Rock',               color: '#84cc16' };
        if (vs30 >  360) return { letter: 'C', label: 'Very dense / soft rock', color: '#eab308' };
        if (vs30 >  180) return { letter: 'D', label: 'Stiff soil',         color: '#f59e0b' };
        return                    { letter: 'E', label: 'Soft soil',        color: '#ef4444' };
    }

    // Seeded RNG for deterministic train/test split
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

    const SOIL_COLORS = {
        sand:   '#f4d35e',
        gravel: '#e0c068',
        silt:   '#c2a35f',
        clay:   '#8b5e3c',
        rock:   '#6b7280',
        fill:   '#a3a3a3',
    };
    function soilColor(st) {
        const s = (st || '').toLowerCase();
        for (const k of Object.keys(SOIL_COLORS)) if (s.includes(k)) return SOIL_COLORS[k];
        return '#9ca3af';
    }

    function drawProfile(layers) {
        const canvas = document.getElementById('cmp-profile');
        const { ctx, w, h } = setupHiDPI(canvas);
        ctx.clearRect(0, 0, w, h);

        const padT = 26, padB = 26, padL = 56, padR = 18;
        const colW = 90;
        const x0 = padL, y0 = padT, y1 = h - padB;
        const totalDepth = layers.reduce((s, l) => s + l.h, 0);
        const visualMax = Math.max(30, totalDepth);
        const yScale = (y1 - y0) / visualMax;

        // 30 m marker line
        const y30 = y0 + 30 * yScale;
        if (30 < visualMax) {
            ctx.strokeStyle = 'rgba(245,158,11,0.6)';
            ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(x0 - 8, y30); ctx.lineTo(x0 + colW + 220, y30); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#f59e0b'; ctx.font = '600 11px "JetBrains Mono", monospace';
            ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
            ctx.fillText('30 m (V_s30 cutoff)', x0 + colW + 8, y30 - 2);
        }

        // Depth axis
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        const step = visualMax <= 30 ? 5 : visualMax <= 60 ? 10 : 20;
        for (let d = 0; d <= visualMax; d += step) {
            const y = y0 + d * yScale;
            ctx.beginPath(); ctx.moveTo(x0 - 4, y); ctx.lineTo(x0, y); ctx.stroke();
            ctx.fillText(d + ' m', x0 - 8, y);
        }
        ctx.save();
        ctx.translate(x0 - 38, (y0 + y1) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '600 12px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Depth', 0, 0);
        ctx.restore();

        // Layers
        let depth = 0;
        for (const l of layers) {
            const yTop = y0 + depth * yScale;
            const yBot = y0 + (depth + l.h) * yScale;
            ctx.fillStyle = soilColor(l.st);
            ctx.fillRect(x0, yTop, colW, yBot - yTop);
            ctx.strokeStyle = 'rgba(0,0,0,0.35)';
            ctx.lineWidth = 0.6;
            ctx.strokeRect(x0, yTop, colW, yBot - yTop);
            depth += l.h;
        }
        // Column border
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(x0, y0, colW, depth * yScale);

        // Vs vs depth chart on the right
        const cx0 = x0 + colW + 92, cx1 = w - padR;
        const vsMin = Math.min(80, ...layers.map(l => l.vs)) - 20;
        const vsMax = Math.max(...layers.map(l => l.vs)) + 30;
        // axes
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath(); ctx.moveTo(cx0, y0); ctx.lineTo(cx0, y1); ctx.lineTo(cx1, y1); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        const vsRange = vsMax - vsMin;
        const vsStep = vsRange < 200 ? 50 : vsRange < 500 ? 100 : 200;
        const vsStart = Math.ceil(vsMin / vsStep) * vsStep;
        for (let v = vsStart; v <= vsMax; v += vsStep) {
            const x = cx0 + (v - vsMin) / (vsMax - vsMin) * (cx1 - cx0);
            ctx.strokeStyle = 'rgba(255,255,255,0.06)';
            ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.fillText(v, x, y1 + 4);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '600 12px "Inter", sans-serif';
        ctx.fillText('Vₛ (m/s)', (cx0 + cx1) / 2, y1 + 18);

        // Step-plot Vs vs depth
        depth = 0;
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        let started = false;
        for (const l of layers) {
            const yTop = y0 + depth * yScale;
            const yBot = y0 + (depth + l.h) * yScale;
            const x = cx0 + (l.vs - vsMin) / (vsMax - vsMin) * (cx1 - cx0);
            if (!started) { ctx.moveTo(x, yTop); started = true; }
            else ctx.lineTo(x, yTop);
            ctx.lineTo(x, yBot);
            depth += l.h;
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(14,165,233,0.12)';
        ctx.lineTo(cx0, y0 + depth * yScale);
        ctx.lineTo(cx0, y0);
        ctx.fill();
    }

    function drawScatter(allPoints, currentName) {
        const canvas = document.getElementById('cmp-scatter');
        const { ctx, w, h } = setupHiDPI(canvas);
        ctx.clearRect(0, 0, w, h);
        const pad = { l: 60, r: 14, t: 16, b: 46 };
        const x0 = pad.l, y0 = pad.t, x1 = w - pad.r, y1 = h - pad.b;

        let vMin = Infinity, vMax = -Infinity;
        for (const p of allPoints) {
            vMin = Math.min(vMin, p.actual, p.pred);
            vMax = Math.max(vMax, p.actual, p.pred);
        }
        const pad2 = (vMax - vMin) * 0.05;
        vMin -= pad2; vMax += pad2;
        const mapX = v => x0 + (v - vMin) / (vMax - vMin) * (x1 - x0);
        const mapY = v => y1 - (v - vMin) / (vMax - vMin) * (y1 - y0);

        // Axes
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = '11px "JetBrains Mono", monospace';
        const range = vMax - vMin;
        const step = range < 80 ? 20 : range < 200 ? 50 : 100;
        const vStart = Math.ceil(vMin / step) * step;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        for (let v = vStart; v <= vMax; v += step) {
            const x = mapX(v);
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.fillText(v, x, y1 + 4);
        }
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        for (let v = vStart; v <= vMax; v += step) {
            const y = mapY(v);
            ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.fillText(v, x0 - 6, y);
        }
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '600 12px "Inter", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('NEHRP V_s30 (m/s, ground truth)', (x0 + x1) / 2, y1 + 22);
        ctx.save();
        ctx.translate(x0 - 42, (y0 + y1) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('ML predicted V_s30 (m/s)', 0, 0);
        ctx.restore();

        // y = x line
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.setLineDash([6, 6]); ctx.beginPath();
        ctx.moveTo(mapX(vMin), mapY(vMin)); ctx.lineTo(mapX(vMax), mapY(vMax));
        ctx.stroke(); ctx.setLineDash([]);

        // Points: train vs test in different shades
        for (const p of allPoints) {
            ctx.beginPath();
            ctx.arc(mapX(p.actual), mapY(p.pred), p.test ? 4 : 3, 0, Math.PI * 2);
            ctx.fillStyle = p.test ? 'rgba(14,165,233,0.85)' : 'rgba(0,212,170,0.55)';
            ctx.fill();
        }

        // Highlight current borehole
        const cur = allPoints.find(p => p.name === currentName);
        if (cur) {
            const cx = mapX(cur.actual), cy = mapY(cur.pred);
            ctx.beginPath(); ctx.arc(cx, cy, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#f59e0b'; ctx.fill();
            ctx.strokeStyle = '#0a0a0f'; ctx.lineWidth = 2; ctx.stroke();
        }

        // Legend
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.font = '600 11px "Inter", sans-serif';
        const lx = x1 - 130, ly = y0 + 10;
        ctx.fillStyle = 'rgba(0,212,170,0.85)';
        ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillText('Train', lx + 10, ly);
        ctx.fillStyle = 'rgba(14,165,233,0.95)';
        ctx.beginPath(); ctx.arc(lx, ly + 16, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillText('Test', lx + 10, ly + 16);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.arc(lx, ly + 32, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillText('Current', lx + 10, ly + 32);
    }

    function renderLegend() {
        const wrap = document.getElementById('cmp-profile-legend');
        const types = [
            { k: 'sand',   label: 'Sand'   },
            { k: 'silt',   label: 'Silt'   },
            { k: 'clay',   label: 'Clay'   },
            { k: 'gravel', label: 'Gravel' },
            { k: 'rock',   label: 'Rock'   },
        ];
        wrap.innerHTML = types.map(t =>
            `<span class="cmp-leg"><i style="background:${SOIL_COLORS[t.k]}"></i>${t.label}</span>`
        ).join('') + `<span class="cmp-leg"><i style="background:#0ea5e9;border-radius:2px"></i>V<sub>s</sub> profile</span>`;
    }

    // ───────── State / orchestration ─────────
    const state = {
        profiles: null,         // { name: { layers, vs30, depth_instrumented, full30 } }
        names: [],
        beta: null,
        featureNames: ['intercept','mean density (g/cm³)','total depth (m)','sand fraction','silt fraction','clay fraction','top-3 m density (g/cm³)','density gradient (kg/m³ per m)'],
        scatterPoints: [],
        metrics: null,
    };

    function trainModel() {
        // Use only boreholes that span at least 30 m for ground truth.
        const trainable = state.names
            .filter(n => state.profiles[n].full30 && state.profiles[n].vs30 != null)
            .map(n => ({ name: n, ...state.profiles[n] }));

        // Deterministic 80/20 split
        const rng = mulberry32(20260525);
        const shuffled = trainable.slice().sort(() => rng() - 0.5);
        const nTest = Math.max(1, Math.round(shuffled.length * 0.20));
        const test = shuffled.slice(0, nTest);
        const train = shuffled.slice(nTest);

        const X = train.map(p => featurize(p.layers));
        const y = train.map(p => p.vs30);
        state.beta = fitOLS(X, y, 1e-2);

        // Build the scatter points and metrics on every available borehole
        let ssRes = 0, ssTot = 0, sumAbs = 0, n = 0;
        const allY = trainable.map(p => p.vs30);
        const yMean = allY.reduce((a, b) => a + b, 0) / allY.length;

        const testSet = new Set(test.map(p => p.name));
        const points = [];
        for (const p of trainable) {
            const xf = featurize(p.layers);
            const pred = predict(state.beta, xf);
            const isTest = testSet.has(p.name);
            points.push({ name: p.name, actual: p.vs30, pred, test: isTest });
        }
        // Train + test metrics separately
        let trRes = 0, trN = 0, teRes = 0, teN = 0, teAbs = 0, teTot = 0;
        const teMean = test.length
            ? test.reduce((a, p) => a + p.vs30, 0) / test.length
            : 0;
        for (const pt of points) {
            const e = pt.pred - pt.actual;
            if (pt.test) { teRes += e * e; teAbs += Math.abs(e); teTot += (pt.actual - teMean) ** 2; teN++; }
            else         { trRes += e * e; trN++; }
            ssRes += e * e; ssTot += (pt.actual - yMean) ** 2; sumAbs += Math.abs(e); n++;
        }
        const r2  = 1 - ssRes / (ssTot || 1);
        const rmse = Math.sqrt(ssRes / n);
        const mae  = sumAbs / n;
        const testR2   = 1 - teRes / (teTot || 1);
        const testRMSE = Math.sqrt(teRes / Math.max(1, teN));
        const testMAE  = teAbs / Math.max(1, teN);
        const trainRMSE = Math.sqrt(trRes / Math.max(1, trN));

        state.scatterPoints = points;
        state.metrics = {
            nAll: n, nTrain: trN, nTest: teN,
            r2, rmse, mae, testR2, testRMSE, testMAE, trainRMSE,
        };
    }

    function renderBorehole(name) {
        const bh = state.profiles[name];
        if (!bh) return;
        drawProfile(bh.layers);

        const xf = featurize(bh.layers);
        const mlVs30 = predict(state.beta, xf);
        const empVs30 = bh.full30 ? vs30NEHRP(bh.layers) : null;

        // Meta
        const meta = document.getElementById('cmp-bh-meta');
        meta.innerHTML =
            `<span><strong>${bh.layers.length}</strong> layers</span>` +
            `<span><strong>${bh.depth_instrumented.toFixed(1)} m</strong> instrumented</span>` +
            (bh.full30
                ? `<span class="cmp-tag cmp-tag--ok">full 30 m profile</span>`
                : `<span class="cmp-tag cmp-tag--warn">only ${bh.depth_instrumented.toFixed(1)} m &mdash; NEHRP V<sub>s30</sub> undefined</span>`);

        // Empirical
        const empEl = document.getElementById('cmp-emp-value');
        const empClsEl = document.getElementById('cmp-emp-class');
        if (empVs30 != null) {
            empEl.textContent = empVs30.toFixed(1);
            const sc = siteClass(empVs30);
            empClsEl.innerHTML = `<span class="cmp-class" style="background:${sc.color}22;color:${sc.color};border-color:${sc.color}55">Site Class ${sc.letter} &mdash; ${sc.label}</span>`;
        } else {
            empEl.textContent = '—';
            empClsEl.innerHTML = `<span class="cmp-class cmp-class--na">profile &lt; 30 m</span>`;
        }

        // ML
        document.getElementById('cmp-ml-value').textContent = mlVs30.toFixed(1);
        const mc = siteClass(mlVs30);
        document.getElementById('cmp-ml-class').innerHTML =
            `<span class="cmp-class" style="background:${mc.color}22;color:${mc.color};border-color:${mc.color}55">Site Class ${mc.letter} &mdash; ${mc.label}</span>`;

        // Delta
        const delta = document.getElementById('cmp-delta');
        if (empVs30 != null) {
            const d = mlVs30 - empVs30;
            const pct = (d / empVs30) * 100;
            const tone = Math.abs(pct) < 10 ? 'good' : Math.abs(pct) < 25 ? 'ok' : 'warn';
            delta.innerHTML = `
                <div class="cmp-delta__inner cmp-delta--${tone}">
                    <span>ML &minus; NEHRP</span>
                    <strong>${d >= 0 ? '+' : ''}${d.toFixed(1)} m/s</strong>
                    <span>(${pct >= 0 ? '+' : ''}${pct.toFixed(1)} %)</span>
                </div>`;
        } else {
            delta.innerHTML = `<div class="cmp-delta__inner cmp-delta--na">No ground-truth NEHRP value &mdash; ML estimate stands alone.</div>`;
        }

        // Re-draw scatter to highlight current
        drawScatter(state.scatterPoints, name);
    }

    function renderCoefs() {
        const el = document.getElementById('cmp-ml-coefs');
        const list = state.beta.map((b, i) => {
            const sign = b >= 0 ? '+' : '−';
            return `<li><code>${state.featureNames[i]}</code>: <strong>${sign}${Math.abs(b).toFixed(2)}</strong></li>`;
        }).join('');
        el.innerHTML = `Trained live on <strong>${state.metrics.nTrain}</strong> boreholes (80 % split) and evaluated on <strong>${state.metrics.nTest}</strong> hold-out boreholes. Uses cheap geotechnical inputs only &mdash; <strong>no V<sub>s</sub> measurement required</strong>:<ul class="cmp-coefs">${list}</ul>`;
    }

    function renderMetricsPanel() {
        const m = state.metrics;
        const items = [
            { k: 'Test R²',        v: m.testR2.toFixed(3),                   sub: 'higher = better' },
            { k: 'Test RMSE',      v: m.testRMSE.toFixed(1) + ' m/s',        sub: 'root-mean-square error on hold-out' },
            { k: 'Test MAE',       v: m.testMAE.toFixed(1) + ' m/s',         sub: 'mean absolute error on hold-out' },
            { k: 'Train RMSE',     v: m.trainRMSE.toFixed(1) + ' m/s',       sub: 'on the 80 % seen by the model' },
            { k: 'Boreholes',      v: m.nAll,                                sub: `${m.nTrain} train · ${m.nTest} test` },
        ];
        document.getElementById('cmp-metrics').innerHTML = items.map(it =>
            `<div class="cmp-metric">
                <div class="cmp-metric__k">${it.k}</div>
                <div class="cmp-metric__v">${it.v}</div>
                <div class="cmp-metric__sub">${it.sub}</div>
             </div>`
        ).join('');

        const take = document.getElementById('cmp-take');
        const quality = m.testR2 > 0.6 ? 'tracks the empirical formula well'
                       : m.testR2 > 0.3 ? 'captures the dominant trend but leaves a wide residual'
                       : 'is noisier than the empirical formula';
        take.innerHTML = `<strong>Takeaway.</strong> A simple linear regression on density &amp; soil-type fractions ${quality}
            (test R² = ${m.testR2.toFixed(2)}, RMSE = ${m.testRMSE.toFixed(0)} m/s).
            That's the deal: trade ${m.testRMSE.toFixed(0)} m/s of accuracy &mdash; roughly one NEHRP site-class boundary &mdash;
            for skipping a multi-thousand-dollar shear-wave survey.`;
    }

    function populateBoreholes(filter = '') {
        const sel = document.getElementById('cmp-bh');
        const q = filter.trim().toLowerCase();
        const filtered = state.names.filter(n => !q || n.toLowerCase().includes(q));
        sel.innerHTML = filtered.map(n => `<option value="${n}">${n}</option>`).join('');
        if (filtered.length) renderBorehole(filtered[0]);
    }

    async function init() {
        const status = document.getElementById('cmp-status');
        try {
            const res = await fetch('data/soil_profiles.json');
            if (!res.ok) throw new Error('HTTP ' + res.status);
            state.profiles = await res.json();
            state.names = Object.keys(state.profiles).sort();
        } catch (e) {
            status.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Could not load soil profile data: ${e.message}. Make sure you're serving the site (not opening as <code>file://</code>).`;
            status.classList.add('cmp-status--error');
            return;
        }
        trainModel();
        renderLegend();
        renderCoefs();
        renderMetricsPanel();

        document.getElementById('cmp-status').hidden = true;
        document.getElementById('cmp-controls').hidden = false;
        document.getElementById('cmp-grid').hidden = false;
        document.getElementById('cmp-perf').hidden = false;

        populateBoreholes('');

        document.getElementById('cmp-bh').addEventListener('change', (e) => renderBorehole(e.target.value));
        document.getElementById('cmp-filter').addEventListener('input', (e) => populateBoreholes(e.target.value));
        window.addEventListener('resize', () => {
            const cur = document.getElementById('cmp-bh').value;
            if (cur) renderBorehole(cur);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
