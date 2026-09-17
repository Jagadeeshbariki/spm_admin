const { google } = require('googleapis');
async function test() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: '1n2qE-rdkVefVieM1z0C0Ah_Z04Gg6b7MrRca-LcNrvo',
    range: 'Polygons_manyam',
  });
  console.log(res.data.values);
}
test().catch(console.error);
