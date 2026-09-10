with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Fix the parent
content = content.replace(
    '<div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">',
    '<div className="flex flex-col gap-4 flex-1 min-h-0">',
    1 # Only first occurrence
)

# In OverviewTab, we want it to not scroll internally if it fits, but if not it can scroll.
content = content.replace(
    '<div className="flex flex-col gap-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">',
    '<div className="flex flex-col gap-3 flex-1 min-h-0 h-full overflow-y-auto custom-scrollbar pb-6">'
)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

print("Fixed scrolling.")
