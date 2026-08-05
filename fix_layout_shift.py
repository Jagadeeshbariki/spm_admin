import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Add overflow-y-scroll to prevent layout shift
old_wrapper = 'className="bg-[#F5F7FA] min-h-screen -m-4 md:-m-8 p-4 md:p-8 font-sans text-slate-800"'
new_wrapper = 'className="bg-[#F5F7FA] min-h-screen -m-4 md:-m-8 p-4 md:p-8 font-sans text-slate-800" style={{ overflowY: "scroll" }}'
content = content.replace(old_wrapper, new_wrapper)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
