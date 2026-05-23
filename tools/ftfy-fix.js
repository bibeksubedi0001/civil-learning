#!/usr/bin/env node
/**
 * Mojibake repair via precomputed lookup.
 *
 * For each Unicode codepoint in a useful range we compute its UTF-8 byte
 * sequence and then "decode" those bytes as Windows-1252 to obtain the
 * mojibake string. We then build a single regex that matches any of those
 * mojibake strings (longest first) and replace with the original character.
 */
const fs = require('fs');
const path = require('path');
let iconv; try { iconv = require('iconv-lite'); }
catch { console.error('Install iconv-lite first'); process.exit(1); }

const root = path.resolve(__dirname, '..');

function walk(dir, out = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, out);
        else if (/\.html?$/i.test(entry.name) && !/\.bak$/i.test(entry.name)) out.push(full);
    }
    return out;
}

// Build mojibake -> original map for codepoints likely to appear.
const map = new Map();
function addRange(lo, hi) {
    for (let cp = lo; cp <= hi; cp++) {
        const ch = String.fromCodePoint(cp);
        const utf8 = Buffer.from(ch, 'utf-8');
        // Mojibake form: those bytes decoded as cp1252.
        const mojibake = iconv.decode(utf8, 'win1252');
        // Skip degenerate (1-byte) and any where the cp1252 round-trip lost data.
        if (mojibake.length < 2) continue;
        const reback = iconv.encode(mojibake, 'win1252');
        if (Buffer.compare(reback, utf8) !== 0) continue;
        // Avoid false matches: skip mojibake strings that contain ASCII letters/digits.
        if (/[A-Za-z0-9]/.test(mojibake)) continue;
        // Prefer existing entry only if longer.
        if (!map.has(mojibake)) map.set(mojibake, ch);
    }
}

addRange(0x00A0, 0x017F);   // Latin-1 supp + Latin Ext-A (é, ñ, ², °, ±, Œ, etc.)
addRange(0x0180, 0x024F);   // Latin Ext-B
addRange(0x0250, 0x02FF);   // IPA / spacing modifier (σ used in math)
addRange(0x0370, 0x03FF);   // Greek (σ, α, β, etc.)
addRange(0x2010, 0x203F);   // dashes, quotes, ellipsis
addRange(0x2070, 0x209F);   // super/subscripts
addRange(0x20A0, 0x20CF);   // currency
addRange(0x2100, 0x214F);   // letterlike symbols (™, ℃)
addRange(0x2150, 0x218F);   // number forms
addRange(0x2190, 0x21FF);   // arrows (←, →, ↑, ↓)
addRange(0x2200, 0x22FF);   // math operators (≈, ≠, ≤, ≥, −, ∑, ∂)
addRange(0x2500, 0x257F);   // box drawing (─)
addRange(0x2600, 0x26FF);   // misc symbols (☆, ✓)
addRange(0x2700, 0x27BF);   // dingbats (✓, ✗)

// Build a single regex with longest mojibake strings first.
const keys = [...map.keys()].sort((a, b) => b.length - a.length);
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const re = new RegExp(keys.map(escape).join('|'), 'g');

function repair(text) {
    return text.replace(re, m => map.get(m));
}

const args = process.argv.slice(2);
const files = args.length
    ? args.map(a => path.resolve(a))
    : walk(root);

let fixed = 0;
for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const buf = fs.readFileSync(f);
    const hadBom = buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
    const text = buf.slice(hadBom ? 3 : 0).toString('utf-8');
    const repaired = repair(text);
    if (repaired !== text || hadBom) {
        fs.writeFileSync(f, repaired, { encoding: 'utf-8' });
        const tag = repaired !== text ? (hadBom ? 'mojibake+BOM' : 'mojibake') : 'BOM';
        console.log(`Fixed [${tag}]: ${path.relative(root, f)}`);
        fixed++;
    }
}
console.log(`\nMap entries: ${map.size}`);
console.log(`Files repaired: ${fixed}`);
