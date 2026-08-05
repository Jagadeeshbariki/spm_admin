import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Add isAnimationActive={false} to Pie
old_pie = """                  <Pie
                    data={stats.cropModeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >"""

new_pie = """                  <Pie
                    data={stats.cropModeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >"""
content = content.replace(old_pie, new_pie)

# Add isAnimationActive={false} to Bar
old_bar = """                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    <LabelList dataKey="value" position="top" style={{ fontSize: '11px', fill: '#64748b', fontWeight: 'bold' }} />
                  </Bar>"""
new_bar = """                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
                    <LabelList dataKey="value" position="top" style={{ fontSize: '11px', fill: '#64748b', fontWeight: 'bold' }} />
                  </Bar>"""
content = content.replace(old_bar, new_bar)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
