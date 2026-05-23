# The Civil Engineer's Guide to AI

A comprehensive, interactive masterclass that teaches Artificial Intelligence and Machine Learning through the lens of civil engineering — from topographic contours to neural networks.

**Live site:** https://civil-learning.bibeksubedi0001.com.np/

## What's Inside

- **6 chapters** covering AI fundamentals, supervised learning, unsupervised learning, CNNs, deep learning, and LLMs.
- **62+ sub-chapters** with detailed explanations, math, and real-world civil engineering applications.
- **120+ interactive demos** built on `<canvas>` (no heavy framework dependencies).
- **240+ quiz questions** with immediate feedback and explanations.
- Dark/light theme, KaTeX math rendering, fully responsive design.

## Project Structure

```
.
├── index.html              # Landing page (table of contents)
├── chapter1.html           # Legacy single-page chapter overview
├── chapter1/               # New per-chapter folder with sub-chapters
│   ├── index.html          # Chapter hub
│   ├── sub1.html ...       # Individual lessons
│   └── js/                 # Chapter-specific demos
├── css/                    # Shared styles (theme, chapters, base)
├── js/                     # Shared scripts (theme, sub-common helpers)
├── tools/                  # One-off maintenance scripts (not shipped)
├── sitemap.xml             # SEO sitemap
├── robots.txt              # Crawler rules
├── 404.html                # Custom not-found page
└── manifest.webmanifest    # PWA manifest
```

## Local Development

It is a static site — no build step is required. Just open `index.html` in a browser, or serve the folder:

```powershell
# Python 3
python -m http.server 8000

# Node (any static server)
npx serve .
```

Then visit http://localhost:8000.

## Hosting

Deployed via GitHub Pages on a custom domain (`CNAME`). Pushing to `main` is sufficient.

## Conventions

- Pages are plain HTML — no framework, no bundler.
- Shared utilities live in `js/sub-common.js` and are auto-loaded by every sub-chapter page.
- New sub-chapters should include `<script src="../js/sub-common.js"></script>` to get math rendering, prev/next navigation, breadcrumbs, reading-time, code-copy, and quiz score persistence "for free".
- Keep `<title>`, `<meta name="description">`, `<link rel="canonical">`, and Open Graph tags unique per page.

## License

MIT — see [LICENSE](LICENSE).

## Author

[Bibek Subedi](https://bibeksubedi0001.com.np)
