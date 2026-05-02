/**
 * Chapter 4 — CNNs: Infrastructure Vision Interactive Demos
 * Auto-injected into sub-chapters based on URL path.
 *
 * Demos:
 * 1. PixelInspector — explore image as a number grid, see pixel values, channels
 * 2. ConvolutionVisualizer — apply edge/blur/sharpen kernels to a concrete-like surface
 * 3. PoolingDemo — max vs avg pooling on a grid, see information loss
 * 4. CNNArchitectureBuilder — drag layers to build a CNN, see param counts
 * 5. IoUCalculator — interactive bounding box overlap for object detection
 * 6. SegmentationPainter — paint pixel-level damage masks, compute area
 * 7. GradCAMSimulator — simulated heatmap overlay on a crack image
 * 8. TrainingMonitor — animated loss/accuracy curves for crack classifier
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
       DEMO 1: Pixel Inspector — Image as Data
       ══════════════════════════════════════════════ */
    function createPixelInspectorDemo(container) {
        const { section, container: wrap } = createDemoSection(
            'Interactive Demo: Image as Numbers',
            'fa-solid fa-image',
            'Every pixel is a number. Hover over the "concrete surface" grid to see RGB values. This is exactly how a CNN receives a photo from a drone inspection.'
        );

        const canvas = ce('canvas', '', '');
        canvas.style.cssText = 'width:100%;cursor:crosshair;border-radius:8px;display:block';
        const W = 700, H = 380;
        const gridSize = 16;
        let pixels = [];
        let hoverCell = null;

        function generateSurface() {
            pixels = [];
            for (let r = 0; r < gridSize; r++) {
                const row = [];
                for (let c = 0; c < gridSize; c++) {
                    const base = 120 + Math.random() * 60;
                    const isCrack = (Math.abs(r - gridSize / 2) + Math.abs(c - r * 0.3 - 3)) < 2.5;
                    const cr = isCrack ? 30 + Math.random() * 20 : base + Math.random() * 15;
                    const cg = isCrack ? 25 + Math.random() * 15 : base - 5 + Math.random() * 10;
                    const cb = isCrack ? 20 + Math.random() * 10 : base - 10 + Math.random() * 10;
                    row.push({ r: Math.floor(cr), g: Math.floor(cg), b: Math.floor(cb) });
                }
                pixels.push(row);
            }
        }

        function draw() {
            const ctx = initCanvas(canvas, W, H);
            ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);

            const imgSize = Math.min(H - 40, W * 0.45);
            const cellW = imgSize / gridSize;
            const startX = 20, startY = (H - imgSize) / 2;

            // Draw image grid
            for (let r = 0; r < gridSize; r++) {
                for (let c = 0; c < gridSize; c++) {
                    const p = pixels[r][c];
                    ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
                    ctx.fillRect(startX + c * cellW, startY + r * cellW, cellW - 1, cellW - 1);

                    if (hoverCell && hoverCell.r === r && hoverCell.c === c) {
                        ctx.strokeStyle = colors.teal; ctx.lineWidth = 2;
                        ctx.strokeRect(startX + c * cellW, startY + r * cellW, cellW - 1, cellW - 1);
                    }
                }
            }

            // Number matrix (right side)
            const matX = startX + imgSize + 40;
            const matW = W - matX - 20;
            ctx.fillStyle = colors.muted; ctx.font = '12px Inter'; ctx.textAlign = 'center';
            ctx.fillText('← Red Channel Values →', matX + matW / 2, startY - 8);

            const showSize = 8;
            const startR = hoverCell ? Math.max(0, hoverCell.r - showSize / 2) : 0;
            const startC = hoverCell ? Math.max(0, hoverCell.c - showSize / 2) : 0;
            const nCellW = Math.min(matW / showSize, cellW);

            for (let r = 0; r < Math.min(showSize, gridSize); r++) {
                for (let c = 0; c < Math.min(showSize, gridSize); c++) {
                    const pr = Math.min(startR + r, gridSize - 1);
                    const pc = Math.min(startC + c, gridSize - 1);
                    const p = pixels[pr][pc];
                    const isHover = hoverCell && hoverCell.r === pr && hoverCell.c === pc;
                    ctx.fillStyle = isHover ? colors.teal : colors.bg;
                    ctx.fillRect(matX + c * nCellW, startY + r * nCellW, nCellW - 1, nCellW - 1);
                    ctx.fillStyle = isHover ? '#000' : `rgb(${Math.floor(p.r * 1.5)},${Math.floor(p.g * 0.5)},${Math.floor(p.b * 0.5)})`;
                    ctx.font = `${Math.max(9, nCellW * 0.35)}px JetBrains Mono`;
                    ctx.textAlign = 'center';
                    ctx.fillText(p.r, matX + c * nCellW + nCellW / 2, startY + r * nCellW + nCellW / 2 + 4);
                }
            }

            // Info panel
            if (hoverCell) {
                const p = pixels[hoverCell.r][hoverCell.c];
                const infoY = H - 35;
                ctx.fillStyle = colors.text; ctx.font = '13px JetBrains Mono'; ctx.textAlign = 'left';
                ctx.fillText(`Pixel [${hoverCell.r}, ${hoverCell.c}]`, 20, infoY);
                ctx.fillStyle = '#ff6b6b'; ctx.fillText(`R:${p.r}`, 150, infoY);
                ctx.fillStyle = '#6bff6b'; ctx.fillText(`G:${p.g}`, 210, infoY);
                ctx.fillStyle = '#6b9fff'; ctx.fillText(`B:${p.b}`, 270, infoY);
                const isCrack = p.r < 60;
                ctx.fillStyle = isCrack ? colors.red : colors.teal;
                ctx.fillText(isCrack ? '← Dark = possible crack' : '← Light = intact concrete', 330, infoY);
            }
        }

        canvas.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = W / rect.width, scaleY = H / rect.height;
            const mx = (e.clientX - rect.left) * scaleX, my = (e.clientY - rect.top) * scaleY;
            const imgSize = Math.min(H - 40, W * 0.45);
            const cellW = imgSize / gridSize;
            const startX = 20, startY = (H - imgSize) / 2;
            const c = Math.floor((mx - startX) / cellW);
            const r = Math.floor((my - startY) / cellW);
            if (c >= 0 && c < gridSize && r >= 0 && r < gridSize) {
                hoverCell = { r, c };
            } else { hoverCell = null; }
            draw();
        });

        generateSurface();
        wrap.appendChild(canvas);
        wrap.appendChild(makeBtn('New Surface', 'fa-solid fa-rotate', () => { generateSurface(); draw(); }));
        container.appendChild(section);
        draw();
    }

    /* ══════════════════════════════════════════════
       DEMO 2: Convolution Visualizer
       ══════════════════════════════════════════════ */
    function createConvolutionDemo(container) {
        const { section, container: wrap } = createDemoSection(
            'Interactive Demo: Convolution on Concrete Surfaces',
            'fa-solid fa-border-top-left',
            'Apply edge-detection, blur, and sharpen filters to a simulated concrete surface. This is exactly how CNNs find cracks — early layers learn edge kernels automatically.'
        );

        const canvas = ce('canvas', '', '');
        canvas.style.cssText = 'width:100%;border-radius:8px;display:block';
        const W = 700, H = 380;
        const gridN = 12;
        let imageGrid = [];
        let outputGrid = [];
        let activeKernel = 'edge_h';

        const kernels = {
            edge_h: { name: 'Horizontal Edge', k: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]] },
            edge_v: { name: 'Vertical Edge', k: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]] },
            sharpen: { name: 'Sharpen', k: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]] },
            blur: { name: 'Blur (3×3 avg)', k: [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]] },
            emboss: { name: 'Emboss', k: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]] }
        };

        function generateImage() {
            imageGrid = [];
            for (let r = 0; r < gridN; r++) {
                const row = [];
                for (let c = 0; c < gridN; c++) {
                    let v = 140 + Math.random() * 60;
                    // Add a crack pattern
                    if (Math.abs(c - r * 0.8 - 2) < 1) v = 30 + Math.random() * 20;
                    if (Math.abs(r - 7) < 1 && c > 4 && c < 10) v = 35 + Math.random() * 15;
                    row.push(Math.floor(v));
                }
                imageGrid.push(row);
            }
            applyKernel();
        }

        function applyKernel() {
            const k = kernels[activeKernel].k;
            outputGrid = [];
            for (let r = 0; r < gridN; r++) {
                const row = [];
                for (let c = 0; c < gridN; c++) {
                    let sum = 0;
                    for (let kr = -1; kr <= 1; kr++) {
                        for (let kc = -1; kc <= 1; kc++) {
                            const pr = Math.max(0, Math.min(gridN - 1, r + kr));
                            const pc = Math.max(0, Math.min(gridN - 1, c + kc));
                            sum += imageGrid[pr][pc] * k[kr + 1][kc + 1];
                        }
                    }
                    row.push(Math.max(0, Math.min(255, Math.floor(sum))));
                }
                outputGrid.push(row);
            }
        }

        function draw() {
            const ctx = initCanvas(canvas, W, H);
            ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);

            const cellSz = Math.floor((H - 80) / gridN);
            const gapX = 30;

            // Input grid
            const inX = 20, inY = 40;
            ctx.fillStyle = colors.muted; ctx.font = '12px Inter'; ctx.textAlign = 'center';
            ctx.fillText('Input (Concrete)', inX + gridN * cellSz / 2, inY - 8);

            for (let r = 0; r < gridN; r++) {
                for (let c = 0; c < gridN; c++) {
                    const v = imageGrid[r][c];
                    ctx.fillStyle = `rgb(${v},${v},${v})`;
                    ctx.fillRect(inX + c * cellSz, inY + r * cellSz, cellSz - 1, cellSz - 1);
                }
            }

            // Kernel display
            const kx = inX + gridN * cellSz + gapX;
            const ky = H / 2 - 50;
            ctx.fillStyle = colors.text; ctx.font = 'bold 11px Inter';
            ctx.fillText('Kernel', kx + 45, ky - 8);
            const k = kernels[activeKernel].k;
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    const val = k[r][c];
                    ctx.fillStyle = val > 0 ? `rgba(0,212,170,${Math.min(1, Math.abs(val) * 0.3)})` : val < 0 ? `rgba(239,68,68,${Math.min(1, Math.abs(val) * 0.3)})` : colors.bg;
                    ctx.fillRect(kx + c * 30, ky + r * 30, 28, 28);
                    ctx.fillStyle = colors.text; ctx.font = '10px JetBrains Mono';
                    ctx.fillText(val === Math.floor(val) ? val.toString() : val.toFixed(2), kx + c * 30 + 14, ky + r * 30 + 17);
                }
            }

            // Arrow
            const arrowX = kx + 100;
            ctx.strokeStyle = colors.teal; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(arrowX, H / 2); ctx.lineTo(arrowX + 30, H / 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(arrowX + 25, H / 2 - 5); ctx.lineTo(arrowX + 30, H / 2); ctx.lineTo(arrowX + 25, H / 2 + 5); ctx.fill();

            // Output grid
            const outX = arrowX + 45;
            ctx.fillStyle = colors.muted; ctx.font = '12px Inter';
            ctx.fillText('Feature Map', outX + gridN * cellSz / 2, inY - 8);

            for (let r = 0; r < gridN; r++) {
                for (let c = 0; c < gridN; c++) {
                    const v = outputGrid[r][c];
                    ctx.fillStyle = `rgb(${v},${v},${v})`;
                    ctx.fillRect(outX + c * cellSz, inY + r * cellSz, cellSz - 1, cellSz - 1);
                }
            }
        }

        generateImage();

        const btnRow = ce('div', '', '');
        btnRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px';
        Object.entries(kernels).forEach(([key, { name }]) => {
            const btn = makeBtn(name, 'fa-solid fa-filter', () => {
                activeKernel = key;
                applyKernel();
                draw();
                btnRow.querySelectorAll('button').forEach(b => b.style.borderColor = colors.border);
                btn.style.borderColor = colors.teal;
            });
            if (key === activeKernel) btn.style.borderColor = colors.teal;
            btnRow.appendChild(btn);
        });

        const resetBtn = makeBtn('New Surface', 'fa-solid fa-rotate', () => { generateImage(); draw(); });

        wrap.appendChild(btnRow); wrap.appendChild(canvas); wrap.appendChild(resetBtn);
        container.appendChild(section);
        draw();
    }

    /* ══════════════════════════════════════════════
       DEMO 3: Pooling Demo
       ══════════════════════════════════════════════ */
    function createPoolingDemo(container) {
        const { section, container: wrap } = createDemoSection(
            'Interactive Demo: Max Pooling vs Average Pooling',
            'fa-solid fa-table-cells',
            'Pooling reduces spatial size but keeps important features. Max pooling preserves crack edges (bright features). Average pooling smooths everything. Try both on this concrete patch.'
        );

        const canvas = ce('canvas', '', '');
        canvas.style.cssText = 'width:100%;border-radius:8px;display:block';
        const W = 700, H = 350;
        const gridN = 8;
        let imageGrid = [];
        let poolType = 'max';
        let poolSize = 2;

        function generate() {
            imageGrid = [];
            for (let r = 0; r < gridN; r++) {
                const row = [];
                for (let c = 0; c < gridN; c++) {
                    let v = 100 + Math.random() * 80;
                    if (r === 3 && c >= 2 && c <= 6) v = 220 + Math.random() * 35; // crack edge (bright)
                    if (r === 4 && c >= 1 && c <= 5) v = 15 + Math.random() * 20; // crack dark
                    row.push(Math.floor(v));
                }
                imageGrid.push(row);
            }
        }

        function pool() {
            const outN = gridN / poolSize;
            const out = [];
            for (let r = 0; r < outN; r++) {
                const row = [];
                for (let c = 0; c < outN; c++) {
                    let vals = [];
                    for (let pr = 0; pr < poolSize; pr++) {
                        for (let pc = 0; pc < poolSize; pc++) {
                            vals.push(imageGrid[r * poolSize + pr][c * poolSize + pc]);
                        }
                    }
                    row.push(poolType === 'max' ? Math.max(...vals) : Math.floor(vals.reduce((s, v) => s + v, 0) / vals.length));
                }
                out.push(row);
            }
            return out;
        }

        function draw() {
            const ctx = initCanvas(canvas, W, H);
            ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);

            const cellSz = Math.floor((H - 60) / gridN);
            const inX = 30, inY = 40;

            // Input
            ctx.fillStyle = colors.muted; ctx.font = '12px Inter'; ctx.textAlign = 'center';
            ctx.fillText(`Input ${gridN}×${gridN}`, inX + gridN * cellSz / 2, inY - 8);

            for (let r = 0; r < gridN; r++) {
                for (let c = 0; c < gridN; c++) {
                    const v = imageGrid[r][c];
                    ctx.fillStyle = `rgb(${v},${v},${v})`;
                    ctx.fillRect(inX + c * cellSz, inY + r * cellSz, cellSz - 1, cellSz - 1);
                    ctx.fillStyle = v > 150 ? '#000' : '#fff';
                    ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'center';
                    ctx.fillText(v, inX + c * cellSz + cellSz / 2, inY + r * cellSz + cellSz / 2 + 3);
                }
            }

            // Pool grid overlay
            ctx.strokeStyle = colors.teal + '60'; ctx.lineWidth = 2;
            for (let r = 0; r < gridN; r += poolSize) {
                for (let c = 0; c < gridN; c += poolSize) {
                    ctx.strokeRect(inX + c * cellSz, inY + r * cellSz, poolSize * cellSz - 1, poolSize * cellSz - 1);
                }
            }

            // Arrow
            const arrowX = inX + gridN * cellSz + 30;
            ctx.strokeStyle = colors.teal; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(arrowX, H / 2); ctx.lineTo(arrowX + 40, H / 2); ctx.stroke();
            ctx.fillStyle = colors.teal;
            ctx.beginPath(); ctx.moveTo(arrowX + 35, H / 2 - 5); ctx.lineTo(arrowX + 40, H / 2); ctx.lineTo(arrowX + 35, H / 2 + 5); ctx.fill();
            ctx.fillStyle = colors.text; ctx.font = '11px Inter'; ctx.textAlign = 'center';
            ctx.fillText(poolType === 'max' ? 'Max' : 'Avg', arrowX + 20, H / 2 - 10);
            ctx.fillText(`${poolSize}×${poolSize}`, arrowX + 20, H / 2 + 20);

            // Output
            const outGrid = pool();
            const outN = outGrid.length;
            const outCellSz = cellSz * (gridN / outN) * 0.8;
            const outX = arrowX + 60;
            const outY = (H - outN * outCellSz) / 2;

            ctx.fillStyle = colors.muted; ctx.font = '12px Inter';
            ctx.fillText(`Output ${outN}×${outN}`, outX + outN * outCellSz / 2, outY - 8);

            for (let r = 0; r < outN; r++) {
                for (let c = 0; c < outN; c++) {
                    const v = outGrid[r][c];
                    ctx.fillStyle = `rgb(${v},${v},${v})`;
                    ctx.fillRect(outX + c * outCellSz, outY + r * outCellSz, outCellSz - 1, outCellSz - 1);
                    ctx.fillStyle = v > 150 ? '#000' : '#fff';
                    ctx.font = '11px JetBrains Mono'; ctx.textAlign = 'center';
                    ctx.fillText(v, outX + c * outCellSz + outCellSz / 2, outY + r * outCellSz + outCellSz / 2 + 4);
                }
            }

            statusEl.textContent = `${poolType === 'max' ? 'Max pooling preserves the brightest (edge) values — cracks survive!' : 'Average pooling smooths values — crack edges get blurred away.'}`;
        }

        generate();

        const controls = ce('div', '', '');
        controls.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px';
        const maxBtn = makeBtn('Max Pool', 'fa-solid fa-arrow-up', () => { poolType = 'max'; draw(); });
        const avgBtn = makeBtn('Avg Pool', 'fa-solid fa-minus', () => { poolType = 'avg'; draw(); });
        controls.appendChild(maxBtn); controls.appendChild(avgBtn);
        controls.appendChild(makeBtn('New Grid', 'fa-solid fa-rotate', () => { generate(); draw(); }));

        const statusEl = ce('div', '', '');
        statusEl.style.cssText = `font-size:.82rem;color:${colors.muted};margin-top:12px`;

        wrap.appendChild(controls); wrap.appendChild(canvas); wrap.appendChild(statusEl);
        container.appendChild(section);
        draw();
    }

    /* ══════════════════════════════════════════════
       DEMO 4: CNN Architecture Builder
       ══════════════════════════════════════════════ */
    function createArchitectureDemo(container) {
        const { section, container: wrap } = createDemoSection(
            'Interactive Demo: Build a Crack Classifier CNN',
            'fa-solid fa-layer-group',
            'Add layers to build a CNN for crack classification. Watch how the spatial size shrinks and parameters grow. A typical crack classifier uses 3-5 conv blocks + a dense head.'
        );

        const canvas = ce('canvas', '', '');
        canvas.style.cssText = 'width:100%;border-radius:8px;display:block';
        const W = 700, H = 320;

        let layers = [
            { type: 'input', w: 224, h: 224, c: 3, params: 0 },
            { type: 'conv', w: 224, h: 224, c: 16, k: 3, params: 16 * 3 * 3 * 3 + 16 },
            { type: 'pool', w: 112, h: 112, c: 16, params: 0 },
            { type: 'conv', w: 112, h: 112, c: 32, k: 3, params: 32 * 16 * 3 * 3 + 32 },
            { type: 'pool', w: 56, h: 56, c: 32, params: 0 },
        ];

        function addConv() {
            const last = layers[layers.length - 1];
            const newC = Math.min(last.c * 2, 256);
            layers.push({ type: 'conv', w: last.w, h: last.h, c: newC, k: 3, params: newC * last.c * 9 + newC });
            draw();
        }
        function addPool() {
            const last = layers[layers.length - 1];
            if (last.w <= 2) return;
            layers.push({ type: 'pool', w: Math.floor(last.w / 2), h: Math.floor(last.h / 2), c: last.c, params: 0 });
            draw();
        }
        function addDense() {
            const last = layers[layers.length - 1];
            const inSize = last.type === 'dense' ? last.c : last.w * last.h * last.c;
            layers.push({ type: 'dense', w: 1, h: 1, c: 128, params: inSize * 128 + 128 });
            draw();
        }
        function addOutput() {
            const last = layers[layers.length - 1];
            const inSize = last.type === 'dense' ? last.c : last.w * last.h * last.c;
            layers.push({ type: 'output', w: 1, h: 1, c: 2, params: inSize * 2 + 2 });
            draw();
        }
        function resetLayers() {
            layers = [{ type: 'input', w: 224, h: 224, c: 3, params: 0 }];
            draw();
        }

        function draw() {
            const ctx = initCanvas(canvas, W, H);
            ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);

            const margin = 40;
            const layerW = Math.min(60, (W - margin * 2) / layers.length - 8);
            const maxH = H - 100;

            const typeColors = {
                input: '#94a3b8', conv: colors.teal, pool: colors.cyan,
                dense: colors.amber, output: colors.purple
            };

            let totalParams = 0;
            layers.forEach((l, i) => {
                totalParams += l.params;
                const x = margin + i * (layerW + 8);
                const normH = l.type === 'dense' || l.type === 'output'
                    ? 30 + l.c * 0.3
                    : Math.max(20, (l.w / 224) * maxH * 0.8);
                const y = (H - 40) / 2 - normH / 2;

                ctx.fillStyle = typeColors[l.type] + '30';
                ctx.strokeStyle = typeColors[l.type];
                ctx.lineWidth = 1.5;
                ctx.fillRect(x, y, layerW, normH);
                ctx.strokeRect(x, y, layerW, normH);

                // Connection line
                if (i > 0) {
                    const prevX = margin + (i - 1) * (layerW + 8) + layerW;
                    ctx.beginPath(); ctx.strokeStyle = '#ffffff15'; ctx.lineWidth = 1;
                    ctx.moveTo(prevX, (H - 40) / 2); ctx.lineTo(x, (H - 40) / 2); ctx.stroke();
                }

                // Labels
                ctx.fillStyle = typeColors[l.type]; ctx.font = '9px Inter'; ctx.textAlign = 'center';
                ctx.fillText(l.type.toUpperCase(), x + layerW / 2, y + normH + 14);
                if (l.type !== 'dense' && l.type !== 'output') {
                    ctx.fillStyle = colors.muted; ctx.font = '8px JetBrains Mono';
                    ctx.fillText(`${l.w}×${l.h}`, x + layerW / 2, y - 14);
                    ctx.fillText(`×${l.c}`, x + layerW / 2, y - 4);
                } else {
                    ctx.fillStyle = colors.muted; ctx.font = '8px JetBrains Mono';
                    ctx.fillText(l.c.toString(), x + layerW / 2, y - 4);
                }
            });

            // Total params
            ctx.fillStyle = colors.text; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'left';
            ctx.fillText(`Total Parameters: ${totalParams.toLocaleString()}`, 20, H - 12);
            ctx.fillStyle = colors.muted; ctx.font = '11px Inter';
            ctx.fillText(`${layers.length} layers`, 300, H - 12);

            const hasOutput = layers.some(l => l.type === 'output');
            if (hasOutput) {
                ctx.fillStyle = colors.teal; ctx.font = 'bold 11px Inter';
                ctx.fillText(' Ready to classify: Crack / Intact', W - 250, H - 12);
            }
        }

        const controls = ce('div', '', '');
        controls.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px';
        controls.appendChild(makeBtn('+ Conv3×3', 'fa-solid fa-plus', addConv));
        controls.appendChild(makeBtn('+ MaxPool', 'fa-solid fa-compress', addPool));
        controls.appendChild(makeBtn('+ Dense', 'fa-solid fa-circle-nodes', addDense));
        controls.appendChild(makeBtn('+ Output(2)', 'fa-solid fa-bullseye', addOutput));
        controls.appendChild(makeBtn('Reset', 'fa-solid fa-rotate', resetLayers));

        wrap.appendChild(controls); wrap.appendChild(canvas);
        container.appendChild(section);
        draw();
    }

    /* ══════════════════════════════════════════════
       DEMO 5: IoU Calculator
       ══════════════════════════════════════════════ */
    function createIoUDemo(container) {
        const { section, container: wrap } = createDemoSection(
            'Interactive Demo: IoU — Bounding Box Accuracy',
            'fa-solid fa-crosshairs',
            'Drag the predicted box (teal) over the ground truth (red) to see how IoU (Intersection over Union) measures detection quality. IoU ≥ 0.5 = correct detection in most benchmarks.'
        );

        const canvas = ce('canvas', '', '');
        canvas.style.cssText = 'width:100%;cursor:grab;border-radius:8px;display:block';
        const W = 700, H = 380;

        const gtBox = { x: 200, y: 100, w: 200, h: 160 }; // ground truth
        const predBox = { x: 280, y: 130, w: 180, h: 150 }; // predicted
        let dragging = false, dragOff = { x: 0, y: 0 };

        function computeIoU() {
            const x1 = Math.max(gtBox.x, predBox.x);
            const y1 = Math.max(gtBox.y, predBox.y);
            const x2 = Math.min(gtBox.x + gtBox.w, predBox.x + predBox.w);
            const y2 = Math.min(gtBox.y + gtBox.h, predBox.y + predBox.h);
            const interW = Math.max(0, x2 - x1);
            const interH = Math.max(0, y2 - y1);
            const intersection = interW * interH;
            const union = gtBox.w * gtBox.h + predBox.w * predBox.h - intersection;
            return union > 0 ? intersection / union : 0;
        }

        function draw() {
            const ctx = initCanvas(canvas, W, H);
            ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);

            // Simulated bridge deck background
            for (let y = 0; y < H; y += 8) {
                for (let x = 0; x < W; x += 8) {
                    const v = 40 + Math.random() * 20;
                    ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
                    ctx.fillRect(x, y, 7, 7);
                }
            }

            // Crack pattern under GT
            ctx.strokeStyle = '#33333380'; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(gtBox.x + 20, gtBox.y + 30);
            for (let i = 1; i <= 8; i++) {
                ctx.lineTo(gtBox.x + 20 + i * 20, gtBox.y + 30 + Math.sin(i) * 15);
            }
            ctx.stroke();

            // Intersection area
            const x1 = Math.max(gtBox.x, predBox.x);
            const y1 = Math.max(gtBox.y, predBox.y);
            const x2 = Math.min(gtBox.x + gtBox.w, predBox.x + predBox.w);
            const y2 = Math.min(gtBox.y + gtBox.h, predBox.y + predBox.h);
            if (x2 > x1 && y2 > y1) {
                ctx.fillStyle = 'rgba(0,212,170,0.15)';
                ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
            }

            // Ground truth box
            ctx.strokeStyle = colors.red; ctx.lineWidth = 3; ctx.setLineDash([8, 4]);
            ctx.strokeRect(gtBox.x, gtBox.y, gtBox.w, gtBox.h); ctx.setLineDash([]);
            ctx.fillStyle = colors.red; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'left';
            ctx.fillText('Ground Truth', gtBox.x, gtBox.y - 8);

            // Predicted box
            ctx.strokeStyle = colors.teal; ctx.lineWidth = 3;
            ctx.strokeRect(predBox.x, predBox.y, predBox.w, predBox.h);
            ctx.fillStyle = colors.teal; ctx.fillText('Predicted', predBox.x, predBox.y - 8);

            // IoU display
            const iou = computeIoU();
            const iouColor = iou >= 0.5 ? colors.teal : iou >= 0.3 ? colors.amber : colors.red;
            ctx.fillStyle = '#0a0a0fcc'; ctx.fillRect(W - 220, 15, 200, 70);
            ctx.strokeStyle = iouColor; ctx.lineWidth = 1; ctx.strokeRect(W - 220, 15, 200, 70);
            ctx.fillStyle = colors.text; ctx.font = '12px Inter'; ctx.textAlign = 'center';
            ctx.fillText('Intersection over Union', W - 120, 35);
            ctx.fillStyle = iouColor; ctx.font = 'bold 28px JetBrains Mono';
            ctx.fillText(iou.toFixed(3), W - 120, 68);
            ctx.fillStyle = colors.muted; ctx.font = '10px Inter';
            ctx.fillText(iou >= 0.5 ? ' Detection accepted' : ' Too low', W - 120, 82);
        }

        canvas.addEventListener('mousedown', e => {
            const rect = canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (W / rect.width);
            const my = (e.clientY - rect.top) * (H / rect.height);
            if (mx >= predBox.x && mx <= predBox.x + predBox.w && my >= predBox.y && my <= predBox.y + predBox.h) {
                dragging = true;
                dragOff = { x: mx - predBox.x, y: my - predBox.y };
                canvas.style.cursor = 'grabbing';
            }
        });
        canvas.addEventListener('mousemove', e => {
            if (!dragging) return;
            const rect = canvas.getBoundingClientRect();
            predBox.x = Math.max(0, Math.min(W - predBox.w, (e.clientX - rect.left) * (W / rect.width) - dragOff.x));
            predBox.y = Math.max(0, Math.min(H - predBox.h, (e.clientY - rect.top) * (H / rect.height) - dragOff.y));
            draw();
        });
        canvas.addEventListener('mouseup', () => { dragging = false; canvas.style.cursor = 'grab'; });
        canvas.addEventListener('mouseleave', () => { dragging = false; canvas.style.cursor = 'grab'; });

        wrap.appendChild(canvas);
        container.appendChild(section);
        draw();
    }

    /* ══════════════════════════════════════════════
       DEMO 6: Segmentation Painter
       ══════════════════════════════════════════════ */
    function createSegmentationDemo(container) {
        const { section, container: wrap } = createDemoSection(
            'Interactive Demo: Pixel-Level Damage Segmentation',
            'fa-solid fa-puzzle-piece',
            'Paint damage pixels (click/drag) on the concrete surface. This simulates U-Net output — every pixel is classified as "damage" or "intact". The damage area is computed in real time.'
        );

        const canvas = ce('canvas', '', '');
        canvas.style.cssText = 'width:100%;cursor:crosshair;border-radius:8px;display:block';
        const W = 700, H = 380;
        const gridN = 28;
        let mask = [];
        let painting = false;
        let paintMode = 1; // 1 = damage, 0 = erase

        function initMask() {
            mask = Array.from({ length: gridN }, () => Array(gridN).fill(0));
            // Pre-paint some "predicted" damage
            for (let r = 10; r < 18; r++) {
                for (let c = 8; c < 20; c++) {
                    if (Math.abs(r - 14) + Math.abs(c - r * 0.6 - 5) < 4) mask[r][c] = 1;
                }
            }
        }

        function draw() {
            const ctx = initCanvas(canvas, W, H);
            ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);

            const cellSz = Math.floor(Math.min((W - 40) / gridN, (H - 50) / gridN));
            const startX = (W - gridN * cellSz) / 2;
            const startY = 30;

            // Concrete + mask
            for (let r = 0; r < gridN; r++) {
                for (let c = 0; c < gridN; c++) {
                    const v = 50 + Math.sin(r * 0.5) * 10 + Math.cos(c * 0.7) * 8 + Math.random() * 5;
                    const isDamage = mask[r][c];
                    if (isDamage) {
                        ctx.fillStyle = `rgba(239,68,68,0.5)`;
                    } else {
                        ctx.fillStyle = `rgb(${v + 30},${v + 32},${v + 35})`;
                    }
                    ctx.fillRect(startX + c * cellSz, startY + r * cellSz, cellSz - 1, cellSz - 1);
                }
            }

            // Stats
            const totalPixels = gridN * gridN;
            const damagePixels = mask.flat().filter(v => v === 1).length;
            const damagePct = (damagePixels / totalPixels * 100).toFixed(1);
            // Assume 1 pixel = 2mm (for a close-up photo)
            const pixelArea = 0.04; // cm²
            const areaEst = (damagePixels * pixelArea).toFixed(1);

            ctx.fillStyle = colors.text; ctx.font = '12px Inter'; ctx.textAlign = 'left';
            ctx.fillText(`Damage: ${damagePixels}/${totalPixels} pixels (${damagePct}%)`, 10, H - 12);
            ctx.fillStyle = colors.red;
            ctx.fillText(`Estimated area: ${areaEst} cm²`, 300, H - 12);
            ctx.fillStyle = colors.muted;
            ctx.fillText('(@ 2mm/pixel)', 480, H - 12);
        }

        function paintAt(mx, my) {
            const cellSz = Math.floor(Math.min((W - 40) / gridN, (H - 50) / gridN));
            const startX = (W - gridN * cellSz) / 2;
            const startY = 30;
            const c = Math.floor((mx - startX) / cellSz);
            const r = Math.floor((my - startY) / cellSz);
            if (r >= 0 && r < gridN && c >= 0 && c < gridN) {
                mask[r][c] = paintMode;
                draw();
            }
        }

        canvas.addEventListener('mousedown', e => {
            painting = true;
            const rect = canvas.getBoundingClientRect();
            paintAt((e.clientX - rect.left) * (W / rect.width), (e.clientY - rect.top) * (H / rect.height));
        });
        canvas.addEventListener('mousemove', e => {
            if (!painting) return;
            const rect = canvas.getBoundingClientRect();
            paintAt((e.clientX - rect.left) * (W / rect.width), (e.clientY - rect.top) * (H / rect.height));
        });
        canvas.addEventListener('mouseup', () => painting = false);
        canvas.addEventListener('mouseleave', () => painting = false);

        initMask();

        const controls = ce('div', '', '');
        controls.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px';
        controls.appendChild(makeBtn(' Paint Damage', 'fa-solid fa-paintbrush', () => { paintMode = 1; }));
        controls.appendChild(makeBtn(' Erase', 'fa-solid fa-eraser', () => { paintMode = 0; }));
        controls.appendChild(makeBtn('Clear All', 'fa-solid fa-rotate', () => { initMask(); draw(); }));

        wrap.appendChild(controls); wrap.appendChild(canvas);
        container.appendChild(section);
        draw();
    }

    /* ══════════════════════════════════════════════
       DEMO 7: Grad-CAM Simulator
       ══════════════════════════════════════════════ */
    function createGradCAMDemo(container) {
        const { section, container: wrap } = createDemoSection(
            'Interactive Demo: Grad-CAM — What Does the CNN See?',
            'fa-solid fa-microscope',
            'Grad-CAM highlights which regions the CNN uses for its decision. Hot (red) = high importance. Adjust the threshold to see how the attention shifts. This builds trust in AI-driven inspection reports.'
        );

        const canvas = ce('canvas', '', '');
        canvas.style.cssText = 'width:100%;border-radius:8px;display:block';
        const W = 700, H = 380;
        let opacity = 0.5;
        let crackPos = [];

        function generateCracks() {
            crackPos = [];
            // Main crack line
            for (let i = 0; i < 15; i++) {
                crackPos.push({
                    x: 150 + i * 28 + (Math.random() - 0.5) * 10,
                    y: 140 + Math.sin(i * 0.5) * 30 + (Math.random() - 0.5) * 8,
                    r: 15 + Math.random() * 25
                });
            }
            // Secondary crack
            for (let i = 0; i < 6; i++) {
                crackPos.push({
                    x: 250 + i * 15 + (Math.random() - 0.5) * 5,
                    y: 220 + i * 12 + (Math.random() - 0.5) * 5,
                    r: 10 + Math.random() * 15
                });
            }
        }

        function draw() {
            const ctx = initCanvas(canvas, W, H);

            // Concrete background
            for (let y = 0; y < H; y += 4) {
                for (let x = 0; x < W; x += 4) {
                    const v = 55 + Math.random() * 30;
                    ctx.fillStyle = `rgb(${v},${v + 2},${v + 5})`;
                    ctx.fillRect(x, y, 4, 4);
                }
            }

            // Draw cracks
            if (crackPos.length > 1) {
                ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(crackPos[0].x, crackPos[0].y);
                for (let i = 1; i < 15 && i < crackPos.length; i++) {
                    ctx.lineTo(crackPos[i].x, crackPos[i].y);
                }
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(crackPos[15] ? crackPos[15].x : 250, crackPos[15] ? crackPos[15].y : 220);
                for (let i = 16; i < crackPos.length; i++) {
                    ctx.lineTo(crackPos[i].x, crackPos[i].y);
                }
                ctx.stroke();
            }

            // Grad-CAM heatmap overlay
            crackPos.forEach(p => {
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
                grad.addColorStop(0, `rgba(239,68,68,${opacity})`);
                grad.addColorStop(0.5, `rgba(245,158,11,${opacity * 0.6})`);
                grad.addColorStop(1, `rgba(14,165,233,0)`);
                ctx.fillStyle = grad;
                ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
            });

            // Side-by-side labels
            ctx.fillStyle = '#0a0a0faa'; ctx.fillRect(0, 0, W, 30);
            ctx.fillStyle = colors.text; ctx.font = '13px Inter'; ctx.textAlign = 'center';
            ctx.fillText('Concrete Surface + Grad-CAM Attention Overlay', W / 2, 20);

            // Prediction badge
            ctx.fillStyle = '#0a0a0fcc'; ctx.fillRect(W - 200, H - 50, 190, 40);
            ctx.strokeStyle = colors.red; ctx.lineWidth = 1; ctx.strokeRect(W - 200, H - 50, 190, 40);
            ctx.fillStyle = colors.red; ctx.font = 'bold 14px Inter'; ctx.textAlign = 'center';
            ctx.fillText(' CRACKED (97.3%)', W - 105, H - 25);

            // Color bar
            const barX = 15, barY = H - 45, barW = 150, barH = 12;
            const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
            barGrad.addColorStop(0, 'rgba(14,165,233,0.8)');
            barGrad.addColorStop(0.5, 'rgba(245,158,11,0.8)');
            barGrad.addColorStop(1, 'rgba(239,68,68,0.8)');
            ctx.fillStyle = barGrad; ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = colors.muted; ctx.font = '10px Inter'; ctx.textAlign = 'left';
            ctx.fillText('Low', barX, barY - 4); ctx.textAlign = 'right';
            ctx.fillText('High', barX + barW, barY - 4);
            ctx.textAlign = 'center'; ctx.fillText('Attention', barX + barW / 2, barY + barH + 12);
        }

        generateCracks();

        const controls = ce('div', '', '');
        controls.style.cssText = 'margin-bottom:16px';
        controls.appendChild(makeSlider('Heatmap Opacity', 0, 1, opacity, 0.05, '', v => { opacity = v; draw(); }));

        const btnRow = ce('div', '', '');
        btnRow.style.cssText = 'display:flex;gap:8px;margin-bottom:12px';
        btnRow.appendChild(makeBtn('New Crack Pattern', 'fa-solid fa-rotate', () => { generateCracks(); draw(); }));

        wrap.appendChild(controls); wrap.appendChild(btnRow); wrap.appendChild(canvas);
        container.appendChild(section);
        draw();
    }

    /* ══════════════════════════════════════════════
       DEMO 8: Training Monitor
       ══════════════════════════════════════════════ */
    function createTrainingMonitorDemo(container) {
        const { section, container: wrap } = createDemoSection(
            'Interactive Demo: CNN Training Monitor',
            'fa-solid fa-chart-line',
            'Watch a crack classifier train in real time. Observe how loss drops and accuracy rises. Adjust learning rate and see what happens with too-high rates (divergence) vs. too-low (slow convergence).'
        );

        const canvas = ce('canvas', '', '');
        canvas.style.cssText = 'width:100%;border-radius:8px;display:block';
        const W = 700, H = 380;
        let lr = 0.01;
        let epochs = [];
        let running = false;

        function simulateTraining() {
            epochs = [];
            let loss = 2.5, acc = 0.5, valLoss = 2.8, valAcc = 0.45;
            for (let e = 0; e < 50; e++) {
                const decay = Math.exp(-lr * 50 * (e + 1) / 10);
                const noise = (Math.random() - 0.5) * lr * 20;
                loss = Math.max(0.05, loss * (0.85 + lr * 2) + noise * 0.5) * decay + 0.1;
                acc = Math.min(0.99, acc + (1 - acc) * lr * 8 * decay + (Math.random() - 0.5) * 0.02);
                valLoss = loss + 0.1 + Math.random() * 0.15 + (e > 35 ? (e - 35) * 0.03 : 0); // overfitting after ep 35
                valAcc = Math.min(acc - 0.02 - (e > 35 ? (e - 35) * 0.005 : 0), 0.97);

                if (lr > 0.05) { // divergence
                    loss = loss + e * 0.05;
                    acc = Math.max(0.5, acc - 0.01 * e);
                    valLoss = loss + 0.3;
                    valAcc = acc - 0.05;
                }

                epochs.push({ loss: Math.max(0, loss), acc: Math.min(1, Math.max(0, acc)), valLoss: Math.max(0, valLoss), valAcc: Math.min(1, Math.max(0, valAcc)) });
            }
        }

        async function animate() {
            if (running) return;
            running = true;
            simulateTraining();
            for (let i = 1; i <= epochs.length; i++) {
                drawUpTo(i);
                await new Promise(r => setTimeout(r, 80));
            }
            running = false;
        }

        function drawUpTo(n) {
            const ctx = initCanvas(canvas, W, H);
            ctx.fillStyle = colors.bg; ctx.fillRect(0, 0, W, H);

            const halfW = W / 2 - 20;
            const margin = { left: 50, right: 10, top: 30, bottom: 40 };
            const pH = H - margin.top - margin.bottom;

            // Draw loss chart (left)
            drawChart(ctx, 0, margin, halfW, pH, n, 'loss', 'Loss', [
                { data: epochs.map(e => e.loss), color: colors.cyan, label: 'Train Loss' },
                { data: epochs.map(e => e.valLoss), color: colors.red, label: 'Val Loss' }
            ]);

            // Draw accuracy chart (right)
            drawChart(ctx, halfW + 40, margin, halfW, pH, n, 'acc', 'Accuracy', [
                { data: epochs.map(e => e.acc), color: colors.teal, label: 'Train Acc' },
                { data: epochs.map(e => e.valAcc), color: colors.amber, label: 'Val Acc' }
            ]);

            // Epoch counter
            ctx.fillStyle = colors.text; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'center';
            ctx.fillText(`Epoch ${n}/50 | LR: ${lr}`, W / 2, H - 8);
        }

        function drawChart(ctx, ox, margin, pw, ph, n, type, title, series) {
            const x0 = ox + margin.left, y0 = margin.top;
            const chartW = pw - margin.left - margin.right;

            ctx.fillStyle = colors.muted; ctx.font = '12px Inter'; ctx.textAlign = 'center';
            ctx.fillText(title, x0 + chartW / 2, y0 - 10);

            // Grid
            ctx.strokeStyle = colors.border; ctx.lineWidth = 0.5;
            for (let i = 0; i <= 5; i++) {
                const y = y0 + (i / 5) * ph;
                ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + chartW, y); ctx.stroke();
            }

            const maxVal = type === 'loss' ? 3 : 1;
            series.forEach(s => {
                ctx.beginPath(); ctx.strokeStyle = s.color; ctx.lineWidth = 2;
                for (let i = 0; i < n; i++) {
                    const ex = x0 + (i / 49) * chartW;
                    const ey = y0 + ph - (Math.min(s.data[i], maxVal) / maxVal) * ph;
                    i === 0 ? ctx.moveTo(ex, ey) : ctx.lineTo(ex, ey);
                }
                ctx.stroke();

                // Legend dot
                const li = series.indexOf(s);
                ctx.beginPath(); ctx.arc(x0 + 10 + li * 100, y0 + ph + 25, 4, 0, Math.PI * 2);
                ctx.fillStyle = s.color; ctx.fill();
                ctx.fillStyle = colors.muted; ctx.font = '10px Inter'; ctx.textAlign = 'left';
                ctx.fillText(s.label, x0 + 18 + li * 100, y0 + ph + 29);
            });

            // Y-axis labels
            ctx.fillStyle = colors.muted; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'right';
            for (let i = 0; i <= 5; i++) {
                const v = type === 'loss' ? (maxVal * (5 - i) / 5).toFixed(1) : ((5 - i) * 20) + '%';
                ctx.fillText(v, x0 - 5, y0 + (i / 5) * ph + 4);
            }
        }

        simulateTraining();

        const controls = ce('div', '', '');
        controls.style.cssText = 'margin-bottom:16px';
        controls.appendChild(makeSlider('Learning Rate', 0.001, 0.1, lr, 0.001, '', v => { lr = v; }));

        const btnRow = ce('div', '', '');
        btnRow.style.cssText = 'display:flex;gap:8px;margin-bottom:12px';
        btnRow.appendChild(makeBtn(' Train', 'fa-solid fa-play', animate));

        wrap.appendChild(controls); wrap.appendChild(btnRow); wrap.appendChild(canvas);
        container.appendChild(section);
        drawUpTo(epochs.length);
    }

    /* ──────────────────────────────────────────────
       9) CRACK SEVERITY CLASSIFIER
       Simulate CNN crack width/severity classification
       ────────────────────────────────────────────── */
    function createCrackClassifierDemo(insertPoint) {
        const { section, container } = createDemoSection(
            'Crack Severity Classifier — CNN Prediction',
            'fa-solid fa-magnifying-glass-chart',
            'Click on the concrete surface to place cracks. The CNN classifier analyzes crack width and density to predict severity: Hairline, Minor, Moderate, or Severe. This is how infrastructure inspection AI works in practice.'
        );
        const canvas = ce('canvas');
        canvas.style.cssText = `width:100%;border-radius:8px;cursor:crosshair`;
        const w = Math.min(container.getBoundingClientRect().width - 48, 700);
        const h = 350;
        const { ctx, W, H } = initCanvas(canvas, w, h);
        let cracks = [];
        const btnRow = ce('div'); btnRow.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap';
        btnRow.appendChild(makeBtn('Clear', 'fa-solid fa-eraser', () => { cracks = []; draw(); }));
        btnRow.appendChild(makeBtn('Auto-Generate', 'fa-solid fa-wand-magic-sparkles', () => {
            cracks = [];
            const n = 5 + Math.floor(Math.random() * 15);
            for (let i = 0; i < n; i++) {
                const x = 20 + Math.random() * (W - 40);
                const y = 20 + Math.random() * (H - 40);
                const len = 15 + Math.random() * 80;
                const angle = Math.random() * Math.PI;
                const width = 0.2 + Math.random() * 3;
                cracks.push({ x, y, len, angle, width });
            }
            draw();
        }));
        btnRow.appendChild(makeBtn('Classify', 'fa-solid fa-robot', () => { draw(true); }));
        const info = ce('div'); info.style.cssText = `padding:10px;font-size:.82rem;color:${colors.muted};font-family:JetBrains Mono,monospace`;
        function draw(classify) {
            ctx.clearRect(0, 0, W, H);
            // Concrete texture
            ctx.fillStyle = '#3a3a3a';
            ctx.fillRect(0, 0, W, H);
            for (let i = 0; i < 200; i++) {
                ctx.fillStyle = `rgba(${120 + Math.random() * 40}, ${115 + Math.random() * 40}, ${110 + Math.random() * 40}, 0.3)`;
                ctx.fillRect(Math.random() * W, Math.random() * H, 2 + Math.random() * 4, 2 + Math.random() * 4);
            }
            // Draw cracks
            cracks.forEach(c => {
                ctx.strokeStyle = '#1a1a1a';
                ctx.lineWidth = c.width * 2;
                ctx.beginPath();
                ctx.moveTo(c.x, c.y);
                const segs = 3 + Math.floor(c.len / 20);
                let cx = c.x, cy = c.y;
                for (let s = 0; s < segs; s++) {
                    cx += (c.len / segs) * Math.cos(c.angle + (Math.random() - 0.5) * 0.5);
                    cy += (c.len / segs) * Math.sin(c.angle + (Math.random() - 0.5) * 0.5);
                    ctx.lineTo(cx, cy);
                }
                ctx.stroke();
            });
            if (classify && cracks.length > 0) {
                const avgWidth = cracks.reduce((s, c) => s + c.width, 0) / cracks.length;
                const totalLen = cracks.reduce((s, c) => s + c.len, 0);
                const density = totalLen / (W * H) * 10000;
                let severity, color;
                if (avgWidth < 0.5 && density < 2) { severity = 'Hairline'; color = colors.teal; }
                else if (avgWidth < 1.5 && density < 5) { severity = 'Minor'; color = colors.cyan; }
                else if (avgWidth < 2.5 || density < 8) { severity = 'Moderate'; color = colors.amber; }
                else { severity = 'Severe'; color = colors.red; }
                // Overlay classification
                ctx.fillStyle = 'rgba(0,0,0,0.7)';
                ctx.fillRect(10, 10, 260, 80);
                ctx.strokeStyle = color; ctx.lineWidth = 2;
                ctx.strokeRect(10, 10, 260, 80);
                ctx.fillStyle = color; ctx.font = 'bold 18px Inter';
                ctx.fillText('CNN Prediction: ' + severity, 22, 40);
                ctx.fillStyle = colors.text; ctx.font = '12px JetBrains Mono';
                ctx.fillText(`Avg width: ${avgWidth.toFixed(1)}mm | Density: ${density.toFixed(1)}`, 22, 60);
                ctx.fillText(`Cracks: ${cracks.length} | Total length: ${totalLen.toFixed(0)}px`, 22, 78);
                info.innerHTML = `Severity: <span style="color:${color};font-weight:bold">${severity}</span> | Recommendation: ${severity === 'Severe' ? '<span style="color:' + colors.red + '">Immediate structural assessment required</span>' : severity === 'Moderate' ? 'Schedule repair within 6 months' : 'Monitor in next inspection'}`;
            } else {
                info.textContent = cracks.length > 0 ? `${cracks.length} cracks placed — click "Classify" to run CNN prediction` : 'Click on the surface to place cracks, or use Auto-Generate';
            }
        }
        canvas.addEventListener('click', e => {
            const rect = canvas.getBoundingClientRect();
            const sx = W / rect.width, sy = H / rect.height;
            const x = (e.clientX - rect.left) * sx, y = (e.clientY - rect.top) * sy;
            cracks.push({ x, y, len: 20 + Math.random() * 60, angle: Math.random() * Math.PI, width: 0.3 + Math.random() * 2 });
            draw();
        });
        container.appendChild(btnRow); container.appendChild(canvas); container.appendChild(info);
        insertPoint.appendChild(section);
        draw();
    }

    /* ──────────────────────────────────────────────
       10) REBAR CORROSION GRID ANALYZER
       Simulate grid-based corrosion detection
       ────────────────────────────────────────────── */
    function createCorrosionGridDemo(insertPoint) {
        const { section, container } = createDemoSection(
            'Rebar Corrosion Detection — Grid Analysis',
            'fa-solid fa-table-cells',
            'CNNs analyze half-cell potential readings across a concrete surface to detect rebar corrosion. Click cells to toggle corrosion. The model predicts corrosion probability for the surrounding area.'
        );
        const canvas = ce('canvas');
        canvas.style.cssText = `width:100%;border-radius:8px;cursor:pointer`;
        const w = Math.min(container.getBoundingClientRect().width - 48, 600);
        const h = 360;
        const { ctx, W, H } = initCanvas(canvas, w, h);
        const gridW = 12, gridH = 8;
        let grid = [];
        const btnRow = ce('div'); btnRow.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap';
        btnRow.appendChild(makeBtn('Clear', 'fa-solid fa-eraser', () => { initGrid(); draw(); }));
        btnRow.appendChild(makeBtn('Random Corrosion', 'fa-solid fa-shuffle', () => { randomCorrosion(); draw(); }));
        btnRow.appendChild(makeBtn('Predict Spread', 'fa-solid fa-robot', () => { predict(); draw(); }));
        const info = ce('div'); info.style.cssText = `padding:8px;font-size:.82rem;color:${colors.muted};font-family:JetBrains Mono,monospace`;
        function initGrid() { grid = Array.from({ length: gridH }, () => Array(gridW).fill(0)); }
        function randomCorrosion() {
            initGrid();
            const cx = 2 + Math.floor(Math.random() * (gridW - 4));
            const cy = 1 + Math.floor(Math.random() * (gridH - 2));
            for (let dy = -1; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) {
                const r = cy + dy, c = cx + dx;
                if (r >= 0 && r < gridH && c >= 0 && c < gridW && Math.random() > 0.3) grid[r][c] = 0.7 + Math.random() * 0.3;
            }
        }
        function predict() {
            const newGrid = grid.map(r => [...r]);
            for (let y = 0; y < gridH; y++) for (let x = 0; x < gridW; x++) {
                if (grid[y][x] > 0.5) {
                    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                        const ny = y + dy, nx = x + dx;
                        if (ny >= 0 && ny < gridH && nx >= 0 && nx < gridW && grid[ny][nx] < 0.3) {
                            newGrid[ny][nx] = Math.max(newGrid[ny][nx], 0.2 + Math.random() * 0.3);
                        }
                    }
                }
            }
            grid = newGrid;
        }
        function draw() {
            ctx.clearRect(0, 0, W, H);
            const pad = 30, cellW = (W - pad * 2) / gridW, cellH = (H - pad * 2) / gridH;
            ctx.fillStyle = colors.muted; ctx.font = '11px Inter';
            ctx.fillText('Half-Cell Potential Corrosion Map — Click cells to mark corrosion', pad, pad - 10);
            let corroded = 0, total = gridW * gridH;
            for (let y = 0; y < gridH; y++) for (let x = 0; x < gridW; x++) {
                const px = pad + x * cellW, py = pad + y * cellH;
                const v = grid[y][x];
                if (v > 0.5) { corroded++; ctx.fillStyle = `rgba(239,68,68,${0.4 + v * 0.5})`; }
                else if (v > 0.15) ctx.fillStyle = `rgba(245,158,11,${0.3 + v * 0.5})`;
                else ctx.fillStyle = colors.bg;
                ctx.fillRect(px, py, cellW - 2, cellH - 2);
                ctx.strokeStyle = colors.border; ctx.lineWidth = 1;
                ctx.strokeRect(px, py, cellW - 2, cellH - 2);
                if (v > 0) {
                    const mV = Math.round(-100 - v * 400);
                    ctx.fillStyle = v > 0.5 ? '#fff' : colors.text;
                    ctx.font = '9px JetBrains Mono';
                    ctx.fillText(mV + '', px + 4, py + cellH / 2 + 3);
                }
            }
            // Legend
            const ly = H - 18;
            ctx.font = '10px Inter';
            [{ c: colors.teal, t: '> -200 mV (Low risk)' }, { c: colors.amber, t: '-200 to -350 mV (Uncertain)' }, { c: colors.red, t: '< -350 mV (High corrosion)' }].forEach((item, i) => {
                const lx = pad + i * 195;
                ctx.fillStyle = item.c; ctx.fillRect(lx, ly, 10, 10);
                ctx.fillStyle = colors.muted; ctx.fillText(item.t, lx + 14, ly + 9);
            });
            info.innerHTML = `Corroded cells: <span style="color:${colors.red}">${corroded}</span>/${total} (${(corroded / total * 100).toFixed(1)}%) | ${corroded > total * 0.2 ? '<span style="color:' + colors.red + '">Significant corrosion — repair recommended</span>' : '<span style="color:' + colors.teal + '">Within acceptable limits</span>'}`;
        }
        canvas.addEventListener('click', e => {
            const rect = canvas.getBoundingClientRect();
            const sx = W / rect.width, sy = H / rect.height;
            const mx = (e.clientX - rect.left) * sx - 30, my = (e.clientY - rect.top) * sy - 30;
            const cellW = (W - 60) / gridW, cellH = (H - 60) / gridH;
            const gx = Math.floor(mx / cellW), gy = Math.floor(my / cellH);
            if (gx >= 0 && gx < gridW && gy >= 0 && gy < gridH) {
                grid[gy][gx] = grid[gy][gx] > 0.5 ? 0 : 0.7 + Math.random() * 0.3;
                draw();
            }
        });
        container.appendChild(btnRow); container.appendChild(canvas); container.appendChild(info);
        insertPoint.appendChild(section);
        initGrid(); draw();
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
            createPixelInspectorDemo(insertPoint);
        } else if (path.includes('sub2')) {
            createConvolutionDemo(insertPoint);
            createCrackClassifierDemo(insertPoint);
        } else if (path.includes('sub3')) {
            createPoolingDemo(insertPoint);
        } else if (path.includes('sub4')) {
            createArchitectureDemo(insertPoint);
        } else if (path.includes('sub5')) {
            createTrainingMonitorDemo(insertPoint);
        } else if (path.includes('sub6')) {
            createArchitectureDemo(insertPoint);
            createCorrosionGridDemo(insertPoint);
        } else if (path.includes('sub7')) {
            createIoUDemo(insertPoint);
            createCrackClassifierDemo(insertPoint);
        } else if (path.includes('sub8')) {
            createSegmentationDemo(insertPoint);
            createCorrosionGridDemo(insertPoint);
        } else if (path.includes('sub9')) {
            createGradCAMDemo(insertPoint);
        } else if (path.includes('sub10')) {
            createConvolutionDemo(insertPoint);
            createGradCAMDemo(insertPoint);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }

})();
