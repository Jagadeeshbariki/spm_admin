import 'dotenv/config';
import fs from 'fs';

async function testImage() {
  const email = process.env.ODK_EMAIL;
  const password = process.env.ODK_PASSWORD;
  
  const tokenRes = await fetch('https://central.wassan.org/v1/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.token;
  
  // We need a known submission ID. Let's list some submissions for NF- Register
  const subRes = await fetch('https://central.wassan.org/v1/projects/3/forms/NF-%20Register/submissions', {
      headers: { Authorization: `Bearer ${token}` }
  });
  const submissions = await subRes.json();
  if (submissions.length > 0) {
      console.log("Submissions for NF- Register:", submissions[0].instanceId);
      // Get attachments for this submission
      const attachRes = await fetch(`https://central.wassan.org/v1/projects/3/forms/NF-%20Register/submissions/${submissions[0].instanceId}/attachments`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      const attachments = await attachRes.json();
      console.log("Attachments:", attachments);
  }
}
testImage();
