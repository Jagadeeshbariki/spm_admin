const fs = require('fs');

function replaceInFile(file, search, replace) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(file, content);
}

replaceInFile('src/components/layout/Sidebar.tsx', /bg-\[#F5F7FA\]/g, 'bg-slate-50');
replaceInFile('src/pages/admin/CropsDashboard.tsx', /bg-\[#F5F7FA\]/g, 'bg-slate-50');
replaceInFile('src/pages/admin/Dashboard.tsx', /bg-\[#F5F7FA\]/g, 'bg-slate-50');

console.log("Fixed hardcoded colors");
