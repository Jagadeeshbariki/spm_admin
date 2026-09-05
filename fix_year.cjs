const fs = require('fs');

function patchCrops() {
  const file = 'src/pages/admin/CropsDashboard.tsx';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    "const yearOnly = String(flat['plot_reg-year_only'] || flat['plot_reg-year'] || flat['year'] || '').trim();",
    "const yearRaw = String(flat['plot_reg-year_only'] || flat['plot_reg-year'] || flat['year'] || '').trim();\n          const yearOnly = yearRaw.length >= 4 ? yearRaw.substring(0, 4) : yearRaw;"
  );
  fs.writeFileSync(file, content, 'utf8');
}

function patchNF() {
  const file = 'src/pages/admin/NFDashboard.tsx';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    "const yearOnly = String(flatReg['plot_reg-year_only'] || flatReg['plot_reg-year'] || flatReg['year'] || '').trim();",
    "const yearRaw = String(flatReg['plot_reg-year_only'] || flatReg['plot_reg-year'] || flatReg['year'] || '').trim();\n      const yearOnly = yearRaw.length >= 4 ? yearRaw.substring(0, 4) : yearRaw;"
  );
  fs.writeFileSync(file, content, 'utf8');
}

function patchVal() {
  const file = 'src/pages/admin/NFValidationPage.tsx';
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    "const year = String(flat['plot_reg-year_only'] || flat['plot_reg-year'] || flat['year'] || '').trim();",
    "const yearRaw = String(flat['plot_reg-year_only'] || flat['plot_reg-year'] || flat['year'] || '').trim();\n          const year = yearRaw.length >= 4 ? yearRaw.substring(0, 4) : yearRaw;"
  );
  fs.writeFileSync(file, content, 'utf8');
}

patchCrops();
patchNF();
patchVal();
console.log("Successfully patched year extraction");
