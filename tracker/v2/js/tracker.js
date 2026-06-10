/* ============================================================
   Master Protocol v4 — Application Logic
   Backwards-compatible with bah.html (v3.29) localStorage schema:
     - INDEX_KEY:   'tracker_registry_v2'
     - OLD index:   'tracker_dates'
     - per-day:     'tracker_<YYYY-MM-DD>_<ts>'
     - long-term:   'tracker_longterm'
   ============================================================ */

const INDEX_KEY     = 'tracker_registry_v2';
const OLD_INDEX_KEY = 'tracker_dates';
const todayKey      = new Date().toISOString().split('T')[0];

/* ------------------------------------------------------------
   The Six Active Projects
   IDs are stable forever; do not rename.
   p1..p3 are aliased to legacy s1..s3 on save for `bah.html`
   read compatibility.
   ------------------------------------------------------------ */
const PROJECTS = [
    { id: 'p1', name: 'Final Year Project',     color: 'var(--p1)', legacy: 's1' },
    { id: 'p2', name: 'Newmark Co-seismic',     color: 'var(--p2)', legacy: 's2' },
    { id: 'p3', name: 'HEC-RAS 100 Days',       color: 'var(--p3)', legacy: 's3' },
    { id: 'p4', name: 'AI for Civil Engineers', color: 'var(--p4)' },
    { id: 'p5', name: 'Literature Reading',     color: 'var(--p5)' },
    { id: 'p6', name: 'HAND Project',           color: 'var(--p6)' }
];

/* ------------------------------------------------------------
   Quotes (curated from bah.html, no emojis)
   ------------------------------------------------------------ */
const quotes = [
    "Scientists study the world as it is; engineers create the world that has never been. - Theodore von Karman",
    "Structural engineering is the art of molding materials we do not wholly understand into shapes we cannot precisely analyze. - J.E. Gordon",
    "The foundation determines the height of the skyscraper.",
    "Measure twice, cut once, calculate infinitely.",
    "An engineer who doesn't respect the forces of nature will be destroyed by them.",
    "A bridge is not just steel and concrete; it is a promise of safe passage.",
    "In a world of chaos, the engineer brings order through design.",
    "Concrete is hard, but the will of the engineer must be harder.",
    "Design for the worst case, hope for the best case, live in the real case.",
    "Simplicity is the ultimate sophistication in design. - Leonardo da Vinci",
    "We shape our buildings; thereafter they shape us. - Winston Churchill",
    "Theory guides, but experiment decides.",
    "The best way to predict the future is to design it. - Buckminster Fuller",
    "100 days of HEC-RAS is not just a challenge; it is a transformation of discipline.",
    "Be like water making its way through cracks. - Bruce Lee",
    "A DEM is just pixels until you give it hydrological purpose.",
    "To understand the river, you must become the flow.",
    "Modeling reality requires the humility to know you are always an approximation. - George Box",
    "In God we trust; all others must bring data. - W. Edwards Deming",
    "Consistency in the 100-day challenge beats intensity in one day.",
    "Your HAND model calculates the depth, but your mind must calculate the risk.",
    "Machine learning lets us see patterns in the soil the eye cannot.",
    "Code is the new concrete; Python is the new steel.",
    "Garbage in, garbage out. Clean your data like you clean your room.",
    "Solid ground is not found; it is verified by calculation.",
    "The earth speaks in waves; site response analysis is how we listen.",
    "We build on soil, but we rely on physics.",
    "Earthquakes don't kill people; poorly built buildings do.",
    "Finite element analysis: breaking big problems into small, solvable victories.",
    "The view is best after the hardest climb.",
    "At 5000m, you don't conquer the mountain; you conquer yourself.",
    "Endurance is not just for the body; it is for the spirit.",
    "To teach is to learn twice.",
    "A portfolio is not a CV; it is the evidence of your capability.",
    "Research is seeing what everybody else has seen and thinking what nobody else has thought. - Albert Szent-Gyorgyi",
    "Collaboration divides the task and multiplies the success.",
    "Mentoring entrance students is planting trees under whose shade you may never sit.",
    "Excellence is not a skill, it's an attitude. - Ralph Marston",
    "Discipline is choosing between what you want now and what you want most. - Abraham Lincoln",
    "The impediment to action advances action. What stands in the way becomes the way. - Marcus Aurelius",
    "You have power over your mind, not outside events. - Marcus Aurelius",
    "The only easy day was yesterday.",
    "He who has a why to live can bear almost any how. - Friedrich Nietzsche",
    "Iron sharpens iron, so one man sharpens another.",
    "Focus on the process, not the outcome.",
    "A final year project is not just a grade; it is the culmination of four years of grind.",
    "Read the paper. Run the code. Write the line. Repeat."
];

/* ============================================================
   INIT
   ============================================================ */
window.addEventListener('DOMContentLoaded', init);

function init() {
    // Quote
    document.getElementById('quoteDisplay').innerText =
        quotes[Math.floor(Math.random() * quotes.length)];

    // Date label
    document.getElementById('currentDateDisplay').innerText =
        new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Mode badge
    renderModeBadge();

    // Build the 6 project rows
    buildProjects();
    // Build focus mode selector
    buildFocusTargets();

    // Migrate any legacy keys
    migrateData();

    // Render history-derived widgets
    loadHistoryTable();
    calculateStreak();
    updateLevelXP();
    updateCurrentActivity();
    calculateWeeklyAverages();
    loadLongTerm();
    renderMiniHeatmap();
    renderProjectBreakdown();
    renderCorrelationMatrix();

    setInterval(updateCurrentActivity, 1000);

    // Meditation chip group
    document.querySelectorAll('#medChips .chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const v = btn.dataset.min;
            $('meditationTime').value = v;
            document.querySelectorAll('#medChips .chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            calculateAll();
        });
    });

    // Wire range-slider fill (CSS custom prop)
    document.querySelectorAll('input[type="range"]').forEach(r => {
        r.addEventListener('input', () => syncRange(r));
        syncRange(r);
    });

    // Render 7-day sparkline per project
    renderProjectSparklines();

    // Auto-load today's entry if it exists
    const registry = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    const todayIds = registry.filter(id => {
        try { return JSON.parse(localStorage.getItem(id)).date === todayKey; }
        catch (e) { return false; }
    });
    if (todayIds.length > 0) {
        populateForm(JSON.parse(localStorage.getItem(todayIds[todayIds.length - 1])));
    } else {
        calculateAll();
    }
}

/* ============================================================
   MODE BADGE  (intern weekday vs builder weekend)
   ============================================================ */
function renderModeBadge() {
    const day = new Date().getDay();
    const isWeekday = day >= 1 && day <= 5;
    const badge = document.getElementById('modeBadge');
    const internSection = document.getElementById('internSection');
    if (isWeekday) {
        badge.textContent = 'Intern Day';
        badge.classList.remove('weekend');
        internSection.classList.remove('weekend');
    } else {
        badge.textContent = 'Builder Day';
        badge.classList.add('weekend');
        internSection.classList.add('weekend');
    }
}

/* ============================================================
   PROJECT GRID BUILDER
   ============================================================ */
function buildProjects() {
    const root = document.getElementById('projectsContainer');
    root.innerHTML = '';
    PROJECTS.forEach((p, idx) => {
        const html = `
            <div class="proj-row" id="row_${p.id}" style="--c:${p.color}">
                <div class="proj-name">
                    <span class="dot"></span>
                    <div class="proj-name-text">
                        <div class="title-row">
                            <span class="title">${idx + 1}. ${p.name}</span>
                            <div class="proj-spark" id="${p.id}_spark" title="Last 7 days"></div>
                            <label class="blocker-toggle" title="Mark this project as blocked today">
                                <input type="checkbox" id="${p.id}_blocker" onchange="toggleBlocker('${p.id}')">
                                <span>BLOCKED</span>
                            </label>
                        </div>
                    </div>
                </div>
                <input type="number" id="${p.id}_time" min="0" placeholder="0" oninput="calculateAll()">
                <div class="done-wrap">
                    <input type="range" id="${p.id}_acc" min="0" max="100" value="0" step="5" oninput="syncRange(this); $('${p.id}_accVal').innerText = this.value + '%'; calculateAll();">
                    <span class="done-val" id="${p.id}_accVal">0%</span>
                </div>
                <div class="proj-score"><span id="${p.id}_score">0</span> / 15</div>
                <div class="proj-note">
                    <input type="text" id="${p.id}_note" placeholder="What you actually did today">
                </div>
            </div>`;
        root.insertAdjacentHTML('beforeend', html);
    });
}

