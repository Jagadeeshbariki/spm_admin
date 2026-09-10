const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import MailTracker from '\.\/pages\/admin\/MailTracker';\n/g, '');
content = content.replace(/<Route path="mail-tracker" element=\{<MailTracker \/>\} \/>\n/g, '');

fs.writeFileSync(file, content, 'utf8');
console.log("Patched App.tsx");
