import re
with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    lines = f.readlines()
for i, line in enumerate(lines[520:540]):
    print(f"{520+i}: {line.rstrip()}")
