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
  
  const flatten = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, k) => {
      const pre = prefix.length ? prefix + '_' : '';
      if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, flatten(obj[k], pre + k));
      } else {
        acc[pre + k] = obj[k];
        if (acc[k] === undefined) acc[k] = obj[k];
      }
      return acc;
    }, {});
  };

  const submissions = regData.value || [];
  
  const uniqueStrict = new Set();
  const uniqueHH = new Set();
  const uniqueFallback = new Set();
  
  submissions.forEach(sub => {
    const flat = flatten(sub);
    const plotReg = String(flat['plot_reg-farmer_Id'] || flat['plot_reg_farmer_Id'] || flat['farmer_Id'] || '').trim();
    if (plotReg) uniqueStrict.add(plotReg);
    
    const hhId = flat['plot_reg-farmer_Id'] || flat['plot_reg_farmer_Id'] || flat['farmer_Id'] || flat['HH_id'] || flat['HH_Id'] || flat['hh_id'] || flat['HH Id'] || flat['hhid'] || '';
    if (hhId) uniqueHH.add(hhId);
    
    const farmerName = flat['farmer_name'] || flat['Farmer_Name'] || flat['name'] || flat['farmer'] || '';
    const fallback = hhId || farmerName || 'unknown';
    uniqueFallback.add(fallback);
  });
  
  console.log(`Strict plot_reg-farmer_Id unique: ${uniqueStrict.size}`);
  console.log(`hhId unique: ${uniqueHH.size}`);
  console.log(`fallback unique: ${uniqueFallback.size}`);
}
test();
