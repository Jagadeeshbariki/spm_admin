const fs = require('fs');

let code = fs.readFileSync('src/components/UtilizationDashboard.tsx', 'utf8');

const targetUnitType = `  const unitTypeData = useMemo(() => {
     const counts: Record<string, number> = {};
     filteredData.forEach(m => {
        const t = m.table_list_pd1?.Machine_type || m.table_list_pd1?.two_in_one_type || 'Unknown';
        counts[t] = (counts[t] || 0) + 1;
     });
     return Object.keys(counts).map(k => ({ name: k.replace(/_/g, ' '), value: counts[k] }));
  }, [filteredData]);`;

const contentUnitType = `  const unitTypeData = useMemo(() => {
     const counts: Record<string, number> = {};
     filteredData.forEach(m => {
        const t = m.table_list_pd1?.Machine_type || m.table_list_pd1?.two_in_one_type || 'Unknown';
        counts[t] = (counts[t] || 0) + 1;
     });
     return Object.keys(counts).map(k => ({ name: k.replace(/_/g, ' '), value: counts[k] })).sort((a, b) => b.value - a.value);
  }, [filteredData]);`;

code = code.replace(targetUnitType, contentUnitType);

const targetQtyType = `  const qtyData = useMemo(() => {
     const counts: Record<string, number> = {};
     filteredData.forEach(m => {
        const t = m.table_list_pd1?.Machine_type || m.table_list_pd1?.two_in_one_type || 'Unknown';
        const qty = parseFloat(m.table_list_pd2?.processing_qty_kgs || m.table_list_md?.millet_qty_processed_kgs || 0);
        if (!isNaN(qty)) counts[t] = (counts[t] || 0) + qty;
     });
     return Object.keys(counts).map(k => ({ name: k.replace(/_/g, ' '), value: counts[k] }));
  }, [filteredData]);`;

const contentQtyType = `  const qtyData = useMemo(() => {
     const counts: Record<string, number> = {};
     filteredData.forEach(m => {
        const t = m.table_list_pd1?.Machine_type || m.table_list_pd1?.two_in_one_type || 'Unknown';
        const qty = parseFloat(m.table_list_pd2?.processing_qty_kgs || m.table_list_md?.millet_qty_processed_kgs || 0);
        if (!isNaN(qty)) counts[t] = (counts[t] || 0) + qty;
     });
     return Object.keys(counts).map(k => ({ name: k.replace(/_/g, ' '), value: counts[k] })).sort((a, b) => b.value - a.value);
  }, [filteredData]);`;

code = code.replace(targetQtyType, contentQtyType);


const targetCharts = `       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-slate-800 mb-4">Units by Machine Type</h3>
           <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={unitTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" />
                 <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                 <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                 <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40}>
                   {unitTypeData.map((e, i) => <Cell key={i} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i % 4]} />)}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
         </div>
         
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
           <h3 className="font-bold text-slate-800 mb-4">Processing Quantity by Machine Type (Kgs)</h3>
           <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={qtyData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" />
                 <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                 <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                 <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40}>
                   {qtyData.map((e, i) => <Cell key={i} fill={['#8b5cf6', '#ec4899', '#f97316', '#14b8a6'][i % 4]} />)}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
         </div>
       </div>`;

const contentCharts = `       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
           <div className="mb-4">
             <h3 className="font-bold text-slate-800">Units by Machine Type</h3>
             {unitTypeData.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                   <span className="font-semibold text-slate-700 capitalize">{unitTypeData[0].name}</span> is the most deployed unit with <span className="font-semibold text-slate-700">{unitTypeData[0].value}</span> installations.
                </p>
             )}
           </div>
           <div className="h-[350px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={unitTypeData} layout="vertical" margin={{ top: 10, right: 20, left: 100, bottom: 10 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                 <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                 <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={100} style={{textTransform: 'capitalize'}} />
                 <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                 <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={20}>
                   {unitTypeData.map((e, i) => <Cell key={i} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][i % 4]} />)}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
         </div>
         
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
           <div className="mb-4">
             <h3 className="font-bold text-slate-800">Processing Quantity by Machine Type (Kgs)</h3>
             {qtyData.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                   <span className="font-semibold text-slate-700 capitalize">{qtyData[0].name}</span> leads in processing volume with <span className="font-semibold text-emerald-600">{qtyData[0].value.toLocaleString()} Kgs</span>.
                </p>
             )}
           </div>
           <div className="h-[350px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={qtyData} layout="vertical" margin={{ top: 10, right: 20, left: 100, bottom: 10 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                 <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                 <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={100} style={{textTransform: 'capitalize'}} />
                 <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                 <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={20}>
                   {qtyData.map((e, i) => <Cell key={i} fill={['#8b5cf6', '#ec4899', '#f97316', '#14b8a6'][i % 4]} />)}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
         </div>
       </div>`;
       
code = code.replace(targetCharts, contentCharts);

fs.writeFileSync('src/components/UtilizationDashboard.tsx', code);
console.log("Patched horizontal charts");
