import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Make sure imports are added. We need recharts and some more icons.
old_import = "import { Filter, Search, Loader2, Sprout, MapPin, Users, Database, ChevronDown, ChevronUp, Calendar, ArrowLeft, ArrowRight, Info, Layers } from 'lucide-react';"
new_import = "import { Filter, Search, Loader2, Sprout, MapPin, Users, Database, ChevronDown, ChevronUp, Calendar, ArrowLeft, ArrowRight, Info, Layers, Activity, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';\nimport { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';"
content = content.replace(old_import, new_import)

overview_component = """

function OverviewTab({ data }: { data: any[] }) {
  const stats = useMemo(() => {
    let totalArea = 0;
    let farmersWithActivities = 0;
    let totalHarvests = 0;
    let totalBioInputs = 0;
    
    const cropModeCount: Record<string, number> = {};
    const mainCropCount: Record<string, number> = {};
    
    data.forEach(item => {
      // Area
      const area = parseFloat(item.area);
      if (!isNaN(area)) totalArea += area;
      
      // Activities
      if (item.harvests.length > 0 || item.bioInputs.length > 0) {
        farmersWithActivities++;
      }
      totalHarvests += item.harvests.length;
      totalBioInputs += item.bioInputs.length;
      
      // Crop Mode
      const mode = item.cropMode || 'Unknown';
      cropModeCount[mode] = (cropModeCount[mode] || 0) + 1;
      
      // Main Crop
      const mainCrop = item.mainCrop || 'Unknown';
      if (mainCrop !== 'Unknown' && mainCrop !== '-') {
        mainCropCount[mainCrop] = (mainCropCount[mainCrop] || 0) + 1;
      }
    });
    
    const cropModeData = Object.entries(cropModeCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
      
    const mainCropData = Object.entries(mainCropCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5
      
    return {
      totalFarmers: data.length,
      totalArea: totalArea.toFixed(2),
      farmersWithActivities,
      totalHarvests,
      totalBioInputs,
      cropModeData,
      mainCropData
    };
  }, [data]);
  
  const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Users className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-sm">Total Farmers</h3>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalFarmers}</div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-sm">Total Area (Acres)</h3>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalArea}</div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-sm">Active Farmers</h3>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.farmersWithActivities}</div>
          <div className="text-xs text-slate-500 mt-1">With logged activities</div>
        </div>
        
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-sm">Total Activities</h3>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.totalHarvests + stats.totalBioInputs}</div>
          <div className="text-xs text-slate-500 mt-1">{stats.totalHarvests} Harvests, {stats.totalBioInputs} Bio Inputs</div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-slate-400" />
            <h3 className="font-bold text-slate-800">Crop Modes Distribution</h3>
          </div>
          <div className="h-[300px]">
            {stats.cropModeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.cropModeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
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
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-slate-400" />
            <h3 className="font-bold text-slate-800">Top 5 Main Crops</h3>
          </div>
          <div className="h-[300px]">
            {stats.mainCropData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.mainCropData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
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

content = content + overview_component

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
