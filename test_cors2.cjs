fetch('https://drive.google.com/uc?id=1to2xXPCAEW6RrlKOXEMV3mlCFASzXeoj&export=download', { method: 'GET', redirect: 'manual' })
  .then(res => {
     console.log("Status:", res.status);
     console.log("Location:", res.headers.get('location'));
  })
  .catch(console.error);
