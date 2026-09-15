with open('src/pages/admin/BYPDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "from 'recharts';",
    ", ScatterChart, Scatter, ZAxis } from 'recharts';"
)

with open('src/pages/admin/BYPDashboard.tsx', 'w') as f:
    f.write(content)
