import re

with open('src/pages/admin/CropMapTab.tsx', 'r') as f:
    content = f.read()

# 1. Remove the key from MapContainer
content = content.replace('            key={`map-${mapData.length}`}', '')

# 2. Add a MapUpdater component that reacts to center changes
map_updater_code = """
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';

function MapUpdater({ center, mapData }: { center: [number, number], mapData: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (mapData.length > 0) {
      map.setView(center, map.getZoom());
    }
  }, [center, map, mapData.length]);
  return null;
}
"""

content = content.replace("import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';", "import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';\nimport { useEffect } from 'react';\n\nfunction MapUpdater({ center, mapData }: { center: [number, number], mapData: any[] }) {  const map = useMap();  useEffect(() => {    if (mapData.length > 0) {      const bounds = L.latLngBounds(mapData.map(d => d.position));      if (bounds.isValid()) {        map.fitBounds(bounds, { padding: [50, 50] });      } else {        map.setView(center, map.getZoom());      }    }  }, [center, map, mapData]);  return null;}")

# 3. Add <MapUpdater> inside MapContainer
content = content.replace("            <LayersControl position=\"topright\">", "            <MapUpdater center={center} mapData={mapData} />\n            <LayersControl position=\"topright\">")

with open('src/pages/admin/CropMapTab.tsx', 'w') as f:
    f.write(content)
print("Fixed CropMapTab MapUpdater!")
