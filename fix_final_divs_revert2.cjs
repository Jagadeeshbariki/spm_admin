const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/VillageGIS.tsx', 'utf8');

code = code.replace("        </div>\n          </div>\n          </>\n          )}", "        </div>\n          </>\n          )}");

fs.writeFileSync('src/pages/admin/VillageGIS.tsx', code);
console.log("Reverted extra div");
