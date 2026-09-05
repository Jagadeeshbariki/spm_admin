const fs = require('fs');

function fixSets() {
  const file = 'src/pages/admin/CropsDashboard.tsx';
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(
    /if \(!clusterFarmers\[cluster\]\) \{\s*clusterFarmers\[cluster\] = new Set<string>\(\);\s*\}\s*clusterFarmers\[cluster\]\.add\(farmerId\);/g,
    "if (!clusterFarmers[cluster]) {\n          clusterFarmers[cluster] = new Set<string>();\n        }\n        if (farmerId) clusterFarmers[cluster].add(farmerId);"
  );
  
  content = content.replace(
    /if \(!mainCropFarmers\[mainCrop\]\) \{\s*mainCropFarmers\[mainCrop\] = new Set<string>\(\);\s*\}\s*mainCropFarmers\[mainCrop\]\.add\(farmerId\);/g,
    "if (!mainCropFarmers[mainCrop]) {\n          mainCropFarmers[mainCrop] = new Set<string>();\n        }\n        if (farmerId) mainCropFarmers[mainCrop].add(farmerId);"
  );

  fs.writeFileSync(file, content, 'utf8');
}
fixSets();
console.log("Successfully fixed Set inserts");
