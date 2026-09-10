const fs = require('fs');

function replaceInFile(file, search, replace) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(search, replace);
  fs.writeFileSync(file, content);
}

replaceInFile('src/pages/admin/NFValidationPage.tsx', /bg-\[#F8FAFC\]/g, 'bg-slate-50');
replaceInFile('src/pages/admin/CropsDashboard.tsx', /bg-\[#F8FAFC\]/g, 'bg-slate-50');
replaceInFile('src/pages/admin/TeamTravel.tsx', /bg-\[#fcfdfe\]/g, 'bg-slate-50');
replaceInFile('src/pages/admin/TeamTravel.tsx', /bg-\[#FBFDFF\]/g, 'bg-slate-50');
replaceInFile('src/pages/admin/TeamTravel.tsx', /text-\[#111827\]/g, 'text-slate-900');

console.log("Fixed more hardcoded colors");
