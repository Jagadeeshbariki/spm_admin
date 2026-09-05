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
  
  const res = await fetch('https://central.wassan.org/v1/projects/3/forms/NF-%20Activities.svc/Submissions?$expand=*&$top=2', {
      headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log(JSON.stringify(data.value, null, 2));
}
test();
