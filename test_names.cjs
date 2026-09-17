const Papa = require('papaparse');
async function test() {
  const masterRes = await fetch('https://docs.google.com/spreadsheets/d/13inc1LrMAjqTVCjDiEaIOwqSO39dUzQwFWbZbpypSrA/gviz/tq?tqx=out:csv&sheet=Master');
  const masterText = await masterRes.text();
  const masterData = Papa.parse(masterText, { header: true }).data;
  
  const geoRes = await fetch('https://docs.google.com/spreadsheets/d/1n2qE-rdkVefVieM1z0C0Ah_Z04Gg6b7MrRca-LcNrvo/gviz/tq?tqx=out:csv&sheet=Polygons_manyam');
  const geoText = await geoRes.text();
  const geoData = Papa.parse(geoText, { header: true }).data;

  // Let's get actual GeoJSON file
  const fileId = geoData[0]['File ID'];
  const res = await fetch(`https://drive.usercontent.google.com/download?id=${fileId}&export=download`);
  const geojson = await res.json();
  
  const geoVillages = new Set(geojson.features.map(f => (f.properties['Name of Village'] || f.properties.village || f.properties.Name || '').toLowerCase().trim()));
  
  const hubVillages = new Set(masterData
     .filter(hub => (hub['status '] || hub['status_of_unit-status'] || hub.Status || '').toLowerCase().includes('working'))
     .map(hub => (hub.Village || hub['entr_location-village'] || hub.village || '').toLowerCase().trim()));

  console.log("Total working hub villages:", hubVillages.size);
  let matches = 0;
  for (const hv of hubVillages) {
     if (geoVillages.has(hv)) matches++;
  }
  console.log("Matches in geojson:", matches);
}
test().catch(console.error);
