import fs from 'fs';
const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
config.maxDuration = 60;
fs.writeFileSync('vercel.json', JSON.stringify(config, null, 2));
