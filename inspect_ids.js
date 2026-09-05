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
  
  let idCounts = 0;
  let hasPlotRegId = 0;
  
  submissions.forEach(sub => {
    const flat = flatten(sub);
    if (flat['plot_reg-farmer_Id'] || flat['plot_reg_farmer_Id']) hasPlotRegId++;
    idCounts++;
  });
  
  console.log(`Total sub: ${idCounts}, Has PlotRegId: ${hasPlotRegId}`);
  console.log("Sample rows:");
  submissions.slice(0, 3).forEach(sub => {
    const flat = flatten(sub);
    console.log({
      'plot_reg-farmer_Id': flat['plot_reg-farmer_Id'],
      'plot_reg_farmer_Id': flat['plot_reg_farmer_Id'],
      'HH_id': flat['HH_id'],
      'farmer_Id': flat['farmer_Id']
    });
  });
}
test();
