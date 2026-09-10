const fs = require('fs');
const file = 'src/components/layout/Topbar.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `    { 
      name: 'Mail Tracker', 
      path: '/admin/mail-tracker',
      roles: ['Admin', 'office admin']
    },`;

content = content.replace(replacement, '');

fs.writeFileSync(file, content, 'utf8');
console.log("Patched Topbar");
