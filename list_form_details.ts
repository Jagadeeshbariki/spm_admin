import 'dotenv/config';

async function listFormDetails() {
  const email = process.env.ODK_EMAIL;
  const password = process.env.ODK_PASSWORD;
  
  const tokenRes = await fetch('https://central.wassan.org/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.token;
  
  const res = await fetch('https://central.wassan.org/v1/projects/3/forms/NF-%20Activities.svc', {
      headers: { Authorization: `Bearer ${token}` }
  });
  const schema = await res.text();
  console.log("SCHEMA NF-Activities:");
  console.log(schema);
}
listFormDetails();
