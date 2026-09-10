with open('src/pages/admin/VillageGIS.tsx', 'r') as f:
    content = f.read()

# For the first MapContainer (line 505)
if '<MapContainer center={center as [number, number]} zoom={11} className="w-full h-full" zoomControl={true}>' in content:
    content = content.replace(
        '<MapContainer center={center as [number, number]} zoom={11} className="w-full h-full" zoomControl={true}>',
        '<MapContainer key="preview-map" center={center as [number, number]} zoom={11} className="w-full h-full" zoomControl={true}>'
    )

if '        <MapContainer \n          center={mapCenter} \n          zoom={mapZoom} \n          className="h-full w-full"\n          zoomControl={false}\n        >' in content:
    content = content.replace(
        '        <MapContainer \n          center={mapCenter} \n          zoom={mapZoom} \n          className="h-full w-full"\n          zoomControl={false}\n        >',
        '        <MapContainer \n          key={`main-map-${Date.now()}`} \n          center={mapCenter} \n          zoom={mapZoom} \n          className="h-full w-full"\n          zoomControl={false}\n        >'
    )
    # Actually wait, using Date.now() for a key on every render will unmount it constantly! Let's just give it a static key if it's the main map.
    
