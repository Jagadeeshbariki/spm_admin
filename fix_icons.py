import re

with open('src/pages/admin/CropMapTab.tsx', 'r') as f:
    content = f.read()

# We want to cache the custom icons so they aren't recreated on every render.
replacement_icon_cache = """// Custom SVG marker for coloring
const iconCache: Record<string, L.DivIcon> = {};

const createCustomIcon = (color: string) => {
  if (iconCache[color]) return iconCache[color];
  
  const markerHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="24" height="36" fill="${color}" stroke="white" stroke-width="15">
      <path d="M172.3 501.7C27 291 0 269.4 0 192 0 86 86 0 192 0s192 86 192 192c0 77.4-27 99-172.3 309.7-9.5 13.8-29.9 13.8-39.5 0zM192 272c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80z"/>
    </svg>
  `;
  const icon = new L.DivIcon({
    html: markerHtml,
    className: 'custom-leaflet-marker',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
  iconCache[color] = icon;
  return icon;
};"""

# find the original createCustomIcon function
original_icon_func = """// Custom SVG marker for coloring
const createCustomIcon = (color: string) => {
  const markerHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="24" height="36" fill="${color}" stroke="white" stroke-width="15">
      <path d="M172.3 501.7C27 291 0 269.4 0 192 0 86 86 0 192 0s192 86 192 192c0 77.4-27 99-172.3 309.7-9.5 13.8-29.9 13.8-39.5 0zM192 272c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80z"/>
    </svg>
  `;
  return new L.DivIcon({
    html: markerHtml,
    className: 'custom-leaflet-marker',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36],
  });
};"""

if original_icon_func in content:
    content = content.replace(original_icon_func, replacement_icon_cache)
    with open('src/pages/admin/CropMapTab.tsx', 'w') as f:
        f.write(content)
    print("Replaced icon cache in CropMapTab.tsx")
else:
    print("Could not find the function in CropMapTab.tsx")