function buildFocusTargets() {
    const sel = document.getElementById('timerTarget');
    sel.innerHTML = PROJECTS.map((p, i) =>
        `<option value="${p.id}_time">${i + 1}. ${p.name}</option>`
    ).join('');
}

/* ============================================================
   HELPERS
   ============================================================ */
function $(id) { return document.getElementById(id); }

function syncRange(r) {
    const min = parseFloat(r.min) || 0;
    const max = parseFloat(r.max) || 100;
    const pct = ((parseFloat(r.value) - min) / (max - min)) * 100;
    r.style.setProperty('--val', pct + '%');
}

function toggleBlocker(pid) {
    const row = $('row_' + pid);
    if (!row) return;
    row.classList.toggle('blocked', $(pid + '_blocker').checked);
}

function renderProjectSparklines() {
    const registry = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    // Build last-7-days date list
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }
    // date -> data map
    const map = {};
    registry.forEach(id => {
        try { const d = JSON.parse(localStorage.getItem(id));
              if (d && d.date) map[d.date] = d; } catch (e) {}
    });

    PROJECTS.forEach(p => {
        const root = $(p.id + '_spark');
        if (!root) return;
        const mins = dates.map(date => map[date] ? getProjectMinutesById(map[date], p.id) : 0);
        const max = Math.max(60, ...mins);
        root.innerHTML = dates.map((date, i) => {
            const h = mins[i] === 0 ? 4 : Math.max(6, (mins[i] / max) * 22);
            const opacity = mins[i] === 0 ? 0.18 : 0.5 + (mins[i] / max) * 0.5;
            const dayLbl = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(date).getDay()];
            return `<span class="spark-bar" title="${dayLbl} ${date}: ${mins[i]} min"
                          style="height:${h}px; background:${p.color}; opacity:${opacity};"></span>`;
        }).join('');
    });
}

function getProjectMinutes(d) {
    // Works for both v4 and legacy bah.html data.
    let total = 0;
    let hasNew = false;
    PROJECTS.forEach(p => {
        const v = parseFloat(d.inputs?.[p.id + '_time']);
        if (!isNaN(v)) { total += v; hasNew = true; }
    });
    if (hasNew) return total;
    // Legacy: sum s1+s2+s3
    return (parseFloat(d.inputs?.s1_time) || 0)
         + (parseFloat(d.inputs?.s2_time) || 0)
         + (parseFloat(d.inputs?.s3_time) || 0);
}

function getProjectMinutesById(d, projectId) {
    const v = parseFloat(d.inputs?.[projectId + '_time']);
    if (!isNaN(v)) return v;
    const proj = PROJECTS.find(p => p.id === projectId);
    if (proj && proj.legacy) {
        return parseFloat(d.inputs?.[proj.legacy + '_time']) || 0;
    }
    return 0;
}

/* ============================================================
   LONG-TERM SLIDERS (kept for cross-compat with bah.html data)
   ============================================================ */
function loadLongTerm() {
    // The long-term sliders are not surfaced in v4 UI but we
    // preserve & migrate the storage so nothing is lost.
    const data = JSON.parse(localStorage.getItem('tracker_longterm') || '{}');
    return data;
}

/* ============================================================
   SCORING (mirrors bah.html v3.29 formulas)
   ============================================================ */
function calculateAll() {
    let total = 0;

    // 1. Wake time
    const wakeTime = $('wakeTime').value;
    let wakeScore = 0;
    if (wakeTime) {
        const [h, m] = wakeTime.split(':').map(Number);
        const dec = h + m / 60;
        if (dec < 6) wakeScore = 15;
        else if (dec < 7) wakeScore = 9;
        else if (dec < 8) wakeScore = 6;
        else if (dec < 9) wakeScore = 0;
        else wakeScore = -6;
    }
    $('wakeScore').innerText = wakeScore;
    total += wakeScore;

    // 2. Meditation (chip-driven hidden input)
    const medTime = parseFloat($('meditationTime').value) || 0;
    let medScore = (medTime / 20) * 15;
    if (medScore > 15) medScore = 15;
    $('meditationScore').innerText = Math.round(medScore);
    total += medScore;

    // 3. Breakfast
    const bfScore = parseInt($('breakfastRating').value) || 0;
    $('breakfastScore').innerText = bfScore;
    total += bfScore;

    // 4. Daily missions (15)
    let goalPoints = 0;
    if ($('goal1_done').checked) goalPoints += 5;
    if ($('goal2_done').checked) goalPoints += 5;
    if ($('goal3_done').checked) goalPoints += 5;
    $('goalScore').innerText = goalPoints;
    total += goalPoints;

    // 5. Six Projects (each up to 15, total cap 90)
    let projTotal = 0;
    let projMinutes = 0;
    PROJECTS.forEach(p => {
        const T = parseFloat($(p.id + '_time').value) || 0;
        const A = parseFloat($(p.id + '_acc').value) || 0;
        let score = (0.48 * (T / 120) + 0.52 * (A / 100)) * 15;
        if (score > 15) score = 15;
        $(p.id + '_score').innerText = Math.round(score);
        projTotal += score;
        projMinutes += T;
    });
    if (projTotal > 90) projTotal = 90;
    $('projTotalMins').innerText = Math.round(projMinutes);
    $('projTotalHrs').innerText  = (projMinutes / 60).toFixed(1);
    $('projTotalScore').innerText = Math.round(projTotal);
    total += projTotal;

    // 6. Internship — only weekdays count
    const day = new Date().getDay();
    const isWeekday = day >= 1 && day <= 5;
    let internScore = 0;
    if (isWeekday) {
        if ($('internAttended').checked) internScore += 6;
        const hrs = parseFloat($('internHours').value) || 0;
        internScore += Math.min(9, (hrs / 8) * 9);
    }
    $('internScore').innerText = Math.round(internScore);
    $('internAttendDisp').innerText = $('internAttended').checked ? 'Yes' : 'No';
    total += internScore;

    // 7. Diet
    const diet = parseInt($('dietScoreInput').value) || 0;
    total += diet;

    // 8. Water
    const water = parseFloat($('waterIntake').value) || 0;
    let waterScore = 0;
    if (water >= 3) waterScore = 5;
    else if (water >= 2) waterScore = 3;
    $('waterScore').innerText = waterScore;
    total += waterScore;

    // 9. Meds
    let medPoints = 0;
    if ($('med_morning').checked) medPoints += 5;
    $('medScore').innerText = medPoints;
    total += medPoints;

    // 10. Screen
    const sHours = parseFloat($('screenHours').value) || 0;
    let screenScore = 25 - (1.288 * Math.pow(sHours, 1.288));
    if (screenScore < -20) screenScore = -20;
    $('screenScore').innerText = Math.round(screenScore);
    total += screenScore;

    // 11. Literature read
    const N = parseFloat($('researchN').value) || 0;
    let rScore = 0.0833 * Math.pow(N, 3) - 1.1429 * Math.pow(N, 2) + 8.9881 * N;
    if (rScore < 0) rScore = 0;
    $('researchScore').innerText = Math.round(rScore);
    total += rScore;

    // 12. Discipline
    let habitScore = parseInt($('maturitylevel').value) || 0;
    if ($('rule_bed').checked)  habitScore += 5;
    if ($('rule_room').checked) habitScore += 5;
    $('habitScore').innerText = habitScore;
    total += habitScore;

    // 12.5 Movement & Steps  (max 15 pts: 10 from steps + 5 from walk min)
    const steps   = parseFloat($('stepsCount').value)  || 0;
    const dist    = parseFloat($('distanceKm').value)  || 0;
    const walkMin = parseFloat($('walkMinutes').value) || 0;
    const stepsScore = Math.min(10, (steps / 10000) * 10);
    const walkScore  = Math.min(5,  (walkMin / 60) * 5);
    $('stepsScore').innerText    = Math.round(stepsScore);
    $('walkScoreDisp').innerText = Math.round(walkScore);
    $('distanceDisp').innerText  = dist.toFixed(1);
    $('movementTotal').innerText = Math.round(stepsScore + walkScore);
    total += stepsScore + walkScore;
    // Animated ring
    const ringPct = Math.min(1, steps / 10000);
    const C = 2 * Math.PI * 52;
    const ringEl = $('stepsRingFill');
    if (ringEl) {
        ringEl.style.strokeDashoffset = (C * (1 - ringPct)).toFixed(1);
        let col = 'var(--danger)';
        if (ringPct >= 1)        col = '#22c55e';
        else if (ringPct >= 0.7) col = 'var(--success)';
        else if (ringPct >= 0.4) col = 'var(--warning)';
        ringEl.style.stroke = col;
    }
    $('stepsRingNum').innerText = steps.toLocaleString();
    $('dashboardSteps').innerText = (steps / 1000).toFixed(1) + 'k';

    // 13. Sleep
    const bedTime = $('bedTime').value;
    let sleepScore = 0;
    if (bedTime) {
        const [h, m] = bedTime.split(':').map(Number);
        let timeVal = h + m / 60;
        if (h < 6) timeVal += 24;
        if (timeVal < 22.08) sleepScore = 15;
        else if (timeVal < 23) sleepScore = 9;
        else if (timeVal < 24) sleepScore = 0;
    }
    $('sleepScore').innerText = Math.round(sleepScore);
    total += sleepScore;

    // Dashboard updates
    $('dashboardDeepWork').innerText = (projMinutes / 60).toFixed(1);
    total = Math.round(total);
    $('totalScore').innerText = total;

    const statusEl = $('statusText');
    if      (total >= 130) { statusEl.innerText = 'GOD MODE';  statusEl.style.color = '#a55eea'; }
    else if (total >= 100) { statusEl.innerText = 'LEGENDARY'; statusEl.style.color = '#00b894'; }
    else if (total >= 75)  { statusEl.innerText = 'GOOD';      statusEl.style.color = '#0984e3'; }
    else if (total >= 50)  { statusEl.innerText = 'SURVIVING'; statusEl.style.color = '#fdcb6e'; }
    else                   { statusEl.innerText = 'CRITICAL';  statusEl.style.color = '#d63031'; }
}

