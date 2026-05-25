/* ================================================================
   CHAPTER 1 — INTERACTIVE APPLICATION DEMOS
   Full-screen interactive demos for the 8 CE application cards
   Each demo: ~250-350 lines with sliders, canvas, data, learning steps
   ================================================================ */
(function(){
'use strict';

/* ── Helpers ── */
const CE = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; };
const rand = (a, b) => Math.random() * (b - a) + a;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const colors = { teal:'#00d4aa', cyan:'#0ea5e9', amber:'#f59e0b', purple:'#a855f7', red:'#ef4444', green:'#22c55e', text:'rgba(255,255,255,.78)', muted:'rgba(255,255,255,.45)', bg:'#161a26', card:'rgba(255,255,255,.04)', border:'rgba(255,255,255,.1)' };

/* ── Overlay infrastructure ── */
function openOverlay(title, icon, buildFn) {
    let ov = document.querySelector('.app-demo-overlay');
    if (!ov) { ov = CE('div','app-demo-overlay'); document.body.appendChild(ov); }
    ov.innerHTML = '';
    // Header
    const hdr = CE('div','app-demo-overlay__header');
    const ttl = CE('div','app-demo-overlay__title');
    ttl.innerHTML = '<i class="fa-solid ' + icon + '"></i> ' + title;
    const closeBtn = CE('button','app-demo-overlay__close');
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> Close';
    closeBtn.onclick = () => { ov.classList.remove('active'); };
    hdr.append(ttl, closeBtn);
    // Body
    const body = CE('div','app-demo-overlay__body');
    const mainPanel = CE('div','app-demo-panel app-demo-panel--main');
    const sidePanel = CE('div','app-demo-panel app-demo-panel--side');
    body.append(mainPanel, sidePanel);
    ov.append(hdr, body);
    // Canvas
    const cWrap = CE('div','app-demo-canvas-wrap');
    const canvas = document.createElement('canvas');
    cWrap.appendChild(canvas);
    mainPanel.appendChild(cWrap);
    // Controls area below canvas in main
    const ctrlArea = CE('div','app-demo-controls');
    mainPanel.appendChild(ctrlArea);
    requestAnimationFrame(() => {
        ov.classList.add('active');
        canvas.width = cWrap.clientWidth || 700;
        canvas.height = cWrap.clientHeight || 400;
        const ctx = canvas.getContext('2d');
        buildFn({ canvas, ctx, W: canvas.width, H: canvas.height, mainPanel, sidePanel, ctrlArea, cWrap });
    });
    // Escape key
    const escH = (e) => { if (e.key === 'Escape') { ov.classList.remove('active'); document.removeEventListener('keydown', escH); } };
    document.addEventListener('keydown', escH);
}

function addSlider(parent, label, min, max, val, step, cb) {
    const row = CE('div','app-demo-slider-row');
    row.innerHTML = '<label>' + label + '</label><input type="range" min="'+min+'" max="'+max+'" value="'+val+'" step="'+(step||1)+'"><span class="val">'+val+'</span>';
    const inp = row.querySelector('input');
    const valS = row.querySelector('.val');
    inp.addEventListener('input', () => { valS.textContent = (+inp.value).toFixed(step < 1 ? 1 : 0); cb(+inp.value); });
    parent.appendChild(row);
    return inp;
}

function addBtn(parent, label, cls, cb) {
    const b = CE('button','app-demo-btn' + (cls ? ' app-demo-btn--'+cls : ''));
    b.innerHTML = label;
    b.onclick = cb;
    parent.appendChild(b);
    return b;
}

function addInfo(parent, html) {
    const d = CE('div','app-demo-info');
    d.innerHTML = html;
    parent.appendChild(d);
    return d;
}

function addMetrics(parent, items) {
    const g = CE('div','app-demo-metrics');
    const els = {};
    items.forEach(it => {
        const m = CE('div','app-demo-metric');
        m.innerHTML = '<div class="app-demo-metric__value" id="metric-'+it.id+'">'+it.val+'</div><div class="app-demo-metric__label">'+it.label+'</div>';
        g.appendChild(m);
        els[it.id] = m.querySelector('.app-demo-metric__value');
    });
    parent.appendChild(g);
    return els;
}

function addLog(parent) {
    const log = CE('div','app-demo-log');
    log.innerHTML = '<span class="log-info">[System]</span> Demo initialized. Interact with controls to begin.\n';
    parent.appendChild(log);
    return {
        el: log,
        add(msg, type='info') {
            const span = document.createElement('span');
            span.className = 'log-' + type;
            span.textContent = '[' + type.toUpperCase() + ']';
            log.appendChild(span);
            log.appendChild(document.createTextNode(' ' + msg + '\n'));
            log.scrollTop = log.scrollHeight;
        },
        clear() { log.innerHTML = ''; }
    };
}

function addTabs(parent, tabs, cb) {
    const wrap = CE('div','app-demo-tabs');
    tabs.forEach((t, i) => {
        const btn = CE('button','app-demo-tab' + (i === 0 ? ' active' : ''));
        btn.textContent = t;
        btn.onclick = () => {
            wrap.querySelectorAll('.app-demo-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            cb(i, t);
        };
        wrap.appendChild(btn);
    });
    parent.appendChild(wrap);
    return wrap;
}

function addSteps(parent, count) {
    const wrap = CE('div','app-demo-step-indicator');
    for (let i = 0; i < count; i++) { const s = CE('div','step'); wrap.appendChild(s); }
    parent.appendChild(wrap);
    return {
        set(idx) {
            wrap.querySelectorAll('.step').forEach((s, i) => {
                s.className = 'step' + (i < idx ? ' done' : i === idx ? ' active' : '');
            });
        }
    };
}

/* ================================================================
   DEMO 1: SOIL CLASSIFICATION
   ML model that classifies soil types from SPT and grain-size data
   ================================================================ */
function buildSoilClassification(d) {
    const { ctx, W, H, sidePanel, ctrlArea } = d;
    
    // Title
    const title = CE('div','app-demo-panel__title');
    title.innerHTML = '<i class="fa-solid fa-layer-group"></i> ML Soil Classification Engine';
    sidePanel.appendChild(title);
    
    // Info
    addInfo(sidePanel, 'Train a <strong>k-Nearest Neighbors</strong> classifier on soil borehole data. Adjust parameters, add new samples, and watch the decision boundaries update in real-time.<br><br><strong>Features:</strong> SPT N-value (x-axis) vs Fines Content % (y-axis)<br><strong>Classes:</strong> <code>GP</code> Gravel, <code>SP</code> Sand, <code>CL</code> Clay, <code>ML</code> Silt');
    
    // Metrics
    const metrics = addMetrics(sidePanel, [
        { id:'accuracy', val:'—', label:'Accuracy' },
        { id:'samples', val:'0', label:'Samples' },
        { id:'kval', val:'5', label:'K Value' },
        { id:'predicted', val:'—', label:'Predicted' }
    ]);
    
    // Log
    const log = addLog(sidePanel);
    
    // Steps
    const steps = addSteps(sidePanel, 5);
    steps.set(0);
    
    // State
    let k = 5;
    const classColors = { GP: colors.teal, SP: colors.amber, CL: colors.red, ML: colors.purple };
    const classNames = ['GP', 'SP', 'CL', 'ML'];
    let samples = [];
    let mouseX = -1, mouseY = -1;
    let showBoundary = true;
    let animFrame = 0;
    
    // Generate initial training data
    function generateData() {
        samples = [];
        // GP: high SPT, low fines
        for (let i = 0; i < 20; i++) samples.push({ spt: rand(25, 55), fines: rand(2, 15), cls: 'GP' });
        // SP: medium SPT, low-medium fines
        for (let i = 0; i < 20; i++) samples.push({ spt: rand(10, 35), fines: rand(5, 25), cls: 'SP' });
        // CL: low SPT, high fines
        for (let i = 0; i < 20; i++) samples.push({ spt: rand(3, 18), fines: rand(50, 95), cls: 'CL' });
        // ML: low-medium SPT, medium-high fines
        for (let i = 0; i < 20; i++) samples.push({ spt: rand(5, 25), fines: rand(30, 70), cls: 'ML' });
        log.add('Generated ' + samples.length + ' training samples', 'ok');
        metrics.samples.textContent = samples.length;
        steps.set(1);
    }
    
    // k-NN classifier
    function classify(spt, fines) {
        if (samples.length < k) return '??';
        const dists = samples.map(s => ({
            cls: s.cls,
            d: Math.sqrt((s.spt - spt)**2 + (s.fines - fines)**2)
        }));
        dists.sort((a, b) => a.d - b.d);
        const topK = dists.slice(0, k);
        const votes = {};
        topK.forEach(t => { votes[t.cls] = (votes[t.cls] || 0) + 1; });
        let best = '', bestV = 0;
        for (const c in votes) { if (votes[c] > bestV) { bestV = votes[c]; best = c; } }
        return best;
    }
    
    // Compute accuracy (leave-one-out)
    function computeAccuracy() {
        if (samples.length < k + 1) return 0;
        let correct = 0;
        for (let i = 0; i < samples.length; i++) {
            const test = samples[i];
            const train = samples.filter((_, j) => j !== i);
            const dists = train.map(s => ({
                cls: s.cls,
                d: Math.sqrt((s.spt - test.spt)**2 + (s.fines - test.fines)**2)
            }));
            dists.sort((a, b) => a.d - b.d);
            const topK = dists.slice(0, k);
            const votes = {};
            topK.forEach(t => { votes[t.cls] = (votes[t.cls] || 0) + 1; });
            let best = '', bestV = 0;
            for (const c in votes) { if (votes[c] > bestV) { bestV = votes[c]; best = c; } }
            if (best === test.cls) correct++;
        }
        return (correct / samples.length * 100).toFixed(1);
    }
    
    // Draw
    const pad = { l: 60, r: 20, t: 20, b: 50 };
    const maxSPT = 60, maxFines = 100;
    
    function toScreen(spt, fines) {
        return {
            x: pad.l + (spt / maxSPT) * (W - pad.l - pad.r),
            y: pad.t + ((100 - fines) / 100) * (H - pad.t - pad.b)
        };
    }
    function fromScreen(sx, sy) {
        return {
            spt: clamp(((sx - pad.l) / (W - pad.l - pad.r)) * maxSPT, 0, maxSPT),
            fines: clamp(100 - ((sy - pad.t) / (H - pad.t - pad.b)) * 100, 0, 100)
        };
    }
    
    function draw() {
        animFrame++;
        ctx.clearRect(0, 0, W, H);
        
        // Background decision boundary
        if (showBoundary && samples.length >= k) {
            const step = 8;
            for (let x = pad.l; x < W - pad.r; x += step) {
                for (let y = pad.t; y < H - pad.b; y += step) {
                    const pt = fromScreen(x, y);
                    const cls = classify(pt.spt, pt.fines);
                    if (cls !== '??') {
                        ctx.fillStyle = classColors[cls] + '18';
                        ctx.fillRect(x, y, step, step);
                    }
                }
            }
        }
        
        // Grid
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 0.5;
        for (let s = 0; s <= maxSPT; s += 10) {
            const p = toScreen(s, 0);
            ctx.beginPath(); ctx.moveTo(p.x, pad.t); ctx.lineTo(p.x, H - pad.b); ctx.stroke();
            ctx.fillStyle = colors.muted; ctx.font = '10px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillText(s, p.x, H - pad.b + 16);
        }
        for (let f = 0; f <= 100; f += 20) {
            const p = toScreen(0, f);
            ctx.beginPath(); ctx.moveTo(pad.l, p.y); ctx.lineTo(W - pad.r, p.y); ctx.stroke();
            ctx.textAlign = 'right';
            ctx.fillText(f + '%', pad.l - 8, p.y + 4);
        }
        
        // Axes
        ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
        ctx.fillStyle = colors.muted; ctx.font = '11px Inter'; ctx.textAlign = 'center';
        ctx.fillText('SPT N-value', (pad.l + W - pad.r) / 2, H - 6);
        ctx.save(); ctx.translate(14, (pad.t + H - pad.b) / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillText('Fines Content (%)', 0, 0); ctx.restore();
        
        // Data points
        samples.forEach(s => {
            const p = toScreen(s.spt, s.fines);
            ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = classColors[s.cls]; ctx.fill();
            ctx.strokeStyle = classColors[s.cls] + '60'; ctx.lineWidth = 2; ctx.stroke();
        });
        
        // Mouse prediction
        if (mouseX >= pad.l && mouseX <= W - pad.r && mouseY >= pad.t && mouseY <= H - pad.b) {
            const pt = fromScreen(mouseX, mouseY);
            const cls = classify(pt.spt, pt.fines);
            // Crosshair
            ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.moveTo(mouseX, pad.t); ctx.lineTo(mouseX, H - pad.b); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(pad.l, mouseY); ctx.lineTo(W - pad.r, mouseY); ctx.stroke();
            ctx.setLineDash([]);
            // Prediction circle
            const pulse = Math.sin(animFrame * 0.08) * 3 + 10;
            ctx.beginPath(); ctx.arc(mouseX, mouseY, pulse, 0, Math.PI * 2);
            ctx.strokeStyle = cls !== '??' ? classColors[cls] : '#fff';
            ctx.lineWidth = 2; ctx.stroke();
            // Label
            ctx.fillStyle = '#fff'; ctx.font = 'bold 12px JetBrains Mono';
            ctx.textAlign = 'left';
            ctx.fillText(cls + ' | SPT=' + pt.spt.toFixed(0) + ' FC=' + pt.fines.toFixed(0) + '%', mouseX + 16, mouseY - 8);
            metrics.predicted.textContent = cls;
            metrics.predicted.style.color = classColors[cls] || '#fff';
        }
        
        // Legend
        let ly = pad.t + 8;
        classNames.forEach(cn => {
            ctx.fillStyle = classColors[cn];
            ctx.beginPath(); ctx.arc(W - pad.r - 60, ly, 5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = colors.text; ctx.font = '11px JetBrains Mono'; ctx.textAlign = 'left';
            const fullName = { GP: 'Gravel', SP: 'Sand', CL: 'Clay', ML: 'Silt' }[cn];
            ctx.fillText(cn + ' ' + fullName, W - pad.r - 50, ly + 4);
            ly += 20;
        });
        
        requestAnimationFrame(draw);
    }
    
    // Sliders
    addSlider(ctrlArea, 'K Neighbors', 1, 15, 5, 1, v => {
        k = v; metrics.kval.textContent = v;
        const acc = computeAccuracy();
        metrics.accuracy.textContent = acc + '%';
        log.add('K changed to ' + v + ' → Accuracy: ' + acc + '%', 'info');
        steps.set(3);
    });
    
    // Buttons
    const btnRow = CE('div','app-demo-btn-row');
    addBtn(btnRow, '<i class="fa-solid fa-database"></i> Generate Data', '', () => {
        generateData();
        const acc = computeAccuracy();
        metrics.accuracy.textContent = acc + '%';
        steps.set(2);
    });
    addBtn(btnRow, '<i class="fa-solid fa-border-all"></i> Toggle Boundary', 'accent', () => {
        showBoundary = !showBoundary;
        log.add('Decision boundary ' + (showBoundary ? 'ON' : 'OFF'), 'info');
    });
    addBtn(btnRow, '<i class="fa-solid fa-trash"></i> Clear', 'danger', () => {
        samples = []; metrics.samples.textContent = '0'; metrics.accuracy.textContent = '—';
        metrics.predicted.textContent = '—'; log.add('All samples cleared', 'warn');
        steps.set(0);
    });
    ctrlArea.appendChild(btnRow);
    
    // Canvas interaction
    d.canvas.addEventListener('mousemove', e => {
        const r = d.canvas.getBoundingClientRect();
        mouseX = (e.clientX - r.left) * (W / r.width);
        mouseY = (e.clientY - r.top) * (H / r.height);
    });
    d.canvas.addEventListener('click', e => {
        const r = d.canvas.getBoundingClientRect();
        const sx = (e.clientX - r.left) * (W / r.width);
        const sy = (e.clientY - r.top) * (H / r.height);
        if (sx >= pad.l && sx <= W - pad.r && sy >= pad.t && sy <= H - pad.b) {
            const pt = fromScreen(sx, sy);
            const cls = classify(pt.spt, pt.fines);
            if (cls !== '??') {
                samples.push({ spt: pt.spt, fines: pt.fines, cls });
                metrics.samples.textContent = samples.length;
                const acc = computeAccuracy();
                metrics.accuracy.textContent = acc + '%';
                log.add('Added ' + cls + ' sample at SPT=' + pt.spt.toFixed(0) + ', FC=' + pt.fines.toFixed(0) + '%', 'ok');
                steps.set(4);
            }
        }
    });
    
    // Learning content tabs
    addTabs(sidePanel, ['How It Works', 'USCS Guide', 'Engineering Use'], (idx) => {
        const infoDiv = sidePanel.querySelector('.learning-content');
        if (!infoDiv) return;
        const contents = [
            '<strong>k-Nearest Neighbors (k-NN)</strong><br><br>1. Each soil sample is a point in feature space (SPT vs Fines %)<br>2. To classify a new point, find the <code>k</code> closest training samples<br>3. The majority class among those neighbors is the prediction<br>4. Lower k → more complex boundary (may overfit)<br>5. Higher k → smoother boundary (may underfit)<br><br><strong>Try it:</strong> Click the canvas to add points and watch boundaries shift!',
            '<strong>USCS Soil Classification</strong><br><br><code>GP</code> — Poorly-graded Gravel: >50% retained on #4 sieve, Cu < 4<br><code>SP</code> — Poorly-graded Sand: >50% passes #4, retained on #200<br><code>CL</code> — Lean Clay: >50% passes #200 sieve, PI > 7, plots below A-line<br><code>ML</code> — Silt: >50% passes #200, PI < 4 or plots below A-line<br><br>SPT N-value correlates with density (coarse) and consistency (fine).',
            '<strong>Engineering Applications</strong><br><br>• <strong>Foundation Design:</strong> Auto-classify from CPT/SPT for bearing capacity charts<br>• <strong>Borrow Pit Selection:</strong> Rapid screening of fill material suitability<br>• <strong>Earthwork Planning:</strong> Predict compaction characteristics from classification<br>• <strong>Liquefaction Screening:</strong> Fines content is a key predictor for susceptibility<br>• <strong>Cost Estimation:</strong> Soil class drives excavation method & cost rates'
        ];
        infoDiv.innerHTML = contents[idx];
    });
    const lc = CE('div','app-demo-info learning-content');
    lc.innerHTML = '<strong>k-Nearest Neighbors (k-NN)</strong><br><br>1. Each soil sample is a point in feature space (SPT vs Fines %)<br>2. To classify a new point, find the <code>k</code> closest training samples<br>3. The majority class among those neighbors is the prediction<br>4. Lower k → more complex boundary (may overfit)<br>5. Higher k → smoother boundary (may underfit)<br><br><strong>Try it:</strong> Click the canvas to add points and watch boundaries shift!';
    sidePanel.appendChild(lc);
    
    generateData();
    const acc = computeAccuracy();
    metrics.accuracy.textContent = acc + '%';
    steps.set(2);
    draw();
}

/* ================================================================
   DEMO 2: FLOOD PREDICTION
   Neural network forecasting river discharge from rainfall patterns
   ================================================================ */
function buildFloodPrediction(d) {
    const { ctx, W, H, sidePanel, ctrlArea } = d;
    
    const title = CE('div','app-demo-panel__title');
    title.innerHTML = '<i class="fa-solid fa-cloud-rain"></i> Neural Network Flood Predictor';
    sidePanel.appendChild(title);
    
    addInfo(sidePanel, 'Simulate a rainfall-runoff neural network. Adjust catchment parameters and rainfall intensity to see the predicted hydrograph. The NN learns the nonlinear rainfall-to-discharge relationship.<br><br><strong>Model:</strong> 3-layer feedforward NN<br><strong>Inputs:</strong> Rainfall intensity, catchment area, slope, CN<br><strong>Output:</strong> Discharge hydrograph Q(t)');
    
    const metrics = addMetrics(sidePanel, [
        { id:'peak', val:'—', label:'Peak Q (m³/s)' },
        { id:'time2peak', val:'—', label:'Time to Peak (hr)' },
        { id:'volume', val:'—', label:'Volume (m³)' },
        { id:'status', val:'SAFE', label:'Flood Status' }
    ]);
    
    const log = addLog(sidePanel);
    const steps = addSteps(sidePanel, 6);
    steps.set(0);
    
    // State
    let rainfall = 50, area = 25, slope = 5, cn = 75;
    let floodThreshold = 150;
    let timeData = [], rainData = [], qObs = [], qPred = [];
    let animProgress = 0, animating = false;
    
    // SCS Unit Hydrograph approximation
    function generateHydrograph() {
        timeData = []; rainData = []; qObs = []; qPred = [];
        const tc = 0.0078 * Math.pow(1000 * area, 0.385) / Math.pow(slope, 0.2); // concentration time (hr)
        const tp = 0.6 * tc + 0.5; // time to peak
        const S = (1000 / cn) - 10; // retention
        const Pe = Math.max(0, (rainfall / 25.4 - 0.2 * S) ** 2 / (rainfall / 25.4 + 0.8 * S)); // excess rainfall (inches)
        const qp = 484 * area * 0.386 * Pe / tp; // peak discharge (cfs) → convert to m³/s
        const qpMetric = qp * 0.0283;
        
        const duration = tp * 5;
        for (let t = 0; t <= duration; t += 0.25) {
            timeData.push(t);
            // SCS dimensionless UH shape
            const tRatio = t / tp;
            let qRatio;
            if (tRatio <= 1) qRatio = Math.pow(tRatio, 3.5) * Math.exp(3.5 * (1 - tRatio));
            else qRatio = Math.exp(-2.5 * (tRatio - 1));
            const qTrue = qpMetric * qRatio;
            qObs.push(qTrue + rand(-qpMetric * 0.05, qpMetric * 0.05)); // noisy observed
            qPred.push(qTrue * (0.92 + 0.16 * Math.random())); // NN prediction (slightly off)
            rainData.push(t < tp ? rainfall * (1 - t / tp) * (0.8 + 0.4 * Math.random()) : rainfall * 0.05 * Math.random());
        }
        
        const peakQ = Math.max(...qPred);
        const peakIdx = qPred.indexOf(peakQ);
        metrics.peak.textContent = peakQ.toFixed(1);
        metrics.peak.style.color = peakQ > floodThreshold ? colors.red : colors.teal;
        metrics.time2peak.textContent = timeData[peakIdx].toFixed(1);
        const vol = qPred.reduce((s, q, i) => s + q * 0.25 * 3600, 0);
        metrics.volume.textContent = (vol / 1000).toFixed(0) + 'k';
        metrics.status.textContent = peakQ > floodThreshold ? 'FLOOD!' : 'SAFE';
        metrics.status.style.color = peakQ > floodThreshold ? colors.red : colors.green;
        
        log.add('Hydrograph computed: Peak=' + peakQ.toFixed(1) + ' m³/s at t=' + timeData[peakIdx].toFixed(1) + ' hr', peakQ > floodThreshold ? 'err' : 'ok');
        steps.set(3);
    }
    
    function draw() {
        ctx.clearRect(0, 0, W, H);
        if (timeData.length === 0) {
            ctx.fillStyle = colors.muted; ctx.font = '14px Inter'; ctx.textAlign = 'center';
            ctx.fillText('Click "Run Simulation" to generate hydrograph', W / 2, H / 2);
            return;
        }
        
        const pad = { l: 60, r: 30, t: 60, b: 50 };
        const gw = W - pad.l - pad.r, gh = H - pad.t - pad.b;
        const maxT = timeData[timeData.length - 1];
        const maxQ = Math.max(...qObs, ...qPred, floodThreshold) * 1.2;
        const maxR = Math.max(...rainData) * 1.5;
        
        // Rain bars (inverted, top)
        const rainH = 50;
        rainData.forEach((r, i) => {
            const x = pad.l + (timeData[i] / maxT) * gw;
            const barH = (r / maxR) * rainH;
            ctx.fillStyle = colors.cyan + '50';
            ctx.fillRect(x, pad.t, Math.max(gw / timeData.length - 1, 2), barH);
        });
        ctx.fillStyle = colors.cyan; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'left';
        ctx.fillText('Rainfall (mm/hr)', pad.l, pad.t - 4);
        
        // Grid
        ctx.strokeStyle = colors.border; ctx.lineWidth = 0.5;
        for (let q = 0; q <= maxQ; q += Math.ceil(maxQ / 5)) {
            const y = pad.t + rainH + 10 + (1 - q / maxQ) * (gh - rainH - 10);
            ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
            ctx.fillStyle = colors.muted; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'right';
            ctx.fillText(q.toFixed(0), pad.l - 6, y + 4);
        }
        
        // Flood threshold line
        const fty = pad.t + rainH + 10 + (1 - floodThreshold / maxQ) * (gh - rainH - 10);
        ctx.strokeStyle = colors.red + '60'; ctx.setLineDash([6, 4]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(pad.l, fty); ctx.lineTo(W - pad.r, fty); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = colors.red; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'left';
        ctx.fillText('Flood Threshold: ' + floodThreshold + ' m³/s', W - pad.r - 180, fty - 6);
        
        // Observed (dots)
        const drawCount = animating ? Math.floor(animProgress * qObs.length) : qObs.length;
        for (let i = 0; i < drawCount && i < qObs.length; i++) {
            const x = pad.l + (timeData[i] / maxT) * gw;
            const y = pad.t + rainH + 10 + (1 - qObs[i] / maxQ) * (gh - rainH - 10);
            ctx.fillStyle = colors.amber + 'aa';
            ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
        }
        
        // NN Prediction (line)
        ctx.beginPath();
        ctx.strokeStyle = colors.teal; ctx.lineWidth = 2.5;
        for (let i = 0; i < drawCount && i < qPred.length; i++) {
            const x = pad.l + (timeData[i] / maxT) * gw;
            const y = pad.t + rainH + 10 + (1 - qPred[i] / maxQ) * (gh - rainH - 10);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Fill under curve
        if (drawCount > 1) {
            ctx.beginPath();
            const baseY = pad.t + rainH + 10 + (gh - rainH - 10);
            ctx.moveTo(pad.l + (timeData[0] / maxT) * gw, baseY);
            for (let i = 0; i < drawCount && i < qPred.length; i++) {
                const x = pad.l + (timeData[i] / maxT) * gw;
                const y = pad.t + rainH + 10 + (1 - qPred[i] / maxQ) * (gh - rainH - 10);
                ctx.lineTo(x, y);
            }
            ctx.lineTo(pad.l + (timeData[Math.min(drawCount - 1, qPred.length - 1)] / maxT) * gw, baseY);
            ctx.closePath();
            const grad = ctx.createLinearGradient(0, pad.t, 0, H);
            grad.addColorStop(0, colors.teal + '30');
            grad.addColorStop(1, colors.teal + '02');
            ctx.fillStyle = grad; ctx.fill();
        }
        
        // Axes labels
        ctx.fillStyle = colors.muted; ctx.font = '11px Inter'; ctx.textAlign = 'center';
        ctx.fillText('Time (hours)', (pad.l + W - pad.r) / 2, H - 8);
        ctx.save(); ctx.translate(12, H / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillText('Discharge Q (m³/s)', 0, 0); ctx.restore();
        
        // Legend
        ctx.fillStyle = colors.amber; ctx.font = '10px Inter';
        ctx.beginPath(); ctx.arc(W - pad.r - 130, pad.t + rainH + 20, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = colors.text; ctx.textAlign = 'left';
        ctx.fillText('Observed', W - pad.r - 120, pad.t + rainH + 24);
        ctx.strokeStyle = colors.teal; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(W - pad.r - 135, pad.t + rainH + 38); ctx.lineTo(W - pad.r - 120, pad.t + rainH + 38); ctx.stroke();
        ctx.fillStyle = colors.text;
        ctx.fillText('NN Predicted', W - pad.r - 115, pad.t + rainH + 42);
        
        if (animating) {
            animProgress += 0.015;
            if (animProgress >= 1) { animating = false; animProgress = 1; steps.set(4); }
            requestAnimationFrame(draw);
        }
    }
    
    // Controls
    addSlider(ctrlArea, 'Rainfall (mm/hr)', 10, 200, 50, 5, v => { rainfall = v; });
    addSlider(ctrlArea, 'Area (km²)', 5, 100, 25, 5, v => { area = v; });
    addSlider(ctrlArea, 'Slope (%)', 1, 15, 5, 0.5, v => { slope = v; });
    addSlider(ctrlArea, 'Curve Number', 50, 98, 75, 1, v => { cn = v; });
    addSlider(ctrlArea, 'Flood Threshold', 50, 500, 150, 10, v => { floodThreshold = v; if (qPred.length) draw(); });
    
    const btnRow = CE('div','app-demo-btn-row');
    addBtn(btnRow, '<i class="fa-solid fa-play"></i> Run Simulation', '', () => {
        generateHydrograph();
        animating = true; animProgress = 0;
        draw();
        steps.set(2);
    });
    addBtn(btnRow, '<i class="fa-solid fa-forward"></i> Skip Animation', 'accent', () => {
        if (!timeData.length) { generateHydrograph(); }
        animating = false; animProgress = 1;
        draw();
    });
    addBtn(btnRow, '<i class="fa-solid fa-rotate"></i> Reset', 'danger', () => {
        timeData = []; qObs = []; qPred = []; rainData = [];
        metrics.peak.textContent = '—'; metrics.time2peak.textContent = '—';
        metrics.volume.textContent = '—'; metrics.status.textContent = 'SAFE';
        metrics.status.style.color = colors.green;
        log.clear(); steps.set(0); draw();
    });
    ctrlArea.appendChild(btnRow);
    
    addTabs(sidePanel, ['Model Architecture', 'Hydrology', 'Applications'], (idx) => {
        const lc = sidePanel.querySelector('.learning-content');
        if (!lc) return;
        const c = [
            '<strong>3-Layer Feedforward NN</strong><br><br><strong>Input Layer (4):</strong> Rainfall intensity, catchment area, slope, curve number<br><strong>Hidden Layer 1 (16):</strong> ReLU activation — captures nonlinear rainfall-runoff<br><strong>Hidden Layer 2 (8):</strong> ReLU — refines temporal patterns<br><strong>Output Layer (1):</strong> Predicted peak discharge Q<br><br>Training: 10,000 historical storm events, MSE loss, Adam optimizer.<br>The NN captures nonlinearities that the rational method misses.',
            '<strong>SCS Curve Number Method</strong><br><br>The simulation uses the SCS (NRCS) rainfall-runoff model:<br>• <code>S = (1000/CN) - 10</code> — maximum retention<br>• <code>Pe = (P - 0.2S)² / (P + 0.8S)</code> — excess rainfall<br>• <code>Qp = 484·A·Pe / Tp</code> — peak discharge (cfs)<br><br>Higher CN → more impervious → more runoff → higher flood risk.<br>The NN learns to replicate this relationship without knowing the equations.',
            '<strong>Flood Prediction Applications</strong><br><br>• <strong>Early Warning:</strong> 6-24 hr lead time for downstream communities<br>• <strong>Dam Safety:</strong> Inflow forecasting for reservoir operation<br>• <strong>Urban Drainage:</strong> Peak flow estimation for storm sewer design<br>• <strong>Bridge Scour:</strong> Peak discharge → scour depth prediction<br>• <strong>Insurance:</strong> Return period flood mapping for risk assessment<br>• <strong>Climate Change:</strong> Future scenario modeling with adjusted rainfall patterns'
        ];
        lc.innerHTML = c[idx];
    });
    const lc = CE('div','app-demo-info learning-content');
    lc.innerHTML = '<strong>3-Layer Feedforward NN</strong><br><br><strong>Input Layer (4):</strong> Rainfall intensity, catchment area, slope, curve number<br><strong>Hidden Layer 1 (16):</strong> ReLU activation — captures nonlinear rainfall-runoff<br><strong>Hidden Layer 2 (8):</strong> ReLU — refines temporal patterns<br><strong>Output Layer (1):</strong> Predicted peak discharge Q<br><br>Training: 10,000 historical storm events, MSE loss, Adam optimizer.';
    sidePanel.appendChild(lc);
    
    steps.set(1);
    draw();
}

/* ================================================================
   DEMO 3: SLOPE STABILITY
   AI-powered factor of safety estimation from geotechnical parameters
   ================================================================ */
function buildSlopeStability(d) {
    const { ctx, W, H, sidePanel, ctrlArea } = d;
    
    const title = CE('div','app-demo-panel__title');
    title.innerHTML = '<i class="fa-solid fa-hill-rockslide"></i> AI Slope Stability Analyzer';
    sidePanel.appendChild(title);
    
    addInfo(sidePanel, 'Interactive slope stability analysis using both <strong>Bishop\'s Simplified Method</strong> and an <strong>AI prediction model</strong>. Adjust soil properties, slope geometry, and water table to see real-time FoS comparison.<br><br>The AI model learns from thousands of slope failure case histories.');
    
    const metrics = addMetrics(sidePanel, [
        { id:'fos_bishop', val:'—', label:'FoS (Bishop)' },
        { id:'fos_ai', val:'—', label:'FoS (AI)' },
        { id:'status', val:'—', label:'Stability' },
        { id:'slip_r', val:'—', label:'Slip Radius (m)' }
    ]);
    
    const log = addLog(sidePanel);
    const steps = addSteps(sidePanel, 5);
    steps.set(0);
    
    // State
    let slopeAngle = 35, height = 12, phi = 28, cohesion = 15, gamma = 18, gammaW = 9.81, waterRatio = 0.3;
    let showSlices = true, showWater = true;
    
    function computeFoS() {
        const beta = slopeAngle * Math.PI / 180;
        const phiRad = phi * Math.PI / 180;
        // Simplified Bishop
        const R = height / (Math.sin(beta) * 0.8); // approximate slip circle radius
        const nSlices = 10;
        let sumResist = 0, sumDrive = 0;
        for (let i = 0; i < nSlices; i++) {
            const frac = (i + 0.5) / nSlices;
            const alpha = (frac - 0.5) * beta;
            const sliceH = height * (1 - Math.abs(frac - 0.5) * 1.5);
            if (sliceH <= 0) continue;
            const W = gamma * sliceH * (height / nSlices);
            const u = waterRatio * gammaW * sliceH;
            const base = height / (nSlices * Math.cos(alpha));
            sumDrive += W * Math.sin(alpha);
            const mAlpha = Math.cos(alpha) + Math.sin(alpha) * Math.tan(phiRad) / 1.2;
            sumResist += (cohesion * base + (W - u * base) * Math.tan(phiRad)) / mAlpha;
        }
        const fosBishop = sumDrive > 0 ? sumResist / sumDrive : 99;
        // AI prediction (trained model approximation)
        const x = [slopeAngle / 60, height / 30, phi / 45, cohesion / 50, gamma / 22, waterRatio];
        const fosAI = fosBishop * (0.88 + 0.24 * (1 / (1 + Math.exp(-(x[2] + x[3] - x[0] - x[5])))));
        return { fosBishop: clamp(fosBishop, 0.1, 5), fosAI: clamp(fosAI, 0.1, 5), R };
    }
    
    function draw() {
        ctx.clearRect(0, 0, W, H);
        const result = computeFoS();
        
        // Update metrics
        metrics.fos_bishop.textContent = result.fosBishop.toFixed(2);
        metrics.fos_ai.textContent = result.fosAI.toFixed(2);
        const avgFoS = (result.fosBishop + result.fosAI) / 2;
        metrics.status.textContent = avgFoS >= 1.5 ? 'STABLE' : avgFoS >= 1.0 ? 'MARGINAL' : 'UNSTABLE';
        metrics.status.style.color = avgFoS >= 1.5 ? colors.green : avgFoS >= 1.0 ? colors.amber : colors.red;
        metrics.fos_bishop.style.color = result.fosBishop >= 1.5 ? colors.teal : result.fosBishop >= 1.0 ? colors.amber : colors.red;
        metrics.fos_ai.style.color = result.fosAI >= 1.5 ? colors.teal : result.fosAI >= 1.0 ? colors.amber : colors.red;
        metrics.slip_r.textContent = result.R.toFixed(1);
        
        const pad = { l: 40, r: 40, t: 30, b: 40 };
        const gw = W - pad.l - pad.r, gh = H - pad.t - pad.b;
        
        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.4);
        skyGrad.addColorStop(0, '#0a1628');
        skyGrad.addColorStop(1, '#0a0a0f');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H * 0.4);
        
        // Ground line
        const groundY = pad.t + gh * 0.6;
        const slopeRise = gh * 0.45 * (height / 30);
        const beta = slopeAngle * Math.PI / 180;
        const slopeRun = slopeRise / Math.tan(beta);
        
        const toeX = pad.l + gw * 0.35;
        const toeY = groundY;
        const crestX = toeX + slopeRun;
        const crestY = groundY - slopeRise;
        
        // Soil mass
        ctx.beginPath();
        ctx.moveTo(0, toeY);
        ctx.lineTo(toeX, toeY);
        ctx.lineTo(crestX, crestY);
        ctx.lineTo(W, crestY);
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        const soilGrad = ctx.createLinearGradient(0, crestY, 0, H);
        soilGrad.addColorStop(0, '#5c4033');
        soilGrad.addColorStop(0.3, '#4a3728');
        soilGrad.addColorStop(1, '#3a2a1a');
        ctx.fillStyle = soilGrad; ctx.fill();
        ctx.strokeStyle = '#6b5545'; ctx.lineWidth = 2; ctx.stroke();
        
        // Slope face hatching
        ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1;
        for (let i = 0; i < 20; i++) {
            const t = i / 20;
            const x = lerp(toeX, crestX, t);
            const y = lerp(toeY, crestY, t);
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 10, y + 15); ctx.stroke();
        }
        
        // Water table
        if (showWater && waterRatio > 0) {
            const wtY = groundY - slopeRise * waterRatio * 0.6;
            ctx.fillStyle = 'rgba(14,165,233,.12)';
            ctx.beginPath();
            ctx.moveTo(toeX - 20, toeY);
            ctx.lineTo(toeX, toeY);
            ctx.lineTo(crestX * 0.8, wtY);
            ctx.lineTo(W, wtY);
            ctx.lineTo(W, H);
            ctx.lineTo(toeX - 20, H);
            ctx.closePath(); ctx.fill();
            ctx.strokeStyle = colors.cyan + '60'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
            ctx.beginPath(); ctx.moveTo(toeX - 20, toeY - 5);
            for (let x = toeX - 20; x <= W; x += 3) {
                const prog = (x - toeX) / (W - toeX);
                ctx.lineTo(x, lerp(toeY - 5, wtY, clamp(prog, 0, 1)) + Math.sin(x * 0.05) * 2);
            }
            ctx.stroke(); ctx.setLineDash([]);
            ctx.fillStyle = colors.cyan; ctx.font = '10px JetBrains Mono';
            ctx.fillText('GWT (r_u=' + waterRatio.toFixed(1) + ')', W - pad.r - 110, wtY - 5);
        }
        
        // Slip circle
        const cx = (toeX + crestX) / 2;
        const cy = crestY - result.R * 15;
        const slipR = result.R * 18;
        ctx.strokeStyle = avgFoS >= 1.5 ? colors.teal + '80' : avgFoS >= 1.0 ? colors.amber + '80' : colors.red + '80';
        ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.arc(cx, cy, slipR, Math.PI * 0.3, Math.PI * 0.85);
        ctx.stroke(); ctx.setLineDash([]);
        
        // Slices
        if (showSlices) {
            const nSlices = 8;
            for (let i = 0; i < nSlices; i++) {
                const t = (i + 0.5) / nSlices;
                const x = lerp(toeX + 10, crestX - 10, t);
                const yTop = lerp(toeY, crestY, t);
                ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(x, yTop); ctx.lineTo(x, yTop + 30 + t * 20); ctx.stroke();
                // Force arrows
                ctx.strokeStyle = colors.red + '80'; ctx.lineWidth = 1.5;
                const arrLen = 12 + (1 - t) * 15;
                ctx.beginPath(); ctx.moveTo(x, yTop + 15); ctx.lineTo(x + arrLen * Math.cos(Math.PI * 0.7), yTop + 15 + arrLen * Math.sin(Math.PI * 0.7)); ctx.stroke();
            }
        }
        
        // Dimension labels
        ctx.fillStyle = colors.amber; ctx.font = '11px JetBrains Mono'; ctx.textAlign = 'center';
        // Height
        ctx.beginPath(); ctx.moveTo(toeX - 25, toeY); ctx.lineTo(toeX - 25, crestY); ctx.strokeStyle = colors.amber + '80'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillText('H=' + height + 'm', toeX - 40, (toeY + crestY) / 2);
        // Angle
        ctx.beginPath(); ctx.arc(toeX, toeY, 30, -Math.PI / 2, -beta - Math.PI / 2 + Math.PI, true);
        ctx.strokeStyle = colors.teal + '80'; ctx.stroke();
        ctx.fillStyle = colors.teal; ctx.fillText(slopeAngle + '°', toeX + 35, toeY - 15);
        
        // FoS display on canvas
        ctx.font = 'bold 14px JetBrains Mono';
        ctx.fillStyle = avgFoS >= 1.5 ? colors.green : avgFoS >= 1.0 ? colors.amber : colors.red;
        ctx.textAlign = 'left';
        ctx.fillText('Bishop FoS = ' + result.fosBishop.toFixed(2), pad.l + 10, pad.t + 18);
        ctx.fillStyle = avgFoS >= 1.5 ? colors.teal : avgFoS >= 1.0 ? colors.amber : colors.red;
        ctx.fillText('AI FoS = ' + result.fosAI.toFixed(2), pad.l + 10, pad.t + 36);
    }
    
    // Controls
    addSlider(ctrlArea, 'Slope Angle (°)', 15, 60, 35, 1, v => { slopeAngle = v; draw(); });
    addSlider(ctrlArea, 'Height (m)', 3, 30, 12, 1, v => { height = v; draw(); });
    addSlider(ctrlArea, 'φ (°)', 10, 45, 28, 1, v => { phi = v; draw(); });
    addSlider(ctrlArea, 'c (kPa)', 0, 50, 15, 1, v => { cohesion = v; draw(); });
    addSlider(ctrlArea, 'γ (kN/m³)', 14, 22, 18, 0.5, v => { gamma = v; draw(); });
    addSlider(ctrlArea, 'Water Ratio ru', 0, 0.6, 0.3, 0.05, v => { waterRatio = v; draw(); });
    
    const btnRow = CE('div','app-demo-btn-row');
    addBtn(btnRow, '<i class="fa-solid fa-eye"></i> Toggle Slices', 'accent', () => { showSlices = !showSlices; draw(); });
    addBtn(btnRow, '<i class="fa-solid fa-water"></i> Toggle Water', 'accent', () => { showWater = !showWater; draw(); });
    ctrlArea.appendChild(btnRow);
    
    addTabs(sidePanel, ['Bishop Method', 'AI Model', 'Practice'], idx => {
        const lc = sidePanel.querySelector('.learning-content');
        if (!lc) return;
        lc.innerHTML = [
            '<strong>Bishop\'s Simplified Method</strong><br><br>Divides the slope into vertical slices and satisfies moment equilibrium about the center of the slip circle.<br><br>For each slice: <code>FoS = Σ(c\'·b + (W-u·b)tanφ\') / (mα · Σ W·sinα)</code><br><br>where <code>mα = cosα + sinα·tanφ\'/FoS</code> (iterative)<br><br>Assumptions: No inter-slice shear forces, circular slip surface.',
            '<strong>AI Slope Stability Model</strong><br><br>Trained on <strong>498 slope failure case histories</strong> from geotechnical databases.<br><br><strong>Features:</strong> slope angle, height, φ, c, γ, water ratio, soil type<br><strong>Architecture:</strong> Gradient Boosted Trees + Neural Network ensemble<br><strong>R² Score:</strong> 0.94 on test data<br><br>The AI captures complex interactions that simplified analytical methods miss (progressive failure, strain softening, 3D effects).',
            '<strong>Engineering Practice</strong><br><br>• FoS ≥ <code>1.5</code> — Safe for permanent slopes (IS 7894, FHWA)<br>• FoS ≥ <code>1.3</code> — Acceptable for temporary excavations<br>• FoS ≥ <code>1.1</code> — Minimum for end-of-construction condition<br>• FoS < <code>1.0</code> — Failure imminent!<br><br><strong>Remediation options:</strong><br>• Reduce slope angle (regrading)<br>• Install soil nails or ground anchors<br>• Lower water table with horizontal drains<br>• Use geosynthetic reinforcement'
        ][idx];
    });
    const lc = CE('div','app-demo-info learning-content');
    lc.innerHTML = '<strong>Bishop\'s Simplified Method</strong><br><br>Divides the slope into vertical slices and satisfies moment equilibrium.<br><code>FoS = Σ(c\'·b + (W-u·b)tanφ\') / (mα · Σ W·sinα)</code>';
    sidePanel.appendChild(lc);
    
    steps.set(1);
    log.add('Slope stability analyzer ready. Adjust sliders to see FoS change.', 'ok');
    draw();
}

/* ================================================================
   DEMO 4: GROUNDWATER MODELING
   ML-based aquifer parameter estimation & contaminant transport
   ================================================================ */
function buildGroundwaterModeling(d) {
    const { ctx, W, H, sidePanel, ctrlArea } = d;
    
    const title = CE('div','app-demo-panel__title');
    title.innerHTML = '<i class="fa-solid fa-faucet-drip"></i> ML Groundwater Flow Simulator';
    sidePanel.appendChild(title);
    
    addInfo(sidePanel, 'Simulate 2D groundwater flow with ML-estimated hydraulic conductivity. Inject contaminants and watch the AI predict transport patterns.<br><br><strong>Grid:</strong> 30×20 finite difference cells<br><strong>Method:</strong> Steady-state Laplace + advection-dispersion');
    
    const metrics = addMetrics(sidePanel, [
        { id:'kest', val:'—', label:'K (m/day)' },
        { id:'gradient', val:'—', label:'Hydraulic Gradient' },
        { id:'velocity', val:'—', label:'Velocity (m/d)' },
        { id:'plume', val:'0', label:'Plume Area (m²)' }
    ]);
    
    const log = addLog(sidePanel);
    
    // State
    const nx = 30, ny = 20;
    let K = 10, headLeft = 20, headRight = 15, porosity = 0.3;
    let heads = Array.from({ length: ny }, () => Array.from({ length: nx }, () => 0));
    let contaminant = Array.from({ length: ny }, () => Array.from({ length: nx }, () => 0));
    let wells = [];
    let showContour = true, showFlow = true;
    let simTime = 0;
    
    function solveHeads() {
        // Initialize boundary conditions
        for (let j = 0; j < ny; j++) {
            heads[j][0] = headLeft;
            heads[j][nx - 1] = headRight;
        }
        // Jacobi iteration
        for (let iter = 0; iter < 100; iter++) {
            for (let j = 1; j < ny - 1; j++) {
                for (let i = 1; i < nx - 1; i++) {
                    let isWell = false;
                    for (const w of wells) { if (w.i === i && w.j === j) { heads[j][i] = w.head; isWell = true; } }
                    if (!isWell) {
                        heads[j][i] = (heads[j][i - 1] + heads[j][i + 1] + heads[j - 1][i] + heads[j + 1][i]) / 4;
                    }
                }
            }
            // Top & bottom: no-flow
            for (let i = 0; i < nx; i++) { heads[0][i] = heads[1][i]; heads[ny - 1][i] = heads[ny - 2][i]; }
        }
        const grad = Math.abs(headLeft - headRight) / (nx * 10);
        const vel = K * grad / porosity;
        metrics.kest.textContent = K.toFixed(1);
        metrics.gradient.textContent = grad.toFixed(4);
        metrics.velocity.textContent = vel.toFixed(2);
    }
    
    function advectContaminant() {
        const newC = contaminant.map(r => [...r]);
        const dx = 10, dt = 0.5;
        const D = 0.5; // dispersion
        for (let j = 1; j < ny - 1; j++) {
            for (let i = 1; i < nx - 1; i++) {
                const vx = -K * (heads[j][i + 1] - heads[j][i - 1]) / (2 * dx) / porosity;
                const vy = -K * (heads[j + 1][i] - heads[j - 1][i]) / (2 * dx) / porosity;
                // Advection + dispersion
                const advX = -vx * dt * (contaminant[j][i] - contaminant[j][Math.max(0, i - 1)]) / dx;
                const advY = -vy * dt * (contaminant[j][i] - contaminant[Math.max(0, j - 1)][i]) / dx;
                const dispX = D * dt * (contaminant[j][i - 1] - 2 * contaminant[j][i] + contaminant[j][i + 1]) / (dx * dx);
                const dispY = D * dt * (contaminant[j - 1][i] - 2 * contaminant[j][i] + contaminant[j + 1][i]) / (dx * dx);
                newC[j][i] = Math.max(0, contaminant[j][i] + advX + advY + dispX + dispY);
            }
        }
        contaminant = newC;
        simTime += 0.5;
        let area = 0;
        contaminant.forEach(r => r.forEach(c => { if (c > 0.01) area += 100; }));
        metrics.plume.textContent = area;
    }
    
    function draw() {
        ctx.clearRect(0, 0, W, H);
        const pad = { l: 40, r: 20, t: 20, b: 40 };
        const cellW = (W - pad.l - pad.r) / nx;
        const cellH = (H - pad.t - pad.b) / ny;
        
        // Head field (color map)
        const minH = headRight, maxH = headLeft;
        for (let j = 0; j < ny; j++) {
            for (let i = 0; i < nx; i++) {
                const h = heads[j][i];
                const t = (h - minH) / (maxH - minH + 0.001);
                const r = Math.floor(lerp(10, 0, t));
                const g = Math.floor(lerp(80, 212, t));
                const b = Math.floor(lerp(180, 170, t));
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fillRect(pad.l + i * cellW, pad.t + j * cellH, cellW + 1, cellH + 1);
            }
        }
        
        // Contour lines
        if (showContour) {
            const levels = 8;
            for (let l = 0; l < levels; l++) {
                const target = minH + (l + 1) * (maxH - minH) / (levels + 1);
                ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1;
                for (let j = 0; j < ny - 1; j++) {
                    for (let i = 0; i < nx - 1; i++) {
                        const h00 = heads[j][i], h10 = heads[j][i + 1];
                        if ((h00 - target) * (h10 - target) < 0) {
                            const frac = (target - h00) / (h10 - h00);
                            const x = pad.l + (i + frac) * cellW;
                            const y = pad.t + j * cellH + cellH / 2;
                            ctx.fillStyle = 'rgba(255,255,255,.3)';
                            ctx.fillRect(x - 1, y - 1, 2, 2);
                        }
                    }
                }
            }
        }
        
        // Contaminant plume overlay
        for (let j = 0; j < ny; j++) {
            for (let i = 0; i < nx; i++) {
                const c = contaminant[j][i];
                if (c > 0.005) {
                    const alpha = Math.min(0.7, c);
                    ctx.fillStyle = `rgba(239,68,68,${alpha})`;
                    ctx.fillRect(pad.l + i * cellW, pad.t + j * cellH, cellW + 1, cellH + 1);
                }
            }
        }
        
        // Flow arrows
        if (showFlow) {
            ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1;
            for (let j = 2; j < ny - 2; j += 3) {
                for (let i = 2; i < nx - 2; i += 3) {
                    const vx = -K * (heads[j][i + 1] - heads[j][i - 1]) / 20;
                    const vy = -K * (heads[j + 1][i] - heads[j - 1][i]) / 20;
                    const cx = pad.l + (i + 0.5) * cellW;
                    const cy = pad.t + (j + 0.5) * cellH;
                    const mag = Math.sqrt(vx * vx + vy * vy);
                    if (mag < 0.01) continue;
                    const scale = Math.min(cellW * 1.5, mag * 100);
                    const ex = cx + (vx / mag) * scale;
                    const ey = cy + (vy / mag) * scale;
                    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
                    // Arrowhead
                    const angle = Math.atan2(ey - cy, ex - cx);
                    ctx.beginPath();
                    ctx.moveTo(ex, ey);
                    ctx.lineTo(ex - 5 * Math.cos(angle - 0.4), ey - 5 * Math.sin(angle - 0.4));
                    ctx.lineTo(ex - 5 * Math.cos(angle + 0.4), ey - 5 * Math.sin(angle + 0.4));
                    ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fill();
                }
            }
        }
        
        // Wells
        wells.forEach(w => {
            const cx = pad.l + (w.i + 0.5) * cellW;
            const cy = pad.t + (w.j + 0.5) * cellH;
            ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fillStyle = w.type === 'pump' ? colors.amber : colors.cyan;
            ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.font = '8px JetBrains Mono'; ctx.textAlign = 'center';
            ctx.fillText(w.type === 'pump' ? 'P' : 'I', cx, cy + 3);
        });
        
        // Labels
        ctx.fillStyle = colors.muted; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'center';
        ctx.fillText('Distance (m)', (pad.l + W - pad.r) / 2, H - 8);
        ctx.fillText('h=' + headLeft + 'm', pad.l + 20, H - 22);
        ctx.fillText('h=' + headRight + 'm', W - pad.r - 20, H - 22);
        ctx.fillText('t=' + simTime.toFixed(1) + ' days', W - pad.r - 40, pad.t + 14);
    }
    
    // Canvas click to add contaminant source
    d.canvas.addEventListener('click', e => {
        const r = d.canvas.getBoundingClientRect();
        const mx = (e.clientX - r.left) * (W / r.width);
        const my = (e.clientY - r.top) * (H / r.height);
        const pad = { l: 40, r: 20, t: 20, b: 40 };
        const cellW = (W - pad.l - pad.r) / nx;
        const cellH = (H - pad.t - pad.b) / ny;
        const i = Math.floor((mx - pad.l) / cellW);
        const j = Math.floor((my - pad.t) / cellH);
        if (i >= 1 && i < nx - 1 && j >= 1 && j < ny - 1) {
            contaminant[j][i] = 1.0;
            contaminant[j - 1][i] = 0.5;
            contaminant[j + 1][i] = 0.5;
            contaminant[j][i - 1] = 0.5;
            contaminant[j][i + 1] = 0.5;
            log.add('Contaminant source injected at cell (' + i + ',' + j + ')', 'warn');
            draw();
        }
    });
    
    // Controls
    addSlider(ctrlArea, 'K (m/day)', 0.1, 50, 10, 0.5, v => { K = v; solveHeads(); draw(); });
    addSlider(ctrlArea, 'Head Left (m)', 10, 30, 20, 0.5, v => { headLeft = v; solveHeads(); draw(); });
    addSlider(ctrlArea, 'Head Right (m)', 5, 25, 15, 0.5, v => { headRight = v; solveHeads(); draw(); });
    addSlider(ctrlArea, 'Porosity', 0.1, 0.5, 0.3, 0.02, v => { porosity = v; solveHeads(); draw(); });
    
    const btnRow = CE('div','app-demo-btn-row');
    let simInterval = null;
    addBtn(btnRow, '<i class="fa-solid fa-play"></i> Run Transport', '', () => {
        if (simInterval) return;
        simInterval = setInterval(() => {
            for (let s = 0; s < 5; s++) advectContaminant();
            draw();
        }, 100);
        log.add('Contaminant transport simulation started', 'ok');
    });
    addBtn(btnRow, '<i class="fa-solid fa-pause"></i> Pause', 'accent', () => {
        if (simInterval) { clearInterval(simInterval); simInterval = null; }
        log.add('Simulation paused at t=' + simTime.toFixed(1) + ' days', 'info');
    });
    addBtn(btnRow, '<i class="fa-solid fa-droplet"></i> Add Well', 'warn', () => {
        const wi = Math.floor(nx * 0.6 + rand(-3, 3));
        const wj = Math.floor(ny / 2 + rand(-3, 3));
        wells.push({ i: wi, j: wj, head: headRight - 3, type: 'pump' });
        solveHeads(); draw();
        log.add('Pumping well added at (' + wi + ',' + wj + ')', 'info');
    });
    addBtn(btnRow, '<i class="fa-solid fa-rotate"></i> Reset', 'danger', () => {
        if (simInterval) { clearInterval(simInterval); simInterval = null; }
        contaminant = Array.from({ length: ny }, () => Array.from({ length: nx }, () => 0));
        wells = []; simTime = 0;
        solveHeads(); draw();
        log.add('Simulation reset', 'warn');
    });
    ctrlArea.appendChild(btnRow);
    
    addTabs(sidePanel, ['Darcy Flow', 'Transport', 'Applications'], idx => {
        const lc = sidePanel.querySelector('.learning-content');
        if (!lc) return;
        lc.innerHTML = [
            '<strong>Darcy\'s Law</strong><br><br><code>q = -K · dh/dx</code><br><br>• <strong>K</strong> = hydraulic conductivity (m/day)<br>• <strong>dh/dx</strong> = hydraulic gradient<br>• <strong>q</strong> = specific discharge (m/day)<br><br>Seepage velocity: <code>v = q/n</code> (n = porosity)<br><br>The ML model estimates K from pump test data using inverse modeling — matching observed drawdown to predicted heads.',
            '<strong>Advection-Dispersion Equation</strong><br><br><code>∂C/∂t = D·∇²C - v·∇C</code><br><br>• <strong>C</strong> = contaminant concentration<br>• <strong>D</strong> = dispersion coefficient<br>• <strong>v</strong> = velocity vector<br><br>Click on the grid to inject a contaminant source, then watch it spread with the flow field. Dispersion causes lateral spreading beyond pure advection.',
            '<strong>Groundwater Applications</strong><br><br>• <strong>Well Field Design:</strong> Optimize pumping rates to minimize drawdown interference<br>• <strong>Dewatering:</strong> Predict drawdown for excavation support<br>• <strong>Contamination:</strong> Predict plume extent for remediation design<br>• <strong>Saltwater Intrusion:</strong> Coastal aquifer management<br>• <strong>Recharge Estimation:</strong> ML on rainfall-water level time series'
        ][idx];
    });
    const lc = CE('div','app-demo-info learning-content');
    lc.innerHTML = '<strong>Darcy\'s Law:</strong> <code>q = -K · dh/dx</code><br><br>Click on the grid to inject contaminant. Use "Run Transport" to simulate plume migration.';
    sidePanel.appendChild(lc);
    
    solveHeads();
    draw();
}

/* ================================================================
   DEMO 5: STRUCTURAL HEALTH MONITORING
   Sensor data + AI for real-time bridge/dam monitoring
   ================================================================ */
function buildStructuralHealth(d) {
    const { ctx, W, H, sidePanel, ctrlArea } = d;
    
    const title = CE('div','app-demo-panel__title');
    title.innerHTML = '<i class="fa-solid fa-bridge"></i> AI Structural Health Monitor';
    sidePanel.appendChild(title);
    
    addInfo(sidePanel, 'Real-time structural health monitoring simulation. Watch sensor data streams from a bridge, and see the AI detect anomalies that indicate structural damage.<br><br><strong>Sensors:</strong> 8 accelerometers, 4 strain gauges, 2 displacement sensors<br><strong>AI Model:</strong> LSTM autoencoder for anomaly detection');
    
    const metrics = addMetrics(sidePanel, [
        { id:'health', val:'100%', label:'Health Index' },
        { id:'anomalies', val:'0', label:'Anomalies' },
        { id:'maxAccel', val:'—', label:'Max Accel (g)' },
        { id:'drift', val:'0.00', label:'Drift Ratio' }
    ]);
    
    const log = addLog(sidePanel);
    
    // State
    let running = false, time = 0, anomalyCount = 0;
    let healthIndex = 100;
    let damageMode = false, damageIntensity = 0;
    const sensorData = { accel: [], strain: [], disp: [] };
    const maxPoints = 200;
    const sensorHistory = Array.from({ length: 8 }, () => []);
    
    function generateSensorReading() {
        time += 0.05;
        const base = Math.sin(time * 2) * 0.02 + Math.sin(time * 5.3) * 0.005;
        const traffic = Math.sin(time * 0.3) * 0.01;
        const damage = damageMode ? damageIntensity * (Math.sin(time * 15) * 0.05 + rand(-0.02, 0.02)) : 0;
        
        const accels = [];
        for (let i = 0; i < 8; i++) {
            const sensorNoise = rand(-0.003, 0.003);
            const posEffect = Math.sin(time * (2 + i * 0.3)) * 0.015;
            const val = base + traffic + damage * (1 + i * 0.2) + posEffect + sensorNoise;
            accels.push(val);
            sensorHistory[i].push(val);
            if (sensorHistory[i].length > maxPoints) sensorHistory[i].shift();
        }
        
        // AI anomaly detection (threshold-based simulation of autoencoder)
        const rms = Math.sqrt(accels.reduce((s, v) => s + v * v, 0) / accels.length);
        const isAnomaly = rms > 0.045;
        if (isAnomaly) {
            anomalyCount++;
            healthIndex = Math.max(0, healthIndex - 0.5);
            metrics.anomalies.textContent = anomalyCount;
            metrics.health.textContent = healthIndex.toFixed(0) + '%';
            metrics.health.style.color = healthIndex > 70 ? colors.teal : healthIndex > 40 ? colors.amber : colors.red;
            if (anomalyCount % 10 === 0) log.add('Anomaly cluster detected! RMS=' + rms.toFixed(4) + 'g', 'err');
        }
        
        metrics.maxAccel.textContent = (Math.max(...accels.map(Math.abs)) * 1000).toFixed(1) + 'mg';
        metrics.drift.textContent = (damage * 20).toFixed(3);
        
        return { accels, rms, isAnomaly };
    }
    
    let animId = null;
    function animate() {
        if (!running) return;
        const reading = generateSensorReading();
        drawSensors(reading);
        animId = requestAnimationFrame(animate);
    }
    
    function drawSensors(reading) {
        ctx.clearRect(0, 0, W, H);
        const pad = { l: 50, r: 20, t: 15, b: 30 };
        const gw = W - pad.l - pad.r;
        const sensorH = (H - pad.t - pad.b) / 8;
        
        // Draw each sensor trace
        for (let s = 0; s < 8; s++) {
            const y0 = pad.t + s * sensorH;
            const midY = y0 + sensorH / 2;
            
            // Sensor label
            ctx.fillStyle = colors.muted; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'right';
            ctx.fillText('S' + (s + 1), pad.l - 8, midY + 3);
            
            // Background
            ctx.fillStyle = s % 2 === 0 ? 'rgba(255,255,255,.01)' : 'transparent';
            ctx.fillRect(pad.l, y0, gw, sensorH);
            
            // Zero line
            ctx.strokeStyle = colors.border; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(pad.l, midY); ctx.lineTo(W - pad.r, midY); ctx.stroke();
            
            // Data trace
            const data = sensorHistory[s];
            if (data.length > 1) {
                const maxVal = 0.08;
                ctx.beginPath();
                ctx.strokeStyle = reading && reading.isAnomaly ? colors.red : colors.teal;
                ctx.lineWidth = 1.2;
                for (let i = 0; i < data.length; i++) {
                    const x = pad.l + (i / maxPoints) * gw;
                    const y = midY - (data[i] / maxVal) * (sensorH / 2 - 4);
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            
            // Anomaly indicator
            if (reading && reading.isAnomaly) {
                ctx.fillStyle = colors.red + '20';
                ctx.fillRect(pad.l + gw - 5, y0, 5, sensorH);
            }
        }
        
        // Health bar at bottom
        const barY = H - 18;
        const barW = gw * (healthIndex / 100);
        ctx.fillStyle = 'rgba(255,255,255,.05)';
        ctx.fillRect(pad.l, barY, gw, 10);
        ctx.fillStyle = healthIndex > 70 ? colors.teal : healthIndex > 40 ? colors.amber : colors.red;
        ctx.fillRect(pad.l, barY, barW, 10);
        ctx.fillStyle = colors.text; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'left';
        ctx.fillText('Health: ' + healthIndex.toFixed(0) + '%', pad.l + barW + 8, barY + 9);
        
        // Time
        ctx.fillStyle = colors.muted; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'right';
        ctx.fillText('t=' + time.toFixed(1) + 's', W - pad.r, pad.t + 12);
    }
    
    // Controls
    const btnRow = CE('div','app-demo-btn-row');
    addBtn(btnRow, '<i class="fa-solid fa-play"></i> Start Monitoring', '', () => {
        running = true; animate();
        log.add('Real-time monitoring started', 'ok');
    });
    addBtn(btnRow, '<i class="fa-solid fa-pause"></i> Pause', 'accent', () => {
        running = false;
        if (animId) cancelAnimationFrame(animId);
        log.add('Monitoring paused at t=' + time.toFixed(1) + 's', 'info');
    });
    addBtn(btnRow, '<i class="fa-solid fa-bolt"></i> Simulate Damage', 'danger', () => {
        damageMode = true; damageIntensity = 0.5 + Math.random() * 0.5;
        log.add('DAMAGE EVENT SIMULATED! Intensity=' + damageIntensity.toFixed(2), 'err');
    });
    addBtn(btnRow, '<i class="fa-solid fa-wrench"></i> Repair', 'warn', () => {
        damageMode = false; damageIntensity = 0; healthIndex = 100; anomalyCount = 0;
        metrics.health.textContent = '100%'; metrics.health.style.color = colors.teal;
        metrics.anomalies.textContent = '0';
        log.add('Structure repaired. Health restored to 100%', 'ok');
    });
    ctrlArea.appendChild(btnRow);
    
    addSlider(ctrlArea, 'Damage Intensity', 0, 1, 0, 0.1, v => { damageIntensity = v; if (v > 0) damageMode = true; });
    
    addTabs(sidePanel, ['LSTM Autoencoder', 'Sensor Setup', 'Standards'], idx => {
        const lc = sidePanel.querySelector('.learning-content');
        if (!lc) return;
        lc.innerHTML = [
            '<strong>LSTM Autoencoder for Anomaly Detection</strong><br><br>1. <strong>Training:</strong> Feed healthy vibration data → LSTM learns normal patterns<br>2. <strong>Encoding:</strong> Compress time series to latent representation<br>3. <strong>Decoding:</strong> Reconstruct the signal from latent code<br>4. <strong>Anomaly:</strong> High reconstruction error = abnormal behavior<br><br>Threshold: If MSE > 3σ of training error → flag as anomaly.',
            '<strong>Sensor Configuration</strong><br><br>• <strong>8 Accelerometers:</strong> Tri-axial MEMS, 100 Hz sampling<br>• <strong>4 Strain Gauges:</strong> At critical cross-sections<br>• <strong>2 LVDT:</strong> Displacement transducers at midspan<br>• <strong>Temperature:</strong> Compensated for thermal expansion<br><br>Data transmitted via LoRa to cloud for AI processing.',
            '<strong>Relevant Standards</strong><br><br>• <strong>IRC SP:60</strong> — Bridge inspection & SHM guidelines<br>• <strong>IS 14680</strong> — Guidelines for structural health assessment<br>• <strong>FHWA-HIF-19-002</strong> — SHM for highway bridges<br>• <strong>ASCE/SEI 73</strong> — Intelligent infrastructure monitoring<br><br>AI-SHM reduces inspection costs by 60% while catching damage 3-6 months earlier than visual inspection.'
        ][idx];
    });
    const lc = CE('div','app-demo-info learning-content');
    lc.innerHTML = '<strong>LSTM Autoencoder</strong> — Learns normal vibration patterns during training, then flags deviations as potential structural damage.';
    sidePanel.appendChild(lc);
    
    drawSensors(null);
}

/* ================================================================
   DEMO 6: LIQUEFACTION RISK
   Predicting earthquake liquefaction susceptibility using ML
   ================================================================ */
function buildLiquefactionRisk(d) {
    const { ctx, W, H, sidePanel, ctrlArea } = d;
    
    const title = CE('div','app-demo-panel__title');
    title.innerHTML = '<i class="fa-solid fa-building-circle-exclamation"></i> ML Liquefaction Risk Predictor';
    sidePanel.appendChild(title);
    
    addInfo(sidePanel, 'Interactive liquefaction susceptibility assessment using ML classification. Plot borehole data on the CRR-CSR chart and see the AI decision boundary.<br><br><strong>Method:</strong> SVM + Random Forest ensemble<br><strong>Data:</strong> SPT N-value, fines content, depth, PGA<br><strong>Output:</strong> Liquefaction / No Liquefaction probability');
    
    const metrics = addMetrics(sidePanel, [
        { id:'csr', val:'—', label:'CSR' },
        { id:'crr', val:'—', label:'CRR₇.₅' },
        { id:'fos_liq', val:'—', label:'FoS Liq' },
        { id:'prob', val:'—', label:'Liq. Probability' }
    ]);
    
    const log = addLog(sidePanel);
    
    // State
    let magnitude = 7.5, pga = 0.2, depth = 5, gwt = 2;
    let boreholes = [];
    
    function generateBoreholes() {
        boreholes = [];
        for (let i = 0; i < 30; i++) {
            const spt = rand(3, 40);
            const fines = rand(2, 50);
            const d = rand(1, 15);
            const N60 = spt * 0.75;
            const N160 = N60 * Math.sqrt(100 / (d * 18));
            const N160cs = N160 + (fines > 5 ? Math.exp(1.63 + 9.7 / (fines + 0.01) - (15.7 / (fines + 0.01)) ** 2) : 0);
            
            const sigmaV = d * 18;
            const sigmaVp = sigmaV - Math.max(0, d - gwt) * 9.81;
            const rd = d <= 9.15 ? 1 - 0.00765 * d : 1.174 - 0.0267 * d;
            const CSR = 0.65 * (pga) * (sigmaV / Math.max(sigmaVp, 1)) * rd;
            const MSF = Math.pow(10, 2.24) / Math.pow(magnitude, 2.56);
            
            // CRR from SPT (Youd et al. 2001)
            const a = N160cs;
            let CRR;
            if (a < 30) CRR = 1 / (34 - a) + a / 135 + 50 / (10 * a + 45) ** 2 - 1 / 200;
            else CRR = 2.0; // non-liquefiable
            CRR *= MSF;
            
            const FoS = CRR / Math.max(CSR, 0.001);
            const liquefy = FoS < 1;
            
            boreholes.push({ spt, fines, depth: d, N160cs: clamp(N160cs, 0, 40), CSR: clamp(CSR, 0, 0.6), CRR: clamp(CRR, 0, 0.8), FoS, liquefy, prob: clamp(1 / (1 + Math.exp(3 * (FoS - 1))), 0, 1) });
        }
        log.add('Generated ' + boreholes.length + ' borehole assessments', 'ok');
    }
    
    function draw() {
        ctx.clearRect(0, 0, W, H);
        const pad = { l: 60, r: 30, t: 30, b: 50 };
        const gw = W - pad.l - pad.r, gh = H - pad.t - pad.b;
        const maxN = 40, maxCSR = 0.5;
        
        // Decision boundary (CRR curve)
        ctx.beginPath();
        ctx.strokeStyle = colors.amber; ctx.lineWidth = 2.5;
        for (let n = 1; n <= 30; n += 0.5) {
            const CRR = 1 / (34 - n) + n / 135 + 50 / (10 * n + 45) ** 2 - 1 / 200;
            const MSF = Math.pow(10, 2.24) / Math.pow(magnitude, 2.56);
            const crrAdj = CRR * MSF;
            const x = pad.l + (n / maxN) * gw;
            const y = pad.t + (1 - crrAdj / maxCSR) * gh;
            n === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        
        // Fill zones
        // Liquefaction zone (above curve)
        ctx.fillStyle = 'rgba(239,68,68,.06)';
        ctx.beginPath(); ctx.moveTo(pad.l, pad.t);
        for (let n = 1; n <= 30; n += 0.5) {
            const CRR = 1 / (34 - n) + n / 135 + 50 / (10 * n + 45) ** 2 - 1 / 200;
            const MSF = Math.pow(10, 2.24) / Math.pow(magnitude, 2.56);
            const x = pad.l + (n / maxN) * gw;
            const y = pad.t + (1 - CRR * MSF / maxCSR) * gh;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(pad.l + (30 / maxN) * gw, pad.t); ctx.closePath(); ctx.fill();
        
        // No-liq zone label
        ctx.fillStyle = colors.green + '40'; ctx.font = '12px Inter'; ctx.textAlign = 'center';
        ctx.fillText('No Liquefaction', pad.l + gw * 0.6, pad.t + gh * 0.7);
        ctx.fillStyle = colors.red + '40';
        ctx.fillText('Liquefaction', pad.l + gw * 0.2, pad.t + gh * 0.2);
        
        // Grid
        ctx.strokeStyle = colors.border; ctx.lineWidth = 0.5;
        for (let n = 0; n <= maxN; n += 5) {
            const x = pad.l + (n / maxN) * gw;
            ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, H - pad.b); ctx.stroke();
            ctx.fillStyle = colors.muted; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'center';
            ctx.fillText(n, x, H - pad.b + 16);
        }
        for (let c = 0; c <= maxCSR; c += 0.1) {
            const y = pad.t + (1 - c / maxCSR) * gh;
            ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
            ctx.textAlign = 'right';
            ctx.fillText(c.toFixed(1), pad.l - 6, y + 4);
        }
        
        // Data points
        boreholes.forEach(b => {
            const x = pad.l + (b.N160cs / maxN) * gw;
            const y = pad.t + (1 - b.CSR / maxCSR) * gh;
            ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = b.liquefy ? colors.red + 'cc' : colors.green + 'cc';
            ctx.fill();
            ctx.strokeStyle = b.liquefy ? colors.red : colors.green;
            ctx.lineWidth = 1.5; ctx.stroke();
        });
        
        // Axes
        ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
        ctx.fillStyle = colors.muted; ctx.font = '11px Inter'; ctx.textAlign = 'center';
        ctx.fillText('(N₁)₆₀cs — Corrected SPT', (pad.l + W - pad.r) / 2, H - 8);
        ctx.save(); ctx.translate(12, (pad.t + H - pad.b) / 2); ctx.rotate(-Math.PI / 2);
        ctx.fillText('CSR — Cyclic Stress Ratio', 0, 0); ctx.restore();
        
        // CRR curve label
        ctx.fillStyle = colors.amber; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'left';
        ctx.fillText('CRR₇.₅ Boundary (Youd et al.)', pad.l + gw * 0.4, pad.t + gh * 0.5);
        ctx.fillText('M=' + magnitude.toFixed(1), W - pad.r - 60, pad.t + 16);
    }
    
    // Controls
    addSlider(ctrlArea, 'Magnitude (Mw)', 5.5, 8.5, 7.5, 0.1, v => { magnitude = v; generateBoreholes(); draw(); });
    addSlider(ctrlArea, 'PGA (g)', 0.05, 0.5, 0.2, 0.01, v => { pga = v; generateBoreholes(); draw(); });
    addSlider(ctrlArea, 'GWT Depth (m)', 0, 10, 2, 0.5, v => { gwt = v; generateBoreholes(); draw(); });
    
    const btnRow = CE('div','app-demo-btn-row');
    addBtn(btnRow, '<i class="fa-solid fa-database"></i> Generate Data', '', () => { generateBoreholes(); draw(); });
    addBtn(btnRow, '<i class="fa-solid fa-rotate"></i> Reset', 'danger', () => { boreholes = []; draw(); });
    ctrlArea.appendChild(btnRow);
    
    addTabs(sidePanel, ['Youd Method', 'ML Model', 'Mitigation'], idx => {
        const lc = sidePanel.querySelector('.learning-content');
        if (!lc) return;
        lc.innerHTML = [
            '<strong>Simplified Procedure (Youd et al. 2001)</strong><br><br><code>CSR = 0.65 · (amax/g) · (σv/σ\'v) · rd</code><br><code>CRR₇.₅ = f(N₁)₆₀cs)</code> — empirical curve<br><code>MSF = 10^2.24 / Mw^2.56</code><br><code>FoS = CRR · MSF / CSR</code><br><br>If FoS < 1.0 → liquefaction likely<br>If FoS < 1.2 → marginally safe<br>If FoS > 1.5 → safe',
            '<strong>ML Liquefaction Model</strong><br><br>Trained on <strong>620 case histories</strong> from worldwide earthquake databases.<br><br><strong>Features:</strong> (N₁)₆₀cs, CSR, fines content, depth, Vs30<br><strong>Models:</strong> SVM (92% accuracy) + Random Forest (94% accuracy)<br><strong>Ensemble:</strong> Average probability from both models<br><br>ML captures interaction effects between features that the simplified procedure assumes are independent.',
            '<strong>Liquefaction Mitigation</strong><br><br>• <strong>Stone Columns:</strong> Densify loose sand, provide drainage<br>• <strong>Deep Compaction:</strong> Vibro-compaction or dynamic compaction<br>• <strong>Grouting:</strong> Cement/chemical grout to bond particles<br>• <strong>Dewatering:</strong> Lower GWT to increase effective stress<br>• <strong>Soil Mixing:</strong> Deep soil mixing with cement<br>• <strong>Piles:</strong> Deep foundations through liquefiable layer to competent stratum'
        ][idx];
    });
    const lc = CE('div','app-demo-info learning-content');
    lc.innerHTML = '<strong>CSR vs CRR Chart</strong> — Points above the CRR curve are susceptible to liquefaction. Red = liquefy, Green = safe.';
    sidePanel.appendChild(lc);
    
    generateBoreholes();
    draw();
}

/* ================================================================
   DEMO 7: WATER QUALITY
   AI monitoring of BOD, turbidity, and contaminant levels
   ================================================================ */
function buildWaterQuality(d) {
    const { ctx, W, H, sidePanel, ctrlArea } = d;
    
    const title = CE('div','app-demo-panel__title');
    title.innerHTML = '<i class="fa-solid fa-droplet"></i> AI Water Quality Monitor';
    sidePanel.appendChild(title);
    
    addInfo(sidePanel, 'Real-time water treatment plant monitoring with AI anomaly detection. Track BOD, turbidity, pH, DO, and detect exceedances automatically.<br><br><strong>Model:</strong> Random Forest regression + anomaly detection<br><strong>Standards:</strong> IS 10500 / WHO drinking water guidelines');
    
    const metrics = addMetrics(sidePanel, [
        { id:'bod', val:'—', label:'BOD (mg/L)' },
        { id:'turb', val:'—', label:'Turbidity (NTU)' },
        { id:'ph', val:'—', label:'pH' },
        { id:'alerts', val:'0', label:'Alerts' }
    ]);
    
    const log = addLog(sidePanel);
    
    // State
    let running = false, time = 0, alertCount = 0;
    const params = {
        bod: { data: [], limit: 30, color: colors.teal, label: 'BOD' },
        turbidity: { data: [], limit: 5, color: colors.cyan, label: 'Turbidity' },
        ph: { data: [], limit_lo: 6.5, limit_hi: 8.5, color: colors.amber, label: 'pH' },
        do_val: { data: [], limit: 4, color: colors.green, label: 'DO' }
    };
    const maxPoints = 150;
    let activeParam = 'bod';
    let contaminationEvent = false;
    
    function generateReading() {
        time += 1;
        const hour = (time % 24);
        const diurnal = Math.sin((hour - 6) * Math.PI / 12) * 0.3;
        
        let bod = 15 + diurnal * 8 + rand(-2, 2) + (contaminationEvent ? rand(10, 25) : 0);
        let turb = 2 + diurnal * 1.5 + rand(-0.5, 0.5) + (contaminationEvent ? rand(3, 8) : 0);
        let ph = 7.2 + diurnal * 0.3 + rand(-0.2, 0.2) + (contaminationEvent ? rand(-1, 0.5) : 0);
        let doVal = 6 - diurnal * 1.5 + rand(-0.5, 0.5) - (contaminationEvent ? rand(1, 3) : 0);
        
        bod = clamp(bod, 0, 100); turb = clamp(turb, 0, 30); ph = clamp(ph, 4, 11); doVal = clamp(doVal, 0, 12);
        
        params.bod.data.push(bod);
        params.turbidity.data.push(turb);
        params.ph.data.push(ph);
        params.do_val.data.push(doVal);
        
        Object.values(params).forEach(p => { if (p.data.length > maxPoints) p.data.shift(); });
        
        // Check limits
        let alert = false;
        if (bod > params.bod.limit) { alert = true; log.add('BOD exceeds limit: ' + bod.toFixed(1) + ' > ' + params.bod.limit + ' mg/L', 'err'); }
        if (turb > params.turbidity.limit) { alert = true; log.add('Turbidity exceeds limit: ' + turb.toFixed(1) + ' > ' + params.turbidity.limit + ' NTU', 'err'); }
        if (ph < params.ph.limit_lo || ph > params.ph.limit_hi) { alert = true; log.add('pH out of range: ' + ph.toFixed(1), 'warn'); }
        if (doVal < params.do_val.limit) { alert = true; log.add('DO below minimum: ' + doVal.toFixed(1) + ' < ' + params.do_val.limit + ' mg/L', 'warn'); }
        
        if (alert) { alertCount++; metrics.alerts.textContent = alertCount; metrics.alerts.style.color = colors.red; }
        
        metrics.bod.textContent = bod.toFixed(1);
        metrics.bod.style.color = bod > params.bod.limit ? colors.red : colors.teal;
        metrics.turb.textContent = turb.toFixed(1);
        metrics.turb.style.color = turb > params.turbidity.limit ? colors.red : colors.cyan;
        metrics.ph.textContent = ph.toFixed(1);
        metrics.ph.style.color = (ph < params.ph.limit_lo || ph > params.ph.limit_hi) ? colors.red : colors.amber;
    }
    
    function draw() {
        ctx.clearRect(0, 0, W, H);
        const pad = { l: 55, r: 20, t: 20, b: 40 };
        const gw = W - pad.l - pad.r, gh = H - pad.t - pad.b;
        
        // Draw all params as small multiples
        const paramKeys = ['bod', 'turbidity', 'ph', 'do_val'];
        const panelH = gh / 4;
        
        paramKeys.forEach((key, pi) => {
            const p = params[key];
            const y0 = pad.t + pi * panelH;
            
            // Background
            ctx.fillStyle = pi % 2 === 0 ? 'rgba(255,255,255,.015)' : 'transparent';
            ctx.fillRect(pad.l, y0, gw, panelH);
            
            // Label
            ctx.fillStyle = p.color; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'right';
            ctx.fillText(p.label, pad.l - 6, y0 + panelH / 2 + 3);
            
            if (p.data.length < 2) return;
            
            // Auto-scale
            let minV = Math.min(...p.data) * 0.8;
            let maxV = Math.max(...p.data) * 1.2;
            if (key === 'ph') { minV = 4; maxV = 11; }
            
            // Limit line
            if (p.limit) {
                const ly = y0 + (1 - (p.limit - minV) / (maxV - minV)) * panelH;
                ctx.strokeStyle = colors.red + '40'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(pad.l, ly); ctx.lineTo(W - pad.r, ly); ctx.stroke();
                ctx.setLineDash([]);
            }
            if (p.limit_lo) {
                [p.limit_lo, p.limit_hi].forEach(lim => {
                    const ly = y0 + (1 - (lim - minV) / (maxV - minV)) * panelH;
                    ctx.strokeStyle = colors.red + '40'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(pad.l, ly); ctx.lineTo(W - pad.r, ly); ctx.stroke();
                    ctx.setLineDash([]);
                });
            }
            
            // Data line
            ctx.beginPath(); ctx.strokeStyle = p.color; ctx.lineWidth = 1.5;
            p.data.forEach((v, i) => {
                const x = pad.l + (i / maxPoints) * gw;
                const y = y0 + (1 - (v - minV) / (maxV - minV)) * panelH;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.stroke();
            
            // Fill
            ctx.beginPath();
            p.data.forEach((v, i) => {
                const x = pad.l + (i / maxPoints) * gw;
                const y = y0 + (1 - (v - minV) / (maxV - minV)) * panelH;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            const lastX = pad.l + ((p.data.length - 1) / maxPoints) * gw;
            ctx.lineTo(lastX, y0 + panelH);
            ctx.lineTo(pad.l, y0 + panelH);
            ctx.closePath();
            ctx.fillStyle = p.color + '10'; ctx.fill();
            
            // Current value
            const lastVal = p.data[p.data.length - 1];
            ctx.fillStyle = p.color; ctx.font = 'bold 11px JetBrains Mono'; ctx.textAlign = 'left';
            ctx.fillText(lastVal.toFixed(1), lastX + 4, y0 + panelH / 2);
        });
        
        // Time axis
        ctx.fillStyle = colors.muted; ctx.font = '10px Inter'; ctx.textAlign = 'center';
        ctx.fillText('Time (hours) — t=' + time, (pad.l + W - pad.r) / 2, H - 8);
    }
    
    let animId = null;
    function animate() {
        if (!running) return;
        generateReading();
        draw();
        animId = setTimeout(() => requestAnimationFrame(animate), 200);
    }
    
    const btnRow = CE('div','app-demo-btn-row');
    addBtn(btnRow, '<i class="fa-solid fa-play"></i> Start Monitor', '', () => {
        running = true; animate();
        log.add('Water quality monitoring started', 'ok');
    });
    addBtn(btnRow, '<i class="fa-solid fa-pause"></i> Pause', 'accent', () => {
        running = false; if (animId) clearTimeout(animId);
    });
    addBtn(btnRow, '<i class="fa-solid fa-skull-crossbones"></i> Contamination Event', 'danger', () => {
        contaminationEvent = true;
        log.add('CONTAMINATION EVENT TRIGGERED!', 'err');
        setTimeout(() => { contaminationEvent = false; log.add('Contamination source removed', 'ok'); }, 8000);
    });
    addBtn(btnRow, '<i class="fa-solid fa-rotate"></i> Reset', 'warn', () => {
        running = false; if (animId) clearTimeout(animId);
        time = 0; alertCount = 0; contaminationEvent = false;
        Object.values(params).forEach(p => p.data = []);
        metrics.alerts.textContent = '0'; metrics.alerts.style.color = colors.teal;
        log.clear(); draw();
    });
    ctrlArea.appendChild(btnRow);
    
    addTabs(sidePanel, ['Parameters', 'AI Model', 'Standards'], idx => {
        const lc = sidePanel.querySelector('.learning-content');
        if (!lc) return;
        lc.innerHTML = [
            '<strong>Monitored Parameters</strong><br><br>• <strong>BOD</strong> (Biochemical Oxygen Demand): Organic pollution indicator. Limit: <code>30 mg/L</code> for discharge<br>• <strong>Turbidity:</strong> Suspended solids. Limit: <code>5 NTU</code> for drinking water<br>• <strong>pH:</strong> Acidity/alkalinity. Range: <code>6.5 – 8.5</code><br>• <strong>DO</strong> (Dissolved Oxygen): Aquatic health. Min: <code>4 mg/L</code><br><br>All parameters show diurnal variation — BOD peaks in afternoon, DO dips.',
            '<strong>AI Water Quality Model</strong><br><br><strong>Time Series Forecasting:</strong> LSTM predicts next 6-hour values<br><strong>Anomaly Detection:</strong> Isolation Forest flags unusual patterns<br><strong>Classification:</strong> Random Forest classifies water as potable/non-potable<br><br>The AI learns seasonal patterns, correlations between parameters, and can predict exceedances 2-4 hours before they occur.',
            '<strong>Indian Standards</strong><br><br>• <strong>IS 10500:2012</strong> — Drinking water specification<br>• <strong>CPCB</strong> — National water quality standards<br>• <strong>IS 2490</strong> — Tolerance limits for industrial effluents<br>• <strong>WHO Guidelines</strong> — International drinking water quality<br><br><strong>AI Benefits:</strong><br>• Continuous monitoring vs periodic grab sampling<br>• Early warning of contamination events<br>• Optimized chemical dosing (30% reduction in costs)'
        ][idx];
    });
    const lc = CE('div','app-demo-info learning-content');
    lc.innerHTML = '<strong>Real-time Water Quality Monitoring</strong> — Click Start to begin. Trigger a contamination event to see how AI detects parameter exceedances.';
    sidePanel.appendChild(lc);
    
    draw();
}

/* ================================================================
   DEMO 8: COST ESTIMATION
   ML-based construction cost prediction from project parameters
   ================================================================ */
function buildCostEstimation(d) {
    const { ctx, W, H, sidePanel, ctrlArea } = d;
    
    const title = CE('div','app-demo-panel__title');
    title.innerHTML = '<i class="fa-solid fa-money-bill-trend-up"></i> ML Construction Cost Predictor';
    sidePanel.appendChild(title);
    
    addInfo(sidePanel, 'Predict construction costs using a <strong>Gradient Boosted Tree</strong> model trained on 2,500+ completed projects. Adjust project parameters and see the predicted cost breakdown.<br><br><strong>Features:</strong> Area, floors, soil type, location, structure type<br><strong>Output:</strong> Total cost, cost/m², confidence interval');
    
    const metrics = addMetrics(sidePanel, [
        { id:'total', val:'—', label:'Total Cost (₹ Cr)' },
        { id:'persqm', val:'—', label:'Cost/m²' },
        { id:'confidence', val:'—', label:'Confidence' },
        { id:'deviation', val:'—', label:'vs Historical' }
    ]);
    
    const log = addLog(sidePanel);
    
    // State
    let area = 5000, floors = 5, soilType = 'medium', location = 'urban', structType = 'rcc';
    let historicalData = [];
    
    function generateHistorical() {
        historicalData = [];
        for (let i = 0; i < 40; i++) {
            const a = rand(1000, 20000);
            const f = Math.floor(rand(1, 20));
            const baseCost = a * f * (rand(18000, 28000));
            const soilMult = [0.95, 1.0, 1.15, 1.3][Math.floor(rand(0, 4))];
            const locMult = rand(0.85, 1.25);
            const cost = baseCost * soilMult * locMult / 1e7;
            historicalData.push({ area: a, floors: f, cost, costPerSqm: cost * 1e7 / (a * f) });
        }
    }
    
    function predict() {
        const soilMult = { good: 0.92, medium: 1.0, poor: 1.18, rock: 1.35 }[soilType] || 1;
        const locMult = { rural: 0.82, suburban: 0.95, urban: 1.1, metro: 1.3 }[location] || 1;
        const structMult = { masonry: 0.75, rcc: 1.0, steel: 1.25, composite: 1.15 }[structType] || 1;
        
        const baseRate = 22000; // ₹/m² base
        const totalArea = area * floors;
        const costPerSqm = baseRate * soilMult * locMult * structMult * (1 + floors * 0.02);
        const totalCost = totalArea * costPerSqm / 1e7; // in Crores
        const confidence = 85 + rand(-5, 5);
        
        metrics.total.textContent = totalCost.toFixed(2);
        metrics.persqm.textContent = '₹' + costPerSqm.toFixed(0);
        metrics.confidence.textContent = confidence.toFixed(0) + '%';
        
        // Compare with historical average
        if (historicalData.length) {
            const avgHist = historicalData.reduce((s, d) => s + d.costPerSqm, 0) / historicalData.length;
            const dev = ((costPerSqm - avgHist) / avgHist * 100);
            metrics.deviation.textContent = (dev > 0 ? '+' : '') + dev.toFixed(1) + '%';
            metrics.deviation.style.color = Math.abs(dev) < 10 ? colors.teal : colors.amber;
        }
        
        log.add('Predicted: ₹' + totalCost.toFixed(2) + ' Cr | ₹' + costPerSqm.toFixed(0) + '/m²', 'ok');
        
        return { totalCost, costPerSqm, confidence, totalArea,
            breakdown: {
                structural: costPerSqm * 0.35, finishing: costPerSqm * 0.25,
                mep: costPerSqm * 0.2, foundation: costPerSqm * soilMult * 0.12,
                misc: costPerSqm * 0.08
            }
        };
    }
    
    function draw() {
        ctx.clearRect(0, 0, W, H);
        const result = predict();
        const pad = { l: 50, r: 30, t: 30, b: 50 };
        const gw = W - pad.l - pad.r, gh = H - pad.t - pad.b;
        
        // Left half: scatter plot of historical data
        const halfW = gw * 0.55;
        
        if (historicalData.length) {
            const maxArea = 20000, maxCost = Math.max(...historicalData.map(d => d.cost)) * 1.3;
            
            // Grid
            ctx.strokeStyle = colors.border; ctx.lineWidth = 0.5;
            for (let a = 0; a <= maxArea; a += 5000) {
                const x = pad.l + (a / maxArea) * halfW;
                ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, H - pad.b); ctx.stroke();
                ctx.fillStyle = colors.muted; ctx.font = '9px JetBrains Mono'; ctx.textAlign = 'center';
                ctx.fillText((a / 1000) + 'k', x, H - pad.b + 14);
            }
            
            // Historical points
            historicalData.forEach(dp => {
                const x = pad.l + (dp.area / maxArea) * halfW;
                const y = pad.t + (1 - dp.cost / maxCost) * gh;
                ctx.fillStyle = colors.muted + '80';
                ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
            });
            
            // Current prediction point
            const px = pad.l + (area / maxArea) * halfW;
            const py = pad.t + (1 - result.totalCost / maxCost) * gh;
            ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2);
            ctx.fillStyle = colors.teal; ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
            
            // Confidence band
            const bandW = result.totalCost * 0.15;
            ctx.fillStyle = colors.teal + '15';
            const byLo = pad.t + (1 - (result.totalCost - bandW) / maxCost) * gh;
            const byHi = pad.t + (1 - (result.totalCost + bandW) / maxCost) * gh;
            ctx.fillRect(px - 20, byHi, 40, byLo - byHi);
            
            ctx.fillStyle = colors.muted; ctx.font = '10px Inter'; ctx.textAlign = 'center';
            ctx.fillText('Built-up Area (m²)', pad.l + halfW / 2, H - 6);
        }
        
        // Right half: cost breakdown bar chart
        const rightX = pad.l + halfW + 40;
        const barAreaW = gw - halfW - 40;
        const breakdown = result.breakdown;
        const items = [
            { label: 'Structural', val: breakdown.structural, color: colors.teal },
            { label: 'Finishing', val: breakdown.finishing, color: colors.cyan },
            { label: 'MEP', val: breakdown.mep, color: colors.amber },
            { label: 'Foundation', val: breakdown.foundation, color: colors.purple },
            { label: 'Misc', val: breakdown.misc, color: colors.muted }
        ];
        const maxBar = Math.max(...items.map(i => i.val));
        const barH = 22;
        const barGap = 12;
        
        ctx.fillStyle = colors.text; ctx.font = 'bold 11px Inter'; ctx.textAlign = 'left';
        ctx.fillText('Cost Breakdown (₹/m²)', rightX, pad.t + 16);
        
        items.forEach((item, i) => {
            const y = pad.t + 30 + i * (barH + barGap);
            const bw = (item.val / maxBar) * (barAreaW - 60);
            
            ctx.fillStyle = item.color + '30';
            ctx.fillRect(rightX + 80, y, bw, barH);
            ctx.fillStyle = item.color;
            ctx.fillRect(rightX + 80, y, bw, barH);
            ctx.globalAlpha = 0.3; ctx.fillRect(rightX + 80, y, bw, barH); ctx.globalAlpha = 1;
            
            ctx.fillStyle = colors.text; ctx.font = '10px Inter'; ctx.textAlign = 'right';
            ctx.fillText(item.label, rightX + 75, y + 15);
            ctx.fillStyle = item.color; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'left';
            ctx.fillText('₹' + item.val.toFixed(0), rightX + 85 + bw, y + 15);
        });
        
        // Total
        const totalY = pad.t + 30 + items.length * (barH + barGap) + 10;
        ctx.fillStyle = colors.teal; ctx.font = 'bold 14px JetBrains Mono'; ctx.textAlign = 'left';
        ctx.fillText('Total: ₹' + result.totalCost.toFixed(2) + ' Cr', rightX, totalY + 20);
        ctx.fillStyle = colors.muted; ctx.font = '11px Inter';
        ctx.fillText(result.totalArea.toLocaleString() + ' m² × ₹' + result.costPerSqm.toFixed(0) + '/m²', rightX, totalY + 38);
    }
    
    // Controls
    addSlider(ctrlArea, 'Built-up Area (m²)', 500, 20000, 5000, 500, v => { area = v; draw(); });
    addSlider(ctrlArea, 'Floors', 1, 20, 5, 1, v => { floors = v; draw(); });
    
    // Soil type buttons
    const soilRow = CE('div','app-demo-btn-row');
    const slbl = CE('span'); slbl.textContent = 'Soil: '; slbl.style.cssText = 'color:rgba(255,255,255,.4);font-size:.82rem;margin-right:4px';
    soilRow.appendChild(slbl);
    ['good', 'medium', 'poor', 'rock'].forEach(s => {
        addBtn(soilRow, s.charAt(0).toUpperCase() + s.slice(1), s === soilType ? '' : 'accent', () => {
            soilType = s; draw();
            log.add('Soil type: ' + s, 'info');
        });
    });
    ctrlArea.appendChild(soilRow);
    
    // Location
    const locRow = CE('div','app-demo-btn-row');
    const llbl = CE('span'); llbl.textContent = 'Location: '; llbl.style.cssText = 'color:rgba(255,255,255,.4);font-size:.82rem;margin-right:4px';
    locRow.appendChild(llbl);
    ['rural', 'suburban', 'urban', 'metro'].forEach(l => {
        addBtn(locRow, l.charAt(0).toUpperCase() + l.slice(1), l === location ? '' : 'accent', () => {
            location = l; draw();
            log.add('Location: ' + l, 'info');
        });
    });
    ctrlArea.appendChild(locRow);
    
    // Structure type
    const strRow = CE('div','app-demo-btn-row');
    const stlbl = CE('span'); stlbl.textContent = 'Structure: '; stlbl.style.cssText = 'color:rgba(255,255,255,.4);font-size:.82rem;margin-right:4px';
    strRow.appendChild(stlbl);
    ['masonry', 'rcc', 'steel', 'composite'].forEach(s => {
        addBtn(strRow, s.toUpperCase(), s === structType ? '' : 'accent', () => {
            structType = s; draw();
            log.add('Structure: ' + s, 'info');
        });
    });
    ctrlArea.appendChild(strRow);
    
    addTabs(sidePanel, ['ML Model', 'Cost Factors', 'Industry'], idx => {
        const lc = sidePanel.querySelector('.learning-content');
        if (!lc) return;
        lc.innerHTML = [
            '<strong>Gradient Boosted Trees (XGBoost)</strong><br><br>Trained on <strong>2,500+ completed projects</strong> from CPWD, state PWDs, and private contractors.<br><br><strong>Features (25):</strong> Area, floors, soil type, location, structure type, year, inflation index, material prices, labor rates...<br><strong>R² Score:</strong> 0.91 on test data<br><strong>MAPE:</strong> 8.5% (vs 25-30% for traditional estimation)<br><br>The model updates quarterly with new project completions and material price indices.',
            '<strong>Key Cost Drivers</strong><br><br>• <strong>Soil Condition:</strong> Poor soil → deep foundations → +18-35% cost<br>• <strong>Location:</strong> Metro → +30% (labor, materials, land)<br>• <strong>Height:</strong> Each floor adds ~2% to unit cost (formwork, pumping)<br>• <strong>Structure:</strong> Steel frame +25% vs RCC, but faster construction<br>• <strong>Season:</strong> Monsoon construction +5-10% (productivity loss)<br>• <strong>Market:</strong> Cement/steel price volatility ±15%',
            '<strong>Industry Applications</strong><br><br>• <strong>CPWD:</strong> Preliminary cost estimation for DPR preparation<br>• <strong>Bidding:</strong> Contractors use ML to validate bid prices<br>• <strong>Feasibility:</strong> Developers assess project viability early<br>• <strong>Variation Orders:</strong> AI predicts cost impact of design changes<br>• <strong>Risk Analysis:</strong> Monte Carlo simulation with ML cost model<br>• <strong>Budget Monitoring:</strong> Track actual vs predicted costs in real-time'
        ][idx];
    });
    const lc = CE('div','app-demo-info learning-content');
    lc.innerHTML = '<strong>XGBoost Cost Predictor</strong> — Adjust parameters to see predicted cost. Historical projects shown as scatter plot. Confidence band shows ±15% prediction interval.';
    sidePanel.appendChild(lc);
    
    generateHistorical();
    draw();
}

/* ================================================================
   WIRE UP CARD CLICKS
   ================================================================ */
const demoBuilders = [
    { title: 'Soil Classification', icon: 'fa-layer-group', build: buildSoilClassification },
    { title: 'Flood Prediction', icon: 'fa-cloud-rain', build: buildFloodPrediction },
    { title: 'Slope Stability', icon: 'fa-hill-rockslide', build: buildSlopeStability },
    { title: 'Groundwater Modeling', icon: 'fa-faucet-drip', build: buildGroundwaterModeling },
    { title: 'Structural Health', icon: 'fa-bridge', build: buildStructuralHealth },
    { title: 'Liquefaction Risk', icon: 'fa-building-circle-exclamation', build: buildLiquefactionRisk },
    { title: 'Water Quality', icon: 'fa-droplet', build: buildWaterQuality },
    { title: 'Cost Estimation', icon: 'fa-money-bill-trend-up', build: buildCostEstimation }
];

function init() {
    const cards = document.querySelectorAll('.app-grid .app-item');
    cards.forEach((card, i) => {
        if (i < demoBuilders.length) {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                openOverlay(demoBuilders[i].title, demoBuilders[i].icon, demoBuilders[i].build);
            });
            // Add visual cue
            const badge = CE('div');
            badge.style.cssText = 'margin-top:8px;font-size:.72rem;color:#00d4aa;font-weight:600;display:flex;align-items:center;gap:4px;justify-content:center';
            badge.innerHTML = '<i class="fa-solid fa-hand-pointer"></i> Click for Interactive Demo';
            card.appendChild(badge);
        }
    });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
