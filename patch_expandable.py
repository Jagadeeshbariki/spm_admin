import re

with open('src/components/ExpandableChartBox.tsx', 'r') as f:
    content = f.read()

content = content.replace("@/lib/utils", "../lib/utils")

with open('src/components/ExpandableChartBox.tsx', 'w') as f:
    f.write(content)
