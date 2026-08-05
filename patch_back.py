import re

with open('src/pages/admin/VillageGIS.tsx', 'r') as f:
    content = f.read()

# HubMarker
old_hub_icon = """  const hubIcon = L.divIcon({
      className: 'custom-dot',
      html: `<div class="hub-marker-dot rounded-full border-1.5 border-white shadow-sm transition-all duration-300 ${colorClass} w-3 h-3 hover:scale-110"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -10]
  });"""

new_hub_icon = """  const hubIcon = useMemo(() => L.divIcon({
      className: 'custom-dot',
      html: `<div class="hub-marker-dot rounded-full border-1.5 border-white shadow-sm transition-all duration-300 ${colorClass} w-3 h-3 hover:scale-110"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -10]
  }), [colorClass]);"""
content = content.replace(old_hub_icon, new_hub_icon)

# AssetMarker
old_asset_icon = """  const assetIcon = isSelected 
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

new_asset_icon = """  const assetIcon = useMemo(() => L.divIcon({
        className: 'custom-dot-blue',
        html: `<div class="${cn(
          "rounded-full border-1.5 border-white shadow-sm transition-all duration-300",
          isSelected ? "bg-blue-600 w-4 h-4 -mt-0.5 -ml-0.5 ring-4 ring-blue-200 animate-pulse-blue" : "bg-blue-500 w-2.5 h-2.5"
        )}"></div>`,
        iconSize: isSelected ? [24, 24] : [20, 20],
        iconAnchor: isSelected ? [12, 12] : [10, 10],
        popupAnchor: [0, -8]
      }), [isSelected]);"""
content = content.replace(old_asset_icon, new_asset_icon)

# VillageMarker
old_vill_icon = """  const icon = L.divIcon({
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

new_vill_icon = """  const icon = useMemo(() => L.divIcon({
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
content = content.replace(old_vill_icon, new_vill_icon)

# Add key to AssetMarker
old_marker = """    <Marker 
      position={[lat, lng]}
      icon={assetIcon}
      zIndexOffset={isSelected ? 2000 : 1000}"""

new_marker = """    <Marker 
      key={isSelected ? 'selected' : 'unselected'}
      position={[lat, lng]}
      icon={assetIcon}
      zIndexOffset={isSelected ? 2000 : 1000}"""

content = content.replace(old_marker, new_marker)

with open('src/pages/admin/VillageGIS.tsx', 'w') as f:
    f.write(content)
