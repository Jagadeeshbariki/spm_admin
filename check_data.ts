import { fetchSheet } from './src/lib/api';

async function run() {
  const master = await fetchSheet('Master');
  const harvest = await fetchSheet('harvest');
  const bio = await fetchSheet('bio_inputs');
  console.log("Master photo keys:", Object.keys(master[0] || {}).filter(k => k.toLowerCase().includes('photo') || k.toLowerCase().includes('img') || k.toLowerCase().includes('pic')));
  console.log("Harvest photo keys:", Object.keys(harvest[0] || {}).filter(k => k.toLowerCase().includes('photo') || k.toLowerCase().includes('img') || k.toLowerCase().includes('pic')));
  console.log("Bio photo keys:", Object.keys(bio[0] || {}).filter(k => k.toLowerCase().includes('photo') || k.toLowerCase().includes('img') || k.toLowerCase().includes('pic')));
  
  if (master[0]) {
    console.log("Master ID keys:", Object.keys(master[0] || {}).filter(k => k.toLowerCase().includes('id') || k.toLowerCase().includes('key')));
  }
}
run();
