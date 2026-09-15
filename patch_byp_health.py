import re

with open('src/pages/admin/BYPDashboard.tsx', 'r') as f:
    content = f.read()

# 1. State updates
content = content.replace(
    "const [selectedDate, setSelectedDate] = useState<string[]>([]);",
    "const [selectedDate, setSelectedDate] = useState<string[]>([]);\n  const [selectedServiceType, setSelectedServiceType] = useState<string[]>([]);\n  const [selectedMonth, setSelectedMonth] = useState<string[]>([]);"
)

# 2. Filter options definition
content = content.replace(
    "const dates = new Set<string>();",
    "const dates = new Set<string>();\n    const serviceTypes = new Set<string>();\n    const months = new Set<string>();"
)

# 3. Filter options population
content = content.replace(
    "if (d && d !== 'undefined' && d !== '-' && d !== 'null') dates.add(d);",
    "if (d && d !== 'undefined' && d !== '-' && d !== 'null') dates.add(d);\n      \n      const stRaw = String(item.service_info?.byp_service_type || '');\n      stRaw.split(' ').map(s => s.trim()).filter(Boolean).forEach(s => serviceTypes.add(s));\n      \n      const m = String(item.survey_date || '').substring(0, 7);\n      if (m && m !== 'undefin' && m !== 'null' && m !== 'Unknown') months.add(m);"
)

# 4. Filter options return
content = content.replace(
    "dates: Array.from(dates).sort()",
    "dates: Array.from(dates).sort(),\n      serviceTypes: Array.from(serviceTypes).sort(),\n      months: Array.from(months).sort()"
)

# 5. Filtered data extraction
content = content.replace(
    "const d = String(item.survey_date || 'Unknown').trim();",
    "const d = String(item.survey_date || 'Unknown').trim();\n      const stRaw = String(item.service_info?.byp_service_type || '');\n      const stArr = stRaw.split(' ').map(s => s.trim()).filter(Boolean);\n      const m = String(item.survey_date || '').substring(0, 7);"
)

# 6. Filtered data matching
content = content.replace(
    "if (selectedDate.length > 0 && !selectedDate.includes(d)) return false;",
    "if (selectedDate.length > 0 && !selectedDate.includes(d)) return false;\n      if (selectedServiceType.length > 0 && !selectedServiceType.some(t => stArr.includes(t))) return false;\n      if (selectedMonth.length > 0 && !selectedMonth.includes(m)) return false;"
)

# 7. UI Filters
content = content.replace(
    "<FilterDropdown label=\"Date\" options={filterOptions.dates} selected={selectedDate} setter={setSelectedDate} />",
    "<FilterDropdown label=\"Date\" options={filterOptions.dates} selected={selectedDate} setter={setSelectedDate} />\n        <FilterDropdown label=\"Service Type\" options={filterOptions.serviceTypes} selected={selectedServiceType} setter={setSelectedServiceType} />\n        <FilterDropdown label=\"Month\" options={filterOptions.months} selected={selectedMonth} setter={setSelectedMonth} />"
)

content = content.replace(
    "|| selectedQuarter.length > 0 || selectedDate.length > 0)",
    "|| selectedQuarter.length > 0 || selectedDate.length > 0 || selectedServiceType.length > 0 || selectedMonth.length > 0)"
)

content = content.replace(
    "setSelectedQuarter([]); setSelectedDate([]);",
    "setSelectedQuarter([]); setSelectedDate([]); setSelectedServiceType([]); setSelectedMonth([]);"
)

