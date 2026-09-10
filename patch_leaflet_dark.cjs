const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const leafletDark = `
.dark .leaflet-popup-content-wrapper,
.dark .leaflet-popup-tip {
  background-color: var(--color-white) !important;
  color: var(--color-slate-800) !important;
}
.dark .leaflet-container {
  background: var(--color-slate-100);
}
.dark .leaflet-layer,
.dark .leaflet-control-zoom-in,
.dark .leaflet-control-zoom-out,
.dark .leaflet-control-attribution {
  filter: invert(1) hue-rotate(180deg) brightness(95%) contrast(90%);
}
`;

if (!css.includes('.dark .leaflet-popup-content-wrapper')) {
  css += leafletDark;
  fs.writeFileSync('src/index.css', css);
}
console.log("Patched Leaflet dark mode styles");
