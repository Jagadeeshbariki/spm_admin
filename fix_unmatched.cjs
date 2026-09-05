const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/NFDashboard.tsx', 'utf8');

const search = `    // Inject unmatched activities into the hierarchy so they are visible
    unmatchedActivities.forEach(act => {
      act.Link_Status = "UNMATCHED";
      const pDetails = act.Primary_details || {};
      const farmerId = pDetails.farmer_name || pDetails.farmer_select || 'Unknown';
      const year = pDetails.text_year || pDetails.year || 'Unknown Year';
      const season = pDetails.data_season || pDetails.season || 'Unknown Season';`;

const replace = `    // Inject unmatched activities into the hierarchy so they are visible
    unmatchedActivities.forEach(act => {
      act.Link_Status = "UNMATCHED";
      const pDetails = act.Primary_details || {};
      const farmerId = pDetails.farmer_name || pDetails.farmer_select || 'Unknown';
      
      let actYear = pDetails.text_year || pDetails.year || '';
      let yMatch = actYear.match(/\\b(20\\d{2})\\b/);
      if (yMatch) {
         actYear = yMatch[1];
      } else if (pDetails.date || act.crop_activity) {
         const d = pDetails.date || act.crop_activity;
         if (d) actYear = d.substring(0, 4);
      }
      const year = actYear || 'Unknown Year';
      const season = pDetails.data_season || pDetails.season || 'Unknown Season';`;

if (code.includes(search)) {
   code = code.replace(search, replace);
   fs.writeFileSync('src/pages/admin/NFDashboard.tsx', code);
   console.log("Patched unmatched");
} else {
   console.log("Not found");
}
