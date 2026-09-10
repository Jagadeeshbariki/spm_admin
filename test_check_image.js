async function run() {
  const tokenRes = await fetch('https://central.wassan.org/v1/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ODK_EMAIL, password: process.env.ODK_PASSWORD }),
  });
  const { token } = await tokenRes.json();

  const regRes = await fetch('https://central.wassan.org/v1/projects/3/forms/NF-%20Register.svc/Submissions?$expand=*', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const regData = await regRes.json();
  const sub = regData.value.find(s => s.__id === 'uuid:5c2b041a-501c-4fb5-9a20-02e5e4d8844d');
  console.log('Submission in Register:', JSON.stringify(sub, null, 2));
}
run();
