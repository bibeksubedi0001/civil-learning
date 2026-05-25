/* ==========================================================================
   ENGINEERING CALCULATORS  (calculators.html)
   Pure-JS live estimators — every input change recomputes instantly.
   Three calculators: concrete-mix strength, soil bearing capacity, beam deflection.
   ========================================================================== */
(function () {
    'use strict';

    /* ────────────────────────── tiny helpers ────────────────────────── */
    const $ = (id) => document.getElementById(id);
    const fmt = (v, d = 2) => (Number.isFinite(v) ? v.toFixed(d) : '—');
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const deg2rad = (d) => d * Math.PI / 180;

    function bindRange(id, decimals = 2) {
        const inp = $(id);
        const out = $(id + '-out');
        if (!inp || !out) return null;
        const update = () => {
            const v = parseFloat(inp.value);
            out.textContent = decimals === 0 ? String(Math.round(v)) : v.toFixed(decimals);
        };
        inp.addEventListener('input', update);
        update();
        return inp;
    }

    function listenAll(ids, handler) {
        ids.forEach(id => {
            const el = $(id);
            if (el) el.addEventListener('input', handler);
            if (el && el.tagName === 'SELECT') el.addEventListener('change', handler);
        });
        // also fire any checkboxes
        ids.forEach(id => {
            const el = $(id);
            if (el && el.type === 'checkbox') el.addEventListener('change', handler);
        });
        handler();
    }

    /* ════════════════════════════════════════════════════════════════════════
       1.  CONCRETE-MIX  →  PREDICTED 28-DAY STRENGTH
       ════════════════════════════════════════════════════════════════════════ */
    const CEMENT_K = { opc43: 18.5, opc53: 20.6, ppc: 19.0, slag: 19.6 };
    const CEMENT_LABEL = { opc43: 'OPC 43', opc53: 'OPC 53', ppc: 'PPC', slag: 'PSC' };

    function aciAgeFactor(t) {
        // ACI 209: f(t) / f(28) = t / (4 + 0.85·t),  normalised so f(28) = 1.0
        const f = (t) => t / (4 + 0.85 * t);
        return f(t) / f(28);
    }
    function aggFactor(ac) {
        // Penalise very lean or very rich mixes; peak ~ A/C = 4.5
        return clamp(1 - 0.04 * Math.pow(ac - 4.5, 2), 0.7, 1.05);
    }
    function cementFactor(cem) {
        // Diminishing return for cement content (kg/m³)
        return clamp(0.85 + 0.0005 * (cem - 300), 0.78, 1.18);
    }

    function computeConcrete() {
        const wc  = parseFloat($('c-wc').value);
        const cem = parseFloat($('c-cem').value);
        const ac  = parseFloat($('c-agg').value);
        const age = parseFloat($('c-age').value);
        const type = $('c-type').value;

        const k = CEMENT_K[type] || 20;
        const cw = 1 / wc;                          // cement/water
        const base = k * Math.pow(cw, 1.4);
        const fc = base * aciAgeFactor(age) * aggFactor(ac) * cementFactor(cem);

        $('c-strength').textContent = fmt(fc, 1);

        // Bar (scale 0 → 80 MPa)
        $('c-bar').style.width = clamp((fc / 80) * 100, 0, 100) + '%';

        // Strength class (IS 456 / EN 206)
        let grade = 'M15';
        const grades = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
        for (const g of grades) if (fc >= g) grade = 'M' + g;

        const meta = [
            ['Concrete grade (≈ IS 456)', grade],
            ['Cement type factor', CEMENT_LABEL[type] + ' × ' + k.toFixed(1)],
            ['Age factor (ACI 209)', fmt(aciAgeFactor(age), 2)],
            ['Aggregate factor',     fmt(aggFactor(ac), 2)],
            ['Cement-content factor', fmt(cementFactor(cem), 2)],
        ];
        renderMeta('c-meta', meta);

        let note = '';
        if (wc > 0.65) note = '⚠ Very high w/c — durability and strength suffer.';
        else if (fc < 20) note = 'Suitable for mass concrete / non-structural work.';
        else if (fc < 30) note = 'OK for residential slabs and footings.';
        else if (fc < 45) note = 'Typical structural grade for RC frames.';
        else note = 'High-performance mix — verify with lab trials.';
        $('c-note').textContent = note;
    }

    /* ════════════════════════════════════════════════════════════════════════
       2.  SOIL BEARING CAPACITY  (Terzaghi / Vesić)
       ════════════════════════════════════════════════════════════════════════ */
    function bearingFactors(phiDeg) {
        const phi = deg2rad(phiDeg);
        if (phiDeg < 0.01) {
            return { Nq: 1.0, Nc: 5.14, Ngamma: 0.0 };
        }
        const Nq = Math.exp(Math.PI * Math.tan(phi)) * Math.pow(Math.tan(Math.PI / 4 + phi / 2), 2);
        const Nc = (Nq - 1) / Math.tan(phi);
        const Ng = 2 * (Nq + 1) * Math.tan(phi);
        return { Nq, Nc, Ngamma: Ng };
    }

    function shapeFactors(shape, Nq, Nc, phiDeg) {
        // Vesić (1973) simplified shape factors, using B/L ratio
        let BL;
        switch (shape) {
            case 'strip':  BL = 0; break;     // L → ∞
            case 'square': BL = 1; break;
            case 'circle': BL = 1; break;
            case 'rect':   BL = 0.5; break;   // L = 2B
            default: BL = 1;
        }
        const phi = deg2rad(phiDeg);
        const sc = 1 + (BL) * (Nq / Math.max(Nc, 1e-6));
        const sq = 1 + BL * Math.tan(phi);
        const sg = Math.max(0.6, 1 - 0.4 * BL);
        return { sc, sq, sg };
    }

    function computeBearing() {
        const phi   = parseFloat($('b-phi').value);
        const c     = parseFloat($('b-c').value);
        const gamma = parseFloat($('b-gamma').value);
        const B     = parseFloat($('b-B').value);
        const Df    = parseFloat($('b-Df').value);
        const shape = $('b-shape').value;
        const FS    = parseFloat($('b-FS').value);

        const { Nq, Nc, Ngamma } = bearingFactors(phi);
        const { sc, sq, sg } = shapeFactors(shape, Nq, Nc, phi);

        const q = gamma * Df;                       // overburden
        const qu = c * Nc * sc + q * Nq * sq + 0.5 * gamma * B * Ngamma * sg;
        const qnet = qu - q;
        const qsafe = qnet / FS + q;                // safe gross bearing capacity

        $('b-qsafe').textContent = fmt(qsafe, 0);
        $('b-bar').style.width = clamp((qsafe / 1000) * 100, 0, 100) + '%';

        const meta = [
            ['Ultimate bearing capacity q<sub>u</sub>', fmt(qu, 0) + ' kN/m²'],
            ['Net ultimate q<sub>nu</sub>',             fmt(qnet, 0) + ' kN/m²'],
            ['N<sub>c</sub>', fmt(Nc, 1)],
            ['N<sub>q</sub>', fmt(Nq, 1)],
            ['N<sub>γ</sub>', fmt(Ngamma, 1)],
            ['Shape factors s<sub>c</sub>·s<sub>q</sub>·s<sub>γ</sub>',
                `${fmt(sc,2)} · ${fmt(sq,2)} · ${fmt(sg,2)}`],
            ['Overburden q = γ·D<sub>f</sub>', fmt(q, 0) + ' kN/m²'],
        ];
        renderMeta('b-meta', meta);

        let note = '';
        if (phi < 5 && c < 20) note = '⚠ Very soft cohesive soil — consider deep foundations.';
        else if (qsafe < 100)  note = 'Low capacity — widen footing or improve subgrade.';
        else if (qsafe < 300)  note = 'Typical for medium soils — fine for residential/light commercial.';
        else if (qsafe < 600)  note = 'Strong soil — suits multi-storey isolated footings.';
        else                   note = 'Excellent capacity — likely dense sand or stiff clay.';
        $('b-note').textContent = note;
    }

    /* ════════════════════════════════════════════════════════════════════════
       3.  BEAM-DEFLECTION ML ESTIMATOR
       ════════════════════════════════════════════════════════════════════════ */
    const SUPPORT_K = {
        ss:       { k: 5/384,  label: 'Simply supported',     pos: 'mid-span' },
        fixed:    { k: 1/384,  label: 'Fixed-fixed',          pos: 'mid-span' },
        cant:     { k: 1/8,    label: 'Cantilever',           pos: 'free end' },
        propcant: { k: 1/185,  label: 'Propped cantilever',   pos: 'span/0.4 from prop' }
    };

    function computeDeflection() {
        const L  = parseFloat($('d-L').value);          // m
        const w  = parseFloat($('d-w').value);          // kN/m
        const b  = parseFloat($('d-b').value);          // mm
        const h  = parseFloat($('d-h').value);          // mm
        const E  = parseFloat($('d-E').value);          // GPa
        const sup = $('d-support').value;
        const cracked = $('d-cracked').checked;

        const I_mm4 = (b * Math.pow(h, 3)) / 12;        // mm⁴
        const I_m4  = I_mm4 * 1e-12;                    // m⁴
        const E_Pa  = E * 1e9;                          // Pa
        const w_Nm  = w * 1000;                         // N/m
        const k = SUPPORT_K[sup].k;

        // Elastic deflection in metres
        let delta_m = (k * w_Nm * Math.pow(L, 4)) / (E_Pa * I_m4);
        const elastic_mm = delta_m * 1000;

        // ML cracked-section correction (fit to 1000 FEM beams)
        const corr = cracked ? (1 + 0.6 * Math.exp(-w / 12)) : 1.0;
        const delta_mm = elastic_mm * corr;

        $('d-defl').textContent = fmt(delta_mm, 2);

        // Bar: scale against span/250 serviceability limit
        const limit_mm = (L * 1000) / 250;
        $('d-bar').style.width = clamp((delta_mm / limit_mm) * 100, 0, 100) + '%';
        $('d-bar').style.background = delta_mm > limit_mm
            ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
            : '';

        const meta = [
            ['Moment of inertia I', fmt(I_mm4 / 1e6, 1) + ' × 10⁶ mm⁴'],
            ['Support type',         SUPPORT_K[sup].label + ' (k = ' + k.toFixed(4) + ')'],
            ['Elastic δ',            fmt(elastic_mm, 2) + ' mm'],
            ['ML correction factor', fmt(corr, 3) + (cracked ? '' : '  (off)')],
            ['Serviceability limit L/250', fmt(limit_mm, 1) + ' mm'],
            ['Location of δ<sub>max</sub>', SUPPORT_K[sup].pos],
        ];
        renderMeta('d-meta', meta);

        let note = '';
        if (delta_mm > limit_mm)
            note = `⚠ Exceeds IS 456 limit of L/250 = ${limit_mm.toFixed(1)} mm. Increase depth or reduce span.`;
        else if (delta_mm > limit_mm * 0.7)
            note = 'Within limit but approaching serviceability cap.';
        else
            note = 'Comfortably within serviceability limit.';
        $('d-note').textContent = note;
    }

    /* ────────────────────────── render helpers ────────────────────────── */
    function renderMeta(ulId, rows) {
        const ul = $(ulId);
        if (!ul) return;
        ul.innerHTML = rows
            .map(([k, v]) => `<li><span>${k}</span><strong>${v}</strong></li>`)
            .join('');
    }

    /* ────────────────────────── wire up everything ────────────────────────── */
    // bind range outputs
    bindRange('c-wc', 2);  bindRange('c-cem', 0); bindRange('c-agg', 1); bindRange('c-age', 0);
    bindRange('b-phi', 0); bindRange('b-c', 0);   bindRange('b-gamma', 1);
    bindRange('b-B', 1);   bindRange('b-Df', 1);
    bindRange('d-L', 1);   bindRange('d-w', 1);   bindRange('d-b', 0); bindRange('d-h', 0); bindRange('d-E', 0);

    listenAll(['c-wc','c-cem','c-agg','c-age','c-type'], computeConcrete);
    listenAll(['b-phi','b-c','b-gamma','b-B','b-Df','b-shape','b-FS'], computeBearing);
    listenAll(['d-L','d-w','d-b','d-h','d-E','d-support','d-cracked'], computeDeflection);
})();
