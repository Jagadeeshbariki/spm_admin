const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/VillageGIS.tsx', 'utf8');

const search = `          totalHubUnits={totalHubUnits}
          totalHubVillagesCovered={totalHubVillagesCovered}
        />`;

const replace = `          totalHubUnits={totalHubUnits}
          totalHubVillagesCovered={totalHubVillagesCovered}
          microEnterprises={microEnterprises}
        />`;

if (code.includes(search)) {
    code = code.replace(search, replace);
    
    const propDefSearch = `  totalHubUnits: number;
  totalHubVillagesCovered: number;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);`;
    
    const propDefReplace = `  totalHubUnits: number;
  totalHubVillagesCovered: number;
  microEnterprises?: any[];
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);`;
    
    const propArgSearch = `  searchTerm,
  setSearchTerm,
  totalHubUnits,
  totalHubVillagesCovered,
}: {`;
    const propArgReplace = `  searchTerm,
  setSearchTerm,
  totalHubUnits,
  totalHubVillagesCovered,
  microEnterprises = [],
}: {`;
    
    code = code.replace(propDefSearch, propDefReplace);
    code = code.replace(propArgSearch, propArgReplace);
    
    fs.writeFileSync('src/pages/admin/VillageGIS.tsx', code);
    console.log("Patched component props");
} else {
    console.log("Not found");
}
