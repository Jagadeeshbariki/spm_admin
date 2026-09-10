import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Make the outer container strict height and flex col
content = content.replace(
    'className="bg-slate-50 min-h-[calc(100vh-64px)] -m-4 md:-m-8 p-4 md:p-6 font-sans text-slate-800 overflow-x-hidden"',
    'className="bg-slate-50 h-[calc(100vh-64px)] -m-4 md:-m-8 p-4 font-sans text-slate-800 flex flex-col overflow-hidden"'
)

# Replace the inner flex col container
content = content.replace(
    'className="w-full flex flex-col gap-6"',
    'className="w-full h-full flex flex-col gap-4"'
)

# Shrink the filter panel
content = content.replace(
    'className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200"',
    'className="bg-white p-3 md:p-4 rounded-xl shadow-sm border border-slate-200 shrink-0"'
)

content = content.replace(
    'className="flex flex-col gap-6"',
    'className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1"'
)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

print("Patched layout.")
