with open('src/pages/admin/CropMapTab.tsx', 'r') as f:
    content = f.read()

content = content.replace("import L from 'leaflet';", "")
content = "import L from 'leaflet';\n" + content

with open('src/pages/admin/CropMapTab.tsx', 'w') as f:
    f.write(content)
print("Fixed import L")
