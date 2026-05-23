const fs = require('fs');
const file = 'D:\\AIML\\chapter6\\js\\geo-demos.js';
let c = fs.readFileSync(file, 'utf8');

const replacements = [
    [/' Train 1 Epoch'/g, "'<i class=\"fa-solid fa-play\"></i> Train 1 Epoch'"],
    [/' Train 50 Epochs'/g, "'<i class=\"fa-solid fa-forward\"></i> Train 50 Epochs'"],
    [/' Forward Pass'/g, "'<i class=\"fa-solid fa-play\"></i> Forward Pass'"],
    [/' New Mix Design'/g, "'<i class=\"fa-solid fa-shuffle\"></i> New Mix Design'"],
    [/' Gradient Step'/g, "'<i class=\"fa-solid fa-shoe-prints\"></i> Gradient Step'"],
    [/' Optimize 50x'/g, "'<i class=\"fa-solid fa-forward\"></i> Optimize 50x'"],
    [/' Start Descent'/g, "'<i class=\"fa-solid fa-play\"></i> Start Descent'"],
    [/' Run Backprop'/g, "'<i class=\"fa-solid fa-play\"></i> Run Backprop'"],
    [/' Animate Dropout'/g, "'<i class=\"fa-solid fa-play\"></i> Animate Dropout'"],
    [/' Single Drop'/g, "'<i class=\"fa-solid fa-droplet\"></i> Single Drop'"],
    [/' Single Step'/g, "'<i class=\"fa-solid fa-shoe-prints\"></i> Single Step'"],
    [/' Race!'/g, "'<i class=\"fa-solid fa-bolt\"></i> Race!'"],
    [/' 10 Epochs'/g, "'<i class=\"fa-solid fa-forward\"></i> 10 Epochs'"],
    [/' Train'/g, "'<i class=\"fa-solid fa-play\"></i> Train'"],
    [/' Pause'/g, "'<i class=\"fa-solid fa-pause\"></i> Pause'"],
    [/' Reset'/g, "'<i class=\"fa-solid fa-rotate\"></i> Reset'"],
];

let count = 0;
replacements.forEach(([pattern, replacement]) => {
    const before = c;
    c = c.replace(pattern, replacement);
    if (c !== before) {
        count++;
        console.log('Replaced: ' + pattern);
    }
});

fs.writeFileSync(file, c, 'utf8');
console.log(`\nDone: ${count} patterns replaced`);
