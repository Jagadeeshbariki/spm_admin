import re

with open('src/pages/admin/VillageGIS.tsx', 'r') as f:
    content = f.read()

old_hub_icon = """  const hubIcon = useMemo(() => L.divIcon({
      className: 'custom-dot',
      html: `<div class="hub-marker-dot rounded-full border-1.5 border-white shadow-sm transition-all duration-300 ${colorClass} w-3 h-3 hover:scale-110"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -10]
  }), [colorClass]);"""

new_hub_icon = """  const hubIcon = L.divIcon({
      className: 'custom-dot',
      html: `<div class="hub-marker-dot rounded-full border-1.5 border-white shadow-sm transition-all duration-300 ${colorClass} w-3 h-3 hover:scale-110"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -10]
  });"""

content = content.replace(old_hub_icon, new_hub_icon)

with open('src/pages/admin/VillageGIS.tsx', 'w') as f:
    f.write(content)
