import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Add overflow-hidden to the chart card containers to prevent tooltip from causing scrollbars
old_pie_card = '<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[400px]">'
new_pie_card = '<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[400px] overflow-hidden">'
content = content.replace(old_pie_card, new_pie_card)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
