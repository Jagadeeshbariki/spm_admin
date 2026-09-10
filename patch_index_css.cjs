const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

if (!css.includes('custom-variant dark')) {
  css = css.replace('@theme {', '@custom-variant dark (&:where(.dark, .dark *));\n\n@theme {');
  fs.writeFileSync('src/index.css', css);
}
console.log("Patched index.css");
