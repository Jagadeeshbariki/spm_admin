const fs = require('fs');

function patch() {
  const file = 'src/pages/admin/CropMapTab.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // Change color function
  const colorFuncReplacement = `const PALETTE = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#a855f7', '#14b8a6', '#f43f5e', '#eab308'];

// Color mapping for crop modes
const getCropModeColor = (mode: string) => {
  const normalized = String(mode).toLowerCase().trim();
  if (normalized.includes('cotton')) return '#f43f5e'; // rose
  if (normalized.includes('turmeric')) return '#eab308'; // yellow
  if (normalized.includes('poly')) return '#8b5cf6'; // purple
  if (normalized.includes('mono')) return '#3b82f6'; // blue
  if (normalized.includes('mixed')) return '#f97316'; // orange
  if (normalized.includes('border')) return '#10b981'; // emerald
  if (normalized === 'other' || normalized === 'unknown') return '#94a3b8'; // slate

  // deterministic hash for unknown modes
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
     hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
};`;

  // We find and replace the original `getCropColor`
  const getCropColorRegex = /\/\/ Color mapping for main crops[\s\S]*?(?=\/\/ Custom SVG marker)/;
  content = content.replace(getCropColorRegex, colorFuncReplacement + '\n\n');

  // Replace cropColors useMemo internals
  content = content.replace(
    /const crop = d\.mainCrop && d\.mainCrop !== 'Unknown' && d\.mainCrop !== '-' \? d\.mainCrop : 'Other';/g,
    "const crop = d.cropMode && d.cropMode !== 'Unknown' && d.cropMode !== '-' ? d.cropMode : 'Other';"
  );
  
  content = content.replace(
    /legend\.push\(\{ name: c, color: getCropColor\(c\) \}\);/g,
    "legend.push({ name: c, color: getCropModeColor(c) });"
  );
  
  // Replace Marker icon
  content = content.replace(
    /icon=\{createCustomIcon\(getCropColor\(plot\.mainCrop\)\)\}/g,
    "icon={createCustomIcon(getCropModeColor(plot.cropMode))}"
  );
  
  // Replace Title
  content = content.replace(
    "Crop Distribution Map",
    "Crop Model Distribution Map"
  );

  fs.writeFileSync(file, content, 'utf8');
}
patch();
console.log("Successfully patched crop map mode");
