const fs = require('fs');

function patchCrops() {
  const file = 'src/pages/admin/CropsDashboard.tsx';
  let content = fs.readFileSync(file, 'utf8');
  
  // 1. Add activityCount to mappedData
  content = content.replace(
    "raw: flat,",
    "raw: flat,\n            activityCount: matchedActivities.length,"
  );
  
  // 2. Change the filter logic
  content = content.replace(
    "if (hasActivities === 'Yes') {\n        if (item.bioInputs.length === 0 && item.harvests.length === 0) return false;\n      } else if (hasActivities === 'No') {\n        if (item.bioInputs.length > 0 || item.harvests.length > 0) return false;\n      }",
    "if (hasActivities === 'Yes') {\n        if (item.activityCount === 0) return false;\n      } else if (hasActivities === 'No') {\n        if (item.activityCount > 0) return false;\n      }"
  );
  
  fs.writeFileSync(file, content, 'utf8');
}

patchCrops();
console.log("Successfully patched filter logic");
