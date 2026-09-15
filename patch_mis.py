import re

with open('src/pages/admin/BYPDashboard.tsx', 'r') as f:
    content = f.read()

# Add 6th Tab
content = content.replace(
    "{ id: 'population', name: '5. Bird Population & Production', icon: Bird }",
    "{ id: 'population', name: '5. Bird Population & Production', icon: Bird },\n  { id: 'data-quality', name: '6. Data Quality & MIS', icon: Activity }"
)

mis_stats = """
  // Compute Stats for Data Quality & MIS (Page 6)
  const misStats = useMemo(() => {
    let totalSubmissions = filteredData.length;
    let missingRecords = 0;
    let duplicates = 0;

    const monthlySubs: Record<string, number> = {};
    const blockSubs: Record<string, number> = {};
    const completenessCounts = {
      farmer: 0,
      village: 0,
      farmerType: 0,
      vacDate: 0,
      birdsVac: 0,
      income: 0,
      mortality: 0
    };

    const farmerDates = new Set<string>();
    const uniqueVillages = new Set<string>();
    const uniqueFarmers = new Set<string>();
    
    const villageStats: Record<string, any> = {};
    const blockReporting: Record<string, { registered: Set<string>, reporting: Set<string> }> = {};

    let maxMonth = '';
    filteredData.forEach(item => {
       const m = String(item.survey_date || '').substring(0, 7);
       if (m && m !== 'undefin' && m !== 'null' && m > maxMonth) maxMonth = m;
    });
    
    let subsThisMonth = 0;

    filteredData.forEach(item => {
      const d = String(item.survey_date || 'Unknown').trim();
      const m = d.substring(0, 7);
      
      const p = item.personal_info || {};
      const fName = String(p.NS_farmer_name || p.BFE_farmer_name || '').trim();
      const b = String(item.location_info?.block || 'Unknown').trim();
      const c = String(item.location_info?.cluster || 'Unknown').trim();
      const v = String(item.location_info?.village || 'Unknown').trim();
      const fType = String(item.table_list_df?.byp_farmer_type || '').trim();

      const sInfo = item.service_info || {};
      const vacDate = sInfo.vacn_info?.date_vaccination || '';
      const birdsVac = sInfo.vacn_info?.mdc_byp_birds_vaccinated || '';
      
      const iInfo = item.Income_info || {};
      const income = iInfo.mdc_byp_income_birds_sold || iInfo.mdc_byp_chicken_sold_income || '';

      const mInfo = item.Mortality_info || {};
      const mortality = mInfo.mdc_byp_total_birds_died || '';

      if (m === maxMonth) subsThisMonth++;
      if (m && m !== 'undefin' && m !== 'null' && m !== 'Unknown') {
         monthlySubs[m] = (monthlySubs[m] || 0) + 1;
      }

      if (b && b !== 'Unknown') {
         blockSubs[b] = (blockSubs[b] || 0) + 1;
      }

      if (v && v !== 'Unknown') uniqueVillages.add(v);
      if (fName && fName !== 'null') uniqueFarmers.add(fName);

      // Duplicates
      const fdKey = `${fName}-${d}`;
      if (farmerDates.has(fdKey)) duplicates++;
      else farmerDates.add(fdKey);

      // Missing
      let isMissing = false;
      if (!fName || fName === 'null' || !v || v === 'Unknown') isMissing = true;
      if (isMissing) missingRecords++;

      // Completeness
      if (fName && fName !== 'null') completenessCounts.farmer++;
      if (v && v !== 'Unknown') completenessCounts.village++;
      if (fType && fType !== 'null' && fType !== 'undefined') completenessCounts.farmerType++;
      if (vacDate && vacDate !== 'null') completenessCounts.vacDate++;
      if (birdsVac && birdsVac !== 'null') completenessCounts.birdsVac++;
      if (income && income !== 'null') completenessCounts.income++;
      if (mortality && mortality !== 'null') completenessCounts.mortality++;

      // Village level for table
      const vKey = `${b}|${c}|${v}`;
      if (!villageStats[vKey]) {
        villageStats[vKey] = {
          block: b, cluster: c, village: v,
          farmers: new Set(),
          reportingFarmers: new Set(),
          lastSub: d,
          fieldsFilled: 0,
          totalFields: 0
        };
      }
      if (fName && fName !== 'null') {
        villageStats[vKey].farmers.add(fName);
        if (income || birdsVac || mortality || (sInfo.Birds_status?.mdc_byp_total_birds)) {
           villageStats[vKey].reportingFarmers.add(fName);
        }
      }
      if (d > villageStats[vKey].lastSub) villageStats[vKey].lastSub = d;
      
      let rowFilled = 0;
      if (fName && fName !== 'null') rowFilled++;
      if (v && v !== 'Unknown') rowFilled++;
      if (fType && fType !== 'null') rowFilled++;
      if (vacDate && vacDate !== 'null') rowFilled++;
      if (birdsVac && birdsVac !== 'null') rowFilled++;
      if (income && income !== 'null') rowFilled++;
      if (mortality && mortality !== 'null') rowFilled++;
      
      villageStats[vKey].fieldsFilled += rowFilled;
      villageStats[vKey].totalFields += 7;

      // Block reporting status
      if (!blockReporting[b]) blockReporting[b] = { registered: new Set(), reporting: new Set() };
      if (fName && fName !== 'null') {
        blockReporting[b].registered.add(fName);
        if (income || birdsVac || mortality || (sInfo.Birds_status?.mdc_byp_total_birds)) {
           blockReporting[b].reporting.add(fName);
        }
      }
    });

    const total = totalSubmissions || 1; // Prevent div by zero
    const completenessData = [
      { name: 'Farmer Name', value: Math.round((completenessCounts.farmer / total) * 100) },
      { name: 'Village', value: Math.round((completenessCounts.village / total) * 100) },
      { name: 'Farmer Type', value: Math.round((completenessCounts.farmerType / total) * 100) },
      { name: 'Vaccination Date', value: Math.round((completenessCounts.vacDate / total) * 100) },
      { name: 'Birds Vaccinated', value: Math.round((completenessCounts.birdsVac / total) * 100) },
      { name: 'Income', value: Math.round((completenessCounts.income / total) * 100) },
      { name: 'Mortality', value: Math.round((completenessCounts.mortality / total) * 100) },
    ];

    const monthlyData = Object.entries(monthlySubs).map(([date, count]) => ({ date, count })).sort((a,b) => a.date.localeCompare(b.date));
    const blockData = Object.entries(blockSubs).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);
    
    const reportingData = Object.entries(blockReporting).map(([name, data]) => {
      const reg = data.registered.size;
      const rep = data.reporting.size;
      return {
        name,
        reporting: rep,
        nonReporting: reg - rep
      };
    }).sort((a,b) => (b.reporting + b.nonReporting) - (a.reporting + a.nonReporting));

    const tableData = Object.values(villageStats).map(v => {
       const reg = v.farmers.size;
       const rep = v.reportingFarmers.size;
       return {
         block: v.block,
         cluster: v.cluster,
         village: v.village,
         registered: reg,
         reporting: rep,
         lastDate: v.lastSub,
         missing: reg - rep,
         completeness: v.totalFields > 0 ? Math.round((v.fieldsFilled / v.totalFields) * 100) : 0
       };
    }).sort((a,b) => b.missing - a.missing);

    return {
      totalSubmissions,
      subsThisMonth,
      activeVillages: uniqueVillages.size,
      activeFarmers: uniqueFarmers.size,
      missingRecords,
      duplicates,
      completenessData,
      monthlyData,
      blockData,
      reportingData,
      tableData
    };
  }, [filteredData]);
"""

