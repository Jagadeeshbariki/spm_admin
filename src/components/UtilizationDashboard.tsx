
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Search, MapPin, Package, Users, Database, ChevronDown, ChevronRight, Activity, Calendar, FileText } from 'lucide-react';

export function UtilizationDashboard({ microEnterprises = [] }: { microEnterprises: any[] }) {
  const [selectedBlock, setSelectedBlock] = useState('All Blocks');
  const [searchTerm, setSearchTerm] = useState('');

  const blocks = useMemo(() => {
    const list = new Set<string>();
    microEnterprises.forEach(m => {
       const b = m.table_list_pd?.block;
       if (b) list.add(b.toLowerCase());
    });
    return Array.from(list).sort();
  }, [microEnterprises]);

  const filteredData = useMemo(() => {
    return microEnterprises.filter(m => {
       const b = m.table_list_pd?.block?.toLowerCase() || '';
       const matchesBlock = selectedBlock === 'All Blocks' || b === selectedBlock.toLowerCase();
       
       const farmerName = (m.table_list_pd1?.farmer_name || '').toLowerCase();
       const matchesSearch = !searchTerm || farmerName.includes(searchTerm.toLowerCase());
       
       return matchesBlock && matchesSearch;
    });
  }, [microEnterprises, selectedBlock, searchTerm]);

  const blockStats = useMemo(() => {
    const counts = { logs: 0, units: 0, entrepreneurs: 0, processingQty: 0 };
    const eSet = new Set();
    const uSet = new Set();
    filteredData.forEach(m => {
       counts.logs += 1;
       const fId = m.table_list_pd1?.farmer_select;
       const eName = m.table_list_pd1?.farmer_name;
       if (fId) uSet.add(fId);
       if (eName) eSet.add(eName);
       const qty = parseFloat(m.table_list_pd2?.processing_qty_kgs || m.table_list_md?.millet_qty_processed_kgs || 0);
       if (!isNaN(qty)) counts.processingQty += qty;
    });
    counts.units = uSet.size;
    counts.entrepreneurs = eSet.size;
    return counts;
  }, [filteredData]);

  const unitTypeData = useMemo(() => {
     const counts: Record<string, number> = {};
     filteredData.forEach(m => {
        const t = m.table_list_pd1?.Machine_type || m.table_list_pd1?.two_in_one_type || 'Unknown';
        counts[t] = (counts[t] || 0) + 1;
     });
     return Object.keys(counts).map(k => ({ name: k.replace(/_/g, ' '), value: counts[k] })).sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const qtyData = useMemo(() => {
     const counts: Record<string, number> = {};
     filteredData.forEach(m => {
        const t = m.table_list_pd1?.Machine_type || m.table_list_pd1?.two_in_one_type || 'Unknown';
        const qty = parseFloat(m.table_list_pd2?.processing_qty_kgs || m.table_list_md?.millet_qty_processed_kgs || 0);
        if (!isNaN(qty)) counts[t] = (counts[t] || 0) + qty;
     });
     return Object.keys(counts).map(k => ({ name: k.replace(/_/g, ' '), value: counts[k] })).sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const blockWiseData = useMemo(() => {
    const blocksMap: Record<string, { name: string, units: Set<string>, entrepreneurs: Set<string>, logs: number, qty: number }> = {};
    filteredData.forEach(m => {
       const b = m.table_list_pd?.block || 'Unknown';
       if (!blocksMap[b]) blocksMap[b] = { name: b, units: new Set(), entrepreneurs: new Set(), logs: 0, qty: 0 };
       
       blocksMap[b].logs += 1;
       
       const uId = m.table_list_pd1?.farmer_select;
       if (uId) blocksMap[b].units.add(uId);
       
       const eName = m.table_list_pd1?.farmer_name;
       if (eName) blocksMap[b].entrepreneurs.add(eName);
       
       const qty = parseFloat(m.table_list_pd2?.processing_qty_kgs || m.table_list_md?.millet_qty_processed_kgs || 0);
       if (!isNaN(qty)) blocksMap[b].qty += qty;
    });
    
    return Object.values(blocksMap).map(b => ({
       name: b.name,
       units: b.units.size,
       logs: b.logs,
       entrepreneurs: b.entrepreneurs.size,
       qty: b.qty
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredData]);

  const entrepreneurGroups = useMemo(() => {
     const groups: Record<string, any> = {};
     
     filteredData.forEach(m => {
         const name = m.table_list_pd1?.farmer_name || '-';
         if (!groups[name]) {
             groups[name] = {
                 name,
                 block: m.table_list_pd?.block || '-',
                 gp: m.table_list_pd?.gp || '-',
                 village: m.table_list_pd?.village || '-',
                 farmer_id: m.table_list_pd1?.farmer_select || '-',
                 machine: m.table_list_pd1?.Machine_type || m.table_list_pd1?.two_in_one_type || '-',
                 date: m.table_list_pd1?.Date_issued || '-',
                 years: {}
             };
         }
         
         const dStr = m.table_list_pd1?.processing_date || m.table_list_md?.mixi_process_date;
         let year = 'Unknown';
         let monthName = 'Unknown';
         let monthNum = -1;
         if (dStr) {
             const d = new Date(dStr);
             if (!isNaN(d.getTime())) {
                 year = d.getFullYear().toString();
                 monthName = d.toLocaleString('default', { month: 'short' });
                 monthNum = d.getMonth();
             }
         }
         
         const qty = parseFloat(m.table_list_pd2?.processing_qty_kgs || m.table_list_md?.millet_qty_processed_kgs || 0);
         
         const pf = m.table_list_pd2?.processing_farmer;
         let farmers = 0;
         if (pf) {
             const strPf = String(pf).trim();
             const num = Number(strPf);
             if (!isNaN(num) && num > 0) {
                 farmers = num;
             } else {
                 farmers = strPf.split(',').filter(x => x.trim().length > 0).length;
             }
         } else if (qty > 0) {
             farmers = 1; // Fallback if qty exists but no farmer specified
         }
         
         if (!groups[name].years[year]) {
             groups[name].years[year] = {
                 year,
                 months: {}
             };
         }
         
         if (!groups[name].years[year].months[monthName]) {
             groups[name].years[year].months[monthName] = {
                 monthName,
                 monthNum,
                 qty: 0,
                 farmers: 0
             };
         }
         
         if (!isNaN(qty)) groups[name].years[year].months[monthName].qty += qty;
         if (!isNaN(farmers)) groups[name].years[year].months[monthName].farmers += farmers;
     });
     
     return Object.values(groups).map(g => {
         const sortedYears = Object.values(g.years).sort((a: any,b: any) => b.year.localeCompare(a.year));
         sortedYears.forEach((y: any) => {
             y.monthData = Object.values(y.months).sort((a: any,b: any) => a.monthNum - b.monthNum);
         });
         return {
             ...g,
             years: sortedYears
         };
     }).sort((a,b) => a.name.localeCompare(b.name));
  }, [filteredData]);

  return (
    <div className="flex flex-col gap-4 w-full">
       <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-3">
         <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none font-medium focus:ring-2 focus:ring-blue-500 capitalize" value={selectedBlock} onChange={(e) => setSelectedBlock(e.target.value)}>
           <option value="All Blocks">All Blocks</option>
           {blocks.map(b => <option key={b} value={b} className="capitalize">{b}</option>)}
         </select>
         <div className="relative">
           <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
           <input type="text" placeholder="Search entrepreneur..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none font-medium focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
         </div>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
               <Database className="w-5 h-5 text-blue-500" />
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unique Units</p>
            </div>
            <p className="text-3xl font-black text-slate-800">{blockStats.units}</p>
            <p className="text-[10px] text-slate-500 mt-1">Distinct machines deployed</p>
         </div>
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
               <FileText className="w-5 h-5 text-indigo-500" />
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Processing Logs</p>
            </div>
            <p className="text-3xl font-black text-slate-800">{blockStats.logs}</p>
            <p className="text-[10px] text-slate-500 mt-1">Total operational records</p>
         </div>
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
               <Users className="w-5 h-5 text-emerald-500" />
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Entrepreneurs</p>
            </div>
            <p className="text-3xl font-black text-slate-800">{blockStats.entrepreneurs}</p>
         </div>
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-2">
               <Package className="w-5 h-5 text-purple-500" />
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Processing Qty (Kgs)</p>
            </div>
            <p className="text-3xl font-black text-slate-800">{blockStats.processingQty}</p>
         </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
       </div>

       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
             <h3 className="font-bold text-slate-800">Block-wise Units Summary</h3>
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase text-xs">
                   <tr>
                      <th className="px-4 py-3">Block Name</th>
                      <th className="px-4 py-3 text-right">Unique Units</th>
                      <th className="px-4 py-3 text-right">Processing Logs</th>
                      <th className="px-4 py-3 text-right">Entrepreneurs</th>
                      <th className="px-4 py-3 text-right">Process Qty (Kgs)</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {blockWiseData.map((b, i) => (
                       <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-4 py-3 font-medium text-slate-700 capitalize">{b.name}</td>
                           <td className="px-4 py-3 text-right">{b.units}</td>
                           <td className="px-4 py-3 text-right text-slate-500">{b.logs}</td>
                           <td className="px-4 py-3 text-right">{b.entrepreneurs}</td>
                           <td className="px-4 py-3 text-right font-semibold text-emerald-600">{b.qty}</td>
                       </tr>
                   ))}
                   {blockWiseData.length === 0 && (
                       <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No data found</td></tr>
                   )}
                </tbody>
             </table>
          </div>
       </div>

       <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
             <h3 className="font-bold text-slate-800">Entrepreneur Utilization History</h3>
             <p className="text-xs text-slate-500">Expand an entrepreneur to view year and month wise processing data</p>
          </div>
          
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[600px] custom-scrollbar">
             {entrepreneurGroups.length === 0 && (
                 <div className="p-8 text-center text-slate-500">No utilization data found</div>
             )}
             
             {entrepreneurGroups.map((g, i) => (
                 <EntrepreneurAccordion key={i} group={g} />
             ))}
          </div>
       </div>
    </div>
  );
}

function EntrepreneurAccordion({ group }: { group: any, key?: any }) {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <div className="flex flex-col">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                        <Users className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 flex items-center gap-2">
                            {group.name}
                            {group.farmer_id !== '-' && <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{group.farmer_id}</span>}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                            {group.village !== '-' && <span className="capitalize">Village: {group.village}</span>}
                            {group.gp !== '-' && <><span className="w-1 h-1 rounded-full bg-slate-300"></span><span className="capitalize">GP: {group.gp}</span></>}
                            {group.block !== '-' && <><span className="w-1 h-1 rounded-full bg-slate-300"></span><span className="capitalize">Block: {group.block}</span></>}
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="capitalize">{group.machine.replace(/_/g, ' ')}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </div>
            </button>
            
            {isOpen && (
                <div className="bg-slate-50/50 px-4 py-3 border-t border-slate-100 pl-14 space-y-3">
                    {group.years.length === 0 ? (
                        <p className="text-xs text-slate-500">No date recorded.</p>
                    ) : (
                        group.years.map((y: any, idx: number) => (
                            <YearAccordion key={idx} yearData={y} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

function YearAccordion({ yearData }: { yearData: any, key?: any }) {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <div className="flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none bg-slate-50 border-b border-slate-100"
            >
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-700">{yearData.year}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{yearData.monthData.length} active months</span>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </div>
            </button>
            
            {isOpen && (
                <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white">
                    <div className="flex flex-col">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Package className="w-4 h-4 text-purple-500" />
                            Quantity Processed (Kgs)
                        </h4>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={yearData.monthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="monthName" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                                    <Bar dataKey="qty" name="Quantity (Kgs)" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    <div className="flex flex-col">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-blue-500" />
                            Service Received Members
                        </h4>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={yearData.monthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="monthName" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                                    <Line type="monotone" dataKey="farmers" name="Service Received Members" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
