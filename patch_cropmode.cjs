const fs = require('fs');

function patch() {
  const file = 'src/pages/admin/CropsDashboard.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // Replace cropMode mapping
  content = content.replace(
    "cropMode: flat['crop_mode'] || flat['crop_model'] || flat['plot_reg_crop_model'] || flat['plot_reg-crop_model'] || '',",
    `cropMode: (() => {
              const m = flat['crop_mode'] || flat['crop_model'] || flat['plot_reg_crop_model'] || flat['plot_reg-crop_model'] || '';
              return (m && m.toLowerCase() !== 'unknown') ? m : 'Other';
            })(),`
  );
  
  // Replace references of 'Unknown' to 'Other' in the display fallbacks as well
  content = content.replace(
    /plot.cropMode \|\| 'Unknown'/g,
    "plot.cropMode || 'Other'"
  );
  content = content.replace(
    /row.cropMode \|\| 'Unknown'/g,
    "row.cropMode || 'Other'"
  );
  content = content.replace(
    /item.cropMode \|\| 'Unknown'/g,
    "item.cropMode || 'Other'"
  );

  fs.writeFileSync(file, content, 'utf8');
}
patch();
console.log("Successfully patched cropMode");
