async function test() {
  const url = `https://script.google.com/macros/s/AKfycbwmJxHEodAZPOUN9qQ-o1Uj9mEmt3OgymdLCzCqUpPYWTaq-brr-PdPfftd5pmpBr8/exec?sheetName=Polygons_manyam&spreadsheetId=1gga5glk6oNlI5tRDZFMthh4B-sUa0NnG`;
  const res = await fetch(url);
  const data = await res.json();
  console.log("Success?", data?.length);
  if (data?.length) {
     console.log(data.slice(0,3));
  } else {
     console.log(data);
  }
}
test().catch(console.error);
