const fs = require('fs');

// 1. Update index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');
// Add favicon if missing
if (!indexHtml.includes('rel="icon"')) {
    indexHtml = indexHtml.replace('</title>', '</title>\n    <link rel="icon" type="image/jpeg" href="/WASSANIcon.jpg" />');
}
// Update splash screen and apple-touch-icon
indexHtml = indexHtml.replace(/<link rel="apple-touch-icon" href="[^"]+" \/>/g, '<link rel="apple-touch-icon" href="/WASSANIcon.jpg" />');
indexHtml = indexHtml.replace(/<img src="\/logo\.svg" alt="Logo" \/>/g, '<img src="/WASSANIcon.jpg" alt="WASSAN Logo" />');
fs.writeFileSync('index.html', indexHtml);

// 2. Update manifest.json
let manifest = fs.readFileSync('public/manifest.json', 'utf8');
manifest = manifest.replace(/"src": "\/logo.svg"/g, '"src": "/WASSANIcon.jpg"').replace(/"type": "image\/svg\+xml"/g, '"type": "image/jpeg"');
fs.writeFileSync('public/manifest.json', manifest);

// 3. Update Topbar.tsx
let topbar = fs.readFileSync('src/components/layout/Topbar.tsx', 'utf8');
const oldLogo = `<div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SW</span>
          </div>`;
const newLogo = `<img src="/WASSANIcon.jpg" alt="WASSAN" className="h-8 object-contain" />`;
topbar = topbar.replace(oldLogo, newLogo);
fs.writeFileSync('src/components/layout/Topbar.tsx', topbar);

console.log("Updated logo files");
