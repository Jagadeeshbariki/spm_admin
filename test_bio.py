with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Let's find how item is formed.
import re
match = re.search(r'const formattedData = plotData\.map\(\(plot: any\) => \{(.*?)\}\);', content, re.DOTALL)
if match:
    print(match.group(1)[:1500])
