import * as fs from 'fs';

async function test() {
  const mappingUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTOv15M_GF_4uJvmS3xcz3x89E25JNj22tewJ8O6323XYmurKukYPE-Km91ASul1w/pub?gid=1540773827&single=true&output=csv';
  const response = await fetch(mappingUrl);
  const csvText = await response.text();
  console.log(csvText.substring(0, 200));
}

test();
