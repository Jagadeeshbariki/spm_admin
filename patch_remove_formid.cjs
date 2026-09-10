const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/CropsDashboard.tsx', 'utf8');

// For plot registration image
content = content.replace(/formId=\$\{encodeURIComponent\(plot\.plotFormId \|\| 'NF- Register'\)\}/g, '');
// Clean up any trailing &
content = content.replace(/&formId=/g, '');
content = content.replace(/&formId=\$\{encodeURIComponent\(plot\.plotFormId \|\| 'NF- Register'\)\}/g, '');
content = content.replace(/&formId=\$\{encodeURIComponent\(h\.formId \|\| 'NF- Activities'\)\}/g, '');
content = content.replace(/&formId=\$\{encodeURIComponent\(bi\.formId \|\| 'NF- Activities'\)\}/g, '');
content = content.replace(/&formId=\$\{encodeURIComponent\(ap\.formId\)\}/g, '');

fs.writeFileSync('src/pages/admin/CropsDashboard.tsx', content);
console.log("Removed formId from CropsDashboard");
