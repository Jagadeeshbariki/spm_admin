import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

pattern = re.compile(
    r'<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-\[300px\] overflow-hidden min-w-0">\s*'
    r'<div className="flex items-center gap-2 mb-4 shrink-0">\s*'
    r'(<[A-Za-z0-9_]+ className="[^"]+" />)\s*'
    r'<h3 className="font-bold text-slate-800 text-sm">([^<]+)</h3>\s*'
    r'</div>\s*'
    r'<div className="flex-1 min-h-0 relative">\s*'
    r'(.*?)\s*'
    r'</div>\s*'
    r'</div>',
    re.DOTALL
)

matches = pattern.findall(content)
print(f"Found {len(matches)} matches")