# 8. Health Stats Memo
health_stats = """
  // Compute Stats for Health & Services (Page 3)
  const healthStats = useMemo(() => {
    const farmersServiced = new Set<string>();
    let birdsVaccinated = 0;
    let birdsDewormed = 0;
    let vaccinationEvents = 0;
    let dewormingEvents = 0;
    let healthExpenditure = 0;

    const vacMonths: Record<string, number> = {};
    const dewormMonths: Record<string, number> = {};
    const vacNames: Record<string, number> = {};
    const blockServices: Record<string, { Vaccinated: number, Dewormed: number }> = {};
    const tableData: any[] = [];

    filteredData.forEach(item => {
      const sInfo = item.service_info || {};
      const p = item.personal_info || {};
      const fName = String(p.NS_farmer_name || p.BFE_farmer_name || 'Unknown').trim();
      const b = String(item.location_info?.block || 'Unknown').trim();
      const c = String(item.location_info?.cluster || 'Unknown').trim();
      const v = String(item.location_info?.village || 'Unknown').trim();

      const exp = parseInt(sInfo.Birds_status?.mdc_byp_health_expense || 0, 10);
      if (!isNaN(exp)) healthExpenditure += exp;

      const vac = parseInt(sInfo.vacn_info?.mdc_byp_birds_vaccinated || 0, 10);
      const vacDate = sInfo.vacn_info?.date_vaccination;
      const vacName = String(sInfo.vacn_info?.mdc_byp_vaccine_name || sInfo.vacn_info?.other_vaccine_names || 'Unknown').trim();
      
      const deworm = parseInt(sInfo.dewarming_info?.mdc_byp_birds_dewormed || 0, 10);
      const dewormDate = sInfo.dewarming_info?.date_deworming;
      const dewormName = String(sInfo.dewarming_info?.mdc_byp_birds_deworm_name || sInfo.dewarming_info?.other_dewarming_names || 'Unknown').trim();

      if (!blockServices[b]) blockServices[b] = { Vaccinated: 0, Dewormed: 0 };

      let gotService = false;

      if (!isNaN(vac) && vac > 0) {
        birdsVaccinated += vac;
        vaccinationEvents++;
        gotService = true;
        
        const vm = vacDate ? String(vacDate).substring(0, 7) : String(item.survey_date).substring(0, 7);
        if (vm && vm !== 'undefin' && vm !== 'null') {
          vacMonths[vm] = (vacMonths[vm] || 0) + vac;
        }
        
        if (vacName && vacName !== 'null') vacNames[vacName] = (vacNames[vacName] || 0) + vac;
        
        blockServices[b].Vaccinated += vac;

        tableData.push({
          date: vacDate || item.survey_date,
          block: b,
          cluster: c,
          village: v,
          farmer: fName,
          serviceType: 'Vaccination',
          birdsCovered: vac,
          serviceName: vacName
        });
      }

      if (!isNaN(deworm) && deworm > 0) {
        birdsDewormed += deworm;
        dewormingEvents++;
        gotService = true;

        const dm = dewormDate ? String(dewormDate).substring(0, 7) : String(item.survey_date).substring(0, 7);
        if (dm && dm !== 'undefin' && dm !== 'null') {
          dewormMonths[dm] = (dewormMonths[dm] || 0) + deworm;
        }

        blockServices[b].Dewormed += deworm;

        tableData.push({
          date: dewormDate || item.survey_date,
          block: b,
          cluster: c,
          village: v,
          farmer: fName,
          serviceType: 'Deworming',
          birdsCovered: deworm,
          serviceName: dewormName
        });
      }

      if (gotService && fName && fName !== 'null' && fName !== 'undefined') {
        farmersServiced.add(fName);
      }
    });

    return {
      farmersServiced: farmersServiced.size,
      birdsVaccinated,
      birdsDewormed,
      vaccinationEvents,
      dewormingEvents,
      healthExpenditure,
      vacVsDewormData: [
        { name: 'Vaccinated', value: birdsVaccinated },
        { name: 'Dewormed', value: birdsDewormed }
      ].filter(d => d.value > 0),
      monthlyVaccination: Object.entries(vacMonths).map(([date, birds]) => ({ date, birds })).sort((a,b) => a.date.localeCompare(b.date)),
      monthlyDeworming: Object.entries(dewormMonths).map(([date, birds]) => ({ date, birds })).sort((a,b) => a.date.localeCompare(b.date)),
      vaccineUsage: Object.entries(vacNames).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value),
      serviceByBlock: Object.entries(blockServices).map(([name, data]) => ({ name, ...data })).sort((a,b) => (b.Vaccinated + b.Dewormed) - (a.Vaccinated + a.Dewormed)),
      tableData: tableData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  }, [filteredData]);
"""

if "const healthStats = useMemo(() => {" not in content:
    content = content.replace("  const COLORS = ['#3b82f6'", health_stats + "\n  const COLORS = ['#3b82f6'")

