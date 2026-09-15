import re

with open('src/components/UtilizationDashboard.tsx', 'r') as f:
    content = f.read()

pattern = re.compile(
    r'<div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">\s*'
    r'<div className="mb-4">\s*'
    r'<h3 className="font-bold text-slate-800">([^<]+)</h3>\s*'
    r'(.*?)\s*'
    r'</div>\s*'
    r'<div className="h-\[300px\] w-full">\s*'
    r'(.*?)\s*'
    r'</div>\s*'
    r'</div>',
    re.DOTALL
)

matches = pattern.findall(content)
print(f"Found {len(matches)} matches")

