const Papa = require('papaparse');
fetch('https://docs.google.com/spreadsheets/d/13inc1LrMAjqTVCjDiEaIOwqSO39dUzQwFWbZbpypSrA/gviz/tq?tqx=out:csv&sheet=Polygons_manyam')
  .then(res => res.text())
  .then(text => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        console.log(`Polygons fetched: ${results.data.length} rows`);
        if (results.data.length > 0) {
          console.log(results.data[0]);
        }
      }
    });
  });
