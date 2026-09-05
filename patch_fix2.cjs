const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/VillageGIS.tsx', 'utf8');

const searchBug = `        </div>
      </div>
        </>
          )}
      {previewImage && createPortal(`;

const fixBug = `        </>
          )}
        </div>
      </div>
      {previewImage && createPortal(`;

if (code.includes(searchBug)) {
    code = code.replace(searchBug, fixBug);
    fs.writeFileSync('src/pages/admin/VillageGIS.tsx', code);
    console.log("Patched missing tags ordering");
} else {
    console.log("Not found or already patched");
}
