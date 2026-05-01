/* ============================================
   THE CIVIL ENGINEER'S GUIDE TO AI
   Main JavaScript — All Interactive Systems
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initScrollObserver();
    initHeroCanvas();
    initChapter1();
    initChapter2();
    initChapter3();
    initChapter4();
    initChapter5();
});

/* ============================
   NAVIGATION & SCROLL TRACKING
   ============================ */
function initNavigation() {
    const nav = document.getElementById('main-nav');
    const progressBar = document.getElementById('scroll-progress');
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        // Nav background
        nav.classList.toggle('scrolled', window.scrollY > 50);

        // Progress bar
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = (window.scrollY / scrollHeight) * 100;
        progressBar.style.width = scrolled + '%';

        // Active section
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 150;
            if (window.scrollY >= top) current = section.id;
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === current) link.classList.add('active');
        });
    });
}

/* ============================
   SCROLL OBSERVER (Reveal Animations)
   ============================ */
function initScrollObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.chapter-header, .concept-block, .interactive-panel, .key-takeaway')
        .forEach(el => observer.observe(el));
}

/* ============================
   HERO CANVAS — Topographic → Neural Network
   ============================ */
function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    const ctx = canvas.getContext('2d');
    let width, height, nodes = [], contourLines = [];
    let morphProgress = 0;

    function resize() {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
        generateElements();
    }

    function generateElements() {
        nodes = [];
        contourLines = [];

        // Generate nodes for neural network
        const cols = Math.ceil(width / 100);
        const rows = Math.ceil(height / 100);
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                nodes.push({
                    x: (i + 0.5) * (width / cols) + (Math.random() - 0.5) * 40,
                    y: (j + 0.5) * (height / rows) + (Math.random() - 0.5) * 40,
                    radius: 2 + Math.random() * 3,
                    pulse: Math.random() * Math.PI * 2
                });
            }
        }

        // Generate contour lines
        for (let i = 0; i < 12; i++) {
            const points = [];
            const baseY = (height / 14) * (i + 1);
            const segments = 60;
            for (let s = 0; s <= segments; s++) {
                points.push({
                    x: (width / segments) * s,
                    y: baseY + Math.sin(s * 0.3 + i) * 25 + Math.sin(s * 0.1 + i * 2) * 15
                });
            }
            contourLines.push(points);
        }
    }

    function draw(time) {
        ctx.clearRect(0, 0, width, height);

        // Background gradient
        const bg = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.7);
        bg.addColorStop(0, '#111118');
        bg.addColorStop(1, '#0a0a0f');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);

        const t = time * 0.001;

        // Calculate morph based on scroll
        const heroSection = document.getElementById('hero');
        const rect = heroSection.getBoundingClientRect();
        morphProgress = Math.max(0, Math.min(1, -rect.top / (rect.height * 0.6)));

        // Draw contour lines (fade out as morph increases)
        const contourAlpha = 1 - morphProgress;
        if (contourAlpha > 0.01) {
            contourLines.forEach((line, i) => {
                ctx.beginPath();
                ctx.moveTo(line[0].x, line[0].y);
                for (let p = 1; p < line.length; p++) {
                    const waveOffset = Math.sin(t + p * 0.15 + i * 0.5) * 3;
                    ctx.lineTo(line[p].x, line[p].y + waveOffset);
                }
                ctx.strokeStyle = `rgba(0, 212, 170, ${0.12 * contourAlpha})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        }

        // Draw neural network (fade in as morph increases)
        const neuralAlpha = morphProgress;
        if (neuralAlpha > 0.01) {
            // Connections
            nodes.forEach((node, i) => {
                nodes.forEach((other, j) => {
                    if (j <= i) return;
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 160) {
                        ctx.beginPath();
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(other.x, other.y);
                        const alpha = (1 - dist / 160) * 0.15 * neuralAlpha;
                        const pulse = Math.sin(t * 2 + i * 0.5) * 0.5 + 0.5;
                        ctx.strokeStyle = `rgba(14, 165, 233, ${alpha * (0.5 + pulse * 0.5)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            });

            // Nodes
            nodes.forEach((node, i) => {
                const pulse = Math.sin(t * 1.5 + node.pulse) * 0.5 + 0.5;
                const r = node.radius * (1 + pulse * 0.3);

                // Glow
                ctx.beginPath();
                ctx.arc(node.x, node.y, r * 4, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 212, 170, ${0.03 * neuralAlpha * pulse})`;
                ctx.fill();

                // Core
                ctx.beginPath();
                ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 212, 170, ${(0.4 + pulse * 0.4) * neuralAlpha})`;
                ctx.fill();
            });
        }

        requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(draw);
}

/* ============================
   CHAPTER 1: AI vs ML Split Screen
   ============================ */
function initChapter1() {
    const blueprintCanvas = document.getElementById('blueprint-canvas');
    const riverCanvas = document.getElementById('river-canvas');
    const slider = document.getElementById('time-slider');

    if (!blueprintCanvas || !riverCanvas) return;

    const bCtx = blueprintCanvas.getContext('2d');
    const rCtx = riverCanvas.getContext('2d');
    let timeValue = 0;

    function resizeCanvases() {
        const parent1 = blueprintCanvas.parentElement;
        const parent2 = riverCanvas.parentElement;
        blueprintCanvas.width = parent1.clientWidth;
        blueprintCanvas.height = 300;
        riverCanvas.width = parent2.clientWidth;
        riverCanvas.height = 300;
    }

    // Blueprint Drawing (Static)
    function drawBlueprint() {
        const w = blueprintCanvas.width;
        const h = blueprintCanvas.height;
        bCtx.clearRect(0, 0, w, h);

        // Background
        bCtx.fillStyle = '#0d0d14';
        bCtx.fillRect(0, 0, w, h);

        // Grid
        bCtx.strokeStyle = 'rgba(0, 212, 170, 0.06)';
        bCtx.lineWidth = 0.5;
        for (let x = 0; x < w; x += 20) {
            bCtx.beginPath(); bCtx.moveTo(x, 0); bCtx.lineTo(x, h); bCtx.stroke();
        }
        for (let y = 0; y < h; y += 20) {
            bCtx.beginPath(); bCtx.moveTo(0, y); bCtx.lineTo(w, y); bCtx.stroke();
        }

        // Dam structure (static — doesn't change with time)
        const damX = w * 0.3;
        const damW = w * 0.1;
        const damTop = h * 0.2;
        const damBottom = h * 0.85;

        // Dam body (trapezoid)
        bCtx.beginPath();
        bCtx.moveTo(damX, damTop);
        bCtx.lineTo(damX + damW, damTop);
        bCtx.lineTo(damX + damW * 1.5, damBottom);
        bCtx.lineTo(damX - damW * 0.5, damBottom);
        bCtx.closePath();
        bCtx.fillStyle = 'rgba(0, 212, 170, 0.08)';
        bCtx.fill();
        bCtx.strokeStyle = 'rgba(0, 212, 170, 0.4)';
        bCtx.lineWidth = 1.5;
        bCtx.stroke();

        // Water level (static)
        const waterY = h * 0.35;
        bCtx.beginPath();
        bCtx.moveTo(0, waterY);
        bCtx.lineTo(damX, waterY);
        bCtx.strokeStyle = 'rgba(14, 165, 233, 0.5)';
        bCtx.lineWidth = 1;
        bCtx.stroke();

        // Fill water
        bCtx.fillStyle = 'rgba(14, 165, 233, 0.06)';
        bCtx.fillRect(0, waterY, damX, damBottom - waterY);

        // Labels
        bCtx.fillStyle = 'rgba(0, 212, 170, 0.5)';
        bCtx.font = '10px Inter, sans-serif';
        bCtx.fillText('RIGID STRUCTURE', damX - 15, damTop - 10);
        bCtx.fillText('STATIC WATER LEVEL', 10, waterY - 8);

        // Dimensions
        bCtx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        bCtx.lineWidth = 0.5;
        bCtx.setLineDash([4, 4]);

        // Height dimension
        bCtx.beginPath();
        bCtx.moveTo(damX + damW * 1.8, damTop);
        bCtx.lineTo(damX + damW * 1.8, damBottom);
        bCtx.stroke();

        bCtx.fillStyle = 'rgba(245, 158, 11, 0.5)';
        bCtx.fillText('H = 65m', damX + damW * 1.8 + 5, (damTop + damBottom) / 2);

        bCtx.setLineDash([]);

        // Ground line
        bCtx.beginPath();
        bCtx.moveTo(0, damBottom);
        bCtx.lineTo(w, damBottom);
        bCtx.strokeStyle = 'rgba(139, 115, 85, 0.4)';
        bCtx.lineWidth = 2;
        bCtx.stroke();

        // Bedrock hatching
        for (let x = 0; x < w; x += 12) {
            bCtx.beginPath();
            bCtx.moveTo(x, damBottom + 2);
            bCtx.lineTo(x - 8, damBottom + 14);
            bCtx.strokeStyle = 'rgba(139, 115, 85, 0.15)';
            bCtx.lineWidth = 0.5;
            bCtx.stroke();
        }

        // "NO CHANGE" stamp
        bCtx.save();
        bCtx.globalAlpha = 0.1;
        bCtx.fillStyle = '#ef4444';
        bCtx.font = 'bold 28px Inter, sans-serif';
        bCtx.translate(w * 0.65, h * 0.5);
        bCtx.rotate(-0.2);
        bCtx.fillText('STATIC', 0, 0);
        bCtx.restore();
    }

    // River Drawing (Dynamic — changes with time slider)
    function drawRiver(time) {
        const w = riverCanvas.width;
        const h = riverCanvas.height;
        const t = timeValue / 100; // 0-1

        rCtx.clearRect(0, 0, w, h);

        // Background
        rCtx.fillStyle = '#0d0d14';
        rCtx.fillRect(0, 0, w, h);

        // Banks
        const bankWidth = t * 40 + 20; // River widens over time

        // Draw terrain
        const midY = h * 0.5;
        const bankAmplitude = 15 + t * 20;

        // Upper bank
        rCtx.beginPath();
        rCtx.moveTo(0, 0);
        for (let x = 0; x <= w; x += 2) {
            const y = midY - bankWidth - bankAmplitude + Math.sin(x * 0.02 + t * 3) * bankAmplitude * 0.5;
            rCtx.lineTo(x, y);
        }
        rCtx.lineTo(w, 0);
        rCtx.closePath();
        rCtx.fillStyle = 'rgba(34, 197, 94, 0.06)';
        rCtx.fill();

        // Lower bank
        rCtx.beginPath();
        rCtx.moveTo(0, h);
        for (let x = 0; x <= w; x += 2) {
            const y = midY + bankWidth + bankAmplitude + Math.sin(x * 0.02 + t * 3 + 1) * bankAmplitude * 0.5;
            rCtx.lineTo(x, y);
        }
        rCtx.lineTo(w, h);
        rCtx.closePath();
        rCtx.fillStyle = 'rgba(34, 197, 94, 0.06)';
        rCtx.fill();

        // River body
        const flowSpeed = 0.5 + t * 2;
        const animT = Date.now() * 0.001;

        // Flow lines
        const numFlows = 8 + Math.floor(t * 12);
        for (let i = 0; i < numFlows; i++) {
            const yOffset = (i / numFlows - 0.5) * bankWidth * 1.5;
            rCtx.beginPath();
            for (let x = 0; x <= w; x += 3) {
                const waveY = midY + yOffset +
                    Math.sin(x * 0.03 + animT * flowSpeed + i) * (5 + t * 10) +
                    Math.sin(x * 0.01 + animT * flowSpeed * 0.5) * (3 + t * 5);
                if (x === 0) rCtx.moveTo(x, waveY);
                else rCtx.lineTo(x, waveY);
            }
            const alpha = 0.08 + t * 0.12;
            rCtx.strokeStyle = `rgba(14, 165, 233, ${alpha})`;
            rCtx.lineWidth = 1;
            rCtx.stroke();
        }

        // Data points (appear as time increases - representing learned patterns)
        const numPoints = Math.floor(t * 30);
        for (let i = 0; i < numPoints; i++) {
            const seed = i * 137.5;
            const px = (Math.sin(seed) * 0.5 + 0.5) * w;
            const py = midY + (Math.cos(seed * 1.7) * 0.5) * bankWidth * 2;
            const pulseA = Math.sin(animT * 2 + i) * 0.5 + 0.5;

            rCtx.beginPath();
            rCtx.arc(px, py, 2 + pulseA * 2, 0, Math.PI * 2);
            rCtx.fillStyle = `rgba(0, 212, 170, ${0.3 + pulseA * 0.4})`;
            rCtx.fill();
        }

        // Year label
        const year = Math.floor(1980 + t * 46);
        rCtx.fillStyle = 'rgba(0, 212, 170, 0.6)';
        rCtx.font = 'bold 14px JetBrains Mono, monospace';
        rCtx.fillText(`Year: ${year}`, 12, 24);

        // Data count
        rCtx.fillStyle = 'rgba(14, 165, 233, 0.5)';
        rCtx.font = '11px JetBrains Mono, monospace';
        rCtx.fillText(`Data Points: ${numPoints}`, 12, 42);
        rCtx.fillText(`Patterns Learned: ${Math.floor(t * 15)}`, 12, 58);

        // Flood risk indicator
        if (t > 0.6) {
            const risk = ((t - 0.6) / 0.4 * 100).toFixed(0);
            rCtx.fillStyle = `rgba(239, 68, 68, ${0.3 + t * 0.4})`;
            rCtx.fillText(`⚠ Flood Risk Prediction: ${risk}%`, 12, 78);
        }

        requestAnimationFrame(() => drawRiver(Date.now()));
    }

    slider.addEventListener('input', (e) => {
        timeValue = parseInt(e.target.value);
    });

    window.addEventListener('resize', () => {
        resizeCanvases();
        drawBlueprint();
    });

    resizeCanvases();
    drawBlueprint();
    drawRiver(Date.now());
}

/* ============================
   CHAPTER 2: Supervised Learning — Soil Simulator
   ============================ */
function initChapter2() {
    const soilCanvas = document.getElementById('soil-canvas');
    const waveCanvas = document.getElementById('wave-canvas');
    const predictBtn = document.getElementById('predict-btn');

    if (!soilCanvas || !waveCanvas) return;

    const sCtx = soilCanvas.getContext('2d');
    const wCtx = waveCanvas.getContext('2d');

    let waveAnim = null;
    let predictionMade = false;

    function resizeSoil() {
        soilCanvas.width = soilCanvas.parentElement.clientWidth;
        soilCanvas.height = 250;
        waveCanvas.width = waveCanvas.parentElement.clientWidth;
        waveCanvas.height = 200;
        drawSoil();
        if (!predictionMade) drawFlatWave();
    }

    const soilColors = {
        alluvial: { color: '#c8a876', name: 'Alluvial Clay', amp: 2.4 },
        sandy: { color: '#d4b896', name: 'Sandy Gravel', amp: 1.6 },
        fill: { color: '#a89070', name: 'Eng. Fill', amp: 1.2 },
        lacustrine: { color: '#8B7355', name: 'Lacustrine', amp: 2.8 },
        gravel: { color: '#7a6a5a', name: 'Dense Gravel', amp: 1.3 },
        silt: { color: '#9a8a7a', name: 'Compacted Silt', amp: 2.0 },
        weathered: { color: '#5a4a3a', name: 'Weathered Rock', amp: 1.1 },
        stiff: { color: '#6a5a4a', name: 'Stiff Clay', amp: 1.8 },
        sand: { color: '#b8a888', name: 'Sat. Sand', amp: 3.1 }
    };

    function drawSoil() {
        const w = soilCanvas.width;
        const h = soilCanvas.height;
        sCtx.clearRect(0, 0, w, h);

        // Background
        sCtx.fillStyle = '#0d0d14';
        sCtx.fillRect(0, 0, w, h);

        // Surface
        sCtx.beginPath();
        for (let x = 0; x <= w; x += 2) {
            const y = 20 + Math.sin(x * 0.02) * 5 + Math.sin(x * 0.05) * 3;
            if (x === 0) sCtx.moveTo(x, y);
            else sCtx.lineTo(x, y);
        }
        sCtx.strokeStyle = 'rgba(34, 197, 94, 0.5)';
        sCtx.lineWidth = 2;
        sCtx.stroke();

        // Grass tufts
        for (let x = 10; x < w; x += 25) {
            sCtx.beginPath();
            sCtx.moveTo(x, 20);
            sCtx.lineTo(x - 3, 12);
            sCtx.moveTo(x, 20);
            sCtx.lineTo(x + 3, 14);
            sCtx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
            sCtx.lineWidth = 1;
            sCtx.stroke();
        }

        // Soil layers
        const layers = [
            { sel: document.getElementById('layer0-type'), y: 25, h: 65 },
            { sel: document.getElementById('layer1-type'), y: 90, h: 80 },
            { sel: document.getElementById('layer2-type'), y: 170, h: 55 }
        ];

        layers.forEach((layer, i) => {
            const type = layer.sel ? layer.sel.value : 'alluvial';
            const soil = soilColors[type];

            // Layer fill with pattern
            sCtx.fillStyle = soil.color + '30';
            sCtx.fillRect(0, layer.y, w, layer.h);

            // Grain pattern
            const grainCount = 40;
            for (let g = 0; g < grainCount; g++) {
                const gx = Math.random() * w;
                const gy = layer.y + Math.random() * layer.h;
                sCtx.beginPath();
                sCtx.arc(gx, gy, 1 + Math.random() * 2, 0, Math.PI * 2);
                sCtx.fillStyle = soil.color + '20';
                sCtx.fill();
            }

            // Layer boundary
            sCtx.beginPath();
            for (let x = 0; x <= w; x += 2) {
                const y = layer.y + layer.h + Math.sin(x * 0.04 + i) * 3;
                if (x === 0) sCtx.moveTo(x, y);
                else sCtx.lineTo(x, y);
            }
            sCtx.strokeStyle = soil.color + '60';
            sCtx.lineWidth = 1;
            sCtx.setLineDash([4, 4]);
            sCtx.stroke();
            sCtx.setLineDash([]);

            // Label
            sCtx.fillStyle = soil.color + 'aa';
            sCtx.font = '10px JetBrains Mono, monospace';
            sCtx.fillText(soil.name, 8, layer.y + 18);
            sCtx.fillText(`${layer.y === 25 ? '0-5m' : layer.y === 90 ? '5-15m' : '15-30m'}`, w - 45, layer.y + 18);
        });

        // Bedrock
        sCtx.fillStyle = 'rgba(60, 50, 40, 0.3)';
        sCtx.fillRect(0, 225, w, 25);
        sCtx.fillStyle = 'rgba(139, 115, 85, 0.3)';
        sCtx.font = '10px JetBrains Mono, monospace';
        sCtx.fillText('BEDROCK', 8, 242);

        // Borehole
        sCtx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        sCtx.fillRect(w / 2 - 3, 0, 6, 225);
        sCtx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        sCtx.lineWidth = 1;
        sCtx.strokeRect(w / 2 - 3, 0, 6, 225);

        sCtx.fillStyle = 'rgba(239, 68, 68, 0.5)';
        sCtx.font = '9px JetBrains Mono, monospace';
        sCtx.fillText('BOREHOLE', w / 2 + 8, 15);
    }

    function drawFlatWave() {
        const w = waveCanvas.width;
        const h = waveCanvas.height;
        wCtx.clearRect(0, 0, w, h);
        wCtx.fillStyle = '#0d0d14';
        wCtx.fillRect(0, 0, w, h);

        // Grid
        wCtx.strokeStyle = 'rgba(255,255,255,0.04)';
        for (let x = 0; x < w; x += 30) {
            wCtx.beginPath(); wCtx.moveTo(x, 0); wCtx.lineTo(x, h); wCtx.stroke();
        }
        for (let y = 0; y < h; y += 30) {
            wCtx.beginPath(); wCtx.moveTo(0, y); wCtx.lineTo(w, y); wCtx.stroke();
        }

        // Center line
        wCtx.beginPath();
        wCtx.moveTo(0, h / 2);
        wCtx.lineTo(w, h / 2);
        wCtx.strokeStyle = 'rgba(255,255,255,0.1)';
        wCtx.lineWidth = 1;
        wCtx.stroke();

        wCtx.fillStyle = 'rgba(255,255,255,0.15)';
        wCtx.font = '12px Inter, sans-serif';
        wCtx.fillText('Configure soil layers and click "Run Prediction"', w / 2 - 160, h / 2 - 15);
    }

    function animateWave(amp, freq) {
        if (waveAnim) cancelAnimationFrame(waveAnim);
        predictionMade = true;

        function draw() {
            const w = waveCanvas.width;
            const h = waveCanvas.height;
            const t = Date.now() * 0.002;

            wCtx.clearRect(0, 0, w, h);
            wCtx.fillStyle = '#0d0d14';
            wCtx.fillRect(0, 0, w, h);

            // Grid
            wCtx.strokeStyle = 'rgba(255,255,255,0.04)';
            for (let x = 0; x < w; x += 30) {
                wCtx.beginPath(); wCtx.moveTo(x, 0); wCtx.lineTo(x, h); wCtx.stroke();
            }
            for (let y = 0; y < h; y += 30) {
                wCtx.beginPath(); wCtx.moveTo(0, y); wCtx.lineTo(w, y); wCtx.stroke();
            }

            // Bedrock wave (input — small)
            wCtx.beginPath();
            for (let x = 0; x < w; x += 2) {
                const y = h * 0.75 + Math.sin(x * freq * 0.05 + t) * 12;
                if (x === 0) wCtx.moveTo(x, y);
                else wCtx.lineTo(x, y);
            }
            wCtx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
            wCtx.lineWidth = 1.5;
            wCtx.stroke();

            // Surface wave (amplified)
            wCtx.beginPath();
            for (let x = 0; x < w; x += 2) {
                const baseWave = Math.sin(x * freq * 0.05 + t) * 12 * amp;
                const harmonic = Math.sin(x * freq * 0.12 + t * 1.5) * 6 * (amp - 1);
                const y = h * 0.3 + baseWave + harmonic;
                if (x === 0) wCtx.moveTo(x, y);
                else wCtx.lineTo(x, y);
            }
            wCtx.strokeStyle = `rgba(239, 68, 68, ${0.4 + amp * 0.15})`;
            wCtx.lineWidth = 2;
            wCtx.stroke();

            // Glow
            wCtx.beginPath();
            for (let x = 0; x < w; x += 2) {
                const baseWave = Math.sin(x * freq * 0.05 + t) * 12 * amp;
                const harmonic = Math.sin(x * freq * 0.12 + t * 1.5) * 6 * (amp - 1);
                const y = h * 0.3 + baseWave + harmonic;
                if (x === 0) wCtx.moveTo(x, y);
                else wCtx.lineTo(x, y);
            }
            wCtx.strokeStyle = `rgba(239, 68, 68, 0.1)`;
            wCtx.lineWidth = 8;
            wCtx.stroke();

            // Labels
            wCtx.fillStyle = 'rgba(14, 165, 233, 0.5)';
            wCtx.font = '9px JetBrains Mono, monospace';
            wCtx.fillText('INPUT: Bedrock Motion', 8, h * 0.75 - 20);

            wCtx.fillStyle = 'rgba(239, 68, 68, 0.6)';
            wCtx.fillText(`OUTPUT: Surface Amplification (${amp.toFixed(1)}x)`, 8, h * 0.3 - 25);

            waveAnim = requestAnimationFrame(draw);
        }
        draw();
    }

    predictBtn.addEventListener('click', () => {
        const l0 = document.getElementById('layer0-type').value;
        const l1 = document.getElementById('layer1-type').value;
        const l2 = document.getElementById('layer2-type').value;

        const amp0 = soilColors[l0].amp;
        const amp1 = soilColors[l1].amp;
        const amp2 = soilColors[l2].amp;

        const totalAmp = ((amp0 * 0.4 + amp1 * 0.35 + amp2 * 0.25) * (0.9 + Math.random() * 0.2));
        const freqVal = 0.5 + (totalAmp - 1) * 0.3;

        // Update display
        document.getElementById('amp-value').textContent = totalAmp.toFixed(1) + 'x';
        document.getElementById('freq-value').textContent = freqVal.toFixed(2) + ' Hz';

        const riskEl = document.getElementById('risk-value');
        if (totalAmp > 2.5) {
            riskEl.textContent = 'HIGH';
            riskEl.className = 'metric-value danger';
        } else if (totalAmp > 1.8) {
            riskEl.textContent = 'MODERATE';
            riskEl.className = 'metric-value warning';
        } else {
            riskEl.textContent = 'LOW';
            riskEl.className = 'metric-value safe';
        }

        // Animate
        predictBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Computing...';
        setTimeout(() => {
            predictBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> Run Prediction';
            animateWave(totalAmp, freqVal);
        }, 800);
    });

    // Redraw soil when selections change
    document.querySelectorAll('.soil-select').forEach(sel => {
        sel.addEventListener('change', drawSoil);
    });

    window.addEventListener('resize', resizeSoil);
    resizeSoil();
}

/* ============================
   CHAPTER 3: Unsupervised Learning — GIS Clustering
   ============================ */
function initChapter3() {
    const canvas = document.getElementById('cluster-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let points = [];
    let clustered = false;
    let clusterProgress = 0;
    let animFrame;

    const clusterColors = [
        { r: 14, g: 165, b: 233 },   // Water — blue
        { r: 34, g: 197, b: 94 },    // Vegetation — green
        { r: 245, g: 158, b: 11 },   // Urban — amber
        { r: 239, g: 68, b: 68 }     // Landslide — red
    ];

    // Define cluster centers
    const clusterCenters = [
        { x: 0.2, y: 0.7 },   // Water
        { x: 0.35, y: 0.35 }, // Vegetation
        { x: 0.7, y: 0.3 },   // Urban
        { x: 0.8, y: 0.75 }   // Landslide
    ];

    function resize() {
        canvas.width = canvas.parentElement.clientWidth - (window.innerWidth > 1024 ? 280 : 0);
        canvas.height = 450;
        generatePoints();
    }

    function generatePoints() {
        points = [];
        const w = canvas.width;
        const h = canvas.height;
        const numPoints = 400;

        for (let i = 0; i < numPoints; i++) {
            // Assign a hidden cluster
            const cluster = Math.floor(Math.random() * 4);
            const center = clusterCenters[cluster];

            // Scattered position (initial)
            const scatterX = Math.random() * w;
            const scatterY = Math.random() * h;

            // Clustered position (near center with gaussian spread)
            const angle = Math.random() * Math.PI * 2;
            const radius = (Math.random() * 0.12 + Math.random() * 0.08) * Math.min(w, h);
            const clusterX = center.x * w + Math.cos(angle) * radius;
            const clusterY = center.y * h + Math.sin(angle) * radius;

            points.push({
                x: scatterX,
                y: scatterY,
                targetX: clusterX,
                targetY: clusterY,
                cluster: cluster,
                size: 2 + Math.random() * 3
            });
        }
        clustered = false;
        clusterProgress = 0;
    }

    function draw() {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // Background — map-like
        ctx.fillStyle = '#0d0d14';
        ctx.fillRect(0, 0, w, h);

        // Subtle grid (like map grid)
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < w; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // Contour-like terrain background
        const time = Date.now() * 0.0003;
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            for (let x = 0; x <= w; x += 4) {
                const y = h * (0.15 + i * 0.13) + Math.sin(x * 0.008 + i * 2 + time) * 20;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(255,255,255,0.02)`;
            ctx.stroke();
        }

        // If clustering, animate cluster zones (background highlights)
        if (clusterProgress > 0.5) {
            const zoneAlpha = (clusterProgress - 0.5) * 0.15;
            clusterCenters.forEach((center, i) => {
                const color = clusterColors[i];
                const grd = ctx.createRadialGradient(
                    center.x * w, center.y * h, 0,
                    center.x * w, center.y * h, 80
                );
                grd.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${zoneAlpha})`);
                grd.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`);
                ctx.fillStyle = grd;
                ctx.fillRect(0, 0, w, h);
            });
        }

        // Draw points
        points.forEach(p => {
            const currentX = p.x + (p.targetX - p.x) * clusterProgress;
            const currentY = p.y + (p.targetY - p.y) * clusterProgress;

            const color = clusterColors[p.cluster];
            const alpha = 0.3 + clusterProgress * 0.5;
            const grayMix = 1 - clusterProgress;

            const r = Math.floor(color.r * (1 - grayMix) + 100 * grayMix);
            const g = Math.floor(color.g * (1 - grayMix) + 100 * grayMix);
            const b = Math.floor(color.b * (1 - grayMix) + 100 * grayMix);

            ctx.beginPath();
            ctx.arc(currentX, currentY, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx.fill();
        });

        // Labels when clustered
        if (clusterProgress > 0.8) {
            const labelAlpha = (clusterProgress - 0.8) / 0.2;
            const labels = ['🔵 Water', '🟢 Vegetation', '🟡 Urban', '🔴 Landslide Risk'];
            clusterCenters.forEach((center, i) => {
                ctx.fillStyle = `rgba(255,255,255,${0.6 * labelAlpha})`;
                ctx.font = 'bold 11px Inter, sans-serif';
                ctx.fillText(labels[i], center.x * w - 25, center.y * h - 25);
            });
        }

        // Animate clustering
        if (clustered && clusterProgress < 1) {
            clusterProgress = Math.min(1, clusterProgress + 0.008);
            // Update legend items
            if (clusterProgress > 0.3) {
                document.querySelectorAll('#cluster-legend .legend-item').forEach(el => {
                    if (!el.classList.contains('unclassified')) el.classList.add('active');
                });
                document.querySelector('#cluster-legend .legend-item.unclassified')?.classList.remove('active');
                document.querySelector('#cluster-legend .legend-item.unclassified').style.opacity = '0.2';
            }
        }

        animFrame = requestAnimationFrame(draw);
    }

    document.getElementById('cluster-btn')?.addEventListener('click', () => {
        clustered = true;
    });

    document.getElementById('reset-cluster-btn')?.addEventListener('click', () => {
        clustered = false;
        clusterProgress = 0;
        generatePoints();
        document.querySelectorAll('#cluster-legend .legend-item').forEach(el => {
            if (!el.classList.contains('unclassified')) el.classList.remove('active');
        });
        const unclEl = document.querySelector('#cluster-legend .legend-item.unclassified');
        if (unclEl) {
            unclEl.classList.add('active');
            unclEl.style.opacity = '1';
        }
    });

    window.addEventListener('resize', resize);
    resize();
    draw();
}

/* ============================
   CHAPTER 4: CNN Scanner
   ============================ */
function initChapter4() {
    const canvas = document.getElementById('scanner-canvas');
    const viewport = document.getElementById('scanner-viewport');
    const cursor = document.getElementById('scanner-cursor');

    if (!canvas || !viewport) return;

    const ctx = canvas.getContext('2d');
    let currentLayer = 'original';
    let mouseX = -1, mouseY = -1;

    function resize() {
        canvas.width = viewport.clientWidth;
        canvas.height = Math.max(450, viewport.clientHeight);
        drawScene();
    }

    // Generate a bridge/mountain scene procedurally
    function drawScene() {
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        if (currentLayer === 'original') drawOriginal(w, h);
        else if (currentLayer === 'edges') drawEdges(w, h);
        else if (currentLayer === 'shapes') drawShapes(w, h);
        else if (currentLayer === 'heatmap') drawHeatmap(w, h);
    }

    function drawOriginal(w, h) {
        // Sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.5);
        skyGrad.addColorStop(0, '#1a2a3a');
        skyGrad.addColorStop(1, '#2a3a4a');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h * 0.5);

        // Mountains
        drawMountainRange(w, h, h * 0.3, 'rgba(40, 55, 70, 0.9)', 0.005, 80);
        drawMountainRange(w, h, h * 0.35, 'rgba(50, 65, 80, 0.8)', 0.008, 60);
        drawMountainRange(w, h, h * 0.42, 'rgba(60, 75, 90, 0.7)', 0.012, 45);

        // Valley floor
        ctx.fillStyle = '#2a3530';
        ctx.fillRect(0, h * 0.5, w, h * 0.5);

        // River
        ctx.beginPath();
        for (let x = 0; x <= w; x += 3) {
            const y = h * 0.65 + Math.sin(x * 0.01) * 15 + Math.sin(x * 0.03) * 5;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        for (let x = w; x >= 0; x -= 3) {
            const y = h * 0.68 + Math.sin(x * 0.01) * 15 + Math.sin(x * 0.03) * 5;
            ctx.lineTo(x, y);
        }
        ctx.fillStyle = 'rgba(14, 100, 170, 0.3)';
        ctx.fill();

        // Bridge structure
        const bx = w * 0.3;
        const bw = w * 0.4;
        const by = h * 0.52;

        // Bridge deck
        ctx.fillStyle = 'rgba(120, 110, 100, 0.9)';
        ctx.fillRect(bx, by, bw, 8);

        // Bridge pillars
        for (let i = 0; i < 4; i++) {
            const px = bx + (bw / 3) * i;
            ctx.fillStyle = 'rgba(100, 90, 80, 0.9)';
            ctx.fillRect(px - 4, by, 8, h * 0.15);
        }

        // Cable/arch
        ctx.beginPath();
        for (let x = 0; x <= bw; x += 2) {
            const archY = by - 20 + Math.pow((x / bw - 0.5) * 2, 2) * 20;
            if (x === 0) ctx.moveTo(bx + x, archY);
            else ctx.lineTo(bx + x, archY);
        }
        ctx.strokeStyle = 'rgba(140, 130, 120, 0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Vertical cables
        for (let i = 1; i < 8; i++) {
            const cx = bx + (bw / 8) * i;
            const archY = by - 20 + Math.pow((i / 8 - 0.5) * 2, 2) * 20;
            ctx.beginPath();
            ctx.moveTo(cx, archY);
            ctx.lineTo(cx, by);
            ctx.strokeStyle = 'rgba(140, 130, 120, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Cracks (subtle)
        drawCrack(ctx, bx + bw * 0.3, by + 2, 25, 'rgba(180, 60, 40, 0.4)');
        drawCrack(ctx, bx + bw * 0.7, by + 3, 18, 'rgba(180, 60, 40, 0.3)');

        // Snow on mountains
        drawSnow(w, h);
    }

    function drawMountainRange(w, h, baseY, color, freq, amp) {
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 2) {
            const y = baseY + Math.sin(x * freq) * amp + Math.sin(x * freq * 3) * amp * 0.3;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    function drawSnow(w, h) {
        for (let x = 0; x < w; x += 3) {
            const peakY = h * 0.3 + Math.sin(x * 0.005) * 80 + Math.sin(x * 0.015) * 24;
            if (peakY < h * 0.35) {
                ctx.beginPath();
                ctx.arc(x, peakY, 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(220, 230, 240, 0.3)';
                ctx.fill();
            }
        }
    }

    function drawCrack(ctx, x, y, len, color) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        let cx = x, cy = y;
        for (let i = 0; i < len; i++) {
            cx += (Math.random() - 0.3) * 4;
            cy += Math.random() * 2;
            ctx.lineTo(cx, cy);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    function drawEdges(w, h) {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Mountain ridgelines
        [0.3, 0.35, 0.42].forEach((base, i) => {
            const freq = [0.005, 0.008, 0.012][i];
            const amp = [80, 60, 45][i];
            ctx.beginPath();
            for (let x = 0; x <= w; x += 2) {
                const y = h * base + Math.sin(x * freq) * amp + Math.sin(x * freq * 3) * amp * 0.3;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = `rgba(0, 212, 170, ${0.5 - i * 0.1})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });

        // Bridge edges
        const bx = w * 0.3;
        const bw = w * 0.4;
        const by = h * 0.52;

        ctx.strokeStyle = 'rgba(0, 212, 170, 0.7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, 8);

        // Pillars
        for (let i = 0; i < 4; i++) {
            ctx.strokeRect(bx + (bw / 3) * i - 4, by, 8, h * 0.15);
        }

        // Arch
        ctx.beginPath();
        for (let x = 0; x <= bw; x += 2) {
            const archY = by - 20 + Math.pow((x / bw - 0.5) * 2, 2) * 20;
            if (x === 0) ctx.moveTo(bx + x, archY);
            else ctx.lineTo(bx + x, archY);
        }
        ctx.strokeStyle = 'rgba(0, 212, 170, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // River edge
        ctx.beginPath();
        for (let x = 0; x <= w; x += 3) {
            const y = h * 0.65 + Math.sin(x * 0.01) * 15 + Math.sin(x * 0.03) * 5;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Crack edges highlighted
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = 2;
        drawCrack(ctx, bx + bw * 0.3, by + 2, 25, 'rgba(239, 68, 68, 0.8)');
        drawCrack(ctx, bx + bw * 0.7, by + 3, 18, 'rgba(239, 68, 68, 0.8)');

        // Label
        ctx.fillStyle = 'rgba(0, 212, 170, 0.5)';
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.fillText('LAYER 1: EDGE DETECTION', 12, 24);
        ctx.fillText(`Detected: ${3 + 4 + 2} edge groups`, 12, 42);
    }

    function drawShapes(w, h) {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Mountain shapes as filled regions
        const shapeColors = ['rgba(14, 165, 233, 0.15)', 'rgba(14, 165, 233, 0.12)', 'rgba(14, 165, 233, 0.08)'];
        [0.3, 0.35, 0.42].forEach((base, i) => {
            ctx.beginPath();
            ctx.moveTo(0, h);
            const freq = [0.005, 0.008, 0.012][i];
            const amp = [80, 60, 45][i];
            for (let x = 0; x <= w; x += 2) {
                const y = h * base + Math.sin(x * freq) * amp + Math.sin(x * freq * 3) * amp * 0.3;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(w, h);
            ctx.closePath();
            ctx.fillStyle = shapeColors[i];
            ctx.fill();
            ctx.strokeStyle = `rgba(14, 165, 233, 0.3)`;
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        // Bridge as shape
        const bx = w * 0.3;
        const bw = w * 0.4;
        const by = h * 0.52;

        ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 2;

        // Deck shape
        ctx.fillRect(bx, by, bw, 8);
        ctx.strokeRect(bx, by, bw, 8);

        // Arch shape
        ctx.beginPath();
        ctx.moveTo(bx, by);
        for (let x = 0; x <= bw; x += 2) {
            const archY = by - 20 + Math.pow((x / bw - 0.5) * 2, 2) * 20;
            ctx.lineTo(bx + x, archY);
        }
        ctx.lineTo(bx + bw, by);
        ctx.closePath();
        ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
        ctx.fill();
        ctx.stroke();

        // River shape
        ctx.beginPath();
        for (let x = 0; x <= w; x += 3) {
            ctx.lineTo(x, h * 0.65 + Math.sin(x * 0.01) * 15 + Math.sin(x * 0.03) * 5);
        }
        for (let x = w; x >= 0; x -= 3) {
            ctx.lineTo(x, h * 0.68 + Math.sin(x * 0.01) * 15 + Math.sin(x * 0.03) * 5);
        }
        ctx.fillStyle = 'rgba(14, 165, 233, 0.15)';
        ctx.fill();

        // Shape labels
        ctx.fillStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText('SHAPE: Bridge Deck', bx + 5, by - 5);
        ctx.fillText('SHAPE: Arch Structure', bx + bw / 2 - 40, by - 28);

        ctx.fillStyle = 'rgba(14, 165, 233, 0.5)';
        ctx.fillText('SHAPE: Mountain Range', 12, h * 0.25);
        ctx.fillText('SHAPE: River Channel', 12, h * 0.63);

        ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.fillText('LAYER 2: SHAPE RECOGNITION', 12, 24);
        ctx.fillText('Detected: 6 geometric primitives', 12, 42);
    }

    function drawHeatmap(w, h) {
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);

        // Draw original scene dimmed
        ctx.globalAlpha = 0.15;
        drawOriginal(w, h);
        ctx.globalAlpha = 1;

        // Stress heatmap on bridge
        const bx = w * 0.3;
        const bw = w * 0.4;
        const by = h * 0.52;

        // Hot spots at cracks
        const hotspots = [
            { x: bx + bw * 0.3, y: by + 5, intensity: 0.9, label: 'CRACK DETECTED' },
            { x: bx + bw * 0.7, y: by + 5, intensity: 0.7, label: 'MICRO-FRACTURE' },
            { x: bx + bw * 0.5, y: by + 3, intensity: 0.3, label: 'MILD STRESS' },
            { x: bx, y: by + h * 0.1, intensity: 0.5, label: 'JOINT WEAR' },
            { x: bx + bw, y: by + h * 0.1, intensity: 0.4, label: 'JOINT WEAR' }
        ];

        hotspots.forEach(spot => {
            const radius = 40 + spot.intensity * 30;
            const grd = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, radius);
            grd.addColorStop(0, `rgba(239, 68, 68, ${spot.intensity * 0.5})`);
            grd.addColorStop(0.5, `rgba(245, 158, 11, ${spot.intensity * 0.25})`);
            grd.addColorStop(1, 'rgba(245, 158, 11, 0)');
            ctx.fillStyle = grd;
            ctx.fillRect(spot.x - radius, spot.y - radius, radius * 2, radius * 2);

            // Label
            ctx.fillStyle = spot.intensity > 0.6 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(245, 158, 11, 0.6)';
            ctx.font = '9px JetBrains Mono, monospace';
            ctx.fillText(spot.label, spot.x - 30, spot.y - 20);
        });

        // Bridge outline
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, 8);

        // Arch
        ctx.beginPath();
        for (let x = 0; x <= bw; x += 2) {
            const archY = by - 20 + Math.pow((x / bw - 0.5) * 2, 2) * 20;
            if (x === 0) ctx.moveTo(bx + x, archY);
            else ctx.lineTo(bx + x, archY);
        }
        ctx.stroke();

        // Severity scale
        const scaleX = w - 120;
        const scaleY = h - 100;
        const scaleH = 80;

        const scaleGrad = ctx.createLinearGradient(scaleX, scaleY, scaleX, scaleY + scaleH);
        scaleGrad.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
        scaleGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.6)');
        scaleGrad.addColorStop(1, 'rgba(34, 197, 94, 0.3)');
        ctx.fillStyle = scaleGrad;
        ctx.fillRect(scaleX, scaleY, 15, scaleH);

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '8px JetBrains Mono, monospace';
        ctx.fillText('HIGH', scaleX + 20, scaleY + 8);
        ctx.fillText('MED', scaleX + 20, scaleY + scaleH / 2 + 3);
        ctx.fillText('LOW', scaleX + 20, scaleY + scaleH - 2);

        ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
        ctx.font = '11px JetBrains Mono, monospace';
        ctx.fillText('LAYER 3: STRESS HEATMAP', 12, 24);
        ctx.fillText('Critical defects: 2 | Warnings: 3', 12, 42);
    }

    // Layer toggle buttons
    document.querySelectorAll('.layer-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.layer-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLayer = btn.dataset.layer;
            drawScene();
            updateDetectionOutput();
        });
    });

    function updateDetectionOutput() {
        const output = document.getElementById('detection-output');
        const items = {
            original: [
                { icon: 'fa-image', text: 'Raw satellite/drone imagery loaded', danger: false },
                { icon: 'fa-mountain', text: 'Mountain pass with bridge structure', danger: false }
            ],
            edges: [
                { icon: 'fa-border-all', text: '9 edge groups detected', danger: false },
                { icon: 'fa-triangle-exclamation', text: '2 anomalous edge patterns (cracks)', danger: true }
            ],
            shapes: [
                { icon: 'fa-shapes', text: '6 geometric primitives identified', danger: false },
                { icon: 'fa-check-circle', text: 'Bridge deck, arch, pillars classified', danger: false }
            ],
            heatmap: [
                { icon: 'fa-fire', text: '2 critical stress concentrations', danger: true },
                { icon: 'fa-triangle-exclamation', text: '3 moderate wear zones', danger: true },
                { icon: 'fa-file-lines', text: 'Recommend: Detailed on-site inspection', danger: false }
            ]
        };

        output.innerHTML = items[currentLayer].map(item =>
            `<div class="detection-item ${item.danger ? 'danger' : ''}">
                <i class="fa-solid ${item.icon}"></i>
                <span>${item.text}</span>
            </div>`
        ).join('');
    }

    // Mouse cursor scanner effect
    viewport.addEventListener('mousemove', (e) => {
        const rect = viewport.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        cursor.style.display = 'block';
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    });

    viewport.addEventListener('mouseleave', () => {
        cursor.style.display = 'none';
    });

    window.addEventListener('resize', resize);
    resize();
    updateDetectionOutput();
}

