import re

with open('src/pages/admin/BYPDashboard.tsx', 'r') as f:
    content = f.read()

# Update tabs
content = content.replace(
    "{ id: 'mortality', name: '5. Mortality & Performance', icon: AlertTriangle }",
    "{ id: 'population', name: '5. Bird Population & Production', icon: Bird }"
)

population_stats = """
  // Compute Stats for Bird Population & Production (Page 5)
  const populationStats = useMemo(() => {
    let totalBirds = 0;
    let totalHens = 0;
    let totalCocks = 0;
    let totalGrowers = 0;
    let totalChicks = 0;
    let totalBirdsAdded = 0;
    let totalBirdsSold = 0;
    let totalMeatSoldKG = 0;

    const blockPop: Record<string, { hens: number, cocks: number, growers: number, chicks: number, total: number }> = {};
    const monthlyTrend: Record<string, { added: number, sold: number, meat: number }> = {};
    const tableData: any[] = [];

    filteredData.forEach(item => {
      const p = item.personal_info || {};
      const fName = String(p.NS_farmer_name || p.BFE_farmer_name || 'Unknown').trim();
      const b = String(item.location_info?.block || 'Unknown').trim();
      const c = String(item.location_info?.cluster || 'Unknown').trim();
      const v = String(item.location_info?.village || 'Unknown').trim();
      
      const sInfo = item.service_info?.Birds_status || {};
      const hens = parseInt(sInfo.mdc_byp_adult_hens || 0, 10) || 0;
      const cocks = parseInt(sInfo.mdc_byp_adult_cocks || 0, 10) || 0;
      const growers = parseInt(sInfo.mdc_byp_growers || 0, 10) || 0;
      const chicks = parseInt(sInfo.mdc_byp_chicks || 0, 10) || 0;
      const birds = parseInt(sInfo.mdc_byp_total_birds || 0, 10) || (hens + cocks + growers + chicks);
      const added = parseInt(sInfo.mdc_byp_birds_added_this_month || 0, 10) || 0;

      const iInfo = item.Income_info || {};
      const sold = parseInt(iInfo.mdc_byp_birds_sold || 0, 10) || 0;
      const meatKgs = parseInt(iInfo.mdc_byp_chicken_sold_kgs || 0, 10) || 0;

      totalBirds += birds;
      totalHens += hens;
      totalCocks += cocks;
      totalGrowers += growers;
      totalChicks += chicks;
      totalBirdsAdded += added;
      totalBirdsSold += sold;
      totalMeatSoldKG += meatKgs;

      if (!blockPop[b]) {
        blockPop[b] = { hens: 0, cocks: 0, growers: 0, chicks: 0, total: 0 };
      }
      blockPop[b].hens += hens;
      blockPop[b].cocks += cocks;
      blockPop[b].growers += growers;
      blockPop[b].chicks += chicks;
      blockPop[b].total += birds;

      const m = String(item.survey_date || '').substring(0, 7);
      if (m && m !== 'undefin' && m !== 'null' && m !== 'Unknown') {
        if (!monthlyTrend[m]) monthlyTrend[m] = { added: 0, sold: 0, meat: 0 };
        monthlyTrend[m].added += added;
        monthlyTrend[m].sold += sold;
        monthlyTrend[m].meat += meatKgs;
      }

      if (birds > 0 || added > 0 || sold > 0 || meatKgs > 0) {
        tableData.push({
          block: b,
          cluster: c,
          village: v,
          farmer: fName,
          hens, cocks, growers, chicks,
          totalBirds: birds,
          birdsAdded: added,
          birdsSold: sold,
          meatKgs
        });
      }
    });

    const blockCompositionData = Object.entries(blockPop)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a,b) => b.total - a.total);

    const monthlyTrendData = Object.entries(monthlyTrend)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a,b) => a.date.localeCompare(b.date));

    return {
      totalBirds, totalHens, totalCocks, totalGrowers, totalChicks,
      totalBirdsAdded, totalBirdsSold, totalMeatSoldKG,
      blockCompositionData,
      monthlyTrendData,
      tableData: tableData.sort((a,b) => b.totalBirds - a.totalBirds)
    };
  }, [filteredData]);
"""

if "const populationStats = useMemo(() => {" not in content:
    content = content.replace("  const COLORS = ['#3b82f6'", population_stats + "\n  const COLORS = ['#3b82f6'")