page3_jsx = """
        {activeTab === 'health' && (
          <div className="space-y-3">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Farmers Serviced</div>
                <div className="text-xl font-black text-slate-800">{healthStats.farmersServiced.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Birds Vaccinated</div>
                <div className="text-xl font-black text-emerald-600">{healthStats.birdsVaccinated.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Birds Dewormed</div>
                <div className="text-xl font-black text-blue-600">{healthStats.birdsDewormed.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Vaccination Events</div>
                <div className="text-xl font-black text-slate-800">{healthStats.vaccinationEvents.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Deworming Events</div>
                <div className="text-xl font-black text-slate-800">{healthStats.dewormingEvents.toLocaleString()}</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1 line-clamp-1">Health Expense</div>
                <div className="text-xl font-black text-red-600">₹{healthStats.healthExpenditure.toLocaleString()}</div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Vaccination vs Deworming (Column) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Vaccination vs Deworming</h3>
                <div className="flex-1 min-h-0">
                  {healthStats.vacVsDewormData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={healthStats.vacVsDewormData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60} isAnimationActive={false}>
                          <LabelList dataKey="value" position="top" style={{ fontSize: '11px', fill: '#64748b', fontWeight: 'bold' }} />
                          {healthStats.vacVsDewormData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.name === 'Vaccinated' ? '#10b981' : '#3b82f6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>

              {/* Monthly Vaccination Trend (Line) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Monthly Vaccination Trend</h3>
                <div className="flex-1 min-h-0">
                  {healthStats.monthlyVaccination.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <LineChart data={healthStats.monthlyVaccination} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="birds" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>

              {/* Monthly Deworming Trend (Line) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Monthly Deworming Trend</h3>
                <div className="flex-1 min-h-0">
                  {healthStats.monthlyDeworming.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <LineChart data={healthStats.monthlyDeworming} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="birds" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Vaccine-wise Usage (Bar) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Vaccine-wise Usage</h3>
                <div className="flex-1 min-h-0">
                  {healthStats.vaccineUsage.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={healthStats.vaccineUsage} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={80} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false}>
                          <LabelList dataKey="value" position="right" style={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>

              {/* Service Delivery by Block (Stacked or Grouped Bar) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Service Delivery by Block</h3>
                <div className="flex-1 min-h-0">
                  {healthStats.serviceByBlock.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={healthStats.serviceByBlock} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} width={80} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={20} wrapperStyle={{ fontSize: '10px' }} iconType="circle" />
                        <Bar dataKey="Vaccinated" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={16} isAnimationActive={false} />
                        <Bar dataKey="Dewormed" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Services Detail Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
              <h3 className="font-bold text-slate-800 text-xs mb-3">Health Services Log</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-64 custom-scrollbar">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="text-[10px] text-slate-500 bg-slate-50 uppercase font-semibold sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 border-b border-slate-200">Date</th>
                      <th className="px-3 py-2 border-b border-slate-200">Block</th>
                      <th className="px-3 py-2 border-b border-slate-200">Cluster</th>
                      <th className="px-3 py-2 border-b border-slate-200">Village</th>
                      <th className="px-3 py-2 border-b border-slate-200">Farmer</th>
                      <th className="px-3 py-2 border-b border-slate-200">Service Type</th>
                      <th className="px-3 py-2 border-b border-slate-200 text-right">Birds Covered</th>
                      <th className="px-3 py-2 border-b border-slate-200">Vaccine / Deworming Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {healthStats.tableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2">{row.date}</td>
                        <td className="px-3 py-2">{row.block}</td>
                        <td className="px-3 py-2 text-slate-500">{row.cluster}</td>
                        <td className="px-3 py-2">{row.village}</td>
                        <td className="px-3 py-2 font-medium">{row.farmer}</td>
                        <td className="px-3 py-2">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                            row.serviceType === 'Vaccination' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {row.serviceType}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold">{row.birdsCovered}</td>
                        <td className="px-3 py-2 text-slate-500">{row.serviceName}</td>
                      </tr>
                    ))}
                    {healthStats.tableData.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                          No service records found.
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

content = content.replace("{/* Placeholders for other tabs */}", page3_jsx + "\n        {/* Placeholders for other tabs */}")

with open('src/pages/admin/BYPDashboard.tsx', 'w') as f:
    f.write(content)

print("Added Page 3 successfully!")
