import fetch from 'node-fetch';

async function run() {
  const instanceId = 'uuid:6649a155-5f10-4e2e-b4b2-7f0cca11f20e';
  const filename = '1782908954940.jpg';
  
  const urls = [
    `https://central.wassan.org/v1/projects/3/forms/NF-%20Register/submissions/${instanceId}/attachments/${filename}`,
    `https://central.wassan.org/v1/projects/3/forms/NF- Register/submissions/${instanceId}/attachments/${filename}`,
    `https://central.wassan.org/v1/projects/3/forms/NF%20Register/submissions/${instanceId}/attachments/${filename}`,
    `https://central.wassan.org/v1/projects/3/forms/NF-%20Register.svc/Submissions('${instanceId}')/Attachments('${filename}')/$value`
  ];

  for (const u of urls) {
    try {
      const res = await fetch(u);
      console.log(u, res.status);
    } catch(e) {
      console.log(u, "error");
    }
  }
}
run();
