import fetch from "node-fetch";

fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vTX_a8ee-nsKyWSNtH_2QeCdysPGfT-u-JLMtvqcwqy2vxk2zZQ1VJ9O1e5yqv-m7_ItO-5wKKCSaBk/pub?gid=0&single=true&output=csv")
  .then(res => res.text())
  .then(text => console.log(text.substring(0, 500)))
  .catch(err => console.error(err));
