import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Add import
if "ExpandableChartBox" not in content:
    content = content.replace(
        "import { cn } from '../../lib/utils';",
        "import { cn } from '../../lib/utils';\nimport { ExpandableChartBox } from '../../components/ExpandableChartBox';"
    )

pattern = re.compile(
    r'<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-\[300px\] overflow-hidden min-w-0">\s*'
    r'<div className="flex items-center gap-2 mb-4 shrink-0">\s*'
    r'(.*?)\s*'
    r'</div>\s*'
    r'<div className="flex-1 min-h-0 relative">\s*'
    r'(.*?)\s*'
    r'</div>\s*'
    r'</div>',
    re.DOTALL
)

def replace_func(match):
    header_content = match.group(1).strip()
    inner_content = match.group(2).strip()
    # The header_content is a JSX node, we can pass it as title prop
    return f'<ExpandableChartBox title={{<div className="flex items-center gap-2">{header_content}</div>}} className="p-4 h-[300px]">{inner_content}</ExpandableChartBox>'

content = pattern.sub(replace_func, content)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

