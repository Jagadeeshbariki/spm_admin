const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/VillageGIS.tsx', 'utf8');

// 1. Fix the extra div before previewImage
const extraDivSearch = `        </div>
          </>
          )}
        </div>
      </div>
      {previewImage && createPortal(`;
const extraDivReplace = `        </div>
          </>
          )}
        </div>
      {previewImage && createPortal(`;

code = code.replace(extraDivSearch, extraDivReplace);

// 2. Fix the end of the component
const endSearch = `      )}
    </div>
  )}
function HubMarker`;
const endReplace = `      )}
    </div>
  );
}
function HubMarker`;

code = code.replace(endSearch, endReplace);

fs.writeFileSync('src/pages/admin/VillageGIS.tsx', code);
console.log("Fixed all!");
