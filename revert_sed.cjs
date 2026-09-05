const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/VillageGIS.tsx', 'utf8');

// The original replacement was: code.replace(/  )}/g, "  );\n}")
// So I should replace: "  );\n}" back to "  )}"
code = code.split('  );\n}').join('  )}');

fs.writeFileSync('src/pages/admin/VillageGIS.tsx', code);
console.log("Reverted sed replacement");
