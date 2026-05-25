// Regenerate sitemap.xml from tools/chapters.json (single source of truth).
//   node tools/build-sitemap.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'chapters.json'), 'utf8'));
const base = data.site.url.replace(/\/$/, '');
const today = data.site.defaultLastmod;

const xmlEscape = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const urlNode = (loc, prio, freq, lastmod) =>
    `  <url><loc>${xmlEscape(loc)}</loc><priority>${prio.toFixed(1)}</priority><changefreq>${freq}</changefreq><lastmod>${lastmod}</lastmod></url>`;

const lines = [];
lines.push('<?xml version="1.0" encoding="UTF-8"?>');
lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');

// Top-level pages
for (const t of data.topLevel) {
    const loc = t.url === '/' ? `${base}/` : `${base}${t.url}`;
    lines.push(urlNode(loc, t.priority, t.changefreq, today));
}
lines.push('');

// Chapters + subs
for (const c of data.chapters) {
    lines.push(`  <!-- Chapter ${c.ch}: ${c.title} -->`);
    lines.push(urlNode(`${base}/${c.slug}`, 0.9, 'monthly', today));
    for (const s of c.subs) {
        lines.push(urlNode(`${base}/chapter${c.ch}/${s.slug}`, 0.7, 'monthly', today));
    }
    // Per-chapter feed
    lines.push(urlNode(`${base}/chapter${c.ch}/feed.xml`, 0.4, 'weekly', today));
    lines.push('');
}

lines.push('</urlset>');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), lines.join('\n') + '\n');
console.log(`Wrote sitemap.xml (${data.topLevel.length} top-level + 6 chapters + ${data.chapters.reduce((n, c) => n + c.subs.length, 0)} subs + 6 feeds)`);