/* ============================================================
   SAVE / POPULATE
   ============================================================ */
function saveData() {
    let registry = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    let recordId = registry.find(id => id.includes(todayKey));
    if (!recordId) {
        recordId = 'tracker_' + todayKey + '_' + Date.now();
        registry.push(recordId);
        localStorage.setItem(INDEX_KEY, JSON.stringify(registry));
    }

    const total = parseInt($('totalScore').innerText) || 0;
    const inputs = {
        wakeTime:        $('wakeTime').value,
        meditationTime:  $('meditationTime').value,
        breakfastRating: $('breakfastRating').value,
        energyLevel:     $('energyLevel').value,
        dietScoreInput:  $('dietScoreInput').value,
        waterIntake:     $('waterIntake').value,
        med_morning:     $('med_morning').checked,
        screenHours:     $('screenHours').value,
        researchN:       $('researchN').value,
        maturitylevel:   $('maturitylevel').value,
        bedTime:         $('bedTime').value,
        rule_bed:        $('rule_bed').checked,
        rule_room:       $('rule_room').checked,
        dayTags:         $('dayTags').value,
        flowState:       $('flowState').value,
        moodSelect:      $('moodSelect').value,
        topWin:          $('topWin').value,
        mainObstacle:    $('mainObstacle').value,
        stepsCount:      $('stepsCount').value,
        distanceKm:      $('distanceKm').value,
        walkMinutes:     $('walkMinutes').value,
        movementMode:    $('movementMode').value
    };

    // Write the 6 projects and also alias the first three to legacy s1/s2/s3
    PROJECTS.forEach(p => {
        inputs[p.id + '_time']    = $(p.id + '_time').value;
        inputs[p.id + '_acc']     = $(p.id + '_acc').value;
        inputs[p.id + '_note']    = $(p.id + '_note').value;
        inputs[p.id + '_blocker'] = $(p.id + '_blocker').checked;
        if (p.legacy) {
            inputs[p.legacy + '_time'] = $(p.id + '_time').value;
            inputs[p.legacy + '_acc']  = $(p.id + '_acc').value;
        }
    });

    const data = {
        id: recordId,
        date: todayKey,
        timestamp: new Date().toLocaleTimeString(),
        weekday: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()],
        goals: [
            { text: $('goal1').value, done: $('goal1_done').checked },
            { text: $('goal2').value, done: $('goal2_done').checked },
            { text: $('goal3').value, done: $('goal3_done').checked }
        ],
        intern: {
            attended: $('internAttended').checked,
            hours:    parseFloat($('internHours').value) || 0,
            output:   $('internOutput').value,
            skill:    $('internSkill').value,
            mood:     parseInt($('officeMood').value) || 0
        },
        inputs,
        totalScore: total,
        version: 'v4'
    };

    localStorage.setItem(recordId, JSON.stringify(data));

    if (total >= 130) { triggerConfetti(); toast('GOD MODE achieved'); }
    else              { toast('Saved'); }

    loadHistoryTable();
    calculateStreak();
    updateLevelXP();
    calculateWeeklyAverages();
    renderMiniHeatmap();
    renderProjectBreakdown();
    renderProjectSparklines();
    renderCorrelationMatrix();
}

function populateForm(data) {
    if (!data) return;

    // Goals
    if (data.goals) {
        data.goals.forEach((g, i) => {
            if (g == null) return;
            if (typeof g === 'string') {
                const el = $('goal' + (i + 1)); if (el) el.value = g;
            } else {
                const t = $('goal' + (i + 1)); if (t) t.value = g.text || '';
                const c = $('goal' + (i + 1) + '_done'); if (c) c.checked = !!g.done;
            }
        });
    }

    // Inputs
    if (data.inputs) {
        for (const key in data.inputs) {
            const el = $(key);
            if (!el) continue;
            if (el.type === 'checkbox') el.checked = !!data.inputs[key];
            else el.value = data.inputs[key];
        }
        // Sync slider displays
        if (data.inputs.energyLevel)    $('energyDisp').innerText = data.inputs.energyLevel;
        if (data.inputs.dietScoreInput) $('dietDisp').innerText   = data.inputs.dietScoreInput;
        if (data.inputs.waterIntake)    $('waterDisp').innerText  = data.inputs.waterIntake;
        if (data.inputs.flowState)      $('flowDisp').innerText   = data.inputs.flowState;
    }

    // Legacy migration: if there's no p1/p2/p3 but s1/s2/s3 exists, map them
    if (data.inputs) {
        PROJECTS.forEach(p => {
            if (!p.legacy) return;
            if ($(p.id + '_time').value === '' && data.inputs[p.legacy + '_time'] != null) {
                $(p.id + '_time').value = data.inputs[p.legacy + '_time'];
            }
            if ($(p.id + '_acc').value === '' && data.inputs[p.legacy + '_acc'] != null) {
                $(p.id + '_acc').value = data.inputs[p.legacy + '_acc'];
            }
        });
    }

    // Internship
    if (data.intern) {
        $('internAttended').checked = !!data.intern.attended;
        $('internHours').value = data.intern.hours || 0;
        $('internOutput').value = data.intern.output || '';
        $('internSkill').value = data.intern.skill || '';
        $('officeMood').value = data.intern.mood || '';
    }

    // Restore blocker flags + slider visuals + meditation chip + sparklines
    PROJECTS.forEach(p => {
        const blocked = !!(data.inputs && data.inputs[p.id + '_blocker']);
        const cb = $(p.id + '_blocker'); if (cb) cb.checked = blocked;
        toggleBlocker(p.id);
        const accInput = $(p.id + '_acc');
        const accVal = $(p.id + '_accVal');
        if (accInput && accVal) accVal.innerText = (accInput.value || 0) + '%';
        if (accInput) syncRange(accInput);
    });
    // Meditation chip activation
    const medVal = String(parseInt($('meditationTime').value) || 0);
    document.querySelectorAll('#medChips .chip').forEach(b => {
        b.classList.toggle('active', b.dataset.min === medVal || (medVal === '30' && b.dataset.min === '30'));
    });

    calculateAll();
}

