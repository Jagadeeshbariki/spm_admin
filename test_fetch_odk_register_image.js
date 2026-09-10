async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/odk/data?formId=NF-%20Register");
    const data = await res.json();
    if (!data.value || data.value.length === 0) {
      console.log("No data found");
      return;
    }
    
    let photo = null;
    let subId = null;
    
    const findPhoto = (obj) => {
      if (!obj || typeof obj !== 'object') return null;
      if (obj.photo) return { photo: obj.photo, id: obj.__id || obj.meta?.instanceID };
      if (obj.plot_reg_image) return { photo: obj.plot_reg_image, id: obj.__id || obj.meta?.instanceID };
      if (obj.image) return { photo: obj.image, id: obj.__id || obj.meta?.instanceID };
      for (const k in obj) {
        if (Array.isArray(obj[k])) {
          for (const item of obj[k]) {
            const res = findPhoto(item);
            if (res) return res;
          }
        } else if (typeof obj[k] === 'object') {
          const res = findPhoto(obj[k]);
          if (res) return res;
        }
      }
      return null;
    };
    
    for (const sub of data.value) {
       const result = findPhoto(sub);
       if (result) {
         photo = result.photo;
         subId = sub.__id || sub.meta?.instanceID; 
         break;
       }
    }
    
    if (!photo) {
      console.log("No photo found in any submission");
      return;
    }

    console.log("Found Photo:", photo, "for Submission ID:", subId);
    
    const imgUrl = `http://localhost:3000/api/odk/image?submissionId=${subId}&filename=${photo}&formId=NF-%20Register`;
    console.log("Fetching image:", imgUrl);
    
    const imgRes = await fetch(imgUrl);
    console.log("Image response status:", imgRes.status);
    if (!imgRes.ok) {
      console.log(await imgRes.text());
    } else {
      console.log("Content-Type:", imgRes.headers.get('content-type'));
    }
  } catch (e) {
    console.error(e);
  }
}
test();
