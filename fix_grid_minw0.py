import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[400px] overflow-hidden">',
    '<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[400px] overflow-hidden min-w-0">'
)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

