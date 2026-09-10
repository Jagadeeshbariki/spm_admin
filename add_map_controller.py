with open('src/pages/admin/VillageGIS.tsx', 'r') as f:
    content = f.read()

target = """            <MapContainer center={center as [number, number]} zoom={11} className="w-full h-full" zoomControl={true}>
              {mapType === 'streets' ? ("""

replacement = """            <MapContainer center={center as [number, number]} zoom={11} className="w-full h-full" zoomControl={true}>
              <MapController center={center as [number, number]} zoom={11} />
              {mapType === 'streets' ? ("""

if target in content:
    content = content.replace(target, replacement)
    with open('src/pages/admin/VillageGIS.tsx', 'w') as f:
        f.write(content)
    print("Added MapController!")
else:
    print("Could not find target in VillageGIS.tsx")
