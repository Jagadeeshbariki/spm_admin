import re

with open('src/pages/admin/VillageGIS.tsx', 'r') as f:
    content = f.read()

# Define static icons at the top instead of useMemo
old_asset_icon = """  const assetIcon = useMemo(() => L.divIcon({
        className: 'custom-dot-blue',
        html: `<div class="${cn(
          "rounded-full border-1.5 border-white shadow-sm transition-all duration-300",
          isSelected ? "bg-blue-600 w-4 h-4 -mt-0.5 -ml-0.5 ring-4 ring-blue-200 animate-pulse-blue" : "bg-blue-500 w-2.5 h-2.5"
        )}"></div>`,
        iconSize: isSelected ? [24, 24] : [20, 20],
        iconAnchor: isSelected ? [12, 12] : [10, 10],
        popupAnchor: [0, -8]
      }), [isSelected]);"""

new_asset_icon = """  const assetIcon = isSelected 
    ? L.divIcon({
        className: 'custom-dot-blue',
        html: `<div class="rounded-full border-1.5 border-white shadow-sm transition-all duration-300 bg-blue-600 w-4 h-4 -mt-0.5 -ml-0.5 ring-4 ring-blue-200 animate-pulse-blue"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -8]
      })
    : L.divIcon({
        className: 'custom-dot-blue',
        html: `<div class="rounded-full border-1.5 border-white shadow-sm transition-all duration-300 bg-blue-500 w-2.5 h-2.5"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        popupAnchor: [0, -8]
      });"""

content = content.replace(old_asset_icon, new_asset_icon)

with open('src/pages/admin/VillageGIS.tsx', 'w') as f:
    f.write(content)
