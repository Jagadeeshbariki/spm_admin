import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

old_tabs = """          <button 
            onClick={() => setActiveTab('frp')}
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === 'frp' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            FRP Dashboard
          </button>
        </div>"""

new_tabs = """          <button 
            onClick={() => setActiveTab('frp')}
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === 'frp' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            FRP Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('hdfc')}
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === 'hdfc' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            HDFC Crops
          </button>
        </div>"""

content = content.replace(old_tabs, new_tabs)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
