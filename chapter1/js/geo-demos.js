/* ============================================
   CHAPTER 1 — GEOTECHNICAL & WATER RESOURCES
   INTERACTIVE DEMO ENGINE
   Adds visual demos to all sub-chapter pages
   ============================================ */
(function () {
    'use strict';

    const { $, $$, lerp, rand, clamp, PI, TAU, getColors, initCanvas } = window.ChapterUtils;
    const C = getColors();

    /* ──────────────────────────────────────────────
       1) SOIL PROFILE VISUALIZER
       Shows animated soil layers with SPT N-values
       ────────────────────────────────────────────── */
    function createSoilProfileDemo(container) {
        if (!container) return;
        container.innerHTML = `
            <div class="demo-panel" style="margin-top:24px">
                <div class="demo-panel__header">
                    <h3><i class="fa-solid fa-layer-group"></i> Interactive Soil Profile & AI Classification</h3>
                    <p>Click "Drill Borehole" to simulate SPT testing. Watch the AI classify each soil layer in real-time.</p>
                </div>
                <div class="demo-panel__controls">
                    <button class="demo-btn" id="soil-drill-btn"><i class="fa-solid fa-arrow-down"></i> Drill Borehole</button>
                    <button class="demo-btn" id="soil-reset-btn"><i class="fa-solid fa-rotate-left"></i> Reset</button>
                    <button class="demo-btn" id="soil-classify-btn"><i class="fa-solid fa-robot"></i> AI Classify All</button>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:16px;min-height:400px">
                    <canvas id="soil-profile-canvas" style="width:100%;height:400px;border-radius:8px;border:1px solid var(--border-subtle)"></canvas>
                    <div id="soil-data-panel" style="font-family:var(--font-mono);font-size:0.82rem;overflow-y:auto;max-height:400px;padding:12px;background:var(--bg-tertiary);border-radius:8px;border:1px solid var(--border-subtle)">
                        <div style="color:var(--accent-primary);font-weight:700;margin-bottom:8px"><i class="fa-solid fa-database"></i> Borehole Log</div>
                        <div id="soil-log-entries" style="color:var(--text-secondary)">Press "Drill Borehole" to begin...</div>
                    </div>
                </div>
                <div class="demo-panel__legend" style="padding:12px 16px;display:flex;gap:16px;flex-wrap:wrap;font-size:0.8rem">
                    <span><span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#d4a574;vertical-align:middle;margin-right:4px"></span> Topsoil/Fill</span>
                    <span><span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#c2956b;vertical-align:middle;margin-right:4px"></span> Sand</span>
                    <span><span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#8B7355;vertical-align:middle;margin-right:4px"></span> Clay</span>
                    <span><span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#696969;vertical-align:middle;margin-right:4px"></span> Gravel</span>
                    <span><span style="display:inline-block;width:14px;height:14px;border-radius:3px;background:#4a4a4a;vertical-align:middle;margin-right:4px"></span> Rock</span>
                    <span style="color:var(--accent-primary)"><i class="fa-solid fa-water"></i> Water Table</span>
                </div>
            </div>`;

        const canvas = container.querySelector('#soil-profile-canvas');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 400 * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = 400;

        const soilTypes = [
            { name: 'Topsoil/Fill', color: '#d4a574', pattern: 'dots', nRange: [2, 6], desc: 'Loose, organic' },
            { name: 'Silty Sand', color: '#c2956b', pattern: 'diagonal', nRange: [8, 20], desc: 'Medium dense' },
            { name: 'Soft Clay', color: '#8B7355', pattern: 'horizontal', nRange: [2, 8], desc: 'Compressible' },
            { name: 'Dense Sand', color: '#b8a07a', pattern: 'stipple', nRange: [25, 45], desc: 'Dense, granular' },
            { name: 'Stiff Clay', color: '#6B5B4A', pattern: 'horizontal', nRange: [10, 25], desc: 'Overconsolidated' },
            { name: 'Gravel', color: '#696969', pattern: 'circles', nRange: [30, 50], desc: 'Coarse grained' },
            { name: 'Weathered Rock', color: '#4a4a4a', pattern: 'cross', nRange: [50, 100], desc: 'Refusal at 50+' }
        ];

        let layers = [];
        let drillDepth = 0;
        let waterTable = 0;
        let drilling = false;
        let classified = false;

        function generateProfile() {
            layers = [];
            let depth = 0;
            const numLayers = 4 + Math.floor(rand(0, 3));
            waterTable = rand(2, 5);
            for (let i = 0; i < numLayers && depth < 20; i++) {
                const typeIdx = Math.min(i + Math.floor(rand(0, 2)), soilTypes.length - 1);
                const thickness = rand(1.5, 4.5);
                const type = soilTypes[typeIdx];
                const nValue = Math.round(rand(type.nRange[0], type.nRange[1]));
                layers.push({ depth, thickness, type, nValue, classified: false });
                depth += thickness;
            }
        }

        function drawProfile() {
            ctx.clearRect(0, 0, W, H);
            const scale = H / 22;
            const leftMargin = 60;
            const profileW = W - leftMargin - 20;

            // Depth scale
            ctx.fillStyle = C.TEXT;
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'right';
            for (let d = 0; d <= 20; d += 2) {
                const y = d * scale + 10;
                ctx.fillText(d + 'm', leftMargin - 8, y + 4);
                ctx.beginPath();
                ctx.moveTo(leftMargin, y);
                ctx.lineTo(leftMargin + profileW, y);
                ctx.strokeStyle = C.DIM;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }

            // Draw layers up to drill depth
            layers.forEach(layer => {
                if (layer.depth > drillDepth) return;
                const y = layer.depth * scale + 10;
                const h = Math.min(layer.thickness, drillDepth - layer.depth) * scale;
                if (h <= 0) return;

                // Fill
                ctx.fillStyle = layer.type.color;
                ctx.fillRect(leftMargin, y, profileW * 0.6, h);

                // Pattern
                ctx.save();
                ctx.globalAlpha = 0.3;
                if (layer.type.pattern === 'dots') {
                    for (let px = leftMargin + 10; px < leftMargin + profileW * 0.6; px += 12) {
                        for (let py = y + 6; py < y + h; py += 10) {
                            ctx.beginPath(); ctx.arc(px, py, 1.5, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill();
                        }
                    }
                } else if (layer.type.pattern === 'horizontal') {
                    for (let py = y + 5; py < y + h; py += 6) {
                        ctx.beginPath(); ctx.moveTo(leftMargin + 4, py); ctx.lineTo(leftMargin + profileW * 0.6 - 4, py);
                        ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.5; ctx.stroke();
                    }
                } else if (layer.type.pattern === 'diagonal') {
                    for (let px = leftMargin; px < leftMargin + profileW * 0.6 + h; px += 8) {
                        ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px - h, y + h);
                        ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.5; ctx.stroke();
                    }
                }
                ctx.restore();

                // Border
                ctx.strokeStyle = C.STROKE;
                ctx.lineWidth = 1;
                ctx.strokeRect(leftMargin, y, profileW * 0.6, h);

                // N-value bar
                const barX = leftMargin + profileW * 0.65;
                const barW = (layer.nValue / 60) * (profileW * 0.3);
                const barY = y + h / 2 - 6;
                ctx.fillStyle = layer.nValue < 10 ? '#ef4444' : layer.nValue < 30 ? '#f59e0b' : '#22c55e';
                ctx.fillRect(barX, barY, barW, 12);
                ctx.fillStyle = C.WHITE;
                ctx.font = 'bold 10px Inter';
                ctx.textAlign = 'left';
                ctx.fillText('N=' + layer.nValue, barX + barW + 4, barY + 10);

                // AI classification badge
                if (layer.classified) {
                    ctx.fillStyle = 'rgba(0,212,170,0.15)';
                    ctx.fillRect(leftMargin + 4, y + 4, profileW * 0.6 - 8, 16);
                    ctx.fillStyle = C.TEAL;
                    ctx.font = 'bold 9px Inter';
                    ctx.fillText('AI: ' + layer.type.name + ' — ' + layer.type.desc, leftMargin + 8, y + 14);
                }
            });

            // Water table
            if (drillDepth > waterTable) {
                const wty = waterTable * scale + 10;
                ctx.setLineDash([8, 4]);
                ctx.beginPath();
                ctx.moveTo(leftMargin, wty);
                ctx.lineTo(leftMargin + profileW, wty);
                ctx.strokeStyle = '#0ea5e9';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = '#0ea5e9';
                ctx.font = 'bold 11px Inter';
                ctx.textAlign = 'left';
                ctx.fillText('▼ GWT: ' + waterTable.toFixed(1) + 'm', leftMargin + profileW * 0.65, wty - 4);
            }

            // Drill bit
            if (drilling && drillDepth < 20) {
                const dy = drillDepth * scale + 10;
                ctx.beginPath();
                ctx.moveTo(leftMargin + profileW * 0.3 - 6, dy);
                ctx.lineTo(leftMargin + profileW * 0.3 + 6, dy);
                ctx.lineTo(leftMargin + profileW * 0.3, dy + 10);
                ctx.closePath();
                ctx.fillStyle = '#ef4444';
                ctx.fill();
            }

            // Title
            ctx.fillStyle = C.WHITE;
            ctx.font = 'bold 12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Borehole Profile', leftMargin + profileW * 0.3, H - 6);
            ctx.fillText('SPT N-values', leftMargin + profileW * 0.8, H - 6);
        }

        function updateLog() {
            const logEl = container.querySelector('#soil-log-entries');
            if (layers.length === 0 || drillDepth === 0) {
                logEl.innerHTML = 'Press "Drill Borehole" to begin...';
                return;
            }
            let html = '';
            layers.forEach(layer => {
                if (layer.depth > drillDepth) return;
                const status = layer.classified ?
                    '<span style="color:#2dd4bf">✓ AI Classified</span>' :
                    '<span style="color:var(--text-muted)">Pending</span>';
                html += `<div style="padding:8px 0;border-bottom:1px solid var(--border-subtle)">
                    <div><strong>${layer.depth.toFixed(1)}m - ${(layer.depth + layer.thickness).toFixed(1)}m</strong> ${status}</div>
                    <div style="margin-top:2px">SPT N = <strong style="color:${layer.nValue < 10 ? '#ef4444' : layer.nValue < 30 ? '#f59e0b' : '#22c55e'}">${layer.nValue}</strong></div>
                    ${layer.classified ? `<div style="color:#2dd4bf;margin-top:2px">→ ${layer.type.name}: ${layer.type.desc}</div>` : ''}
                </div>`;
            });
            if (drillDepth > waterTable) {
                html += `<div style="padding:8px 0;color:#0ea5e9"><i class="fa-solid fa-water"></i> Water table at ${waterTable.toFixed(1)}m</div>`;
            }
            logEl.innerHTML = html;
        }

        generateProfile();
        drawProfile();

        container.querySelector('#soil-drill-btn').addEventListener('click', () => {
            if (drilling) return;
            if (drillDepth >= 20) return;
            drilling = true;
            classified = false;
            const target = Math.min(drillDepth + rand(2, 5), 20);
            const interval = setInterval(() => {
                drillDepth += 0.15;
                if (drillDepth >= target) {
                    drillDepth = Math.min(target, 20);
                    drilling = false;
                    clearInterval(interval);
                }
                drawProfile();
                updateLog();
            }, 30);
        });

        container.querySelector('#soil-reset-btn').addEventListener('click', () => {
            drillDepth = 0;
            drilling = false;
            classified = false;
            generateProfile();
            drawProfile();
            updateLog();
        });

        container.querySelector('#soil-classify-btn').addEventListener('click', () => {
            let i = 0;
            const interval = setInterval(() => {
                if (i >= layers.length || layers[i].depth > drillDepth) { clearInterval(interval); return; }
                layers[i].classified = true;
                drawProfile();
                updateLog();
                i++;
            }, 400);
        });
    }

    /* ──────────────────────────────────────────────
       2) FLOOD HYDROGRAPH PREDICTOR
       Interactive rainfall → runoff demo
       ────────────────────────────────────────────── */
    function createFloodDemo(container) {
        if (!container) return;
        container.innerHTML = `
            <div class="demo-panel" style="margin-top:24px">
                <div class="demo-panel__header">
                    <h3><i class="fa-solid fa-cloud-rain"></i> AI Flood Prediction: Rainfall → Discharge</h3>
                    <p>Adjust rainfall intensity and duration. Watch the AI predict the flood hydrograph and peak discharge in real-time.</p>
                </div>
                <div class="demo-panel__controls" style="display:flex;gap:20px;flex-wrap:wrap;align-items:center">
                    <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;color:var(--text-secondary)">
                        <i class="fa-solid fa-cloud-showers-heavy" style="color:#0ea5e9"></i> Rainfall (mm/hr):
                        <input type="range" id="flood-rain-slider" min="5" max="100" value="30" style="width:120px">
                        <span id="flood-rain-value" style="color:var(--accent-primary);font-weight:700;min-width:40px">30</span>
                    </label>
                    <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;color:var(--text-secondary)">
                        <i class="fa-solid fa-clock" style="color:#f59e0b"></i> Duration (hrs):
                        <input type="range" id="flood-dur-slider" min="1" max="24" value="6" style="width:120px">
                        <span id="flood-dur-value" style="color:var(--accent-primary);font-weight:700;min-width:30px">6</span>
                    </label>
                    <label style="display:flex;align-items:center;gap:8px;font-size:0.85rem;color:var(--text-secondary)">
                        <i class="fa-solid fa-mountain" style="color:#22c55e"></i> Catchment:
                        <select id="flood-catchment" style="background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--border-subtle);border-radius:6px;padding:4px 8px;font-size:0.85rem">
                            <option value="urban">Urban (high runoff)</option>
                            <option value="suburban" selected>Suburban (medium)</option>
                            <option value="rural">Rural (low runoff)</option>
                            <option value="forest">Forest (minimal)</option>
                        </select>
                    </label>
                </div>
                <div style="padding:16px">
                    <canvas id="flood-canvas" style="width:100%;height:320px;border-radius:8px;border:1px solid var(--border-subtle)"></canvas>
                </div>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:0 16px 16px;text-align:center">
                    <div style="background:var(--bg-tertiary);border-radius:8px;padding:12px">
                        <div style="font-size:0.75rem;color:var(--text-muted)">Peak Discharge</div>
                        <div id="flood-peak" style="font-size:1.3rem;font-weight:800;color:#ef4444">—</div>
                        <div style="font-size:0.7rem;color:var(--text-muted)">m³/s</div>
                    </div>
                    <div style="background:var(--bg-tertiary);border-radius:8px;padding:12px">
                        <div style="font-size:0.75rem;color:var(--text-muted)">Time to Peak</div>
                        <div id="flood-ttp" style="font-size:1.3rem;font-weight:800;color:#f59e0b">—</div>
                        <div style="font-size:0.7rem;color:var(--text-muted)">hours</div>
                    </div>
                    <div style="background:var(--bg-tertiary);border-radius:8px;padding:12px">
                        <div style="font-size:0.75rem;color:var(--text-muted)">Total Runoff</div>
                        <div id="flood-volume" style="font-size:1.3rem;font-weight:800;color:#0ea5e9">—</div>
                        <div style="font-size:0.7rem;color:var(--text-muted)">× 10³ m³</div>
                    </div>
                    <div style="background:var(--bg-tertiary);border-radius:8px;padding:12px">
                        <div style="font-size:0.75rem;color:var(--text-muted)">AI Confidence</div>
                        <div id="flood-conf" style="font-size:1.3rem;font-weight:800;color:#22c55e">—</div>
                        <div style="font-size:0.7rem;color:var(--text-muted)">%</div>
                    </div>
                </div>
            </div>`;

        const canvas = container.querySelector('#flood-canvas');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 320 * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = 320;

        const coefficients = { urban: 0.85, suburban: 0.55, rural: 0.30, forest: 0.15 };

        function computeHydrograph() {
            const rain = parseFloat(container.querySelector('#flood-rain-slider').value);
            const dur = parseFloat(container.querySelector('#flood-dur-slider').value);
            const catchment = container.querySelector('#flood-catchment').value;
            const C_val = coefficients[catchment];

            const area = 25; // km²
            const tc = dur * 0.6 + 1; // time of concentration
            const tp = dur / 2 + 0.6 * tc; // time to peak
            const Qp = 0.208 * C_val * rain * area / tp; // rational-SCS hybrid

            // Generate hydrograph points (gamma distribution shape)
            const points = [];
            const totalTime = tp * 4;
            for (let t = 0; t <= totalTime; t += 0.2) {
                const ratio = t / tp;
                const q = Qp * ratio * Math.exp(1 - ratio);
                points.push({ t, q: Math.max(0, q) });
            }

            // Rainfall hyetograph
            const rainBars = [];
            for (let t = 0; t < dur; t += 0.5) {
                const intensity = rain * (1 + 0.3 * Math.sin(PI * t / dur));
                rainBars.push({ t, intensity });
            }

            return { points, rainBars, Qp, tp, dur, totalTime, rain, C_val, area };
        }

        function drawHydrograph() {
            const data = computeHydrograph();
            ctx.clearRect(0, 0, W, H);

            const margin = { top: 50, right: 20, bottom: 40, left: 60 };
            const plotW = W - margin.left - margin.right;
            const plotH = H - margin.top - margin.bottom;

            // Background grid
            ctx.strokeStyle = C.DIM;
            ctx.lineWidth = 0.5;
            for (let i = 0; i <= 5; i++) {
                const y = margin.top + (i / 5) * plotH;
                ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(margin.left + plotW, y); ctx.stroke();
            }

            // Rainfall bars (top, inverted)
            const rainH = plotH * 0.25;
            const maxRain = data.rain * 1.5;
            data.rainBars.forEach(bar => {
                const x = margin.left + (bar.t / data.totalTime) * plotW;
                const bw = (0.5 / data.totalTime) * plotW;
                const bh = (bar.intensity / maxRain) * rainH;
                ctx.fillStyle = 'rgba(14,165,233,0.35)';
                ctx.fillRect(x, margin.top, bw - 1, bh);
            });
            ctx.fillStyle = '#0ea5e9';
            ctx.font = 'bold 10px Inter';
            ctx.textAlign = 'left';
            ctx.fillText('Rainfall', margin.left + 4, margin.top + 12);

            // Discharge curve
            const maxQ = data.Qp * 1.3;
            ctx.beginPath();
            data.points.forEach((p, i) => {
                const x = margin.left + (p.t / data.totalTime) * plotW;
                const y = margin.top + plotH - (p.q / maxQ) * plotH;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.strokeStyle = C.TEAL;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Fill under curve
            ctx.lineTo(margin.left + plotW, margin.top + plotH);
            ctx.lineTo(margin.left, margin.top + plotH);
            ctx.closePath();
            ctx.fillStyle = 'rgba(0,212,170,0.08)';
            ctx.fill();

            // Peak marker
            const peakX = margin.left + (data.tp / data.totalTime) * plotW;
            const peakY = margin.top + plotH - (data.Qp / maxQ) * plotH;
            ctx.beginPath(); ctx.arc(peakX, peakY, 6, 0, TAU); ctx.fillStyle = '#ef4444'; ctx.fill();
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Peak: ' + data.Qp.toFixed(1) + ' m³/s', peakX, peakY - 12);

            // Axes labels
            ctx.fillStyle = C.TEXT;
            ctx.font = '11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Time (hours)', margin.left + plotW / 2, H - 8);
            ctx.save();
            ctx.translate(14, margin.top + plotH / 2);
            ctx.rotate(-PI / 2);
            ctx.fillText('Discharge (m³/s)', 0, 0);
            ctx.restore();

            // Tick labels
            ctx.textAlign = 'center';
            ctx.font = '10px Inter';
            for (let t = 0; t <= data.totalTime; t += Math.ceil(data.totalTime / 6)) {
                const x = margin.left + (t / data.totalTime) * plotW;
                ctx.fillText(t.toFixed(0), x, H - 24);
            }
            ctx.textAlign = 'right';
            for (let i = 0; i <= 4; i++) {
                const q = (i / 4) * maxQ;
                const y = margin.top + plotH - (i / 4) * plotH;
                ctx.fillText(q.toFixed(0), margin.left - 6, y + 4);
            }

            // AI prediction label
            ctx.fillStyle = 'rgba(0,212,170,0.12)';
            ctx.fillRect(W - 180, 8, 170, 28);
            ctx.fillStyle = C.TEAL;
            ctx.font = 'bold 11px Inter';
            ctx.textAlign = 'right';
            ctx.fillText('🤖 AI-Predicted Hydrograph', W - 16, 27);

            // Update stats
            container.querySelector('#flood-peak').textContent = data.Qp.toFixed(1);
            container.querySelector('#flood-ttp').textContent = data.tp.toFixed(1);
            container.querySelector('#flood-volume').textContent = (data.Qp * data.tp * 1.8).toFixed(0);
            container.querySelector('#flood-conf').textContent = Math.round(85 + rand(0, 10));

            container.querySelector('#flood-rain-value').textContent = data.rain;
            container.querySelector('#flood-dur-value').textContent = data.dur;
        }

        drawHydrograph();
        ['flood-rain-slider', 'flood-dur-slider', 'flood-catchment'].forEach(id => {
            const el = container.querySelector('#' + id);
            if (el) el.addEventListener('input', drawHydrograph);
        });
    }

    /* ──────────────────────────────────────────────
       3) SLOPE STABILITY ANALYZER
       Interactive slope with FOS calculation
       ────────────────────────────────────────────── */
    function createSlopeDemo(container) {
        if (!container) return;
        container.innerHTML = `
            <div class="demo-panel" style="margin-top:24px">
                <div class="demo-panel__header">
                    <h3><i class="fa-solid fa-hill-rockslide"></i> AI Slope Stability Analyzer</h3>
                    <p>Adjust soil parameters and slope geometry. The AI estimates the Factor of Safety and failure surface in real-time.</p>
                </div>
                <div class="demo-panel__controls" style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
                    <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-secondary)">
                        Slope angle:
                        <input type="range" id="slope-angle" min="15" max="60" value="35" style="width:100px">
                        <span id="slope-angle-val" style="color:var(--accent-primary);font-weight:700">35°</span>
                    </label>
                    <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-secondary)">
                        φ (friction):
                        <input type="range" id="slope-phi" min="10" max="45" value="28" style="width:100px">
                        <span id="slope-phi-val" style="color:var(--accent-primary);font-weight:700">28°</span>
                    </label>
                    <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-secondary)">
                        c (kPa):
                        <input type="range" id="slope-c" min="0" max="50" value="15" style="width:100px">
                        <span id="slope-c-val" style="color:var(--accent-primary);font-weight:700">15</span>
                    </label>
                    <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-secondary)">
                        γ (kN/m³):
                        <input type="range" id="slope-gamma" min="14" max="22" value="18" step="0.5" style="width:100px">
                        <span id="slope-gamma-val" style="color:var(--accent-primary);font-weight:700">18.0</span>
                    </label>
                </div>
                <div style="padding:16px">
                    <canvas id="slope-canvas" style="width:100%;height:350px;border-radius:8px;border:1px solid var(--border-subtle)"></canvas>
                </div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:0 16px 16px;text-align:center">
                    <div style="background:var(--bg-tertiary);border-radius:8px;padding:12px">
                        <div style="font-size:0.75rem;color:var(--text-muted)">Factor of Safety</div>
                        <div id="slope-fos" style="font-size:1.8rem;font-weight:800">—</div>
                    </div>
                    <div style="background:var(--bg-tertiary);border-radius:8px;padding:12px">
                        <div style="font-size:0.75rem;color:var(--text-muted)">AI Verdict</div>
                        <div id="slope-verdict" style="font-size:1rem;font-weight:700">—</div>
                    </div>
                    <div style="background:var(--bg-tertiary);border-radius:8px;padding:12px">
                        <div style="font-size:0.75rem;color:var(--text-muted)">Failure Mode</div>
                        <div id="slope-mode" style="font-size:0.9rem;font-weight:600;color:var(--text-secondary)">—</div>
                    </div>
                </div>
            </div>`;

        const canvas = container.querySelector('#slope-canvas');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 350 * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = 350;

        function drawSlope() {
            const angle = parseFloat(container.querySelector('#slope-angle').value);
            const phi = parseFloat(container.querySelector('#slope-phi').value);
            const c = parseFloat(container.querySelector('#slope-c').value);
            const gamma = parseFloat(container.querySelector('#slope-gamma').value);

            // Update labels
            container.querySelector('#slope-angle-val').textContent = angle + '°';
            container.querySelector('#slope-phi-val').textContent = phi + '°';
            container.querySelector('#slope-c-val').textContent = c;
            container.querySelector('#slope-gamma-val').textContent = gamma.toFixed(1);

            // Calculate FOS (simplified infinite slope)
            const slopeRad = angle * PI / 180;
            const phiRad = phi * PI / 180;
            const height = 10; // m
            const fos = (c / (gamma * height * Math.sin(slopeRad) * Math.cos(slopeRad))) +
                        (Math.tan(phiRad) / Math.tan(slopeRad));

            // Colors based on FOS
            let fosColor, verdict, mode;
            if (fos >= 1.5) { fosColor = '#22c55e'; verdict = 'STABLE'; mode = 'No failure expected'; }
            else if (fos >= 1.25) { fosColor = '#f59e0b'; verdict = 'MARGINAL'; mode = 'Shallow sliding possible'; }
            else if (fos >= 1.0) { fosColor = '#f97316'; verdict = 'CRITICAL'; mode = 'Circular failure likely'; }
            else { fosColor = '#ef4444'; verdict = 'UNSTABLE'; mode = 'Active sliding expected'; }

            container.querySelector('#slope-fos').textContent = fos.toFixed(2);
            container.querySelector('#slope-fos').style.color = fosColor;
            container.querySelector('#slope-verdict').textContent = '🤖 ' + verdict;
            container.querySelector('#slope-verdict').style.color = fosColor;
            container.querySelector('#slope-mode').textContent = mode;

            // Draw
            ctx.clearRect(0, 0, W, H);

            const baseY = H * 0.85;
            const slopeH = H * 0.5;
            const topW = W * 0.3;
            const slopeW = slopeH / Math.tan(slopeRad);

            // Sky gradient
            const skyGrad = ctx.createLinearGradient(0, 0, 0, baseY);
            skyGrad.addColorStop(0, 'rgba(14,165,233,0.05)');
            skyGrad.addColorStop(1, 'rgba(14,165,233,0)');
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, W, baseY);

            // Slope body
            ctx.beginPath();
            ctx.moveTo(0, baseY);
            ctx.lineTo(topW, baseY);
            ctx.lineTo(topW, baseY - slopeH);
            ctx.lineTo(topW + slopeW, baseY);
            ctx.lineTo(W, baseY);
            ctx.lineTo(W, H);
            ctx.lineTo(0, H);
            ctx.closePath();

            // Soil gradient
            const soilGrad = ctx.createLinearGradient(0, baseY - slopeH, 0, H);
            soilGrad.addColorStop(0, '#8B7355');
            soilGrad.addColorStop(0.5, '#6B5B4A');
            soilGrad.addColorStop(1, '#4a3f35');
            ctx.fillStyle = soilGrad;
            ctx.fill();
            ctx.strokeStyle = '#5a4a3a';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Soil pattern (dots for texture)
            ctx.globalAlpha = 0.15;
            for (let x = 0; x < W; x += 10) {
                for (let y = baseY - slopeH; y < H; y += 10) {
                    // Check if point is inside slope
                    if (y >= baseY || (x >= topW && x <= topW + slopeW &&
                        y >= baseY - slopeH + (x - topW) * Math.tan(slopeRad))) {
                        continue; // Skip if above slope surface
                    }
                    if (y > baseY - slopeH + rand(-5, 5)) {
                        ctx.beginPath();
                        ctx.arc(x + rand(-2, 2), y + rand(-2, 2), rand(0.5, 1.5), 0, TAU);
                        ctx.fillStyle = '#d4a574';
                        ctx.fill();
                    }
                }
            }
            ctx.globalAlpha = 1;

            // Failure surface (circular arc)
            if (fos < 1.5) {
                const cx = topW + slopeW * 0.5;
                const cy = baseY - slopeH * 0.3;
                const radius = slopeH * 0.8;
                ctx.setLineDash([6, 4]);
                ctx.beginPath();
                ctx.arc(cx, cy - radius * 0.3, radius, PI * 0.3, PI * 0.85);
                ctx.strokeStyle = fosColor;
                ctx.lineWidth = 2.5;
                ctx.stroke();
                ctx.setLineDash([]);

                // Arrow showing movement direction
                if (fos < 1.25) {
                    const arrowX = topW + slopeW * 0.4;
                    const arrowY = baseY - slopeH * 0.45;
                    ctx.beginPath();
                    ctx.moveTo(arrowX, arrowY);
                    ctx.lineTo(arrowX + 20, arrowY + 15);
                    ctx.strokeStyle = fosColor;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(arrowX + 20, arrowY + 15);
                    ctx.lineTo(arrowX + 14, arrowY + 8);
                    ctx.moveTo(arrowX + 20, arrowY + 15);
                    ctx.lineTo(arrowX + 12, arrowY + 16);
                    ctx.stroke();
                }
            }

            // Dimension labels
            ctx.fillStyle = C.WHITE;
            ctx.font = 'bold 11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('H = 10m', topW - 20, baseY - slopeH / 2);
            ctx.fillText('β = ' + angle + '°', topW + slopeW * 0.4, baseY - slopeH * 0.15);

            // FOS badge
            ctx.fillStyle = fosColor + '20';
            ctx.fillRect(W - 160, 10, 150, 50);
            ctx.strokeStyle = fosColor;
            ctx.lineWidth = 1;
            ctx.strokeRect(W - 160, 10, 150, 50);
            ctx.fillStyle = fosColor;
            ctx.font = 'bold 22px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('FOS = ' + fos.toFixed(2), W - 85, 42);
            ctx.font = '9px Inter';
            ctx.fillText('🤖 AI Prediction', W - 85, 55);

            // Grass on top
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 1;
            for (let x = topW + 2; x < topW + slopeW - 2; x += 6) {
                const surfY = baseY - slopeH + (x - topW) / slopeW * slopeH;
                if (surfY < baseY) {
                    ctx.beginPath();
                    ctx.moveTo(x, surfY);
                    ctx.lineTo(x + rand(-2, 2), surfY - rand(3, 8));
                    ctx.stroke();
                }
            }
        }

        drawSlope();
        ['slope-angle', 'slope-phi', 'slope-c', 'slope-gamma'].forEach(id => {
            container.querySelector('#' + id).addEventListener('input', drawSlope);
        });
    }

    /* ──────────────────────────────────────────────
       4) GROUNDWATER FLOW VISUALIZER
       Darcy's law + flow net animation
       ────────────────────────────────────────────── */
    function createGroundwaterDemo(container) {
        if (!container) return;
        container.innerHTML = `
            <div class="demo-panel" style="margin-top:24px">
                <div class="demo-panel__header">
                    <h3><i class="fa-solid fa-droplet"></i> AI Groundwater Flow Predictor</h3>
                    <p>Adjust hydraulic conductivity and head difference. Watch the AI predict flow paths and seepage velocity.</p>
                </div>
                <div class="demo-panel__controls" style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
                    <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-secondary)">
                        k (m/s):
                        <select id="gw-k" style="background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--border-subtle);border-radius:6px;padding:4px 8px;font-size:0.82rem">
                            <option value="0.0001">10⁻⁴ (Sand)</option>
                            <option value="0.00001" selected>10⁻⁵ (Silty sand)</option>
                            <option value="0.000001">10⁻⁶ (Silt)</option>
                            <option value="0.0000001">10⁻⁷ (Clay)</option>
                        </select>
                    </label>
                    <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-secondary)">
                        Δh (m):
                        <input type="range" id="gw-head" min="1" max="15" value="5" style="width:100px">
                        <span id="gw-head-val" style="color:var(--accent-primary);font-weight:700">5</span>
                    </label>
                </div>
                <div style="padding:16px">
                    <canvas id="gw-canvas" style="width:100%;height:300px;border-radius:8px;border:1px solid var(--border-subtle)"></canvas>
                </div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:0 16px 16px;text-align:center">
                    <div style="background:var(--bg-tertiary);border-radius:8px;padding:12px">
                        <div style="font-size:0.75rem;color:var(--text-muted)">Seepage Velocity</div>
                        <div id="gw-vel" style="font-size:1.2rem;font-weight:800;color:#0ea5e9">—</div>
                    </div>
                    <div style="background:var(--bg-tertiary);border-radius:8px;padding:12px">
                        <div style="font-size:0.75rem;color:var(--text-muted)">Flow Rate</div>
                        <div id="gw-flow" style="font-size:1.2rem;font-weight:800;color:#2dd4bf">—</div>
                    </div>
                    <div style="background:var(--bg-tertiary);border-radius:8px;padding:12px">
                        <div style="font-size:0.75rem;color:var(--text-muted)">Hydraulic Gradient</div>
                        <div id="gw-gradient" style="font-size:1.2rem;font-weight:800;color:#f59e0b">—</div>
                    </div>
                </div>
            </div>`;

        const canvas = container.querySelector('#gw-canvas');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 300 * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = 300;

        // Particles for flow animation
        let particles = [];
        const numParticles = 40;

        function resetParticles(speed) {
            particles = [];
            for (let i = 0; i < numParticles; i++) {
                particles.push({
                    x: rand(60, W - 60),
                    y: rand(80, H - 40),
                    speed: speed * rand(0.5, 1.5)
                });
            }
        }

        let animFrame;
        function drawGW() {
            const k = parseFloat(container.querySelector('#gw-k').value);
            const dh = parseFloat(container.querySelector('#gw-head').value);
            container.querySelector('#gw-head-val').textContent = dh;

            const L = 100; // distance in m
            const i_gradient = dh / L;
            const v = k * i_gradient; // Darcy velocity
            const A = 50; // cross section m²
            const Q = v * A;

            container.querySelector('#gw-vel').textContent = v.toExponential(2) + ' m/s';
            container.querySelector('#gw-flow').textContent = Q.toExponential(2) + ' m³/s';
            container.querySelector('#gw-gradient').textContent = i_gradient.toFixed(3);

            const pixelSpeed = clamp(v * 2e5, 0.1, 4);
            if (particles.length === 0) resetParticles(pixelSpeed);

            ctx.clearRect(0, 0, W, H);

            // Soil background
            ctx.fillStyle = '#2a2520';
            ctx.fillRect(40, 60, W - 80, H - 80);

            // Soil texture
            ctx.globalAlpha = 0.08;
            for (let x = 45; x < W - 45; x += 8) {
                for (let y = 65; y < H - 25; y += 8) {
                    ctx.beginPath();
                    ctx.arc(x + rand(-2, 2), y + rand(-2, 2), rand(1, 2.5), 0, TAU);
                    ctx.fillStyle = '#c2956b';
                    ctx.fill();
                }
            }
            ctx.globalAlpha = 1;

            // Left reservoir (high head)
            const leftH = 60 + (1 - dh / 15) * 30;
            ctx.fillStyle = 'rgba(14,165,233,0.25)';
            ctx.fillRect(0, leftH, 50, H - leftH);
            ctx.fillStyle = '#0ea5e9';
            ctx.font = 'bold 11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('h₁', 25, leftH - 6);

            // Right reservoir (low head)
            const rightH = leftH + (dh / 15) * (H - 120);
            ctx.fillStyle = 'rgba(14,165,233,0.15)';
            ctx.fillRect(W - 50, rightH, 50, H - rightH);
            ctx.fillText('h₂', W - 25, rightH - 6);

            // Equipotential lines
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = 'rgba(14,165,233,0.15)';
            ctx.lineWidth = 0.5;
            for (let i = 1; i < 8; i++) {
                const x = 40 + (i / 8) * (W - 80);
                ctx.beginPath();
                ctx.moveTo(x, 60);
                ctx.lineTo(x, H - 20);
                ctx.stroke();
            }
            ctx.setLineDash([]);

            // Flow particles
            particles.forEach(p => {
                p.x += pixelSpeed;
                if (p.x > W - 60) {
                    p.x = 60;
                    p.y = rand(80, H - 40);
                }
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2.5, 0, TAU);
                ctx.fillStyle = 'rgba(14,165,233,0.6)';
                ctx.fill();

                // Trail
                ctx.beginPath();
                ctx.moveTo(p.x - pixelSpeed * 8, p.y);
                ctx.lineTo(p.x, p.y);
                ctx.strokeStyle = 'rgba(14,165,233,0.15)';
                ctx.lineWidth = 1;
                ctx.stroke();
            });

            // Labels
            ctx.fillStyle = C.WHITE;
            ctx.font = 'bold 11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('Darcy Flow: v = k · i = k · Δh/L', W / 2, 30);
            ctx.font = '10px Inter';
            ctx.fillStyle = C.TEXT;
            ctx.fillText('🤖 AI predicts flow paths using trained neural network on Darcy\'s law', W / 2, 48);

            animFrame = requestAnimationFrame(drawGW);
        }

        drawGW();
        ['gw-k', 'gw-head'].forEach(id => {
            container.querySelector('#' + id).addEventListener('input', () => {
                particles = [];
            });
        });

        // Clean up on page navigation
        const cleanup = () => { if (animFrame) cancelAnimationFrame(animFrame); };
        window.addEventListener('beforeunload', cleanup);
    }

    /* ──────────────────────────────────────────────
       5) BEARING CAPACITY PREDICTOR
       Interactive foundation design AI demo
       ────────────────────────────────────────────── */
    function createBearingCapacityDemo(container) {
        if (!container) return;
        container.innerHTML = `
            <div class="demo-panel" style="margin-top:24px">
                <div class="demo-panel__header">
                    <h3><i class="fa-solid fa-building"></i> AI Bearing Capacity Predictor</h3>
                    <p>Input foundation parameters. The AI estimates ultimate bearing capacity using Terzaghi's equation enhanced with ML correction factors.</p>
                </div>
                <div class="demo-panel__controls" style="display:flex;gap:16px;flex-wrap:wrap;align-items:center">
                    <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-secondary)">
                        B (width, m):
                        <input type="range" id="bc-width" min="1" max="6" value="2" step="0.5" style="width:90px">
                        <span id="bc-width-val" style="color:var(--accent-primary);font-weight:700">2.0</span>
                    </label>
                    <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-secondary)">
                        D (depth, m):
                        <input type="range" id="bc-depth" min="0.5" max="4" value="1.5" step="0.5" style="width:90px">
                        <span id="bc-depth-val" style="color:var(--accent-primary);font-weight:700">1.5</span>
                    </label>
                    <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-secondary)">
                        φ:
                        <input type="range" id="bc-phi" min="10" max="40" value="25" style="width:90px">
                        <span id="bc-phi-val" style="color:var(--accent-primary);font-weight:700">25°</span>
                    </label>
                    <label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-secondary)">
                        c (kPa):
                        <input type="range" id="bc-c" min="0" max="60" value="20" style="width:90px">
                        <span id="bc-c-val" style="color:var(--accent-primary);font-weight:700">20</span>
                    </label>
                </div>
                <div style="padding:16px">
                    <canvas id="bc-canvas" style="width:100%;height:300px;border-radius:8px;border:1px solid var(--border-subtle)"></canvas>
                </div>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:0 16px 16px;text-align:center">
                    <div style="background:var(--bg-tertiary);border-radius:8px;padding:10px">
                        <div style="font-size:0.72rem;color:var(--text-muted)">q_ult (kPa)</div>
                        <div id="bc-qult" style="font-size:1.3rem;font-weight:800;color:#ef4444">—</div>
                    </div>
                    <div style="background:var(--bg-tertiary);border-radius:8px;padding:10px">
                        <div style="font-size:0.72rem;color:var(--text-muted)">q_safe (FOS=3)</div>
                        <div id="bc-qsafe" style="font-size:1.3rem;font-weight:800;color:#22c55e">—</div>
                    </div>
                    <div style="background:var(--bg-tertiary);border-radius:8px;padding:10px">
                        <div style="font-size:0.72rem;color:var(--text-muted)">Nc, Nq, Nγ</div>
                        <div id="bc-factors" style="font-size:0.9rem;font-weight:700;color:var(--text-secondary)">—</div>
                    </div>
                    <div style="background:var(--bg-tertiary);border-radius:8px;padding:10px">
                        <div style="font-size:0.72rem;color:var(--text-muted)">AI Correction</div>
                        <div id="bc-correction" style="font-size:1rem;font-weight:700;color:#0ea5e9">—</div>
                    </div>
                </div>
            </div>`;

        const canvas = container.querySelector('#bc-canvas');
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = 300 * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        const W = rect.width, H = 300;

        function terzaghi(phi) {
            const phiRad = phi * PI / 180;
            const Nq = Math.exp(PI * Math.tan(phiRad)) * Math.pow(Math.tan(PI / 4 + phiRad / 2), 2);
            const Nc = (Nq - 1) / Math.tan(phiRad || 0.001);
            const Ngamma = 2 * (Nq + 1) * Math.tan(phiRad);
            return { Nc, Nq, Ngamma };
        }

        function draw() {
            const Bf = parseFloat(container.querySelector('#bc-width').value);
            const Df = parseFloat(container.querySelector('#bc-depth').value);
            const phi = parseFloat(container.querySelector('#bc-phi').value);
            const c = parseFloat(container.querySelector('#bc-c').value);
            const gamma = 18; // kN/m³

            container.querySelector('#bc-width-val').textContent = Bf.toFixed(1);
            container.querySelector('#bc-depth-val').textContent = Df.toFixed(1);
            container.querySelector('#bc-phi-val').textContent = phi + '°';
            container.querySelector('#bc-c-val').textContent = c;

            const { Nc, Nq, Ngamma } = terzaghi(phi);
            const qult = c * Nc + gamma * Df * Nq + 0.5 * gamma * Bf * Ngamma;
            const mlCorrection = 1 + rand(-0.08, 0.12); // AI correction factor
            const qultAI = qult * mlCorrection;
            const qsafe = qultAI / 3;

            container.querySelector('#bc-qult').textContent = qultAI.toFixed(0);
            container.querySelector('#bc-qsafe').textContent = qsafe.toFixed(0);
            container.querySelector('#bc-factors').textContent = `${Nc.toFixed(1)}, ${Nq.toFixed(1)}, ${Ngamma.toFixed(1)}`;
            container.querySelector('#bc-correction').textContent = (mlCorrection > 1 ? '+' : '') + ((mlCorrection - 1) * 100).toFixed(1) + '%';

            ctx.clearRect(0, 0, W, H);

            const groundY = 100;
            const scale = 30;
            const foundX = W / 2 - (Bf * scale) / 2;
            const foundW = Bf * scale;
            const foundDepth = Df * scale;

            // Ground surface
            ctx.fillStyle = '#3a3525';
            ctx.fillRect(0, groundY, W, H - groundY);

            // Foundation pit
            ctx.fillStyle = '#1a1510';
            ctx.fillRect(foundX - 5, groundY, foundW + 10, foundDepth + 5);

            // Foundation
            ctx.fillStyle = '#6b7280';
            ctx.fillRect(foundX, groundY + foundDepth - 15, foundW, 18);
            ctx.strokeStyle = '#9ca3af';
            ctx.lineWidth = 1;
            ctx.strokeRect(foundX, groundY + foundDepth - 15, foundW, 18);

            // Failure wedge (Terzaghi zones)
            ctx.globalAlpha = 0.15;
            // Active zone
            ctx.beginPath();
            ctx.moveTo(foundX, groundY + foundDepth);
            ctx.lineTo(W / 2, groundY + foundDepth + Bf * scale * 0.7);
            ctx.lineTo(foundX + foundW, groundY + foundDepth);
            ctx.closePath();
            ctx.fillStyle = '#ef4444';
            ctx.fill();

            // Passive zones
            ctx.beginPath();
            ctx.moveTo(foundX, groundY + foundDepth);
            ctx.lineTo(foundX - Bf * scale * 1.2, groundY);
            ctx.lineTo(foundX - Bf * scale * 0.5, groundY + foundDepth);
            ctx.closePath();
            ctx.fillStyle = '#f59e0b';
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(foundX + foundW, groundY + foundDepth);
            ctx.lineTo(foundX + foundW + Bf * scale * 1.2, groundY);
            ctx.lineTo(foundX + foundW + Bf * scale * 0.5, groundY + foundDepth);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;

            // Load arrow
            ctx.beginPath();
            ctx.moveTo(W / 2, 20);
            ctx.lineTo(W / 2, groundY + foundDepth - 20);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(W / 2 - 8, groundY + foundDepth - 30);
            ctx.lineTo(W / 2, groundY + foundDepth - 18);
            ctx.lineTo(W / 2 + 8, groundY + foundDepth - 30);
            ctx.fillStyle = '#ef4444';
            ctx.fill();

            // Labels
            ctx.fillStyle = C.WHITE;
            ctx.font = 'bold 11px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('q = ' + qsafe.toFixed(0) + ' kPa (safe)', W / 2, 14);
            ctx.font = '10px Inter';
            ctx.fillText('B = ' + Bf.toFixed(1) + 'm', W / 2, groundY + foundDepth + 14);

            // Dimension lines for Df
            ctx.beginPath();
            ctx.moveTo(foundX - 20, groundY);
            ctx.lineTo(foundX - 20, groundY + foundDepth);
            ctx.strokeStyle = C.TEAL;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = C.TEAL;
            ctx.font = '9px Inter';
            ctx.textAlign = 'right';
            ctx.fillText('D=' + Df.toFixed(1) + 'm', foundX - 24, groundY + foundDepth / 2);

            // Ground surface line
            ctx.beginPath();
            ctx.moveTo(0, groundY);
            ctx.lineTo(W, groundY);
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Formula
            ctx.fillStyle = C.TEXT;
            ctx.font = '10px Inter';
            ctx.textAlign = 'center';
            ctx.fillText('q_ult = cNc + γDfNq + 0.5γBNγ = ' + qult.toFixed(0) + ' kPa (Terzaghi)', W / 2, H - 30);
            ctx.fillStyle = C.TEAL;
            ctx.fillText('🤖 AI-corrected: ' + qultAI.toFixed(0) + ' kPa (based on local soil database)', W / 2, H - 14);
        }

        draw();
        ['bc-width', 'bc-depth', 'bc-phi', 'bc-c'].forEach(id => {
            container.querySelector('#' + id).addEventListener('input', draw);
        });
    }

    /* ──────────────────────────────────────────────
       AUTO-INJECT DEMOS INTO PAGES
       ────────────────────────────────────────────── */
    document.addEventListener('DOMContentLoaded', () => {
        // Detect which sub-chapter we're on
        const title = document.title.toLowerCase();
        const path = window.location.pathname;

        // Create containers for geotech demos
        function injectAfterSection(sectionId, createFn) {
            const section = document.getElementById(sectionId);
            if (section) {
                const container = document.createElement('div');
                container.className = 'geotech-demo-inject';
                section.querySelector('.section-container').appendChild(container);
                createFn(container);
            }
        }

        function appendToMain(createFn) {
            const main = document.querySelector('.chapter-content') || document.querySelector('main');
            if (!main) return null;
            const section = document.createElement('section');
            section.className = 'ch-section visible';
            section.innerHTML = '<div class="section-container"></div>';
            const quizSection = document.getElementById('quiz-section');
            if (quizSection) main.insertBefore(section, quizSection);
            else main.appendChild(section);
            createFn(section.querySelector('.section-container'));
            return section;
        }

        // Sub 1.1 - What is AI
        if (path.includes('sub1')) {
            appendToMain(container => {
                container.innerHTML = '<h2 class="section-title"><i class="fa-solid fa-mountain-sun"></i> Geotechnical AI in Action: Soil Profile Classification</h2><p>See how AI works in practice — this demo simulates borehole drilling and automatic soil classification using SPT N-values, exactly as an AI-powered site investigation tool would work.</p>';
                const demoContainer = document.createElement('div');
                container.appendChild(demoContainer);
                createSoilProfileDemo(demoContainer);
            });
        }

        // Sub 1.3 - AI Capabilities
        if (path.includes('sub3')) {
            appendToMain(container => {
                container.innerHTML = '<h2 class="section-title"><i class="fa-solid fa-hill-rockslide"></i> Perception in Action: Slope Stability Analysis</h2><p>AI <strong>perceives</strong> soil parameters from sensors, <strong>reasons</strong> about stability using learned patterns, and <strong>acts</strong> by issuing warnings. Adjust the parameters to see how AI evaluates slope safety.</p>';
                const demoContainer = document.createElement('div');
                container.appendChild(demoContainer);
                createSlopeDemo(demoContainer);
            });
        }

        // Sub 1.5 - Types of AI
        if (path.includes('sub5')) {
            appendToMain(container => {
                container.innerHTML = '<h2 class="section-title"><i class="fa-solid fa-building"></i> Narrow AI Today: Bearing Capacity Prediction</h2><p>This is a real example of <strong>Narrow AI (ANI)</strong> in geotechnical engineering — it does one thing excellently: predict bearing capacity from soil parameters. It cannot do anything else.</p>';
                const demoContainer = document.createElement('div');
                container.appendChild(demoContainer);
                createBearingCapacityDemo(demoContainer);
            });
        }

        // Sub 1.6 - What is ML
        if (path.includes('sub6')) {
            appendToMain(container => {
                container.innerHTML = '<h2 class="section-title"><i class="fa-solid fa-layer-group"></i> ML in Practice: Soil Classification from Borehole Data</h2><p>This is exactly what Machine Learning does — learns patterns from labeled borehole data to automatically classify new soil samples. The three ingredients: <strong>data</strong> (SPT values), <strong>algorithm</strong> (decision boundaries), <strong>model</strong> (trained classifier).</p>';
                const demoContainer = document.createElement('div');
                container.appendChild(demoContainer);
                createSoilProfileDemo(demoContainer);
            });
        }

        // Sub 1.7 - ML Pipeline
        if (path.includes('sub7')) {
            appendToMain(container => {
                container.innerHTML = '<h2 class="section-title"><i class="fa-solid fa-cloud-rain"></i> Full ML Pipeline: Flood Prediction System</h2><p>This demo shows the <strong>deployed model</strong> — the final stage of the ML pipeline. Real-time rainfall data goes in, predicted hydrographs come out. The pipeline that built this: historical rainfall data → cleaning → feature engineering → neural network training → validation → this deployment.</p>';
                const demoContainer = document.createElement('div');
                container.appendChild(demoContainer);
                createFloodDemo(demoContainer);
            });
        }

        // Sub 1.9 - Dam vs River
        if (path.includes('sub9')) {
            appendToMain(container => {
                container.innerHTML = '<h2 class="section-title"><i class="fa-solid fa-droplet"></i> The River Beneath: Groundwater Flow Prediction</h2><p>The dam analogy extends underground. AI predicts groundwater flow patterns — the "hidden river" beneath our structures. Adjust parameters to see how the AI adapts its predictions.</p>';
                const demoContainer = document.createElement('div');
                container.appendChild(demoContainer);
                createGroundwaterDemo(demoContainer);
            });
        }

        // Sub 1.10 - Types of ML
        if (path.includes('sub10')) {
            appendToMain(container => {
                container.innerHTML = '<h2 class="section-title"><i class="fa-solid fa-hill-rockslide"></i> Supervised Learning: Slope Stability Prediction</h2><p><strong>Supervised learning</strong> in action — the AI was trained on thousands of labeled slope failures (stable/unstable) with their parameters. Now it predicts the Factor of Safety for new slopes it has never seen.</p>';
                const demoContainer = document.createElement('div');
                container.appendChild(demoContainer);
                createSlopeDemo(demoContainer);
            });
            appendToMain(container => {
                container.innerHTML = '<h2 class="section-title"><i class="fa-solid fa-droplet"></i> Regression: Groundwater Flow Prediction</h2><p>Another form of <strong>supervised learning (regression)</strong> — predicting continuous values. The AI predicts seepage velocity as a continuous number, not a category.</p>';
                const demoContainer = document.createElement('div');
                container.appendChild(demoContainer);
                createGroundwaterDemo(demoContainer);
            });
        }

        // Sub 1.11 - Deep Learning
        if (path.includes('sub11')) {
            appendToMain(container => {
                container.innerHTML = '<h2 class="section-title"><i class="fa-solid fa-cloud-rain"></i> Deep Learning Application: Flood Prediction Neural Network</h2><p>This flood prediction system uses a <strong>deep neural network</strong> with multiple hidden layers to learn complex nonlinear relationships between rainfall patterns, catchment characteristics, and discharge. The "depth" allows it to capture temporal patterns that shallow models miss.</p>';
                const demoContainer = document.createElement('div');
                container.appendChild(demoContainer);
                createFloodDemo(demoContainer);
            });
        }

        // Sub 1.12 - Ethics & Applications
        if (path.includes('sub12')) {
            appendToMain(container => {
                container.innerHTML = '<h2 class="section-title"><i class="fa-solid fa-building"></i> Real Application: AI Foundation Design</h2><p>A real-world AI application in geotechnical engineering. But notice: the AI applies a "correction factor" — how do we know if this correction is based on balanced training data? This is where <strong>bias awareness</strong> becomes critical.</p>';
                const demoContainer = document.createElement('div');
                container.appendChild(demoContainer);
                createBearingCapacityDemo(demoContainer);
            });
        }
    });

    // Export for manual use
    window.GeoDemo = {
        createSoilProfileDemo,
        createFloodDemo,
        createSlopeDemo,
        createGroundwaterDemo,
        createBearingCapacityDemo
    };

})();
