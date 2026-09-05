const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/VillageGIS.tsx', 'utf8');

const search = `        {activeSubTab === 'utilization' ? (
           <UtilizationDashboard microEnterprises={microEnterprises} />
        ) : (
           <div className="flex flex-col gap-4">
          {/* Filters */}`;

const replace = `        {activeSubTab === 'utilization' ? (
           <UtilizationDashboard microEnterprises={microEnterprises} />
        ) : (
           <>
             <div className="flex flex-col gap-4">
          {/* Filters */}`;

if (code.includes(search)) {
    code = code.replace(search, replace);
    
    // Also we need to close `<div className="flex flex-col gap-4">`? No, wait!
    // The `<div className="flex flex-col gap-4">` was closed at line 328!
    // So if I just change `) : ( <div className="flex flex-col gap-4">` to `) : ( <> <div className="flex flex-col gap-4">`, it will work because `<>` remains open!
    fs.writeFileSync('src/pages/admin/VillageGIS.tsx', code);
    console.log("Patched final syntax error");
} else {
    console.log("Not found");
}

const searchEnd = `        </div>
          )}
        </div>
      </div>
      {previewImage && createPortal(`;
const replaceEnd = `        </div>
          )}
        </div>
      </div>
      {previewImage && createPortal(`;

// Actually the end was:
//           )}
//         </div>
//       </div>
// We need the `</>` before `)}`
const endSearch2 = `        </div>
          )}
        </div>
      </div>
      {previewImage`;
const endReplace2 = `        </div>
          </>
          )}
        </div>
      </div>
      {previewImage`;
if(code.includes(endSearch2)){
    code = code.replace(endSearch2, endReplace2);
    fs.writeFileSync('src/pages/admin/VillageGIS.tsx', code);
    console.log("Patched end again for fragment");
}

