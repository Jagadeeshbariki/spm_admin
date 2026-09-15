import re

with open('src/pages/admin/BYPDashboard.tsx', 'r') as f:
    content = f.read()

income_stats = """
  // Compute Stats for Production & Income (Page 4)
  const incomeStats = useMemo(() => {
    let totalBirdSaleIncome = 0;
    let totalMeatSaleIncome = 0;
    let totalBirdsSold = 0;
    let totalMeatSoldKG = 0;
    let totalOwnConsumptionValue = 0;
    let totalEggConsumption = 0;
    const farmersWithIncome = new Set<string>();

    const monthlyIncome: Record<string, { birdIncome: number, meatIncome: number, totalIncome: number }> = {};
    const blockIncome: Record<string, { birdIncome: number, meatIncome: number, totalIncome: number, uniqueFarmers: Set<string> }> = {};
    
    const scatterData: any[] = [];
    const tableData: any[] = [];

    filteredData.forEach(item => {
      const p = item.personal_info || {};
      const fName = String(p.NS_farmer_name || p.BFE_farmer_name || 'Unknown').trim();
      const b = String(item.location_info?.block || 'Unknown').trim();
      const v = String(item.location_info?.village || 'Unknown').trim();
      
      const iInfo = item.Income_info || {};
      const birdsSold = parseInt(iInfo.mdc_byp_birds_sold || 0, 10) || 0;
      const birdIncome = parseInt(iInfo.mdc_byp_income_birds_sold || 0, 10) || 0;
      const meatKgs = parseInt(iInfo.mdc_byp_chicken_sold_kgs || 0, 10) || 0;
      const meatIncome = parseInt(iInfo.mdc_byp_chicken_sold_income || 0, 10) || 0;
      const ownConsumpVal = parseInt(iInfo.mdc_byp_birds_own_consumption_value_rs || 0, 10) || 0;
      const eggConsump = parseInt(iInfo.mdc_byp_eggs_own_consumption || 0, 10) || 0;
      
      const totalInc = birdIncome + meatIncome;

      if (totalInc > 0) {
        if (fName && fName !== 'null' && fName !== 'undefined') {
          farmersWithIncome.add(fName);
        }
      }

      totalBirdSaleIncome += birdIncome;
      totalMeatSaleIncome += meatIncome;
      totalBirdsSold += birdsSold;
      totalMeatSoldKG += meatKgs;
      totalOwnConsumptionValue += ownConsumpVal;
      totalEggConsumption += eggConsump;

      // Time series
      const m = String(item.survey_date || '').substring(0, 7);
      if (m && m !== 'undefin' && m !== 'null' && m !== 'Unknown') {
        if (!monthlyIncome[m]) monthlyIncome[m] = { birdIncome: 0, meatIncome: 0, totalIncome: 0 };
        monthlyIncome[m].birdIncome += birdIncome;
        monthlyIncome[m].meatIncome += meatIncome;
        monthlyIncome[m].totalIncome += totalInc;
      }

      // Block-level
      if (!blockIncome[b]) blockIncome[b] = { birdIncome: 0, meatIncome: 0, totalIncome: 0, uniqueFarmers: new Set() };
      blockIncome[b].birdIncome += birdIncome;
      blockIncome[b].meatIncome += meatIncome;
      blockIncome[b].totalIncome += totalInc;
      if (totalInc > 0 && fName && fName !== 'null' && fName !== 'undefined') {
        blockIncome[b].uniqueFarmers.add(fName);
      }

      // Scatter data (only if there are birds sold)
      if (birdsSold > 0) {
        scatterData.push({
          birdsSold,
          birdIncome,
          farmer: fName
        });
      }

      // Table data
      if (totalInc > 0 || ownConsumpVal > 0) {
        tableData.push({
          block: b,
          village: v,
          farmer: fName,
          birdsSold,
          birdIncome,
          meatKgs,
          meatIncome,
          totalIncome: totalInc,
          ownConsumpVal
        });
      }
    });

    const totalBYPIncome = totalBirdSaleIncome + totalMeatSaleIncome;
    const avgIncome = farmersWithIncome.size > 0 ? totalBYPIncome / farmersWithIncome.size : 0;

    const monthlyTrendData = Object.entries(monthlyIncome).map(([date, data]) => ({ date, ...data })).sort((a,b) => a.date.localeCompare(b.date));
    
    const blockIncomeData = Object.entries(blockIncome)
      .map(([name, data]) => ({ 
        name, 
        birdIncome: data.birdIncome, 
        meatIncome: data.meatIncome,
        avgIncome: data.uniqueFarmers.size > 0 ? (data.totalIncome / data.uniqueFarmers.size) : 0
      }))
      .sort((a,b) => (b.birdIncome + b.meatIncome) - (a.birdIncome + a.meatIncome));

    return {
      totalBirdSaleIncome,
      totalMeatSaleIncome,
      totalBYPIncome,
      avgIncome,
      totalBirdsSold,
      totalMeatSoldKG,
      totalOwnConsumptionValue,
      totalEggConsumption,
      monthlyTrendData,
      blockIncomeData,
      scatterData,
      tableData: tableData.sort((a,b) => b.totalIncome - a.totalIncome)
    };
  }, [filteredData]);
"""

