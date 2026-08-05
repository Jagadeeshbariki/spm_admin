import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Fix key in table to prevent flickering
content = content.replace("<React.Fragment key={idx}>", "<React.Fragment key={row.raw?.__id || idx}>")

# Rewrite OverviewTab
old_overview = content[content.find("function OverviewTab({ data }: { data: any[] }) {"):]

new_overview = """function OverviewTab({ data }: { data: any[] }) {
  const stats = useMemo(() => {
    let totalArea = 0;
    let totalHarvests = 0;
    let totalBioInputs = 0;
    
    const uniqueFarmers = new Set<string>();
    const activeFarmers = new Set<string>();
    
    const cropModeCount: Record<string, number> = {};
    const mainCropFarmers: Record<string, Set<string>> = {};
    
    data.forEach(item => {
      const farmerId = item.hhId || item.farmerName || 'unknown';
      uniqueFarmers.add(farmerId);
      
      // Area
      const area = parseFloat(item.area);
      if (!isNaN(area)) totalArea += area;
      
      // Activities
      if (item.harvests.length > 0 || item.bioInputs.length > 0) {
        activeFarmers.add(farmerId);
      }
      totalHarvests += item.harvests.length;
      totalBioInputs += item.bioInputs.length;
      
      // Crop Mode
      const mode = item.cropMode || 'Unknown';
      cropModeCount[mode] = (cropModeCount[mode] || 0) + 1;
      
      // Main Crop
      const mainCrop = item.mainCrop || 'Unknown';
      if (mainCrop !== 'Unknown' && mainCrop !== '-') {
        if (!mainCropFarmers[mainCrop]) {
          mainCropFarmers[mainCrop] = new Set<string>();
        }
        mainCropFarmers[mainCrop].add(farmerId);
      }
    });
    
    const cropModeData = Object.entries(cropModeCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
      
    const mainCropData = Object.entries(mainCropFarmers)
      .map(([name, set]) => ({ name, value: set.size }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // top 10
      
    return {
      totalUniqueFarmers: uniqueFarmers.size,
      totalArea: totalArea.toFixed(2),
      activeFarmers: activeFarmers.size,
      totalHarvests,
      totalBioInputs,
      cropModeData,
      mainCropData
    };
  }, [data]);
  
  const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

  return (
    <div className="flex flex-col h-[calc(100vh-230px)] gap-4">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Users className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-xs uppercase tracking-wider">Unique Farmers</h3>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalUniqueFarmers}</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Layers className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-xs uppercase tracking-wider">Total Area (Acres)</h3>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalArea}</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-xs uppercase tracking-wider">Active Farmers</h3>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.activeFarmers}</div>
          <div className="text-xs text-slate-500 mt-1">With logged activities</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-xs uppercase tracking-wider">Total Activities</h3>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalHarvests + stats.totalBioInputs}</div>
          <div className="text-xs text-slate-500 mt-1">{stats.totalHarvests} Harvests, {stats.totalBioInputs} Bio Inputs</div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <PieChartIcon className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Crop Modes Distribution</h3>
          </div>
          <div className="flex-1 min-h-0">
            {stats.cropModeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.cropModeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stats.cropModeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Crop-wise Farmers Count</h3>
          </div>
          <div className="flex-1 min-h-0">
            {stats.mainCropData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.mainCropData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    dy={10}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {/* Note: In standard Recharts, adding LabelList works to show labels on bars */}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
"""

content = content[:content.find("function OverviewTab({ data }: { data: any[] }) {")] + new_overview

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
