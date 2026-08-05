import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Main wrapper
old_wrap = '    <div className="bg-[#F5F7FA] h-[calc(100vh-64px)] -m-4 md:-m-8 p-4 md:p-6 font-sans text-slate-800 flex flex-col">\n      <div className="w-full h-full flex flex-col gap-4 overflow-hidden">'
new_wrap = '    <div className="bg-[#F5F7FA] min-h-[calc(100vh-64px)] -m-4 md:-m-8 p-4 md:p-6 font-sans text-slate-800">\n      <div className="w-full flex flex-col gap-6">'
content = content.replace(old_wrap, new_wrap)

# 2. Content Area
old_content = """        {/* Content Area */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeTab === 'overview' ? (
          <OverviewTab data={filteredData} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
          <div className="overflow-auto custom-scrollbar flex-1 min-h-0">"""
new_content = """        {/* Content Area */}
        <div className="flex flex-col">
        {activeTab === 'overview' ? (
          <OverviewTab data={filteredData} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="overflow-auto custom-scrollbar">"""
content = content.replace(old_content, new_content)

# 3. Overview Tab
old_ot = """function OverviewTab({ data }: { data: any[] }) {
  const stats = useMemo(() => {"""
# And the return
old_ot_ret = """  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar">"""
new_ot_ret = """  return (
    <div className="flex flex-col gap-6">"""
content = content.replace(old_ot_ret, new_ot_ret)

# 4. Charts wrappers
old_ch = '      {/* Charts */}\n      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-[400px]">'
new_ch = '      {/* Charts */}\n      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">'
content = content.replace(old_ch, new_ch)

old_ch_pie = '        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col min-h-[300px]">\n          <div className="flex items-center gap-2 mb-4 shrink-0">\n            <PieChartIcon className="w-4 h-4 text-slate-400" />\n            <h3 className="font-bold text-slate-800 text-sm">Crop Modes Distribution</h3>\n          </div>\n          <div className="flex-1 min-h-0 overflow-hidden">'
new_ch_pie = '        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[400px]">\n          <div className="flex items-center gap-2 mb-4 shrink-0">\n            <PieChartIcon className="w-4 h-4 text-slate-400" />\n            <h3 className="font-bold text-slate-800 text-sm">Crop Modes Distribution</h3>\n          </div>\n          <div className="flex-1 min-h-0">'
content = content.replace(old_ch_pie, new_ch_pie)

old_ch_bar = '        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col min-h-[300px]">\n          <div className="flex items-center gap-2 mb-4 shrink-0">\n            <BarChart3 className="w-4 h-4 text-slate-400" />\n            <h3 className="font-bold text-slate-800 text-sm">Crop-wise Farmers Count</h3>\n          </div>\n          <div className="flex-1 min-h-0 overflow-hidden">'
new_ch_bar = '        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[400px]">\n          <div className="flex items-center gap-2 mb-4 shrink-0">\n            <BarChart3 className="w-4 h-4 text-slate-400" />\n            <h3 className="font-bold text-slate-800 text-sm">Crop-wise Farmers Count</h3>\n          </div>\n          <div className="flex-1 min-h-0">'
content = content.replace(old_ch_bar, new_ch_bar)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
