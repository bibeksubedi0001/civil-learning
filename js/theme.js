/* ============================================
   THEME.JS - Dark/Light Mode Toggle
   Persists via localStorage
   ============================================ */

(function () {
    'use strict';

    const STORAGE_KEY = 'ce-ai-theme';

    function getPreferred() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    function applyTheme(theme, transition) {
        if (transition) {
            document.documentElement.classList.add('theme-transitioning');
            setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 500);
        }
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);

        // Dispatch event for canvas redraws
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    // Apply on load (no transition)
    applyTheme(getPreferred(), false);

    // Bind toggle buttons
    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.theme-toggle').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var current = document.documentElement.getAttribute('data-theme') || 'dark';
                applyTheme(current === 'dark' ? 'light' : 'dark', true);
            });
        });
    });

    // Expose getter
    window.getCurrentTheme = function () {
        return document.documentElement.getAttribute('data-theme') || 'dark';
    };

    window.isDarkMode = function () {
        return window.getCurrentTheme() === 'dark';
    };

    /* ============================================
       Service worker registration (offline reading)
       Skips localhost dev servers from a different scope.
       ============================================ */
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            // Resolve sw.js relative to site root by walking up based on current path depth.
            var path = location.pathname;
            // Count slashes to figure out depth from root; sw.js is at site root.
            var depth = (path.replace(/^\/+|\/+$/g, '').split('/').length) - 1;
            if (path.endsWith('/') || path.endsWith('/index.html')) depth = Math.max(0, depth);
            var swUrl = (depth > 0 ? '../'.repeat(depth) : './') + 'sw.js';
            // Use absolute path (works for both http(s) and file-served previews).
            navigator.serviceWorker.register('/sw.js', { scope: '/' })
                .catch(function () {
                    // Fallback: try relative URL (for previews where root isn't reachable).
                    navigator.serviceWorker.register(swUrl).catch(function () { /* noop */ });
                });
        });
    }

    /* ============================================
       Accessibility: font-size & dyslexia-friendly font
       ============================================ */
    var FS_KEY = 'ce-ai-fontsize';   // 'sm' | 'md' | 'lg' | 'xl'
    var FF_KEY = 'ce-ai-fontfamily'; // 'default' | 'dyslexic'
    var FS_VALUES = ['sm', 'md', 'lg', 'xl'];
    var FS_LABELS = { sm: 'Small', md: 'Default', lg: 'Large', xl: 'Extra large' };
    var lexendLoaded = false;

    function ensureLexend() {
        if (lexendLoaded) return;
        lexendLoaded = true;
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&display=swap';
        document.head.appendChild(link);
    }

    function applyFontSize(size) {
        if (FS_VALUES.indexOf(size) === -1) size = 'md';
        var root = document.documentElement;
        FS_VALUES.forEach(function (s) { root.classList.remove('font-scale-' + s); });
        root.classList.add('font-scale-' + size);
        try { localStorage.setItem(FS_KEY, size); } catch (e) {}
    }

    function applyFontFamily(family) {
        if (family !== 'dyslexic') family = 'default';
        var root = document.documentElement;
        if (family === 'dyslexic') {
            ensureLexend();
            root.classList.add('font-family-dyslexic');
        } else {
            root.classList.remove('font-family-dyslexic');
        }
        try { localStorage.setItem(FF_KEY, family); } catch (e) {}
    }

    // Apply on load
    var storedFs = 'md', storedFf = 'default';
    try { storedFs = localStorage.getItem(FS_KEY) || 'md'; } catch (e) {}
    try { storedFf = localStorage.getItem(FF_KEY) || 'default'; } catch (e) {}
    applyFontSize(storedFs);
    applyFontFamily(storedFf);

    function buildPanel(anchorBtn) {
        var panel = document.createElement('div');
        panel.className = 'a11y-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Reading preferences');
        panel.hidden = true;
        panel.innerHTML =
            '<div class="a11y-panel__group">'
            + '<div class="a11y-panel__label">Text size</div>'
            + '<div class="a11y-panel__sizes" role="radiogroup" aria-label="Text size">'
            + FS_VALUES.map(function (s) {
                var px = s === 'sm' ? '13px' : s === 'md' ? '15px' : s === 'lg' ? '17px' : '19px';
                return '<button type="button" class="a11y-size" data-size="' + s + '" role="radio" aria-checked="false" title="' + FS_LABELS[s] + '" style="font-size:' + px + '">A</button>';
            }).join('')
            + '</div>'
            + '</div>'
            + '<div class="a11y-panel__group">'
            + '<div class="a11y-panel__label">Font</div>'
            + '<label class="a11y-panel__check">'
            + '<input type="checkbox" class="a11y-dyslexic"> '
            + '<span>Dyslexia-friendly font <small>(Lexend)</small></span>'
            + '</label>'
            + '</div>'
            + '<button type="button" class="a11y-panel__reset">Reset to defaults</button>';

        function syncUI() {
            var fs = localStorage.getItem(FS_KEY) || 'md';
            var ff = localStorage.getItem(FF_KEY) || 'default';
            panel.querySelectorAll('.a11y-size').forEach(function (b) {
                var on = b.getAttribute('data-size') === fs;
                b.classList.toggle('is-active', on);
                b.setAttribute('aria-checked', on ? 'true' : 'false');
            });
            var cb = panel.querySelector('.a11y-dyslexic');
            if (cb) cb.checked = (ff === 'dyslexic');
        }

        panel.addEventListener('click', function (e) {
            var sizeBtn = e.target.closest('.a11y-size');
            if (sizeBtn) {
                applyFontSize(sizeBtn.getAttribute('data-size'));
                syncUI();
                return;
            }
            if (e.target.classList.contains('a11y-panel__reset')) {
                applyFontSize('md');
                applyFontFamily('default');
                syncUI();
            }
        });
        panel.addEventListener('change', function (e) {
            if (e.target.classList.contains('a11y-dyslexic')) {
                applyFontFamily(e.target.checked ? 'dyslexic' : 'default');
            }
        });

        panel._sync = syncUI;
        return panel;
    }

    function injectA11yButtons() {
        var toggles = document.querySelectorAll('.theme-toggle');
        // Fallback: if no theme-toggle exists on the page, anchor to .nav-links
        var anchors = [];
        if (toggles.length === 0) {
            document.querySelectorAll('.nav-links').forEach(function (nl) { anchors.push({ kind: 'after', el: nl }); });
        } else {
            toggles.forEach(function (t) { anchors.push({ kind: 'before', el: t }); });
        }
        anchors.forEach(function (a) {
            var ref = a.el;
            if (ref.dataset.a11yInjected === '1') return;
            ref.dataset.a11yInjected = '1';

            var wrap = document.createElement('div');
            wrap.className = 'a11y-toggle-wrap';

            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'a11y-toggle';
            btn.setAttribute('aria-label', 'Reading preferences (text size & font)');
            btn.setAttribute('aria-haspopup', 'dialog');
            btn.setAttribute('aria-expanded', 'false');
            btn.innerHTML = '<span class="a11y-toggle__a">A</span><span class="a11y-toggle__plus">+</span>';

            var panel = buildPanel(btn);

            wrap.appendChild(btn);
            wrap.appendChild(panel);

            // Insert relative to the anchor element
            if (a.kind === 'before') {
                ref.parentNode.insertBefore(wrap, ref);
            } else {
                // 'after' — append inside .nav-links as last child
                ref.appendChild(wrap);
            }

            function close() {
                panel.hidden = true;
                btn.setAttribute('aria-expanded', 'false');
                document.removeEventListener('click', onDocClick, true);
                document.removeEventListener('keydown', onKey, true);
            }
            function open() {
                panel._sync();
                panel.hidden = false;
                btn.setAttribute('aria-expanded', 'true');
                document.addEventListener('click', onDocClick, true);
                document.addEventListener('keydown', onKey, true);
            }
            function onDocClick(e) {
                if (!wrap.contains(e.target)) close();
            }
            function onKey(e) {
                if (e.key === 'Escape') { close(); btn.focus(); }
            }
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (panel.hidden) open(); else close();
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectA11yButtons);
    } else {
        injectA11yButtons();
    }
})();
