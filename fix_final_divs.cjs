const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/VillageGIS.tsx', 'utf8');

const s = `        </div>
          </>
          )}`;

const r = `        </div>
          </div>
          </>
          )}`;

if (code.includes(s)) {
    code = code.replace(s, r);
    fs.writeFileSync('src/pages/admin/VillageGIS.tsx', code);
    console.log("Patched missing closing div for gap-4");
}
