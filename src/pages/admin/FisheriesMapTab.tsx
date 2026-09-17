import * as L from 'leaflet';
import React, { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, User, Maximize2, Minimize2, Waves, Anchor } from 'lucide-react';

function MapUpdater({ center, mapData }: { center: [number, number], mapData: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (mapData.length > 0) {
      const bounds = L.latLngBounds(mapData.map(d => d.position));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.setView(center, map.getZoom());
      }
    }
  }, [center, map, mapData]);
  return null;
}

// Fix for default Leaflet markers in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom colored markers
const createCustomMarker = (color: string) => {
  return L.divIcon({
    className: 'custom-pin',
    html: `<div style="background-color: ${color}; width: 1.5rem; height: 1.5rem; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

const getConditionColor = (condition: string) => {
  const normalized = String(condition).toLowerCase().trim();
  if (normalized.includes('good')) return '#10b981'; // emerald
  if (normalized.includes('suitable')) return '#3b82f6'; // blue
  if (normalized.includes('poor') || normalized.includes('not')) return '#ef4444'; // red
  if (normalized.includes('dry')) return '#f59e0b'; // amber
  return '#94a3b8'; // slate
};

export function FisheriesMapTab({ data, setPreviewImage }: { data: any[], setPreviewImage: (url: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Extract coordinates and prepare map markers
  const mapData = useMemo(() => {
    const validPoints = data.filter(item => {
      return item.coordinates && 
             Array.isArray(item.coordinates) && 
             item.coordinates.length >= 2 && 
             item.coordinates[0] !== 0 && 
             item.coordinates[1] !== 0;
    });

    return validPoints.map(item => {
      // GeoJSON is [longitude, latitude], Leaflet needs [latitude, longitude]
      const lat = item.coordinates[1];
      const lng = item.coordinates[0];
      
      const conditionColor = getConditionColor(item.pondCondition);

      return {
        ...item,
        position: [lat, lng] as [number, number],
        color: conditionColor,
        icon: createCustomMarker(conditionColor)
      };
    });
  }, [data]);

  const mapCenter: [number, number] = mapData.length > 0 
    ? mapData[0].position 
    : [18.92, 83.79]; // default fallback (near Parvathipuram Manyam)

  if (mapData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-[600px] flex flex-col items-center justify-center p-8 text-center">
        <MapPin className="w-16 h-16 text-slate-300 mb-4" />
        <h3 className="text-xl font-bold text-slate-700 mb-2">No Location Data Available</h3>
        <p className="text-slate-500 max-w-md">
          None of the filtered records contain valid GPS coordinates. Adjust your filters or check the raw data.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50' : 'h-[600px] relative'}`}>
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center z-10 shrink-0">
        <div>
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Water Bodies Spatial View
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Showing {mapData.length} locations with valid GPS coordinates</p>
        </div>
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-sm flex items-center gap-2 font-medium text-sm"
        >
          {isExpanded ? (
            <><Minimize2 className="w-4 h-4" /> Exit Fullscreen</>
          ) : (
            <><Maximize2 className="w-4 h-4" /> Fullscreen Map</>
          )}
        </button>
      </div>

      <div className="flex-1 relative z-0">
        <MapContainer 
          center={mapCenter} 
          zoom={10} 
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="OpenStreetMap">
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

          <MapUpdater center={mapCenter} mapData={mapData} />

          {mapData.map((item, idx) => (
            <Marker 
              key={`${item.submissionId}-${idx}`} 
              position={item.position}
              icon={item.icon}
            >
              <Popup className="water-body-popup">
                <div className="min-w-[200px] p-1">
                  <div className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    {item.farmerName}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start justify-between">
                      <span className="text-slate-500 font-medium">Village:</span>
                      <span className="text-slate-700">{item.village}</span>
                    </div>
                    
                    <div className="flex items-start justify-between">
                      <span className="text-slate-500 font-medium">Tank Name:</span>
                      <span className="text-slate-700 font-semibold">{item.tankName}</span>
                    </div>

                    <div className="flex items-start justify-between">
                      <span className="text-slate-500 font-medium">Area:</span>
                      <span className="text-slate-700">{item.extentAcre} acres</span>
                    </div>

                    <div className="flex items-start justify-between">
                      <span className="text-slate-500 font-medium">Condition:</span>
                      <span className="capitalize font-medium" style={{ color: item.color }}>
                        {item.pondCondition.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-start justify-between">
                      <span className="text-slate-500 font-medium">Water Avail.:</span>
                      <span className="capitalize font-medium text-slate-700">
                        {item.monthsWaterAvailable ? item.monthsWaterAvailable.replace(/_/g, ' ') : '-'}
                      </span>
                    </div>
                  </div>

                  {item.pondImage && (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPreviewImage(`/api/odk/image?v=4&formId=Fishponds_Assessment%202025&submissionId=${encodeURIComponent(item.submissionId)}&filename=${encodeURIComponent(item.pondImage)}`);
                      }}
                      className="mt-3 w-full py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded hover:bg-blue-100 transition-colors"
                    >
                      View Photo
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur border border-slate-200 shadow-lg rounded-xl p-4 z-[400] text-sm">
        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <Waves className="w-4 h-4 text-blue-500" />
          Pond Condition
        </h4>
        <div className="space-y-2.5 mt-3">
          {[
            { label: 'Suitable', color: '#3b82f6' },
            { label: 'Good', color: '#10b981' },
            { label: 'Poor / Not Suitable', color: '#ef4444' },
            { label: 'Dry', color: '#f59e0b' },
            { label: 'Other', color: '#94a3b8' },
          ].map((type) => (
            <div key={type.label} className="flex items-center gap-2.5">
              <div 
                className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm" 
                style={{ backgroundColor: type.color }}
              />
              <span className="text-slate-600 font-medium text-xs">{type.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
