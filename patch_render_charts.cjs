const fs = require('fs');

function patch() {
  const file = 'src/pages/admin/CropsDashboard.tsx';
  let content = fs.readFileSync(file, 'utf8');

  const newCharts = `      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Village-wise Farmers Count */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[400px] overflow-hidden min-w-0">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Top 10 Villages by Farmer Count</h3>
          </div>
          <div className="flex-1 min-h-0 relative">
            {stats.villageData.length > 0 ? (
              <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <BarChart data={stats.villageData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
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
                  <RechartsTooltip isAnimationActive={false} wrapperStyle={{ pointerEvents: 'none' }}
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
                    <LabelList dataKey="value" position="top" style={{ fontSize: '11px', fill: '#64748b', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
            )}
          </div>
        </div>

        {/* Season-wise Farmers Count */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[400px] overflow-hidden min-w-0">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <PieChartIcon className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Season-wise Plots</h3>
          </div>
          <div className="flex-1 min-h-0 relative">
            {stats.seasonData.length > 0 ? (
              <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                  <Pie
                    data={stats.seasonData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive={false}
                    labelLine={false}
                  >
                    {stats.seasonData.map((entry, index) => (
                      <Cell key={\`cell-\${index}\`} fill={COLORS[(index + 4) % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip isAnimationActive={false} wrapperStyle={{ pointerEvents: 'none' }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
            )}
          </div>
        </div>
      </div>
`;
  
  content = content.replace(
    "{/* HDFC Insights */}",
    `${newCharts}\n      {/* HDFC Insights */}`
  );

  fs.writeFileSync(file, content, 'utf8');
}
patch();
console.log("Successfully patched new charts in render");
