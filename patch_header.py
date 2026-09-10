import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

header_old = """        {/* Header Section */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-600" />
            Crops Dashboard
          </h1>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200 shrink-0">
            <Database className="w-4 h-4 text-emerald-500" />
            {filteredData.length} Records Found
          </div>
        </div>

        {/* Tabs */}"""

header_new = """        {/* Tabs */}"""

content = content.replace(header_old, header_new)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
