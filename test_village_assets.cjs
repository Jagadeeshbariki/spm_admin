const Papa = require('papaparse');
fetch('https://docs.google.com/spreadsheets/d/13inc1LrMAjqTVCjDiEaIOwqSO39dUzQwFWbZbpypSrA/gviz/tq?tqx=out:csv&sheet=village_assets')
  .then(res => res.text())
  .then(text => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        console.log(`village_assets fetched: ${results.data.length} rows`);
        if (results.data.length > 0) {
          console.log(results.data[0]);
        }
      }
    });
  });
