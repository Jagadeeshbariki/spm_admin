const fs = require('fs');
const file = 'src/pages/admin/IdExplorer.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'placeholder="Search Name, Aadhar, Old ID..."',
  'placeholder="Search Name, Beneficiary No, Old ID..."'
);

content = content.replace(
  'label="Aadhar Number"',
  'label="Beneficiary Number"'
);

fs.writeFileSync(file, content, 'utf8');
console.log("Patched ID Explorer");
