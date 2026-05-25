// Generate per-chapter Atom 1.0 feeds at chapter{N}/feed.xml.
// Each feed lists that chapter's sub-pages as entries.
//   node tools/build-feeds.js
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'chapters.json'), 'utf8'));
const base = data.site.url.replace(/\/$/, '');
const updated = new Date(data.site.defaultLastmod + 'T00:00:00Z').toISOString();

const xmlEscape = (s) =>
    String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

let total = 0;
for (const c of data.chapters) {
    const feedUrl = `${base}/chapter${c.ch}/feed.xml`;
    const chUrl = `${base}/${c.slug}`;
    const feedId = `tag:civil-learning,2026:chapter${c.ch}`;

    const entries = c.subs.map((s) => {
        const entryUrl = `${base}/chapter${c.ch}/${s.slug}`;
        const entryId = `${feedId}:${s.slug}`;
        return [
            '  <entry>',
            `    <title>${xmlEscape(s.title)}</title>`,
            `    <link rel="alternate" type="text/html" href="${xmlEscape(entryUrl)}"/>`,
            `    <id>${xmlEscape(entryId)}</id>`,
            `    <updated>${updated}</updated>`,
            `    <summary type="text">${xmlEscape(s.description)}</summary>`,
            `    <author><name>${xmlEscape(data.site.author)}</name><uri>${xmlEscape(data.site.authorUrl)}</uri></author>`,
            '  </entry>'
        ].join('\n');
    });

    const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<feed xmlns="http://www.w3.org/2005/Atom">',
        `  <title>Chapter ${c.ch}: ${xmlEscape(c.title)} \u2014 ${xmlEscape(data.site.name)}</title>`,
        `  <subtitle type="text">Updates to Chapter ${c.ch} sub-lessons.</subtitle>`,
        `  <link rel="self" type="application/atom+xml" href="${xmlEscape(feedUrl)}"/>`,
        `  <link rel="alternate" type="text/html" href="${xmlEscape(chUrl)}"/>`,
        `  <id>${xmlEscape(feedId)}</id>`,
        `  <updated>${updated}</updated>`,
        `  <author><name>${xmlEscape(data.site.author)}</name><uri>${xmlEscape(data.site.authorUrl)}</uri></author>`,
        `  <generator uri="https://github.com/" version="1.0">tools/build-feeds.js</generator>`,
        '',
        ...entries,
        '',
        '</feed>',
        ''
    ].join('\n');

    const out = path.join(ROOT, `chapter${c.ch}`, 'feed.xml');
    fs.writeFileSync(out, xml);
    total += c.subs.length;
    console.log(`Wrote chapter${c.ch}/feed.xml (${c.subs.length} entries)`);
}
console.log(`Done. ${total} total entries across 6 feeds.`);
