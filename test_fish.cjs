async function test() {
  const url = `http://localhost:3000/api/odk/data?formId=Fishponds_Assessment%202025`;
  const res = await fetch(url);
  const data = await res.json();
  if (data && data.value && data.value.length > 0) {
     console.log(JSON.stringify(data.value[0], null, 2));
  } else {
     console.log("No data found or error:", data);
  }
}
test().catch(console.error);
