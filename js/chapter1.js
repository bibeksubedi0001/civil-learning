/* ==========================================================================
   CHAPTER 1 - AI vs MACHINE LEARNING
   Interactive systems, animated visuals, confetti, particles, the works.
   ========================================================================== */

(function () {
    'use strict';

    // -------- Shared palette --------
    const C = {
        bg:    '#0d0d14',
        teal:  '#00d4aa',
        blue:  '#0ea5e9',
        amber: '#f59e0b',
        green: '#22c55e',
        red:   '#ef4444',
        purple:'#a855f7',
        pink:  '#ec4899',
        text:  '#e6e7ee',
        muted: 'rgba(230, 231, 238, 0.55)'
    };

    const rgba = (hex, a) => {
        const h = hex.replace('#', '');
        const r = parseInt(h.substring(0, 2), 16);
        const g = parseInt(h.substring(2, 4), 16);
        const b = parseInt(h.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    };

    // High-DPI aware canvas resize
    function fitCanvas(canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.max(1, Math.floor(rect.width * dpr));
        canvas.height = Math.max(1, Math.floor(rect.height * dpr));
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { ctx, w: rect.width, h: rect.height, dpr };
    }

    // Run draw() whenever element is on screen, pause when off
    function onVisible(el, draw) {
        let running = false;
        let raf = null;
        const loop = (t) => {
            if (!running) return;
            draw(t);
            raf = requestAnimationFrame(loop);
        };
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting && !running) {
                    running = true;
                    raf = requestAnimationFrame(loop);
                } else if (!e.isIntersecting && running) {
                    running = false;
                    if (raf) cancelAnimationFrame(raf);
                }
            });
        }, { threshold: 0.05 });
        io.observe(el);
    }

    /* =========================================================
       1. HERO CANVAS - Topographic contours morph into a neural net
       ========================================================= */
    function initHeroCanvas() {
        const canvas = document.getElementById('hero-bg-canvas');
        if (!canvas) return;
        let view = fitCanvas(canvas);
        let nodes = [];
        let particles = [];

        function build() {
            view = fitCanvas(canvas);
            nodes = [];
            const layers = 5;
            const perLayer = 8;
            for (let l = 0; l < layers; l++) {
                for (let i = 0; i < perLayer; i++) {
                    nodes.push({
                        layer: l,
                        x: (l + 0.5) * (view.w / layers),
                        y: (i + 0.5) * (view.h / perLayer),
                        baseY: (i + 0.5) * (view.h / perLayer),
                        phase: Math.random() * Math.PI * 2,
                        amp: 18 + Math.random() * 30
                    });
                }
            }
            particles = [];
            for (let i = 0; i < 80; i++) {
                particles.push({
                    x: Math.random() * view.w,
                    y: Math.random() * view.h,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    r: 1 + Math.random() * 1.5
                });
            }
        }
        build();
        window.addEventListener('resize', build);

        onVisible(canvas, (t) => {
            const ctx = view.ctx;
            const time = t * 0.0007;
            ctx.clearRect(0, 0, view.w, view.h);

            // soft topographic radial gradient backdrop
            const g = ctx.createRadialGradient(view.w * 0.7, view.h * 0.4, 50, view.w * 0.5, view.h * 0.5, view.w * 0.7);
            g.addColorStop(0, rgba(C.teal, 0.10));
            g.addColorStop(0.5, rgba(C.blue, 0.05));
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, view.w, view.h);

            // Contour-like horizontal sine bands fading into NN structure
            for (let i = 0; i < 7; i++) {
                ctx.beginPath();
                const yc = (i + 1) * (view.h / 8);
                for (let x = 0; x <= view.w; x += 6) {
                    const y = yc + Math.sin(x * 0.005 + time + i * 0.4) * 14 + Math.cos(x * 0.012 - time * 0.7) * 6;
                    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.strokeStyle = rgba(C.teal, 0.07 + i * 0.005);
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Update + draw drifting particles
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = view.w; if (p.x > view.w) p.x = 0;
                if (p.y < 0) p.y = view.h; if (p.y > view.h) p.y = 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = rgba(C.blue, 0.35);
                ctx.fill();
            });

            // Update node positions (gentle wobble)
            nodes.forEach(n => {
                n.y = n.baseY + Math.sin(time * 1.2 + n.phase) * 6;
            });

            // Network edges
            for (let l = 0; l < 4; l++) {
                const a = nodes.filter(n => n.layer === l);
                const b = nodes.filter(n => n.layer === l + 1);
                a.forEach(p => b.forEach(q => {
                    const pulse = 0.5 + 0.5 * Math.sin(time * 2 + p.y * 0.05 + q.y * 0.05);
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(q.x, q.y);
                    ctx.strokeStyle = rgba(C.teal, 0.04 + pulse * 0.05);
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }));
            }
            // Nodes
            nodes.forEach(n => {
                const pulse = 0.5 + 0.5 * Math.sin(time * 3 + n.phase);
                ctx.beginPath();
                ctx.arc(n.x, n.y, 2.2 + pulse * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = rgba(C.teal, 0.5 + pulse * 0.4);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(n.x, n.y, 6 + pulse * 4, 0, Math.PI * 2);
                ctx.fillStyle = rgba(C.teal, 0.06);
                ctx.fill();
            });
        });
    }

    /* =========================================================
       2. SUBFIELDS - radial map of AI subfields with hover
       ========================================================= */
    function initSubfields() {
        const canvas = document.getElementById('subfields-canvas');
        if (!canvas) return;
        const fields = [
            { name: 'Computer Vision', icon: '👁', color: C.teal,   tag: 'CNNs, image AI' },
            { name: 'NLP / LLMs',      icon: '💬', color: C.blue,   tag: 'language understanding' },
            { name: 'Robotics',        icon: '🤖', color: C.amber,  tag: 'physical intelligence' },
            { name: 'Planning',        icon: '🧭', color: C.green,  tag: 'optimization & search' },
            { name: 'Expert Systems',  icon: '📋', color: C.red,    tag: 'rule-based AI' },
            { name: 'Machine Learning',icon: '📈', color: C.purple, tag: 'learns from data' },
            { name: 'Knowledge Graphs',icon: '🕸',  color: C.pink,   tag: 'symbolic reasoning' },
            { name: 'Reinforcement',   icon: '🎯', color: C.teal,   tag: 'reward-driven' }
        ];
        let view = fitCanvas(canvas);
        let mouse = { x: -999, y: -999 };
        let hovered = -1;

        canvas.addEventListener('mousemove', (e) => {
            const r = canvas.getBoundingClientRect();
            mouse.x = e.clientX - r.left;
            mouse.y = e.clientY - r.top;
        });
        canvas.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });
        window.addEventListener('resize', () => view = fitCanvas(canvas));

        onVisible(canvas, (t) => {
            const ctx = view.ctx;
            const cx = view.w / 2, cy = view.h / 2;
            const radius = Math.min(view.w, view.h) * 0.36;
            const time = t * 0.0005;
            ctx.clearRect(0, 0, view.w, view.h);

            // background grid
            ctx.strokeStyle = rgba(C.teal, 0.04);
            ctx.lineWidth = 0.5;
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.arc(cx, cy, radius * (i / 5), 0, Math.PI * 2);
                ctx.stroke();
            }

            // central AI hub
            const hubR = 38;
            const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, hubR);
            grad.addColorStop(0, rgba(C.teal, 0.95));
            grad.addColorStop(1, rgba(C.teal, 0.15));
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(cx, cy, hubR, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px Inter, sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('AI', cx, cy);

            hovered = -1;
            fields.forEach((f, i) => {
                const a = (i / fields.length) * Math.PI * 2 - Math.PI / 2 + time;
                const x = cx + Math.cos(a) * radius;
                const y = cy + Math.sin(a) * radius;
                f._x = x; f._y = y;
                const d = Math.hypot(mouse.x - x, mouse.y - y);
                if (d < 30) hovered = i;
                // edge
                ctx.beginPath();
                ctx.moveTo(cx, cy); ctx.lineTo(x, y);
                ctx.strokeStyle = rgba(f.color, hovered === i ? 0.6 : 0.18);
                ctx.lineWidth = hovered === i ? 2 : 1;
                ctx.stroke();
                // node
                const r = hovered === i ? 28 : 22;
                const ng = ctx.createRadialGradient(x, y, 2, x, y, r);
                ng.addColorStop(0, rgba(f.color, 0.95));
                ng.addColorStop(1, rgba(f.color, 0.1));
                ctx.fillStyle = ng;
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = '16px Inter, sans-serif';
                ctx.fillText(f.icon, x, y);
                // label
                ctx.fillStyle = rgba(C.text, hovered === i ? 1 : 0.7);
                ctx.font = (hovered === i ? 'bold ' : '') + '11px Inter, sans-serif';
                const lo = a;
                const lx = cx + Math.cos(lo) * (radius + 38);
                const ly = cy + Math.sin(lo) * (radius + 38);
                ctx.fillText(f.name, lx, ly);
            });

            // tooltip
            if (hovered >= 0) {
                const f = fields[hovered];
                const text = f.tag;
                ctx.font = '11px Inter, sans-serif';
                const tw = ctx.measureText(text).width + 16;
                const tx = Math.min(view.w - tw - 6, Math.max(6, mouse.x + 12));
                const ty = Math.max(6, mouse.y - 28);
                ctx.fillStyle = 'rgba(0,0,0,0.78)';
                ctx.strokeStyle = rgba(f.color, 0.7);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(tx, ty, tw, 22, 4) : ctx.rect(tx, ty, tw, 22);
                ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                ctx.fillText(text, tx + 8, ty + 11);
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            }
        });
    }

    /* =========================================================
       3. TIMELINE - 1950 → 2026 with drag/slider
       ========================================================= */
    function initTimeline() {
        const canvas = document.getElementById('timeline-canvas');
        if (!canvas) return;
        const slider = document.getElementById('timeline-slider');
        const yearLbl = document.getElementById('timeline-year');
        const events = [
            { y: 1950, label: 'Turing Test',          color: C.teal },
            { y: 1956, label: 'Dartmouth Conference', color: C.teal },
            { y: 1965, label: 'ELIZA chatbot',        color: C.blue },
            { y: 1980, label: 'Expert systems peak',  color: C.amber },
            { y: 1986, label: 'Backpropagation',      color: C.purple },
            { y: 1997, label: 'Deep Blue beats Kasparov', color: C.blue },
            { y: 2006, label: 'Deep Learning revival',color: C.green },
            { y: 2012, label: 'AlexNet / ImageNet',   color: C.red },
            { y: 2017, label: '"Attention Is All You Need"', color: C.purple },
            { y: 2020, label: 'GPT-3',                color: C.pink },
            { y: 2022, label: 'ChatGPT release',      color: C.teal },
            { y: 2024, label: 'Multimodal LLMs',      color: C.blue },
            { y: 2026, label: 'AI in your daily CE workflow', color: C.green }
        ];
        let view = fitCanvas(canvas);
        let progress = 0;

        if (slider) slider.addEventListener('input', (e) => {
            progress = parseInt(e.target.value, 10) / 100;
        });
        window.addEventListener('resize', () => view = fitCanvas(canvas));

        onVisible(canvas, (t) => {
            const ctx = view.ctx;
            const time = t * 0.001;
            ctx.clearRect(0, 0, view.w, view.h);

            const yearMin = 1950, yearMax = 2026;
            const currentYear = Math.round(yearMin + progress * (yearMax - yearMin));
            if (yearLbl) yearLbl.textContent = currentYear;

            const padX = 30, padY = 60;
            const lineY = view.h - padY;
            const xMap = (yr) => padX + ((yr - yearMin) / (yearMax - yearMin)) * (view.w - padX * 2);

            // baseline gradient
            const lg = ctx.createLinearGradient(padX, 0, view.w - padX, 0);
            lg.addColorStop(0, rgba(C.teal, 0.5));
            lg.addColorStop(0.5, rgba(C.blue, 0.5));
            lg.addColorStop(1, rgba(C.purple, 0.7));
            ctx.strokeStyle = lg;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(padX, lineY); ctx.lineTo(view.w - padX, lineY);
            ctx.stroke();

            // decade ticks
            ctx.fillStyle = rgba(C.text, 0.4);
            ctx.font = '10px JetBrains Mono, monospace';
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            for (let yr = 1950; yr <= 2020; yr += 10) {
                const x = xMap(yr);
                ctx.beginPath();
                ctx.moveTo(x, lineY); ctx.lineTo(x, lineY + 6);
                ctx.strokeStyle = rgba(C.text, 0.15);
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillText(yr, x, lineY + 10);
            }

            // event markers (above and below)
            events.forEach((ev, i) => {
                const x = xMap(ev.y);
                const reached = ev.y <= currentYear;
                const above = i % 2 === 0;
                const yOff = (i % 2 === 0 ? -1 : 1) * (38 + (i % 4) * 20);
                const my = lineY + yOff;
                // connector
                ctx.strokeStyle = rgba(ev.color, reached ? 0.7 : 0.18);
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, lineY); ctx.lineTo(x, my);
                ctx.stroke();
                // dot
                const pulse = reached ? 0.5 + 0.5 * Math.sin(time * 2 + i) : 0;
                ctx.beginPath();
                ctx.arc(x, my, 4 + pulse * 2, 0, Math.PI * 2);
                ctx.fillStyle = rgba(ev.color, reached ? 0.95 : 0.25);
                ctx.fill();
                if (reached) {
                    ctx.beginPath();
                    ctx.arc(x, my, 9 + pulse * 4, 0, Math.PI * 2);
                    ctx.fillStyle = rgba(ev.color, 0.12);
                    ctx.fill();
                }
                // label
                ctx.fillStyle = rgba(C.text, reached ? 0.95 : 0.35);
                ctx.font = (reached ? 'bold ' : '') + '10px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = above ? 'bottom' : 'top';
                const ty = above ? my - 8 : my + 8;
                ctx.fillText(ev.label, x, ty);
                ctx.fillStyle = rgba(ev.color, reached ? 0.8 : 0.3);
                ctx.font = '9px JetBrains Mono, monospace';
                ctx.fillText(ev.y, x, above ? my - 22 : my + 20);
            });

            // current year cursor
            const cx = xMap(currentYear);
            ctx.strokeStyle = rgba(C.amber, 0.9);
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(cx, 4); ctx.lineTo(cx, view.h - 8);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = rgba(C.amber, 0.95);
            ctx.font = 'bold 13px JetBrains Mono, monospace';
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText(currentYear, cx, 6);
        });
    }

    /* =========================================================
       4. AI TYPES SPECTRUM (ANI / AGI / ASI)
       ========================================================= */
    function initAITypes() {
        const canvas = document.getElementById('ai-types-canvas');
        if (!canvas) return;
        let view = fitCanvas(canvas);
        const types = [
            { name: 'Narrow AI (ANI)',  desc: 'Excels at one task. Everything we use today.', color: C.teal, level: 1 },
            { name: 'General AI (AGI)', desc: 'Human-level across all domains. Theoretical.', color: C.amber, level: 2 },
            { name: 'Super AI (ASI)',   desc: 'Surpasses all humans combined. Hypothetical.', color: C.red, level: 3 }
        ];
        let mouse = { x: -999, y: -999 };
        let hover = -1;

        canvas.addEventListener('mousemove', (e) => {
            const r = canvas.getBoundingClientRect();
            mouse.x = e.clientX - r.left;
            mouse.y = e.clientY - r.top;
        });
        canvas.addEventListener('mouseleave', () => { mouse.x = -999; });
        window.addEventListener('resize', () => view = fitCanvas(canvas));

        onVisible(canvas, (t) => {
            const ctx = view.ctx;
            const time = t * 0.001;
            ctx.clearRect(0, 0, view.w, view.h);

            const baseY = view.h - 50;
            const stepW = view.w / (types.length + 1);

            // climbing staircase
            ctx.fillStyle = rgba(C.text, 0.05);
            ctx.beginPath();
            ctx.moveTo(0, baseY);
            for (let i = 0; i < types.length; i++) {
                const x = (i + 1) * stepW;
                const y = baseY - (i + 1) * 50;
                ctx.lineTo(x - stepW * 0.5, baseY);
                ctx.lineTo(x - stepW * 0.5, y);
                ctx.lineTo(x + stepW * 0.5, y);
            }
            ctx.lineTo(view.w, baseY);
            ctx.closePath();
            ctx.fill();

            hover = -1;
            types.forEach((typ, i) => {
                const x = (i + 1) * stepW;
                const y = baseY - (i + 1) * 50 - 20;
                const d = Math.hypot(mouse.x - x, mouse.y - y);
                if (d < 50) hover = i;
                const pulse = 0.5 + 0.5 * Math.sin(time * 2 + i * 1.2);
                const r = (hover === i ? 38 : 30);
                const g = ctx.createRadialGradient(x, y, 4, x, y, r);
                g.addColorStop(0, rgba(typ.color, 0.95));
                g.addColorStop(1, rgba(typ.color, 0.05));
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(x, y, r + pulse * 3, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 14px Inter, sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(typ.level === 1 ? 'NOW' : (typ.level === 2 ? '?' : '∞'), x, y);
                ctx.fillStyle = rgba(C.text, 0.95);
                ctx.font = 'bold 12px Inter, sans-serif';
                ctx.fillText(typ.name, x, y + r + 16);
            });

            if (hover >= 0) {
                const t2 = types[hover];
                ctx.fillStyle = 'rgba(0,0,0,0.85)';
                ctx.strokeStyle = rgba(t2.color, 0.7);
                ctx.lineWidth = 1;
                ctx.font = '11px Inter, sans-serif';
                const tw = Math.min(280, ctx.measureText(t2.desc).width + 20);
                const tx = Math.max(6, Math.min(view.w - tw - 6, mouse.x - tw / 2));
                const ty = Math.max(6, mouse.y - 36);
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(tx, ty, tw, 26, 5); else ctx.rect(tx, ty, tw, 26);
                ctx.fill(); ctx.stroke();
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                ctx.fillText(t2.desc, tx + 10, ty + 13);
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            }
        });
    }

    /* =========================================================
       5. ML PIPELINE - animated flow nodes
       ========================================================= */
    function initPipeline() {
        const canvas = document.getElementById('pipeline-canvas');
        if (!canvas) return;
        let view = fitCanvas(canvas);
        const stages = [
            { name: 'Collect',  icon: '📊', color: C.teal },
            { name: 'Clean',    icon: '🧹', color: C.blue },
            { name: 'Engineer', icon: '⚙', color: C.amber },
            { name: 'Train',    icon: '🧠', color: C.purple },
            { name: 'Evaluate', icon: '📈', color: C.green },
            { name: 'Deploy',   icon: '🚀', color: C.red }
        ];
        window.addEventListener('resize', () => view = fitCanvas(canvas));

        onVisible(canvas, (t) => {
            const ctx = view.ctx;
            ctx.clearRect(0, 0, view.w, view.h);
            const time = t * 0.001;
            const padX = 50;
            const cy = view.h / 2;
            const dx = (view.w - padX * 2) / (stages.length - 1);

            // Connection track
            ctx.strokeStyle = rgba(C.text, 0.1);
            ctx.lineWidth = 24;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(padX, cy);
            ctx.lineTo(view.w - padX, cy);
            ctx.stroke();
            // Active gradient pulse
            const lg = ctx.createLinearGradient(padX, 0, view.w - padX, 0);
            const phase = (Math.sin(time) * 0.5 + 0.5);
            lg.addColorStop(Math.max(0, phase - 0.15), 'rgba(0,212,170,0)');
            lg.addColorStop(phase,                     rgba(C.teal, 0.7));
            lg.addColorStop(Math.min(1, phase + 0.15), 'rgba(0,212,170,0)');
            ctx.strokeStyle = lg;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(padX, cy); ctx.lineTo(view.w - padX, cy);
            ctx.stroke();

            stages.forEach((s, i) => {
                const x = padX + i * dx;
                const pulse = 0.5 + 0.5 * Math.sin(time * 2 + i * 0.6);
                const r = 24;
                const g = ctx.createRadialGradient(x, cy, 4, x, cy, r);
                g.addColorStop(0, rgba(s.color, 1));
                g.addColorStop(1, rgba(s.color, 0.15));
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(x, cy, r + pulse * 6, 0, Math.PI * 2);
                ctx.fillStyle = rgba(s.color, 0.08);
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = '18px Inter, sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(s.icon, x, cy);
                ctx.fillStyle = rgba(C.text, 0.85);
                ctx.font = 'bold 11px Inter, sans-serif';
                ctx.fillText(`${i + 1}. ${s.name}`, x, cy + 42);
            });

            // moving data packets
            for (let k = 0; k < 4; k++) {
                const tt = ((time * 0.25 + k * 0.25) % 1);
                const x = padX + tt * (view.w - padX * 2);
                ctx.beginPath();
                ctx.arc(x, cy, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#fff';
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x, cy, 6, 0, Math.PI * 2);
                ctx.fillStyle = rgba(C.teal, 0.5);
                ctx.fill();
            }
        });
    }

    /* =========================================================
       6. DAM vs RIVER - twin canvas, slider drives time
       ========================================================= */
    function initDamRiver() {
        const damC = document.getElementById('dam-canvas');
        const rivC = document.getElementById('river-canvas');
        const slider = document.getElementById('time-slider');
        if (!damC || !rivC) return;
        let dv = fitCanvas(damC);
        let rv = fitCanvas(rivC);
        let progress = 0;

        if (slider) slider.addEventListener('input', (e) => progress = e.target.value / 100);
        window.addEventListener('resize', () => { dv = fitCanvas(damC); rv = fitCanvas(rivC); });

        function drawDam(time) {
            const ctx = dv.ctx, w = dv.w, h = dv.h;
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#0a0e15';
            ctx.fillRect(0, 0, w, h);
            // grid
            ctx.strokeStyle = rgba(C.teal, 0.06);
            for (let x = 0; x < w; x += 22) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
            for (let y = 0; y < h; y += 22) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
            // ground
            const ground = h * 0.82;
            ctx.fillStyle = rgba(C.amber, 0.1);
            ctx.fillRect(0, ground, w, h - ground);
            // water (RISING - because dam can't adapt)
            const waterRise = progress * (ground * 0.5);
            const waterY = ground - 80 - waterRise;
            ctx.fillStyle = rgba(C.blue, 0.25);
            ctx.fillRect(0, waterY, w * 0.42, ground - waterY);
            // water animated waves
            ctx.beginPath();
            for (let x = 0; x <= w * 0.42; x += 4) {
                const y = waterY + Math.sin(x * 0.06 + time * 2) * 3;
                if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.lineTo(w * 0.42, ground); ctx.lineTo(0, ground); ctx.closePath();
            ctx.fillStyle = rgba(C.blue, 0.35);
            ctx.fill();
            // dam (rigid trapezoid)
            const dx0 = w * 0.42, dxw = 36, dxw2 = 60;
            const damTopY = ground - 110;
            ctx.beginPath();
            ctx.moveTo(dx0, damTopY);
            ctx.lineTo(dx0 + dxw, damTopY);
            ctx.lineTo(dx0 + dxw2, ground);
            ctx.lineTo(dx0 - 8, ground);
            ctx.closePath();
            ctx.fillStyle = rgba(C.teal, 0.18);
            ctx.fill();
            ctx.strokeStyle = rgba(C.teal, 0.85);
            ctx.lineWidth = 2;
            ctx.stroke();
            // dam internal hatching
            ctx.strokeStyle = rgba(C.teal, 0.35);
            ctx.lineWidth = 0.6;
            for (let i = 0; i < 8; i++) {
                ctx.beginPath();
                ctx.moveTo(dx0, damTopY + i * 14);
                ctx.lineTo(dx0 + dxw + (i / 8) * (dxw2 - dxw), damTopY + i * 14);
                ctx.stroke();
            }
            // overflow (when water rises above dam)
            if (waterY < damTopY) {
                ctx.fillStyle = rgba(C.red, 0.7);
                ctx.font = 'bold 11px Inter, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('⚠ OVERTOPPING - design exceeded', 10, 24);
                // splash particles
                for (let p = 0; p < 30; p++) {
                    const px = dx0 + Math.random() * dxw2;
                    const py = damTopY + Math.random() * 30 - 10;
                    ctx.beginPath();
                    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = rgba(C.blue, 0.9);
                    ctx.fill();
                }
            }
            // year label
            ctx.fillStyle = rgba(C.amber, 0.9);
            ctx.font = 'bold 14px JetBrains Mono, monospace';
            ctx.textAlign = 'right';
            const year = Math.round(1980 + progress * 46);
            ctx.fillText(`Year ${year}`, w - 14, 22);
            ctx.fillStyle = rgba(C.text, 0.55);
            ctx.font = '10px Inter, sans-serif';
            ctx.fillText('Design parameters: FROZEN at 1980', w - 14, 38);
            // RIGID stamp
            ctx.save();
            ctx.translate(w * 0.7, h * 0.55);
            ctx.rotate(-0.3);
            ctx.fillStyle = rgba(C.red, 0.18);
            ctx.font = 'bold 28px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('RIGID', 0, 0);
            ctx.restore();
        }

        function drawRiver(time) {
            const ctx = rv.ctx, w = rv.w, h = rv.h;
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#0a0e15';
            ctx.fillRect(0, 0, w, h);
            // contour learning lines (more appear over time)
            const numLines = 4 + Math.floor(progress * 12);
            for (let i = 0; i < numLines; i++) {
                ctx.beginPath();
                const yc = h * 0.5 + (i - numLines / 2) * 8;
                for (let x = 0; x <= w; x += 4) {
                    const y = yc + Math.sin(x * 0.02 + time + i * 0.3) * (10 + i) + Math.cos(x * 0.012 - time * 0.6) * 6;
                    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                const a = 0.05 + (i / numLines) * 0.15;
                ctx.strokeStyle = rgba(C.teal, a);
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            // river body
            const numFlows = 6 + Math.floor(progress * 10);
            const bandH = 60 + progress * 80;
            for (let i = 0; i < numFlows; i++) {
                ctx.beginPath();
                const yo = (i / numFlows - 0.5) * bandH;
                for (let x = 0; x <= w; x += 4) {
                    const y = h * 0.5 + yo + Math.sin(x * 0.03 + time * (0.5 + progress * 1.5) + i) * (3 + progress * 8);
                    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.strokeStyle = rgba(C.blue, 0.10 + progress * 0.20);
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            // learned data points
            const numPts = Math.floor(progress * 80);
            for (let i = 0; i < numPts; i++) {
                const seed = i * 47.3;
                const px = (Math.sin(seed) * 0.5 + 0.5) * w;
                const py = h * 0.5 + Math.cos(seed * 1.7) * bandH * 0.6;
                const pulse = Math.sin(time * 2 + i) * 0.5 + 0.5;
                ctx.beginPath();
                ctx.arc(px, py, 1.8 + pulse, 0, Math.PI * 2);
                ctx.fillStyle = rgba(C.teal, 0.6 + pulse * 0.3);
                ctx.fill();
            }
            // year + intelligence stats
            const year = Math.round(1980 + progress * 46);
            ctx.fillStyle = rgba(C.teal, 0.95);
            ctx.font = 'bold 14px JetBrains Mono, monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`Year ${year}`, 14, 22);
            ctx.fillStyle = rgba(C.text, 0.7);
            ctx.font = '10px Inter, sans-serif';
            ctx.fillText(`Patterns learned: ${Math.floor(progress * 142)}`, 14, 40);
            ctx.fillText(`Data points absorbed: ${numPts * 50}`, 14, 56);
            const acc = Math.min(98, 32 + progress * 65).toFixed(0);
            ctx.fillStyle = rgba(C.green, 0.95);
            ctx.font = 'bold 11px JetBrains Mono, monospace';
            ctx.fillText(`Flood prediction accuracy: ${acc}%`, 14, 76);
            // ADAPTING badge
            ctx.fillStyle = rgba(C.green, 0.18 + Math.sin(time * 3) * 0.06);
            ctx.font = 'bold 28px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ADAPTING', w * 0.7, h * 0.85);
        }

        onVisible(damC, (t) => drawDam(t * 0.001));
        onVisible(rivC, (t) => drawRiver(t * 0.001));
    }

    /* =========================================================
       7. RL - agent learns to navigate a grid
       ========================================================= */
    function initRL() {
        const canvas = document.getElementById('rl-canvas');
        if (!canvas) return;
        const startBtn = document.getElementById('rl-start-btn');
        const resetBtn = document.getElementById('rl-reset-btn');
        const stat = document.getElementById('rl-episode');
        let view = fitCanvas(canvas);
        const cols = 12, rows = 8;
        let grid, q, agent, ep, reward, training, trail;
        let timer = null;
        // obstacles + goal
        const obstacles = [
            [3,2],[3,3],[3,4],[6,5],[6,6],[7,6],[8,3],[8,4],[2,6]
        ];
        const goal = [cols - 1, rows - 1];
        const start = [0, 0];

        function reset() {
            q = {};
            agent = [...start];
            ep = 0; reward = 0;
            trail = [];
            updateStat();
            draw();
        }
        function key(x,y,a) { return `${x},${y},${a}`; }
        function getQ(x,y,a) { return q[key(x,y,a)] || 0; }
        function setQ(x,y,a,v) { q[key(x,y,a)] = v; }

        function isObstacle(x,y) {
            return obstacles.some(o => o[0]===x && o[1]===y);
        }
        function step() {
            // epsilon-greedy
            const eps = Math.max(0.05, 0.5 - ep * 0.005);
            const actions = [[0,-1],[1,0],[0,1],[-1,0]];
            let a;
            if (Math.random() < eps) {
                a = Math.floor(Math.random() * 4);
            } else {
                let best = -1, bestQ = -Infinity;
                for (let i = 0; i < 4; i++) {
                    const v = getQ(agent[0], agent[1], i);
                    if (v > bestQ) { bestQ = v; best = i; }
                }
                a = best < 0 ? Math.floor(Math.random() * 4) : best;
            }
            const [dx, dy] = actions[a];
            let nx = agent[0] + dx, ny = agent[1] + dy;
            let r = -1;
            if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) {
                nx = agent[0]; ny = agent[1]; r = -5;
            } else if (isObstacle(nx, ny)) {
                r = -10;
                nx = agent[0]; ny = agent[1];
            } else if (nx === goal[0] && ny === goal[1]) {
                r = 100;
            }
            // Q-learning update
            let maxNext = -Infinity;
            for (let i = 0; i < 4; i++) maxNext = Math.max(maxNext, getQ(nx, ny, i));
            const oldQ = getQ(agent[0], agent[1], a);
            const newQ = oldQ + 0.3 * (r + 0.9 * maxNext - oldQ);
            setQ(agent[0], agent[1], a, newQ);
            agent = [nx, ny];
            reward += r;
            trail.push([nx, ny]);
            if (trail.length > 80) trail.shift();
            if (nx === goal[0] && ny === goal[1]) {
                ep++;
                agent = [...start];
                reward = 0;
                trail = [];
            }
            updateStat();
        }
        function updateStat() {
            if (stat) stat.textContent = `Episode: ${ep} | ε: ${Math.max(0.05, 0.5 - ep * 0.005).toFixed(2)} | Reward: ${reward}`;
        }
        function draw() {
            const ctx = view.ctx;
            ctx.clearRect(0, 0, view.w, view.h);
            ctx.fillStyle = '#0a0e15';
            ctx.fillRect(0, 0, view.w, view.h);
            const cellW = view.w / cols;
            const cellH = view.h / rows;
            // draw cells with Q-value heatmap
            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    let maxQ = 0;
                    for (let a = 0; a < 4; a++) maxQ = Math.max(maxQ, getQ(x, y, a));
                    const intensity = Math.min(1, maxQ / 50);
                    ctx.fillStyle = rgba(C.teal, 0.05 + intensity * 0.45);
                    ctx.fillRect(x * cellW + 1, y * cellH + 1, cellW - 2, cellH - 2);
                    // arrow toward best action
                    if (maxQ > 1) {
                        let best = 0, bv = -Infinity;
                        for (let a = 0; a < 4; a++) {
                            const v = getQ(x, y, a);
                            if (v > bv) { bv = v; best = a; }
                        }
                        const arrows = ['↑','→','↓','←'];
                        ctx.fillStyle = rgba(C.text, 0.7);
                        ctx.font = `${Math.min(cellW, cellH) * 0.4}px Inter, sans-serif`;
                        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        ctx.fillText(arrows[best], x * cellW + cellW / 2, y * cellH + cellH / 2);
                    }
                }
            }
            // grid lines
            ctx.strokeStyle = rgba(C.text, 0.08);
            ctx.lineWidth = 0.5;
            for (let x = 0; x <= cols; x++) {
                ctx.beginPath(); ctx.moveTo(x * cellW, 0); ctx.lineTo(x * cellW, view.h); ctx.stroke();
            }
            for (let y = 0; y <= rows; y++) {
                ctx.beginPath(); ctx.moveTo(0, y * cellH); ctx.lineTo(view.w, y * cellH); ctx.stroke();
            }
            // obstacles
            obstacles.forEach(([x, y]) => {
                ctx.fillStyle = rgba(C.red, 0.55);
                ctx.fillRect(x * cellW + 4, y * cellH + 4, cellW - 8, cellH - 8);
                ctx.fillStyle = '#fff';
                ctx.font = `${Math.min(cellW, cellH) * 0.4}px Inter, sans-serif`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('🚧', x * cellW + cellW / 2, y * cellH + cellH / 2);
            });
            // goal
            const [gx, gy] = goal;
            ctx.fillStyle = rgba(C.green, 0.5);
            ctx.fillRect(gx * cellW + 2, gy * cellH + 2, cellW - 4, cellH - 4);
            ctx.fillStyle = '#fff';
            ctx.font = `${Math.min(cellW, cellH) * 0.5}px Inter, sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('🏁', gx * cellW + cellW / 2, gy * cellH + cellH / 2);
            // trail
            ctx.strokeStyle = rgba(C.teal, 0.4);
            ctx.lineWidth = 2;
            ctx.beginPath();
            trail.forEach((p, i) => {
                const cx = p[0] * cellW + cellW / 2;
                const cy = p[1] * cellH + cellH / 2;
                if (i === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
            });
            ctx.stroke();
            // agent
            const ax = agent[0] * cellW + cellW / 2;
            const ay = agent[1] * cellH + cellH / 2;
            ctx.beginPath();
            ctx.arc(ax, ay, Math.min(cellW, cellH) * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = rgba(C.amber, 0.95);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = `bold ${Math.min(cellW, cellH) * 0.35}px Inter, sans-serif`;
            ctx.fillText('🚜', ax, ay);
        }

        if (startBtn) startBtn.addEventListener('click', () => {
            if (training) {
                clearInterval(timer);
                training = false;
                startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Training';
            } else {
                training = true;
                startBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
                timer = setInterval(() => {
                    for (let i = 0; i < 6; i++) step();
                    draw();
                }, 60);
            }
        });
        if (resetBtn) resetBtn.addEventListener('click', () => {
            if (timer) { clearInterval(timer); timer = null; }
            training = false;
            if (startBtn) startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Start Training';
            reset();
        });
        window.addEventListener('resize', () => { view = fitCanvas(canvas); draw(); });
        reset();
    }

    /* =========================================================
       8. NEURAL NETWORK VISUALIZER (depth + width sliders)
       ========================================================= */
    function initNN() {
        const canvas = document.getElementById('nn-canvas');
        if (!canvas) return;
        const dSlider = document.getElementById('nn-depth-slider');
        const wSlider = document.getElementById('nn-width-slider');
        const dLabel = document.getElementById('nn-depth-label');
        const wLabel = document.getElementById('nn-width-label');
        let view = fitCanvas(canvas);
        let depth = 4, width = 6;
        let mouse = { x: -999, y: -999 };

        function update() {
            depth = parseInt(dSlider?.value || 4, 10);
            width = parseInt(wSlider?.value || 6, 10);
            if (dLabel) dLabel.textContent = `${depth} layers`;
            if (wLabel) wLabel.textContent = `${width}`;
        }
        if (dSlider) dSlider.addEventListener('input', update);
        if (wSlider) wSlider.addEventListener('input', update);
        canvas.addEventListener('mousemove', (e) => {
            const r = canvas.getBoundingClientRect();
            mouse.x = e.clientX - r.left;
            mouse.y = e.clientY - r.top;
        });
        canvas.addEventListener('mouseleave', () => { mouse.x = -999; });
        window.addEventListener('resize', () => view = fitCanvas(canvas));
        update();

        onVisible(canvas, (t) => {
            const ctx = view.ctx;
            const time = t * 0.001;
            ctx.clearRect(0, 0, view.w, view.h);
            const layers = [];
            for (let l = 0; l < depth; l++) {
                const isInput = l === 0;
                const isOutput = l === depth - 1;
                const n = isInput ? 4 : (isOutput ? 2 : width);
                const layer = [];
                for (let i = 0; i < n; i++) {
                    layer.push({
                        x: 60 + l * ((view.w - 120) / Math.max(1, depth - 1)),
                        y: (i + 0.5) * (view.h / n),
                        a: 0.4 + 0.6 * (Math.sin(time * 2 + i + l) * 0.5 + 0.5),
                        l, i
                    });
                }
                layers.push(layer);
            }
            // edges
            for (let l = 0; l < layers.length - 1; l++) {
                const A = layers[l], B = layers[l + 1];
                A.forEach(a => B.forEach(b => {
                    const md = Math.min(Math.hypot(mouse.x - a.x, mouse.y - a.y),
                                       Math.hypot(mouse.x - b.x, mouse.y - b.y));
                    const high = md < 50;
                    const flow = (Math.sin(time * 3 + l + a.i + b.i) * 0.5 + 0.5);
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = rgba(high ? C.amber : C.teal, 0.05 + flow * 0.18 + (high ? 0.4 : 0));
                    ctx.lineWidth = high ? 1.5 : 0.7;
                    ctx.stroke();
                    // signal packet
                    if (flow > 0.85) {
                        const px = a.x + (b.x - a.x) * (flow - 0.85) / 0.15;
                        const py = a.y + (b.y - a.y) * (flow - 0.85) / 0.15;
                        ctx.beginPath();
                        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                        ctx.fillStyle = rgba(C.teal, 0.95);
                        ctx.fill();
                    }
                }));
            }
            // nodes
            layers.forEach((layer, l) => {
                const isInput = l === 0;
                const isOutput = l === layers.length - 1;
                const color = isInput ? C.blue : (isOutput ? C.amber : C.teal);
                layer.forEach(n => {
                    const md = Math.hypot(mouse.x - n.x, mouse.y - n.y);
                    const high = md < 30;
                    const r = high ? 13 : 9;
                    const g = ctx.createRadialGradient(n.x, n.y, 1, n.x, n.y, r);
                    g.addColorStop(0, rgba(color, 0.9));
                    g.addColorStop(1, rgba(color, 0.05));
                    ctx.fillStyle = g;
                    ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill();
                });
                // layer label
                const lbl = isInput ? 'INPUT' : (isOutput ? 'OUTPUT' : `HIDDEN ${l}`);
                ctx.fillStyle = rgba(C.text, 0.55);
                ctx.font = '10px JetBrains Mono, monospace';
                ctx.textAlign = 'center'; ctx.textBaseline = 'top';
                ctx.fillText(lbl, layer[0].x, view.h - 18);
            });
            // params count
            let edges = 0;
            for (let l = 0; l < layers.length - 1; l++) edges += layers[l].length * layers[l + 1].length;
            ctx.fillStyle = rgba(C.amber, 0.85);
            ctx.font = 'bold 11px JetBrains Mono, monospace';
            ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.fillText(`weights ≈ ${edges}`, 12, 10);
        });
    }

    /* =========================================================
       9. TAXONOMY MAP - hierarchical, animated
       ========================================================= */
    function initTaxonomy() {
        const canvas = document.getElementById('taxonomy-canvas');
        if (!canvas) return;
        let view = fitCanvas(canvas);
        const tree = {
            id: 'AI', label: 'AI', color: C.purple, children: [
                { id: 'Rule', label: 'Rule-Based', color: C.amber, children: [
                    { id: 'ES', label: 'Expert Systems', color: C.amber },
                    { id: 'Search', label: 'Search Algorithms', color: C.amber }
                ]},
                { id: 'ML', label: 'Machine Learning', color: C.teal, children: [
                    { id: 'Sup',  label: 'Supervised', color: C.teal },
                    { id: 'Uns',  label: 'Unsupervised', color: C.teal },
                    { id: 'RL',   label: 'Reinforcement', color: C.teal },
                    { id: 'DL',   label: 'Deep Learning', color: C.blue, children: [
                        { id: 'CNN', label: 'CNNs',         color: C.blue },
                        { id: 'RNN', label: 'RNNs',         color: C.blue },
                        { id: 'TR',  label: 'Transformers', color: C.blue },
                        { id: 'GAN', label: 'GANs',         color: C.blue }
                    ]}
                ]}
            ]
        };
        let mouse = { x: -999, y: -999 };
        let nodes = [];

        canvas.addEventListener('mousemove', (e) => {
            const r = canvas.getBoundingClientRect();
            mouse.x = e.clientX - r.left;
            mouse.y = e.clientY - r.top;
        });
        canvas.addEventListener('mouseleave', () => { mouse.x = -999; });
        window.addEventListener('resize', () => view = fitCanvas(canvas));

        function layout() {
            nodes = [];
            // breadth first by depth
            const depthMap = {};
            function walk(n, d) {
                if (!depthMap[d]) depthMap[d] = [];
                depthMap[d].push(n);
                (n.children || []).forEach(c => walk(c, d + 1));
            }
            walk(tree, 0);
            const maxDepth = Object.keys(depthMap).length;
            Object.keys(depthMap).forEach(d => {
                const arr = depthMap[d];
                const y = ((+d) + 0.5) * (view.h / maxDepth);
                arr.forEach((n, i) => {
                    n._x = (i + 0.5) * (view.w / arr.length);
                    n._y = y;
                    nodes.push(n);
                });
            });
        }
        layout();
        window.addEventListener('resize', layout);

        onVisible(canvas, (t) => {
            const ctx = view.ctx;
            const time = t * 0.001;
            ctx.clearRect(0, 0, view.w, view.h);
            layout();

            // edges
            function drawEdges(n) {
                (n.children || []).forEach(c => {
                    const md = Math.min(Math.hypot(mouse.x - n._x, mouse.y - n._y),
                                       Math.hypot(mouse.x - c._x, mouse.y - c._y));
                    const high = md < 30;
                    ctx.beginPath();
                    const cx1 = n._x, cy1 = n._y + 24;
                    const cx2 = c._x, cy2 = c._y - 24;
                    ctx.moveTo(n._x, n._y);
                    ctx.bezierCurveTo(cx1, cy1, cx2, cy2, c._x, c._y);
                    ctx.strokeStyle = rgba(c.color, high ? 0.85 : 0.25);
                    ctx.lineWidth = high ? 2 : 1;
                    ctx.stroke();
                    drawEdges(c);
                });
            }
            drawEdges(tree);

            // nodes
            nodes.forEach((n, i) => {
                const md = Math.hypot(mouse.x - n._x, mouse.y - n._y);
                const high = md < 32;
                const pulse = 0.5 + 0.5 * Math.sin(time * 2 + i);
                const r = high ? 26 : 20;
                const g = ctx.createRadialGradient(n._x, n._y, 2, n._x, n._y, r);
                g.addColorStop(0, rgba(n.color, 0.95));
                g.addColorStop(1, rgba(n.color, 0.08));
                ctx.fillStyle = g;
                ctx.beginPath(); ctx.arc(n._x, n._y, r + pulse * 2, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = (high ? 'bold ' : '') + '10px Inter, sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(n.label, n._x, n._y);
            });
        });
    }

    /* =========================================================
       10. BIAS DEMO - toggle balanced vs biased data
       ========================================================= */
    function initBias() {
        const canvas = document.getElementById('bias-canvas');
        if (!canvas) return;
        let view = fitCanvas(canvas);
        let biased = true;
        canvas.addEventListener('click', () => { biased = !biased; });
        window.addEventListener('resize', () => view = fitCanvas(canvas));

        function rng(seed) {
            return () => {
                seed = (seed * 9301 + 49297) % 233280;
                return seed / 233280;
            };
        }

        onVisible(canvas, (t) => {
            const ctx = view.ctx;
            const time = t * 0.001;
            ctx.clearRect(0, 0, view.w, view.h);
            ctx.fillStyle = '#0a0e15';
            ctx.fillRect(0, 0, view.w, view.h);

            // ground truth: a tilted plane (decision boundary)
            const cx = view.w / 2, cy = view.h / 2;
            // True line
            const trueA = 0.6;
            ctx.strokeStyle = rgba(C.green, 0.7);
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 6]);
            ctx.beginPath();
            ctx.moveTo(0, cy + view.w * trueA / 2);
            ctx.lineTo(view.w, cy - view.w * trueA / 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Generate data points
            const rand = rng(42);
            const n = 200;
            const pts = [];
            for (let i = 0; i < n; i++) {
                let x, y;
                if (biased) {
                    // biased: cluster mostly on left/upper area
                    x = rand() * view.w * 0.55;
                    y = rand() * view.h * 0.55;
                } else {
                    x = rand() * view.w;
                    y = rand() * view.h;
                }
                const trueY = cy - (x - cx) * trueA;
                const cls = y < trueY ? 0 : 1;
                pts.push({ x, y, cls });
            }
            pts.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = rgba(p.cls === 0 ? C.teal : C.amber, 0.7);
                ctx.fill();
            });

            // Fit linear separator (least squares-ish via mean)
            // We approximate the model line based on data only: weighted boundary
            // Fitted line: same form, slope estimated from points.
            let m1x = 0, m1y = 0, c1 = 0;
            let m2x = 0, m2y = 0, c2 = 0;
            pts.forEach(p => {
                if (p.cls === 0) { m1x += p.x; m1y += p.y; c1++; }
                else { m2x += p.x; m2y += p.y; c2++; }
            });
            if (c1 > 0) { m1x /= c1; m1y /= c1; }
            if (c2 > 0) { m2x /= c2; m2y /= c2; }
            // perpendicular bisector between class means
            const mx = (m1x + m2x) / 2, my = (m1y + m2y) / 2;
            const dx = m2x - m1x, dy = m2y - m1y;
            // line direction perpendicular to (dx, dy)
            const px = -dy, py = dx;
            const ln = Math.hypot(px, py) || 1;
            const ux = px / ln * 1000, uy = py / ln * 1000;
            ctx.strokeStyle = rgba(biased ? C.red : C.blue, 0.95);
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(mx - ux, my - uy);
            ctx.lineTo(mx + ux, my + uy);
            ctx.stroke();

            // legend
            ctx.fillStyle = rgba(C.text, 0.85);
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.fillText(biased ? '⚠ Biased Sample (left-skewed)' : '✓ Balanced Sample', 12, 12);
            ctx.font = '10px Inter, sans-serif';
            ctx.fillStyle = rgba(C.green, 0.8);
            ctx.fillText('— True boundary', 12, 32);
            ctx.fillStyle = rgba(biased ? C.red : C.blue, 0.95);
            ctx.fillText('— Model boundary (fit from sampled data)', 12, 48);
            ctx.fillStyle = rgba(C.text, 0.55);
            ctx.fillText('click anywhere to toggle', 12, view.h - 18);
        });
    }

    /* =========================================================
       QUIZ - check answers + confetti on correct
       ========================================================= */
    function fireConfetti(x, y) {
        const colors = [C.teal, C.amber, C.blue, C.green, C.red, C.purple, C.pink];
        const n = 60;
        const root = document.body;
        for (let i = 0; i < n; i++) {
            const c = document.createElement('div');
            c.className = 'confetti-particle';
            const color = colors[Math.floor(Math.random() * colors.length)];
            c.style.background = color;
            c.style.left = x + 'px';
            c.style.top = y + 'px';
            const ang = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 6;
            c.dataset.vx = Math.cos(ang) * speed;
            c.dataset.vy = Math.sin(ang) * speed - 3;
            c.dataset.life = 0;
            root.appendChild(c);
            // animate
            let vx = parseFloat(c.dataset.vx);
            let vy = parseFloat(c.dataset.vy);
            let cx = x, cy = y;
            let life = 0;
            const step = () => {
                life++;
                vy += 0.18;
                vx *= 0.99;
                cx += vx; cy += vy;
                c.style.transform = `translate(${cx - x}px, ${cy - y}px) rotate(${life * 14}deg)`;
                c.style.opacity = Math.max(0, 1 - life / 80);
                if (life < 90) requestAnimationFrame(step);
                else c.remove();
            };
            requestAnimationFrame(step);
        }
    }

    window.checkQuiz = function (el, quizId) {
        const block = document.getElementById(quizId);
        if (!block) return;
        const opts = block.querySelectorAll('.quiz-option');
        const correctFb = document.getElementById(quizId + '-correct');
        const wrongFb = document.getElementById(quizId + '-wrong');
        opts.forEach(o => {
            o.classList.remove('correct', 'wrong');
            o.style.pointerEvents = 'none';
        });
        const isCorrect = el.dataset.correct === 'true';
        opts.forEach(o => {
            if (o.dataset.correct === 'true') o.classList.add('correct');
        });
        if (!isCorrect) el.classList.add('wrong');
        if (correctFb) correctFb.style.display = isCorrect ? 'flex' : 'none';
        if (wrongFb) wrongFb.style.display = isCorrect ? 'none' : 'flex';

        if (isCorrect) {
            const r = el.getBoundingClientRect();
            fireConfetti(r.left + r.width / 2, r.top + r.height / 2 + window.scrollY - window.scrollY);
            // we add scrollY because confetti uses absolute positioning
            const x = r.left + r.width / 2;
            const y = r.top + r.height / 2;
            fireConfetti(x, y);
        }
        // re-enable other quizzes? Keep locked.
    };

    /* =========================================================
       Animated stat counters in hero
       ========================================================= */
    function initStatCounters() {
        const stats = document.querySelectorAll('.ch-stat strong');
        if (!stats.length) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting && !e.target.dataset.animated) {
                    e.target.dataset.animated = '1';
                    const tgt = parseInt(e.target.textContent, 10);
                    if (isNaN(tgt)) return;
                    let cur = 0;
                    const dur = 1200;
                    const start = performance.now();
                    const tick = (now) => {
                        const p = Math.min(1, (now - start) / dur);
                        cur = Math.floor(p * tgt);
                        e.target.textContent = cur;
                        if (p < 1) requestAnimationFrame(tick);
                        else e.target.textContent = tgt;
                    };
                    requestAnimationFrame(tick);
                }
            });
        }, { threshold: 0.4 });
        stats.forEach(s => observer.observe(s));
    }

    /* =========================================================
       Scroll progress + active TOC + reveal animations
       ========================================================= */
    function initScrollProgressAndReveal() {
        const bar = document.getElementById('scroll-progress');
        const sections = document.querySelectorAll('.ch-section');
        const tocLinks = document.querySelectorAll('.toc-link');
        window.addEventListener('scroll', () => {
            const sh = document.documentElement.scrollHeight - window.innerHeight;
            if (bar) bar.style.width = (window.scrollY / sh * 100) + '%';
            // active TOC
            let cur = '';
            sections.forEach(s => {
                if (window.scrollY + 220 >= s.offsetTop) cur = s.id;
            });
            tocLinks.forEach(l => {
                l.classList.toggle('active', l.getAttribute('href') === '#' + cur);
            });
        });
        // reveal
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) e.target.classList.add('reveal-in');
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
        document.querySelectorAll('.ch-section, .info-card, .analogy-block, .tip-box, .demo-panel, .process-step, .tree-leaf, .code-peek, .quiz-block, .comparison-table')
            .forEach(el => io.observe(el));
    }

    /* =========================================================
       Boot
       ========================================================= */
    document.addEventListener('DOMContentLoaded', () => {
        initHeroCanvas();
        initSubfields();
        initTimeline();
        initAITypes();
        initPipeline();
        initDamRiver();
        initRL();
        initNN();
        initTaxonomy();
        initBias();
        initStatCounters();
        initScrollProgressAndReveal();
    });
})();
