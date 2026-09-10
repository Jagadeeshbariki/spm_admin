async function run() {
  const email = process.env.ODK_EMAIL || 'vyomanautjagadeesh@gmail.com';
  const password = process.env.ODK_PASSWORD || 'OdkCentral@2024';

  const authRes = await fetch('https://central.wassan.org/v1/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const { token } = await authRes.json();

  const regRes = await fetch('https://central.wassan.org/v1/projects/3/forms/NF-%20Register.svc/Submissions', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const regJson = await regRes.json();
  const sub0 = regJson.value[0];
  console.log('Sample NF-Register submission keys:', Object.keys(sub0));
  console.log('sub0.__id:', sub0.__id);
  console.log('sub0.meta:', sub0.meta);
  console.log('sub0.instanceId:', sub0.instanceId);
  console.log('sub0.instanceID:', sub0.instanceID);
  console.log('sub0.__system:', sub0.__system);
  console.log('sub0.plot_reg:', sub0.plot_reg);
}
run();
