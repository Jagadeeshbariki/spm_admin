import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Fix clear filters button logic to include year and season
old_clear = """                    setSelectedCropMode('All');
                    setHasActivities('All');
                    setSelectedYear('All');
                    setSelectedSeason('All');
                    setSearchTerm('');"""

# Make sure we don't accidentally do it twice, I already did it in the previous script.

# Add tabs
old_header = """        {/* Filters Panel */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">"""

new_header = """        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === 'overview' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            Overview Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('frp')}
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === 'frp' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            FRP Dashboard
          </button>
        </div>

        {/* Filters Panel */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">"""
content = content.replace(old_header, new_header)

old_grid = """          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <FilterSelect 
              label="Block" """

new_grid = """          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              label="Block" """

content = content.replace(old_grid, new_grid)

# Wrap Data table with activeTab
old_table = """        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">"""

new_table = """        {/* Content Area */}
        {activeTab === 'overview' ? (
          <OverviewTab data={filteredData} />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">"""

content = content.replace(old_table, new_table)

old_table_end = """              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}"""

new_table_end = """              </div>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}"""

content = content.replace(old_table_end, new_table_end)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
