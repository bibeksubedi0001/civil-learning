/**
 * Chapter 5 — LLMs & Transformers: Interactive Demos for Civil Engineers
 * Auto-injected into sub-chapters based on URL path.
 *
 * Demos:
 * 1. SequencePredictor — predict next values in a sensor time-series (RNN concept)
 * 2. AttentionHeatmap — interactive attention weights between words in a CE sentence
 * 3. TransformerBlocks — drag-and-build the transformer pipeline
 * 4. MaskedLanguageModel — BERT-style fill-in-the-blank for CE specs
 * 5. TextGenerator — GPT-style next-token prediction for report writing
 * 6. TokenizerPlayground — see how BPE breaks CE terms into subwords
 * 7. PromptCraft — build structured prompts for CE tasks, see quality scores
 * 8. RAGPipeline — simulate retrieval from building codes + generation
 * 9. HallucinationDetector — spot AI-generated errors in a CE context
 * 10. DesignReviewPipeline — end-to-end ACI check simulation
 */

(function () {
    'use strict';

    const ce = (tag, cls, html) => {
        const el = document.createElement(tag);
        if (cls) el.className = cls;
        if (html) el.innerHTML = html;
        return el;
    };
    const C = {
        teal: '#00d4aa', cyan: '#0ea5e9', amber: '#f59e0b',
        purple: '#a855f7', red: '#ef4444', bg: '#0f1923',
        card: '#151f2b', border: '#1e2d3d', text: '#e2e8f0', muted: '#94a3b8'
    };

    function section(title, icon, subtitle) {
        const s = ce('section', 'ch-section geo-demo-section');
        s.innerHTML = `
            <div class="section-container" style="max-width:900px;margin:0 auto;padding:40px 24px;">
                <h2 style="display:flex;align-items:center;gap:12px;font-size:1.5rem;margin-bottom:8px;color:${C.text}">
                    <i class="${icon}" style="color:${C.teal}"></i> ${title}
                </h2>
                <p style="color:${C.muted};margin-bottom:24px;font-size:.95rem">${subtitle}</p>
                <div class="demo-wrap" style="background:${C.card};border:1px solid ${C.border};border-radius:16px;padding:24px;position:relative;overflow:hidden"></div>
            </div>`;
        return { section: s, wrap: s.querySelector('.demo-wrap') };
    }

    function btn(text, icon, onClick) {
        const b = ce('button', '', `<i class="${icon}"></i> ${text}`);
        b.style.cssText = `display:inline-flex;align-items:center;gap:6px;padding:8px 18px;border-radius:8px;border:1px solid ${C.border};background:${C.bg};color:${C.text};font-size:.85rem;cursor:pointer;transition:all .2s;font-family:inherit`;
        b.addEventListener('mouseenter', () => b.style.borderColor = C.teal);
        b.addEventListener('mouseleave', () => b.style.borderColor = C.border);
        b.addEventListener('click', onClick);
        return b;
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
       DEMO 1: Sequence Predictor (RNNs & Time Series)
       ══════════════════════════════════════════════ */
    function createSequenceDemo(container) {
        const { section: sec, wrap } = section(
            'Interactive Demo: Predict the Next Sensor Reading',
            'fa-solid fa-timeline',
            'RNNs process data sequentially — each step depends on the previous. Try predicting the next water-level reading from a gauge station. The model "remembers" the trend.'
        );

        const canvas = ce('canvas', '', '');
        canvas.style.cssText = 'width:100%;border-radius:8px;display:block;cursor:crosshair';
        const W = 700, H = 340;
        let data = [];
        let userPred = null;
        let revealed = false;

        function generate() {
            data = [];
            const base = 2 + Math.random() * 3; // base water level in meters
            const trend = (Math.random() - 0.5) * 0.1;
            for (let i = 0; i < 20; i++) {
                const seasonal = Math.sin(i * 0.5) * 0.8;
                const noise = (Math.random() - 0.5) * 0.3;
                data.push(base + trend * i + seasonal + noise);
            }
            userPred = null; revealed = false;
        }

        function draw() {
            const ctx = initCanvas(canvas, W, H);
            ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);

            const margin = { l: 60, r: 40, t: 30, b: 40 };
            const cw = W - margin.l - margin.r;
            const ch = H - margin.t - margin.b;

            const allVals = [...data, ...(userPred !== null ? [userPred] : [])];
            const minV = Math.min(...allVals) - 0.5;
            const maxV = Math.max(...allVals) + 0.5;

            // Grid
            ctx.strokeStyle = C.border; ctx.lineWidth = 0.5;
            for (let i = 0; i <= 5; i++) {
                const y = margin.t + (i / 5) * ch;
                ctx.beginPath(); ctx.moveTo(margin.l, y); ctx.lineTo(margin.l + cw, y); ctx.stroke();
                ctx.fillStyle = C.muted; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'right';
                ctx.fillText((maxV - (i / 5) * (maxV - minV)).toFixed(1) + 'm', margin.l - 8, y + 4);
            }

            // X-axis
            ctx.fillStyle = C.muted; ctx.font = '10px Inter'; ctx.textAlign = 'center';
            ctx.fillText('Time (hours)', margin.l + cw / 2, H - 8);

            const stepX = cw / 21;
            const toX = i => margin.l + i * stepX;
            const toY = v => margin.t + ch - ((v - minV) / (maxV - minV)) * ch;

            // Known data (first 18 visible, last 2 hidden)
            const visible = 18;
            ctx.beginPath(); ctx.strokeStyle = C.cyan; ctx.lineWidth = 2;
            for (let i = 0; i < visible; i++) {
                const x = toX(i), y = toY(data[i]);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Data points
            for (let i = 0; i < visible; i++) {
                ctx.beginPath(); ctx.arc(toX(i), toY(data[i]), 4, 0, Math.PI * 2);
                ctx.fillStyle = C.cyan; ctx.fill();
            }

            // Hidden zone
            ctx.fillStyle = 'rgba(245,158,11,0.05)';
            ctx.fillRect(toX(visible) - stepX / 2, margin.t, stepX * 3, ch);
            ctx.fillStyle = C.amber; ctx.font = '11px Inter'; ctx.textAlign = 'center';
            ctx.fillText('Predict →', toX(visible + 0.5), margin.t + 18);

            // User prediction
            if (userPred !== null) {
                ctx.beginPath(); ctx.arc(toX(visible), toY(userPred), 7, 0, Math.PI * 2);
                ctx.fillStyle = C.teal + '40'; ctx.fill();
                ctx.strokeStyle = C.teal; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = C.teal; ctx.font = '11px JetBrains Mono'; ctx.textAlign = 'left';
                ctx.fillText(`Your: ${userPred.toFixed(2)}m`, toX(visible) + 12, toY(userPred) + 4);
            }

            // Reveal
            if (revealed) {
                const actual = data[visible];
                ctx.beginPath(); ctx.arc(toX(visible), toY(actual), 7, 0, Math.PI * 2);
                ctx.fillStyle = C.amber + '40'; ctx.fill();
                ctx.strokeStyle = C.amber; ctx.lineWidth = 2; ctx.stroke();
                ctx.fillStyle = C.amber; ctx.font = '11px JetBrains Mono';
                ctx.fillText(`Actual: ${actual.toFixed(2)}m`, toX(visible) + 12, toY(actual) - 10);

                if (userPred !== null) {
                    const err = Math.abs(userPred - actual);
                    const pct = (err / actual * 100).toFixed(1);
                    const good = err < 0.3;
                    ctx.fillStyle = good ? C.teal : C.red;
                    ctx.font = 'bold 13px Inter'; ctx.textAlign = 'center';
                    ctx.fillText(`Error: ${err.toFixed(2)}m (${pct}%) — ${good ? 'Great prediction!' : 'RNNs learn to do better!'}`, W / 2, H - 25);
                }
            }

            // Title
            ctx.fillStyle = C.text; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'left';
            ctx.fillText(' Gauge Station Water Level (click to predict next value)', margin.l, margin.t - 10);
        }

        canvas.addEventListener('click', e => {
            if (revealed) return;
            const rect = canvas.getBoundingClientRect();
            const my = (e.clientY - rect.top) * (H / rect.height);
            const margin = { t: 30, b: 40 };
            const ch = H - margin.t - margin.b;
            const allVals = data;
            const minV = Math.min(...allVals) - 0.5;
            const maxV = Math.max(...allVals) + 0.5;
            userPred = maxV - ((my - margin.t) / ch) * (maxV - minV);
            draw();
        });

        generate();

        const controls = ce('div', '', '');
        controls.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px';
        controls.appendChild(btn('Reveal Actual', 'fa-solid fa-eye', () => { revealed = true; draw(); }));
        controls.appendChild(btn('New Series', 'fa-solid fa-rotate', () => { generate(); draw(); }));

        wrap.appendChild(controls); wrap.appendChild(canvas);
        container.appendChild(sec);
        draw();
    }

    /* ══════════════════════════════════════════════
       DEMO 2: Attention Heatmap
       ══════════════════════════════════════════════ */
    function createAttentionDemo(container) {
        const { section: sec, wrap } = section(
            'Interactive Demo: Attention Weights Visualizer',
            'fa-solid fa-bullseye',
            'Click any word to see which other words the model "attends to." In this bridge inspection sentence, notice how "cracking" attends strongly to "span" and "deck" — the model learns structural relationships.'
        );

        const tokens = ['The', 'concrete', 'deck', 'shows', 'transverse', 'cracking', 'in', 'span', '3', 'near', 'the', 'abutment'];
        const attentionMatrix = [];
        // Pre-computed plausible attention pattern
        const patterns = {
            0: [0.1, 0.3, 0.4, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.0],
            1: [0.0, 0.2, 0.5, 0.0, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2],
            2: [0.0, 0.4, 0.1, 0.1, 0.0, 0.2, 0.0, 0.1, 0.0, 0.0, 0.0, 0.1],
            3: [0.0, 0.1, 0.2, 0.1, 0.1, 0.4, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0],
            4: [0.0, 0.0, 0.1, 0.0, 0.1, 0.6, 0.0, 0.1, 0.0, 0.0, 0.0, 0.1],
            5: [0.0, 0.1, 0.25, 0.05, 0.2, 0.05, 0.0, 0.2, 0.05, 0.0, 0.0, 0.1],
            6: [0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.1, 0.5, 0.3, 0.0, 0.0, 0.0],
            7: [0.0, 0.0, 0.2, 0.0, 0.0, 0.3, 0.1, 0.1, 0.2, 0.0, 0.0, 0.1],
            8: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.6, 0.2, 0.1, 0.0, 0.1],
            9: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.1, 0.1, 0.2, 0.5],
            10: [0.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.1, 0.6],
            11: [0.0, 0.1, 0.15, 0.0, 0.0, 0.1, 0.0, 0.15, 0.1, 0.2, 0.0, 0.2]
        };

        let selectedToken = 5; // "cracking" by default

        const grid = ce('div', '', '');
        grid.style.cssText = 'margin-bottom:20px';

        function render() {
            // Token row
            let html = '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">';
            tokens.forEach((t, i) => {
                const att = patterns[selectedToken][i];
                const isSelected = i === selectedToken;
                const bg = isSelected ? C.teal : `rgba(0,212,170,${att})`;
                const color = isSelected || att > 0.3 ? '#0a0f14' : C.text;
                html += `<span class="att-token" data-idx="${i}" style="padding:8px 14px;border-radius:8px;background:${bg};color:${color};cursor:pointer;font-size:.9rem;font-weight:${isSelected ? '700' : '400'};border:1px solid ${isSelected ? C.teal : C.border};transition:all .2s;font-family:'JetBrains Mono',monospace">${t}</span>`;
            });
            html += '</div>';

            // Attention bar chart
            html += '<div style="margin-top:12px;">';
            html += `<div style="font-size:.82rem;color:${C.muted};margin-bottom:8px;">Attention from "<strong style="color:${C.teal}">${tokens[selectedToken]}</strong>" to each word:</div>`;
            tokens.forEach((t, i) => {
                const att = patterns[selectedToken][i];
                const barColor = att > 0.3 ? C.teal : att > 0.15 ? C.cyan : C.border;
                html += `<div style="display:flex;align-items:center;gap:8px;margin:3px 0;">
                    <span style="min-width:90px;font-size:.78rem;color:${C.muted};text-align:right;font-family:'JetBrains Mono',monospace">${t}</span>
                    <div style="flex:1;height:18px;background:${C.bg};border-radius:4px;overflow:hidden;position:relative;">
                        <div style="width:${att * 100}%;height:100%;background:${barColor};border-radius:4px;transition:width .3s"></div>
                    </div>
                    <span style="min-width:40px;font-size:.75rem;color:${barColor};font-family:'JetBrains Mono',monospace">${att.toFixed(2)}</span>
                </div>`;
            });
            html += '</div>';

            // Insight
            html += `<div style="margin-top:16px;padding:12px;background:${C.bg};border-radius:8px;border-left:3px solid ${C.amber};font-size:.85rem;color:${C.muted};">
                <strong style="color:${C.amber}"> CE Insight:</strong> Notice how "${tokens[selectedToken]}" strongly attends to structurally related terms. The transformer learns that "cracking" is most relevant to "deck" and "span" — not filler words like "the" or "in". This is how LLMs understand engineering context.
            </div>`;

            grid.innerHTML = html;

            // Attach click handlers
            grid.querySelectorAll('.att-token').forEach(el => {
                el.addEventListener('click', () => {
                    selectedToken = parseInt(el.dataset.idx);
                    render();
                });
            });
        }

        wrap.appendChild(grid);
        container.appendChild(sec);
        render();
    }

    /* ══════════════════════════════════════════════
       DEMO 3: Transformer Block Builder
       ══════════════════════════════════════════════ */
    function createTransformerDemo(container) {
        const { section: sec, wrap } = section(
            'Interactive Demo: Build a Transformer',
            'fa-solid fa-diagram-project',
            'Add components to build a transformer encoder. Each block processes the entire sequence in parallel — unlike RNNs which go word-by-word. This parallelism is why transformers can analyze a 50-page structural report in seconds.'
        );

        const canvas = ce('canvas', '', '');
        canvas.style.cssText = 'width:100%;border-radius:8px;display:block';
        const W = 700, H = 380;

        const availableBlocks = [
            { type: 'embed', name: 'Input\nEmbedding', color: C.muted, desc: 'Convert tokens to vectors' },
            { type: 'pos', name: 'Positional\nEncoding', color: C.purple, desc: 'Add position info' },
            { type: 'mha', name: 'Multi-Head\nAttention', color: C.teal, desc: 'Attend to all positions' },
            { type: 'norm1', name: 'Add &\nNorm', color: C.cyan, desc: 'Residual + normalize' },
            { type: 'ff', name: 'Feed\nForward', color: C.amber, desc: 'Non-linear transform' },
            { type: 'norm2', name: 'Add &\nNorm', color: C.cyan, desc: 'Residual + normalize' },
            { type: 'out', name: 'Output\nLinear', color: C.red, desc: 'Project to vocabulary' },
        ];

        const correctOrder = ['embed', 'pos', 'mha', 'norm1', 'ff', 'norm2', 'out'];
        let placed = [];

        function draw() {
            const ctx = initCanvas(canvas, W, H);
            ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);

            // Available blocks (top)
            ctx.fillStyle = C.muted; ctx.font = '11px Inter'; ctx.textAlign = 'center';
            ctx.fillText('Available Components (click to add in order):', W / 2, 20);

            const remaining = availableBlocks.filter(b => !placed.includes(b.type));
            remaining.forEach((b, i) => {
                const bw = 80, bh = 50;
                const x = 30 + i * (bw + 12);
                const y = 30;
                ctx.fillStyle = b.color + '20'; ctx.strokeStyle = b.color; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 6); ctx.fill(); ctx.stroke();
                ctx.fillStyle = b.color; ctx.font = '9px Inter';
                b.name.split('\n').forEach((line, li) => ctx.fillText(line, x + bw / 2, y + bh / 2 - 5 + li * 13));
            });

            // Pipeline (bottom)
            const pipeY = 140;
            ctx.fillStyle = C.text; ctx.font = '12px Inter'; ctx.textAlign = 'left';
            ctx.fillText('Your Transformer Pipeline:', 20, pipeY - 10);

            if (placed.length === 0) {
                ctx.fillStyle = C.muted; ctx.font = '11px Inter'; ctx.textAlign = 'center';
                ctx.fillText('← Click components above to build the pipeline →', W / 2, pipeY + 40);
            }

            placed.forEach((type, i) => {
                const b = availableBlocks.find(bl => bl.type === type);
                const bw = 85, bh = 60;
                const x = 20 + i * (bw + 15);
                const y = pipeY + 10;

                const isCorrect = correctOrder[i] === type;
                ctx.fillStyle = b.color + '25'; ctx.strokeStyle = isCorrect ? b.color : C.red; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 8); ctx.fill(); ctx.stroke();

                ctx.fillStyle = C.text; ctx.font = '10px Inter'; ctx.textAlign = 'center';
                b.name.split('\n').forEach((line, li) => ctx.fillText(line, x + bw / 2, y + bh / 2 - 5 + li * 13));

                // Arrow
                if (i < placed.length - 1) {
                    ctx.strokeStyle = '#ffffff30'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(x + bw + 2, y + bh / 2); ctx.lineTo(x + bw + 13, y + bh / 2); ctx.stroke();
                    ctx.fillStyle = '#ffffff30';
                    ctx.beginPath(); ctx.moveTo(x + bw + 10, y + bh / 2 - 3); ctx.lineTo(x + bw + 15, y + bh / 2); ctx.lineTo(x + bw + 10, y + bh / 2 + 3); ctx.fill();
                }
            });

            // Correctness check
            if (placed.length === correctOrder.length) {
                const allCorrect = placed.every((t, i) => t === correctOrder[i]);
                ctx.fillStyle = allCorrect ? C.teal : C.red;
                ctx.font = 'bold 14px Inter'; ctx.textAlign = 'center';
                ctx.fillText(
                    allCorrect ? ' Perfect! This is the standard Transformer Encoder block!' : ' Order is wrong — check the architecture diagram above',
                    W / 2, pipeY + 100
                );
            }

            // Description
            if (placed.length > 0 && placed.length <= correctOrder.length) {
                const lastBlock = availableBlocks.find(b => b.type === placed[placed.length - 1]);
                ctx.fillStyle = C.muted; ctx.font = '11px Inter'; ctx.textAlign = 'center';
                ctx.fillText(`Last added: ${lastBlock.desc}`, W / 2, H - 20);
            }

            // Progress
            ctx.fillStyle = C.muted; ctx.font = '10px JetBrains Mono'; ctx.textAlign = 'right';
            ctx.fillText(`${placed.length}/${correctOrder.length} components`, W - 20, H - 20);
        }

        canvas.addEventListener('click', e => {
            const rect = canvas.getBoundingClientRect();
            const mx = (e.clientX - rect.left) * (W / rect.width);
            const my = (e.clientY - rect.top) * (H / rect.height);

            if (my >= 30 && my <= 80) {
                const remaining = availableBlocks.filter(b => !placed.includes(b.type));
                const bw = 80;
                const idx = Math.floor((mx - 30) / (bw + 12));
                if (idx >= 0 && idx < remaining.length) {
                    placed.push(remaining[idx].type);
                    draw();
                }
            }
        });

        const controls = ce('div', '', '');
        controls.style.cssText = 'display:flex;gap:8px;margin-bottom:16px';
        controls.appendChild(btn('Reset', 'fa-solid fa-rotate', () => { placed = []; draw(); }));
        controls.appendChild(btn('Auto-Build', 'fa-solid fa-wand-magic-sparkles', () => {
            placed = [];
            let i = 0;
            const interval = setInterval(() => {
                if (i < correctOrder.length) { placed.push(correctOrder[i]); i++; draw(); }
                else clearInterval(interval);
            }, 400);
        }));

        wrap.appendChild(controls); wrap.appendChild(canvas);
        container.appendChild(sec);
        draw();
    }

    /* ══════════════════════════════════════════════
       DEMO 4: Masked Language Model (BERT)
       ══════════════════════════════════════════════ */
    function createBERTDemo(container) {
        const { section: sec, wrap } = section(
            'Interactive Demo: BERT — Fill in the Blank (CE Specs)',
            'fa-solid fa-book-open',
            'BERT reads text bidirectionally and predicts masked words. Try to guess the masked terms in these civil engineering specifications — BERT would score 90%+ on these.'
        );

        const sentences = [
            { text: 'The minimum concrete cover for #8 rebar in exterior columns shall be [MASK] inches per ACI 318.', answer: '1.5', options: ['0.5', '1.0', '1.5', '2.0', '3.0'], hint: 'ACI 318 Table 20.6.1.3.1 — exterior exposed to weather' },
            { text: 'The soil bearing capacity was determined to be [MASK] kPa based on SPT N-value of 25.', answer: '250', options: ['50', '125', '250', '500', '1000'], hint: 'Empirical: q_a ≈ 10×N for granular soils (kPa)' },
            { text: 'Maximum water-cement ratio for concrete exposed to freezing shall not exceed [MASK].', answer: '0.45', options: ['0.35', '0.40', '0.45', '0.55', '0.65'], hint: 'ACI 318 Table 19.3.2.1 — freezing/thawing exposure' },
            { text: 'The [MASK] test is used to determine the in-situ density of compacted soil.', answer: 'sand cone', options: ['triaxial', 'sand cone', 'CBR', 'Proctor', 'vane shear'], hint: 'ASTM D1556 — field density measurement' },
            { text: 'Minimum factor of safety against slope failure for permanent slopes is [MASK].', answer: '1.5', options: ['1.0', '1.25', '1.5', '2.0', '3.0'], hint: 'FHWA guidelines for permanent slopes' },
        ];

        let currentIdx = 0;
        let answered = false;
        let selectedAnswer = null;

        function render() {
            const s = sentences[currentIdx];
            let html = `<div style="margin-bottom:20px;">
                <div style="font-size:.78rem;color:${C.muted};margin-bottom:8px;">Sentence ${currentIdx + 1}/${sentences.length}</div>
                <div style="font-size:1.05rem;color:${C.text};line-height:1.7;padding:16px;background:${C.bg};border-radius:10px;border:1px solid ${C.border};">
                    ${s.text.replace('[MASK]', `<span style="background:${C.teal}30;color:${C.teal};padding:2px 12px;border-radius:4px;font-weight:700;border-bottom:2px dashed ${C.teal}">${answered ? s.answer : '[MASK]'}</span>`)}
                </div>
            </div>`;

            html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px;">';
            s.options.forEach(opt => {
                const isCorrect = opt === s.answer;
                const isSelected = opt === selectedAnswer;
                let bg = C.bg, border = C.border, color = C.text;
                if (answered) {
                    if (isCorrect) { bg = C.teal + '30'; border = C.teal; color = C.teal; }
                    else if (isSelected && !isCorrect) { bg = C.red + '30'; border = C.red; color = C.red; }
                }
                html += `<button class="mask-opt" data-opt="${opt}" style="padding:10px 20px;border-radius:8px;border:1px solid ${border};background:${bg};color:${color};font-size:.9rem;cursor:${answered ? 'default' : 'pointer'};font-family:'JetBrains Mono',monospace;transition:all .2s">${opt}</button>`;
            });
            html += '</div>';

            if (answered) {
                const correct = selectedAnswer === s.answer;
                html += `<div style="padding:12px;background:${C.bg};border-radius:8px;border-left:3px solid ${correct ? C.teal : C.amber};font-size:.85rem;">
                    <span style="color:${correct ? C.teal : C.red};font-weight:700;">${correct ? ' Correct!' : ' Not quite.'}</span>
                    <span style="color:${C.muted};"> ${s.hint}</span>
                </div>`;
            }

            html += `<div style="display:flex;gap:8px;margin-top:16px;">
                <button class="mask-next" style="padding:8px 18px;border-radius:8px;border:1px solid ${C.border};background:${C.bg};color:${C.text};font-size:.85rem;cursor:pointer;font-family:inherit">Next Sentence →</button>
            </div>`;

            wrap.innerHTML = html;

            wrap.querySelectorAll('.mask-opt').forEach(el => {
                el.addEventListener('click', () => {
                    if (answered) return;
                    selectedAnswer = el.dataset.opt;
                    answered = true;
                    render();
                });
            });

            wrap.querySelector('.mask-next').addEventListener('click', () => {
                currentIdx = (currentIdx + 1) % sentences.length;
                answered = false; selectedAnswer = null;
                render();
            });
        }

        container.appendChild(sec);
        render();
    }

    /* ══════════════════════════════════════════════
       DEMO 5: GPT Text Generator
       ══════════════════════════════════════════════ */
    function createGPTDemo(container) {
        const { section: sec, wrap } = section(
            'Interactive Demo: GPT-Style Report Generator',
            'fa-solid fa-pen-fancy',
            'GPT predicts one token at a time, left-to-right. Click "Generate" to watch it draft a bridge inspection sentence token by token — like watching an engineer type but at 100× speed.'
        );

        const templates = [
            { seed: 'Bridge condition:', tokens: ['Bridge', 'condition:', ' The', ' concrete', ' deck', ' exhibits', ' transverse', ' cracking', ' at', ' 0.3mm', ' width', ' in', ' span', ' 3.', ' Recommend', ' epoxy', ' injection', ' repair', ' before', ' monsoon', ' season.'] },
            { seed: 'Soil report:', tokens: ['Soil', 'report:', ' Boring', ' B-3', ' reveals', ' medium', ' dense', ' silty', ' sand', ' (SM)', ' from', ' 2.0m', ' to', ' 8.5m', ' depth.', ' SPT', ' N-value', ' ranges', ' 18-32.', ' Suitable', ' for', ' shallow', ' foundations.'] },
            { seed: 'Hydrology:', tokens: ['Hydrology:', ' The', ' 100-year', ' peak', ' discharge', ' at', ' gauge', ' station', ' G-42', ' is', ' estimated', ' at', ' 485', ' m³/s', ' using', ' Log-Pearson', ' Type', ' III', ' distribution.', ' Flood', ' warning', ' level:', ' 12.5m.'] },
        ];

        let currentTemplate = 0;
        let visibleCount = 0;
        let generating = false;

        function render() {
            const t = templates[currentTemplate];
            let html = `<div style="padding:16px;background:${C.bg};border-radius:10px;border:1px solid ${C.border};min-height:100px;margin-bottom:16px;font-family:'JetBrains Mono',monospace;font-size:.9rem;line-height:1.8;">`;

            for (let i = 0; i < visibleCount && i < t.tokens.length; i++) {
                const isLast = i === visibleCount - 1 && generating;
                html += `<span style="color:${isLast ? C.teal : C.text};${isLast ? 'background:' + C.teal + '20;padding:1px 3px;border-radius:3px;' : ''}">${t.tokens[i]}</span>`;
            }

            if (generating && visibleCount < t.tokens.length) {
                html += `<span style="color:${C.teal};animation:blink 0.5s infinite;">▌</span>`;
            }

            html += '</div>';

            // Probability display for next token
            if (visibleCount > 0 && visibleCount < t.tokens.length) {
                const nextToken = t.tokens[visibleCount];
                const probs = [
                    { token: nextToken, p: 0.65 + Math.random() * 0.2 },
                    { token: [' the', ' a', ' at', ' in', ' of'][Math.floor(Math.random() * 5)], p: 0.08 + Math.random() * 0.1 },
                    { token: [' and', ' or', ' with', ' for'][Math.floor(Math.random() * 4)], p: 0.03 + Math.random() * 0.05 },
                ].sort((a, b) => b.p - a.p);

                html += `<div style="font-size:.78rem;color:${C.muted};margin-bottom:8px;">Next token probabilities:</div>`;
                probs.forEach((p, i) => {
                    const barColor = i === 0 ? C.teal : C.border;
                    html += `<div style="display:flex;align-items:center;gap:8px;margin:3px 0;">
                        <span style="min-width:120px;font-size:.75rem;color:${i === 0 ? C.teal : C.muted};font-family:'JetBrains Mono',monospace">"${p.token.trim()}"</span>
                        <div style="flex:1;height:14px;background:${C.bg};border-radius:3px;overflow:hidden;">
                            <div style="width:${p.p * 100}%;height:100%;background:${barColor};border-radius:3px;"></div>
                        </div>
                        <span style="min-width:40px;font-size:.72rem;color:${barColor};font-family:'JetBrains Mono',monospace">${(p.p * 100).toFixed(1)}%</span>
                    </div>`;
                });
            }

            wrap.innerHTML = `<style>@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}</style>` + html;

            // Controls
            const ctrls = ce('div', '', '');
            ctrls.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:16px';
            ctrls.appendChild(btn(generating ? ' Pause' : ' Generate', generating ? 'fa-solid fa-pause' : 'fa-solid fa-play', () => {
                if (generating) { generating = false; render(); return; }
                generating = true;
                const interval = setInterval(() => {
                    if (!generating || visibleCount >= t.tokens.length) { generating = false; clearInterval(interval); render(); return; }
                    visibleCount++;
                    render();
                }, 200);
            }));

            templates.forEach((tmpl, i) => {
                const b = btn(tmpl.seed, 'fa-solid fa-file-lines', () => {
                    currentTemplate = i; visibleCount = 0; generating = false; render();
                });
                if (i === currentTemplate) b.style.borderColor = C.teal;
                ctrls.appendChild(b);
            });

            wrap.appendChild(ctrls);
        }

        container.appendChild(sec);
        render();
    }

    /* ══════════════════════════════════════════════
       DEMO 6: Tokenizer Playground
       ══════════════════════════════════════════════ */
    function createTokenizerDemo(container) {
        const { section: sec, wrap } = section(
            'Interactive Demo: How LLMs Tokenize Civil Engineering Text',
            'fa-solid fa-font',
            'LLMs don\'t see words — they see subword tokens. Type any CE term to see how BPE (Byte Pair Encoding) would break it into pieces. Common words stay whole; rare engineering terms get split.'
        );

        // Simulated BPE tokenization (pre-defined for CE terms)
        const tokenMap = {
            'concrete': ['con', 'crete'],
            'prestressed': ['pre', 'stress', 'ed'],
            'geotechnical': ['ge', 'ot', 'ech', 'nical'],
            'reinforcement': ['re', 'infor', 'cement'],
            'abutment': ['ab', 'ut', 'ment'],
            'hydrology': ['hy', 'dro', 'logy'],
            'foundation': ['found', 'ation'],
            'bearing capacity': ['bear', 'ing', ' capacity'],
            'consolidation': ['con', 'solid', 'ation'],
            'permeability': ['per', 'me', 'ability'],
            'compaction': ['comp', 'action'],
            'groundwater': ['ground', 'water'],
            'retaining wall': ['ret', 'aining', ' wall'],
            'shear strength': ['she', 'ar', ' strength'],
            'settlement': ['settle', 'ment'],
            'earthquake': ['earth', 'quake'],
            'seismic': ['se', 'ism', 'ic'],
            'bridge': ['bridge'],
            'beam': ['beam'],
            'column': ['column'],
            'slab': ['slab'],
            'the': ['the'],
            'water': ['water'],
            'soil': ['soil'],
            'load': ['load'],
            'stress': ['stress'],
            'strain': ['strain'],
        };

        function tokenize(text) {
            const lower = text.toLowerCase().trim();
            if (tokenMap[lower]) return tokenMap[lower];
            // Fallback: split into 2-4 char chunks
            const tokens = [];
            let i = 0;
            while (i < text.length) {
                const len = Math.min(2 + Math.floor(Math.random() * 3), text.length - i);
                tokens.push(text.substring(i, i + len));
                i += len;
            }
            return tokens;
        }

        const colors = [C.teal, C.cyan, C.amber, C.purple, C.red, '#6bff6b', '#ff6bff'];

        const input = ce('input', '', '');
        input.type = 'text'; input.placeholder = 'Type a CE term (e.g., "geotechnical", "prestressed")';
        input.value = 'geotechnical';
        input.style.cssText = `width:100%;padding:12px 16px;border-radius:8px;border:1px solid ${C.border};background:${C.bg};color:${C.text};font-size:1rem;font-family:'JetBrains Mono',monospace;margin-bottom:16px;outline:none;box-sizing:border-box`;

        const output = ce('div', '', '');
        const examples = ce('div', '', '');
        examples.style.cssText = 'margin-top:16px';

        function update() {
            const tokens = tokenize(input.value);
            let html = '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:16px;">';
            tokens.forEach((t, i) => {
                html += `<span style="padding:8px 14px;border-radius:6px;background:${colors[i % colors.length]}20;border:1px solid ${colors[i % colors.length]};color:${colors[i % colors.length]};font-family:'JetBrains Mono',monospace;font-size:.95rem;">"${t}"</span>`;
            });
            html += '</div>';
            html += `<div style="font-size:.85rem;color:${C.muted};">
                <strong>${tokens.length}</strong> token${tokens.length > 1 ? 's' : ''} • 
                Common words (bridge, beam, soil) = 1 token • 
                Rare CE terms get split into subwords
            </div>`;
            output.innerHTML = html;
        }

        input.addEventListener('input', update);

        // Example buttons
        const exampleTerms = ['prestressed', 'geotechnical', 'consolidation', 'permeability', 'bearing capacity', 'retaining wall', 'bridge', 'soil'];
        let exHtml = `<div style="font-size:.82rem;color:${C.muted};margin-bottom:8px;">Try these CE terms:</div><div style="display:flex;flex-wrap:wrap;gap:6px;">`;
        exampleTerms.forEach(t => {
            exHtml += `<button class="tok-ex" data-term="${t}" style="padding:6px 12px;border-radius:6px;border:1px solid ${C.border};background:${C.bg};color:${C.text};font-size:.8rem;cursor:pointer;font-family:inherit">${t}</button>`;
        });
        exHtml += '</div>';
        examples.innerHTML = exHtml;

        wrap.appendChild(input); wrap.appendChild(output); wrap.appendChild(examples);

        examples.querySelectorAll('.tok-ex').forEach(el => {
            el.addEventListener('click', () => { input.value = el.dataset.term; update(); });
        });

        container.appendChild(sec);
        update();
    }

    /* ══════════════════════════════════════════════
       DEMO 7: Prompt Craft
       ══════════════════════════════════════════════ */
    function createPromptDemo(container) {
        const { section: sec, wrap } = section(
            'Interactive Demo: Prompt Engineering for CE Tasks',
            'fa-solid fa-comments',
            'The quality of an LLM\'s response depends heavily on your prompt. Toggle prompt components to see how adding context, examples, and format instructions improves the output quality score.'
        );

        const components = [
            { id: 'role', label: 'Role Assignment', text: 'You are a senior geotechnical engineer with 20 years of experience.', points: 15, active: false },
            { id: 'context', label: 'Context/Background', text: 'I have SPT data from 5 borings on a site for a 4-story building in seismic zone III.', points: 20, active: false },
            { id: 'task', label: 'Specific Task', text: 'Determine the recommended foundation type and depth.', points: 25, active: true },
            { id: 'format', label: 'Output Format', text: 'Provide the answer as: 1) Foundation type, 2) Depth (m), 3) Bearing capacity (kPa), 4) Key assumptions.', points: 15, active: false },
            { id: 'example', label: 'Few-Shot Example', text: 'Example: For N=15-20, sandy soil, 3-story building → Strip footing at 1.5m, q_a = 150 kPa.', points: 15, active: false },
            { id: 'constraints', label: 'Constraints', text: 'Follow IS 1893:2016 for seismic considerations. Minimum FOS = 3.0 for bearing capacity.', points: 10, active: false },
        ];

        function render() {
            const score = components.filter(c => c.active).reduce((s, c) => s + c.points, 0);
            const scoreColor = score >= 80 ? C.teal : score >= 50 ? C.amber : C.red;

            let html = `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
                <span style="font-size:.9rem;color:${C.muted};">Toggle components to build your prompt:</span>
                <div style="text-align:right;">
                    <div style="font-size:1.5rem;font-weight:800;color:${scoreColor};font-family:'JetBrains Mono',monospace;">${score}/100</div>
                    <div style="font-size:.72rem;color:${C.muted};">Prompt Quality</div>
                </div>
            </div>`;

            components.forEach(c => {
                html += `<div class="prompt-comp" data-id="${c.id}" style="display:flex;align-items:flex-start;gap:12px;padding:12px;margin-bottom:8px;background:${c.active ? C.bg : 'transparent'};border:1px solid ${c.active ? C.teal : C.border};border-radius:10px;cursor:pointer;transition:all .2s;">
                    <div style="min-width:20px;height:20px;border-radius:4px;border:2px solid ${c.active ? C.teal : C.border};background:${c.active ? C.teal : 'transparent'};display:flex;align-items:center;justify-content:center;font-size:12px;color:#0a0f14;margin-top:2px;">${c.active ? '' : ''}</div>
                    <div style="flex:1;">
                        <div style="font-size:.85rem;font-weight:600;color:${c.active ? C.teal : C.text};margin-bottom:4px;">${c.label} <span style="color:${C.muted};font-weight:400;">(+${c.points}pts)</span></div>
                        <div style="font-size:.82rem;color:${C.muted};font-family:'JetBrains Mono',monospace;${c.active ? '' : 'opacity:0.5;'}">${c.text}</div>
                    </div>
                </div>`;
            });

            // Preview prompt
            const activeComps = components.filter(c => c.active);
            if (activeComps.length > 0) {
                html += `<div style="margin-top:16px;padding:16px;background:${C.bg};border-radius:10px;border:1px solid ${C.border};">
                    <div style="font-size:.78rem;color:${C.muted};margin-bottom:8px;"> Assembled Prompt:</div>
                    <div style="font-size:.85rem;color:${C.text};line-height:1.6;font-family:'JetBrains Mono',monospace;">
                        ${activeComps.map(c => c.text).join('<br><br>')}
                    </div>
                </div>`;
            }

            // Quality feedback
            html += `<div style="margin-top:12px;padding:12px;background:${C.bg};border-radius:8px;border-left:3px solid ${scoreColor};font-size:.85rem;color:${C.muted};">
                <strong style="color:${scoreColor};">${score >= 80 ? ' Excellent prompt!' : score >= 50 ? ' Good start, add more context' : ' Too vague — LLM will give generic answers'}</strong>
                ${score < 80 ? ' — Try adding: ' + components.filter(c => !c.active).slice(0, 2).map(c => c.label).join(', ') : ' The LLM will give a precise, well-formatted geotechnical recommendation.'}
            </div>`;

            wrap.innerHTML = html;

            wrap.querySelectorAll('.prompt-comp').forEach(el => {
                el.addEventListener('click', () => {
                    const comp = components.find(c => c.id === el.dataset.id);
                    comp.active = !comp.active;
                    render();
                });
            });
        }

        container.appendChild(sec);
        render();
    }

    /* ══════════════════════════════════════════════
       DEMO 8: RAG Pipeline Simulator
       ══════════════════════════════════════════════ */
    function createRAGDemo(container) {
        const { section: sec, wrap } = section(
            'Interactive Demo: RAG — Building Code Q&A',
            'fa-solid fa-magnifying-glass-chart',
            'Retrieval Augmented Generation finds relevant code sections FIRST, then generates an answer grounded in facts. Ask a question and see the pipeline in action.'
        );

        const questions = [
            {
                q: 'What is the minimum cover for reinforcement in a foundation?',
                retrieved: [
                    { source: 'ACI 318-19 §20.6.1.3.4', text: 'Cast-in-place concrete members cast against and permanently in contact with ground: 3 in. (75 mm) minimum cover.' },
                    { source: 'ACI 318-19 §20.6.1.3.2', text: 'Concrete exposed to earth or weather: No. 6 through No. 18 bars — 2 in.; No. 5 bar and smaller — 1.5 in.' },
                ],
                answer: 'For foundations cast against soil, ACI 318-19 §20.6.1.3.4 requires a minimum concrete cover of **3 inches (75 mm)**. If formwork is used (not directly against ground), the requirement reduces to 2 inches for #6 bars and larger.',
                similarity: [0.94, 0.87, 0.45, 0.32, 0.21]
            },
            {
                q: 'What seismic load combinations should I use for a building in Seismic Design Category D?',
                retrieved: [
                    { source: 'ASCE 7-22 §2.3.6', text: 'Load combinations including earthquake: 1.2D + 1.0E + L + 0.2S and 0.9D + 1.0E.' },
                    { source: 'ASCE 7-22 §12.4.2', text: 'Seismic load effect E = Eh + Ev where Eh = ρQE and Ev = 0.2SDS×D.' },
                ],
                answer: 'For SDC D, use ASCE 7-22 §2.3.6 combinations: **1.2D + 1.0E + L + 0.2S** and **0.9D + 1.0E**. The seismic load E includes horizontal (ρQE) and vertical (0.2SDS×D) components per §12.4.2. Redundancy factor ρ = 1.3 for SDC D unless conditions in §12.3.4.2 are met.',
                similarity: [0.92, 0.89, 0.51, 0.38, 0.25]
            },
            {
                q: 'What is the maximum allowable slope for a temporary excavation in clay?',
                retrieved: [
                    { source: 'OSHA 29 CFR 1926.652', text: 'Type A soil (cohesive, qu ≥ 1.5 tsf): Maximum slope 3/4H:1V (53°) for excavations < 20 ft.' },
                    { source: 'OSHA 29 CFR 1926.652 App B', text: 'Short-term maximum allowable slopes. Type B: 1H:1V (45°). Type C: 1.5H:1V (34°).' },
                ],
                answer: 'Per OSHA 29 CFR 1926.652: For **Type A clay** (qu ≥ 1.5 tsf), maximum temporary slope is **3/4H:1V (53°)** for depths < 20 ft. For Type B soils: 1H:1V (45°). Always verify soil classification on-site before excavation.',
                similarity: [0.91, 0.85, 0.52, 0.41, 0.19]
            }
        ];

        let currentQ = 0;
        let step = 0; // 0=question, 1=retrieval, 2=generation, 3=answer

        function render() {
            const q = questions[currentQ];
            let html = '';

            // Question selector
            html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">';
            questions.forEach((qq, i) => {
                html += `<button class="rag-q" data-idx="${i}" style="padding:8px 14px;border-radius:8px;border:1px solid ${i === currentQ ? C.teal : C.border};background:${i === currentQ ? C.teal + '20' : C.bg};color:${i === currentQ ? C.teal : C.text};font-size:.8rem;cursor:pointer;font-family:inherit;text-align:left;max-width:220px;">Q${i + 1}: ${qq.q.substring(0, 50)}...</button>`;
            });
            html += '</div>';

            // Pipeline steps
            const steps = [' Question', ' Retrieve', ' Generate', ' Answer'];
            html += '<div style="display:flex;gap:4px;margin-bottom:20px;">';
            steps.forEach((s, i) => {
                const active = i <= step;
                html += `<div style="flex:1;text-align:center;padding:8px;border-radius:6px;background:${active ? [C.cyan, C.amber, C.purple, C.teal][i] + '20' : C.bg};border:1px solid ${active ? [C.cyan, C.amber, C.purple, C.teal][i] : C.border};color:${active ? [C.cyan, C.amber, C.purple, C.teal][i] : C.muted};font-size:.78rem;font-weight:${active ? '600' : '400'};transition:all .3s">${s}</div>`;
                if (i < steps.length - 1) html += `<div style="display:flex;align-items:center;color:${C.muted};">→</div>`;
            });
            html += '</div>';

            // Step content
            if (step >= 0) {
                html += `<div style="padding:12px;background:${C.bg};border-radius:8px;border:1px solid ${C.border};margin-bottom:12px;">
                    <div style="font-size:.78rem;color:${C.cyan};margin-bottom:4px;">User Query:</div>
                    <div style="font-size:.92rem;color:${C.text};">${q.q}</div>
                </div>`;
            }

            if (step >= 1) {
                html += `<div style="padding:12px;background:${C.bg};border-radius:8px;border:1px solid ${C.border};margin-bottom:12px;">
                    <div style="font-size:.78rem;color:${C.amber};margin-bottom:8px;"> Retrieved Documents (cosine similarity):</div>`;
                q.retrieved.forEach((doc, i) => {
                    html += `<div style="padding:10px;margin-bottom:6px;background:${C.card};border-radius:6px;border-left:3px solid ${C.amber};">
                        <div style="font-size:.78rem;color:${C.amber};font-weight:600;">${doc.source} <span style="float:right;color:${C.teal};">sim: ${q.similarity[i].toFixed(2)}</span></div>
                        <div style="font-size:.82rem;color:${C.muted};margin-top:4px;">${doc.text}</div>
                    </div>`;
                });
                html += '</div>';
            }

            if (step >= 3) {
                html += `<div style="padding:12px;background:${C.bg};border-radius:8px;border:1px solid ${C.teal};margin-bottom:12px;">
                    <div style="font-size:.78rem;color:${C.teal};margin-bottom:4px;"> Generated Answer (grounded in retrieved docs):</div>
                    <div style="font-size:.9rem;color:${C.text};line-height:1.6;">${q.answer.replace(/\*\*(.*?)\*\*/g, '<strong style="color:' + C.teal + '">$1</strong>')}</div>
                </div>`;
            }

            // Controls
            html += '<div style="display:flex;gap:8px;margin-top:12px;">';
            if (step < 3) {
                html += `<button class="rag-next" style="padding:8px 18px;border-radius:8px;border:1px solid ${C.teal};background:${C.teal}20;color:${C.teal};font-size:.85rem;cursor:pointer;font-family:inherit">Next Step →</button>`;
            }
            html += `<button class="rag-reset" style="padding:8px 18px;border-radius:8px;border:1px solid ${C.border};background:${C.bg};color:${C.text};font-size:.85rem;cursor:pointer;font-family:inherit">Reset</button>`;
            html += '</div>';

            wrap.innerHTML = html;

            wrap.querySelectorAll('.rag-q').forEach(el => {
                el.addEventListener('click', () => { currentQ = parseInt(el.dataset.idx); step = 0; render(); });
            });
            const nextBtn = wrap.querySelector('.rag-next');
            if (nextBtn) nextBtn.addEventListener('click', () => { step = Math.min(3, step + 1); render(); });
            wrap.querySelector('.rag-reset').addEventListener('click', () => { step = 0; render(); });
        }

        container.appendChild(sec);
        render();
    }

    /* ══════════════════════════════════════════════
       DEMO 9: Hallucination Detector
       ══════════════════════════════════════════════ */
    function createHallucinationDemo(container) {
        const { section: sec, wrap } = section(
            'Interactive Demo: Spot the AI Hallucination',
            'fa-solid fa-shield-halved',
            'LLMs confidently state wrong facts. Click on the statements you think are hallucinated (incorrect). In real CE practice, every AI output must be verified against codes and engineering judgment.'
        );

        const statements = [
            { text: 'ACI 318 requires a minimum concrete cover of 3 inches for foundations cast against soil.', hallucinated: false, explanation: ' Correct — ACI 318-19 §20.6.1.3.4 specifies 3 in. for concrete cast against earth.' },
            { text: 'The standard Proctor test uses a 10 lb hammer dropping from 18 inches in 5 layers with 25 blows per layer.', hallucinated: true, explanation: ' HALLUCINATION — Standard Proctor uses a 5.5 lb hammer dropping from 12 inches in 3 layers. The 10 lb / 18 in is the Modified Proctor (ASTM D1557).' },
            { text: 'ASCE 7-22 defines 4 Seismic Design Categories: A through D.', hallucinated: true, explanation: ' HALLUCINATION — ASCE 7-22 defines 6 SDCs: A through F. SDC E and F apply to structures near major active faults.' },
            { text: 'The coefficient of permeability for clean sand typically ranges from 10⁻² to 10⁻⁴ cm/s.', hallucinated: false, explanation: ' Correct — Clean sand permeability is typically 10⁻² to 10⁻⁴ cm/s (Terzaghi & Peck).' },
            { text: 'The maximum water-cement ratio for concrete exposed to sulfate attack (severe) is 0.45 per ACI 318.', hallucinated: false, explanation: ' Correct — ACI 318-19 Table 19.3.2.1 specifies w/c ≤ 0.45 for S2 (severe) sulfate exposure.' },
            { text: 'Pile bearing capacity by the Meyerhof method is calculated as Qu = 40×N×Ap for piles driven into sand.', hallucinated: true, explanation: ' HALLUCINATION — Meyerhof\'s formula is Qu = 40×N×D/B×Ap (with depth correction D/B ≤ 10), not simply 40×N×Ap. Missing the D/B ratio leads to significant overestimation of capacity.' },
        ];

        let guesses = {};

        function render() {
            const allGuessed = Object.keys(guesses).length === statements.length;
            let correct = 0, total = Object.keys(guesses).length;
            if (total > 0) {
                Object.entries(guesses).forEach(([idx, guess]) => {
                    if (guess === statements[parseInt(idx)].hallucinated) correct++;
                });
            }

            let html = `<div style="font-size:.82rem;color:${C.muted};margin-bottom:16px;">Click statements you believe are hallucinated (wrong). ${total}/${statements.length} checked.</div>`;

            statements.forEach((s, i) => {
                const guessed = guesses[i] !== undefined;
                const userSaysHallucinated = guesses[i] === true;
                let borderColor = C.border, bgColor = 'transparent';

                if (guessed) {
                    if (userSaysHallucinated === s.hallucinated) {
                        borderColor = C.teal; bgColor = C.teal + '10';
                    } else {
                        borderColor = C.red; bgColor = C.red + '10';
                    }
                }

                html += `<div class="hall-stmt" data-idx="${i}" style="padding:14px;margin-bottom:10px;background:${bgColor};border:1px solid ${borderColor};border-radius:10px;cursor:${guessed ? 'default' : 'pointer'};transition:all .2s;">
                    <div style="display:flex;align-items:flex-start;gap:10px;">
                        <div style="min-width:24px;height:24px;border-radius:50%;border:2px solid ${userSaysHallucinated ? C.red : guessed ? C.teal : C.border};background:${userSaysHallucinated ? C.red + '30' : 'transparent'};display:flex;align-items:center;justify-content:center;font-size:12px;margin-top:2px;">
                            ${userSaysHallucinated ? '' : guessed ? '' : ''}
                        </div>
                        <div style="flex:1;">
                            <div style="font-size:.9rem;color:${C.text};line-height:1.5;">${s.text}</div>
                            ${guessed ? `<div style="font-size:.82rem;color:${borderColor};margin-top:8px;padding:8px;background:${C.bg};border-radius:6px;">${s.explanation}</div>` : ''}
                        </div>
                    </div>
                </div>`;
            });

            if (allGuessed) {
                html += `<div style="padding:14px;background:${C.bg};border-radius:10px;border:1px solid ${C.teal};text-align:center;margin-top:16px;">
                    <div style="font-size:1.2rem;font-weight:700;color:${C.teal};">${correct}/${total} Correct</div>
                    <div style="font-size:.85rem;color:${C.muted};margin-top:4px;">In real practice, always verify AI outputs against authoritative sources (ACI, ASCE, OSHA codes).</div>
                </div>`;
            }

            html += `<div style="margin-top:12px;"><button class="hall-reset" style="padding:8px 18px;border-radius:8px;border:1px solid ${C.border};background:${C.bg};color:${C.text};font-size:.85rem;cursor:pointer;font-family:inherit">Reset</button></div>`;

            wrap.innerHTML = html;

            wrap.querySelectorAll('.hall-stmt').forEach(el => {
                el.addEventListener('click', () => {
                    const idx = parseInt(el.dataset.idx);
                    if (guesses[idx] !== undefined) return;
                    // First click = mark as hallucinated, double-click area not needed 
                    // We'll use a simple toggle: click = hallucinated
                    guesses[idx] = true;
                    render();
                });
                el.addEventListener('contextmenu', e => {
                    e.preventDefault();
                    const idx = parseInt(el.dataset.idx);
                    if (guesses[idx] !== undefined) return;
                    guesses[idx] = false; // right-click = mark as correct
                    render();
                });
            });

            wrap.querySelector('.hall-reset').addEventListener('click', () => { guesses = {}; render(); });
        }

        // Instructions
        const instDiv = ce('div', '', '');
        instDiv.style.cssText = `font-size:.82rem;color:${C.amber};margin-bottom:12px;padding:10px;background:${C.amber}10;border-radius:8px;border:1px solid ${C.amber}30;`;
        instDiv.innerHTML = ' <strong>Left-click</strong> = mark as hallucinated (wrong) | <strong>Right-click</strong> = mark as correct (true)';
        wrap.appendChild(instDiv);

        container.appendChild(sec);
        render();
    }

    /* ══════════════════════════════════════════════
       DEMO 10: Design Review Pipeline
       ══════════════════════════════════════════════ */
    function createDesignReviewDemo(container) {
        const { section: sec, wrap } = section(
            'Interactive Demo: AI-Assisted Design Review Pipeline',
            'fa-solid fa-building',
            'Simulate an LLM+RAG system reviewing a structural design package against ACI 318. Click through the pipeline to see how AI flags non-compliances automatically.'
        );

        const checks = [
            { item: 'Column C1: 400×400mm, 8-#25 bars', code: 'ACI 318 §10.7.3.1', requirement: 'ρ_min ≥ 1%', actual: 'ρ = 8×510/(400×400) = 2.55%', pass: true },
            { item: 'Beam B2: Stirrup spacing = 350mm', code: 'ACI 318 §9.7.6.2.2', requirement: 's_max ≤ d/2 ≤ 250mm', actual: 's = 350mm > 250mm', pass: false },
            { item: 'Slab S1: Cover = 20mm (exterior)', code: 'ACI 318 §20.6.1.3.1', requirement: 'Cover ≥ 40mm (exposed to weather)', actual: 'Cover = 20mm < 40mm', pass: false },
            { item: 'Foundation F1: w/c = 0.50', code: 'ACI 318 §19.3.2.1', requirement: 'w/c ≤ 0.45 (sulfate exposure)', actual: 'w/c = 0.50 > 0.45', pass: false },
            { item: 'Column C3: Tie spacing = 400mm', code: 'ACI 318 §25.7.2.1', requirement: 'Tie spacing ≤ min(16d_b, 48d_t, b)', actual: 's ≤ min(400, 480, 500) = 400mm ', pass: true },
            { item: 'Beam B5: Development length = 600mm', code: 'ACI 318 §25.4.2.3', requirement: 'l_d ≥ 900mm for #25 in normal concrete', actual: 'l_d = 600mm < 900mm', pass: false },
        ];

        let revealedCount = 0;

        function render() {
            let html = `<div style="margin-bottom:16px;padding:12px;background:${C.bg};border-radius:10px;border:1px solid ${C.border};">
                <div style="font-size:.82rem;color:${C.muted};margin-bottom:8px;"> Design Package: 4-Story RC Office Building — Seismic Zone III</div>
                <div style="display:flex;gap:16px;flex-wrap:wrap;font-size:.78rem;">
                    <span style="color:${C.cyan};">6 checks queued</span>
                    <span style="color:${C.teal};">${checks.filter((c, i) => i < revealedCount && c.pass).length} passed</span>
                    <span style="color:${C.red};">${checks.filter((c, i) => i < revealedCount && !c.pass).length} non-compliant</span>
                    <span style="color:${C.muted};">${Math.max(0, checks.length - revealedCount)} remaining</span>
                </div>
            </div>`;

            checks.forEach((check, i) => {
                if (i >= revealedCount) {
                    html += `<div style="padding:12px;margin-bottom:6px;background:${C.bg};border:1px dashed ${C.border};border-radius:8px;color:${C.muted};font-size:.85rem;">
                        <i class="fa-solid fa-clock" style="margin-right:6px;"></i> Check ${i + 1}: Pending review...
                    </div>`;
                } else {
                    const statusColor = check.pass ? C.teal : C.red;
                    const statusIcon = check.pass ? 'fa-circle-check' : 'fa-triangle-exclamation';
                    html += `<div style="padding:14px;margin-bottom:8px;background:${statusColor}08;border:1px solid ${statusColor}40;border-radius:10px;">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                            <i class="fa-solid ${statusIcon}" style="color:${statusColor};"></i>
                            <span style="font-size:.9rem;font-weight:600;color:${C.text};">${check.item}</span>
                            <span style="margin-left:auto;font-size:.75rem;padding:3px 8px;border-radius:4px;background:${statusColor}20;color:${statusColor};">${check.pass ? 'PASS' : 'FAIL'}</span>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:.82rem;">
                            <div><span style="color:${C.muted};">Code:</span> <span style="color:${C.cyan};">${check.code}</span></div>
                            <div><span style="color:${C.muted};">Req:</span> <span style="color:${C.text};">${check.requirement}</span></div>
                            <div style="grid-column:1/-1;"><span style="color:${C.muted};">Actual:</span> <span style="color:${statusColor};font-family:'JetBrains Mono',monospace;">${check.actual}</span></div>
                        </div>
                    </div>`;
                }
            });

            if (revealedCount >= checks.length) {
                const fails = checks.filter(c => !c.pass).length;
                html += `<div style="padding:16px;margin-top:16px;background:${C.bg};border-radius:10px;border:1px solid ${fails > 0 ? C.red : C.teal};text-align:center;">
                    <div style="font-size:1.1rem;font-weight:700;color:${fails > 0 ? C.red : C.teal};">
                        ${fails > 0 ? ` ${fails} Non-Compliance${fails > 1 ? 's' : ''} Found` : ' All Checks Passed'}
                    </div>
                    <div style="font-size:.85rem;color:${C.muted};margin-top:4px;">AI review completed in ~3 seconds. Manual review of same package: ~4 hours.</div>
                </div>`;
            }

            html += `<div style="display:flex;gap:8px;margin-top:16px;">
                ${revealedCount < checks.length ? `<button class="review-next" style="padding:8px 18px;border-radius:8px;border:1px solid ${C.teal};background:${C.teal}20;color:${C.teal};font-size:.85rem;cursor:pointer;font-family:inherit">Run Next Check</button>` : ''}
                ${revealedCount < checks.length ? `<button class="review-all" style="padding:8px 18px;border-radius:8px;border:1px solid ${C.amber};background:${C.amber}20;color:${C.amber};font-size:.85rem;cursor:pointer;font-family:inherit">Run All</button>` : ''}
                <button class="review-reset" style="padding:8px 18px;border-radius:8px;border:1px solid ${C.border};background:${C.bg};color:${C.text};font-size:.85rem;cursor:pointer;font-family:inherit">Reset</button>
            </div>`;

            wrap.innerHTML = html;

            const nextBtn = wrap.querySelector('.review-next');
            if (nextBtn) nextBtn.addEventListener('click', () => { revealedCount++; render(); });
            const allBtn = wrap.querySelector('.review-all');
            if (allBtn) allBtn.addEventListener('click', () => {
                const interval = setInterval(() => {
                    if (revealedCount >= checks.length) { clearInterval(interval); return; }
                    revealedCount++; render();
                }, 300);
            });
            wrap.querySelector('.review-reset').addEventListener('click', () => { revealedCount = 0; render(); });
        }

        container.appendChild(sec);
        render();
    }

    /* ──────────────────────────────────────────────
       11) CONSTRUCTION SAFETY REPORT GENERATOR
       LLM-style text generation for safety reports
       ────────────────────────────────────────────── */
    function createSafetyReportDemo(insertPoint) {
        const { section: sec, wrap } = section(
            'AI Safety Report Generator — LLM Application',
            'fa-solid fa-hard-hat',
            'Watch how an LLM generates construction site safety reports. Select hazard observations and the AI assembles a professional safety report with recommendations — demonstrating text generation for civil engineering.'
        );
        const hazards = [
            { id: 'scaffold', label: 'Unsecured scaffolding at Level 3', severity: 'High', category: 'Fall Protection' },
            { id: 'trench', label: 'Unshored trench > 1.2m deep', severity: 'Critical', category: 'Excavation Safety' },
            { id: 'ppe', label: 'Workers without hard hats in active zone', severity: 'Medium', category: 'PPE Compliance' },
            { id: 'crane', label: 'Crane operating near power lines', severity: 'Critical', category: 'Electrical Hazard' },
            { id: 'housekeeping', label: 'Debris obstructing emergency exit', severity: 'High', category: 'Housekeeping' },
            { id: 'rebar', label: 'Exposed rebar ends without caps', severity: 'Medium', category: 'Impalement Hazard' },
            { id: 'dewater', label: 'Standing water in excavation pit', severity: 'Medium', category: 'Drowning Hazard' },
            { id: 'concrete', label: 'Concrete pump hose unsecured during pour', severity: 'High', category: 'Equipment Safety' }
        ];
        const checkboxes = ce('div'); checkboxes.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:8px;margin-bottom:16px';
        hazards.forEach(h => {
            const sColor = h.severity === 'Critical' ? C.red : h.severity === 'High' ? C.amber : C.cyan;
            const div = ce('label', '', `<input type="checkbox" id="haz-${h.id}" style="accent-color:${C.teal}"> <span style="color:${sColor};font-size:.75rem;font-weight:600">[${h.severity}]</span> <span style="color:${C.text};font-size:.85rem">${h.label}</span>`);
            div.style.cssText = `display:flex;align-items:center;gap:6px;padding:8px 12px;background:${C.bg};border:1px solid ${C.border};border-radius:8px;cursor:pointer`;
            checkboxes.appendChild(div);
        });
        const btnRow = ce('div'); btnRow.style.cssText = 'display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap';
        const output = ce('div'); output.style.cssText = `background:${C.bg};border:1px solid ${C.border};border-radius:10px;padding:16px;min-height:120px;font-size:.85rem;color:${C.text};font-family:'JetBrains Mono',monospace;line-height:1.6;white-space:pre-wrap`;
        output.textContent = 'Select hazard observations and click "Generate Report" to create an AI safety report.';
        let generating = false;
        btnRow.appendChild(btn('Generate Report', 'fa-solid fa-file-lines', () => {
            const selected = hazards.filter(h => wrap.querySelector('#haz-' + h.id).checked);
            if (selected.length === 0) { output.textContent = 'Please select at least one hazard observation.'; return; }
            const date = new Date().toLocaleDateString();
            const lines = [
                `CONSTRUCTION SITE SAFETY INSPECTION REPORT`,
                `Date: ${date} | Inspector: AI Safety Assistant`,
                `Site: Project Alpha — Zone B Construction Area`,
                `═══════════════════════════════════════════`,
                ``,
                `FINDINGS SUMMARY: ${selected.length} hazard(s) identified`,
                `Risk Level: ${selected.some(s => s.severity === 'Critical') ? 'CRITICAL — STOP WORK ORDER RECOMMENDED' : selected.some(s => s.severity === 'High') ? 'HIGH — Immediate corrective action required' : 'MEDIUM — Corrective action within 24 hours'}`,
                ``
            ];
            selected.forEach((h, i) => {
                lines.push(`${i + 1}. [${h.severity.toUpperCase()}] ${h.category}`);
                lines.push(`   Observation: ${h.label}`);
                const actions = {
                    'scaffold': 'Secure all scaffold connections. Install toe boards and guardrails per OSHA 1926.451.',
                    'trench': 'Install trench box or slope to 1:1 ratio. No entry until shoring complete per OSHA 1926.652.',
                    'crane': 'Maintain 3m clearance from power lines. Assign signal person. Review lift plan.',
                    'ppe': 'Issue hard hats immediately. Conduct toolbox talk on mandatory PPE requirements.',
                    'housekeeping': 'Clear debris from exit route. Restore 1.0m clear width per fire code.',
                    'rebar': 'Install mushroom caps on all exposed rebar ends within 24 hours.',
                    'dewater': 'Deploy sump pump. Install edge protection and warning signs.',
                    'concrete': 'Secure pump hose with chain restraints at all connection points.'
                };
                lines.push(`   Action Required: ${actions[h.id]}`);
                lines.push('');
            });
            lines.push(`FOLLOW-UP: Re-inspection scheduled within ${selected.some(s => s.severity === 'Critical') ? '4 hours' : '24 hours'}`);
            // Animate token-by-token generation
            output.textContent = '';
            generating = true;
            let idx = 0;
            const fullText = lines.join('\n');
            const words = fullText.split(/(\s+)/);
            function typeWord() {
                if (idx < words.length && generating) {
                    output.textContent += words[idx];
                    idx++;
                    setTimeout(typeWord, 15 + Math.random() * 25);
                }
            }
            typeWord();
        }));
        btnRow.appendChild(btn('Clear', 'fa-solid fa-eraser', () => {
            generating = false;
            hazards.forEach(h => { wrap.querySelector('#haz-' + h.id).checked = false; });
            output.textContent = 'Select hazard observations and click "Generate Report".';
        }));
        wrap.appendChild(checkboxes); wrap.appendChild(btnRow); wrap.appendChild(output);
        insertPoint.appendChild(sec);
    }

    /* ──────────────────────────────────────────────
       12) MATERIAL SPEC INTERPRETER
       NLP parsing of technical specifications
       ────────────────────────────────────────────── */
    function createSpecInterpreterDemo(insertPoint) {
        const { section: sec, wrap } = section(
            'Material Specification Parser — NLP Analysis',
            'fa-solid fa-file-code',
            'See how NLP extracts structured data from free-text material specifications. Select a spec clause and watch the AI tokenize, parse, and extract key engineering parameters.'
        );
        const specs = [
            { text: 'Concrete shall be Grade M30 with minimum cement content of 320 kg/m³, w/c ratio not exceeding 0.45, using OPC 43 grade cement conforming to IS 8112.', params: { grade: 'M30', cement: '320 kg/m³', wc: '≤ 0.45', cementType: 'OPC 43', standard: 'IS 8112' } },
            { text: 'Reinforcement steel shall be Fe 500D TMT bars conforming to IS 1786, with minimum elongation of 16% and UTS/YS ratio not less than 1.08.', params: { grade: 'Fe 500D', type: 'TMT', standard: 'IS 1786', elongation: '≥ 16%', 'UTS/YS': '≥ 1.08' } },
            { text: 'Backfill material shall have maximum dry density not less than 18 kN/m³, liquid limit below 35%, plasticity index below 12, compacted to 95% of Modified Proctor.', params: { MDD: '≥ 18 kN/m³', LL: '< 35%', PI: '< 12', compaction: '95% Mod. Proctor' } },
            { text: 'Structural steel plates shall be IS 2062 Grade E350, thickness 12-25mm, with Charpy V-notch impact value minimum 27J at -20°C.', params: { standard: 'IS 2062', grade: 'E350', thickness: '12-25mm', impact: '≥ 27J at -20°C' } }
        ];
        let currentSpec = 0;
        const specDisplay = ce('div'); specDisplay.style.cssText = `padding:16px;background:${C.bg};border:1px solid ${C.border};border-radius:10px;margin-bottom:16px;font-size:.9rem;color:${C.text};line-height:1.7`;
        const parsedDisplay = ce('div'); parsedDisplay.style.cssText = `padding:16px;background:${C.bg};border:1px solid ${C.border};border-radius:10px;margin-bottom:12px;font-size:.85rem`;
        const btnRow = ce('div'); btnRow.style.cssText = 'display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap';
        function render(animate) {
            const spec = specs[currentSpec];
            // Highlight keywords
            let highlighted = spec.text;
            const keywords = Object.values(spec.params);
            keywords.forEach(kw => {
                const cleanKw = kw.replace(/[≤≥<>]/g, '').trim();
                if (cleanKw.length > 1 && highlighted.includes(cleanKw)) {
                    highlighted = highlighted.replace(cleanKw, `<span style="background:${C.teal}30;color:${C.teal};padding:2px 4px;border-radius:4px">${cleanKw}</span>`);
                }
            });
            specDisplay.innerHTML = `<div style="color:${C.amber};font-size:.75rem;margin-bottom:8px">SPEC CLAUSE ${currentSpec + 1}/${specs.length}</div>${highlighted}`;
            // Extracted params
            const entries = Object.entries(spec.params);
            if (animate) {
                parsedDisplay.innerHTML = `<div style="color:${C.cyan};font-size:.8rem;margin-bottom:10px"><i class="fa-solid fa-microchip" style="margin-right:6px"></i>NLP EXTRACTED PARAMETERS</div>`;
                let idx = 0;
                function addNext() {
                    if (idx < entries.length) {
                        const [key, val] = entries[idx];
                        const row = ce('div');
                        row.style.cssText = `display:flex;justify-content:space-between;padding:6px 10px;margin:4px 0;background:${C.card};border-radius:6px;border-left:3px solid ${C.teal};animation:fadeIn .3s`;
                        row.innerHTML = `<span style="color:${C.muted}">${key}</span><span style="color:${C.amber};font-family:JetBrains Mono,monospace">${val}</span>`;
                        parsedDisplay.appendChild(row);
                        idx++;
                        setTimeout(addNext, 200);
                    }
                }
                addNext();
            } else {
                let html = `<div style="color:${C.cyan};font-size:.8rem;margin-bottom:10px"><i class="fa-solid fa-microchip" style="margin-right:6px"></i>NLP EXTRACTED PARAMETERS</div>`;
                entries.forEach(([key, val]) => {
                    html += `<div style="display:flex;justify-content:space-between;padding:6px 10px;margin:4px 0;background:${C.card};border-radius:6px;border-left:3px solid ${C.teal}"><span style="color:${C.muted}">${key}</span><span style="color:${C.amber};font-family:JetBrains Mono,monospace">${val}</span></div>`;
                });
                parsedDisplay.innerHTML = html;
            }
        }
        btnRow.appendChild(btn('Parse Spec', 'fa-solid fa-play', () => render(true)));
        btnRow.appendChild(btn('Next Spec', 'fa-solid fa-forward', () => { currentSpec = (currentSpec + 1) % specs.length; render(false); }));
        btnRow.appendChild(btn('Prev Spec', 'fa-solid fa-backward', () => { currentSpec = (currentSpec - 1 + specs.length) % specs.length; render(false); }));
        wrap.appendChild(specDisplay); wrap.appendChild(btnRow); wrap.appendChild(parsedDisplay);
        insertPoint.appendChild(sec);
        render(false);
    }

    /* ══════════════════════════════════════════════
       AUTO-INJECTION BY URL
       ══════════════════════════════════════════════ */
    function inject() {
        const path = window.location.pathname;
        const target = document.getElementById('geo-demo-container');
        const insertPoint = target || (function () {
            const ids = ['quiz-section', 'quiz', 'knowledge-check'];
            for (const id of ids) {
                const el = document.getElementById(id);
                if (el) {
                    const wrap = document.createElement('div');
                    wrap.id = 'geo-demo-container';
                    el.parentNode.insertBefore(wrap, el);
                    return wrap;
                }
            }
            return null;
        })();
        if (!insertPoint) return;

        if (path.includes('sub1')) createSequenceDemo(insertPoint);
        else if (path.includes('sub2')) createAttentionDemo(insertPoint);
        else if (path.includes('sub3')) { createTransformerDemo(insertPoint); createSpecInterpreterDemo(insertPoint); }
        else if (path.includes('sub4')) createBERTDemo(insertPoint);
        else if (path.includes('sub5')) { createGPTDemo(insertPoint); createSafetyReportDemo(insertPoint); }
        else if (path.includes('sub6')) createTokenizerDemo(insertPoint);
        else if (path.includes('sub7')) { createPromptDemo(insertPoint); createSafetyReportDemo(insertPoint); }
        else if (path.includes('sub8')) { createRAGDemo(insertPoint); createSpecInterpreterDemo(insertPoint); }
        else if (path.includes('sub9')) createHallucinationDemo(insertPoint);
        else if (path.includes('sub10')) { createRAGDemo(insertPoint); createDesignReviewDemo(insertPoint); }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }

})();
