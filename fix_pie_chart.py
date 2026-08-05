import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

old_colors = "const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];"
new_colors = "const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];"
content = content.replace(old_colors, new_colors)

old_pie = """                <PieChart>
                  <Pie
                    data={stats.cropModeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive={false}
                    label={({ name, value }) => `${name} (${value})`}
                    labelLine={false}
                  >
                    {stats.cropModeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip isAnimationActive={false} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>"""

new_pie = """                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                  <Pie
                    data={stats.cropModeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive={false}
                    labelLine={false}
                  >
                    {stats.cropModeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip isAnimationActive={false} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>"""

content = content.replace(old_pie, new_pie)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

