const fs = require('fs');

function patch() {
  const file = 'src/pages/admin/CropsDashboard.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // Add coordinates to mapped object
  content = content.replace(
    "plotPhoto: flat['plot_reg_image'] || flat['image'] || flat['photo'],",
    `plotPhoto: flat['plot_reg_image'] || flat['image'] || flat['photo'],
            coordinates: sub.plot_reg?.plot_gps?.coordinates || sub.plot_gps?.coordinates || sub.gps?.coordinates || null,`
  );

  fs.writeFileSync(file, content, 'utf8');
}
patch();
console.log("Successfully patched gps extraction");
