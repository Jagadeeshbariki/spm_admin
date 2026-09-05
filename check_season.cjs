const http = require('http');
http.get('http://localhost:3000/api/odk/data?formId=NF-%20Register', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const records = parsed.value || [];
      const seasons = new Set();
      const years = new Set();
      const cycles = new Set();
      records.forEach(p => {
         const year = (p['text_year'] || p['year'] || '').substring(0, 4) || 'Unknown';
         const season = p['season'] || p['Season'] || 'Unknown';
         const cycle = p['plot_reg-crop_cycle'] || p.plot_reg?.crop_cycle || 'Unknown';
         years.add(year);
         seasons.add(season);
         cycles.add(cycle);
      });
      console.log('Years:', Array.from(years));
      console.log('Seasons:', Array.from(seasons));
      console.log('Cycles:', Array.from(cycles));
    } catch (e) {}
  });
});
