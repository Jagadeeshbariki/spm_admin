import 'dotenv/config';

async function listForms() {
  const email = process.env.ODK_EMAIL;
  const password = process.env.ODK_PASSWORD;
  
  const tokenRes = await fetch('https://central.wassan.org/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.token;
  
  const formsRes = await fetch('https://central.wassan.org/v1/projects/3/forms', {
      headers: { Authorization: `Bearer ${token}` }
  });
  const forms = await formsRes.json();
  console.log(forms.map(f => ({xmlFormId: f.xmlFormId, name: f.name, submissions: f.submissions})));
}
listForms();
