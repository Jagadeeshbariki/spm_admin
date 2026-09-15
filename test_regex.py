import re

with open('src/pages/admin/BYPDashboard.tsx', 'r') as f:
    content = f.read()

pattern = re.compile(
    r'<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-\[280px\] flex flex-col">\s*'
    r'<h3 className="font-bold text-slate-800 text-xs mb-3">([^<]+)</h3>\s*'
    r'<div className="flex-1 min-h-0">\s*'
    r'(.*?)\s*'
    r'</div>\s*'
    r'</div>',
    re.DOTALL
)

matches = pattern.findall(content)
print(f"Found {len(matches)} matches")
