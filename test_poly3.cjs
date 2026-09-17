const Papa = require('papaparse');
async function test() {
  const res = await fetch('https://docs.google.com/spreadsheets/d/1gga5glk6oNlI5tRDZFMthh4B-sUa0NnG/gviz/tq?tqx=out:csv&sheet=Polygons_manyam');
  const text = await res.text();
  const data = Papa.parse(text, { header: true }).data;
  console.log(data);
}
test();
