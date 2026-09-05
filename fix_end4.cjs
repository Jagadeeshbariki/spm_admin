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
    console.log("Patched component end");
} else {
    // maybe there's no newline before function HubMarker?
    const s2 = `      )}
    </div>
  )}
function HubMarker`;
    if (code.includes(s2)) {
         code = code.replace(s2, r);
         fs.writeFileSync('src/pages/admin/VillageGIS.tsx', code);
         console.log("Patched component end (2)");
    } else {
         console.log("Not found!");
    }
}
