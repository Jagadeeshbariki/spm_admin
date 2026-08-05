import re

with open('src/pages/admin/VillageGIS.tsx', 'r') as f:
    content = f.read()

old_vill_icon = """  const icon = useMemo(() => L.divIcon({
      className: 'custom-dot-green',
      html: `<div style="color: #10b981; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); cursor: pointer;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#10b981" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3" fill="white"></circle>
        </svg>
      </div>`,
      iconSize: [24, 24], 
      iconAnchor: [12, 24], // Anchor at the bottom tip of the pin
    }), []);"""

new_vill_icon = """  const icon = L.divIcon({
      className: 'custom-dot-green',
      html: `<div style="color: #10b981; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); cursor: pointer;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#10b981" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3" fill="white"></circle>
        </svg>
      </div>`,
      iconSize: [24, 24], 
      iconAnchor: [12, 24], // Anchor at the bottom tip of the pin
    });"""

content = content.replace(old_vill_icon, new_vill_icon)

with open('src/pages/admin/VillageGIS.tsx', 'w') as f:
    f.write(content)
