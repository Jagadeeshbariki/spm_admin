const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/NFDashboard.tsx', 'utf8');

const searchRegExtractor = `      const farmerId = flatReg['plot_reg-farmer_Id'] || flatReg['plot_reg_farmer_Id'] || flatReg['farmer_Id'] || flatReg['HH_id'] || flatReg['hhid'] || '';
      const year = flatReg['plot_reg-year'] || flatReg['plot_reg-year_only'] || flatReg['year'] || '';
      const season = flatReg['plot_reg-season'] || flatReg['season'] || '';`;

const replaceRegExtractor = `      const farmerId = flatReg['plot_reg-farmer_Id'] || flatReg['plot_reg_farmer_Id'] || flatReg['farmer_Id'] || flatReg['HH_id'] || flatReg['hhid'] || '';
      let yearStr = flatReg['plot_reg-year'] || flatReg['plot_reg-year_only'] || flatReg['year'] || '';
      let yMatch = yearStr.match(/\\b(20\\d{2})\\b/);
      const year = yMatch ? yMatch[1] : yearStr;
      const season = flatReg['plot_reg-season'] || flatReg['season'] || '';`;

code = code.replace(searchRegExtractor, replaceRegExtractor);

const searchActExtractor = `    const processedActivities = activities.map(act => {
      const pDetails = act.Primary_details || {};
      const farmerName = pDetails.farmer_name || pDetails.farmer_select || '';
      const year = pDetails.text_year || pDetails.year || '';
      const season = pDetails.data_season || pDetails.season || '';
      
      const registration_id = createRegistrationId(farmerName, year, season);
      return { ...act, registration_id };
    });`;

const replaceActExtractor = `    const processedActivities = activities.map(act => {
      const pDetails = act.Primary_details || {};
      const farmerName = pDetails.farmer_name || pDetails.farmer_select || '';
      let actYear = pDetails.text_year || pDetails.year || '';
      let yMatch = actYear.match(/\\b(20\\d{2})\\b/);
      if (yMatch) {
         actYear = yMatch[1];
      } else if (pDetails.date || act.crop_activity) {
         const d = pDetails.date || act.crop_activity;
         if (d) actYear = d.substring(0, 4);
      }
      const season = pDetails.data_season || pDetails.season || '';
      
      const registration_id = createRegistrationId(farmerName, actYear, season);
      return { ...act, registration_id };
    });`;

code = code.replace(searchActExtractor, replaceActExtractor);

fs.writeFileSync('src/pages/admin/NFDashboard.tsx', code);
console.log("Replaced");
