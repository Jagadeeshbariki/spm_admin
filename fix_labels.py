import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Add LabelList to imports
if "LabelList" not in content:
    content = content.replace("BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend", 
                              "BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList")

old_bar = """                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {/* Note: In standard Recharts, adding LabelList works to show labels on bars */}
                  </Bar>"""

new_bar = """                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    <LabelList dataKey="value" position="top" style={{ fontSize: '11px', fill: '#64748b', fontWeight: 'bold' }} />
                  </Bar>"""

content = content.replace(old_bar, new_bar)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
