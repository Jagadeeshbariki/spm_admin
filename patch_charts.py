with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

target = "      {/* HDFC Insights */}"

replacement = """      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Bio Inputs Applied */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[300px] overflow-hidden min-w-0">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Bio Inputs Quantity Used</h3>
          </div>
          <div className="flex-1 min-h-0 relative">
            {stats.bioInputData && stats.bioInputData.length > 0 ? (
              <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <BarChart data={stats.bioInputData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
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
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
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

        {/* Harvest Data */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[300px] overflow-hidden min-w-0">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Harvest Quantity by Crop</h3>
          </div>
          <div className="flex-1 min-h-0 relative">
            {stats.harvestData && stats.harvestData.length > 0 ? (
              <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <BarChart data={stats.harvestData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
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
                  <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
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
      </div>

      {/* HDFC Insights */}"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
        f.write(content)
    print("Success")
else:
    print("Failed")
