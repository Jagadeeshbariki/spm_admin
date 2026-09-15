import re

with open('src/components/UtilizationDashboard.tsx', 'r') as f:
    content = f.read()

# Add import
if "ExpandableChartBox" not in content:
    content = content.replace(
        "import { Search, MapPin, Package, Users, Database, ChevronDown, ChevronRight, Activity, Calendar, FileText } from 'lucide-react';",
        "import { Search, MapPin, Package, Users, Database, ChevronDown, ChevronRight, Activity, Calendar, FileText } from 'lucide-react';\nimport { ExpandableChartBox } from './ExpandableChartBox';"
    )

# 1. Pattern for the top two charts
pattern1 = re.compile(
    r'<div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">\s*'
    r'<div className="mb-4">\s*'
    r'(.*?)\s*'
    r'</div>\s*'
    r'<div className="h-\[350px\] w-full">\s*'
    r'(.*?)\s*'
    r'</div>\s*'
    r'</div>',
    re.DOTALL
)

def replace_func1(match):
    header = match.group(1).strip()
    chart = match.group(2).strip()
    return f'<ExpandableChartBox title={{<div className="mb-4">{header}</div>}} className="p-5" contentClassName="h-[350px] w-full">{chart}</ExpandableChartBox>'

content = pattern1.sub(replace_func1, content)

# 2. Pattern for the bottom two charts
pattern2 = re.compile(
    r'<div className="flex flex-col">\s*'
    r'<h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">\s*'
    r'(.*?)\s*'
    r'</h4>\s*'
    r'<div className="h-\[200px\] w-full">\s*'
    r'(.*?)\s*'
    r'</div>\s*'
    r'</div>',
    re.DOTALL
)

def replace_func2(match):
    header = match.group(1).strip()
    chart = match.group(2).strip()
    return f'<ExpandableChartBox title={{<h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">{header}</h4>}} className="p-3" contentClassName="h-[200px] w-full">{chart}</ExpandableChartBox>'

content = pattern2.sub(replace_func2, content)

with open('src/components/UtilizationDashboard.tsx', 'w') as f:
    f.write(content)

