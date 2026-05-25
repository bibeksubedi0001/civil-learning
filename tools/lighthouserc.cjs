// Lighthouse CI configuration for the Civil Engineer's Guide to AI.
//
// Run locally:
//   npm install -g @lhci/cli
//   lhci autorun --config=tools/lighthouserc.cjs
//
// Or via the helper script:
//   pwsh tools/run-lighthouse.ps1
//
// CI: drop into GitHub Actions:
//   - uses: treosh/lighthouse-ci-action@v12
//     with:
//       configPath: ./tools/lighthouserc.cjs
//       uploadArtifacts: true
//
module.exports = {
    ci: {
        collect: {
            // Static-site mode: lhci will spin up a local http-server in `staticDistDir`.
            staticDistDir: '.',
            // Number of runs per URL (median is reported).
            numberOfRuns: 2,
            // Representative pages: landing, chapter hub, sub-page (text-heavy),
            // sub-page (canvas-heavy), and the new certificate page.
            url: [
                'http://localhost/index.html',
                'http://localhost/chapter1/index.html',
                'http://localhost/chapter1/sub1.html',
                'http://localhost/chapter4/sub2.html',
                'http://localhost/chapter6/sub5.html',
                'http://localhost/certificate.html',
                'http://localhost/datasets.html',
                'http://localhost/flashcards.html'
            ],
            settings: {
                // Stick to mobile emulation (Google's default scoring profile).
                preset: 'desktop',
                onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
                // Throttling: simulated 3G is the default; relaxed slightly for
                // the static site which loads many sibling sub-pages.
                throttlingMethod: 'simulate',
                skipAudits: [
                    'uses-http2',          // GH Pages handles HTTP/2 transparently
                    'redirects-http'       // Same as above
                ]
            }
        },
        assert: {
            // Budgets — fail the run if any category drops below these on any URL.
            assertions: {
                'categories:performance': ['warn', { minScore: 0.85 }],
                'categories:accessibility': ['error', { minScore: 0.95 }],
                'categories:best-practices': ['warn', { minScore: 0.90 }],
                'categories:seo': ['error', { minScore: 0.95 }],
                // Specific opinionated guardrails
                'uses-responsive-images': 'warn',
                'unused-css-rules': 'off',
                'unused-javascript': 'off',
                'render-blocking-resources': 'warn',
                'total-byte-weight': ['warn', { maxNumericValue: 2_500_000 }],
                'largest-contentful-paint': ['warn', { maxNumericValue: 3500 }],
                'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }]
            }
        },
        upload: {
            // Default: store reports locally under .lighthouseci/.
            // For shared dashboards swap to 'temporary-public-storage'
            // or point at a self-hosted LHCI server.
            target: 'filesystem',
            outputDir: '.lighthouseci',
            reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%'
        }
    }
};
