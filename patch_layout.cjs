const fs = require('fs');

function patch() {
  const file = 'src/pages/admin/CropsDashboard.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // Make sure the main container has max-w-full and overflow-x-hidden
  content = content.replace(
    '<div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">',
    '<div className="p-4 md:p-8 max-w-[100vw] lg:max-w-7xl mx-auto space-y-6 overflow-x-hidden">'
  );
  
  // Make sure the filters row can wrap or scroll
  content = content.replace(
    '<div className="flex flex-wrap items-center gap-3 w-full">',
    '<div className="flex flex-row md:flex-wrap items-center gap-3 w-full overflow-x-auto pb-2 scrollbar-hide">'
  );

  // We should also look at NFDashboard which is a nested component, it might have layout issues
  fs.writeFileSync(file, content, 'utf8');
}
patch();
console.log("Successfully patched CropsDashboard layout");
