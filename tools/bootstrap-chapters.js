// Bootstrap: generate tools/chapters.json (the SoT) from the existing HTML files.
// Run this ONCE to seed the SoT; afterward, edit chapters.json by hand and run
// build-sitemap.js / build-feeds.js to regenerate derived files.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SUB_COUNTS = { 1: 12, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10 };

const CHAPTER_TITLES = {
    1: 'AI vs Machine Learning',
    2: 'Supervised Learning',
    3: 'Unsupervised Learning',
    4: 'Computer Vision & CNNs',
    5: 'Sequence Models, Transformers & LLMs',
    6: 'Neural Networks & Deep Learning'
};

function decode(s) {
    if (!s) return '';
    return s
        .replace(/&amp;/g, '&')
        .replace(/&mdash;/g, '\u2014')
        .replace(/&ndash;/g, '\u2013')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();
}

function stripSuffix(title) {
    return title.replace(/\s*\|\s*Civil Engineer'?s Guide to AI\s*$/i, '').trim();
}

function extract(file) {
    const c = fs.readFileSync(file, 'utf8');
    const tm = c.match(/<title>([\s\S]*?)<\/title>/i);
    const dm = c.match(/<meta\s+name="description"\s+content="([\s\S]*?)"/i);
    return {
        title: tm ? stripSuffix(decode(tm[1])) : '',
        desc: dm ? decode(dm[1]) : ''
    };
}

const chapters = [];
for (let ch = 1; ch <= 6; ch++) {
    const subs = [];
    const count = SUB_COUNTS[ch];
    for (let s = 1; s <= count; s++) {
        const file = path.join(ROOT, `chapter${ch}`, `sub${s}.html`);
        if (!fs.existsSync(file)) continue;
        const meta = extract(file);
        subs.push({ sub: s, slug: `sub${s}.html`, title: meta.title, description: meta.desc });
    }
    chapters.push({ ch, title: CHAPTER_TITLES[ch], slug: `chapter${ch}/`, subs });
}

const out = {
    site: {
        url: 'https://civil-learning.bibeksubedi0001.com.np',
        name: "Civil Engineer's Guide to AI",
        author: 'Bibek Subedi',
        authorUrl: 'https://bibeksubedi0001.com.np',
        defaultLastmod: new Date().toISOString().slice(0, 10)
    },
    topLevel: [
        { url: '/', priority: 1.0, changefreq: 'weekly', title: "The Civil Engineer's Guide to AI" },
        { url: '/flashcards.html', priority: 0.6, changefreq: 'monthly', title: 'Flashcards' },
        { url: '/playground.html', priority: 0.6, changefreq: 'monthly', title: 'Python Playground' },
        { url: '/calculators.html', priority: 0.6, changefreq: 'monthly', title: 'Engineering Calculators' },
        { url: '/lab.html', priority: 0.6, changefreq: 'monthly', title: 'AI Lab' },
        { url: '/datasets.html', priority: 0.6, changefreq: 'monthly', title: 'Datasets' },
        { url: '/certificate.html', priority: 0.5, changefreq: 'monthly', title: 'Certificate of Completion' }
    ],
    chapters
};

fs.writeFileSync(path.join(__dirname, 'chapters.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`Wrote tools/chapters.json (${chapters.length} chapters, ${chapters.reduce((n, c) => n + c.subs.length, 0)} sub-pages)`);
