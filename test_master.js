const fs = require('fs');
fetch('http://localhost:3000/api/proxy/script?url=' + encodeURIComponent('https://docs.google.com/spreadsheets/d/13inc1LrMAjqTVCjDiEaIOwqSO39dUzQwFWbZbpypSrA/gviz/tq?tqx=out:csv&sheet=Master'))
  .then(res => res.text())
  .then(text => {
    fs.writeFileSync('master_dump.csv', text.substring(0, 500));
    console.log("Dumped master");
  })
  .catch(console.error);