function resetForm() {
    if (!confirm('Reset the form for today?')) return;
    document.querySelectorAll('#trackerForm input').forEach(i => {
        if (i.type === 'checkbox') i.checked = false;
        else if (i.type === 'range') {
            if (i.id === 'waterIntake') i.value = 2.5;
            else if (i.id === 'energyLevel') i.value = 7;
            else if (i.id === 'flowState') i.value = 5;
            else i.value = 5;
        } else i.value = '';
    });
    document.querySelectorAll('#trackerForm select').forEach(s => s.selectedIndex = 0);
    $('energyDisp').innerText = '7';
    $('dietDisp').innerText   = '5';
    $('waterDisp').innerText  = '2.5';
    $('flowDisp').innerText   = '5';
    calculateAll();
}

/* ============================================================
   MIGRATION
   ============================================================ */
function migrateData() {
    const oldDates = JSON.parse(localStorage.getItem(OLD_INDEX_KEY) || '[]');
    let registry = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    let changed = false;
    oldDates.forEach(date => {
        const oldKey = 'tracker_' + date;
        if (localStorage.getItem(oldKey) && !registry.includes(oldKey)) {
            registry.push(oldKey);
            changed = true;
        }
    });
    if (changed) localStorage.setItem(INDEX_KEY, JSON.stringify(registry));
}

/* ============================================================
   TABS
   ============================================================ */
function switchTab(tabName, evt) {
    ['tracker','focus','yoga','history','routine'].forEach(t => {
        const v = $(t + 'View'); if (v) v.style.display = 'none';
    });
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const target = $(tabName + 'View');
    target.style.display = 'block';
    target.style.animation = 'none';
    void target.offsetHeight;
    target.style.animation = 'fadeIn 0.4s ease';
    if (evt && evt.target) evt.target.classList.add('active');
    if (tabName === 'history') {
        calculateWeeklyAverages();
        renderProjectBreakdown();
        renderCorrelationMatrix();
    }
}

/* ============================================================
   HISTORY TABLE
   ============================================================ */
