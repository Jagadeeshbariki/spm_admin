import fetch from 'node-fetch';
import Papa from 'papaparse';

async function run() {
  const BIO_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4QtZipnTgk2e8RU7NapbDg0b0re6_0YRrkd8fK34HEibBwpx6sa0g5gR9WK4UP3bEnuYSmO7fZpCN/pub?gid=1233605541&single=true&output=csv";

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

  const bio = await fetchCSV(BIO_URL);
  
  const qtyKeys = Object.keys(bio[0]).filter(k => k.toLowerCase().includes('quantity') || k.toLowerCase().includes('qty') || k.toLowerCase().includes('kg') || k.toLowerCase().includes('lit') || k.toLowerCase().includes('quan'));
  
  console.log("Bio quantity keys:", qtyKeys);
}
run();
