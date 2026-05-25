/* ==========================================================================
   PYTHON PLAYGROUND  —  Pyodide-powered in-browser REPL with curated
   civil-engineering ML snippets.

   • Lazy-loads Pyodide on first Run (≈10 MB) so the rest of the site stays light.
   • Captures stdout / stderr, displays matplotlib figures as <img>.
   • Persists per-snippet edits in localStorage under `ce-ai:playground:`.
   ========================================================================== */
(function () {
    'use strict';

    const root = document.getElementById('playground-app');
    if (!root) return;

    const LS_PREFIX = 'ce-ai:playground:';
    const LS_LAST_KEY = LS_PREFIX + 'last';

    /* ────────────────────────── Snippets ────────────────────────── */
    const SNIPPETS = [
        {
            id: 'welcome',
            title: 'Welcome — quick sanity check',
            icon: 'fa-hand-wave',
            packages: [],
            code:
`# Welcome to the in-browser Python playground.
# This is a real Python 3 interpreter running on your machine via WebAssembly.
import sys, platform

print("Python:", sys.version.split()[0])
print("Platform:", platform.platform())
print()

# A tiny civil-engineering warm-up
beam_loads_kN = [12, 18, 22, 30, 27, 19, 15]
print(f"Mean load : {sum(beam_loads_kN)/len(beam_loads_kN):6.2f} kN")
print(f"Peak load : {max(beam_loads_kN):6.2f} kN")
print(f"# samples : {len(beam_loads_kN)}")
`
        },
        {
            id: 'concrete-linreg',
            title: 'Linear regression — concrete strength',
            icon: 'fa-cubes-stacked',
            packages: ['numpy', 'scikit-learn', 'matplotlib'],
            code:
`# Predict 28-day compressive strength of concrete from water/cement ratio.
# Classic empirical relationship (Abrams' law) approximated with linear regression.
import numpy as np
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_squared_error

rng = np.random.default_rng(42)

# Synthetic dataset: water-cement ratio vs 28-day strength (MPa)
wc_ratio = np.linspace(0.30, 0.70, 60)
# Inverse-ish relationship + noise (lower w/c → higher strength)
strength = 80 - 80 * wc_ratio + rng.normal(0, 3.0, size=wc_ratio.size)

X = wc_ratio.reshape(-1, 1)
model = LinearRegression().fit(X, strength)
pred = model.predict(X)

print(f"Slope    : {model.coef_[0]:7.2f} MPa per unit w/c")
print(f"Intercept: {model.intercept_:7.2f} MPa")
print(f"R²       : {r2_score(strength, pred):7.3f}")
print(f"RMSE     : {np.sqrt(mean_squared_error(strength, pred)):7.2f} MPa")

# Predict for a couple of mix designs
for r in [0.40, 0.50, 0.60]:
    print(f"  w/c = {r:.2f}  →  predicted strength = {model.predict([[r]])[0]:.1f} MPa")

# Visualise
plt.figure(figsize=(7, 4.2))
plt.scatter(wc_ratio, strength, s=28, alpha=0.7, label="Lab samples")
plt.plot(wc_ratio, pred, color="#00d4aa", lw=2.5, label="Linear fit")
plt.xlabel("Water / Cement ratio")
plt.ylabel("28-day compressive strength (MPa)")
plt.title("Concrete strength vs w/c ratio")
plt.legend()
plt.grid(alpha=0.3)
plt.tight_layout()
plt.show()
`
        },
        {
            id: 'soil-kmeans',
            title: 'K-means — soil sample clustering',
            icon: 'fa-mountain-sun',
            packages: ['numpy', 'scikit-learn', 'matplotlib'],
            code:
`# Cluster soil samples by (% sand, % clay) into engineering soil groups.
import numpy as np
import matplotlib.pyplot as plt
from sklearn.cluster import KMeans

rng = np.random.default_rng(7)

# Three latent groups: sandy, clayey, well-graded
def blob(center, n=40, spread=4.5):
    return rng.normal(loc=center, scale=spread, size=(n, 2))

samples = np.vstack([
    blob((75, 10)),   # Sandy
    blob((20, 65)),   # Clayey
    blob((45, 35)),   # Well-graded / loam
])

k = 3
km = KMeans(n_clusters=k, n_init=10, random_state=0).fit(samples)
labels = km.labels_

print(f"Samples : {samples.shape[0]}")
print(f"Clusters: {k}")
print(f"Inertia : {km.inertia_:.1f}")
print()
for i, c in enumerate(km.cluster_centers_):
    n = int((labels == i).sum())
    print(f"  Cluster {i}:  sand≈{c[0]:5.1f}%,  clay≈{c[1]:5.1f}%   ({n} samples)")

# Plot
colors = ["#00d4aa", "#0ea5e9", "#f59e0b"]
plt.figure(figsize=(6.5, 5))
for i in range(k):
    pts = samples[labels == i]
    plt.scatter(pts[:, 0], pts[:, 1], s=32, alpha=0.75,
                color=colors[i], label=f"Cluster {i}")
plt.scatter(km.cluster_centers_[:, 0], km.cluster_centers_[:, 1],
            marker="X", s=200, color="white", edgecolor="black",
            linewidth=1.4, label="Centroids")
plt.xlabel("% Sand")
plt.ylabel("% Clay")
plt.title("Soil samples clustered by composition")
plt.legend()
plt.grid(alpha=0.3)
plt.tight_layout()
plt.show()
`
        },
        {
            id: 'beam-tree',
            title: 'Decision tree — beam safety classifier',
            icon: 'fa-shield-halved',
            packages: ['numpy', 'scikit-learn', 'matplotlib'],
            code:
`# Classify simply-supported RC beams as SAFE / UNSAFE from span, load and depth.
import numpy as np
import matplotlib.pyplot as plt
from sklearn.tree import DecisionTreeClassifier, plot_tree
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

rng = np.random.default_rng(1)
n = 300

span_m   = rng.uniform(3, 9, n)         # 3-9 m span
load_kNm = rng.uniform(5, 40, n)        # UDL kN/m
depth_mm = rng.uniform(250, 600, n)     # effective depth

# Heuristic "true" rule:  unsafe when M = w·L²/8 exceeds a depth-based capacity.
moment = load_kNm * span_m**2 / 8.0
capacity = 0.02 * depth_mm**1.6        # toy capacity proxy
safe = (capacity > moment).astype(int)  # 1 = SAFE, 0 = UNSAFE

X = np.column_stack([span_m, load_kNm, depth_mm])
y = safe
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=0)

clf = DecisionTreeClassifier(max_depth=4, random_state=0).fit(Xtr, ytr)
yp = clf.predict(Xte)

print(f"Train accuracy: {accuracy_score(ytr, clf.predict(Xtr)):.3f}")
print(f"Test  accuracy: {accuracy_score(yte, yp):.3f}")
print()
print(classification_report(yte, yp, target_names=["UNSAFE", "SAFE"]))

plt.figure(figsize=(11, 6))
plot_tree(clf,
          feature_names=["span_m", "load_kNm", "depth_mm"],
          class_names=["UNSAFE", "SAFE"],
          filled=True, rounded=True, fontsize=9)
plt.title("Decision tree — beam safety")
plt.tight_layout()
plt.show()
`
        },
        {
            id: 'traffic-numpy',
            title: 'NumPy — traffic flow stats',
            icon: 'fa-road',
            packages: ['numpy', 'matplotlib'],
            code:
`# Hourly traffic counts for a week. Compute peak, mean, and a 24-hour profile.
import numpy as np
import matplotlib.pyplot as plt

rng = np.random.default_rng(0)
hours = np.arange(24)
# Bimodal weekday profile (morning + evening peak)
base = 200 + 600*np.exp(-((hours-8)/2.0)**2) + 700*np.exp(-((hours-18)/2.2)**2)

week = np.vstack([base + rng.normal(0, 40, 24) for _ in range(7)])
labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

print("Daily totals (vehicles):")
for d, total in zip(labels, week.sum(axis=1)):
    print(f"  {d}: {int(total):,}")
print()
print(f"Peak hourly count : {int(week.max()):,}")
print(f"Avg hourly count  : {week.mean():.0f}")

plt.figure(figsize=(8, 4.2))
for d, row in zip(labels, week):
    plt.plot(hours, row, alpha=0.55, label=d)
plt.plot(hours, week.mean(axis=0), color="black", lw=2.4, label="Weekly mean")
plt.xticks(range(0, 24, 2))
plt.xlabel("Hour of day")
plt.ylabel("Vehicles / hour")
plt.title("Hourly traffic profile")
plt.legend(ncol=4, fontsize=8)
plt.grid(alpha=0.3)
plt.tight_layout()
plt.show()
`
        }
    ];

    /* ────────────────────────── DOM refs ────────────────────────── */
    const $editor   = document.getElementById('pg-editor');
    const $output   = document.getElementById('pg-output');
    const $figures  = document.getElementById('pg-figures');
    const $snippets = document.getElementById('pg-snippets');
    const $active   = document.getElementById('pg-active');
    const $status   = document.getElementById('pg-status');
    const $statusDot  = $status.querySelector('.pg-status__dot');
    const $statusText = $status.querySelector('.pg-status__text');
    const $outMeta  = document.getElementById('pg-output-meta');
    const $runBtn   = document.getElementById('pg-run');
    const $resetBtn = document.getElementById('pg-reset');
    const $clearBtn = document.getElementById('pg-clear');

    /* ────────────────────────── State ────────────────────────── */
    let pyodide = null;
    let pyodideLoading = null;          // Promise once we start loading
    const loadedPackages = new Set();
    let activeId = null;

    /* ────────────────────────── Snippet list ────────────────────────── */
    function renderSnippetList() {
        $snippets.innerHTML = '';
        SNIPPETS.forEach(s => {
            const li = document.createElement('li');
            li.className = 'pg-snippet';
            li.dataset.id = s.id;
            li.innerHTML = `
                <button type="button" class="pg-snippet__btn">
                    <i class="fa-solid ${s.icon}"></i>
                    <span>${s.title}</span>
                </button>`;
            li.querySelector('button').addEventListener('click', () => loadSnippet(s.id));
            $snippets.appendChild(li);
        });
    }

    function loadSnippet(id, opts = {}) {
        const snip = SNIPPETS.find(s => s.id === id);
        if (!snip) return;
        activeId = id;
        // Restore user's saved edit unless forceOriginal
        const saved = !opts.forceOriginal && localStorage.getItem(LS_PREFIX + id);
        $editor.value = saved != null ? saved : snip.code;
        localStorage.setItem(LS_LAST_KEY, id);
        // Highlight
        $snippets.querySelectorAll('.pg-snippet').forEach(li => {
            li.classList.toggle('is-active', li.dataset.id === id);
        });
        $active.textContent = snip.title;
    }

    /* ────────────────────────── Persistence ────────────────────────── */
    let saveTimer = null;
    $editor.addEventListener('input', () => {
        if (!activeId) return;
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            try { localStorage.setItem(LS_PREFIX + activeId, $editor.value); } catch (_) {}
        }, 300);
    });

    /* ────────────────────────── Editor tab key ────────────────────────── */
    $editor.addEventListener('keydown', (e) => {
        // Tab inserts 4 spaces
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = $editor.selectionStart;
            const end = $editor.selectionEnd;
            const v = $editor.value;
            $editor.value = v.substring(0, start) + '    ' + v.substring(end);
            $editor.selectionStart = $editor.selectionEnd = start + 4;
        }
        // Ctrl/Cmd + Enter runs
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            runCode();
        }
    });

    /* ────────────────────────── Status helpers ────────────────────────── */
    function setStatus(state, text) {
        // state ∈ idle | loading | ready | running | error
        $statusDot.className = 'pg-status__dot pg-status__dot--' + state;
        $statusText.innerHTML = text;
    }

    function appendOutput(text, cls) {
        const span = document.createElement('span');
        if (cls) span.className = cls;
        span.textContent = text;
        $output.appendChild(span);
        $output.scrollTop = $output.scrollHeight;
    }

    function clearOutput() {
        $output.textContent = '';
        $figures.innerHTML = '';
        $outMeta.textContent = '';
    }

    /* ────────────────────────── Pyodide bootstrap ────────────────────────── */
    async function ensurePyodide() {
        if (pyodide) return pyodide;
        if (pyodideLoading) return pyodideLoading;

        if (typeof loadPyodide !== 'function') {
            throw new Error('Pyodide loader script failed to load. Check your network connection.');
        }

        setStatus('loading', 'Downloading Python runtime… (~10&nbsp;MB, cached after first run)');
        pyodideLoading = loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
        }).then(py => {
            pyodide = py;
            // Wire stdout / stderr
            py.setStdout({ batched: (s) => appendOutput(s + '\n', 'pg-out-stdout') });
            py.setStderr({ batched: (s) => appendOutput(s + '\n', 'pg-out-stderr') });
            setStatus('ready', 'Python ready. Hit <strong>Run</strong> or <kbd>Ctrl</kbd>+<kbd>Enter</kbd>.');
            return py;
        }).catch(err => {
            pyodideLoading = null;
            setStatus('error', 'Failed to load Pyodide: ' + (err.message || err));
            throw err;
        });

        return pyodideLoading;
    }

    async function ensurePackages(pkgs) {
        if (!pkgs || !pkgs.length) return;
        const needed = pkgs.filter(p => !loadedPackages.has(p));
        if (!needed.length) return;
        setStatus('loading', `Loading packages: <code>${needed.join(', ')}</code>…`);
        await pyodide.loadPackage(needed);
        needed.forEach(p => loadedPackages.add(p));
    }

    /* ────────────────────────── Matplotlib capture ────────────────────────── */
    // Override plt.show() so each figure is rendered to a PNG and surfaced to JS.
    const MPL_SETUP = `
import matplotlib
matplotlib.use("AGG")
import matplotlib.pyplot as _plt
import base64 as _b64, io as _io, js as _js

_pg_figures = []

def _pg_show(*args, **kwargs):
    for num in _plt.get_fignums():
        fig = _plt.figure(num)
        buf = _io.BytesIO()
        fig.savefig(buf, format="png", dpi=110, bbox_inches="tight",
                    facecolor=fig.get_facecolor())
        buf.seek(0)
        _pg_figures.append(_b64.b64encode(buf.read()).decode("ascii"))
    _plt.close("all")

_plt.show = _pg_show

def _pg_drain_figures():
    out = list(_pg_figures)
    _pg_figures.clear()
    return out
`;

    async function setupMatplotlibOnce() {
        if (setupMatplotlibOnce._done) return;
        await pyodide.runPythonAsync(MPL_SETUP);
        setupMatplotlibOnce._done = true;
    }

    function detectPackagesIn(code) {
        // Best-effort: union of declared packages for the active snippet plus
        // any standard-library-ish detection in pasted code.
        const detected = new Set();
        const map = {
            'numpy': /\b(import\s+numpy|from\s+numpy)\b/,
            'pandas': /\b(import\s+pandas|from\s+pandas)\b/,
            'scikit-learn': /\b(import\s+sklearn|from\s+sklearn)\b/,
            'matplotlib': /\b(import\s+matplotlib|from\s+matplotlib|import\s+pylab)\b/,
            'scipy': /\b(import\s+scipy|from\s+scipy)\b/
        };
        Object.entries(map).forEach(([pkg, rx]) => { if (rx.test(code)) detected.add(pkg); });
        return [...detected];
    }

    /* ────────────────────────── Run ────────────────────────── */
    async function runCode() {
        const code = $editor.value;
        clearOutput();

        try {
            $runBtn.disabled = true;
            await ensurePyodide();

            const snip = SNIPPETS.find(s => s.id === activeId);
            const pkgs = new Set([
                ...(snip ? (snip.packages || []) : []),
                ...detectPackagesIn(code)
            ]);
            if (pkgs.size) await ensurePackages([...pkgs]);

            const usesMpl = pkgs.has('matplotlib');
            if (usesMpl) await setupMatplotlibOnce();

            setStatus('running', 'Running…');
            const t0 = performance.now();
            await pyodide.runPythonAsync(code);

            if (usesMpl) {
                const figs = pyodide.runPython('_pg_drain_figures()').toJs();
                figs.forEach((b64, i) => {
                    const img = document.createElement('img');
                    img.alt = `Figure ${i + 1}`;
                    img.src = 'data:image/png;base64,' + b64;
                    $figures.appendChild(img);
                });
            }

            const ms = (performance.now() - t0).toFixed(0);
            $outMeta.textContent = `Finished in ${ms} ms`;
            setStatus('ready', 'Done. Edit and run again, or pick another example.');
        } catch (err) {
            const msg = (err && err.message) ? err.message : String(err);
            appendOutput(msg + '\n', 'pg-out-stderr');
            setStatus('error', 'Error during execution — see output below.');
        } finally {
            $runBtn.disabled = false;
        }
    }

    /* ────────────────────────── Buttons ────────────────────────── */
    $runBtn.addEventListener('click', runCode);
    $clearBtn.addEventListener('click', clearOutput);
    $resetBtn.addEventListener('click', () => {
        if (!activeId) return;
        const snip = SNIPPETS.find(s => s.id === activeId);
        if (!snip) return;
        if (!confirm(`Reset "${snip.title}" to its original code? Your edits for this snippet will be lost.`)) return;
        localStorage.removeItem(LS_PREFIX + activeId);
        loadSnippet(activeId, { forceOriginal: true });
    });

    /* ────────────────────────── Boot ────────────────────────── */
    renderSnippetList();
    const lastId = localStorage.getItem(LS_LAST_KEY);
    loadSnippet(lastId && SNIPPETS.some(s => s.id === lastId) ? lastId : SNIPPETS[0].id);
})();
