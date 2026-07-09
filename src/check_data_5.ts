import fetch from 'node-fetch';
import Papa from 'papaparse';

async function run() {
  const MASTER_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4QtZipnTgk2e8RU7NapbDg0b0re6_0YRrkd8fK34HEibBwpx6sa0g5gR9WK4UP3bEnuYSmO7fZpCN/pub?gid=1609179150&single=true&output=csv";
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

  const master = await fetchCSV(MASTER_URL);
  const bio = await fetchCSV(BIO_URL);

  console.log("Master image name:", master[0]['plot_reg-image']);
  console.log("Master instance ID:", master[0]['meta-instanceID']);
  console.log("Bio image name:", bio[0]['Photos']);
  console.log("Bio instance ID:", bio[0]['meta-instanceID']);
}
run();