if "const incomeStats = useMemo(() => {" not in content:
    content = content.replace("  const COLORS = ['#3b82f6'", income_stats + "\n  const COLORS = ['#3b82f6'")

page4_jsx = """
        {activeTab === 'income' && (
          <div className="space-y-3">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Bird Sale Inc.</div>
                <div className="text-lg font-black text-blue-600">₹{incomeStats.totalBirdSaleIncome.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Meat Sale Inc.</div>
                <div className="text-lg font-black text-rose-600">₹{incomeStats.totalMeatSaleIncome.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 bg-emerald-50 border-emerald-100">
                <div className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Total Income</div>
                <div className="text-xl font-black text-emerald-700">₹{incomeStats.totalBYPIncome.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Avg / Farmer</div>
                <div className="text-lg font-black text-slate-800">₹{Math.round(incomeStats.avgIncome).toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Birds Sold</div>
                <div className="text-lg font-black text-slate-800">{incomeStats.totalBirdsSold.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Meat Sold (KG)</div>
                <div className="text-lg font-black text-slate-800">{incomeStats.totalMeatSoldKG.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Own Consump. (₹)</div>
                <div className="text-lg font-black text-amber-600">₹{incomeStats.totalOwnConsumptionValue.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Egg Consump.</div>
                <div className="text-lg font-black text-amber-600">{incomeStats.totalEggConsumption.toLocaleString()}</div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Income Trend (Line) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Total Income Trend</h3>
                <div className="flex-1 min-h-0">
                  {incomeStats.monthlyTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <LineChart data={incomeStats.monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="totalIncome" name="Total Income" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>

              {/* Income Source (Stacked Bar) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Income Source (Bird vs Meat)</h3>
                <div className="flex-1 min-h-0">
                  {incomeStats.monthlyTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={incomeStats.monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={20} wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
                        <Bar dataKey="birdIncome" name="Bird Sale Income" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={32} isAnimationActive={false} />
                        <Bar dataKey="meatIncome" name="Meat Sale Income" stackId="a" fill="#e11d48" radius={[4, 4, 0, 0]} barSize={32} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Income by Block (Stacked Bar) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Income by Block</h3>
                <div className="flex-1 min-h-0">
                  {incomeStats.blockIncomeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={incomeStats.blockIncomeData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={80} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={20} wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
                        <Bar dataKey="birdIncome" name="Bird Income" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={16} isAnimationActive={false} />
                        <Bar dataKey="meatIncome" name="Meat Income" stackId="a" fill="#e11d48" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>

              {/* Avg Income per Farmer (Bar) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Avg Income per Farmer</h3>
                <div className="flex-1 min-h-0">
                  {incomeStats.blockIncomeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={incomeStats.blockIncomeData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={80} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="avgIncome" name="Avg Income" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false}>
                          <LabelList dataKey="avgIncome" position="right" formatter={(v: number) => `₹${Math.round(v)}`} style={{ fill: '#64748b', fontSize: 9, fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>
              
              {/* Birds Sold vs Income (Scatter) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Birds Sold vs Income</h3>
                <div className="flex-1 min-h-0">
                  {incomeStats.scatterData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" dataKey="birdsSold" name="Birds Sold" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <YAxis type="number" dataKey="birdIncome" name="Income (₹)" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <ZAxis dataKey="farmer" name="Farmer" />
                        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Scatter name="Sales" data={incomeStats.scatterData} fill="#8b5cf6" isAnimationActive={false} />
                      </ScatterChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Income Detail Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
              <h3 className="font-bold text-slate-800 text-xs mb-3">Production & Income Table</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-64 custom-scrollbar">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="text-[10px] text-slate-500 bg-slate-50 uppercase font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 border-b border-slate-200">Block</th>
                      <th className="px-3 py-2 border-b border-slate-200">Village</th>
                      <th className="px-3 py-2 border-b border-slate-200">Farmer</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Birds Sold</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Bird Inc.</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Meat (KG)</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Meat Inc.</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right bg-emerald-50 text-emerald-700">Total Inc.</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Own Cons. (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {incomeStats.tableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2">{row.block}</td>
                        <td className="px-3 py-2">{row.village}</td>
                        <td className="px-3 py-2 font-medium">{row.farmer}</td>
                        <td className="px-3 py-2 text-right">{row.birdsSold}</td>
                        <td className="px-3 py-2 text-right text-blue-600 font-medium">₹{row.birdIncome}</td>
                        <td className="px-3 py-2 text-right">{row.meatKgs}</td>
                        <td className="px-3 py-2 text-right text-rose-600 font-medium">₹{row.meatIncome}</td>
                        <td className="px-3 py-2 text-right bg-emerald-50/50 font-bold text-slate-900">₹{row.totalIncome}</td>
                        <td className="px-3 py-2 text-right text-amber-600">₹{row.ownConsumpVal}</td>
                      </tr>
                    ))}
                    {incomeStats.tableData.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-3 py-6 text-center text-slate-400">
                          No income records found.
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

content = content.replace("{/* Placeholders for other tabs */}", page4_jsx + "\n        {/* Placeholders for other tabs */}")

with open('src/pages/admin/BYPDashboard.tsx', 'w') as f:
    f.write(content)

print("Added Page 4 successfully!")
