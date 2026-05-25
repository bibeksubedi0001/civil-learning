# Tools

Small utilities for maintaining the Civil Engineer's Guide to AI static site.

## Content build pipeline

`chapters.json` is the **single source of truth** for the site's chapter/sub-page taxonomy. Two scripts consume it to regenerate derived files:

```powershell
node tools/build-sitemap.js   # regenerates /sitemap.xml
node tools/build-feeds.js     # regenerates /chapter{N}/feed.xml (Atom 1.0)
```

`tools/bootstrap-chapters.js` (re-)derives `chapters.json` from the existing HTML (`<title>` + `<meta name="description">`). Run it after you add new sub-pages or rename existing ones, then re-run the two build scripts.

```powershell
node tools/bootstrap-chapters.js
node tools/build-sitemap.js
node tools/build-feeds.js
```

## Lighthouse CI

```powershell
pwsh tools/run-lighthouse.ps1
```

Configuration lives in [`lighthouserc.cjs`](lighthouserc.cjs). Reports drop into `.lighthouseci/`. Wire the same config into GitHub Actions via [treosh/lighthouse-ci-action](https://github.com/treosh/lighthouse-ci-action) using `configPath: ./tools/lighthouserc.cjs`.

## Other helpers

| Script                                                        | Purpose                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `_extract_classes.ps1`, `_fix_buttons.js`, `_remove_emojis.*` | One-off content sweeps.                                                              |
| `fix-mojibake.ps1`, `ftfy-fix.js`                             | Encoding repairs.                                                                    |
| `inject-*-seo.ps1`                                            | Legacy SEO injection scripts (superseded by the JSON-LD IIFE in `js/sub-common.js`). |
