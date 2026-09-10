import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

idx = content.find("function OverviewTab")
return_idx = content.find("return (", idx)
print(content[return_idx:return_idx+2000])
