const Papa = require('papaparse');
fetch('https://docs.google.com/spreadsheets/d/13inc1LrMAjqTVCjDiEaIOwqSO39dUzQwFWbZbpypSrA/gviz/tq?tqx=out:csv&sheet=Master')
  .then(res => res.text())
  .then(text => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        console.log(`Total rows: ${results.data.length}`);
        let workingWithLat = 0;
        let workingWithoutLat = 0;
        results.data.forEach(row => {
          let lat = parseFloat(row.lat);
          const status = (row['status '] || row['status_of_unit-status'] || row['Status'] || '').toLowerCase();
          if (status.includes('working')) {
             if (!isNaN(lat)) {
                workingWithLat++;
             } else {
                workingWithoutLat++;
             }
          }
        });
        console.log(`Working with lat: ${workingWithLat}, Working without lat: ${workingWithoutLat}`);
      }
    });
  });
