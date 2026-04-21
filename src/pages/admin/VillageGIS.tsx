import { useState, useEffect, useMemo } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  GeoJSON, 
  Marker, 
  Popup, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Search, 
  Filter, 
  Map as MapIcon, 
  Layers, 
  Info,
  ChevronRight,
  Maximize2,
  Navigation,
  Globe,
  MapPin
} from 'lucide-react';
import { fetchSheet, getSetting, fetchGeoJson } from '@/lib/api';
import { cn } from '@/lib/utils';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom dot icons with optimized hit zones
const blueDotIcon = L.divIcon({
  className: 'custom-dot-blue',
  html: `<div style="background-color: #3b82f6; width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.2); cursor: pointer;"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -8]
});

const greenDotIcon = L.divIcon({
  className: 'custom-dot-green',
  html: `<div style="color: #10b981; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3)); cursor: pointer;">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#10b981" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
      <circle cx="12" cy="10" r="3" fill="white"></circle>
    </svg>
  </div>`,
  iconSize: [24, 24], 
  iconAnchor: [12, 24], // Anchor at the bottom tip of the pin
  popupAnchor: [0, -24]
});

interface ActivityAsset {
  _rowIndex?: number;
  'Mandal'?: string;
  'Village Name'?: string;
  'Activity Name'?: string;
  'Latitude'?: string | number;
  'Longitude'?: string | number;
  'Details'?: string;
  'Asset Type'?: string;
  'GP'?: string;
  [key: string]: any;
}

interface GeoVillage {
  type: string;
  properties: any;
  geometry: {
    type: string;
    coordinates: any;
  };
}

function MapController({ center, zoom, bounds }: { center: [number, number], zoom: number, bounds?: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [20, 20] });
    } else {
      map.setView(center, zoom);
    }
  }, [center, zoom, bounds, map]);
  return null;
}

export default function VillageGIS() {
  const [loading, setLoading] = useState(true);
  const [villageAssets, setVillageAssets] = useState<ActivityAsset[]>([]);
  const [boundaryDataList, setBoundaryDataList] = useState<any[]>([]);
  const [geoVillages, setGeoVillages] = useState<GeoVillage[]>([]);
  const [loadingBoundary, setLoadingBoundary] = useState(false);
  const [selectedMandal, setSelectedMandal] = useState('All Mandals');
  const [selectedActivity, setSelectedActivity] = useState('All Activities');
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [showActivityLayer, setShowActivityLayer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([18.85, 83.8]); // Centered on Manyam area
  const [mapZoom, setMapZoom] = useState(10);
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('satellite');

  useEffect(() => {
    loadData();
    loadBoundaries();
  }, []);

  const loadBoundaries = async () => {
    try {
      setLoadingBoundary(true);
      const polygons = await fetchSheet('Polygons_manyam');
      
      const geoResults = await Promise.all(
        polygons.map(async (row) => {
          if (!row['File ID']) return null;
          try {
            const data = await fetchGeoJson(row['File ID']);
            return { row, data };
          } catch (err) {
            console.error(`Failed to load GeoJSON for ${row['File Name']}:`, err);
            return null;
          }
        })
      );

      const loadedBoundaries: any[] = [];
      const loadedPoints: any[] = [];

      geoResults.forEach((res) => {
        if (!res || !res.data) return;
        const { row, data } = res;

        const isBoundary = row['Region Type']?.toLowerCase() === 'boundary' || row['File Name']?.toLowerCase().includes('bvs');
        
        if (isBoundary) {
          // Filter out points from the boundary layer to prevent double rendering
          const boundaryOnly = {
            ...data,
            features: data.features?.filter((f: any) => 
               f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon' || f.geometry?.type === 'LineString'
            )
          };
          loadedBoundaries.push(boundaryOnly);
          
          // Optionally extract points from boundary files if that's where the villages are stored
          if (data.features) {
            const boundaryPoints = data.features.filter((f: any) => 
               f.geometry?.type === 'Point' || f.geometry?.type === 'MultiPoint'
            );
            loadedPoints.push(...boundaryPoints);
          }
        } else {
          // It's a specific village/gp points layer
          if (data.features) {
            loadedPoints.push(...data.features);
          } else if (data.type === 'Feature') {
            loadedPoints.push(data);
          }
        }
      });

      // Remove potential duplicates by village name + coordinates
      const seen = new Set();
      const uniquePoints = loadedPoints.filter(p => {
        const name = (p.properties?.['Name of Village'] || p.properties?.village || p.properties?.Name || '').toLowerCase();
        const coords = p.geometry?.coordinates ? JSON.stringify(p.geometry.coordinates) : '';
        const key = `${name}-${coords}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      
      setBoundaryDataList(loadedBoundaries);
      setGeoVillages(uniquePoints);
    } catch (e) {
      console.error('Boundary load failed:', e);
    } finally {
      setLoadingBoundary(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchSheet('village_assets');
      setVillageAssets(data);
      
      // Auto-center if we have data AND no boundary is present
      if (data.length > 0 && boundaryDataList.length === 0) {
        const first = data[0];
        const lat = parseFloat(first.Latitude);
        const lng = parseFloat(first.Longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          setMapCenter([lat, lng]);
          setMapZoom(11);
        }
      }
    } catch (error) {
      console.error('Failed to load village assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const combinedBounds = useMemo(() => {
    if (boundaryDataList.length === 0) return undefined;
    try {
      const group = L.featureGroup(boundaryDataList.map(data => L.geoJSON(data)));
      return group.getBounds();
    } catch (e) {
      return undefined;
    }
  }, [boundaryDataList]);

  const mandals = useMemo(() => {
    const list = new Set<string>();
    // From Assets
    villageAssets.forEach(a => { if (a.Mandal) list.add(a.Mandal); });
    // From GeoJSON Boundaries
    boundaryDataList.forEach(data => {
      data.features?.forEach((f: any) => {
        if (f.properties?.Block) list.add(f.properties.Block);
        if (f.properties?.Mandal) list.add(f.properties.Mandal);
      });
    });
    // From GeoJSON Villages
    geoVillages.forEach(v => { if (v.properties?.Block) list.add(v.properties.Block); });
    
    return Array.from(list).sort();
  }, [villageAssets, boundaryDataList, geoVillages]);

  const activities = useMemo(() => {
    return Array.from(new Set(villageAssets.map(a => a['Activity Name']).filter(Boolean)));
  }, [villageAssets]);

  const filteredAssets = useMemo(() => {
    return villageAssets.filter(asset => {
      const matchesMandal = selectedMandal === 'All Mandals' || asset.Mandal === selectedMandal;
      const matchesActivity = selectedActivity === 'All Activities' || asset['Activity Name'] === selectedActivity;
      const matchesSearch = !searchTerm || 
        asset['Village Name']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset['Activity Name']?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const hasCoords = !isNaN(parseFloat(asset.Latitude as any)) && !isNaN(parseFloat(asset.Longitude as any));
      return matchesMandal && matchesActivity && matchesSearch && hasCoords;
    });
  }, [villageAssets, selectedMandal, selectedActivity, searchTerm]);

  // Final filtered list of village points for marker rendering
  const filteredGeoVillages = useMemo(() => {
    const selMandal = selectedMandal.toLowerCase().trim();
    const search = searchTerm.toLowerCase().trim();

    return geoVillages.filter(v => {
      const props = v.properties || {};
      const vMandal = (props.Block || props.Mandal || props.block || props.mandal || '').toString().toLowerCase().trim();
      const matchesMandal = selectedMandal === 'All Mandals' || vMandal === selMandal;
      
      const vName = (props['Name of Village'] || props['village'] || props['Village'] || props['Name'] || '').toString().toLowerCase();
      const vGP = (props.GP || props.gp || props['Gram Panchayat'] || '').toString().toLowerCase();
      const matchesSearch = !search || vName.includes(search) || vGP.includes(search);
      
      return matchesMandal && matchesSearch;
    });
  }, [geoVillages, selectedMandal, searchTerm]);

  const activeBounds = useMemo(() => {
    if (selectedMandal === 'All Mandals') return combinedBounds;
    
    try {
      const features: any[] = [];
      boundaryDataList.forEach(data => {
        data.features?.forEach((f: any) => {
          if (f.properties?.Block === selectedMandal || f.properties?.Mandal === selectedMandal) {
            features.push(f);
          }
        });
      });

      if (features.length > 0) {
        return L.featureGroup(features.map(f => L.geoJSON(f))).getBounds();
      }
    } catch (e) {
      return combinedBounds;
    }
    return combinedBounds;
  }, [selectedMandal, combinedBounds, boundaryDataList]);

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-140px)] flex flex-col md:flex-row bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 relative">
      {/* Sidebar Filters - Mobile Overlay / Desktop Sidebar */}
      <div className={cn(
        "fixed inset-0 z-[3000] md:relative md:inset-auto md:z-auto transition-all duration-300 md:duration-300 flex flex-col bg-white",
        isSidebarOpen ? "translate-x-0 w-full md:w-80" : "-translate-x-full md:translate-x-0 md:w-0 overflow-hidden"
      )}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Region Insights</h2>
            <p className="text-xs text-slate-500 font-medium whitespace-nowrap">Village & Asset Intelligence</p>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600" />
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-slate-200 rounded-lg md:hidden"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Search Village</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mandal (Block)</label>
            <select 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={selectedMandal}
              onChange={(e) => setSelectedMandal(e.target.value)}
            >
              <option>All Mandals</option>
              {mandals.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Activity Type</label>
            <select 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={selectedActivity}
              onChange={(e) => setSelectedActivity(e.target.value)}
            >
              <option>All Activities</option>
              {activities.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div className="pt-4 space-y-3">
             <button 
               onClick={() => {
                 setSelectedMandal('All Mandals');
                 setSelectedActivity('All Activities');
                 setSearchTerm('');
                 setSelectedAssetId(null);
               }}
               className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors"
             >
               Clear All Filters
             </button>

            {/* Layer Control Section */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
               <div className="flex items-center gap-2 text-slate-700 mb-3">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider">Map Layers</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Base Boundaries</span>
                  <div className="w-8 h-4 bg-emerald-500 rounded-full relative opacity-50 cursor-not-allowed">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Village Referentials</span>
                  <div className="w-8 h-4 bg-emerald-500 rounded-full relative opacity-50 cursor-not-allowed">
                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <label className="text-xs font-bold text-blue-700 cursor-pointer flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                      checked={showActivityLayer}
                      onChange={(e) => setShowActivityLayer(e.target.checked)}
                    />
                    Activity-wise Data
                  </label>
                  {villageAssets.length > 0 && !showActivityLayer && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Info className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Map Summary</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Visible Assets:</span>
                  <span className="font-bold text-slate-700">{filteredAssets.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Base Villages:</span>
                  <span className="font-bold text-emerald-700">{filteredGeoVillages.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Activities:</span>
                  <span className="font-bold text-slate-700">{activities.length}</span>
                </div>
              </div>
            </div>

            {/* Asset Quick Link Table - Only show if layer is active */}
            {showActivityLayer && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Visible Assets ({filteredAssets.length})</label>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                  {filteredAssets.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">No assets matching filters</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredAssets.map((asset) => (
                        <button
                          key={asset._rowIndex}
                          id={`sidebar-asset-${asset._rowIndex}`}
                          onClick={() => {
                            if (asset._rowIndex) {
                              setSelectedAssetId(asset._rowIndex);
                              const lat = parseFloat(asset.Latitude as any);
                              const lng = parseFloat(asset.Longitude as any);
                              if (!isNaN(lat) && !isNaN(lng)) {
                                setMapCenter([lat, lng]);
                                setMapZoom(16);
                              }
                            }
                          }}
                          className={cn(
                            "w-full text-left p-3 hover:bg-slate-50 transition-all group relative",
                            selectedAssetId === asset._rowIndex && "bg-blue-50/80 ring-1 ring-blue-500/20 ring-inset"
                          )}
                        >
                          {selectedAssetId === asset._rowIndex && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                          )}
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                              {asset['Village Name']}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400">{asset.Mandal}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">{asset['Activity Name']}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Toggle Sidebar Button */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-[1000] bg-white border border-slate-200 p-2 rounded-r-xl shadow-lg hover:bg-slate-50 transition-colors hidden md:block"
        style={{ left: isSidebarOpen ? '320px' : '0' }}
      >
        <ChevronRight className={cn("w-4 h-4 transition-transform", isSidebarOpen && "rotate-180")} />
      </button>

      {/* Mobile Toggle & Status Button */}
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="absolute left-4 top-4 z-[2000] md:hidden bg-white/90 backdrop-blur-sm border border-slate-200 p-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-left duration-300"
        >
          <Filter className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700">Filters & Layers</span>
        </button>
      )}

      {/* Map Content */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 z-[2000] bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-600">Loading {loadingBoundary ? 'Boundaries' : 'GIS Data'}...</p>
            </div>
          </div>
        )}

        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          className="h-full w-full"
          zoomControl={false}
        >
          {mapType === 'streets' ? (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
          ) : (
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            />
          )}
          
          <MapController 
            center={mapCenter} 
            zoom={mapZoom} 
            bounds={activeBounds}
          />

          {/* Region Boundaries */}
          {boundaryDataList.map((data, idx) => (
            <GeoJSON 
              key={`${idx}-${JSON.stringify(data).length}`}
              data={data} 
              interactive={false} // Prevent polygons from stealing clicks
              style={{
                fillColor: '#10b981', // Emerald for boundary
                weight: 2,
                opacity: 0.8,
                color: 'white',
                fillOpacity: 0.1,
                dashArray: '5, 5'
              }}
              onEachFeature={(feature, layer) => {
                if (feature.properties && feature.properties.name) {
                  layer.bindTooltip(feature.properties.name, {
                    permanent: false,
                    direction: 'center',
                    className: 'region-tooltip'
                  });
                }
              }}
            />
          ))}

          {/* Sheet Assets - Visible only when toggled */}
          {showActivityLayer && filteredAssets.map((asset, idx) => {
            const lat = parseFloat(asset.Latitude as any);
            const lng = parseFloat(asset.Longitude as any);
            if (isNaN(lat) || isNaN(lng)) return null;

            return (
              <Marker 
                key={`asset-${asset._rowIndex || idx}`} 
                position={[lat, lng]}
                icon={L.divIcon({
                  className: 'custom-dot-blue',
                  html: `<div class="${cn(
                    "rounded-full border-1.5 border-white shadow-sm transition-all duration-300",
                    selectedAssetId === asset._rowIndex ? "bg-blue-600 w-4 h-4 -mt-0.5 -ml-0.5 ring-4 ring-blue-200 animate-pulse-blue" : "bg-blue-500 w-2.5 h-2.5"
                  )}"></div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                  popupAnchor: [0, -8]
                })}
                zIndexOffset={selectedAssetId === asset._rowIndex ? 2000 : 1000}
                eventHandlers={{
                  click: () => {
                    if (asset._rowIndex) {
                      setSelectedAssetId(asset._rowIndex);
                      // Scroll sidebar to this item
                      const element = document.getElementById(`sidebar-asset-${asset._rowIndex}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }
                    }
                  },
                }}
              >
                <Popup className="custom-popup" offset={[0, -10]}>
                  <div className="p-1 min-w-[240px]">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {asset.Mandal || 'N/A'} Block
                        </span>
                      </div>
                      <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[9px] font-bold border border-blue-100">
                        Asset
                      </span>
                    </div>
                    
                    <h3 className="text-sm font-bold text-slate-800 mb-2 leading-tight">
                      {asset['Village Name']}
                    </h3>

                    <div className="space-y-2">
                       <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">GP:</span>
                          <span className="font-bold text-slate-600">{asset['GP'] || asset['Gram Panchayat'] || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">Activity:</span>
                          <span className="font-bold text-blue-600">{asset['Activity Name']}</span>
                        </div>
                      </div>

                      {asset['Details'] && (
                        <div className="text-[10px] text-slate-500 bg-blue-50/30 p-2 rounded-lg border border-blue-50/50 leading-relaxed italic">
                          "{asset['Details']}"
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                       <div className="text-[9px] font-medium text-slate-400">
                         {lat.toFixed(5)}, {lng.toFixed(5)}
                       </div>
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           window.location.href = `/admin/village-gis-management?highlight=${asset._rowIndex}`;
                         }}
                         className="text-[9px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                       >
                         Manage Asset <ChevronRight className="w-2 h-2" />
                       </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* GeoJSON Village Points - Flattened React rendering for maximum reliability */}
          {filteredGeoVillages.map((village, idx) => {
            let lat: number, lng: number;
            
            if (village.geometry.type === 'Point') {
              [lng, lat] = village.geometry.coordinates;
            } else if (village.geometry.type === 'MultiPoint') {
              [lng, lat] = village.geometry.coordinates[0];
            } else {
              return null;
            }

            if (isNaN(lat) || isNaN(lng)) return null;

            const props = village.properties || {};
            const villageName = props['Name of Village'] || props['village'] || props['Village'] || props['Name'] || 'N/A';
            const mandal = props.Block || props.Mandal || props.block || props.mandal || 'N/A';
            const gp = props.GP || props.gp || props['Gram Panchayat'] || 'N/A';
            const activity = props['Activity Name'] || props['activity'] || props['Activity'] || null;
            const details = props['Details'] || props['details'] || props['Description'] || props['desc'] || props['REMARK'] || null;

            return (
              <Marker 
                key={`geo-v-${idx}-${villageName}`} 
                position={[lat, lng]} 
                icon={greenDotIcon}
                zIndexOffset={900}
              >
                <Popup className="custom-popup" offset={[0, -24]}>
                  <div className="p-1 min-w-[200px]">
                    <div className="flex items-center justify-between mb-3 border-b border-emerald-100 pb-2">
                       <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded text-[9px] font-bold border border-emerald-100 uppercase tracking-tight">
                        Village Reference
                      </span>
                      <MapPin className="w-3 h-3 text-emerald-500" />
                    </div>
                    
                    <div className="space-y-3">
                      {/* Order: Block -> GP -> Village */}
                      <div className="bg-slate-50/50 rounded-lg p-2.5 border border-slate-100 space-y-2">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Block (Mandal)</span>
                          <span className="text-[13px] font-bold text-slate-800 leading-none">{mandal}</span>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Gram Panchayat (GP)</span>
                          <span className="text-[13px] font-semibold text-emerald-700 leading-none">{gp}</span>
                        </div>

                        <div className="flex flex-col pt-1 border-t border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Village Name</span>
                          <span className="text-[14px] font-black text-slate-900 leading-none">{villageName}</span>
                        </div>
                      </div>

                      {(activity || details) && (
                        <div className="space-y-1.5">
                          {activity && (
                            <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-1 rounded-md">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-[10px] font-bold text-emerald-700">{activity}</span>
                            </div>
                          )}
                          {details && (
                            <div className="text-[10px] text-slate-500 bg-slate-50/50 p-2 rounded-lg border border-slate-100 leading-relaxed italic">
                              "{details}"
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-[9px] font-medium text-slate-400">
                       <span>GPS Location</span>
                       <span>{lat.toFixed(5)}, {lng.toFixed(5)}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating UI Overlays */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[1000] flex flex-col gap-3">
          <button 
            onClick={() => setMapType(mapType === 'streets' ? 'satellite' : 'streets')}
            className={cn(
              "p-2.5 md:p-3 rounded-2xl shadow-xl border transition-all hover:scale-105 flex flex-col items-center gap-1",
              mapType === 'satellite' ? "bg-white border-slate-200 text-slate-600" : "bg-slate-800 border-slate-700 text-white"
            )}
            title="Toggle Map Type"
          >
            <Layers className="w-4 h-4 md:w-5 md:h-5" />
            <span className="text-[7px] md:text-[8px] font-bold uppercase">{mapType === 'streets' ? 'Sat' : 'Street'}</span>
          </button>
          
          <button 
            onClick={() => {
              if (combinedBounds) {
                setMapCenter(combinedBounds.getCenter() as any);
                setMapZoom(9);
              } else {
                setMapCenter([20.5937, 78.9629]);
                setMapZoom(5);
              }
            }}
            className="bg-white p-2.5 md:p-3 rounded-2xl shadow-xl border border-slate-200 text-slate-600 hover:text-blue-600 transition-all hover:scale-105"
            title="Reset View"
          >
            <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 z-[1000] hidden sm:block">
          <div className="bg-white/90 backdrop-blur-sm px-3 md:px-4 py-2 md:py-3 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-3 md:gap-4">
            <div className="flex items-center gap-2 border-r border-slate-200 pr-3 md:pr-4">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-blue-500" />
              <span className="text-[10px] md:text-xs font-bold text-slate-600">Assets</span>
            </div>
            <div className="flex items-center gap-2 opacity-50 cursor-not-allowed">
              <div className="w-2.5 h-2.5 md:w-3 md:h-3 border border-blue-500 rounded-sm" />
              <span className="text-[10px] md:text-xs font-bold text-slate-600">Mandal Boundary</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
