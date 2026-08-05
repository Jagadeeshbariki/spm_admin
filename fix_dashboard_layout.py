import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Main wrapper
old_wrap = '    <div className="bg-[#F5F7FA] h-[calc(100vh-64px)] -m-4 md:-m-8 p-4 md:p-8 font-sans text-slate-800 flex flex-col overflow-hidden">\n      <div className="max-w-7xl mx-auto w-full h-full flex flex-col gap-4">'
new_wrap = '    <div className="bg-[#F5F7FA] min-h-screen -m-4 md:-m-8 p-4 md:p-8 font-sans text-slate-800">\n      <div className="max-w-7xl mx-auto w-full flex flex-col gap-4">'
content = content.replace(old_wrap, new_wrap)

# 2. Header
old_header = """        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Sprout className="w-8 h-8 text-emerald-600" />
              Crops Dashboard
            </h1>
            <p className="text-slate-500 mt-2 max-w-xl text-sm md:text-base">
              Monitor and analyze agricultural data directly from ODK Central submissions. 
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 shrink-0">
            <Database className="w-4 h-4 text-emerald-500" />
            {filteredData.length} Records Found
          </div>
        </div>"""
new_header = """        {/* Header Section */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-600" />
            Crops Dashboard
          </h1>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200 shrink-0">
            <Database className="w-4 h-4 text-emerald-500" />
            {filteredData.length} Records Found
          </div>
        </div>"""
content = content.replace(old_header, new_header)

# 3. Filters
old_filters = """          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              label="Gram Panchayat (GP)" 
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
              label="Has Activities" 
              value={hasActivities} 
              onChange={setHasActivities} 
              options={['Yes', 'No']} 
            />
          </div>"""
new_filters = """          <div className="flex flex-nowrap overflow-x-auto gap-4 pb-2 snap-x custom-scrollbar">
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
          </div>"""
content = content.replace(old_filters, new_filters)

# 4. FRP layout
old_frp = """        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="overflow-auto custom-scrollbar flex-1 min-h-0">"""
new_frp = """        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="overflow-auto custom-scrollbar max-h-[700px]">"""
content = content.replace(old_frp, new_frp)

# 5. FilterSelect signature
old_fs = """function FilterSelect({ label, value, onChange, options }: { label: string, value: string, onChange: (val: string) => void, options: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">"""
new_fs = """function FilterSelect({ label, value, onChange, options, className }: { label: string, value: string, onChange: (val: string) => void, options: string[], className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>"""
content = content.replace(old_fs, new_fs)

# 6. OverviewTab layout
old_ot = '  return (\n    <div className="flex flex-col flex-1 min-h-0 gap-4">\n      {/* Metric Cards */}'
new_ot = '  return (\n    <div className="flex flex-col gap-4">\n      {/* Metric Cards */}'
content = content.replace(old_ot, new_ot)

# 7. Charts container
old_ch = '      {/* Charts */}\n      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">\n        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col">\n          <div className="flex items-center gap-2 mb-4 shrink-0">'
new_ch = '      {/* Charts */}\n      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">\n        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[400px]">\n          <div className="flex items-center gap-2 mb-4 shrink-0">'
content = content.replace(old_ch, new_ch)

old_ch2 = '        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col">\n          <div className="flex items-center gap-2 mb-4 shrink-0">\n            <BarChart3 className="w-4 h-4 text-slate-400" />'
new_ch2 = '        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[400px]">\n          <div className="flex items-center gap-2 mb-4 shrink-0">\n            <BarChart3 className="w-4 h-4 text-slate-400" />'
content = content.replace(old_ch2, new_ch2)


with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

