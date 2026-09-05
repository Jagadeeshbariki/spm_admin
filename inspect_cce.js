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
  
  const actRes = await fetch('https://central.wassan.org/v1/projects/3/forms/NF-%20Activities.svc/Submissions?$expand=*', {
      headers: { Authorization: `Bearer ${token}` }
  });
  const actData = await actRes.json();
  
  const cceActs = actData.value.filter(act => {
    return JSON.stringify(act).includes('cce');
  });
  
  console.log("Found CCE activities:", cceActs.length);
  if (cceActs.length > 0) {
    console.log(JSON.stringify(cceActs[0], null, 2));
  }
}
test();
