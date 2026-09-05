import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

old_area = """        {/* Content Area */}
        <div className="flex flex-col">
        {activeTab === 'overview' ? (
          <OverviewTab data={filteredData} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">"""

new_area = """        {/* Content Area */}
        <div className="flex flex-col gap-6">
        {(activeTab === 'overview' || activeTab === 'hdfc') && (
          <OverviewTab data={filteredData} isHdfc={activeTab === 'hdfc'} />
        )}
        
        {(activeTab === 'frp' || activeTab === 'hdfc') && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">"""

content = content.replace(old_area, new_area)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
