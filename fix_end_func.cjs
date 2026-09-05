const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/VillageGIS.tsx', 'utf8');

const s = `      )}
    </div>
  )}
function HubMarker`;

const r = `      )}
    </div>
  );
}
function HubMarker`;

if (code.includes(s)) {
    code = code.replace(s, r);
    fs.writeFileSync('src/pages/admin/VillageGIS.tsx', code);
    console.log("Patched function end");
}
