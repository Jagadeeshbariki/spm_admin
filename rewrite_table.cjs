const fs = require('fs');

function rewrite() {
  const file = 'src/pages/admin/CropsDashboard.tsx';
  let content = fs.readFileSync(file, 'utf8');
  
  // 1. We need to introduce `groupedData`
  // We'll insert it right after `filteredData` useMemo and before `totalPages`.
  const groupLogic = `
  const groupedData = useMemo(() => {
    const groups = {};
    filteredData.forEach(item => {
      const key = \`\${item.hhId}-\${item.farmerName}\`;
      if (!groups[key]) {
        groups[key] = {
          id: key,
          hhId: item.hhId,
          farmerName: item.farmerName,
          cluster: item.cluster,
          village: item.village,
          gp: item.gp,
          block: item.block,
          plots: [],
          totalActivities: 0
        };
      }
      groups[key].plots.push(item);
      groups[key].totalActivities += (item.activityCount || 0);
    });
    return Object.values(groups);
  }, [filteredData]);

  const totalPages = Math.ceil(groupedData.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return groupedData.slice(start, start + itemsPerPage);
  }, [groupedData, currentPage]);
  
  const [expandedSubRow, setExpandedSubRow] = useState<string | number | null>(null);
  `;
  
  content = content.replace(
    /const totalPages = Math\.ceil\(filteredData\.length \/ itemsPerPage\);\s*const paginatedData = useMemo\(\(\) => \{\s*const start = \(currentPage - 1\) \* itemsPerPage;\s*return filteredData\.slice\(start, start \+ itemsPerPage\);\s*\}, \[filteredData, currentPage\]\);/,
    groupLogic
  );
  
  // 2. Change the table headers
  content = content.replace(
    /<th className="px-6 py-4">Year<\/th>\s*<th className="px-6 py-4">Season<\/th>\s*<th className="px-6 py-4">Crop Mode<\/th>/,
    '<th className="px-6 py-4">Total Plots</th>'
  );
  
  // 3. Change the table row rendering to map over the group
  // Specifically: paginatedData.map((row, idx) => { ...
  // In the row td:
  // Remove year, season, crop mode
  // Add total plots
  // Replace the expanded row content with the sub-accordion logic
  fs.writeFileSync(file, content, 'utf8');
}
rewrite();
console.log("Success phase 1");
