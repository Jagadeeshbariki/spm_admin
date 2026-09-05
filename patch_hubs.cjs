const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/VillageGIS.tsx', 'utf8');

const search = `  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('satellite');`;

const replace = `  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'utilization'>('overview');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('satellite');`;

if (code.includes(search)) {
    code = code.replace(search, replace);
    
    // Now add the nav buttons under "Overview of established units across the region"
    const searchNav = `               <h2 className="text-xl font-bold text-slate-800">Processing Hubs Dashboard</h2>
               <p className="text-sm text-slate-500">Overview of established units across the region</p>
            </div>`;
    
    const replaceNav = `               <h2 className="text-xl font-bold text-slate-800">Processing Hubs Dashboard</h2>
               <p className="text-sm text-slate-500">Overview of established units across the region</p>
               <div className="flex gap-2 mt-3">
                 <button onClick={() => setActiveSubTab('overview')} className={cn("px-4 py-1.5 rounded-full text-sm font-bold transition-all", activeSubTab === 'overview' ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>Overview</button>
                 <button onClick={() => setActiveSubTab('utilization')} className={cn("px-4 py-1.5 rounded-full text-sm font-bold transition-all", activeSubTab === 'utilization' ? "bg-blue-600 text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200")}>Utilization Data</button>
               </div>
            </div>`;
            
    code = code.replace(searchNav, replaceNav);
    
    // Conditional rendering for the body
    const searchBody = `          {/* Filters */}`;
    
    const replaceBody = `          {activeSubTab === 'utilization' ? (
             <UtilizationDashboard microEnterprises={microEnterprises} />
          ) : (
             <>
          {/* Filters */}`;
          
    code = code.replace(searchBody, replaceBody);
    
    // We also need to close this fragment at the end of the overview tab.
    // The overview tab ends before the previewImage modal.
    const searchFooter = `        {previewImage && (`;
    const replaceFooter = `        </>
          )}
          
        {previewImage && (`;
        
    code = code.replace(searchFooter, replaceFooter);
    
    fs.writeFileSync('src/pages/admin/VillageGIS.tsx', code);
    console.log("Patched ProcessingHubsDashboard");
} else {
    console.log("Not found");
}
