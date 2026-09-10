with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'h-[400px]',
    'h-[300px]'
)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
