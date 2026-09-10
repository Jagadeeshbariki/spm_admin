const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const rechartsDark = `
.dark .recharts-default-tooltip {
  background-color: var(--color-slate-100) !important;
  border-color: var(--color-slate-200) !important;
  color: var(--color-slate-800) !important;
}
.dark .recharts-tooltip-item {
  color: var(--color-slate-800) !important;
}
`;

if (!css.includes('.dark .recharts-default-tooltip')) {
  css += rechartsDark;
  fs.writeFileSync('src/index.css', css);
}
console.log("Patched Recharts dark mode styles");