if "const misStats = useMemo(() => {" not in content:
    content = content.replace("  const COLORS = ['#3b82f6'", mis_stats + "\n  const COLORS = ['#3b82f6'")

page6_jsx = """
        {activeTab === 'data-quality' && (
          <div className="space-y-3">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Total Submissions</div>
                <div className="text-xl font-black text-slate-800">{misStats.totalSubmissions.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 bg-emerald-50 border-emerald-100">
                <div className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Subs This Month</div>
                <div className="text-xl font-black text-emerald-700">{misStats.subsThisMonth.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Active Villages</div>
                <div className="text-xl font-black text-slate-800">{misStats.activeVillages.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Active Farmers</div>
                <div className="text-xl font-black text-slate-800">{misStats.activeFarmers.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Missing Data Rec.</div>
                <div className="text-xl font-black text-amber-600">{misStats.missingRecords.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Duplicate Records</div>
                <div className="text-xl font-black text-rose-600">{misStats.duplicates.toLocaleString()}</div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Monthly Submissions (Line) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Monthly Submissions</h3>
                <div className="flex-1 min-h-0">
                  {misStats.monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <LineChart data={misStats.monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="count" name="Submissions" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>

              {/* Submissions by Block (Bar) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Submissions by Block</h3>
                <div className="flex-1 min-h-0">
                  {misStats.blockData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={misStats.blockData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="count" name="Submissions" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Data Completeness (Horizontal Bar) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Data Completeness %</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <BarChart data={misStats.completenessData} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={90} />
                      <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="value" name="Completion %" fill="#10b981" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false}>
                        <LabelList dataKey="value" position="right" formatter={(v: number) => `${v}%`} style={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Reporting Status (Stacked Bar) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Reporting Status by Block</h3>
                <div className="flex-1 min-h-0">
                  {misStats.reportingData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={misStats.reportingData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={20} wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
                        <Bar dataKey="reporting" name="Reporting Farmers" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={40} isAnimationActive={false} />
                        <Bar dataKey="nonReporting" name="Non-reporting Farmers" stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
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
              <h3 className="font-bold text-slate-800 text-xs mb-3">MIS Monitoring Table</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-64 custom-scrollbar">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="text-[10px] text-slate-500 bg-slate-50 uppercase font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 border-b border-slate-200">Block</th>
                      <th className="px-3 py-2 border-b border-slate-200">Cluster</th>
                      <th className="px-3 py-2 border-b border-slate-200">Village</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Registered</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Reporting</th>
                      <th className="px-3 py-2 border-b border-slate-200">Last Submission Date</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Missing Reports</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Completeness %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {misStats.tableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2">{row.block}</td>
                        <td className="px-3 py-2 text-slate-500">{row.cluster}</td>
                        <td className="px-3 py-2">{row.village}</td>
                        <td className="px-3 py-2 text-right">{row.registered}</td>
                        <td className="px-3 py-2 text-right text-emerald-600 font-medium">{row.reporting}</td>
                        <td className="px-3 py-2">{row.lastDate}</td>
                        <td className="px-3 py-2 text-right text-rose-600 font-medium">{row.missing}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={cn("px-2 py-0.5 rounded-full font-bold", row.completeness >= 80 ? "bg-emerald-100 text-emerald-700" : row.completeness >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700")}>
                            {row.completeness}%
                          </span>
                        </td>
                      </tr>
                    ))}
                    {misStats.tableData.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                          No MIS records found.
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

content = content.replace("{/* Placeholders for other tabs */}", page6_jsx + "\n        {/* Placeholders for other tabs */}")

with open('src/pages/admin/BYPDashboard.tsx', 'w') as f:
    f.write(content)

print("Added Page 6 successfully!")
