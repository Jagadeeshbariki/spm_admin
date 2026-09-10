const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/CropsDashboard.tsx', 'utf8');

content = content.replace(
  "plotPhoto: flat['plot_reg_image'] || flat['image'] || flat['photo'],",
  "plotPhoto: flat['plot_reg_image'] || flat['plot_reg-image'] || flat['image'] || flat['photo'],"
);

content = content.replace(
  "const actPhoto = act.gps?.photo || flatAct['gps_photo'] || flatAct['photo'] || act.photo;",
  "const actPhoto = act.gps?.photo || flatAct['gps_photo'] || flatAct['gps-photo'] || flatAct['photo'] || act.photo;"
);

fs.writeFileSync('src/pages/admin/CropsDashboard.tsx', content);
console.log("Patched photo fields");
