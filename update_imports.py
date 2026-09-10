with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()
target = "import { Filter, Search"
replacement = "import { FlaskConical, Wheat, Filter, Search"
if target in content:
    content = content.replace(target, replacement)
    with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
        f.write(content)
    print("Imports updated!")
else:
    print("Could not find target imports")
