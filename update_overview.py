import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Update signature
old_sig = "function OverviewTab({ data }: { data: any[] }) {"
new_sig = "function OverviewTab({ data, isHdfc = false }: { data: any[], isHdfc?: boolean }) {"
content = content.replace(old_sig, new_sig)

# Update stats calculation
old_stats = """    const cropModeCount: Record<string, number> = {};
    const mainCropFarmers: Record<string, Set<string>> = {};"""
new_stats = """    const cropModeCount: Record<string, number> = {};
    const mainCropFarmers: Record<string, Set<string>> = {};
    const clusterFarmers: Record<string, Set<string>> = {};"""
content = content.replace(old_stats, new_stats)

old_loop = """      // Crop Mode
      const mode = item.cropMode || 'Unknown';
      cropModeCount[mode] = (cropModeCount[mode] || 0) + 1;"""

new_loop = """      // Crop Mode
      const mode = item.cropMode || 'Unknown';
      cropModeCount[mode] = (cropModeCount[mode] || 0) + 1;

      // Cluster
      if (isHdfc) {
        const cluster = item.cluster || 'Unknown';
        if (!clusterFarmers[cluster]) {
          clusterFarmers[cluster] = new Set<string>();
        }
        clusterFarmers[cluster].add(farmerId);
      }"""

content = content.replace(old_loop, new_loop)

old_ret = """    const mainCropData = Object.entries(mainCropFarmers)
      .map(([name, set]) => ({ name, value: set.size }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // top 10
      
    return {"""

new_ret = """    const mainCropData = Object.entries(mainCropFarmers)
      .map(([name, set]) => ({ name, value: set.size }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // top 10

    const clusterData = Object.entries(clusterFarmers)
      .map(([name, set]) => ({ name, value: set.size }))
      .sort((a, b) => a.name.localeCompare(b.name));
      
    return {"""
content = content.replace(old_ret, new_ret)

old_ret2 = """      cropModeData,
      mainCropData
    };"""
new_ret2 = """      cropModeData,
      mainCropData,
      clusterData
    };"""
content = content.replace(old_ret2, new_ret2)

# Update JSX
old_jsx = """      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <h3 className="font-semibold text-sm text-slate-800 mb-4">Farmers by Crop Mode</h3>"""

new_jsx = """      {/* Charts Row */}
      <div className={cn("grid grid-cols-1 gap-4", isHdfc ? "lg:grid-cols-3" : "lg:grid-cols-2")}>
        {isHdfc && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
            <h3 className="font-semibold text-sm text-slate-800 mb-4">Farmers by Cluster</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.clusterData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={50}
                    paddingAngle={2}
                  >
                    {stats.clusterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`${value} Farmers`, 'Count']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <h3 className="font-semibold text-sm text-slate-800 mb-4">Farmers by Crop Mode</h3>"""

content = content.replace(old_jsx, new_jsx)

# Call OverviewTab
old_call = """        {activeTab === 'overview' && (
          <OverviewTab data={filteredData} />
        )}"""

new_call = """        {(activeTab === 'overview' || activeTab === 'hdfc') && (
          <OverviewTab data={filteredData} isHdfc={activeTab === 'hdfc'} />
        )}"""

content = content.replace(old_call, new_call)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
