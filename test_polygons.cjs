const Papa = require('papaparse');
async function test() {
  const geoRes = await fetch('https://docs.google.com/spreadsheets/d/1n2qE-rdkVefVieM1z0C0Ah_Z04Gg6b7MrRca-LcNrvo/gviz/tq?tqx=out:csv&sheet=Polygons_manyam');
  const geoText = await geoRes.text();
  const geoData = Papa.parse(geoText, { header: true }).data;
  console.log(geoData.map(r => ({ Name: r.Name, RegionType: r['Region Type'], FileId: r['File ID'] })));
}
test().catch(console.error);
