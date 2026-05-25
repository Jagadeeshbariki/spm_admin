import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/VillageGIS.tsx', 'utf-8');
content = content.replace(
  /<Marker key=\{\`\$\{hub\._rowIndex\}-\$\{isExpanded \? \'exp\' : \'col\'\}-\$\{colorClass\}\`\} position=\{\[lat, lng\]\} icon=\{hubIcon\}>/g,
  '<Marker key={hub._rowIndex} position={[lat, lng]} icon={hubIcon}>'
);
content = content.replace(
  /key=\{\`asset-\$\{asset\._rowIndex \|\| idx\}-\$\{isSelected \? \'sel\' : \'nosel\'\}\`\}/g,
  'key={`asset-${asset._rowIndex || idx}`}'
);
fs.writeFileSync('src/pages/admin/VillageGIS.tsx', content);
console.log("Done");
