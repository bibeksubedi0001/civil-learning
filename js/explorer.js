/* ==========================================================================
   DATASET EXPLORER  (explorer.html)
   Browser-only CSV viewer: parses a CSV, computes stats + Pearson correlation
   matrix, renders a scatter plot and per-column histograms on <canvas>.
   No libraries.
   ========================================================================== */
(function () {
    'use strict';

    const root = document.getElementById('explorer-app');
    if (!root) return;

    /* ───────── DOM ───────── */
    const $ = (id) => document.getElementById(id);
    const drop      = $('exp-drop');
    const fileInput = $('exp-file');
    const pickBtn   = $('exp-pick');
    const sampleBtn = $('exp-sample');
    const statusEl  = $('exp-status');
    const results   = $('exp-results');
    const nameEl    = $('exp-name');
    const summaryEl = $('exp-summary');
    const loadOther = $('exp-load-other');
    const statsTbl  = $('exp-stats-table');
    const corrCv    = $('exp-corr');
    const scatterCv = $('exp-scatter');
    const histGrid  = $('exp-hist-grid');
    const xSel      = $('exp-xcol');
    const ySel      = $('exp-ycol');
    const cSel      = $('exp-ccol');
    const scatterMeta = $('exp-scatter-meta');

    const COLORS = {
        teal: '#00d4aa', cyan: '#0ea5e9', amber: '#f59e0b',
        red:  '#ef4444', purple: '#a855f7', text: 'rgba(255,255,255,0.85)',
        muted: 'rgba(255,255,255,0.5)', grid: 'rgba(255,255,255,0.06)',
        bg: '#161a26'
    };
    const POSITIVE = [0, 212, 170];    // teal — positive corr
    const NEGATIVE = [14, 165, 233];   // cyan — negative corr

    /* ───────── state ───────── */
    let dataset = null;   // { name, columns:[{name,type,values}], rows: n }

    /* ═════════════════════════════════════════════════════════════════════
       CSV parsing  —  handles quoted fields, escaped quotes, \r\n
       ═════════════════════════════════════════════════════════════════════ */
    function parseCSV(text) {
        const rows = [];
        let row = [], field = '', inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (inQuotes) {
                if (c === '"') {
                    if (text[i + 1] === '"') { field += '"'; i++; }
                    else inQuotes = false;
                } else field += c;
            } else {
                if (c === '"') inQuotes = true;
                else if (c === ',') { row.push(field); field = ''; }
                else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
                else if (c === '\r') { /* skip */ }
                else field += c;
            }
        }
        if (field.length || row.length) { row.push(field); rows.push(row); }
        return rows.filter(r => r.length > 1 || (r.length === 1 && r[0].trim() !== ''));
    }

    function toDataset(name, raw) {
        if (raw.length < 2) throw new Error('CSV needs a header row + at least one data row.');
        const headers = raw[0].map(h => h.trim());
        const cols = headers.map(h => ({ name: h, values: [], type: 'numeric' }));
        for (let r = 1; r < raw.length; r++) {
            const row = raw[r];
            for (let c = 0; c < headers.length; c++) {
                const v = (row[c] ?? '').trim();
                cols[c].values.push(v);
            }
        }
        // type inference: numeric if ≥ 70 % of non-empty values parse as finite number
        for (const col of cols) {
            let numeric = 0, total = 0;
            for (const v of col.values) {
                if (v === '' || v.toLowerCase() === 'nan' || v.toLowerCase() === 'null') continue;
                total++;
                if (Number.isFinite(Number(v))) numeric++;
            }
            col.type = (total > 0 && numeric / total >= 0.7) ? 'numeric' : 'categorical';
            if (col.type === 'numeric') {
                col.values = col.values.map(v => (v === '' || v.toLowerCase() === 'nan' || v.toLowerCase() === 'null')
                    ? NaN : Number(v));
            }
        }
        return { name, columns: cols, rows: cols[0]?.values.length || 0 };
    }

    /* ═════════════════════════════════════════════════════════════════════
       Stats
       ═════════════════════════════════════════════════════════════════════ */
    function colStats(col) {
        if (col.type !== 'numeric') {
            const counts = new Map();
            for (const v of col.values) counts.set(v, (counts.get(v) || 0) + 1);
            const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
            return {
                kind: 'categorical',
                unique: counts.size,
                missing: col.values.filter(v => v === '').length,
                top: top ? `${top[0]} (${top[1]})` : '—'
            };
        }
        const v = col.values.filter(x => Number.isFinite(x));
        if (!v.length) return { kind: 'numeric', n: 0, missing: col.values.length };
        const n = v.length;
        const mean = v.reduce((s, x) => s + x, 0) / n;
        const variance = v.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
        const std = Math.sqrt(variance);
        const sorted = [...v].sort((a, b) => a - b);
        const q = (p) => {
            const idx = (sorted.length - 1) * p;
            const lo = Math.floor(idx), hi = Math.ceil(idx);
            return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
        };
        return {
            kind: 'numeric', n,
            missing: col.values.length - n,
            mean, std, min: sorted[0], max: sorted[sorted.length - 1],
            p25: q(0.25), p50: q(0.5), p75: q(0.75)
        };
    }

    function pearson(a, b) {
        let n = 0, sa = 0, sb = 0;
        const xs = [], ys = [];
        for (let i = 0; i < a.length; i++) {
            const x = a[i], y = b[i];
            if (Number.isFinite(x) && Number.isFinite(y)) { xs.push(x); ys.push(y); sa += x; sb += y; n++; }
        }
        if (n < 2) return NaN;
        const mx = sa / n, my = sb / n;
        let num = 0, dx2 = 0, dy2 = 0;
        for (let i = 0; i < n; i++) {
            const dx = xs[i] - mx, dy = ys[i] - my;
            num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
        }
        const denom = Math.sqrt(dx2 * dy2);
        return denom === 0 ? NaN : num / denom;
    }

    /* ═════════════════════════════════════════════════════════════════════
       Rendering
       ═════════════════════════════════════════════════════════════════════ */
    function renderAll() {
        nameEl.textContent = dataset.name;
        const numCols = dataset.columns.filter(c => c.type === 'numeric').length;
        const catCols = dataset.columns.length - numCols;
        summaryEl.textContent =
            `${dataset.rows.toLocaleString()} rows · ${dataset.columns.length} columns ` +
            `(${numCols} numeric, ${catCols} categorical)`;

        renderStatsTable();
        renderCorrelation();
        populateSelectors();
        renderScatter();
        renderHistograms();
    }

    function renderStatsTable() {
        const headers = ['Column', 'Type', 'Non-null', 'Missing', 'Mean', 'Std', 'Min', '25 %', 'Median', '75 %', 'Max', 'Unique'];
        let html = '<thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
        for (const col of dataset.columns) {
            const s = colStats(col);
            const fmt = (v) => Number.isFinite(v) ? v.toFixed(2) : '—';
            if (s.kind === 'numeric') {
                html += `<tr>
                    <td><strong>${escapeHtml(col.name)}</strong></td>
                    <td><span class="exp-pill exp-pill--num">numeric</span></td>
                    <td>${s.n}</td><td>${s.missing}</td>
                    <td>${fmt(s.mean)}</td><td>${fmt(s.std)}</td>
                    <td>${fmt(s.min)}</td><td>${fmt(s.p25)}</td><td>${fmt(s.p50)}</td>
                    <td>${fmt(s.p75)}</td><td>${fmt(s.max)}</td>
                    <td>—</td>
                </tr>`;
            } else {
                html += `<tr>
                    <td><strong>${escapeHtml(col.name)}</strong></td>
                    <td><span class="exp-pill exp-pill--cat">categorical</span></td>
                    <td>${col.values.length - s.missing}</td><td>${s.missing}</td>
                    <td colspan="7" class="exp-muted">top: ${escapeHtml(String(s.top))}</td>
                    <td>${s.unique}</td>
                </tr>`;
            }
        }
        html += '</tbody>';
        statsTbl.innerHTML = html;
    }

    function renderCorrelation() {
        const numCols = dataset.columns.filter(c => c.type === 'numeric');
        if (numCols.length < 2) {
            corrCv.parentElement.innerHTML = '<p class="exp-empty">Need at least two numeric columns for a correlation matrix.</p>';
            return;
        }
        const n = numCols.length;
        const M = [];
        for (let i = 0; i < n; i++) {
            M[i] = [];
            for (let j = 0; j < n; j++) {
                M[i][j] = i === j ? 1 : pearson(numCols[i].values, numCols[j].values);
            }
        }
        // size canvas to fit
        const PAD = 130;
        const cell = Math.max(28, Math.min(70, 520 / n));
        const size = PAD + cell * n + 16;
        corrCv.width = size;
        corrCv.height = size;
        const ctx = corrCv.getContext('2d');
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, size, size);

        // cells
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                const r = M[i][j];
                ctx.fillStyle = corrColor(r);
                ctx.fillRect(PAD + j * cell, PAD + i * cell, cell - 1, cell - 1);
                if (cell >= 36) {
                    ctx.fillStyle = Math.abs(r) > 0.55 ? '#fff' : COLORS.text;
                    ctx.font = `600 ${Math.max(9, Math.floor(cell * 0.32))}px "JetBrains Mono", monospace`;
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    ctx.fillText(Number.isFinite(r) ? r.toFixed(2) : '—',
                                 PAD + j * cell + cell / 2,
                                 PAD + i * cell + cell / 2);
                }
            }
        }
        // labels
        ctx.fillStyle = COLORS.text;
        ctx.font = '12px "Inter", sans-serif';
        for (let i = 0; i < n; i++) {
            const y = PAD + i * cell + cell / 2;
            ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            ctx.fillText(truncate(numCols[i].name, 18), PAD - 6, y);
            ctx.save();
            ctx.translate(PAD + i * cell + cell / 2, PAD - 6);
            ctx.rotate(-Math.PI / 4);
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText(truncate(numCols[i].name, 18), 0, 0);
            ctx.restore();
        }
    }

    function corrColor(r) {
        if (!Number.isFinite(r)) return 'rgba(120,120,120,0.25)';
        const mag = Math.min(1, Math.abs(r));
        const c = r >= 0 ? POSITIVE : NEGATIVE;
        const alpha = 0.15 + 0.75 * mag;
        return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
    }

    function populateSelectors() {
        const numCols = dataset.columns.filter(c => c.type === 'numeric');
        const opts = numCols.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`).join('');
        xSel.innerHTML = opts;
        ySel.innerHTML = opts;
        if (numCols.length >= 2) {
            xSel.selectedIndex = 0;
            ySel.selectedIndex = 1;
        }
        cSel.innerHTML = '<option value="">— none —</option>' +
            dataset.columns.map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)} (${c.type})</option>`).join('');
    }

    function renderScatter() {
        const ctx = scatterCv.getContext('2d');
        const W = scatterCv.width, H = scatterCv.height, pad = 56;
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);

        const xCol = dataset.columns.find(c => c.name === xSel.value);
        const yCol = dataset.columns.find(c => c.name === ySel.value);
        if (!xCol || !yCol) return;

        const xs = xCol.values, ys = yCol.values;
        const pts = [];
        for (let i = 0; i < xs.length; i++) {
            if (Number.isFinite(xs[i]) && Number.isFinite(ys[i])) pts.push({ x: xs[i], y: ys[i], idx: i });
        }
        if (!pts.length) return;

        const xMin = Math.min(...pts.map(p => p.x)), xMax = Math.max(...pts.map(p => p.x));
        const yMin = Math.min(...pts.map(p => p.y)), yMax = Math.max(...pts.map(p => p.y));
        const padX = (xMax - xMin) * 0.05 || 1, padY = (yMax - yMin) * 0.05 || 1;
        const xLo = xMin - padX, xHi = xMax + padX, yLo = yMin - padY, yHi = yMax + padY;

        drawPlotAxes(ctx, W, H, pad, xSel.value, ySel.value, xLo, xHi, yLo, yHi);

        // colour map
        const cCol = dataset.columns.find(c => c.name === cSel.value);
        let colourOf;
        if (cCol && cCol.type === 'numeric') {
            const cv = cCol.values;
            const cFinite = cv.filter(Number.isFinite);
            const cMin = Math.min(...cFinite), cMax = Math.max(...cFinite);
            colourOf = (idx) => {
                const v = cv[idx];
                if (!Number.isFinite(v)) return 'rgba(160,160,160,0.6)';
                const t = (v - cMin) / Math.max(1e-9, cMax - cMin);
                const r = Math.round(14 + (245 - 14) * t);
                const g = Math.round(165 + (158 - 165) * t);
                const b = Math.round(233 + (11 - 233) * t);
                return `rgba(${r},${g},${b},0.85)`;
            };
        } else if (cCol) {
            const palette = ['#00d4aa', '#0ea5e9', '#f59e0b', '#a855f7', '#ef4444', '#22c55e', '#ec4899', '#84cc16'];
            const map = new Map();
            cCol.values.forEach(v => { if (!map.has(v)) map.set(v, palette[map.size % palette.length]); });
            colourOf = (idx) => map.get(cCol.values[idx]);
        } else {
            colourOf = () => 'rgba(0,212,170,0.75)';
        }

        const xToPx = (x) => pad + (W - 2 * pad) * (x - xLo) / (xHi - xLo);
        const yToPx = (y) => pad + (H - 2 * pad) * (1 - (y - yLo) / (yHi - yLo));
        for (const p of pts) {
            ctx.fillStyle = colourOf(p.idx);
            ctx.beginPath();
            ctx.arc(xToPx(p.x), yToPx(p.y), 3.2, 0, Math.PI * 2);
            ctx.fill();
        }

        const r = pearson(xs, ys);
        scatterMeta.textContent = `n = ${pts.length} valid points · Pearson r = ${Number.isFinite(r) ? r.toFixed(3) : '—'}`;
    }

    function renderHistograms() {
        histGrid.innerHTML = '';
        const numCols = dataset.columns.filter(c => c.type === 'numeric');
        for (const col of numCols) {
            const box = document.createElement('div');
            box.className = 'exp-hist';
            box.innerHTML = `
                <span class="exp-hist__title">${escapeHtml(col.name)}</span>
                <canvas width="320" height="180" aria-label="Histogram of ${escapeHtml(col.name)}"></canvas>`;
            histGrid.appendChild(box);
            drawHistogram(box.querySelector('canvas'), col);
        }
        if (!numCols.length) {
            histGrid.innerHTML = '<p class="exp-empty">No numeric columns to plot.</p>';
        }
    }

    function drawHistogram(canvas, col) {
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height, pad = 32;
        ctx.fillStyle = COLORS.bg;
        ctx.fillRect(0, 0, W, H);
        const v = col.values.filter(Number.isFinite);
        if (!v.length) return;
        const min = Math.min(...v), max = Math.max(...v);
        const bins = Math.max(6, Math.min(30, Math.round(Math.sqrt(v.length))));
        const width = (max - min) || 1;
        const counts = new Array(bins).fill(0);
        for (const x of v) {
            const b = Math.min(bins - 1, Math.floor(((x - min) / width) * bins));
            counts[b]++;
        }
        const maxC = Math.max(...counts);
        // axes
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, H - pad); ctx.lineTo(W - 6, H - pad); ctx.stroke();
        // bars
        const barW = (W - pad - 6) / bins;
        for (let i = 0; i < bins; i++) {
            const h = (H - 2 * pad) * (counts[i] / maxC);
            const x = pad + i * barW;
            const y = H - pad - h;
            const grad = ctx.createLinearGradient(0, y, 0, H - pad);
            grad.addColorStop(0, '#00d4aa');
            grad.addColorStop(1, 'rgba(14,165,233,0.35)');
            ctx.fillStyle = grad;
            ctx.fillRect(x + 1, y, Math.max(1, barW - 2), h);
        }
        // labels
        ctx.fillStyle = COLORS.muted;
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(fmtNum(min), pad, H - pad + 4);
        ctx.textAlign = 'right';
        ctx.fillText(fmtNum(max), W - 6, H - pad + 4);
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText('n=' + v.length, pad + 4, 4);
    }

    function drawPlotAxes(ctx, W, H, pad, xLabel, yLabel, xMin, xMax, yMin, yMax) {
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        ctx.fillStyle = COLORS.muted;
        ctx.font = '11px "JetBrains Mono", monospace';
        for (let i = 0; i <= 5; i++) {
            const y = pad + ((H - 2 * pad) * i) / 5;
            ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
            const yv = yMax - ((yMax - yMin) * i) / 5;
            ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
            ctx.fillText(fmtNum(yv), pad - 4, y);
        }
        for (let i = 0; i <= 5; i++) {
            const x = pad + ((W - 2 * pad) * i) / 5;
            ctx.beginPath(); ctx.moveTo(x, pad); ctx.lineTo(x, H - pad); ctx.stroke();
            const xv = xMin + ((xMax - xMin) * i) / 5;
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText(fmtNum(xv), x, H - pad + 4);
        }
        ctx.fillStyle = COLORS.text;
        ctx.font = '13px "Inter", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(xLabel, W / 2, H - 2);
        ctx.save();
        ctx.translate(14, H / 2); ctx.rotate(-Math.PI / 2);
        ctx.textBaseline = 'top';
        ctx.fillText(yLabel, 0, 0);
        ctx.restore();
    }

    /* ───────── tiny helpers ───────── */
    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    }
    function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s; }
    function fmtNum(v) {
        if (!Number.isFinite(v)) return '—';
        if (Math.abs(v) >= 1000 || (Math.abs(v) < 0.01 && v !== 0)) return v.toExponential(1);
        return (Math.round(v * 100) / 100).toString();
    }

    /* ═════════════════════════════════════════════════════════════════════
       Load handlers
       ═════════════════════════════════════════════════════════════════════ */
    function loadFromText(name, text) {
        try {
            const raw = parseCSV(text);
            dataset = toDataset(name, raw);
            results.hidden = false;
            drop.classList.add('exp-upload--collapsed');
            statusEl.textContent = `Loaded ${dataset.rows} rows × ${dataset.columns.length} columns.`;
            renderAll();
            results.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (err) {
            statusEl.innerHTML = `<span style="color:#ef4444">✗ ${escapeHtml(err.message)}</span>`;
        }
    }
    function loadFromFile(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => loadFromText(file.name, e.target.result);
        reader.onerror = () => { statusEl.textContent = '✗ Could not read file.'; };
        reader.readAsText(file);
    }

    pickBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => loadFromFile(e.target.files[0]));
    loadOther.addEventListener('click', () => {
        results.hidden = true;
        drop.classList.remove('exp-upload--collapsed');
        statusEl.textContent = 'Drop a new CSV or pick one to replace the dataset.';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    ['dragenter', 'dragover'].forEach(ev => {
        drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('is-drag'); });
    });
    ['dragleave', 'drop'].forEach(ev => {
        drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('is-drag'); });
    });
    drop.addEventListener('drop', (e) => {
        const f = e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) loadFromFile(f);
    });

    xSel.addEventListener('change', renderScatter);
    ySel.addEventListener('change', renderScatter);
    cSel.addEventListener('change', renderScatter);

    /* ───────── Sample dataset (concrete strength, ~80 rows synthesised) ───────── */
    sampleBtn.addEventListener('click', () => loadFromText('concrete-strength-sample.csv', SAMPLE_CSV));

    // Generate a realistic-ish concrete-strength dataset on first request, deterministic per session.
    const SAMPLE_CSV = (() => {
        // columns: cement_kg_m3, water_kg_m3, fine_agg_kg_m3, coarse_agg_kg_m3, age_days, slump_mm, strength_MPa, mix_class
        const rng = mulberry32(20260525);
        const lines = ['cement_kg_m3,water_kg_m3,fine_agg_kg_m3,coarse_agg_kg_m3,age_days,slump_mm,strength_MPa,mix_class'];
        const classes = ['standard', 'high-strength', 'eco-blend'];
        for (let i = 0; i < 90; i++) {
            const cls = classes[Math.floor(rng() * classes.length)];
            const cement = 280 + rng() * 200 + (cls === 'high-strength' ? 60 : 0);
            const water  = 140 + rng() * 60;
            const fine   = 600 + rng() * 200;
            const coarse = 900 + rng() * 250;
            const age    = [3, 7, 14, 28, 56, 90][Math.floor(rng() * 6)];
            const slump  = 30 + rng() * 150;
            const wc = water / cement;
            const ageF = age / (4 + 0.85 * age);
            const base = 22 * Math.pow(1 / wc, 1.4);
            const noise = (rng() - 0.5) * 6;
            const strength = Math.max(8, base * (ageF / 0.85) * (cls === 'high-strength' ? 1.15 : cls === 'eco-blend' ? 0.9 : 1.0) + noise);
            lines.push([
                cement.toFixed(1), water.toFixed(1), fine.toFixed(0), coarse.toFixed(0),
                age, slump.toFixed(0), strength.toFixed(1), cls
            ].join(','));
        }
        return lines.join('\n');
    })();
    function mulberry32(a) {
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = a ^ (a >>> 15); t = Math.imul(t, 1 | t);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
})();
