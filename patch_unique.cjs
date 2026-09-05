const fs = require('fs');

function patchUnique() {
  const file = 'src/pages/admin/CropsDashboard.tsx';
  let content = fs.readFileSync(file, 'utf8');
  
  // 1. Add plotFarmerId to mappedData
  content = content.replace(
    "farmerName: flat['farmer_name'] || flat['Farmer_Name'] || flat['name'] || flat['farmer'] || '',",
    "farmerName: flat['farmer_name'] || flat['Farmer_Name'] || flat['name'] || flat['farmer'] || '',\n            plotFarmerId: farmerId,"
  );
  
  // 2. Change OverviewTab unique logic
  const oldOverviewLogic = `
    data.forEach(item => {
      const farmerId = item.hhId || item.farmerName || 'unknown';
      uniqueFarmers.add(farmerId);
      
      // Area
      const area = parseFloat(item.area);
      if (!isNaN(area)) totalArea += area;
      
      // Activities
      if (item.harvests.length > 0 || item.bioInputs.length > 0) {
        activeFarmers.add(farmerId);
      }
      totalHarvests += item.harvests.length;
      totalBioInputs += item.bioInputs.length;
`;
  
  const newOverviewLogic = `
    data.forEach(item => {
      // strictly use plot_reg-farmer_Id for unique farmer counts as requested
      const farmerId = item.plotFarmerId || null;
      if (farmerId) {
        uniqueFarmers.add(farmerId);
      }
      
      // Area
      const area = parseFloat(item.area);
      if (!isNaN(area)) totalArea += area;
      
      // Activities
      if (item.harvests.length > 0 || item.bioInputs.length > 0 || (item.cces && item.cces.length > 0)) {
        if (farmerId) {
          activeFarmers.add(farmerId);
        }
      }
      totalHarvests += item.harvests.length;
      totalBioInputs += item.bioInputs.length;
`;
  
  // Find where it starts in the file
  const findStr = "    data.forEach(item => {\n      const farmerId = item.hhId || item.farmerName || 'unknown';\n      uniqueFarmers.add(farmerId);";
  
  if (content.indexOf(findStr) === -1) {
    console.error("Could not find overview logic");
    return;
  }
  
  content = content.replace(
    "    data.forEach(item => {\n      const farmerId = item.hhId || item.farmerName || 'unknown';\n      uniqueFarmers.add(farmerId);\n      \n      // Area\n      const area = parseFloat(item.area);\n      if (!isNaN(area)) totalArea += area;\n      \n      // Activities\n      if (item.harvests.length > 0 || item.bioInputs.length > 0) {\n        activeFarmers.add(farmerId);\n      }",
    "    data.forEach(item => {\n      // strictly use plot_reg-farmer_Id for unique farmer counts as requested\n      const farmerId = item.plotFarmerId || null;\n      if (farmerId) {\n        uniqueFarmers.add(farmerId);\n      }\n      \n      // Area\n      const area = parseFloat(item.area);\n      if (!isNaN(area)) totalArea += area;\n      \n      // Activities\n      if (item.harvests.length > 0 || item.bioInputs.length > 0 || (item.cces && item.cces.length > 0)) {\n        if (farmerId) {\n          activeFarmers.add(farmerId);\n        }\n      }"
  );
  
  fs.writeFileSync(file, content, 'utf8');
}
patchUnique();
console.log("Successfully patched Unique Farmer logic");
