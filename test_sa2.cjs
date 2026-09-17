const { google } = require('googleapis');
async function test() {
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (privateKey && privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: '1n2qE-rdkVefVieM1z0C0Ah_Z04Gg6b7MrRca-LcNrvo',
      range: 'Polygons_manyam',
    });
    console.log(res.data.values);
  } catch (err) {
    console.log(err.message);
  }
}
test().catch(console.error);
