function parseDate(dstr) {
  if (!dstr) return null;
  let d = new Date(dstr);
  if (isNaN(d)) {
    let parts = dstr.split('/');
    if (parts.length === 3) {
      if (parts[2].length === 4) { // DD/MM/YYYY or MM/DD/YYYY? Let's assume JS Date can handle MM/DD/YYYY but DD/MM/YYYY needs manual parsing
        d = new Date(parts[2], parts[1] - 1, parts[0]);
      }
    }
  }
  return d;
}
console.log(parseDate("2026-07-29"));
console.log(parseDate("1/2/2026"));
console.log(parseDate("29/07/2026"));
