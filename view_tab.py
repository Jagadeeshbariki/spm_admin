with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

idx = content.find("function OverviewTab")
print(content[idx:idx+4000])
