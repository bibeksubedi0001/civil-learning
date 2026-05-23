const fs = require('fs');
const path = require('path');
const glob = require('child_process').execSync;

// Get all HTML and JS files recursively
function getFiles(dir, exts) {
    let results = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) {
            results = results.concat(getFiles(full, exts));
        } else if (exts.some(e => item.name.endsWith(e))) {
            results.push(full);
        }
    }
    return results;
}

// Comprehensive emoji regex
const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0E}\u{FE0F}\u{200D}\u{25B6}\u{25C0}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{23E9}-\u{23FA}\u{231A}\u{231B}\u{2934}\u{2935}\u{203C}\u{2049}\u{2122}\u{2139}\u{2194}-\u{21AA}\u{2328}\u{23CF}\u{2714}\u{2716}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}\u{2764}\u{265F}\u{2660}\u{2663}\u{2665}\u{2666}\u{267B}\u{267E}\u{2695}-\u{2697}\u{269B}\u{269C}\u{26A0}\u{26A1}\u{26AA}\u{26AB}\u{26B0}\u{26B1}\u{26BD}\u{26BE}\u{26C4}\u{26C5}\u{26C8}\u{26CE}\u{26CF}\u{26D1}\u{26D3}\u{26D4}\u{26E9}\u{26EA}\u{26F0}-\u{26F5}\u{26F7}-\u{26FA}\u{26FD}]+/gu;

const files = getFiles('D:\\AIML', ['.html', '.js']);
let totalFiles = 0;
let totalMatches = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const matches = content.match(emojiRegex);
    if (matches && matches.length > 0) {
        totalFiles++;
        totalMatches += matches.length;
        
        // Remove emojis
        let newContent = content.replace(emojiRegex, '');
        
        // Clean up empty gradient-text spans
        newContent = newContent.replace(/<span class="gradient-text">\s*<\/span>/g, '');
        
        // Clean up empty analogy-icon divs
        newContent = newContent.replace(/<div class="analogy-icon">\s*<\/div>/g, '');
        
        // Clean up double spaces (but not in indentation)
        newContent = newContent.replace(/(\S)  +/g, '$1 ');
        
        fs.writeFileSync(file, newContent, 'utf8');
        const rel = path.relative('D:\\AIML', file);
        console.log(`${rel}: removed ${matches.length} emoji(s)`);
    }
}

console.log(`\nDone: Removed ${totalMatches} emojis from ${totalFiles} files`);
