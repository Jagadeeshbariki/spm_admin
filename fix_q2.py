import re

with open('src/pages/admin/BYPDashboard.tsx', 'r') as f:
    content = f.read()

# Replace lines 115-116
content = content.replace("""      const q = String(item.Quarter || 'Unknown').trim();
      const q = String(item.Quarter || 'Unknown').trim();""", """      const q = String(item.Quarter || 'Unknown').trim();
      const d = String(item.survey_date || 'Unknown').trim();""")

with open('src/pages/admin/BYPDashboard.tsx', 'w') as f:
    f.write(content)

