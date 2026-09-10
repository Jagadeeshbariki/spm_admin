async function run() {
  const start = Date.now();
  const tokenRes = await fetch('https://central.wassan.org/v1/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: process.env.ODK_EMAIL, password: process.env.ODK_PASSWORD }),
  });
  const { token } = await tokenRes.json();
  
  console.log("Got token in", Date.now() - start, "ms");
  const s2 = Date.now();

  const regRes = await fetch('https://central.wassan.org/v1/projects/3/forms/NF-%20Register.svc/Submissions?$expand=*', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("Got response in", Date.now() - s2, "ms");
  const regData = await regRes.json();
  console.log('Size of payload:', JSON.stringify(regData).length, 'bytes');
}
run();
