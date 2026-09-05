const http = require('http');
http.get('http://localhost:3000/api/odk/data?formId=NF-%20Register', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      const records = parsed.value || [];
      const stats = {};
      
      const hdfcTargetSubmitters = [
         { names: ['sampath'], cluster: 'Cluster 1' },
         { names: ['mani'], cluster: 'Cluster 2' },
         { names: ['jadeskung', 'jeddiskung', 'jadiskung'], cluster: 'Cluster 3' }
      ];
      const getSubmitterCluster = (name) => {
         if (!name) return null;
         const lowerName = name.toLowerCase();
         for (const ts of hdfcTargetSubmitters) {
            if (ts.names.some(n => lowerName.includes(n))) return ts.cluster;
         }
         return null;
      };

      records.forEach(p => {
         function flatten(obj, prefix = '') {
            let res = {};
            for (let [key, val] of Object.entries(obj)) {
                let newKey = prefix ? `${prefix}_${key}` : key;
                if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
                    Object.assign(res, flatten(val, newKey));
                } else {
                    res[newKey] = val;
                }
            }
            return res;
        }
        const flat = flatten(p);
        
        const submitterName = p.__system?.submitterName || '';
        const cluster = getSubmitterCluster(submitterName);
        if (!cluster) return; // filter for HDFC
        
        const block = flat['block'] || flat['Block'] || flat['plot_reg_block'] || flat['plot_reg-block'] || 'Unknown';
        if (block.toLowerCase() === 'bhamini') {
           const mode = flat['crop_mode'] || flat['crop_model'] || flat['plot_reg_crop_model'] || flat['plot_reg-crop_model'] || 'Unknown';
           const areaStr = flat['area_'] || flat['Area'] || flat['area'] || flat['plot_reg-area_'] || flat['plot_reg_area_'] || '-';
           const area = parseFloat(areaStr);
           const safeArea = isNaN(area) ? 0 : area;
           
           if (!stats[mode]) stats[mode] = {count: 0, area: 0};
           stats[mode].count++;
           stats[mode].area += safeArea;
        }
      });
      console.log('Total for Bhamini (HDFC):');
      for (const [mode, s] of Object.entries(stats)) {
         console.log(mode, s.count, s.area);
      }
    } catch(e) {}
  });
});
