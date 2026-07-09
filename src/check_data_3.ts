import fetch from 'node-fetch';
import Papa from 'papaparse';

async function run() {
  const MASTER_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4QtZipnTgk2e8RU7NapbDg0b0re6_0YRrkd8fK34HEibBwpx6sa0g5gR9WK4UP3bEnuYSmO7fZpCN/pub?gid=1609179150&single=true&output=csv";
  const BIO_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4QtZipnTgk2e8RU7NapbDg0b0re6_0YRrkd8fK34HEibBwpx6sa0g5gR9WK4UP3bEnuYSmO7fZpCN/pub?gid=1233605541&single=true&output=csv";
  const HARVEST_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4QtZipnTgk2e8RU7NapbDg0b0re6_0YRrkd8fK34HEibBwpx6sa0g5gR9WK4UP3bEnuYSmO7fZpCN/pub?gid=282552033&single=true&output=csv";

  const fetchCSV = async (url: string) => {
    const res = await fetch(url);
    const text = await res.text();
    return new Promise<any[]>((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
      });
    });
  };

  const master = await fetchCSV(MASTER_URL);
  const bio = await fetchCSV(BIO_URL);
  const harvest = await fetchCSV(HARVEST_URL);

  console.log("Master fields:", Object.keys(master[0]).filter(k => k.toLowerCase().includes('photo') || k.toLowerCase().includes('img')));
  console.log("Bio fields:", Object.keys(bio[0]).filter(k => k.toLowerCase().includes('photo') || k.toLowerCase().includes('img')));
  console.log("Harvest fields:", Object.keys(harvest[0]).filter(k => k.toLowerCase().includes('photo') || k.toLowerCase().includes('img')));
  
  if (master[0]) {
    console.log("Master ID keys:", Object.keys(master[0]).filter(k => k.toLowerCase().includes('id') || k.toLowerCase().includes('key')));
    console.log("Master photo values:", master[0]['plot_reg-photo'], master[0]['plot_reg-farmer_photo']);
  }
  
  if (bio[0]) {
    console.log("Bio qty fields:", Object.keys(bio[0]).filter(k => k.toLowerCase().includes('qty') || k.toLowerCase().includes('qnt') || k.toLowerCase().includes('kg') || k.toLowerCase().includes('lit') || k.toLowerCase().includes('quan')));
    console.log("Bio date fields:", Object.keys(bio[0]).filter(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('time')));
    console.log("Bio first row keys:", Object.keys(bio[0]).slice(0, 10));
  }
}
run();
