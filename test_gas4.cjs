async function test() {
  const url = `https://script.google.com/macros/s/AKfycbwmJxHEodAZPOUN9qQ-o1Uj9mEmt3OgymdLCzCqUpPYWTaq-brr-PdPfftd5pmpBr8/exec?sheetName=Polygons_manyam&spreadsheetId=1n2qE-rdkVefVieM1z0C0Ah_Z04Gg6b7MrRca-LcNrvo`;
  const res = await fetch(url, { redirect: 'follow' });
  const data = await res.json();
  data.forEach(d => console.log(d.Name));
}
test().catch(console.error);
