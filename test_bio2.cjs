const fs = require('fs');
async function test() {
  const url = `http://localhost:3000/api/odk/data?formId=NF-%20Activities`;
  const res = await fetch(url);
  const data = await res.json();
  const bioActs = data.value?.filter(d => d.crop_activity === 'bio_inputs_application');
  if (bioActs && bioActs.length > 0) {
     bioActs.forEach(act => {
         if (act.application_bio_input) {
             act.application_bio_input.forEach(bi => {
                 console.log("Found bio input:");
                 console.log("  application_date_bio_input:", bi.application_date_bio_input);
                 console.log("  date_applied:", bi.date_applied);
                 console.log("  date:", bi.date);
                 console.log("  Primary_details date:", act.Primary_details?.date);
             });
         }
     });
  }
}
test().catch(console.error);
