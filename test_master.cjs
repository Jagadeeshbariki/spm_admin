const fs = require('fs');
fetch('https://docs.google.com/spreadsheets/d/13inc1LrMAjqTVCjDiEaIOwqSO39dUzQwFWbZbpypSrA/gviz/tq?tqx=out:csv&sheet=Master')
  .then(res => res.text())
  .then(text => {
    fs.writeFileSync('master_dump.csv', text.substring(0, 1000));
    console.log("Dumped master");
  })
  .catch(console.error);
