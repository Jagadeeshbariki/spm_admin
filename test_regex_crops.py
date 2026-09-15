import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

pattern = re.compile(
    r'<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-\[300px\] overflow-hidden min-w-0">\s*'
    r'<h3 className="text-xs font-bold text-slate-800 mb-4 shrink-0">([^<]+)</h3>\s*'
    r'<div className="flex-1 min-h-0">\s*'
    r'(.*?)\s*'
    r'</div>\s*'
    r'</div>',
    re.DOTALL
)

matches = pattern.findall(content)
print(f"Found {len(matches)} matches")
