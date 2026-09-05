const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/VillageGIS.tsx', 'utf8');

code = code.replace(/  \)}\nfunction HubMarker/, "  );\n}\nfunction HubMarker");

fs.writeFileSync('src/pages/admin/VillageGIS.tsx', code);
