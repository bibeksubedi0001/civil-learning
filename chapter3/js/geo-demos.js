/**
 * Chapter 3 — Unsupervised Learning: Geotechnical & Water Resources Interactive Demos
 * Auto-injected into sub-chapters based on URL path.
 *
 * Demos:
 * 1. SoilClusteringKMeans — interactive k-means on soil properties (LL vs PI)
 * 2. DendrogramBuilder — hierarchical clustering tree for soil/material samples
 * 3. AnomalyDetector — piezometer time-series with anomaly flagging
 * 4. PCAExplorer — 2D projection of multi-parameter soil data
 * 5. DBSCANDemo — density-based clustering with epsilon/minPts controls
 * 6. SilhouetteEvaluator — evaluate cluster quality with silhouette visualization
 */

(function () {
    'use strict';

    const $ = s => document.querySelector(s);
    const ce = (tag, cls, html) => {
        const el = document.createElement(tag);
        if (cls) el.className = cls;
        if (html) el.innerHTML = html;
        return el;
    };
    const colors = {
        teal: '#00d4aa', cyan: '#0ea5e9', amber: '#f59e0b',
        purple: '#a855f7', red: '#ef4444', bg: '#0f1923',
        card: '#151f2b', border: '#1e2d3d', text: '#e2e8f0', muted: '#94a3b8'
    };
    const clusterPalette = ['#00d4aa', '#0ea5e9', '#f59e0b', '#a855f7', '#ef4444', '#22d3ee', '#f97316'];

    /* ── Shared demo wrapper ── */
    function createDemoSection(title, icon, subtitle) {
        const section = ce('section', 'ch-section geo-demo-section');
        section.innerHTML = `
            <div class="section-container" style="max-width:900px;margin:0 auto;padding:40px 24px;">
                <h2 style="display:flex;align-items:center;gap:12px;font-size:1.5rem;margin-bottom:8px;color:${colors.text}">
                    <i class="${icon}" style="color:${colors.teal}"></i> ${title}
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
        const inp = ce('input', '', '');
        inp.type = 'range'; inp.min = min; inp.max = max; inp.value = value; inp.step = step;
        inp.style.cssText = 'flex:1;min-width:120px;accent-color:' + colors.teal;
        const val = ce('span', '', '');
        val.style.cssText = `font-size:.85rem;color:${colors.cyan};min-width:50px;font-family:'JetBrains Mono',monospace`;
        val.textContent = value + (unit || '');
        inp.addEventListener('input', () => { val.textContent = inp.value + (unit || ''); onChange(+inp.value); });
        wrap.appendChild(lbl); wrap.appendChild(inp); wrap.appendChild(val);
        return wrap;
    }

    function makeBtn(text, icon, onClick) {
        const btn = ce('button', '', `<i class="${icon}"></i> ${text}`);
        btn.style.cssText = `display:inline-flex;align-items:center;gap:6px;padding:8px 18px;border-radius:8px;border:1px solid ${colors.border};background:${colors.bg};color:${colors.text};font-size:.85rem;cursor:pointer;transition:all .2s;font-family:inherit`;
        btn.addEventListener('mouseenter', () => { btn.style.borderColor = colors.teal; });
        btn.addEventListener('mouseleave', () => { btn.style.borderColor = colors.border; });
        btn.addEventListener('click', onClick);
        return btn;
    }

    function initCanvas(canvas, w, h) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = w * dpr; canvas.height = h * dpr;
        canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return ctx;
    }

    /* ══════════════════════════════════════════════
       DEMO 1: K-Means Soil Clustering
       ══════════════════════════════════════════════ */
    function createSoilClusteringDemo(container) {
        const { section, container: wrap } = createDemoSection(
            'Interactive Demo: K-Means Soil Clustering',
            'fa-solid fa-object-group',
            'Watch K-Means group soil samples by Liquid Limit (LL) and Plasticity Index (PI). Adjust k and hit "Run K-Means" to see centroids converge.'
        );

        const canvas = ce('canvas', '', '');
        canvas.style.cssText = 'width:100%;cursor:crosshair;border-radius:8px;display:block';
        const W = 700, H = 420;

        let soilData = [], centroids = [], assignments = [], k = 3, running = false;

        function generateSoilData() {
            soilData = [];
            // CL cluster: LL 30-50, PI 10-25
            for (let i = 0; i < 20; i++) soilData.push({ ll: 30 + Math.random() * 20, pi: 10 + Math.random() * 15, label: 'CL' });
            // CH cluster: LL 55-90, PI 25-50
            for (let i = 0; i < 15; i++) soilData.push({ ll: 55 + Math.random() * 35, pi: 25 + Math.random() * 25, label: 'CH' });
            // ML/MH cluster: LL 40-70, PI 2-10
            for (let i = 0; i < 15; i++) soilData.push({ ll: 40 + Math.random() * 30, pi: 2 + Math.random() * 8, label: 'ML/MH' });
            // SM cluster: LL 15-30, PI 2-8
            for (let i = 0; i < 12; i++) soilData.push({ ll: 15 + Math.random() * 15, pi: 2 + Math.random() * 6, label: 'SM' });
        }

        function initCentroids() {
            centroids = [];
            for (let i = 0; i < k; i++) {
                centroids.push({ ll: 20 + Math.random() * 60, pi: 5 + Math.random() * 35 });
            }
            assignments = new Array(soilData.length).fill(0);
        }

        function assign() {
            let changed = false;
            soilData.forEach((p, i) => {
                let minD = Infinity, minC = 0;
                centroids.forEach((c, j) => {
                    const d = (p.ll - c.ll) ** 2 + (p.pi - c.pi) ** 2;
                    if (d < minD) { minD = d; minC = j; }
                });
                if (assignments[i] !== minC) changed = true;
                assignments[i] = minC;
            });
            return changed;
        }

        function updateCentroids() {
            centroids.forEach((c, j) => {
                const members = soilData.filter((_, i) => assignments[i] === j);
                if (members.length) {
                    c.ll = members.reduce((s, m) => s + m.ll, 0) / members.length;
                    c.pi = members.reduce((s, m) => s + m.pi, 0) / members.length;
                }
            });
        }

        function draw() {
            const ctx = initCanvas(canvas, W, H);
            ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);
            // Grid
            ctx.strokeStyle = colors.border; ctx.lineWidth = 0.5;
            for (let x = 0; x <= 100; x += 10) {
                const px = 60 + (x / 100) * (W - 80);
                ctx.beginPath(); ctx.moveTo(px, 10); ctx.lineTo(px, H - 40); ctx.stroke();
                ctx.fillStyle = colors.muted; ctx.font = '11px Inter';
                ctx.textAlign = 'center'; ctx.fillText(x, px, H - 25);
            }
            for (let y = 0; y <= 55; y += 10) {
                const py = H - 40 - (y / 55) * (H - 60);
                ctx.beginPath(); ctx.moveTo(60, py); ctx.lineTo(W - 20, py); ctx.stroke();
                ctx.textAlign = 'right'; ctx.fillText(y, 55, py + 4);
            }
            ctx.fillStyle = colors.muted; ctx.font = '12px Inter';
            ctx.textAlign = 'center'; ctx.fillText('Liquid Limit (LL)', W / 2, H - 5);
            ctx.save(); ctx.translate(15, H / 2); ctx.rotate(-Math.PI / 2);
            ctx.fillText('Plasticity Index (PI)', 0, 0); ctx.restore();
            // A-line
            ctx.beginPath(); ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#ffffff30'; ctx.lineWidth = 1;
            const ax1 = 60 + (20 / 100) * (W - 80), ay1 = H - 40 - (0.73 * (20 - 20) / 55) * (H - 60);
            const ax2 = 60 + (100 / 100) * (W - 80), ay2 = H - 40 - (0.73 * (100 - 20) / 55) * (H - 60);
            ctx.moveTo(ax1, ay1); ctx.lineTo(ax2, Math.max(10, ay2)); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = '#ffffff40'; ctx.font = '10px Inter';
            ctx.fillText('A-line', ax2 - 30, Math.max(20, ay2) - 5);
            // Points
            soilData.forEach((p, i) => {
                const px = 60 + (p.ll / 100) * (W - 80);
                const py = H - 40 - (p.pi / 55) * (H - 60);
                ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2);
                ctx.fillStyle = clusterPalette[assignments[i] % clusterPalette.length] + '90';
                ctx.fill();
                ctx.strokeStyle = clusterPalette[assignments[i] % clusterPalette.length];
                ctx.lineWidth = 1.5; ctx.stroke();
            });
            // Centroids
            centroids.forEach((c, j) => {
                const px = 60 + (c.ll / 100) * (W - 80);
                const py = H - 40 - (c.pi / 55) * (H - 60);
                ctx.beginPath(); ctx.arc(px, py, 10, 0, Math.PI * 2);
                ctx.fillStyle = clusterPalette[j % clusterPalette.length];
                ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Inter'; ctx.textAlign = 'center';
                ctx.fillText('C' + (j + 1), px, py + 4);
            });
        }

        async function runKMeans() {
            if (running) return;
            running = true;
            initCentroids();
            for (let iter = 0; iter < 20; iter++) {
                const changed = assign();
                draw();
                await new Promise(r => setTimeout(r, 300));
                updateCentroids();
                draw();
                await new Promise(r => setTimeout(r, 200));
                if (!changed) break;
            }
            running = false;
            statusEl.textContent = `Converged with k=${k}. Clusters: ${centroids.map((c, i) => `C${i + 1}(LL=${c.ll.toFixed(0)}, PI=${c.pi.toFixed(0)})`).join(' | ')}`;
        }

        generateSoilData(); initCentroids(); assign();

        const controls = ce('div', '', '');
        controls.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;align-items:center';
        controls.appendChild(makeSlider('Clusters (k)', 2, 6, k, 1, '', v => { k = v; }));
        controls.appendChild(makeBtn('Run K-Means', 'fa-solid fa-play', runKMeans));
        controls.appendChild(makeBtn('New Data', 'fa-solid fa-rotate', () => { generateSoilData(); initCentroids(); assign(); draw(); }));

        const statusEl = ce('div', '', 'Click "Run K-Means" to start clustering soil samples');
        statusEl.style.cssText = `font-size:.82rem;color:${colors.muted};margin-top:12px;min-height:20px`;

        wrap.appendChild(controls); wrap.appendChild(canvas); wrap.appendChild(statusEl);
        container.appendChild(section);
        draw();
    }

    /* ══════════════════════════════════════════════
       DEMO 2: Dendrogram Builder
       ══════════════════════════════════════════════ */
    function createDendrogramDemo(container) {
        const { section, container: wrap } = createDemoSection(
            'Interactive Demo: Soil Sample Dendrogram',
            'fa-solid fa-project-diagram',
            'See how hierarchical clustering builds a tree of soil sample similarities. Samples are clustered by SPT-N value and moisture content. Drag the cut-line to change the number of clusters.'
        );

        const canvas = ce('canvas', '', '');
        canvas.style.cssText = 'width:100%;cursor:pointer;border-radius:8px;display:block';
        const W = 700, H = 400;

        const samples = [
            { name: 'BH-1', spt: 5, mc: 35 }, { name: 'BH-2', spt: 8, mc: 28 },
            { name: 'BH-3', spt: 22, mc: 12 }, { name: 'BH-4', spt: 25, mc: 15 },
            { name: 'BH-5', spt: 12, mc: 22 }, { name: 'BH-6', spt: 6, mc: 32 },
            { name: 'BH-7', spt: 30, mc: 8 }, { name: 'BH-8', spt: 15, mc: 20 },
            { name: 'BH-9', spt: 3, mc: 40 }, { name: 'BH-10', spt: 28, mc: 10 }
        ];

        // Pre-computed dendrogram merges (single linkage on normalized SPT + MC)
        const merges = [];
        let clusters = samples.map((s, i) => ({ id: i, members: [i], x: 0, y: 0 }));
        const dist = (a, b) => Math.sqrt(((samples[a].spt - samples[b].spt) / 30) ** 2 + ((samples[a].mc - samples[b].mc) / 40) ** 2);

        function buildDendrogram() {
            merges.length = 0;
            let active = samples.map((s, i) => ({ id: i, members: [i] }));
            let nextId = samples.length;
            while (active.length > 1) {
                let minD = Infinity, mi = -1, mj = -1;
                for (let i = 0; i < active.length; i++) {
                    for (let j = i + 1; j < active.length; j++) {
                        let d = Infinity;
                        for (const a of active[i].members) {
                            for (const b of active[j].members) {
                                d = Math.min(d, dist(a, b));
                            }
                        }
                        if (d < minD) { minD = d; mi = i; mj = j; }
                    }
                }
                merges.push({ left: active[mi].id, right: active[mj].id, dist: minD, id: nextId });
                active.push({ id: nextId, members: [...active[mi].members, ...active[mj].members] });
                active.splice(mj, 1); active.splice(mi, 1);
                nextId++;
            }
        }
        buildDendrogram();

        let cutHeight = 0.5;
        const maxDist = merges.length ? merges[merges.length - 1].dist : 1;

        function getLeafOrder(nodeId) {
            if (nodeId < samples.length) return [nodeId];
            const m = merges.find(m => m.id === nodeId);
            return [...getLeafOrder(m.left), ...getLeafOrder(m.right)];
        }

        function getNodeInfo(nodeId) {
            if (nodeId < samples.length) return { x: 0, height: 0 };
            const m = merges.find(m => m.id === nodeId);
            return { left: m.left, right: m.right, height: m.dist };
        }

        function draw() {
            const ctx = initCanvas(canvas, W, H);
            ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);

            const leafOrder = getLeafOrder(merges[merges.length - 1].id);
            const margin = { left: 60, right: 20, top: 30, bottom: 70 };
            const plotW = W - margin.left - margin.right;
            const plotH = H - margin.top - margin.bottom;

            const leafX = {};
            leafOrder.forEach((id, i) => {
                leafX[id] = margin.left + (i + 0.5) / leafOrder.length * plotW;
            });

            const nodeX = {};
            const nodeY = {};
            function computePos(nodeId) {
                if (nodeId < samples.length) {
                    nodeX[nodeId] = leafX[nodeId];
                    nodeY[nodeId] = margin.top + plotH;
                    return;
                }
                const m = merges.find(m => m.id === nodeId);
                computePos(m.left); computePos(m.right);
                nodeX[nodeId] = (nodeX[m.left] + nodeX[m.right]) / 2;
                nodeY[nodeId] = margin.top + plotH - (m.dist / maxDist) * plotH;
            }
            computePos(merges[merges.length - 1].id);

            // Get cluster colors at cut
            function getClusterAtCut(nodeId) {
                if (nodeId < samples.length) return nodeId;
                const m = merges.find(m => m.id === nodeId);
                if (m.dist > cutHeight * maxDist) return nodeId; // this is cut above
                return nodeId;
            }
            function assignColors(nodeId, colorIdx) {
                const result = {};
                if (nodeId < samples.length) { result[nodeId] = colorIdx; return result; }
                const m = merges.find(m => m.id === nodeId);
                if (m.dist > cutHeight * maxDist) {
                    const lr = assignColors(m.left, colorIdx);
                    const rr = assignColors(m.right, colorIdx + Object.keys(lr).length);
                    return { ...lr, ...rr };
                }
                const lr = assignColors(m.left, colorIdx);
                const rr = assignColors(m.right, colorIdx);
                return { ...lr, ...rr };
            }
            const colorMap = assignColors(merges[merges.length - 1].id, 0);

            // Draw links
            function drawLinks(nodeId) {
                if (nodeId < samples.length) return;
                const m = merges.find(m => m.id === nodeId);
                ctx.strokeStyle = m.dist > cutHeight * maxDist ? '#ffffff50' : clusterPalette[colorMap[merges.find(mm => mm.id === nodeId)?.left] ?? 0] + '80';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(nodeX[m.left], nodeY[m.left]); ctx.lineTo(nodeX[m.left], nodeY[nodeId]);
                ctx.lineTo(nodeX[m.right], nodeY[nodeId]); ctx.lineTo(nodeX[m.right], nodeY[m.right]);
                ctx.stroke();
                drawLinks(m.left); drawLinks(m.right);
            }
            drawLinks(merges[merges.length - 1].id);

            // Cut line
            const cutY = margin.top + plotH - cutHeight * plotH;
            ctx.setLineDash([6, 4]); ctx.strokeStyle = colors.red + '80'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(margin.left, cutY); ctx.lineTo(W - margin.right, cutY); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = colors.red; ctx.font = '11px Inter'; ctx.textAlign = 'left';
            ctx.fillText(`Cut: ${(cutHeight * maxDist).toFixed(2)}`, W - margin.right - 80, cutY - 6);

            // Leaf labels
            leafOrder.forEach(id => {
                ctx.save();
                ctx.translate(leafX[id], H - margin.bottom + 10);
                ctx.rotate(-Math.PI / 4);
                ctx.fillStyle = clusterPalette[(colorMap[id] || 0) % clusterPalette.length];
                ctx.font = '11px JetBrains Mono'; ctx.textAlign = 'right';
                ctx.fillText(samples[id].name, 0, 0);
                ctx.restore();
                // Dot
                ctx.beginPath(); ctx.arc(leafX[id], margin.top + plotH, 4, 0, Math.PI * 2);
                ctx.fillStyle = clusterPalette[(colorMap[id] || 0) % clusterPalette.length]; ctx.fill();
            });

            // Y axis
            ctx.fillStyle = colors.muted; ctx.font = '11px Inter'; ctx.textAlign = 'right';
            for (let d = 0; d <= 1; d += 0.2) {
                const y = margin.top + plotH - d * plotH;
                ctx.fillText((d * maxDist).toFixed(1), margin.left - 8, y + 4);
            }
            ctx.save(); ctx.translate(12, H / 2); ctx.rotate(-Math.PI / 2);
            ctx.textAlign = 'center'; ctx.fillText('Distance', 0, 0); ctx.restore();

            const nClusters = new Set(Object.values(colorMap)).size;
            statusEl.textContent = `${nClusters} clusters at cut height ${(cutHeight * maxDist).toFixed(2)}`;
        }

        canvas.addEventListener('click', e => {
            const rect = canvas.getBoundingClientRect();
            const scaleY = H / rect.height;
            const y = (e.clientY - rect.top) * scaleY;
            const margin = { top: 30, bottom: 70 };
            const plotH = H - margin.top - margin.bottom;
            cutHeight = Math.max(0.05, Math.min(0.95, 1 - (y - margin.top) / plotH));
            draw();
        });

        const statusEl = ce('div', '', 'Click on the chart to move the cut line and change cluster count');
        statusEl.style.cssText = `font-size:.82rem;color:${colors.muted};margin-top:12px`;

        wrap.appendChild(canvas); wrap.appendChild(statusEl);
        container.appendChild(section);
        draw();
    }

    /* ══════════════════════════════════════════════
       DEMO 3: Anomaly Detector (Piezometer)
       ══════════════════════════════════════════════ */
    function createAnomalyDetectorDemo(container) {
        const { section, container: wrap } = createDemoSection(
            'Interactive Demo: Dam Piezometer Anomaly Detection',
            'fa-solid fa-triangle-exclamation',
            'Simulated piezometer readings from a dam. Adjust the anomaly threshold to flag abnormal pore pressure spikes that may indicate seepage or instrument failure.'
        );

        const canvas = ce('canvas', '', '');
        canvas.style.cssText = 'width:100%;border-radius:8px;display:block';
        const W = 700, H = 350;

        let threshold = 2.0; // sigma
        const nPoints = 120;
        let data = [];

        function generateData() {
            data = [];
            const baseLine = 85; // kPa base pore pressure
            for (let i = 0; i < nPoints; i++) {
                let val = baseLine + 10 * Math.sin(i / 15) + (Math.random() - 0.5) * 8;
                // Inject anomalies
                if (i === 25) val += 35;
                if (i === 58) val += 28;
                if (i === 87) val -= 30;
                if (i === 102) val += 40;
                data.push({ day: i + 1, pressure: val });
            }
        }

        function draw() {
            const ctx = initCanvas(canvas, W, H);
            ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);

            const margin = { left: 55, right: 20, top: 20, bottom: 40 };
            const pW = W - margin.left - margin.right;
            const pH = H - margin.top - margin.bottom;

            const vals = data.map(d => d.pressure);
            const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
            const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
            const minV = Math.min(...vals) - 10, maxV = Math.max(...vals) + 10;

            const x = i => margin.left + (i / (nPoints - 1)) * pW;
            const y = v => margin.top + pH - ((v - minV) / (maxV - minV)) * pH;

            // Mean line
            ctx.setLineDash([4, 4]); ctx.strokeStyle = colors.cyan + '50'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(margin.left, y(mean)); ctx.lineTo(W - margin.right, y(mean)); ctx.stroke();
            ctx.setLineDash([]);

            // Threshold band
            ctx.fillStyle = colors.teal + '08';
            const bandTop = y(mean + threshold * std), bandBot = y(mean - threshold * std);
            ctx.fillRect(margin.left, bandTop, pW, bandBot - bandTop);
            ctx.setLineDash([3, 3]); ctx.strokeStyle = colors.teal + '40'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(margin.left, bandTop); ctx.lineTo(W - margin.right, bandTop); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(margin.left, bandBot); ctx.lineTo(W - margin.right, bandBot); ctx.stroke();
            ctx.setLineDash([]);

            // Data line
            ctx.beginPath(); ctx.strokeStyle = colors.cyan; ctx.lineWidth = 1.5;
            data.forEach((d, i) => { i === 0 ? ctx.moveTo(x(i), y(d.pressure)) : ctx.lineTo(x(i), y(d.pressure)); });
            ctx.stroke();

            // Anomaly dots
            let anomalyCount = 0;
            data.forEach((d, i) => {
                const isAnomaly = Math.abs(d.pressure - mean) > threshold * std;
                if (isAnomaly) {
                    anomalyCount++;
                    ctx.beginPath(); ctx.arc(x(i), y(d.pressure), 6, 0, Math.PI * 2);
                    ctx.fillStyle = colors.red + 'cc'; ctx.fill();
                    ctx.strokeStyle = colors.red; ctx.lineWidth = 2; ctx.stroke();
                    ctx.fillStyle = colors.red; ctx.font = 'bold 9px Inter'; ctx.textAlign = 'center';
                    ctx.fillText('!', x(i), y(d.pressure) - 10);
                }
            });

            // Axes
            ctx.fillStyle = colors.muted; ctx.font = '11px Inter';
            ctx.textAlign = 'center'; ctx.fillText('Day', W / 2, H - 5);
            ctx.save(); ctx.translate(12, H / 2); ctx.rotate(-Math.PI / 2);
            ctx.fillText('Pore Pressure (kPa)', 0, 0); ctx.restore();

            // Tick labels
            for (let d = 0; d <= nPoints; d += 20) {
                ctx.textAlign = 'center'; ctx.fillText(d, x(d), H - margin.bottom + 15);
            }
            ctx.textAlign = 'right';
            for (let v = Math.ceil(minV / 10) * 10; v <= maxV; v += 10) {
                ctx.fillText(v.toFixed(0), margin.left - 6, y(v) + 4);
            }

            statusEl.innerHTML = `<span style="color:${colors.red}"><strong>${anomalyCount}</strong> anomalies detected</span> | Threshold: μ ± ${threshold.toFixed(1)}σ | Mean: ${mean.toFixed(1)} kPa | σ: ${std.toFixed(1)} kPa`;
        }

        generateData();

        const controls = ce('div', '', '');
        controls.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;align-items:center';
        controls.appendChild(makeSlider('Threshold (σ)', 1.0, 3.5, threshold, 0.1, 'σ', v => { threshold = v; draw(); }));
        controls.appendChild(makeBtn('New Data', 'fa-solid fa-rotate', () => { generateData(); draw(); }));

        const statusEl = ce('div', '', '');
        statusEl.style.cssText = `font-size:.82rem;color:${colors.muted};margin-top:12px`;

        wrap.appendChild(controls); wrap.appendChild(canvas); wrap.appendChild(statusEl);
        container.appendChild(section);
        draw();
    }

    /* ══════════════════════════════════════════════
       DEMO 4: PCA Explorer
       ══════════════════════════════════════════════ */
    function createPCAExplorerDemo(container) {
        const { section, container: wrap } = createDemoSection(
            'Interactive Demo: PCA on Soil Test Data',
            'fa-solid fa-compress',
            'Borehole data has 5 properties (SPT-N, LL, PI, moisture content, density). PCA projects them onto 2 principal components. Toggle features to see how the projection changes.'
        );

        const canvas = ce('canvas', '', '');
        canvas.style.cssText = 'width:100%;border-radius:8px;display:block';
        const W = 700, H = 420;

        // Generate synthetic soil data (5 features, 3 clusters)
        const features = ['SPT-N', 'LL', 'PI', 'MC (%)', 'ρ (g/cm³)'];
        let rawData = [];
        let activeFeatures = [true, true, true, true, true];

        function generateData() {
            rawData = [];
            // Clay: low SPT, high LL, high PI, high MC, low density
            for (let i = 0; i < 15; i++) rawData.push([3 + Math.random() * 8, 45 + Math.random() * 30, 20 + Math.random() * 20, 30 + Math.random() * 15, 1.5 + Math.random() * 0.2, 'Clay']);
            // Sand: high SPT, low LL, low PI, low MC, high density
            for (let i = 0; i < 15; i++) rawData.push([20 + Math.random() * 15, 15 + Math.random() * 10, 1 + Math.random() * 5, 8 + Math.random() * 10, 1.7 + Math.random() * 0.2, 'Sand']);
            // Silt: mid SPT, mid LL, low-mid PI, mid MC, mid density
            for (let i = 0; i < 12; i++) rawData.push([10 + Math.random() * 10, 28 + Math.random() * 15, 4 + Math.random() * 10, 18 + Math.random() * 12, 1.55 + Math.random() * 0.2, 'Silt']);
        }

        function simplePCA(data) {
            const n = data.length, m = data[0].length;
            // Standardize
            const means = Array(m).fill(0), stds = Array(m).fill(0);
            data.forEach(r => r.forEach((v, j) => means[j] += v));
            means.forEach((_, j) => means[j] /= n);
            data.forEach(r => r.forEach((v, j) => stds[j] += (v - means[j]) ** 2));
            stds.forEach((_, j) => stds[j] = Math.sqrt(stds[j] / n) || 1);
            const std = data.map(r => r.map((v, j) => (v - means[j]) / stds[j]));

            // Covariance
            const cov = Array.from({ length: m }, () => Array(m).fill(0));
            for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) {
                for (let k = 0; k < n; k++) cov[i][j] += std[k][i] * std[k][j];
                cov[i][j] /= n;
            }

            // Power iteration for top 2 eigenvectors (simplified)
            function powerIter(mat, deflate) {
                let v = Array(m).fill(0).map(() => Math.random());
                for (let iter = 0; iter < 50; iter++) {
                    let nv = Array(m).fill(0);
                    for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) nv[i] += mat[i][j] * v[j];
                    const norm = Math.sqrt(nv.reduce((s, x) => s + x * x, 0));
                    v = nv.map(x => x / norm);
                }
                const eigenval = v.reduce((s, _, i) => {
                    let mv = 0;
                    for (let j = 0; j < m; j++) mv += mat[i][j] * v[j];
                    return s + mv * v[i];
                }, 0);
                if (deflate) {
                    for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) mat[i][j] -= eigenval * v[i] * v[j];
                }
                return { vec: v, val: eigenval };
            }

            const covCopy = cov.map(r => [...r]);
            const pc1 = powerIter(covCopy, true);
            const pc2 = powerIter(covCopy, false);

            // Project
            const projected = std.map(row => ({
                x: row.reduce((s, v, j) => s + v * pc1.vec[j], 0),
                y: row.reduce((s, v, j) => s + v * pc2.vec[j], 0)
            }));

            const totalVar = pc1.val + pc2.val + (m - 2) * 0.5; // approximate
            return { projected, var1: pc1.val, var2: pc2.val, totalVar: cov.reduce((s, r, i) => s + r[i], 0) };
        }

        function draw() {
            const ctx = initCanvas(canvas, W, H);
            ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);

            const activeIdx = features.map((_, i) => i).filter(i => activeFeatures[i]);
            if (activeIdx.length < 2) {
                ctx.fillStyle = colors.muted; ctx.font = '16px Inter'; ctx.textAlign = 'center';
                ctx.fillText('Select at least 2 features for PCA', W / 2, H / 2);
                return;
            }

            const subset = rawData.map(r => activeIdx.map(i => r[i]));
            const labels = rawData.map(r => r[5]);
            const { projected, var1, var2, totalVar } = simplePCA(subset);

            const margin = { left: 60, right: 30, top: 30, bottom: 50 };
            const pW = W - margin.left - margin.right;
            const pH = H - margin.top - margin.bottom;

            const xs = projected.map(p => p.x), ys = projected.map(p => p.y);
            const xMin = Math.min(...xs) - 0.5, xMax = Math.max(...xs) + 0.5;
            const yMin = Math.min(...ys) - 0.5, yMax = Math.max(...ys) + 0.5;

            const px = v => margin.left + ((v - xMin) / (xMax - xMin)) * pW;
            const py = v => margin.top + pH - ((v - yMin) / (yMax - yMin)) * pH;

            // Grid
            ctx.strokeStyle = colors.border; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(margin.left, margin.top); ctx.lineTo(margin.left, margin.top + pH);
            ctx.lineTo(margin.left + pW, margin.top + pH); ctx.stroke();

            // Points
            const colorMap = { Clay: colors.amber, Sand: colors.cyan, Silt: colors.teal };
            projected.forEach((p, i) => {
                const cx = px(p.x), cy = py(p.y);
                ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2);
                ctx.fillStyle = (colorMap[labels[i]] || colors.muted) + 'bb';
                ctx.fill();
                ctx.strokeStyle = colorMap[labels[i]] || colors.muted;
                ctx.lineWidth = 1.5; ctx.stroke();
            });

            // Legend
            let ly = margin.top + 10;
            Object.entries(colorMap).forEach(([label, color]) => {
                ctx.beginPath(); ctx.arc(W - margin.right - 60, ly, 5, 0, Math.PI * 2);
                ctx.fillStyle = color; ctx.fill();
                ctx.fillStyle = colors.text; ctx.font = '11px Inter'; ctx.textAlign = 'left';
                ctx.fillText(label, W - margin.right - 50, ly + 4);
                ly += 20;
            });

            // Axes
            ctx.fillStyle = colors.muted; ctx.font = '12px Inter'; ctx.textAlign = 'center';
            const v1pct = totalVar > 0 ? (var1 / totalVar * 100).toFixed(0) : '?';
            const v2pct = totalVar > 0 ? (var2 / totalVar * 100).toFixed(0) : '?';
            ctx.fillText(`PC1 (${v1pct}% variance)`, W / 2, H - 8);
            ctx.save(); ctx.translate(15, H / 2); ctx.rotate(-Math.PI / 2);
            ctx.fillText(`PC2 (${v2pct}% variance)`, 0, 0); ctx.restore();
        }

        generateData();

        // Feature toggles
        const toggleWrap = ce('div', '', '');
        toggleWrap.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px';
        features.forEach((f, i) => {
            const btn = ce('button', '', f);
            btn.style.cssText = `padding:6px 14px;border-radius:8px;border:1px solid ${colors.teal};background:${colors.teal}22;color:${colors.teal};font-size:.82rem;cursor:pointer;transition:all .2s;font-family:inherit`;
            btn.addEventListener('click', () => {
                activeFeatures[i] = !activeFeatures[i];
                btn.style.background = activeFeatures[i] ? colors.teal + '22' : 'transparent';
                btn.style.color = activeFeatures[i] ? colors.teal : colors.muted;
                btn.style.borderColor = activeFeatures[i] ? colors.teal : colors.border;
                draw();
            });
            toggleWrap.appendChild(btn);
        });

        const controls = ce('div', '', '');
        controls.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap;margin-bottom:8px;align-items:center';
        controls.appendChild(makeBtn('New Samples', 'fa-solid fa-rotate', () => { generateData(); draw(); }));

        wrap.appendChild(toggleWrap); wrap.appendChild(controls); wrap.appendChild(canvas);
        container.appendChild(section);
        draw();
    }

    /* ══════════════════════════════════════════════
       DEMO 5: DBSCAN Demo
       ══════════════════════════════════════════════ */
    function createDBSCANDemo(container) {
        const { section, container: wrap } = createDemoSection(
            'Interactive Demo: DBSCAN Contamination Hotspots',
            'fa-solid fa-border-all',
            'DBSCAN finds density-based clusters without specifying k. Adjust epsilon (search radius) and minPts to detect contamination hotspots in groundwater samples. Noise points (grey) are isolated outliers.'
        );

        const canvas = ce('canvas', '', '');
        canvas.style.cssText = 'width:100%;cursor:crosshair;border-radius:8px;display:block';
        const W = 700, H = 420;

        let epsilon = 40, minPts = 3;
        let points = [];

        function generatePoints() {
            points = [];
            // Hotspot 1: nitrate plume
            for (let i = 0; i < 18; i++) points.push({ x: 150 + (Math.random() - 0.5) * 80, y: 150 + (Math.random() - 0.5) * 60, type: 'nitrate' });
            // Hotspot 2: heavy metals
            for (let i = 0; i < 14; i++) points.push({ x: 450 + (Math.random() - 0.5) * 70, y: 280 + (Math.random() - 0.5) * 50, type: 'metals' });
            // Hotspot 3: organic contaminants
            for (let i = 0; i < 10; i++) points.push({ x: 550 + (Math.random() - 0.5) * 50, y: 100 + (Math.random() - 0.5) * 40, type: 'organic' });
            // Noise
            for (let i = 0; i < 12; i++) points.push({ x: 40 + Math.random() * (W - 80), y: 40 + Math.random() * (H - 80), type: 'noise' });
        }

        function runDBSCAN() {
            const labels = new Array(points.length).fill(-1); // -1 = unvisited
            let clusterId = 0;

            function regionQuery(idx) {
                const neighbors = [];
                points.forEach((p, i) => {
                    const d = Math.sqrt((points[idx].x - p.x) ** 2 + (points[idx].y - p.y) ** 2);
                    if (d <= epsilon) neighbors.push(i);
                });
                return neighbors;
            }

            for (let i = 0; i < points.length; i++) {
                if (labels[i] !== -1) continue;
                const neighbors = regionQuery(i);
                if (neighbors.length < minPts) {
                    labels[i] = 0; // noise
                    continue;
                }
                clusterId++;
                labels[i] = clusterId;
                const queue = [...neighbors];
                const visited = new Set([i]);
                while (queue.length) {
                    const q = queue.shift();
                    if (visited.has(q)) continue;
                    visited.add(q);
                    if (labels[q] === 0) labels[q] = clusterId; // was noise, now border
                    if (labels[q] !== -1 && labels[q] !== 0) continue;
                    labels[q] = clusterId;
                    const qNeighbors = regionQuery(q);
                    if (qNeighbors.length >= minPts) {
                        qNeighbors.forEach(n => { if (!visited.has(n)) queue.push(n); });
                    }
                }
            }
            return labels;
        }

        function draw() {
            const ctx = initCanvas(canvas, W, H);
            ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);

            const labels = runDBSCAN();
            const nClusters = Math.max(...labels);

            // Draw epsilon circles for each point (subtle)
            points.forEach((p, i) => {
                if (labels[i] > 0) {
                    ctx.beginPath(); ctx.arc(p.x, p.y, epsilon, 0, Math.PI * 2);
                    ctx.fillStyle = clusterPalette[(labels[i] - 1) % clusterPalette.length] + '06';
                    ctx.fill();
                }
            });

            // Draw points
            points.forEach((p, i) => {
                ctx.beginPath(); ctx.arc(p.x, p.y, labels[i] === 0 ? 3 : 5, 0, Math.PI * 2);
                if (labels[i] === 0) {
                    ctx.fillStyle = '#666'; ctx.fill();
                    ctx.strokeStyle = '#888'; ctx.lineWidth = 1; ctx.stroke();
                } else {
                    const color = clusterPalette[(labels[i] - 1) % clusterPalette.length];
                    ctx.fillStyle = color + 'bb'; ctx.fill();
                    ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.stroke();
                }
            });

            // Labels
            ctx.fillStyle = colors.muted; ctx.font = '11px Inter'; ctx.textAlign = 'left';
            ctx.fillText('Groundwater sampling wells', 10, 15);
            ctx.fillText(`ε = ${epsilon}px, minPts = ${minPts}`, 10, 30);

            const noiseCount = labels.filter(l => l === 0).length;
            statusEl.innerHTML = `<span style="color:${colors.teal}"><strong>${nClusters}</strong> contamination hotspot${nClusters !== 1 ? 's' : ''} detected</span> | <span style="color:${colors.muted}">${noiseCount} isolated wells (noise)</span>`;
        }

        generatePoints();

        const controls = ce('div', '', '');
        controls.style.cssText = 'margin-bottom:16px';
        controls.appendChild(makeSlider('Epsilon (search radius)', 15, 80, epsilon, 5, 'px', v => { epsilon = v; draw(); }));
        controls.appendChild(makeSlider('Min Points', 2, 8, minPts, 1, '', v => { minPts = v; draw(); }));

        const btnRow = ce('div', '', '');
        btnRow.style.cssText = 'display:flex;gap:12px;margin-bottom:16px';
        btnRow.appendChild(makeBtn('New Samples', 'fa-solid fa-rotate', () => { generatePoints(); draw(); }));

        const statusEl = ce('div', '', '');
        statusEl.style.cssText = `font-size:.82rem;color:${colors.muted};margin-top:12px`;

        wrap.appendChild(controls); wrap.appendChild(btnRow); wrap.appendChild(canvas); wrap.appendChild(statusEl);
        container.appendChild(section);
        draw();
    }

    /* ══════════════════════════════════════════════
       DEMO 6: Silhouette Evaluator
       ══════════════════════════════════════════════ */
    function createSilhouetteDemo(container) {
        const { section, container: wrap } = createDemoSection(
            'Interactive Demo: Cluster Quality — Silhouette Score',
            'fa-solid fa-scale-balanced',
            'How good are your clusters? The silhouette score measures cohesion vs separation. Values near +1 = well-clustered, near 0 = overlapping, negative = wrong cluster. Try different k values.'
        );

        const canvas = ce('canvas', '', '');
        canvas.style.cssText = 'width:100%;border-radius:8px;display:block';
        const W = 700, H = 420;

        let k = 3;
        let dataPoints = [];

        function generateData() {
            dataPoints = [];
            // 3 distinct groups
            const centers = [[120, 120], [400, 300], [600, 130]];
            const spreads = [50, 45, 40];
            centers.forEach((c, ci) => {
                const n = 12 + Math.floor(Math.random() * 8);
                for (let i = 0; i < n; i++) {
                    dataPoints.push({
                        x: c[0] + (Math.random() - 0.5) * spreads[ci] * 2,
                        y: c[1] + (Math.random() - 0.5) * spreads[ci] * 2,
                        trueCluster: ci
                    });
                }
            });
        }

        function kMeansAssign(pts, k) {
            let centroids = [];
            for (let i = 0; i < k; i++) {
                centroids.push({ x: pts[Math.floor(Math.random() * pts.length)].x, y: pts[Math.floor(Math.random() * pts.length)].y });
            }
            let assignments = new Array(pts.length).fill(0);
            for (let iter = 0; iter < 30; iter++) {
                pts.forEach((p, i) => {
                    let minD = Infinity;
                    centroids.forEach((c, j) => {
                        const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
                        if (d < minD) { minD = d; assignments[i] = j; }
                    });
                });
                centroids.forEach((c, j) => {
                    const members = pts.filter((_, i) => assignments[i] === j);
                    if (members.length) {
                        c.x = members.reduce((s, m) => s + m.x, 0) / members.length;
                        c.y = members.reduce((s, m) => s + m.y, 0) / members.length;
                    }
                });
            }
            return { assignments, centroids };
        }

        function computeSilhouettes(pts, assignments, k) {
            const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
            return pts.map((p, i) => {
                const ci = assignments[i];
                const sameCluster = pts.filter((_, j) => assignments[j] === ci && j !== i);
                if (sameCluster.length === 0) return 0;
                const a = sameCluster.reduce((s, q) => s + dist(p, q), 0) / sameCluster.length;
                let minB = Infinity;
                for (let c = 0; c < k; c++) {
                    if (c === ci) continue;
                    const others = pts.filter((_, j) => assignments[j] === c);
                    if (others.length === 0) continue;
                    const b = others.reduce((s, q) => s + dist(p, q), 0) / others.length;
                    minB = Math.min(minB, b);
                }
                return (minB - a) / Math.max(a, minB);
            });
        }

        function draw() {
            const ctx = initCanvas(canvas, W, H);
            ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);

            const { assignments, centroids } = kMeansAssign(dataPoints, k);
            const silhouettes = computeSilhouettes(dataPoints, assignments, k);
            const avgSil = silhouettes.reduce((s, v) => s + v, 0) / silhouettes.length;

            // Left half: scatter plot
            const halfW = W * 0.5;
            ctx.strokeStyle = colors.border; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(halfW, 10); ctx.lineTo(halfW, H - 10); ctx.stroke();

            // Scale scatter to left half
            const scaleX = v => 20 + (v / 700) * (halfW - 40);
            const scaleY = v => 20 + (v / 420) * (H - 40);

            dataPoints.forEach((p, i) => {
                ctx.beginPath(); ctx.arc(scaleX(p.x), scaleY(p.y), 5, 0, Math.PI * 2);
                ctx.fillStyle = clusterPalette[assignments[i] % clusterPalette.length] + 'aa';
                ctx.fill();
            });
            centroids.forEach((c, j) => {
                ctx.beginPath(); ctx.arc(scaleX(c.x), scaleY(c.y), 8, 0, Math.PI * 2);
                ctx.fillStyle = clusterPalette[j % clusterPalette.length]; ctx.fill();
                ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
            });

            ctx.fillStyle = colors.muted; ctx.font = '11px Inter'; ctx.textAlign = 'center';
            ctx.fillText('Scatter Plot', halfW / 2, H - 5);

            // Right half: silhouette bars
            const barX = halfW + 30;
            const barW = W - halfW - 60;

            // Sort by cluster then by silhouette value
            const indices = Array.from({ length: dataPoints.length }, (_, i) => i);
            indices.sort((a, b) => assignments[a] !== assignments[b] ? assignments[a] - assignments[b] : silhouettes[b] - silhouettes[a]);

            const barH = Math.max(2, (H - 60) / indices.length - 1);
            let y = 20;
            indices.forEach(i => {
                const sil = silhouettes[i];
                const bw = Math.abs(sil) / 1 * (barW * 0.45);
                const bx = sil >= 0 ? barX + barW * 0.45 : barX + barW * 0.45 - bw;
                ctx.fillStyle = sil >= 0 ? clusterPalette[assignments[i] % clusterPalette.length] + '99' : colors.red + '99';
                ctx.fillRect(bx, y, bw, barH);
                y += barH + 1;
            });

            // Zero line
            ctx.strokeStyle = '#fff4'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(barX + barW * 0.45, 20); ctx.lineTo(barX + barW * 0.45, H - 30); ctx.stroke();

            ctx.fillStyle = colors.muted; ctx.font = '10px Inter'; ctx.textAlign = 'center';
            ctx.fillText('-1', barX, H - 15);
            ctx.fillText('0', barX + barW * 0.45, H - 15);
            ctx.fillText('+1', barX + barW * 0.9, H - 15);
            ctx.fillText('Silhouette Coefficient', barX + barW / 2, H - 3);

            // Score
            const scoreColor = avgSil > 0.5 ? colors.teal : avgSil > 0.25 ? colors.amber : colors.red;
            statusEl.innerHTML = `Average Silhouette Score: <strong style="color:${scoreColor};font-size:1.1rem">${avgSil.toFixed(3)}</strong> | k = ${k} | ${avgSil > 0.5 ? ' Good separation' : avgSil > 0.25 ? ' Moderate overlap' : ' Poor clustering'}`;
        }

        generateData();

        const controls = ce('div', '', '');
        controls.style.cssText = 'margin-bottom:16px';
        controls.appendChild(makeSlider('Number of Clusters (k)', 2, 7, k, 1, '', v => { k = v; draw(); }));

        const btnRow = ce('div', '', '');
        btnRow.style.cssText = 'display:flex;gap:12px;margin-bottom:16px';
        btnRow.appendChild(makeBtn('New Data', 'fa-solid fa-rotate', () => { generateData(); draw(); }));
        btnRow.appendChild(makeBtn('Re-run K-Means', 'fa-solid fa-play', () => draw()));

        const statusEl = ce('div', '', '');
        statusEl.style.cssText = `font-size:.85rem;color:${colors.muted};margin-top:12px`;

        wrap.appendChild(controls); wrap.appendChild(btnRow); wrap.appendChild(canvas); wrap.appendChild(statusEl);
        container.appendChild(section);
        draw();
    }

    /* ──────────────────────────────────────────────
       7) PARTICLE SIZE DISTRIBUTION CLUSTERER
       Cluster soil samples by gradation curves
       ────────────────────────────────────────────── */
    function createGradationClusterDemo(insertPoint) {
        const { section, container } = createDemoSection(
            'Gradation Curve Clustering — Soil Classification',
            'fa-solid fa-chart-area',
            'K-Means clusters soil samples based on D10, D30, D60 grain sizes. Each dot is a soil sample — watch the algorithm group similar gradations together. This helps engineers quickly identify soil zones on a site.'
        );
        const canvas = ce('canvas');
        canvas.style.cssText = `width:100%;border-radius:8px;border:1px solid ${colors.border}`;
        const w = Math.min(container.getBoundingClientRect().width - 48, 800);
        const h = 340;
        const { ctx, W, H } = initCanvas(canvas, w, h);
        let pts = [], clusters = [], k = 3;
        const controls = ce('div'); controls.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;margin-bottom:12px';
        controls.appendChild(makeSlider('Clusters (k)', 2, 6, 3, 1, '', v => { k = v; kmeans(); draw(); }));
        const btnRow = ce('div'); btnRow.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap';
        btnRow.appendChild(makeBtn('New Samples', 'fa-solid fa-rotate', () => { generatePoints(); draw(); }));
        btnRow.appendChild(makeBtn('Run K-Means', 'fa-solid fa-play', () => { kmeans(); draw(); }));
        function generatePoints() {
            pts = [];
            const zones = [[0.1, 0.5, 2], [0.01, 0.08, 0.4], [0.005, 0.02, 0.1], [0.5, 2, 10]];
            zones.forEach(z => {
                for (let i = 0; i < 12 + Math.floor(Math.random() * 8); i++) {
                    pts.push({
                        d10: z[0] * (0.7 + Math.random() * 0.6),
                        d60: z[2] * (0.7 + Math.random() * 0.6),
                        cluster: -1
                    });
                }
            });
            clusters = [];
        }
        function kmeans() {
            if (pts.length === 0) return;
            let centroids = pts.slice(0, k).map(p => ({ d10: p.d10, d60: p.d60 }));
            for (let iter = 0; iter < 20; iter++) {
                pts.forEach(p => {
                    let best = 0, bestD = Infinity;
                    centroids.forEach((c, i) => {
                        const d = (Math.log(p.d10) - Math.log(c.d10)) ** 2 + (Math.log(p.d60) - Math.log(c.d60)) ** 2;
                        if (d < bestD) { bestD = d; best = i; }
                    });
                    p.cluster = best;
                });
                centroids = centroids.map((_, i) => {
                    const members = pts.filter(p => p.cluster === i);
                    if (members.length === 0) return centroids[i];
                    return {
                        d10: members.reduce((s, p) => s + p.d10, 0) / members.length,
                        d60: members.reduce((s, p) => s + p.d60, 0) / members.length
                    };
                });
            }
            clusters = centroids;
        }
        function draw() {
            ctx.clearRect(0, 0, W, H);
            const pad = { l: 55, r: 20, t: 20, b: 40 };
            const gw = W - pad.l - pad.r, gh = H - pad.t - pad.b;
            // Log scale axes
            ctx.strokeStyle = colors.border; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
            ctx.fillStyle = colors.muted; ctx.font = '11px Inter';
            ctx.fillText('D10 (mm) — log scale', W / 2 - 50, H - 5);
            ctx.save(); ctx.translate(12, H / 2 + 30); ctx.rotate(-Math.PI / 2); ctx.fillText('D60 (mm) — log scale', 0, 0); ctx.restore();
            const logScale = (v, min, max) => (Math.log10(v) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
            const minD10 = 0.003, maxD10 = 2, minD60 = 0.05, maxD60 = 20;
            // Points
            pts.forEach(p => {
                const x = pad.l + logScale(p.d10, minD10, maxD10) * gw;
                const y = H - pad.b - logScale(p.d60, minD60, maxD60) * gh;
                ctx.fillStyle = p.cluster >= 0 ? clusterPalette[p.cluster % clusterPalette.length] + 'cc' : colors.muted;
                ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
            });
            // Centroids
            clusters.forEach((c, i) => {
                const x = pad.l + logScale(c.d10, minD10, maxD10) * gw;
                const y = H - pad.b - logScale(c.d60, minD60, maxD60) * gh;
                ctx.strokeStyle = clusterPalette[i]; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); ctx.stroke();
                const Cu = c.d60 / c.d10;
                ctx.fillStyle = clusterPalette[i]; ctx.font = '10px JetBrains Mono';
                ctx.fillText(`Zone ${i + 1}: Cu=${Cu.toFixed(1)}`, x + 14, y - 4);
            });
        }
        container.appendChild(controls); container.appendChild(btnRow); container.appendChild(canvas);
        insertPoint.appendChild(section);
        generatePoints(); draw();
    }

    /* ──────────────────────────────────────────────
       8) CONSTRUCTION MATERIAL OUTLIER DETECTOR
       Detect anomalous concrete test results
       ────────────────────────────────────────────── */
    function createMaterialOutlierDemo(insertPoint) {
        const { section, container } = createDemoSection(
            'Concrete Batch Outlier Detection',
            'fa-solid fa-triangle-exclamation',
            'Detect anomalous concrete cube test results using statistical distance. Red-flagged samples may indicate quality control issues — bad mix, improper curing, or testing errors. Adjust the threshold to control sensitivity.'
        );
        const canvas = ce('canvas');
        canvas.style.cssText = `width:100%;border-radius:8px;border:1px solid ${colors.border}`;
        const w = Math.min(container.getBoundingClientRect().width - 48, 800);
        const h = 320;
        const { ctx, W, H } = initCanvas(canvas, w, h);
        let data = [], threshold = 2;
        const controls = ce('div'); controls.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;margin-bottom:12px';
        controls.appendChild(makeSlider('Threshold (σ)', 1, 4, 2, 0.5, 'σ', v => { threshold = v; draw(); }));
        const btnRow = ce('div'); btnRow.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap';
        btnRow.appendChild(makeBtn('New Batch', 'fa-solid fa-rotate', () => { genData(); draw(); }));
        const info = ce('div'); info.style.cssText = `padding:8px;font-size:.82rem;color:${colors.muted};font-family:JetBrains Mono,monospace`;
        function genData() {
            data = [];
            const mean = 25 + Math.random() * 15;
            for (let i = 0; i < 40; i++) {
                const isOutlier = Math.random() < 0.1;
                const val = isOutlier ? mean + (Math.random() > 0.5 ? 1 : -1) * (8 + Math.random() * 10) : mean + (Math.random() - 0.5) * 6;
                data.push({ day: i + 1, fc: Math.max(5, val) });
            }
        }
        function draw() {
            ctx.clearRect(0, 0, W, H);
            const pad = { l: 50, r: 20, t: 20, b: 40 };
            const gw = W - pad.l - pad.r, gh = H - pad.t - pad.b;
            const mean = data.reduce((s, d) => s + d.fc, 0) / data.length;
            const std = Math.sqrt(data.reduce((s, d) => s + (d.fc - mean) ** 2, 0) / data.length);
            const lo = mean - threshold * std, hi = mean + threshold * std;
            // Band
            const yLo = pad.t + (1 - (lo - 5) / 55) * gh;
            const yHi = pad.t + (1 - (hi - 5) / 55) * gh;
            ctx.fillStyle = colors.teal + '15';
            ctx.fillRect(pad.l, yHi, gw, yLo - yHi);
            ctx.strokeStyle = colors.teal + '50'; ctx.setLineDash([5, 5]);
            ctx.beginPath(); ctx.moveTo(pad.l, yHi); ctx.lineTo(W - pad.r, yHi); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(pad.l, yLo); ctx.lineTo(W - pad.r, yLo); ctx.stroke();
            ctx.setLineDash([]);
            // Mean line
            const yMean = pad.t + (1 - (mean - 5) / 55) * gh;
            ctx.strokeStyle = colors.amber; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(pad.l, yMean); ctx.lineTo(W - pad.r, yMean); ctx.stroke();
            ctx.fillStyle = colors.amber; ctx.font = '10px JetBrains Mono';
            ctx.fillText('μ=' + mean.toFixed(1), W - pad.r - 55, yMean - 5);
            // Axes
            ctx.strokeStyle = colors.border; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, H - pad.b); ctx.lineTo(W - pad.r, H - pad.b); ctx.stroke();
            ctx.fillStyle = colors.muted; ctx.font = '11px Inter';
            ctx.fillText('Test Sample #', W / 2 - 30, H - 5);
            ctx.save(); ctx.translate(12, H / 2 + 20); ctx.rotate(-Math.PI / 2); ctx.fillText("f'c (MPa)", 0, 0); ctx.restore();
            let outliers = 0;
            data.forEach(d => {
                const x = pad.l + ((d.day - 1) / 39) * gw;
                const y = pad.t + (1 - (d.fc - 5) / 55) * gh;
                const isOut = d.fc < lo || d.fc > hi;
                if (isOut) outliers++;
                ctx.fillStyle = isOut ? colors.red : colors.cyan;
                ctx.beginPath(); ctx.arc(x, y, isOut ? 6 : 4, 0, Math.PI * 2); ctx.fill();
                if (isOut) {
                    ctx.strokeStyle = colors.red; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.stroke();
                }
            });
            info.innerHTML = `Mean = ${mean.toFixed(1)} MPa | σ = ${std.toFixed(1)} MPa | Outliers: <span style="color:${colors.red}">${outliers}</span> of ${data.length} samples | Acceptance range: ${lo.toFixed(1)} – ${hi.toFixed(1)} MPa`;
        }
        container.appendChild(controls); container.appendChild(btnRow); container.appendChild(canvas); container.appendChild(info);
        insertPoint.appendChild(section);
        genData(); draw();
    }

    /* ══════════════════════════════════════════════
       AUTO-INJECTION BASED ON URL
       ══════════════════════════════════════════════ */
    function inject() {
        const path = window.location.pathname;
        const target = document.getElementById('geo-demo-container');
        const insertPoint = target || (function () {
            const quizSections = document.querySelectorAll('[id^="quiz"]');
            if (quizSections.length) {
                const wrap = document.createElement('div');
                wrap.id = 'geo-demo-container';
                quizSections[0].parentNode.insertBefore(wrap, quizSections[0]);
                return wrap;
            }
            return null;
        })();
        if (!insertPoint) return;

        if (path.includes('sub1')) {
            createSoilClusteringDemo(insertPoint);
        } else if (path.includes('sub2')) {
            createSoilClusteringDemo(insertPoint);
            createGradationClusterDemo(insertPoint);
        } else if (path.includes('sub3')) {
            createDendrogramDemo(insertPoint);
        } else if (path.includes('sub4')) {
            createDBSCANDemo(insertPoint);
        } else if (path.includes('sub5')) {
            createPCAExplorerDemo(insertPoint);
        } else if (path.includes('sub6')) {
            createPCAExplorerDemo(insertPoint);
            createMaterialOutlierDemo(insertPoint);
        } else if (path.includes('sub7')) {
            createAnomalyDetectorDemo(insertPoint);
            createMaterialOutlierDemo(insertPoint);
        } else if (path.includes('sub8')) {
            createSoilClusteringDemo(insertPoint);
            createGradationClusterDemo(insertPoint);
        } else if (path.includes('sub9')) {
            createSilhouetteDemo(insertPoint);
        } else if (path.includes('sub10')) {
            createSoilClusteringDemo(insertPoint);
            createDBSCANDemo(insertPoint);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }

})();
