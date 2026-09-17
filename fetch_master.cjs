const Papa = require('papaparse');
async function test() {
  const res = await fetch('https://docs.google.com/spreadsheets/d/13inc1LrMAjqTVCjDiEaIOwqSO39dUzQwFWbZbpypSrA/gviz/tq?tqx=out:csv&sheet=Master');
  const text = await res.text();
  const data = Papa.parse(text, { header: true }).data;
  console.log(data[0]);
}
test();
