with open('src/pages/admin/VillageGIS.tsx', 'r') as f:
    content = f.read()

export_fn = """  const exportVillagesCSV = () => {
    if (geoVillages.length === 0) {
      alert("No villages to export.");
      return;
    }
    const headers = ['Village Name', 'Gram Panchayat', 'Block (Mandal)', 'District', 'Latitude', 'Longitude', 'Project Name'];
    const rows = [headers.join(',')];

    geoVillages.forEach(v => {
      const p = v.properties || {};
      const villageName = (p['Name of Village'] || p.village || p.Name || p.Village || p.VILLAGE || '').replace(/,/g, '');
      const gp = (p['Gram Panchayat'] || p['GP'] || p.gp || p.gram_panchayat || '').replace(/,/g, '');
      const mandal = (p['Block'] || p['Mandal'] || p.block || p.mandal || p.MANDAL || '').replace(/,/g, '');
      const district = (p['District'] || p.district || p.DISTRICT || '').replace(/,/g, '');
      
      let lat = '', lng = '';
      if (v.geometry && v.geometry.type === 'Point' && Array.isArray(v.geometry.coordinates)) {
        lng = v.geometry.coordinates[0];
        lat = v.geometry.coordinates[1];
      }
      
      rows.push([villageName, gp, mandal, district, lat, lng, ''].join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "villages_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
"""

button_jsx = """          <button 
            onClick={exportVillagesCSV}
            className="bg-emerald-50 text-emerald-600 p-2.5 md:p-3 rounded-2xl shadow-xl border border-emerald-200 transition-all hover:scale-105 flex flex-col items-center gap-1"
            title="Export Villages CSV"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-5 md:h-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <span className="text-[7px] md:text-[8px] font-bold uppercase">CSV</span>
          </button>
          
          <button 
            onClick={() => setMapType(mapType === 'streets' ? 'satellite' : 'streets')}"""

if "const loadData =" in content and "title=\"Toggle Map Type\"" in content:
    content = content.replace("  const loadData =", export_fn + "\n  const loadData =")
    content = content.replace("          <button \n            onClick={() => setMapType(mapType === 'streets' ? 'satellite' : 'streets')}", button_jsx)
    with open('src/pages/admin/VillageGIS.tsx', 'w') as f:
        f.write(content)
    print("Export button added!")
else:
    print("Could not find insertion points.")
