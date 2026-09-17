const fs = require('fs');
async function test() {
  const url = `http://localhost:3000/api/odk/data?formId=NF-%20Activities`;
  const res = await fetch(url);
  const data = await res.json();
  const bioActs = data.value?.filter(d => d.crop_activity === 'bio_inputs_application');
  if (bioActs && bioActs.length > 0) {
     console.log(JSON.stringify(bioActs[0], null, 2));
  } else {
     console.log("No bio input activities found.");
  }
}
test().catch(console.error);