function loadHistoryTable() {
    const tbody = document.querySelector('#historyTable tbody');
    tbody.innerHTML = '';
    const registry = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    const sorted = [...registry].reverse();

    sorted.forEach(id => {
        const dataStr = localStorage.getItem(id);
        if (!dataStr) return;
        const data = JSON.parse(dataStr);
        const tr = document.createElement('tr');

        const totalWork = (getProjectMinutes(data) / 60).toFixed(1);
        const score = parseInt(data.totalScore) || 0;

        let pill = `<span class="status-pill" style="background:#ef4444; color:white;">CRITICAL</span>`;
        if      (score >= 130) pill = `<span class="status-pill" style="background:#8b5cf6; color:white;">GOD MODE</span>`;
        else if (score >= 100) pill = `<span class="status-pill" style="background:#10b981; color:white;">LEGENDARY</span>`;
        else if (score >= 75)  pill = `<span class="status-pill" style="background:#3b82f6; color:white;">GOOD</span>`;
        else if (score >= 50)  pill = `<span class="status-pill" style="background:#f59e0b; color:white;">SURVIVING</span>`;

        const dateObj = new Date(data.date + 'T00:00:00');
        const dateStr = isNaN(dateObj) ? data.date :
            dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const dayStr = isNaN(dateObj) ? '-' :
            ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dateObj.getDay()];
        const win = data.inputs?.topWin
            ? `<span style="color:var(--success); font-size:11px;">${escapeHtml(data.inputs.topWin)}</span>`
            : `<span style="opacity:.3">-</span>`;

        tr.innerHTML = `
            <td style="font-weight:600;">${dateStr}</td>
            <td style="opacity:.8">${dayStr}</td>
            <td style="opacity:.8">${data.inputs?.wakeTime || '-'}</td>
            <td style="opacity:.8; color:#3b82f6; font-weight:600;">${data.inputs?.bedTime || '-'}</td>
            <td><strong>${totalWork}h</strong></td>
            <td style="font-weight:800; font-family:'Poppins';">${data.totalScore || 0}</td>
            <td>${pill}</td>
            <td>${win}</td>
            <td class="action-cell">
                <button class="table-btn" onclick="loadRecord('${id}')">Load</button>
                <button class="table-btn del" onclick="deleteRecord('${id}')">Del</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
        ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

window.loadRecord = function(id) {
    if (!confirm('Load this entry into the form?')) return;
    const data = JSON.parse(localStorage.getItem(id));
    populateForm(data);
    switchTab('tracker', { target: document.querySelector('.tab-btn') });
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteRecord = function(id) {
    if (!confirm('Delete this entry? This cannot be undone.')) return;
    localStorage.removeItem(id);
    let registry = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    registry = registry.filter(x => x !== id);
    localStorage.setItem(INDEX_KEY, JSON.stringify(registry));
    loadHistoryTable();
    calculateStreak();
    updateLevelXP();
    calculateWeeklyAverages();
    renderMiniHeatmap();
    renderProjectBreakdown();
    renderProjectSparklines();
    renderCorrelationMatrix();
};

window.clearHistory = function() {
    if (!confirm('WIPE ALL DATA? This will erase every entry from local storage.')) return;
    if (!confirm('Are you absolutely sure? This cannot be undone.')) return;
    localStorage.clear();
    location.reload();
};

/* ============================================================
   STREAK
   ============================================================ */
function calculateStreak() {
    const registry = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    const dates = registry.map(id => {
        try { return JSON.parse(localStorage.getItem(id)).date; } catch (e) { return null; }
    }).filter(Boolean);
    const unique = [...new Set(dates)].sort();
    if (unique.length === 0) { $('streakCount').innerText = 0; return; }

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yest  = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const last  = unique[unique.length - 1];

    if (last !== today && last !== yest) {
        streak = 0;
    } else {
        streak = 1;
        for (let i = unique.length - 1; i > 0; i--) {
            const a = new Date(unique[i]);
            const b = new Date(unique[i - 1]);
            const diff = Math.round(Math.abs(a - b) / 86400000);
            if (diff === 1) streak++;
            else break;
        }
    }
    $('streakCount').innerText = streak;
}

/* ============================================================
   LEVEL / XP
   ============================================================ */
function updateLevelXP() {
    const registry = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    let totalXP = 0;
    registry.forEach(id => {
        try { totalXP += parseInt(JSON.parse(localStorage.getItem(id)).totalScore) || 0; } catch (e) {}
    });
    const level = Math.floor(totalXP / 500) + 1;
    const cur = totalXP % 500;
    $('currentLevelText').innerHTML =
        `Lvl ${level} <span class="level-badge">Rank ${getRankName(level)}</span>`;
    $('currentXP').innerText = cur;
    $('xpBarFill').style.width = ((cur / 500) * 100) + '%';
}
function getRankName(lvl) {
    if (lvl < 5) return 'Novice';
    if (lvl < 10) return 'Apprentice';
    if (lvl < 20) return 'Adept';
    if (lvl < 30) return 'Expert';
    if (lvl < 50) return 'Master';
    return 'Grandmaster';
}

/* ============================================================
   MINI HEATMAP (last 7 days)
   ============================================================ */
function renderMiniHeatmap() {
    const container = $('miniHeatmapContainer');
    if (!container) return;
    container.innerHTML = '';
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }
    const map = {};
    JSON.parse(localStorage.getItem(INDEX_KEY) || '[]').forEach(id => {
        try { const d = JSON.parse(localStorage.getItem(id));
              map[d.date] = parseInt(d.totalScore || 0); } catch (e) {}
    });
    dates.forEach(date => {
        const score = map[date];
        const dot = document.createElement('div');
        dot.className = 'mini-dot';
        dot.title = `${date}: ${score !== undefined ? score : 'No data'}`;
        if (score !== undefined) {
            dot.style.boxShadow = 'none';
            if (score >= 130)      { dot.style.background = '#22c55e'; dot.style.boxShadow = '0 0 8px #22c55e'; }
            else if (score >= 100) dot.style.background = '#4ade80';
            else if (score >= 50)  dot.style.background = '#facc15';
            else                   dot.style.background = '#ef4444';
        }
        container.appendChild(dot);
    });
}

/* ============================================================
   PROJECT BREAKDOWN (last 30 days)
   ============================================================ */
function renderProjectBreakdown() {
    const root = $('projectBreakdown');
    if (!root) return;
    const registry = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    const last30 = registry.slice(-30);

    const totals = {};
    PROJECTS.forEach(p => totals[p.id] = 0);

    last30.forEach(id => {
        try {
            const d = JSON.parse(localStorage.getItem(id));
            PROJECTS.forEach(p => { totals[p.id] += getProjectMinutesById(d, p.id); });
        } catch (e) {}
    });

    const maxMin = Math.max(60, ...Object.values(totals));
    root.innerHTML = PROJECTS.map(p => {
        const mins = Math.round(totals[p.id]);
        const hrs  = (mins / 60).toFixed(1);
        const pct  = (mins / maxMin) * 100;
        return `
            <div class="pb-row" style="--c:${p.color}">
                <div class="pb-name"><span class="dot"></span>${p.name}</div>
                <div class="pb-bar"><div class="pb-fill" style="width:${pct}%"></div></div>
                <div class="pb-val">${hrs}h &middot; ${mins}m</div>
            </div>`;
    }).join('');
}

/* ============================================================
   WEEKLY AVERAGES + CHART DRIVERS
   ============================================================ */
function calculateWeeklyAverages() {
    const registry = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    const last30 = registry.slice(-30);
    const last7  = registry.slice(-7);

    if ($('historyView').style.display !== 'none') {
        drawTrendChart(last30);
        drawRadarChart(last7);
        renderHeatmap(registry);
        generateInsight(last30);
        drawCorrelationChart();
    }

    if (last7.length === 0) {
        updateStatDisplay(0, 0, 0, { score: 0, date: '--' }, 0);
        return;
    }

    let stats = { score: 0, deep: 0, sleep: 0, steps: 0, best: { score: 0, date: '' } };
    last7.forEach(id => {
        try {
            const d = JSON.parse(localStorage.getItem(id));
            const sc = parseInt(d.totalScore || 0);
            stats.score += sc;
            if (sc > stats.best.score) stats.best = { score: sc, date: d.date.slice(5) };
            stats.deep += getProjectMinutes(d);

            let sleepS = 0;
            const bt = d.inputs?.bedTime;
            if (bt) {
                const [h, m] = bt.split(':').map(Number);
                let v = h + m / 60;
                if (h < 6) v += 24;
                if (v < 22.08) sleepS = 15;
                else if (v < 23) sleepS = 9;
                else if (v < 24) sleepS = 0;
            }
            stats.sleep += sleepS;
            stats.steps += parseFloat(d.inputs?.stepsCount) || 0;
        } catch (e) {}
    });
    updateStatDisplay(
        Math.round(stats.score / last7.length),
        (stats.deep / 60).toFixed(1),
        Math.round(stats.sleep / last7.length),
        stats.best,
        stats.steps
    );
}

function updateStatDisplay(score, deep, sleep, best, totalSteps) {
    $('wkAvgScore').innerText = score;
    $('wkTotalDeep').innerText = deep + 'h';
    $('wkAvgSleep').innerText = sleep;
    $('wkBestDay').innerText = best?.score ? `${best.score} (${best.date})` : '--';
    $('trendScore').innerHTML = `<span class="trend-up">Recent activity</span>`;
    if ($('wkSteps')) {
        const k = (totalSteps || 0) / 1000;
        $('wkSteps').innerText = k >= 10 ? k.toFixed(0) + 'k' : k.toFixed(1) + 'k';
        $('trendSteps').innerHTML = `<span class="trend-up">Avg ${Math.round((totalSteps||0)/7).toLocaleString()}/day</span>`;
    }
}

/* ============================================================
   TREND CHART
   ============================================================ */
function drawTrendChart(dataList) {
    const canvas = $('trendCanvas'); if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.parentElement.clientWidth;
    const H = canvas.parentElement.clientHeight;
    canvas.width = W; canvas.height = H;
    canvas.lastData = dataList;

    const gridColor = '#e2e8f0', textColor = '#64748b', lineColor = '#3b82f6';
    ctx.clearRect(0, 0, W, H);

    if (dataList.length === 0) {
        ctx.fillStyle = textColor; ctx.font = '14px Inter'; ctx.textAlign = 'center';
        ctx.fillText('No data yet', W / 2, H / 2);
        return;
    }

    const points = dataList.map(id => {
        const d = JSON.parse(localStorage.getItem(id));
        return {
            date: d.date.slice(5), fullDate: d.date,
            score: parseInt(d.totalScore || 0),
            work: (getProjectMinutes(d) / 60).toFixed(1)
        };
    });

    const pad = 40, chartW = W - pad * 2, chartH = H - pad * 2;
    const stepX = points.length > 1 ? chartW / (points.length - 1) : 0;
    const MAX = 200;

    ctx.beginPath(); ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
    [0, 0.5, 1].forEach(r => {
        const y = pad + chartH - r * chartH;
        ctx.moveTo(pad, y); ctx.lineTo(W - pad, y);
        ctx.fillStyle = textColor; ctx.font = '10px Inter'; ctx.textAlign = 'right';
        ctx.fillText(Math.round(r * MAX), pad - 10, y + 3);
    });
    ctx.stroke();

    const plot = points.map((p, i) => {
        const x = points.length > 1 ? pad + i * stepX : W / 2;
        const y = pad + chartH - (Math.min(p.score, MAX) / MAX) * chartH;
        return { x, y, data: p };
    });

    const maxWork = 8;
    const barW = points.length > 1 ? (chartW / points.length) * 0.4 : 50;
    plot.forEach(p => {
        const h = (Math.min(p.data.work, maxWork) / maxWork) * chartH;
        ctx.fillStyle = 'rgba(59,130,246,0.1)';
        ctx.fillRect(p.x - barW / 2, pad + chartH - h, barW, h);
    });

    if (points.length > 1) {
        ctx.beginPath(); ctx.strokeStyle = lineColor; ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(59,130,246,0.4)';
        plot.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke(); ctx.shadowBlur = 0;
    }

    plot.forEach((p, i) => {
        ctx.beginPath();
        ctx.fillStyle = '#fff';
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = lineColor; ctx.stroke();
        if (points.length < 12 || i % 2 === 0) {
            ctx.fillStyle = textColor; ctx.textAlign = 'center'; ctx.font = '10px Inter';
            ctx.fillText(p.data.date, p.x, H - 25);
        }
    });

    canvas.onclick = function(e) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;
        const hit = plot.find(p => Math.hypot(mx - p.x, my - p.y) < 20);
        drawTrendChart(canvas.lastData);
        if (!hit) return;
        const tipW = 140, tipH = 60;
        let tx = hit.x - tipW / 2, ty = hit.y - tipH - 15;
        if (tx < 10) tx = 10;
        if (tx + tipW > W) tx = W - tipW - 10;
        if (ty < 10) ty = hit.y + 20;
        ctx.fillStyle = 'rgba(15,23,42,0.92)';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(tx, ty, tipW, tipH, 8)
                      : ctx.rect(tx, ty, tipW, tipH);
        ctx.fill();
        ctx.textAlign = 'left';
        ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 11px Inter';
        ctx.fillText(hit.data.fullDate, tx + 10, ty + 20);
        ctx.fillStyle = '#3b82f6';
        ctx.fillText('Score: ' + hit.data.score, tx + 10, ty + 35);
        ctx.fillStyle = '#94a3b8'; ctx.font = '10px Inter';
        ctx.fillText('Work: ' + hit.data.work + 'h', tx + 10, ty + 50);
    };
}

/* ============================================================
   RADAR CHART
   ============================================================ */
function drawRadarChart(dataList) {
    const canvas = $('radarCanvas'); if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.parentElement.clientWidth, H = canvas.parentElement.clientHeight;
    canvas.width = W; canvas.height = H;

    const root = getComputedStyle(document.documentElement);
    const gridColor = root.getPropertyValue('--chart-grid').trim();
    const textColor = root.getPropertyValue('--chart-text').trim();
    const mainText = root.getPropertyValue('--text').trim();

    const cx = W / 2, cy = H / 2;
    const radius = Math.min(W, H) / 2 - 40;
    const sides = 5, step = (Math.PI * 2) / sides;
    const labels = ['Work', 'Sleep', 'Diet', 'Flow', 'Discipline'];

    let stats = [0, 0, 0, 0, 0];
    if (dataList.length > 0) {
        const agg = { deep: 0, sleep: 0, diet: 0, focus: 0, disc: 0 };
        dataList.forEach(id => {
            try {
                const d = JSON.parse(localStorage.getItem(id));
                agg.deep += Math.min(getProjectMinutes(d) / 480, 1);
                let sScore = 0.5;
                const bt = d.inputs?.bedTime;
                if (bt) {
                    const h = parseInt(bt.split(':')[0]);
                    if (h >= 20 && h < 22) sScore = 1.0;
                }
                agg.sleep += sScore;
                agg.diet += (parseInt(d.inputs?.dietScoreInput || 5) / 10);
                agg.focus += (parseInt(d.inputs?.flowState || 5) / 10);
                agg.disc += (parseInt(d.inputs?.maturitylevel) >= 0 ? 1 : 0.4);
            } catch (e) {}
        });
        const n = dataList.length;
        stats = [agg.deep / n, agg.sleep / n, agg.diet / n, agg.focus / n, agg.disc / n];
    }

    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = gridColor; ctx.lineWidth = 1;
    for (let lv = 1; lv <= 4; lv++) {
        ctx.beginPath();
        const r = (radius / 4) * lv;
        for (let i = 0; i <= sides; i++) {
            const a = i * step - Math.PI / 2;
            const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.stroke();
    }

    if (dataList.length > 0) {
        ctx.beginPath();
        stats.forEach((v, i) => {
            const a = i * step - Math.PI / 2;
            const r = radius * v;
            const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(59,130,246,0.2)'; ctx.fill();
        ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2; ctx.stroke();
    }

    ctx.font = 'bold 11px Inter'; ctx.textAlign = 'center';
    labels.forEach((lbl, i) => {
        const a = i * step - Math.PI / 2;
        const x = cx + Math.cos(a) * (radius + 25);
        const y = cy + Math.sin(a) * (radius + 25);
        const pct = Math.round(stats[i] * 100);
        let color = textColor;
        if (pct >= 80) color = '#10b981';
        else if (pct < 50) color = '#ef4444';
        ctx.fillStyle = mainText; ctx.fillText(lbl, x, y);
        ctx.fillStyle = color;    ctx.fillText(pct + '%', x, y + 12);
    });
}

/* ============================================================
   30-DAY HEATMAP
   ============================================================ */
function renderHeatmap(registry) {
    const container = $('heatmapContainer'); if (!container) return;
    container.innerHTML = '';
    const today = new Date(), dates = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(today.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }
    const map = {};
    registry.forEach(id => {
        try { const d = JSON.parse(localStorage.getItem(id));
              map[d.date] = parseInt(d.totalScore || 0); } catch (e) {}
    });
    dates.forEach(date => {
        const score = map[date] || 0;
        const div = document.createElement('div');
        div.className = 'hm-cell';
        if (score === 0)      div.classList.add('hm-l0');
        else if (score < 50)  div.classList.add('hm-l1');
        else if (score < 80)  div.classList.add('hm-l2');
        else if (score < 100) div.classList.add('hm-l3');
        else                  div.classList.add('hm-l4');
        div.innerHTML = `<div class="hm-tooltip">${date}: ${score} pts</div>`;
        container.appendChild(div);
    });
}

function generateInsight(dataList) {
    const box = $('aiInsightText');
    if (!box) return;
    if (dataList.length === 0) { box.innerHTML = 'No data yet. Start tracking to see insights.'; return; }
    if (dataList.length < 3) {
        const last = JSON.parse(localStorage.getItem(dataList[dataList.length - 1]));
        const s = parseInt(last.totalScore || 0);
        box.innerHTML = s > 80
            ? `<strong>Insight:</strong> Excellent start. You scored <strong>${s}</strong>. Hold the momentum.`
            : `<strong>Insight:</strong> Journey begun. Consistency over intensity is your edge.`;
        return;
    }
    let earlyTotal = 0, lateTotal = 0, earlyN = 0, lateN = 0;
    dataList.forEach(id => {
        try {
            const d = JSON.parse(localStorage.getItem(id));
            const s = parseInt(d.totalScore);
            const bt = d.inputs?.bedTime;
            if (!bt) return;
            const h = parseInt(bt.split(':')[0]);
            if (h >= 20 && h <= 22) { earlyTotal += s; earlyN++; }
            else                    { lateTotal  += s; lateN++; }
        } catch (e) {}
    });
    if (earlyN > 0 && lateN > 0) {
        const a = earlyTotal / earlyN, b = lateTotal / lateN;
        const diff = Math.round(((a - b) / b) * 100);
        box.innerHTML = diff > 0
            ? `<strong>Insight:</strong> Sleeping before 10 PM correlates with a <strong>${diff}% higher</strong> daily score.`
            : `<strong>Insight:</strong> Bedtime appears uncorrelated with score. Focus on deep-work intensity instead.`;
    } else {
        box.innerHTML = `<strong>Insight:</strong> Routine looks consistent. Try increasing focused project time next.`;
    }
}

/* ============================================================
   CORRELATION LAB + PEARSON MATRIX
   ============================================================ */
function drawCorrelationChart() {
    const canvas = $('correlationCanvas'); if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.parentElement.clientWidth;
    const H = canvas.parentElement.clientHeight - 60;
    canvas.width = W; canvas.height = H;

    const axisColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();
    const textColor = '#64748b';

    const xKey = $('corrX').value, yKey = $('corrY').value;
    const registry = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    const val = (d, k) => {
        if (k === 'total') return parseInt(d.totalScore || 0);
        if (k === 'work')  return getProjectMinutes(d) / 60;
        if (k === 'sleep') {
            const bt = d.inputs?.bedTime; if (!bt) return 0;
            let h = parseInt(bt.split(':')[0]); if (h < 6) h += 24;
            return h < 22 ? 15 : (h < 23 ? 9 : 0);
        }
        if (k === 'diet')  return parseInt(d.inputs?.dietScoreInput || 0);
        if (k === 'focus') return parseInt(d.inputs?.flowState || 0);
        if (k === 'steps') return (parseFloat(d.inputs?.stepsCount) || 0) / 1000;
        return 0;
    };
    const pts = [];
    registry.forEach(id => {
        try {
            const d = JSON.parse(localStorage.getItem(id));
            pts.push({ x: val(d, xKey), y: val(d, yKey), date: d.date.slice(5) });
        } catch (e) {}
    });

    ctx.clearRect(0, 0, W, H);
    if (pts.length < 2) {
        ctx.fillStyle = textColor; ctx.textAlign = 'center';
        ctx.fillText('Need at least 2 days of data', W / 2, H / 2);
        return;
    }
    const pad = 40;
    const maxX = Math.max(...pts.map(p => p.x)) || 10;
    const maxY = Math.max(...pts.map(p => p.y)) || 10;
    const sx = v => pad + (v / maxX) * (W - pad * 2);
    const sy = v => (H - pad) - (v / maxY) * (H - pad * 2);

    ctx.strokeStyle = axisColor; ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(pad, pad); ctx.lineTo(pad, H - pad); ctx.lineTo(W - pad, H - pad);
    ctx.stroke();

    pts.forEach(p => {
        const px = sx(p.x), py = sy(p.y);
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59,130,246,0.6)'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.stroke();
        ctx.fillStyle = textColor; ctx.font = '10px Inter'; ctx.textAlign = 'center';
        ctx.fillText(p.date, px, py - 8);
    });

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    pts.forEach(p => { sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumXX += p.x * p.x; });
    const n = pts.length;
    const denom = (n * sumXX - sumX * sumX);
    const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    ctx.beginPath(); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]);
    ctx.moveTo(sx(0), sy(intercept));
    ctx.lineTo(sx(maxX), sy(slope * maxX + intercept));
    ctx.stroke(); ctx.setLineDash([]);

    $('corrStats').innerHTML =
        `Trend: <span style="color:${slope > 0 ? '#10b981' : '#ef4444'}">${slope > 0 ? 'POSITIVE' : 'NEGATIVE'}</span> correlation &middot; Slope: ${slope.toFixed(2)}`;
}

function renderCorrelationMatrix() {
    const container = $('correlationContainer'); if (!container) return;
    const registry = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    if (registry.length < 3) {
        container.innerHTML = `<div style="padding:20px; text-align:center; opacity:.6; font-size:12px;">Need at least 3 days of data to calculate correlations.</div>`;
        return;
    }
    const vec = { 'Sleep': [], 'Diet': [], 'Flow': [], 'Deep Work': [], 'Steps': [], 'Total Score': [] };
    registry.forEach(id => {
        try {
            const d = JSON.parse(localStorage.getItem(id));
            let sleep = 0;
            const bt = d.inputs?.bedTime;
            if (bt) {
                const [h, m] = bt.split(':').map(Number);
                let t = h + m / 60; if (h < 6) t += 24;
                if (t < 22.08) sleep = 15; else if (t < 23) sleep = 9; else sleep = 0;
            }
            vec['Sleep'].push(sleep);
            vec['Diet'].push(parseInt(d.inputs?.dietScoreInput || 5));
            vec['Flow'].push(parseInt(d.inputs?.flowState || 5));
            vec['Deep Work'].push(getProjectMinutes(d));
            vec['Steps'].push(parseFloat(d.inputs?.stepsCount) || 0);
            vec['Total Score'].push(parseInt(d.totalScore || 0));
        } catch (e) {}
    });

    function pearson(x, y) {
        const n = x.length; if (n === 0) return 0;
        let sx = 0, sy = 0, sxy = 0, sx2 = 0, sy2 = 0;
        for (let i = 0; i < n; i++) {
            sx += x[i]; sy += y[i]; sxy += x[i] * y[i]; sx2 += x[i] * x[i]; sy2 += y[i] * y[i];
        }
        const num = n * sxy - sx * sy;
        const den = Math.sqrt((n * sx2 - sx * sx) * (n * sy2 - sy * sy));
        return den === 0 ? 0 : num / den;
    }

    const keys = Object.keys(vec);
    let html = '<table class="corr-table"><thead><tr><th>Metric</th>';
    keys.forEach(k => html += `<th>${k}</th>`);
    html += '</tr></thead><tbody>';
    keys.forEach(rk => {
        html += `<tr><td><strong>${rk}</strong></td>`;
        keys.forEach(ck => {
            if (rk === ck) { html += `<td style="background:var(--bg); opacity:.3;">&mdash;</td>`; return; }
            const r = pearson(vec[rk], vec[ck]);
            const safe = isNaN(r) ? 0 : r, abs = Math.abs(safe);
            let opacity = abs * 0.7 + 0.05;
            if (abs < 0.1) opacity = 0;
            let bg = '', col = 'var(--text)';
            if (safe > 0.01) { bg = `background: rgba(16,185,129,${opacity});`; if (abs > 0.5) col = '#064e3b'; }
            else if (safe < -0.01) { bg = `background: rgba(239,68,68,${opacity});`; if (abs > 0.5) col = '#7f1d1d'; }
            else { bg = `background: transparent; opacity:.5;`; }
            let arrow = '';
            if (safe > 0.2)  arrow = '(+)';
            if (safe < -0.2) arrow = '(-)';
            html += `<td class="corr-cell" style="${bg} color:${col};">${safe.toFixed(2)} <span style="font-size:9px">${arrow}</span></td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

/* ============================================================
   FOCUS-MODE TIMER + ZEN
   ============================================================ */
let timerInterval = null, timerSeconds = 0, isTimerRunning = false;

function startTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;
    $('timerStatus').innerText = 'FLOW STATE ENGAGED';
    $('timerStatus').style.color = '#00f2ff';
    $('timerToggleBtn').innerText = 'PAUSE';
    const start = Date.now() - timerSeconds * 1000;
    timerInterval = setInterval(() => {
        timerSeconds = Math.floor((Date.now() - start) / 1000);
        updateTimerDisplay();
    }, 1000);
}
function pauseTimer() {
    if (!isTimerRunning) return;
    clearInterval(timerInterval); isTimerRunning = false;
    $('timerStatus').innerText = 'PAUSED';
    $('timerStatus').style.color = '#ffa502';
    $('timerToggleBtn').innerText = 'RESUME';
}
function stopTimer() {
    if (isTimerRunning) { clearInterval(timerInterval); isTimerRunning = false; }
    const target = $('timerTarget').value;
    const inputEl = $(target);
    const cur = parseFloat(inputEl?.value) || 0;
    const mins = Math.floor(timerSeconds / 60);
    if (mins > 0 && inputEl && confirm(`Add ${mins} minutes to the session log?`)) {
        inputEl.value = cur + mins;
        calculateAll();
        toast('Logged ' + mins + ' min');
    }
    timerSeconds = 0;
    updateTimerDisplay();
    $('timerStatus').innerText = 'READY';
    $('timerStatus').style.color = 'rgba(255,255,255,.8)';
    $('timerToggleBtn').innerText = 'START';
}
function toggleTimer() { isTimerRunning ? pauseTimer() : startTimer(); }
function updateTimerDisplay() {
    const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
    const s = (timerSeconds % 60).toString().padStart(2, '0');
    $('timerDisplay').innerText = m + ':' + s;
}

function toggleZenMode() {
    const el = $('focusModeContainer');
    el.classList.toggle('zen-mode-active');
    if (el.classList.contains('zen-mode-active')) {
        document.addEventListener('keydown', handleEscKey);
    } else {
        document.removeEventListener('keydown', handleEscKey);
    }
}
function handleEscKey(e) {
    if (e.key === 'Escape') {
        const el = $('focusModeContainer');
        if (el.classList.contains('zen-mode-active')) toggleZenMode();
    }
}

/* Brown noise */
let audioCtx = null, gainNode = null, isNoisePlaying = false;
function toggleBrownNoise() {
    const btn = $('noiseBtn');
    if (isNoisePlaying) {
        if (audioCtx) audioCtx.close();
        isNoisePlaying = false;
        btn.innerText = 'Audio: Off';
        btn.style.background = 'rgba(255,255,255,0.1)';
        btn.style.color = 'white';
        return;
    }
    try {
        const AC = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AC();
        const size = 4096;
        let lastOut = 0;
        const node = audioCtx.createScriptProcessor(size, 1, 1);
        node.onaudioprocess = e => {
            const out = e.outputBuffer.getChannelData(0);
            for (let i = 0; i < size; i++) {
                const white = Math.random() * 2 - 1;
                out[i] = (lastOut + 0.02 * white) / 1.02;
                lastOut = out[i];
                out[i] *= 3.5;
            }
        };
        gainNode = audioCtx.createGain();
        gainNode.gain.value = 0.15;
        node.connect(gainNode); gainNode.connect(audioCtx.destination);
        isNoisePlaying = true;
        btn.innerText = 'Audio: On';
        btn.style.background = '#10b981';
    } catch (e) {
        toast('Audio not supported in this browser');
    }
}

/* ============================================================
   ROUTINE — current activity badge & highlighting
   ============================================================ */
function updateCurrentActivity() {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const min = now.getMinutes();
    const t = hour + min / 60;
    const isWeekday = day >= 1 && day <= 5;
    $('clockDisplay').innerText = now.toLocaleTimeString();

    let status = 'FREE TIME', color = '#b2bec3';
    if (t >= 22 || t < 6)         { status = 'SLEEP WINDOW'; color = '#ef4444'; }
    else if (t < 7)               { status = 'MORNING PROTOCOL'; color = '#10b981'; }
    else if (isWeekday && t < 9)  { status = 'COMMUTE / OFFICE'; color = '#64748b'; }
    else if (isWeekday && t < 13) { status = 'INTERNSHIP I'; color = '#3b82f6'; }
    else if (t < 14)              { status = 'LUNCH'; color = '#10b981'; }
    else if (isWeekday && t < 17) { status = 'INTERNSHIP II'; color = '#3b82f6'; }
    else if (!isWeekday && t < 11){ status = 'HIKE / SPORT'; color = '#ea580c'; }
    else if (!isWeekday && t < 14){ status = 'PROJECT BLOCK'; color = '#8b5cf6'; }
    else if (!isWeekday && t < 17){ status = 'PROJECT / SOCIAL'; color = '#8b5cf6'; }
    else if (t < 18.5)            { status = 'GYM / SPORT'; color = '#10b981'; }
    else if (t < 19.5)            { status = 'DINNER'; color = '#e67e22'; }
    else if (t < 21)              { status = 'HEC-RAS 100 DAYS'; color = '#f59e0b'; }
    else if (t < 22)              { status = 'PROJECT WORK'; color = '#8b5cf6'; }

    const badge = $('currentActivityBadge');
    badge.innerText = status;
    badge.style.border = '1px solid ' + color;
    badge.style.boxShadow = '0 0 10px ' + color;
    badge.style.textShadow = '0 0 5px ' + color;

    // Routine highlighting
    document.querySelectorAll('.active-routine-cell').forEach(el => el.classList.remove('active-routine-cell'));
    document.querySelectorAll('.active-day-header').forEach(el => el.classList.remove('active-day-header'));

    const schedule = [
        { s: 0,   e: 6,   id: 'row-22' },
        { s: 6,   e: 7,   id: 'row-06' },
        { s: 7,   e: 9,   id: 'row-07' },
        { s: 9,   e: 13,  id: 'row-09' },
        { s: 13,  e: 14,  id: 'row-13' },
        { s: 14,  e: 17,  id: 'row-14' },
        { s: 17,  e: 18.5,id: 'row-17' },
        { s: 18.5,e: 19.5,id: 'row-18' },
        { s: 19.5,e: 21,  id: 'row-19' },
        { s: 21,  e: 22,  id: 'row-21' },
        { s: 22,  e: 24,  id: 'row-22' }
    ];
    const slot = schedule.find(x => t >= x.s && t < x.e);
    const colIndex = day + 1;
    const table = document.querySelector('.routine-table');
    if (table) {
        const header = table.querySelector('thead tr');
        if (header && header.children[colIndex]) header.children[colIndex].classList.add('active-day-header');
        if (slot) {
            const tr = $(slot.id);
            if (tr) {
                let visualCol = 0, target = null;
                for (let i = 0; i < tr.children.length; i++) {
                    const cell = tr.children[i];
                    const span = parseInt(cell.getAttribute('colspan') || 1);
                    if (i === 0) { visualCol = 0; continue; } // skip time column
                    if ((colIndex - 1) >= visualCol && (colIndex - 1) < visualCol + span) {
                        target = cell.querySelector('.rt-card') || cell;
                        break;
                    }
                    visualCol += span;
                }
                if (target) target.classList.add('active-routine-cell');
            }
        }
    }
}

/* ============================================================
   EXPORT / IMPORT
   ============================================================ */
function exportJSON() {
    const registry = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    if (registry.length === 0) { alert('No data to export.'); return; }
    const all = {
        exportedAt: new Date().toISOString(),
        registry,
        entries: {},
        longterm: JSON.parse(localStorage.getItem('tracker_longterm') || '{}')
    };
    registry.forEach(id => all.entries[id] = JSON.parse(localStorage.getItem(id)));
    download('bibek_tracker_backup_' + todayKey + '.json',
             JSON.stringify(all, null, 2), 'application/json');
}
function exportToExcel() {
    const registry = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    if (registry.length === 0) { alert('No data to export.'); return; }
    let table = `<table border="1"><thead><tr style="background:#1e293b;color:#fff;">
        <th>Date</th><th>Day</th><th>Mode</th><th>Wake</th><th>Bed</th>
        ${PROJECTS.map(p => `<th>${p.name} (min)</th>`).join('')}
        <th>Total Work</th><th>Intern Hrs</th><th>Steps</th><th>Dist (km)</th><th>Diet</th><th>Water</th>
        <th>Flow</th><th>Mood</th><th>Score</th><th>Top Win</th><th>Obstacle</th>
        </tr></thead><tbody>`;
    registry.forEach(id => {
        const d = JSON.parse(localStorage.getItem(id));
        if (!d || !d.inputs) return;
        const work = getProjectMinutes(d);
        const dateObj = new Date(d.date + 'T00:00:00');
        const dayStr = isNaN(dateObj) ? '-' : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dateObj.getDay()];
        table += `<tr>
            <td>${d.date}</td>
            <td>${dayStr}</td>
            <td>${d.weekday || d.mode || '-'}</td>
            <td>${d.inputs.wakeTime || '-'}</td>
            <td>${d.inputs.bedTime || '-'}</td>
            ${PROJECTS.map(p => `<td>${getProjectMinutesById(d, p.id)}</td>`).join('')}
            <td>${work}</td>
            <td>${d.intern?.hours || 0}</td>
            <td>${d.inputs.stepsCount || 0}</td>
            <td>${d.inputs.distanceKm || 0}</td>
            <td>${d.inputs.dietScoreInput || 0}</td>
            <td>${d.inputs.waterIntake || 0}</td>
            <td>${d.inputs.flowState || 0}</td>
            <td>${d.inputs.moodSelect || '-'}</td>
            <td><b>${d.totalScore || 0}</b></td>
            <td>${(d.inputs.topWin || '').replace(/"/g, "'")}</td>
            <td>${(d.inputs.mainObstacle || '').replace(/"/g, "'")}</td>
        </tr>`;
    });
    table += '</tbody></table>';
    const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'Bibek_Tracker_' + todayKey + '.xls';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
}
function download(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
}
function importJSON() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json';
    input.onchange = e => {
        const file = e.target.files[0]; if (!file) return;
        const r = new FileReader();
        r.onload = ev => {
            try {
                const parsed = JSON.parse(ev.target.result);
                if (!parsed.registry || !parsed.entries) throw new Error('Bad file');
                if (!confirm('Merge ' + parsed.registry.length + ' entries? Same-key entries will be overwritten.')) return;
                let reg = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
                parsed.registry.forEach(id => {
                    if (!reg.includes(id)) reg.push(id);
                    localStorage.setItem(id, JSON.stringify(parsed.entries[id]));
                });
                localStorage.setItem(INDEX_KEY, JSON.stringify(reg));
                if (parsed.longterm) localStorage.setItem('tracker_longterm', JSON.stringify(parsed.longterm));
                alert('Import complete. Reloading.');
                location.reload();
            } catch (err) { alert('Import failed: ' + err.message); }
        };
        r.readAsText(file);
    };
    input.click();
}