page5_jsx = """
        {activeTab === 'population' && (
          <div className="space-y-3">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 bg-blue-50 border-blue-100">
                <div className="text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Total Birds</div>
                <div className="text-xl font-black text-blue-700">{populationStats.totalBirds.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Hens</div>
                <div className="text-lg font-black text-slate-800">{populationStats.totalHens.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Cocks</div>
                <div className="text-lg font-black text-slate-800">{populationStats.totalCocks.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Growers</div>
                <div className="text-lg font-black text-slate-800">{populationStats.totalGrowers.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Chicks</div>
                <div className="text-lg font-black text-amber-600">{populationStats.totalChicks.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Birds Added</div>
                <div className="text-lg font-black text-emerald-600">+{populationStats.totalBirdsAdded.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Birds Sold</div>
                <div className="text-lg font-black text-rose-600">-{populationStats.totalBirdsSold.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Meat Sold (KG)</div>
                <div className="text-lg font-black text-slate-800">{populationStats.totalMeatSoldKG.toLocaleString()}</div>
              </div>
            </div>

            {/* Charts Row 1: Population Composition & by Block */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Bird Population Composition (Stacked Bar) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Bird Population Composition (by Block)</h3>
                <div className="flex-1 min-h-0">
                  {populationStats.blockCompositionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={populationStats.blockCompositionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={20} wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
                        <Bar dataKey="hens" name="Hens" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={32} isAnimationActive={false} />
                        <Bar dataKey="cocks" name="Cocks" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={32} isAnimationActive={false} />
                        <Bar dataKey="growers" name="Growers" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} barSize={32} isAnimationActive={false} />
                        <Bar dataKey="chicks" name="Chicks" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>

              {/* Bird Population by Block (Horizontal Bar) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Total Bird Population by Block</h3>
                <div className="flex-1 min-h-0">
                  {populationStats.blockCompositionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={populationStats.blockCompositionData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={80} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="total" name="Total Birds" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false}>
                          <LabelList dataKey="total" position="right" style={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Charts Row 2: Trends & Meat */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Birds Added Trend (Line) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Birds Added Trend</h3>
                <div className="flex-1 min-h-0">
                  {populationStats.monthlyTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <LineChart data={populationStats.monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="added" name="Birds Added" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>

              {/* Birds Sold Trend (Line) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Birds Sold Trend</h3>
                <div className="flex-1 min-h-0">
                  {populationStats.monthlyTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <LineChart data={populationStats.monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="sold" name="Birds Sold" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>

              {/* Meat Production (Column) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Meat Production Trend</h3>
                <div className="flex-1 min-h-0">
                  {populationStats.monthlyTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={populationStats.monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="meat" name="Meat Sold (KG)" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
                          <LabelList dataKey="meat" position="top" style={{ fontSize: '10px', fill: '#64748b', fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
              <h3 className="font-bold text-slate-800 text-xs mb-3">Population & Production Log</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-64 custom-scrollbar">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="text-[10px] text-slate-500 bg-slate-50 uppercase font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 border-b border-slate-200">Block</th>
                      <th className="px-3 py-2 border-b border-slate-200">Cluster</th>
                      <th className="px-3 py-2 border-b border-slate-200">Village</th>
                      <th className="px-3 py-2 border-b border-slate-200">Farmer</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Hens</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Cocks</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Growers</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Chicks</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right bg-blue-50 text-blue-700">Total Birds</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right text-emerald-600">Added</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right text-rose-600">Sold</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right text-orange-600">Meat (KG)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {populationStats.tableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2">{row.block}</td>
                        <td className="px-3 py-2 text-slate-500">{row.cluster}</td>
                        <td className="px-3 py-2">{row.village}</td>
                        <td className="px-3 py-2 font-medium">{row.farmer}</td>
                        <td className="px-3 py-2 text-right">{row.hens}</td>
                        <td className="px-3 py-2 text-right">{row.cocks}</td>
                        <td className="px-3 py-2 text-right">{row.growers}</td>
                        <td className="px-3 py-2 text-right">{row.chicks}</td>
                        <td className="px-3 py-2 text-right bg-blue-50/50 font-bold text-slate-900">{row.totalBirds}</td>
                        <td className="px-3 py-2 text-right text-emerald-600 font-medium">{row.birdsAdded > 0 ? `+${row.birdsAdded}` : '-'}</td>
                        <td className="px-3 py-2 text-right text-rose-600 font-medium">{row.birdsSold > 0 ? `-${row.birdsSold}` : '-'}</td>
                        <td className="px-3 py-2 text-right text-orange-600 font-medium">{row.meatKgs > 0 ? row.meatKgs : '-'}</td>
                      </tr>
                    ))}
                    {populationStats.tableData.length === 0 && (
                      <tr>
                        <td colSpan={12} className="px-3 py-6 text-center text-slate-400">
                          No population records found.
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

content = content.replace("{/* Placeholders for other tabs */}", page5_jsx + "\n        {/* Placeholders for other tabs */}")

with open('src/pages/admin/BYPDashboard.tsx', 'w') as f:
    f.write(content)

print("Added Page 5 successfully!")
