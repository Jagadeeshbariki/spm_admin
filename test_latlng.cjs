const Papa = require('papaparse');
fetch('https://docs.google.com/spreadsheets/d/13inc1LrMAjqTVCjDiEaIOwqSO39dUzQwFWbZbpypSrA/gviz/tq?tqx=out:csv&sheet=Master')
  .then(res => res.text())
  .then(text => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        let valid = 0, invalid = 0, workingValid = 0, workingInvalid = 0;
        results.data.forEach(row => {
          let lat = parseFloat(row.lat);
          let lng = parseFloat(row.long);
          // try alternative column names just in case
          if (isNaN(lat)) lat = parseFloat(row['status_of_unit-location-Latitude']);
          if (isNaN(lng)) lng = parseFloat(row['status_of_unit-location-Longitude']);

          const status = (row['status '] || row['status_of_unit-status'] || row['Status'] || '').toLowerCase();
          const isWorking = status.includes('working');

          if (!isNaN(lat) && !isNaN(lng)) {
            valid++;
            if (isWorking) workingValid++;
          } else {
            invalid++;
            if (isWorking) workingInvalid++;
          }
        });
        console.log(`Valid lat/lng: ${valid}, Invalid: ${invalid}`);
        console.log(`Working Valid: ${workingValid}, Working Invalid: ${workingInvalid}`);
      }
    });
  });
