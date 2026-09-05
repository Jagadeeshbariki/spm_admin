const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/VillageGIS.tsx', 'utf8');

const search = `import { fetchSheet, getSetting, fetchGeoJson } from '@/lib/api';`;
const replace = `import { fetchSheet, getSetting, fetchGeoJson } from '@/lib/api';
import { UtilizationDashboard } from '../../components/UtilizationDashboard';`;

if (code.includes(search)) {
    code = code.replace(search, replace);
    fs.writeFileSync('src/pages/admin/VillageGIS.tsx', code);
    console.log("Patched import");
} else {
    console.log("Not found");
}
