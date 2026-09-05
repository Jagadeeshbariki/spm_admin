const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/VillageGIS.tsx', 'utf8');

const searchBug = `      {previewImage && createPortal(`;
const fixBug = `        </>
          )}
      {previewImage && createPortal(`;

if (code.includes(searchBug) && !code.includes("</>\n          )}\n      {previewImage")) {
    code = code.replace(searchBug, fixBug);
    fs.writeFileSync('src/pages/admin/VillageGIS.tsx', code);
    console.log("Patched missing tags");
} else {
    console.log("Not found or already patched");
}
