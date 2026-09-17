const fs = require('fs');
const Papa = require('papaparse');
fetch('https://docs.google.com/spreadsheets/d/13inc1LrMAjqTVCjDiEaIOwqSO39dUzQwFWbZbpypSrA/gviz/tq?tqx=out:csv&sheet=Master')
  .then(res => res.text())
  .then(text => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        fs.writeFileSync('master_parsed.json', JSON.stringify(results.data[0], null, 2));
        console.log("Parsed first row");
      }
    });
  })
  .catch(console.error);
