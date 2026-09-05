const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/CropsDashboard.tsx', 'utf8');

const search = `          const regYear = String(flat['year'] || flat['text_year'] || flat['year_only'] || '').trim().toLowerCase();
          
          const matchedActivities = activities.filter((act: any) => {
            const pDetails = act.Primary_details || {};
            // In NF Activities, "farmer_name" holds the farmer_Id according to the user's requirement.
            const actFarmerId = String(pDetails.farmer_name || '').trim().toLowerCase();
            const actSeason = String(pDetails.season || pDetails.data_season || '').trim().toLowerCase();
            const actYear = String(pDetails.year || pDetails.text_year || '').trim().toLowerCase();
            
            // NF Register farmer_Id (hhId)
            const regFarmerId = String(hhId).trim().toLowerCase();
            
            const isFarmerMatch = actFarmerId && regFarmerId && actFarmerId === regFarmerId;
            const isSeasonMatch = actSeason === String(season).trim().toLowerCase();
            
            // For year, often it comes as "2026-01-01" or "2026", so we match substring or exact
            const isYearMatch = (regYear && actYear && (actYear.includes(regYear) || regYear.includes(actYear))) || (!regYear && !actYear);
            
            return isFarmerMatch && isSeasonMatch && isYearMatch;
          });`;

const replace = `          let rawRegYear = String(flat['year'] || flat['text_year'] || flat['year_only'] || '').trim();
          let yMatchReg = rawRegYear.match(/\\b(20\\d{2})\\b/);
          const regYear = yMatchReg ? yMatchReg[1] : rawRegYear.toLowerCase();
          
          const matchedActivities = activities.filter((act: any) => {
            const pDetails = act.Primary_details || {};
            // In NF Activities, "farmer_name" holds the farmer_Id according to the user's requirement.
            const actFarmerId = String(pDetails.farmer_name || '').trim().toLowerCase();
            const actSeason = String(pDetails.season || pDetails.data_season || '').trim().toLowerCase();
            
            let rawActYear = String(pDetails.year || pDetails.text_year || '').trim();
            let yMatchAct = rawActYear.match(/\\b(20\\d{2})\\b/);
            const actYear = yMatchAct ? yMatchAct[1] : rawActYear.toLowerCase();
            
            // NF Register farmer_Id (hhId)
            const regFarmerId = String(hhId).trim().toLowerCase();
            
            const isFarmerMatch = actFarmerId && regFarmerId && actFarmerId === regFarmerId;
            const isSeasonMatch = actSeason === String(season).trim().toLowerCase();
            
            const isYearMatch = (regYear === actYear) || (!regYear && !actYear);
            
            return isFarmerMatch && isSeasonMatch && isYearMatch;
          });`;

if (code.includes(search)) {
   code = code.replace(search, replace);
   fs.writeFileSync('src/pages/admin/CropsDashboard.tsx', code);
   console.log("Patched successfully");
} else {
   console.log("Search string not found!");
}
