import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace("raw: sub", "raw: flat")

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
