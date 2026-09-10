async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/odk/data?formId=NF-%20Register");
    const data = await res.json();
    
    const flatten = (obj, prefix = '') => {
      return Object.keys(obj).reduce((acc, k) => {
        const pre = prefix.length ? prefix + '_' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
          Object.assign(acc, flatten(obj[k], pre + k));
        } else {
          acc[pre + k] = obj[k];
          if (acc[k] === undefined) acc[k] = obj[k];
        }
        return acc;
      }, {});
    };

    let count = 0;
    let failed = 0;
    for (const sub of data.value) {
        const flat = flatten(sub);
        const plotPhoto = flat['plot_reg_image'] || flat['image'] || flat['photo'];
        const subId = sub.__id;
        
        if (plotPhoto) {
            count++;
            const imgUrl = `http://localhost:3000/api/odk/image?submissionId=${subId}&filename=${plotPhoto}&formId=NF-%20Register`;
            const imgRes = await fetch(imgUrl);
            if (!imgRes.ok) {
                console.log("FAILED:", imgUrl, await imgRes.text());
                failed++;
                if (failed >= 2) break; // just stop early
            }
        }
    }
    console.log(`Total photos tested: ${count}, Failed: ${failed}`);
  } catch (e) {
    console.error(e);
  }
}
test();
