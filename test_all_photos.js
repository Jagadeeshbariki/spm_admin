async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/odk/data?formId=NF-%20Activities");
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
    for (const act of data.value) {
        const flatAct = flatten(act);
        const actPhoto = act.gps?.photo || flatAct['gps_photo'] || flatAct['photo'] || act.photo;
        const subId = act.__id;
        
        if (actPhoto) {
            count++;
            const imgUrl = `http://localhost:3000/api/odk/image?submissionId=${subId}&filename=${actPhoto}&formId=NF-%20Activities`;
            const imgRes = await fetch(imgUrl);
            if (!imgRes.ok) {
                console.log("FAILED:", imgUrl, await imgRes.text());
                failed++;
            }
        }
    }
    console.log(`Total photos tested: ${count}, Failed: ${failed}`);
  } catch (e) {
    console.error(e);
  }
}
test();
