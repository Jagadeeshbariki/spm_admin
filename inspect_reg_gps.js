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
  
  const hasGps = submissions.filter(sub => {
    const flat = flatten(sub);
    return flat['plot_reg_gps_point'] || flat['plot_reg-gps_point'] || flat['gps_point'] || flat['gps'] || flat['plot_reg_location_coordinates_0'] || flat['plot_reg-location_coordinates_0'] || JSON.stringify(sub).includes('coordinates');
  });
  
  console.log("Submissions with GPS:", hasGps.length);
  if (hasGps.length > 0) {
    console.log(JSON.stringify(hasGps[0], null, 2));
  }
}
test();
