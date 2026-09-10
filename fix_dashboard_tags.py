with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines[620:630]):
    print(f"{i+620}: {line.rstrip()}")

print("---")

for i, line in enumerate(lines[820:835]):
    print(f"{i+820}: {line.rstrip()}")
