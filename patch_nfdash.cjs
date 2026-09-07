const fs = require('fs');

function patch() {
  const file = 'src/pages/admin/NFDashboard.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // Let's add min-w-0 to all flex-1 containers in NFDashboard to prevent recharts from blowing up width
  content = content.replace(/className="flex-1"/g, 'className="flex-1 min-w-0"');
  content = content.replace(/className="flex-1 relative"/g, 'className="flex-1 min-w-0 relative"');
  
  // also min-w-0 on absolute inset-0 just in case
  content = content.replace(/className="absolute inset-0"/g, 'className="absolute inset-0 min-w-0"');

  fs.writeFileSync(file, content, 'utf8');
}
patch();
console.log("Successfully patched NFDashboard");
