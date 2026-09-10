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
  console.log('Found in Register?', !!sub);

  const actRes = await fetch('https://central.wassan.org/v1/projects/3/forms/NF-%20Activities.svc/Submissions?$expand=*', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const actData = await actRes.json();
  const actSub = actData.value.find(s => s.__id === 'uuid:5c2b041a-501c-4fb5-9a20-02e5e4d8844d');
  console.log('Found in Activities?', !!actSub);
}
run();
