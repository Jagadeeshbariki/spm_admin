async function test() {
  const url = `http://localhost:3000/api/odk/data?sheetName=Polygons_manyam&spreadsheetId=1n2qE-rdkVefVieM1z0C0Ah_Z04Gg6b7MrRca-LcNrvo`;
  const res = await fetch(url);
  const data = await res.json();
  console.log("Success?", data.value?.length);
  if (data.value) {
     console.log(data.value.slice(0,2));
  } else {
     console.log(data);
  }
}
test().catch(console.error);
