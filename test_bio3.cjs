const fs = require('fs');
async function test() {
  const url = `http://localhost:3000/api/odk/data?formId=NF-%20Activities`;
  const res = await fetch(url);
  const data = await res.json();
  const bioActs = data.value?.filter(d => d.crop_activity === 'bio_inputs_application');
  if (bioActs && bioActs.length > 0) {
     bioActs.slice(0,2).forEach(act => {
         const displayDate = (() => {
                  if (act.crop_activity === 'bio_inputs_application' && act.application_bio_input?.length > 0) {
                     return act.application_bio_input[0].application_date_bio_input || act.Primary_details?.date_visit || act.Primary_details?.date || '-';
                  }
                  return act.Primary_details?.date_visit || act.Primary_details?.date || '-';
         })();
         console.log("displayDate:", displayDate);
     });
  }
}
test().catch(console.error);
