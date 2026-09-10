const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const darkOverride = `
.dark {
  --color-white: #0f172a; /* slate-900 */
  --color-slate-50: #020617; /* slate-950 */
  --color-slate-100: #1e293b; /* slate-800 */
  --color-slate-200: #334155; /* slate-700 */
  --color-slate-300: #475569; /* slate-600 */
  --color-slate-400: #64748b; /* slate-500 */
  --color-slate-500: #94a3b8; /* slate-400 */
  --color-slate-600: #cbd5e1; /* slate-300 */
  --color-slate-700: #e2e8f0; /* slate-200 */
  --color-slate-800: #f1f5f9; /* slate-100 */
  --color-slate-900: #f8fafc; /* slate-50 */
  --color-slate-950: #ffffff; /* white */
  
  --color-blue-50: #172554;
  --color-blue-100: #1e3a8a;
  --color-blue-500: #3b82f6;
  --color-blue-600: #60a5fa;
  --color-blue-700: #93c5fd;
  
  --color-emerald-50: #022c22;
  --color-emerald-100: #064e3b;
  --color-emerald-500: #10b981;
  --color-emerald-600: #34d399;
  
  --color-indigo-50: #312e81;
  
  --color-amber-50: #451a03;
  --color-red-50: #450a0a;
  --color-purple-50: #3b0764;
}
`;

if (!css.includes('.dark {') && !css.includes('--color-white: #0f172a')) {
  css += darkOverride;
  fs.writeFileSync('src/index.css', css);
}
console.log("Patched index.css with dark colors");
