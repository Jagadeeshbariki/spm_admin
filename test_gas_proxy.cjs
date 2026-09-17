fetch('http://localhost:3000/api/proxy/script?url=' + encodeURIComponent('https://script.google.com/macros/s/AKfycbz_pXkI4eD08g0nK2TzJ-qV5QoV2oA8e49mD_b/exec?action=read&sheetName=Polygons_manyam&spreadsheetId=1n2qE-rdkVefVieM1z0C0Ah_Z04Gg6b7MrRca-LcNrvo'))
  .then(res => res.text())
  .then(text => console.log(text.substring(0, 500)))
  .catch(console.error);
