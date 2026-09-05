const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/VillageGIS.tsx', 'utf8');

// The createPortal should end with:
//         document.body
//       )}

// But it became:
//         document.body
//       );
// }

code = code.replace(`        document.body\n      );\n}`, `        document.body\n      )}`);

// And the end of component became:
//     </div>
//   );
// }
// Which is correct!

fs.writeFileSync('src/pages/admin/VillageGIS.tsx', code);
