import re

with open('src/pages/admin/BYPDashboard.tsx', 'r') as f:
    content = f.read()

# Add import
if "ExpandableChartBox" not in content:
    content = content.replace(
        "import { cn } from '../../lib/utils';",
        "import { cn } from '../../lib/utils';\nimport { ExpandableChartBox } from '../../components/ExpandableChartBox';"
    )

# Pattern for charts
pattern = re.compile(
    r'<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-\[280px\] flex flex-col">\s*'
    r'<h3 className="font-bold text-slate-800 text-xs mb-3">([^<]+)</h3>\s*'
    r'<div className="flex-1 min-h-0">\s*'
    r'(.*?)\s*'
    r'</div>\s*'
    r'</div>',
    re.DOTALL
)

def replace_func(match):
    title = match.group(1)
    inner_content = match.group(2)
    return f'<ExpandableChartBox title="{title}" className="p-3 h-[280px]">{inner_content}</ExpandableChartBox>'

content = pattern.sub(replace_func, content)

with open('src/pages/admin/BYPDashboard.tsx', 'w') as f:
    f.write(content)
