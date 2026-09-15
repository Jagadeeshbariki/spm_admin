const fs = require('fs');
fetch('http://localhost:3000/api/odk/data?formId=2026-08-04%2000%3A00%3A00')
  .then(r => r.json())
  .then(data => {
    fs.writeFileSync('byp_data.json', JSON.stringify(data.value || data, null, 2));
    console.log("Saved to byp_data.json");
  })
  .catch(console.error);
