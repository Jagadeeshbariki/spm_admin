import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'registrations.json');
if (fs.existsSync(dbPath)) {
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  console.log("Found registrations:", data.length);
  const firstWithImage = data.find((d: any) => JSON.stringify(d).includes('.jpg'));
  if (firstWithImage) {
    console.log("Sample with image:", JSON.stringify(firstWithImage, null, 2).substring(0, 500) + "...");
    // Let's flatten it to see the keys
    function flatten(obj: any, prefix = '') {
      let result: any = {};
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(result, flatten(obj[key], prefix + key + '_'));
        } else {
          result[prefix + key] = obj[key];
        }
      }
      return result;
    }
    const flat = flatten(firstWithImage);
    const photoKeys = Object.keys(flat).filter(k => typeof flat[k] === 'string' && flat[k].includes('.jpg'));
    console.log("Photo keys found:", photoKeys);
    console.log("Photo values:", photoKeys.map(k => flat[k]));
  }
}

const actPath = path.join(process.cwd(), 'data', 'activities.json');
if (fs.existsSync(actPath)) {
  const data = JSON.parse(fs.readFileSync(actPath, 'utf8'));
  console.log("Found activities:", data.length);
  const firstWithImage = data.find((d: any) => JSON.stringify(d).includes('.jpg'));
  if (firstWithImage) {
    function flatten(obj: any, prefix = '') {
      let result: any = {};
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(result, flatten(obj[key], prefix + key + '_'));
        } else {
          result[prefix + key] = obj[key];
        }
      }
      return result;
    }
    const flat = flatten(firstWithImage);
    const photoKeys = Object.keys(flat).filter(k => typeof flat[k] === 'string' && flat[k].includes('.jpg'));
    console.log("Activity Photo keys found:", photoKeys);
    console.log("Activity Photo values:", photoKeys.map(k => flat[k]));
  }
}
