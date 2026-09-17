const Papa = require('papaparse');
async function test() {
  const masterRes = await fetch('https://docs.google.com/spreadsheets/d/13inc1LrMAjqTVCjDiEaIOwqSO39dUzQwFWbZbpypSrA/gviz/tq?tqx=out:csv&sheet=Master');
  const masterText = await masterRes.text();
  const masterData = Papa.parse(masterText, { header: true }).data;
  
  const res = await fetch('http://localhost:3000/api/drive/file/1to2xXPCAEW6RrlKOXEMV3mlCFASzXeoj');
  let geojson = await res.json();
  if (geojson.content) geojson = JSON.parse(geojson.content);
  
  const geoVillages = new Set(geojson.features.map(f => (f.properties['Name of Village'] || f.properties.village || f.properties.Name || '').toLowerCase().trim()));
  
  const hubVillages = new Set(masterData
     .filter(hub => (hub['status '] || hub['status_of_unit-status'] || hub.Status || '').toLowerCase().includes('working'))
     .map(hub => (hub.Village || hub['entr_location-village'] || hub.village || '').toLowerCase().trim()));

  console.log("Total working hub villages:", hubVillages.size);
  let matches = 0;
  for (const hv of hubVillages) {
     if (geoVillages.has(hv)) matches++;
     else console.log("Miss:", hv);
  }
  console.log("Matches in geojson:", matches);
}
test().catch(console.error);
