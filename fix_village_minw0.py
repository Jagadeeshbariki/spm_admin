import re

with open('src/pages/admin/VillageGIS.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'min-h-[200px] w-full flex-1 relative flex items-center justify-center',
    'min-h-[200px] w-full flex-1 relative flex items-center justify-center min-w-0'
)
content = content.replace(
    'className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"',
    'className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 min-w-0"'
)

with open('src/pages/admin/VillageGIS.tsx', 'w') as f:
    f.write(content)

