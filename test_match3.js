import 'dotenv/config';

async function test() {
  const email = process.env.ODK_EMAIL;
  const password = process.env.ODK_PASSWORD;
  
  const tokenRes = await fetch('https://central.wassan.org/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.token;
  
  const regRes = await fetch('https://central.wassan.org/v1/projects/3/forms/NF-%20Register.svc/Submissions?$expand=*', {
      headers: { Authorization: `Bearer ${token}` }
  });
  const regData = await regRes.json();
  
  const actRes = await fetch('https://central.wassan.org/v1/projects/3/forms/NF-%20Activities.svc/Submissions?$expand=*', {
      headers: { Authorization: `Bearer ${token}` }
  });
  const actData = await actRes.json();
  
  const flatten = (obj) => {
    let result = {};
    for (const i in obj) {
      if ((typeof obj[i]) === 'object' && !Array.isArray(obj[i])) {
        const temp = flatten(obj[i]);
        for (const j in temp) {
          result[j] = temp[j];
        }
      } else {
        result[i] = obj[i];
      }
    }
    return result;
  };
  
  const submissions = regData.value || [];
  const activities = actData.value || [];
  
  let matches = 0;
  
  submissions.forEach(sub => {
    const flat = flatten(sub);
    const farmerId = String(flat['plot_reg-farmer_Id'] || flat['plot_reg_farmer_Id'] || flat['farmer_Id'] || '').trim();
    let yearOnly = String(flat['plot_reg-year_only'] || flat['plot_reg-year'] || flat['year'] || '').trim();
    yearOnly = yearOnly.length >= 4 ? yearOnly.substring(0, 4) : yearOnly;
    const regSeason = String(flat['plot_reg-season'] || flat['season'] || '').trim();
    
    const registration_id = `${farmerId}-${yearOnly}-${regSeason}`.toLowerCase();
    
    const matchedActivities = activities.filter(act => {
      const pDetails = act.Primary_details || {};
      const actFarmerName = String(pDetails.farmer_name || '').trim();
      const textYear = String(pDetails.text_year || '');
      const actYear = textYear.length >= 4 ? textYear.substring(0, 4) : textYear;
      const actDataSeason = String(pDetails.data_season || '').trim();
      
      const activity_fk = `${actFarmerName}-${actYear}-${actDataSeason}`.toLowerCase();
      
      return registration_id === activity_fk && registration_id !== '--';
    });
    
    if (matchedActivities.length > 0) matches++;
  });
  console.log(`Matched ${matches} registrations to activities`);
}
test();
