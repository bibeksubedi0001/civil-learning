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
})();
