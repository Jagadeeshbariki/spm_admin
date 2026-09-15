const fs = require('fs');
fetch('https://ais-dev-nai67zqz2etr4x7qfs3omc-37812705087.asia-southeast1.run.app/api/odk/data?formId=Micro%20Enterprizes')
  .then(res => res.json())
  .then(data => {
    fs.writeFileSync('micro_dump.json', JSON.stringify(data.value.slice(0, 5), null, 2));
    console.log("Dumped first 5 rows");
  });
