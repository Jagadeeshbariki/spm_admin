fetch('https://drive.usercontent.google.com/download?id=1to2xXPCAEW6RrlKOXEMV3mlCFASzXeoj&export=download', { method: 'GET' })
  .then(res => console.log("GET:", res.status, res.headers.get('access-control-allow-origin')))
  .catch(console.error);
