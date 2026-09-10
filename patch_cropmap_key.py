import re

with open('src/pages/admin/CropMapTab.tsx', 'r') as f:
    content = f.read()

replacement = """        {mapData.length > 0 ? (
          <MapContainer 
            key={`map-${mapData.length}`}
            center={center} """

if "        {mapData.length > 0 ? (\n          <MapContainer \n            center={center} " in content:
    content = content.replace("        {mapData.length > 0 ? (\n          <MapContainer \n            center={center} ", replacement)
    with open('src/pages/admin/CropMapTab.tsx', 'w') as f:
        f.write(content)
    print("Added key to MapContainer!")
else:
    print("Could not find MapContainer to add key to.")
