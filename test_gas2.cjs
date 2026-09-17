async function test() {
  const url = `https://script.google.com/macros/s/AKfycbwmJxHEodAZPOUN9qQ-o1Uj9mEmt3OgymdLCzCqUpPYWTaq-brr-PdPfftd5pmpBr8/exec?sheetName=Polygons_manyam&spreadsheetId=1gga5glk6oNlI5tRDZFMthh4B-sUa0NnG`;
  const res = await fetch(url, { redirect: 'follow' });
  const text = await res.text();
  console.log("Response text:", text.slice(0, 200));
}
test().catch(console.error);
