import re

with open('src/pages/admin/BYPDashboard.tsx', 'r') as f:
    content = f.read()

stats_code = """
  // Compute Stats for Farmer & Geographic Coverage (Page 2)
  const coverageStats = useMemo(() => {
    const blockFarmers: Record<string, Set<string>> = {};
    const clusterFarmers: Record<string, Set<string>> = {};
    const villageFarmers: Record<string, Set<string>> = {};
    const nsBfeCount = { NS: 0, BFE: 0 };
    
    // For the table: Group by Block-Cluster-GP-Village
    const locationTable: Record<string, { block: string, cluster: string, gp: string, village: string, ns: number, bfe: number, total: number, _farmers: Set<string> }> = {};

    const countedFarmers = new Set<string>();

    filteredData.forEach(item => {
      const p = item.personal_info || {};
      const fName = String(p.NS_farmer_name || p.BFE_farmer_name || 'Unknown').trim();
      const ft = String(item.table_list_df?.byp_farmer_type || 'Unknown').trim();
      
      const b = String(item.location_info?.block || 'Unknown').trim();
      const c = String(item.location_info?.cluster || 'Unknown').trim();
      const g = String(item.location_info?.gp || 'Unknown').trim();
      const v = String(item.location_info?.village || 'Unknown').trim();

      if (fName && fName !== 'null' && fName !== 'undefined') {
        if (!blockFarmers[b]) blockFarmers[b] = new Set();
        blockFarmers[b].add(fName);

        if (!clusterFarmers[c]) clusterFarmers[c] = new Set();
        clusterFarmers[c].add(fName);

        if (!villageFarmers[v]) villageFarmers[v] = new Set();
        villageFarmers[v].add(fName);

        if (!countedFarmers.has(fName)) {
           if (ft === 'NS') nsBfeCount.NS++;
           if (ft === 'BFE') nsBfeCount.BFE++;
           countedFarmers.add(fName);
        }

        const locKey = `${b}-${c}-${g}-${v}`;
        if (!locationTable[locKey]) {
          locationTable[locKey] = { block: b, cluster: c, gp: g, village: v, ns: 0, bfe: 0, total: 0, _farmers: new Set() };
        }
        if (!locationTable[locKey]._farmers.has(fName)) {
          locationTable[locKey]._farmers.add(fName);
          locationTable[locKey].total++;
          if (ft === 'NS') locationTable[locKey].ns++;
          if (ft === 'BFE') locationTable[locKey].bfe++;
        }
      }
    });

    const blockData = Object.entries(blockFarmers).map(([name, set]) => ({ name, value: set.size })).sort((a,b) => b.value - a.value);
    const clusterData = Object.entries(clusterFarmers).map(([name, set]) => ({ name, value: set.size })).sort((a,b) => b.value - a.value);
    const villageData = Object.entries(villageFarmers).map(([name, set]) => ({ name, value: set.size })).sort((a,b) => b.value - a.value).slice(0, 20); // Top 20

    const nsBfeData = [
      { name: 'NS', value: nsBfeCount.NS },
      { name: 'BFE', value: nsBfeCount.BFE }
    ].filter(d => d.value > 0);

    const tableData = Object.values(locationTable).sort((a, b) => a.block.localeCompare(b.block) || a.cluster.localeCompare(b.cluster) || a.gp.localeCompare(b.gp) || a.village.localeCompare(b.village));

    return {
      blockData,
      clusterData,
      villageData,
      nsBfeData,
      tableData
    };
  }, [filteredData]);

"""

if "const COLORS = ['#3b82f6'" not in content:
    content = content.replace("  const toggleFilter =", stats_code + "\n  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];\n\n  const toggleFilter =")
else:
    content = content.replace("  const COLORS = ['#3b82f6'", stats_code + "\n  const COLORS = ['#3b82f6'")

page2_jsx = """
        {activeTab === 'coverage' && (
          <div className="space-y-4">
            {/* Top Row: Block & NS/BFE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-[350px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Farmers by Block</h3>
                <div className="flex-1 min-h-0">
                  {coverageStats.blockData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={coverageStats.blockData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                          width={100}
                        />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} isAnimationActive={false}>
                          <LabelList dataKey="value" position="right" style={{ fill: '#64748b', fontSize: 12, fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-[350px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-sm mb-4">NS vs BFE</h3>
                <div className="flex-1 min-h-0 relative">
                  {coverageStats.nsBfeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                        <Pie
                          data={coverageStats.nsBfeData}
                          cx="50%"
                          cy="50%"
                          innerRadius="50%"
                          outerRadius="80%"
                          paddingAngle={2}
                          dataKey="value"
                          isAnimationActive={false}
                          labelLine={false}
                        >
                          {coverageStats.nsBfeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === 'NS' ? '#3b82f6' : '#10b981'} />
                          ))}
                        </Pie>
                        <RechartsTooltip isAnimationActive={false} wrapperStyle={{ pointerEvents: 'none' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Second Row: Cluster & Village */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-[400px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Farmers by Cluster</h3>
                <div className="flex-1 min-h-0">
                  {coverageStats.clusterData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={coverageStats.clusterData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          width={120}
                        />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false}>
                          <LabelList dataKey="value" position="right" style={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 h-[400px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Farmers by Village (Top 20)</h3>
                <div className="flex-1 min-h-0">
                  {coverageStats.villageData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={coverageStats.villageData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          width={120}
                        />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={12} isAnimationActive={false}>
                          <LabelList dataKey="value" position="right" style={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Third Row: Geographic Details Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <h3 className="font-bold text-slate-800 text-sm mb-4">Coverage Details</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-slate-500 bg-slate-50 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3 border-b border-slate-200">Block</th>
                      <th className="px-4 py-3 border-b border-slate-200">Cluster</th>
                      <th className="px-4 py-3 border-b border-slate-200">GP</th>
                      <th className="px-4 py-3 border-b border-slate-200">Village</th>
                      <th className="px-4 py-3 border-b border-slate-200 text-center">NS</th>
                      <th className="px-4 py-3 border-b border-slate-200 text-center">BFE</th>
                      <th className="px-4 py-3 border-b border-slate-200 text-center bg-blue-50/50">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {coverageStats.tableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2">{row.block}</td>
                        <td className="px-4 py-2">{row.cluster}</td>
                        <td className="px-4 py-2">{row.gp}</td>
                        <td className="px-4 py-2 font-medium">{row.village}</td>
                        <td className="px-4 py-2 text-center text-blue-600 font-medium">{row.ns > 0 ? row.ns : '-'}</td>
                        <td className="px-4 py-2 text-center text-emerald-600 font-medium">{row.bfe > 0 ? row.bfe : '-'}</td>
                        <td className="px-4 py-2 text-center font-bold bg-blue-50/30 text-slate-900">{row.total}</td>
                      </tr>
                    ))}
                    {coverageStats.tableData.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          No geographic coverage data found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
"""

content = content.replace("{/* Placeholders for other tabs */}", page2_jsx + "\n        {/* Placeholders for other tabs */}")

with open('src/pages/admin/BYPDashboard.tsx', 'w') as f:
    f.write(content)

print("Added Page 2!")
