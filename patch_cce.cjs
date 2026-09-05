const fs = require('fs');

function patchCCE() {
  const file = 'src/pages/admin/CropsDashboard.tsx';
  let content = fs.readFileSync(file, 'utf8');
  
  // 1. Add cces array declaration
  content = content.replace(
    "let bioInputs: any[] = [];",
    "let bioInputs: any[] = [];\n          let cces: any[] = [];"
  );
  
  // 2. Add cce extraction inside matchedActivities.forEach
  content = content.replace(
    "              })));\n            }\n          });",
    "              })));\n            }\n            if (act.cce && (act.cce.date_cce || flatAct['cce_date_cce'] || flatAct['cce-date_cce'])) {\n              cces.push({\n                ...act.cce,\n                photo: actPhoto,\n                PK: parentKey + '-cce',\n                PARENT_KEY: parentKey,\n                formId: 'NF- Activities',\n                submissionId: act.__id || parentKey.replace('uuid:', '')\n              });\n            }\n          });"
  );
  
  // 3. Include cces in the mapped object
  content = content.replace(
    "harvests,\n            bioInputs,\n            raw: flat,",
    "harvests,\n            bioInputs,\n            cces,\n            raw: flat,"
  );
  
  // 4. Update group.plots.push in groupLogic
  // wait, groupLogic doesn't specify which fields, it pushes the whole `item`. So we don't need to change `groupedData` creation.
  
  fs.writeFileSync(file, content, 'utf8');
}

patchCCE();
console.log("Successfully patched CCE extraction");
