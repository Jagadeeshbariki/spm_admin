const fs = require('fs');

function patch() {
  const file = 'src/pages/admin/CropsDashboard.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // Add Village and Season stat objects
  content = content.replace(
    "const mainCropFarmers: Record<string, Set<string>> = {};",
    "const mainCropFarmers: Record<string, Set<string>> = {};\n    const villageFarmers: Record<string, Set<string>> = {};\n    const seasonFarmers: Record<string, Set<string>> = {};"
  );
  
  // Populate Village and Season
  const populateBlock = `
      // Village
      const village = item.village || 'Unknown';
      if (village !== 'Unknown' && village !== '-') {
        if (!villageFarmers[village]) villageFarmers[village] = new Set<string>();
        if (farmerId) villageFarmers[village].add(farmerId);
      }
      
      // Season
      const season = item.season || 'Unknown';
      if (season !== 'Unknown' && season !== '-') {
        if (!seasonFarmers[season]) seasonFarmers[season] = new Set<string>();
        if (farmerId) seasonFarmers[season].add(farmerId);
      }
  `;
  
  content = content.replace(
    "// Summary Tables",
    `${populateBlock}\n      // Summary Tables`
  );
  
  // Create sorted data arrays
  const dataArraysBlock = `
    const villageData = Object.entries(villageFarmers)
      .map(([name, set]) => ({ name, value: set.size }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // top 10

    const seasonData = Object.entries(seasonFarmers)
      .map(([name, set]) => ({ name, value: set.size }))
      .sort((a, b) => b.value - a.value);
  `;
  
  content = content.replace(
    "const clusterData = Object.entries(clusterFarmers)",
    `${dataArraysBlock}\n    const clusterData = Object.entries(clusterFarmers)`
  );
  
  // Add to returned stats object
  content = content.replace(
    "mainCropData,",
    "mainCropData,\n      villageData,\n      seasonData,"
  );

  fs.writeFileSync(file, content, 'utf8');
}
patch();
console.log("Successfully patched stats calculation for new charts");
