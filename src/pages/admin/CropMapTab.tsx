import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Sprout, Calendar, User, Maximize2, Minimize2 } from 'lucide-react';

// Fix for default Leaflet markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const PALETTE = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#a855f7', '#14b8a6', '#f43f5e', '#eab308'];

// Color mapping for crop modes
const getCropModeColor = (mode: string) => {
  const normalized = String(mode).toLowerCase().trim();
  if (normalized.includes('cotton')) return '#f43f5e'; // rose
  if (normalized.includes('turmeric')) return '#eab308'; // yellow
  if (normalized.includes('poly')) return '#8b5cf6'; // purple
  if (normalized.includes('mono')) return '#3b82f6'; // blue
  if (normalized.includes('mixed')) return '#f97316'; // orange
  if (normalized.includes('border')) return '#10b981'; // emerald
  if (normalized === 'other' || normalized === 'unknown') return '#94a3b8'; // slate

  // deterministic hash for unknown modes
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
     hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
};

// Custom SVG marker for coloring
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
};

interface CropMapTabProps {
  data: any[];
}

export function CropMapTab({ data }: CropMapTabProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const mapData = useMemo(() => {
    return data
      .filter(d => {
        return d.coordinates && Array.isArray(d.coordinates) && d.coordinates.length >= 2;
      })
      .map(d => {
        // GeoJSON uses [longitude, latitude], Leaflet needs [latitude, longitude]
        const lng = parseFloat(d.coordinates[0]);
        const lat = parseFloat(d.coordinates[1]);
        return {
          ...d,
          position: [lat, lng] as [number, number]
        };
      })
      .filter(d => !isNaN(d.position[0]) && !isNaN(d.position[1]));
  }, [data]);

  // Center on Andhra Pradesh / project area if no data, else center on average
  const center: [number, number] = useMemo(() => {
    if (mapData.length === 0) return [18.2, 83.5]; // Default approx coordinate for Srikakulam area
    
    let sumLat = 0;
    let sumLng = 0;
    mapData.forEach(d => {
      sumLat += d.position[0];
      sumLng += d.position[1];
    });
    return [sumLat / mapData.length, sumLng / mapData.length];
  }, [mapData]);

  // Group by crop for legend
  const cropColors = useMemo(() => {
    const crops = new Set<string>();
    mapData.forEach(d => {
      const crop = d.cropMode && d.cropMode !== 'Unknown' && d.cropMode !== '-' ? d.cropMode : 'Other';
      crops.add(crop);
    });
    
    const legend: {name: string, color: string}[] = [];
    crops.forEach(c => {
      legend.push({ name: c, color: getCropModeColor(c) });
    });
    return legend.sort((a, b) => a.name.localeCompare(b.name));
  }, [mapData]);

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            Crop Model Distribution Map
          </h2>
          <p className="text-sm text-slate-500">
            Showing {mapData.length} plots with valid GPS coordinates based on current filters.
          </p>
        </div>
        
        {/* Legend */}
        {cropColors.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
            <span className="font-semibold text-slate-700 mr-1">Legend:</span>
            {cropColors.map(c => (
              <div key={c.name} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-slate-700">{c.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`w-full overflow-hidden border border-slate-200 bg-slate-100 relative transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[9999] h-screen rounded-none' : 'h-[600px] rounded-xl'}`}>
        <button 
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="absolute bottom-6 right-4 z-[400] bg-white p-2 rounded-lg shadow-md border border-slate-200 hover:bg-slate-50 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5 text-slate-700" /> : <Maximize2 className="w-5 h-5 text-slate-700" />}
        </button>
        {mapData.length > 0 ? (
          <MapContainer 
            center={center} 
            zoom={10} 
            style={{ height: '100%', width: '100%', zIndex: 0 }}
            scrollWheelZoom={true}
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Street Map">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Satellite">
                <TileLayer
                  attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              </LayersControl.BaseLayer>
            </LayersControl>
            {mapData.map((plot, i) => (
              <Marker 
                key={`${plot.plotSubmissionId}-${i}`} 
                position={plot.position}
                icon={createCustomIcon(getCropModeColor(plot.cropMode))}
              >
                <Popup className="crop-popup">
                  <div className="p-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{plot.farmerName || 'Unknown Farmer'}</div>
                        <div className="text-xs text-slate-500">{plot.village}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Main Crop</span>
                        <span className="font-semibold text-slate-800">{plot.mainCrop}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Crop Mode</span>
                        <span className="font-medium text-slate-700">{plot.cropMode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Area</span>
                        <span className="font-medium text-slate-700">{plot.area} Acres</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Season</span>
                        <span className="font-medium text-slate-700">{plot.season} {plot.year}</span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <MapPin className="w-12 h-12 mb-2 opacity-50" />
            <p>No plots with valid GPS coordinates match your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
