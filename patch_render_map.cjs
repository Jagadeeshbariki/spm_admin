const fs = require('fs');

function patch() {
  const file = 'src/pages/admin/CropsDashboard.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // import the tab
  content = content.replace(
    "import { NFDashboard } from './NFDashboard';",
    "import { NFDashboard } from './NFDashboard';\nimport { CropMapTab } from './CropMapTab';"
  );
  
  // render the tab
  content = content.replace(
    "{(activeTab === 'overview' || activeTab === 'hdfc') && (",
    `{activeTab === 'map' && (
          <CropMapTab data={filteredData} />
        )}

        {(activeTab === 'overview' || activeTab === 'hdfc') && (`
  );

  fs.writeFileSync(file, content, 'utf8');
}
patch();
console.log("Successfully patched CropMapTab in CropsDashboard");