/* ============================
   CHAPTER 5: LLM Text Predictor
   ============================ */
function initChapter5() {
    const scriptText = document.getElementById('script-text');
    const predictionNodes = document.getElementById('prediction-nodes');
    const contextItems = document.getElementById('context-items');
    const startBtn = document.getElementById('llm-start-btn');
    const resetBtn = document.getElementById('llm-reset-btn');

    if (!scriptText || !startBtn) return;

    const scriptContent = [
        { word: 'The', predictions: ['The', 'In', 'High', 'Deep'], selected: 0 },
        { word: 'glacier', predictions: ['glacier', 'mountain', 'river', 'valley'], selected: 0 },
        { word: 'has', predictions: ['has', 'had', 'stands', 'lies'], selected: 0 },
        { word: 'been', predictions: ['been', 'slowly', 'steadily'], selected: 0 },
        { word: 'retreating', predictions: ['retreating', 'advancing', 'shrinking', 'melting'], selected: 0 },
        { word: 'for', predictions: ['for', 'over', 'across', 'since'], selected: 0 },
        { word: 'decades,', predictions: ['decades,', 'centuries,', 'years,', 'millennia,'], selected: 0 },
        { word: 'its', predictions: ['its', 'the', 'each', 'every'], selected: 0 },
        { word: 'ancient', predictions: ['ancient', 'frozen', 'massive', 'vast'], selected: 0 },
        { word: 'ice', predictions: ['ice', 'body', 'surface', 'mass'], selected: 0 },
        { word: 'surrendering', predictions: ['surrendering', 'yielding', 'losing', 'giving'], selected: 0 },
        { word: 'to', predictions: ['to', 'against', 'before'], selected: 0 },
        { word: 'the', predictions: ['the', 'a', 'rising'], selected: 0 },
        { word: 'relentless', predictions: ['relentless', 'rising', 'warming', 'shifting'], selected: 0 },
        { word: 'warmth', predictions: ['warmth', 'heat', 'temperatures', 'climate'], selected: 0 },
        { word: 'of', predictions: ['of', 'from', 'in'], selected: 0 },
        { word: 'a', predictions: ['a', 'the', 'our', 'an'], selected: 0 },
        { word: 'changing', predictions: ['changing', 'warming', 'shifting', 'new'], selected: 0 },
        { word: 'climate.', predictions: ['climate.', 'world.', 'atmosphere.', 'era.'], selected: 0 },
        { word: 'What', predictions: ['What', 'The', 'Each', 'But'], selected: 0 },
        { word: 'once', predictions: ['once', 'was', 'took', 'seemed'], selected: 0 },
        { word: 'carved', predictions: ['carved', 'shaped', 'formed', 'built'], selected: 0 },
        { word: 'valleys', predictions: ['valleys', 'mountains', 'landscapes', 'paths'], selected: 0 },
        { word: 'now', predictions: ['now', 'slowly', 'quietly'], selected: 0 },
        { word: 'feeds', predictions: ['feeds', 'becomes', 'turns', 'flows'], selected: 0 },
        { word: 'rivers', predictions: ['rivers', 'streams', 'lakes', 'floods'], selected: 0 },
        { word: 'that', predictions: ['that', 'which', 'below'], selected: 0 },
        { word: 'may', predictions: ['may', 'will', 'could', 'might'], selected: 0 },
        { word: 'one', predictions: ['one', 'soon', 'someday'], selected: 0 },
        { word: 'day', predictions: ['day', 'generation', 'century'], selected: 0 },
        { word: 'run', predictions: ['run', 'go', 'fall', 'cease'], selected: 0 },
        { word: 'dry.', predictions: ['dry.', 'silent.', 'empty.', 'still.'], selected: 0 }
    ];

    // Context keywords with attention weights
    const contextKeywords = [
        { word: 'glacier', weight: 0.95 },
        { word: 'retreating', weight: 0.88 },
        { word: 'climate', weight: 0.82 },
        { word: 'decades', weight: 0.65 },
        { word: 'ice', weight: 0.78 },
        { word: 'warmth', weight: 0.72 },
        { word: 'valleys', weight: 0.55 },
        { word: 'rivers', weight: 0.60 },
    ];

    let currentIndex = 0;
    let isGenerating = false;
    let generateTimeout;

    function reset() {
        currentIndex = 0;
        isGenerating = false;
        clearTimeout(generateTimeout);
        scriptText.innerHTML = '<span class="cursor-line"></span>';
        predictionNodes.innerHTML = '';
        contextItems.innerHTML = '';
        startBtn.innerHTML = '<i class="fa-solid fa-play"></i> Generate Script';
    }

    function showPredictions(index) {
        if (index >= scriptContent.length) return;

        const item = scriptContent[index];
        predictionNodes.innerHTML = '';

        // Position predictions near the cursor
        const cursorEl = scriptText.querySelector('.cursor-line');
        if (!cursorEl) return;

        const scriptRect = scriptText.getBoundingClientRect();
        const cursorRect = cursorEl.getBoundingClientRect();
        const relX = cursorRect.left - scriptRect.left;
        const relY = cursorRect.top - scriptRect.top;

        item.predictions.forEach((pred, i) => {
            const node = document.createElement('div');
            node.className = 'pred-node';
            const prob = i === item.selected ? (0.6 + Math.random() * 0.3) : (Math.random() * 0.3);
            node.innerHTML = `${pred}<span class="prob">${(prob * 100).toFixed(0)}%</span>`;

            // Position in an arc above cursor
            const offsetX = (i - item.predictions.length / 2) * 100 + 50;
            const offsetY = -40 - Math.abs(i - item.predictions.length / 2) * 15;
            node.style.left = Math.max(10, Math.min(relX + offsetX, scriptRect.width - 120)) + 'px';
            node.style.top = Math.max(10, relY + offsetY) + 'px';

            predictionNodes.appendChild(node);

            setTimeout(() => {
                node.classList.add('visible');
                if (i === item.selected) {
                    setTimeout(() => node.classList.add('selected'), 300);
                }
            }, i * 80);
        });
    }

    function addWord(index) {
        if (index >= scriptContent.length) {
            isGenerating = false;
            startBtn.innerHTML = '<i class="fa-solid fa-check"></i> Complete';
            return;
        }

        const item = scriptContent[index];

        // Show predictions first
        showPredictions(index);

        generateTimeout = setTimeout(() => {
            // Remove cursor
            const cursor = scriptText.querySelector('.cursor-line');

            // Add word
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word current';
            wordSpan.textContent = item.word + ' ';
            scriptText.insertBefore(wordSpan, cursor);

            // Animate in
            requestAnimationFrame(() => {
                wordSpan.classList.add('visible');
            });

            // Remove "current" from previous
            setTimeout(() => {
                wordSpan.classList.remove('current');
            }, 400);

            // Update context weights
            updateContext(index);

            // Clear predictions
            setTimeout(() => {
                predictionNodes.innerHTML = '';
            }, 200);

            currentIndex = index + 1;
            generateTimeout = setTimeout(() => addWord(currentIndex), 600);
        }, 800);
    }

    function updateContext(upToIndex) {
        contextItems.innerHTML = '';

        const usedWords = scriptContent.slice(0, upToIndex + 1).map(s => s.word.replace(/[.,!?]/g, '').toLowerCase());

        contextKeywords.forEach(kw => {
            if (usedWords.includes(kw.word)) {
                const item = document.createElement('div');
                const isHigh = kw.weight > 0.7;
                item.className = `context-item ${isHigh ? 'high-attention' : ''}`;
                const barWidth = kw.weight * 80;
                item.innerHTML = `
                    <span class="ctx-word">${kw.word}</span>
                    <div class="ctx-bar" style="width: ${barWidth}px; opacity: ${kw.weight}"></div>
                `;
                contextItems.appendChild(item);
            }
        });
    }

    startBtn.addEventListener('click', () => {
        if (isGenerating) return;
        if (currentIndex >= scriptContent.length) {
            reset();
            return;
        }
        isGenerating = true;
        startBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
        addWord(currentIndex);
    });

    resetBtn.addEventListener('click', reset);
}
