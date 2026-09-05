const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/VillageGIS.tsx', 'utf8');

const searchLoad = `  const loadData = async () => {
    try {
      setLoading(true);
      const [hubsData] = await Promise.all([
        fetchSheet('Master').catch(() => [])
      ]);
      setVillageAssets([]);`;

const replaceLoad = `  const loadData = async () => {
    try {
      setLoading(true);
      const [hubsData, microEnterprisesDataReq] = await Promise.all([
        fetchSheet('Master').catch(() => []),
        fetch('/api/odk/data?formId=Micro Enterprizes').catch(() => ({ json: async () => ({ value: [] }) }))
      ]);
      setVillageAssets([]);
      let microEnterprisesData = [];
      try {
        const json = await microEnterprisesDataReq.json();
        microEnterprisesData = json.value || [];
      } catch(e) {}
      setMicroEnterprises(microEnterprisesData);`;

if(code.includes(searchLoad)) {
    code = code.replace(searchLoad, replaceLoad);
    
    const searchState = `  const [processingHubs, setProcessingHubs] = useState<any[]>([]);`;
    const replaceState = `  const [processingHubs, setProcessingHubs] = useState<any[]>([]);
  const [microEnterprises, setMicroEnterprises] = useState<any[]>([]);`;
    
    code = code.replace(searchState, replaceState);
    
    fs.writeFileSync('src/pages/admin/VillageGIS.tsx', code);
    console.log("Patched VillageGIS loadData");
} else {
    console.log("Search string not found!");
}
