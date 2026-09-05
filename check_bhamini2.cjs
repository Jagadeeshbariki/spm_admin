const http = require('http');
http.get('http://localhost:3000/api/odk/data?formId=NF-%20Register', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const records = parsed.value || [];
      console.log('Got', records.length, 'records');
      
      const bhaminiStats = {};
      
      records.forEach(p => {
         let block = p['block'] || p['Block'] || 'Unknown';
         if (block === 'Unknown' && p.plot_reg && p.plot_reg.block) block = p.plot_reg.block;
         
         if (block.toLowerCase() === 'bhamini') {
            let year = (p['text_year'] || p['year'] || '').substring(0, 4);
            let season = p['season'] || p['Season'] || '';
            
            let cycle = p['plot_reg-crop_cycle'] || p.plot_reg?.crop_cycle || '';
            if (cycle) {
               const parts = cycle.split('-');
               if (parts.length >= 3) {
                  if (!year) year = parts[1];
                  if (!season) season = parts[2];
               }
            }
            
            if (year === '2026' && season.toLowerCase() === 'kharif') {
               let mode = p['crop_mode'] || p['crop_model'] || p['plot_reg-crop_model'] || p['plot_reg_crop_model'] || '';
               if (!mode && p.plot_reg && p.plot_reg.crop_model) mode = p.plot_reg.crop_model;
               if (!mode) mode = 'Unknown';
               
               let area = p['area_'] || p['Area'] || p['area'] || p['plot_reg-area_'] || p['plot_reg_area_'] || p['Extent'] || p['extent'];
               if (!area && p.plot_reg && p.plot_reg.area_) area = p.plot_reg.area_;
               
               let numArea = parseFloat(area);
               if (isNaN(numArea)) numArea = 0;
               
               if (!bhaminiStats[mode]) bhaminiStats[mode] = { count: 0, extent: 0 };
               bhaminiStats[mode].count += 1;
               bhaminiStats[mode].extent += numArea;
            }
         }
      });
      
      console.log('Bhamini Stats (2026 Kharif):', bhaminiStats);
    } catch (e) {
       console.log('Error parsing JSON', e.message);
    }
  });
});
