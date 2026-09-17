const fs = require('fs');
fetch('http://localhost:3000/api/drive/file/' + encodeURIComponent('1to2xXPCAEW6RrlKOXEMV3mlCFASzXeoj'))
  .then(res => res.text())
  .then(text => {
    try {
      const data = JSON.parse(text);
      if (data.features) {
         console.log("Features:", data.features.length);
         console.log(data.features[0].properties);
      } else if (data.content) {
         const geo = JSON.parse(data.content);
         console.log("Features (wrapped):", geo.features.length);
         console.log(geo.features[0].properties);
      }
    } catch(e) {
      console.log("Parse error:", e, text.substring(0, 100));
    }
  });
