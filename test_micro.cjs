const fs = require('fs');
fetch('http://localhost:3000/api/odk/data?formId=Micro%20Enterprizes')
  .then(res => res.json())
  .then(data => {
    fs.writeFileSync('micro_dump.json', JSON.stringify(data.value.slice(0, 5), null, 2));
    console.log("Dumped first 5 rows");
  });
