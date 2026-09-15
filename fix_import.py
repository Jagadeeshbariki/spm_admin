with open('src/pages/admin/BYPDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "} , ScatterChart, Scatter, ZAxis } from 'recharts';",
    ", ScatterChart, Scatter, ZAxis } from 'recharts';"
)

with open('src/pages/admin/BYPDashboard.tsx', 'w') as f:
    f.write(content)
