import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Main wrapper (make it fit screen)
old_wrap = '    <div className="bg-[#F5F7FA] min-h-screen -m-4 md:-m-8 p-4 md:p-8 font-sans text-slate-800">\n      <div className="max-w-7xl mx-auto w-full flex flex-col gap-4">'
new_wrap = '    <div className="bg-[#F5F7FA] h-[calc(100vh-64px)] -m-4 md:-m-8 p-4 md:p-6 font-sans text-slate-800 flex flex-col">\n      <div className="w-full h-full flex flex-col gap-4 overflow-hidden">'
content = content.replace(old_wrap, new_wrap)

# 2. Filters
old_filters = """        {/* Filters Panel */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
            <Filter className="w-5 h-5 text-slate-400" />
            <h2 className="font-bold text-slate-700">Filter Data</h2>
          </div>
          
          <div className="flex flex-nowrap overflow-x-auto gap-4 pb-2 snap-x custom-scrollbar">
            <FilterSelect 
              label="Year" 
              value={selectedYear} 
              onChange={setSelectedYear} 
              options={years} 
              className="min-w-[140px] shrink-0"
            />
            <FilterSelect 
              label="Season" 
              value={selectedSeason} 
              onChange={setSelectedSeason} 
              options={seasons} 
              className="min-w-[140px] shrink-0"
            />
            <FilterSelect 
              label="Block" 
              value={selectedBlock} 
              onChange={setSelectedBlock} 
              options={blocks} 
              className="min-w-[150px] shrink-0"
            />
            <FilterSelect 
              label="Gram Panchayat (GP)" 
              value={selectedGp} 
              onChange={setSelectedGp} 
              options={gps} 
              className="min-w-[160px] shrink-0"
            />
            <FilterSelect 
              label="Village" 
              value={selectedVillage} 
              onChange={setSelectedVillage} 
              options={villages} 
              className="min-w-[150px] shrink-0"
            />
            <FilterSelect 
              label="Crop Mode" 
              value={selectedCropMode} 
              onChange={setSelectedCropMode} 
              options={cropModes} 
              className="min-w-[150px] shrink-0"
            />
            <FilterSelect 
              label="Has Activities" 
              value={hasActivities} 
              onChange={setHasActivities} 
              options={['Yes', 'No']} 
              className="min-w-[140px] shrink-0"
            />
          </div>
        </div>"""

new_filters = """        {/* Filters Panel */}
        <div className="flex items-center flex-nowrap overflow-x-auto gap-3 pb-1 custom-scrollbar shrink-0">
          <div className="flex items-center gap-2 text-slate-500 mr-2 shrink-0">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-semibold">Filters:</span>
          </div>
          <FilterSelect 
            label="Year" 
            value={selectedYear} 
            onChange={setSelectedYear} 
            options={years} 
          />
          <FilterSelect 
            label="Season" 
            value={selectedSeason} 
            onChange={setSelectedSeason} 
            options={seasons} 
          />
          <FilterSelect 
            label="Block" 
            value={selectedBlock} 
            onChange={setSelectedBlock} 
            options={blocks} 
          />
          <FilterSelect 
            label="GP" 
            value={selectedGp} 
            onChange={setSelectedGp} 
            options={gps} 
          />
          <FilterSelect 
            label="Village" 
            value={selectedVillage} 
            onChange={setSelectedVillage} 
            options={villages} 
          />
          <FilterSelect 
            label="Crop Mode" 
            value={selectedCropMode} 
            onChange={setSelectedCropMode} 
            options={cropModes} 
          />
          <FilterSelect 
            label="Activities" 
            value={hasActivities} 
            onChange={setHasActivities} 
            options={['Yes', 'No']} 
          />
        </div>"""
content = content.replace(old_filters, new_filters)

# 3. FilterSelect
old_fs = """function FilterSelect({ label, value, onChange, options, className }: { label: string, value: string, onChange: (val: string) => void, options: string[], className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer hover:bg-slate-100 transition-colors w-full"
      >
        <option value="All">All {label}s</option>
        {options.filter(Boolean).map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}"""

new_fs = """function FilterSelect({ label, value, onChange, options, className }: { label: string, value: string, onChange: (val: string) => void, options: string[], className?: string }) {
  return (
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm shrink-0 min-w-[120px] pr-8", className)}
      style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' }}
    >
      <option value="All">{label}: All</option>
      {options.filter(Boolean).map(o => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}"""
content = content.replace(old_fs, new_fs)

# 4. Make Content Area take remaining height
old_content = """        {/* Content Area */}
        {activeTab === 'overview' ? (
          <OverviewTab data={filteredData} />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="overflow-auto custom-scrollbar max-h-[700px]">"""

new_content = """        {/* Content Area */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeTab === 'overview' ? (
          <OverviewTab data={filteredData} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="overflow-auto custom-scrollbar flex-1 min-h-0">"""
content = content.replace(old_content, new_content)

old_content_close = """              </tbody>
            </table>
          </div>
          </div>
        )}
      </div>
    </div>"""

new_content_close = """              </tbody>
            </table>
          </div>
          </div>
        )}
        </div>
      </div>
    </div>"""
content = content.replace(old_content_close, new_content_close)

# 5. Make Overview Tab flex-1 properly
old_overview_wrap = """function OverviewTab({ data }: { data: any[] }) {
  const stats = useMemo(() => {"""
new_overview_wrap = """function OverviewTab({ data }: { data: any[] }) {
  const stats = useMemo(() => {"""
# Wait, OverviewTab return:
old_ot_return = """  return (
    <div className="flex flex-col gap-4">
      {/* Metric Cards */}"""
new_ot_return = """  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      {/* Metric Cards */}"""
content = content.replace(old_ot_return, new_ot_return)

# 6. Charts containers fix for flickering
old_charts = """      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <PieChartIcon className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Crop Modes Distribution</h3>
          </div>
          <div className="flex-1 min-h-0">"""
new_charts = """      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[400px]">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col min-h-[300px]">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <PieChartIcon className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Crop Modes Distribution</h3>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">"""
content = content.replace(old_charts, new_charts)

old_charts_2 = """        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[400px]">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Crop-wise Farmers Count</h3>
          </div>
          <div className="flex-1 min-h-0">"""
new_charts_2 = """        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col min-h-[300px]">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Crop-wise Farmers Count</h3>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">"""
content = content.replace(old_charts_2, new_charts_2)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

