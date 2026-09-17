fetch('https://drive.google.com/uc?id=1to2xXPCAEW6RrlKOXEMV3mlCFASzXeoj&export=download', { method: 'OPTIONS' })
  .then(res => console.log("OPTIONS:", res.headers.get('access-control-allow-origin')))
  .catch(console.error);
fetch('https://drive.google.com/uc?id=1to2xXPCAEW6RrlKOXEMV3mlCFASzXeoj&export=download', { method: 'GET' })
  .then(res => console.log("GET:", res.headers.get('access-control-allow-origin')))
  .catch(console.error);
