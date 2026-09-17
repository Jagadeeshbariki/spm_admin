async function test() {
  const url = `http://localhost:3000/api/odk/data?formId=2026-08-04%2000%3A00%3A00`;
  const res = await fetch(url);
  const data = await res.json();
  console.log("Number of BYP records:", data.value ? data.value.length : 0);
}
test().catch(console.error);
