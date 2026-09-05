const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/VillageGIS.tsx', 'utf8');

// The faulty structure currently looks like:
//           </div>
//           {activeSubTab === 'utilization' ? (
//              <UtilizationDashboard microEnterprises={microEnterprises} />
//           ) : (
//              <>
//           {/* Filters */}

const search = `          </div>
          {activeSubTab === 'utilization' ? (
             <UtilizationDashboard microEnterprises={microEnterprises} />
          ) : (
             <>
          {/* Filters */}`;

const replace = `          </div>
        </div>
        
        {activeSubTab === 'utilization' ? (
           <UtilizationDashboard microEnterprises={microEnterprises} />
        ) : (
           <div className="flex flex-col gap-4">
          {/* Filters */}`;

if (code.includes(search)) {
    code = code.replace(search, replace);
    fs.writeFileSync('src/pages/admin/VillageGIS.tsx', code);
    console.log("Patched start of condition");
} else {
    console.log("Start not found");
}

const searchEnd = `        </>
          )}
        </div>
      </div>
      {previewImage && createPortal(`;

const replaceEnd = `        </div>
          )}
      </div>
      {previewImage && createPortal(`;
      
if (code.includes(searchEnd)) {
    code = code.replace(searchEnd, replaceEnd);
    fs.writeFileSync('src/pages/admin/VillageGIS.tsx', code);
    console.log("Patched end of condition");
} else {
    console.log("End not found");
}

// Wait! If I changed `<>` to `<div className="flex flex-col gap-4">`, it needs a `</div>` instead of `</>`.
// Wait, at line 328, there is a `</div>`.
// Does it close the `<div className="flex flex-col gap-4">` I just added?
// Let's remove the `</div>` at line 328 so it stays open for the charts and list.
// Or wait, if line 328 `</div>` closes the `flex flex-col gap-4`, then the charts and list are OUTSIDE of it!
