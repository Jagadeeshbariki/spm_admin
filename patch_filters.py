import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

filters_old = """        {/* Filters Panel */}
        <div className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 shrink-0">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
            <Filter className="w-5 h-5 text-slate-400" />
            <h2 className="font-bold text-slate-700">Filter Data</h2>
          </div>
          
          <div className="flex flex-wrap lg:flex-nowrap overflow-x-visible gap-3 pb-2 w-full">"""

filters_new = """        {/* Filters Panel */}
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 shrink-0 flex flex-col gap-2">
          
          <div className="flex flex-wrap lg:flex-nowrap overflow-x-visible gap-2 w-full">"""
content = content.replace(filters_old, filters_new)


search_old = """          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by Farmer Name or HH ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            
            <div className="ml-auto w-full md:w-auto">"""

search_new = """          <div className="flex flex-col md:flex-row items-center gap-2 w-full">
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by Farmer Name or HH ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            
            <div className="ml-auto w-full md:w-auto shrink-0">"""

content = content.replace(search_old, search_new)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
