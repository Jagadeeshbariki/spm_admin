import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

old_label = 'label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}'
new_label = 'label={({ name, value }) => `${name} (${value})`}'
content = content.replace(old_label, new_label)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
