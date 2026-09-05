const fs = require('fs');

function patchPhotos() {
  const file = 'src/pages/admin/CropsDashboard.tsx';
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(
    /formId: 'NF- Activities'\s*\}\)\)\);/g,
    "formId: 'NF- Activities',\n                submissionId: act.__id || parentKey.replace('uuid:', '') \n              })));"
  );
  
  fs.writeFileSync(file, content, 'utf8');
}

patchPhotos();
console.log("Successfully patched photos logic");
