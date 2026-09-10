const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/CropsDashboard.tsx', 'utf8');

const patterns = [
  {
    regex: /\/api\/odk\/image\?v=4&submissionId=\$\{encodeURIComponent\(([^)]+)\)\}&filename=\$\{encodeURIComponent\(([^)]+)\)\}&?/g,
    replace: '/api/odk/image?v=4&submissionId=${encodeURIComponent($1)}&filename=${encodeURIComponent($2)}'
  },
  {
    regex: /\/api\/odk\/image\?v=4&submissionId=\$\{encodeURIComponent\(([^)]+)\)\}&filename=\$\{encodeURIComponent\(([^)]+)\)\}\$\{encodeURIComponent\(([^)]+)\)\}/g,
    replace: '/api/odk/image?v=4&submissionId=${encodeURIComponent($1)}&filename=${encodeURIComponent($2)}'
  }
];

patterns.forEach(p => {
  content = content.replace(p.regex, p.replace);
});

fs.writeFileSync('src/pages/admin/CropsDashboard.tsx', content);
console.log("Cleaned image URLs in CropsDashboard");
