import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Fix pie chart radii
content = content.replace('innerRadius={60}', 'innerRadius="50%"')
content = content.replace('outerRadius={100}', 'outerRadius="80%"')
content = content.replace('paddingAngle={2}', 'paddingAngle={2}')

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
