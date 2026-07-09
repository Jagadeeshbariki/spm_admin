import fetch from 'node-fetch';
import Papa from 'papaparse';

async function run() {
  const MASTER_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4QtZipnTgk2e8RU7NapbDg0b0re6_0YRrkd8fK34HEibBwpx6sa0g5gR9WK4UP3bEnuYSmO7fZpCN/pub?gid=1609179150&single=true&output=csv";

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

  console.log("Master fields:", Object.keys(master[0]).join(', '));
}
run();
