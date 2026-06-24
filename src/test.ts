import * as fs from 'fs';

async function test() {
  const url = `https://script.google.com/macros/s/AKfycbwmJxHEodAZPOUN9qQ-o1Uj9mEmt3OgymdLCzCqUpPYWTaq-brr-PdPfftd5pmpBr8/exec?sheetName=meeting_tracker&spreadsheetId=18Afss-S7VLMhgGluuwm4RanzyRfew61NLa_QzmBxHz4&t=${Date.now()}`;
  console.log("Fetching:", url);
  try {
    const res = await fetch(url);
    const text = await res.text();
    const data = JSON.parse(text);
if (data.length > 0) {
  const keys = new Set<string>();
  data.forEach((row: any) => {
    Object.keys(row).forEach(k => keys.add(k));
  });
  console.log('All Keys:', Array.from(keys));
}
  } catch(e) {
    console.error(e);
  }
}

test();



