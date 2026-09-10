with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

idx = content.find("return (")
print(content[idx+300:idx+1500])
