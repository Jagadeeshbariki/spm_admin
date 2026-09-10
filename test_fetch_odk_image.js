async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/odk/data?formId=NF-%20Activities");
    const data = await res.json();
    if (!data.value || data.value.length === 0) {
      console.log("No data found");
      return;
    }
    const submission = data.value.find(s => s.gps && s.gps.photo) || data.value[0];
    console.log("Submission ID:", submission.__id);
    
    // We need to look deeper into the data to find a photo, because the structure is complex
    let photo = null;
    let subId = submission.__id;
    
    if (submission.gps && submission.gps.photo) photo = submission.gps.photo;
    
    if (!photo && submission.harvesting && submission.harvesting.length > 0) {
       // harvesting doesn't have photos in the child, it's usually at parent level
       // wait, let's just log the first photo we can find in the data
    }
    
    // Let's just find ANY object with a photo key in the entire data
    const findPhoto = (obj) => {
      if (!obj || typeof obj !== 'object') return null;
      if (obj.photo) return { photo: obj.photo, id: obj.__id || submission.__id };
      if (obj.gps_photo) return { photo: obj.gps_photo, id: obj.__id || submission.__id };
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
         subId = sub.__id; // Attachment is tied to the parent submission usually!
         break;
       }
    }
    
    if (!photo) {
      console.log("No photo found in any submission");
      return;
    }

    console.log("Found Photo:", photo, "for Submission ID:", subId);
    
    const imgUrl = `http://localhost:3000/api/odk/image?submissionId=${subId}&filename=${photo}&formId=NF-%20Activities`;
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