/* ============================================================
   CONFETTI + TOAST
   ============================================================ */
function triggerConfetti() {
    const canvas = $('confettiCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const parts = [];
    for (let i = 0; i < 150; i++) {
        parts.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            w: Math.random() * 10 + 5,
            h: Math.random() * 10 + 5,
            color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            vx: Math.random() * 4 - 2,
            vy: Math.random() * 4 + 2,
            r: Math.random() * 360
        });
    }
    (function loop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        parts.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy; p.r += 2;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.r * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
            if (p.y > canvas.height) parts.splice(i, 1);
        });
        if (parts.length > 0) requestAnimationFrame(loop);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    })();
}
function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
}

/* Expose required handlers globally for inline `onclick` */
window.switchTab        = switchTab;
window.calculateAll     = calculateAll;
window.saveData         = saveData;
window.resetForm        = resetForm;
window.exportJSON       = exportJSON;
window.exportToExcel    = exportToExcel;
window.importJSON       = importJSON;
window.toggleZenMode    = toggleZenMode;
window.toggleTimer      = toggleTimer;
window.stopTimer        = stopTimer;
window.toggleBrownNoise = toggleBrownNoise;
window.drawCorrelationChart = drawCorrelationChart;
window.toggleBlocker     = toggleBlocker;
window.syncRange         = syncRange;
