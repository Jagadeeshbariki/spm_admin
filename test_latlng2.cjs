const Papa = require('papaparse');
fetch('https://docs.google.com/spreadsheets/d/13inc1LrMAjqTVCjDiEaIOwqSO39dUzQwFWbZbpypSrA/gviz/tq?tqx=out:csv&sheet=Master')
  .then(res => res.text())
  .then(text => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        let onlyLatLong = 0;
        let onlyFallback = 0;
        results.data.forEach(row => {
          let lat1 = parseFloat(row.lat);
          let lng1 = parseFloat(row.long);
          let lat2 = parseFloat(row['status_of_unit-location-Latitude']);
          let lng2 = parseFloat(row['status_of_unit-location-Longitude']);
          
          if (!isNaN(lat1) && !isNaN(lng1)) onlyLatLong++;
          else if (!isNaN(lat2) && !isNaN(lng2)) onlyFallback++;
        });
        console.log(`Only lat/long: ${onlyLatLong}, Only fallback: ${onlyFallback}`);
      }
    });
  });
