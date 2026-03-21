import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { Loader2, Map as MapIcon, Layers, Info, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { fetchSheet } from '../../lib/api';
import { useAuth } from '../../lib/AuthContext';

// Fix for default marker icons in Leaflet with Webpack/Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function WaterCollective() {
  const [loading, setLoading] = useState(false);
  const [geoJsonData, setGeoJsonData] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [availableSites, setAvailableSites] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase();
  const canEdit = userRole === 'admin' || userRole === 'office admin';

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      setIsInitialLoading(true);
      const data = await fetchSheet('water_collectives');
      setAvailableSites(data);
    } catch (error) {
      console.error('Failed to load sites:', error);
      toast.error('Failed to load water collectives');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const toggleFile = async (site: any) => {
    const filename = site['File Name'] || site['Water Collective Name'];
    const url = site['GeoJSON URL'];

    if (selectedFiles.includes(filename)) {
      setSelectedFiles(prev => prev.filter(f => f !== filename));
      setGeoJsonData(prev => prev.filter(d => d.filename !== filename));
    } else {
      if (!url) {
        toast.error('No GeoJSON file linked to this site');
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load GeoJSON');
        const data = await response.json();
        setGeoJsonData(prev => [...prev, { filename, data }]);
        setSelectedFiles(prev => [...prev, filename]);
        toast.success(`Loaded ${filename}`);
      } catch (error) {
        console.error(error);
        toast.error(`Error loading ${filename}. Please check the file access.`);
      } finally {
        setLoading(false);
      }
    }
  };

  const onEachFeature = (feature: any, layer: any) => {
    if (feature.properties) {
      const popupContent = Object.entries(feature.properties)
        .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
        .join('<br/>');
      layer.bindPopup(popupContent);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Water Collective</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
            <Info className="w-4 h-4" />
            <span>Visualize irrigation sites managed in the admin section</span>
          </div>
        </div>
        {canEdit && (
          <Link 
            to="/admin/water-collective-management"
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Settings className="w-4 h-4" /> Manage Sites
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Sidebar for layers */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-6 overflow-y-auto">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <Layers className="w-5 h-5 text-blue-600" />
            <h2>Irrigation Sites</h2>
          </div>
          
          <div className="flex flex-col gap-2">
            {availableSites.length > 0 ? availableSites.map(site => {
              const filename = site['File Name'] || site['Water Collective Name'];
              return (
                <label 
                  key={site._rowIndex}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedFiles.includes(filename) 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={selectedFiles.includes(filename)}
                    onChange={() => toggleFile(site)}
                  />
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    selectedFiles.includes(filename) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                  }`}>
                    {selectedFiles.includes(filename) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{site['Water Collective Name']}</span>
                    <span className="text-[10px] opacity-70">{site['Village']}{site['Mandal'] ? `, ${site['Mandal']}` : ''}</span>
                  </div>
                </label>
              );
            }) : (
              <p className="text-sm text-slate-400 text-center py-4">No sites found. Add them in Admin Settings.</p>
            )}
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-blue-600 text-sm animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading layer...</span>
            </div>
          )}

          <div className="mt-auto pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 leading-relaxed">
              GeoJSON files allow you to visualize geographic data like points, lines, and polygons on the map.
            </p>
          </div>
        </div>

        {/* Map Area */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative min-h-[500px]">
          <MapContainer 
            center={[18.66, 83.95]} 
            zoom={10} 
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {geoJsonData.map((item, idx) => (
              <GeoJSON 
                key={item.filename} 
                data={item.data} 
                onEachFeature={onEachFeature}
                style={{
                  color: idx % 2 === 0 ? '#3b82f6' : '#10b981',
                  weight: 3,
                  opacity: 0.7,
                  fillOpacity: 0.2
                }}
              />
            ))}
            <MapResizer />
          </MapContainer>
          
          {geoJsonData.length === 0 && !loading && (
            <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-3 text-center max-w-xs">
                <MapIcon className="w-12 h-12 text-slate-300" />
                <h3 className="font-semibold text-slate-800">No Layers Selected</h3>
                <p className="text-sm text-slate-500">Select a layer from the sidebar to visualize irrigation sites on the map.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}
