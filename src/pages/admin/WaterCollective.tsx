import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import { Loader2, Map as MapIcon, Layers, Info, Settings, Filter, X, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import { fetchSheet, fetchGeoJson, fetchFileContent } from '../../lib/api';
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

const CROP_COLORS = [
  { label: 'Paddy', color: '#10b981', keywords: ['paddy'] },
  { label: 'Maize', color: '#f59e0b', keywords: ['maize'] },
  { label: 'Cotton', color: '#6366f1', keywords: ['cotton'] },
  { label: 'Chilli', color: '#ef4444', keywords: ['chilli'] },
  { label: 'Groundnut', color: '#8b5cf6', keywords: ['groundnut'] },
  { label: 'Pulses/Black Gram', color: '#ec4899', keywords: ['black gram', 'pulse'] },
  { label: 'Other Crops', color: '#3b82f6', keywords: [] },
  { label: 'No Data', color: '#cbd5e1', keywords: [] },
];

export default function WaterCollective() {
  const [loadingFile, setLoadingFile] = useState<string | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [focusedFile, setFocusedFile] = useState<string | null>(null);
  const [availableSites, setAvailableSites] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);
  const [csvData, setCsvData] = useState<Record<string, any[]>>({}); // filename -> rows
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  const [selectedMandal, setSelectedMandal] = useState<string>('');
  const [selectedGP, setSelectedGP] = useState<string>('');

  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase();
  const canEdit = userRole === 'admin';

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

  const uniqueMandals = useMemo(() => {
    const mandals = availableSites.map(s => s['Mandal']).filter(Boolean);
    return Array.from(new Set(mandals)).sort();
  }, [availableSites]);

  const uniqueGPs = useMemo(() => {
    const filteredByMandal = selectedMandal 
      ? availableSites.filter(s => s['Mandal'] === selectedMandal)
      : availableSites;
    const gps = filteredByMandal.map(s => s['GP']).filter(Boolean);
    return Array.from(new Set(gps)).sort();
  }, [availableSites, selectedMandal]);

  const filteredSites = useMemo(() => {
    return availableSites.filter(site => {
      const matchMandal = !selectedMandal || site['Mandal'] === selectedMandal;
      const matchGP = !selectedGP || site['GP'] === selectedGP;
      return matchMandal && matchGP;
    });
  }, [availableSites, selectedMandal, selectedGP]);

  const toggleFile = async (site: any) => {
    const filename = site['File Name'] || site['Water Collective Name'];
    const url = site['GeoJSON URL'];
    const csvUrl = site['CSV URL'];

    if (selectedFiles.includes(filename)) {
      setSelectedFiles(prev => prev.filter(f => f !== filename));
      setGeoJsonData(prev => prev.filter(d => d.filename !== filename));
      setCsvData(prev => {
        const newData = { ...prev };
        delete newData[filename];
        return newData;
      });
      if (focusedFile === filename) setFocusedFile(null);
    } else {
      if (!url) {
        toast.error('No GeoJSON file linked to this site');
        return;
      }

      try {
        setLoadingFile(filename);
        
        // Fetch GeoJSON
        const geoJsonUrlObj = new URL(url);
        const geoJsonFileId = geoJsonUrlObj.searchParams.get('id');
        if (!geoJsonFileId) throw new Error('Invalid GeoJSON URL');
        const data = await fetchGeoJson(geoJsonFileId);

        // Fetch CSV if available
        if (csvUrl) {
          try {
            const csvUrlObj = new URL(csvUrl);
            const csvFileId = csvUrlObj.searchParams.get('id');
            if (csvFileId) {
              const csvContent = await fetchFileContent(csvFileId);
              const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
              if (parsed.data) {
                setCsvData(prev => ({ ...prev, [filename]: parsed.data }));
              }
            }
          } catch (csvErr) {
            console.error('Failed to load CSV:', csvErr);
            toast.error('Failed to load crop data CSV');
          }
        }
        
        setGeoJsonData(prev => [...prev, { filename, data }]);
        setSelectedFiles(prev => [...prev, filename]);
        setFocusedFile(filename);
        toast.success(`Loaded ${filename}`);
      } catch (error) {
        console.error(error);
        toast.error(`Error loading ${filename}`);
      } finally {
        setLoadingFile(null);
      }
    }
  };

  const activeCrops = useMemo(() => {
    const allRows = Object.values(csvData).flat();
    const uniqueCrops = Array.from(new Set(allRows.map((r: any) => r.Crops || r.Crop).filter(Boolean)));
    
    return CROP_COLORS.filter(colorItem => {
      if (colorItem.label === 'No Data') return true;
      if (colorItem.label === 'Other Crops') {
        // Show "Other Crops" if there are crops in the CSV that don't match any specific keywords
        return uniqueCrops.some(crop => {
          const c = String(crop).toLowerCase();
          return !CROP_COLORS.some(cc => cc.keywords.some(k => c.includes(k)));
        });
      }
      return uniqueCrops.some(crop => 
        colorItem.keywords.some(k => String(crop).toLowerCase().includes(k))
      );
    });
  }, [csvData]);

  const seasons = useMemo(() => {
    const allRows = Object.values(csvData).flat();
    const uniqueSeasons = Array.from(new Set(allRows.map((r: any) => r.seasons || r.Season).filter(Boolean)));
    return uniqueSeasons.sort() as string[];
  }, [csvData]);

  const years = useMemo(() => {
    const allRows = Object.values(csvData).flat();
    const uniqueYears = Array.from(new Set(allRows.map((r: any) => r.Year || r.year).filter(Boolean)));
    return uniqueYears.sort() as string[];
  }, [csvData]);

  const getCropColor = (crop: string) => {
    if (!crop) return '#cbd5e1'; // No Data
    const c = crop.toLowerCase();
    const match = CROP_COLORS.find(item => 
      item.keywords.some(k => c.includes(k))
    );
    return match ? match.color : '#3b82f6'; // Other Crops
  };

  const findMatchingCsvRow = (feature: any, filename: string) => {
    const rows = csvData[filename];
    if (!rows) return null;

    const props = feature.properties || {};
    // Try common keys for matching, including the user's specific Plot_id
    const keysToTry = ['Plot_id', 'Plot_Id', 'Plot_ID', 'ID', 'id', 'PlotNo', 'Farmer_Name', 'Name', 'name'];
    
    for (const key of keysToTry) {
      const val = props[key];
      if (val) {
        const match = rows.find(r => {
          // Match by Plot ID or Farmer Name using the CSV columns
          const rowVal = r.Plot_Id || r.Plot_ID || r.ID || r.PlotNo || r.Farmer_Name || r.Name;
          const rowSeason = r.seasons || r.Season;
          const rowYear = r.Year || r.year;

          return String(rowVal).toLowerCase() === String(val).toLowerCase() &&
                 (!selectedSeason || rowSeason === selectedSeason) &&
                 (!selectedYear || rowYear === selectedYear);
        });
        if (match) return match;
      }
    }
    return null;
  };

  const onEachFeature = (feature: any, layer: any) => {
    layer.on({
      click: () => {
        setSelectedFeature(feature);
      }
    });
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
          
          {/* Filters */}
          <div className="flex flex-col gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <Filter className="w-4 h-4" /> Regional Filters
            </div>
            <div className="flex flex-col gap-2">
              <select 
                className="w-full text-sm border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={selectedMandal}
                onChange={(e) => { setSelectedMandal(e.target.value); setSelectedGP(''); }}
              >
                <option value="">All Mandals</option>
                {uniqueMandals.map(m => <option key={m as string} value={m as string}>{m as string}</option>)}
              </select>
              <select 
                className="w-full text-sm border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={selectedGP}
                onChange={(e) => setSelectedGP(e.target.value)}
              >
                <option value="">All GPs</option>
                {uniqueGPs.map(gp => <option key={gp as string} value={gp as string}>{gp as string}</option>)}
              </select>
            </div>
          </div>

          {/* Crop Filters */}
          {Object.keys(csvData).length > 0 && (
            <div className="flex flex-col gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Calendar className="w-4 h-4" /> Crop Filters
              </div>
              <div className="flex flex-col gap-2">
                <select 
                  className="w-full text-sm border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                >
                  <option value="">All Seasons</option>
                  {seasons.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select 
                  className="w-full text-sm border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">All Years</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {filteredSites.length > 0 ? filteredSites.map(site => {
              const filename = site['File Name'] || site['Water Collective Name'];
              const isSelected = selectedFiles.includes(filename);
              const isFocused = focusedFile === filename;
              const isLoading = loadingFile === filename;
              
              return (
                <div 
                  key={site._rowIndex}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    isFocused 
                      ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200 text-blue-800 shadow-sm' 
                      : isSelected
                        ? 'bg-blue-50/50 border-blue-200 text-blue-700' 
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                  }`}
                  onClick={() => {
                    if (isLoading) return;
                    if (isSelected) {
                      setFocusedFile(isFocused ? null : filename);
                    } else {
                      toggleFile(site);
                    }
                  }}
                >
                  <div className="shrink-0 w-4 h-4 flex items-center justify-center">
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    ) : (
                      <div 
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFile(site);
                        }}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className={`text-sm font-medium truncate ${isFocused ? 'text-blue-700' : ''}`}>
                      {site['Water Collective Name']}
                    </span>
                    <span className="text-[10px] opacity-70 truncate">
                      {site['Village']}{site['Mandal'] ? `, ${site['Mandal']}` : ''}
                    </span>
                  </div>
                </div>
              );
            }) : (
              <p className="text-sm text-slate-400 text-center py-4">No sites found. Add them in Admin Settings.</p>
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 leading-relaxed">
              GeoJSON files allow you to visualize geographic data like points, lines, and polygons on the map.
            </p>
            <div className="mt-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
              <p className="text-[10px] text-blue-600 font-medium uppercase tracking-wider mb-1">GIS Tip</p>
              <p className="text-[10px] text-blue-700 leading-normal">
                To show custom colors from your GIS export, ensure your GeoJSON features have a <code className="bg-blue-100 px-1 rounded">color</code> or <code className="bg-blue-100 px-1 rounded">fill</code> property.
              </p>
            </div>
          </div>
        </div>

          {/* Map Area */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative min-h-[500px]">
          {/* Current View Indicator */}
          {(selectedSeason || selectedYear) && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
              <div className="bg-white/90 backdrop-blur-sm border border-slate-200 px-4 py-2 rounded-full shadow-lg flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Showing: {selectedSeason || 'All Seasons'} {selectedYear ? `(${selectedYear})` : ''}
                </span>
              </div>
            </div>
          )}

          {/* Legend Overlay */}
          <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-sm border border-slate-200 p-4 rounded-2xl shadow-xl max-w-[200px]">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Crop Legend</h4>
            <div className="flex flex-col gap-2">
              {activeCrops.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm shrink-0" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[11px] font-medium text-slate-600 truncate">{item.label}</span>
                </div>
              ))}
              {activeCrops.length === 0 && (
                <span className="text-[10px] text-slate-400 italic">No crop data loaded</span>
              )}
            </div>
          </div>

          <MapContainer 
            center={[18.66, 83.95]} 
            zoom={10} 
            className="h-full w-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {geoJsonData.map((item, idx) => {
              const isFocused = focusedFile === item.filename;
              return (
                <GeoJSON 
                  key={`${item.filename}-${isFocused}-${selectedSeason}-${selectedYear}`} 
                  data={item.data} 
                  onEachFeature={onEachFeature}
                  style={(feature) => {
                    const csvRow = findMatchingCsvRow(feature, item.filename);
                    const crop = csvRow?.Crops || csvRow?.Crop;
                    const cropColor = getCropColor(crop);

                    const props = feature?.properties || {};
                    const customColor = props.color || props.fill || props.stroke || props['marker-color'];
                    
                    const baseColor = crop ? cropColor : (customColor || (idx % 2 === 0 ? '#3b82f6' : '#10b981'));

                    return {
                      color: isFocused ? '#f59e0b' : baseColor,
                      weight: isFocused ? 5 : 2,
                      opacity: isFocused ? 1 : 0.8,
                      fillOpacity: isFocused ? 0.5 : 0.3,
                      fillColor: baseColor
                    };
                  }}
                />
              );
            })}
            <MapResizer />
            <MapBoundsFitter geoJsonData={geoJsonData} focusedFile={focusedFile} />
          </MapContainer>
          
          {loadingFile && (
            <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[2px] flex items-center justify-center z-[1000] pointer-events-none">
              <div className="bg-white p-5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <div className="flex flex-col">
                  <h3 className="font-semibold text-slate-800">Loading Map Data</h3>
                  <p className="text-xs text-slate-500">{loadingFile}</p>
                </div>
              </div>
            </div>
          )}
          
          {geoJsonData.length === 0 && !loadingFile && (
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

      {/* Feature Details Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-blue-600" />
                Site Details
              </h3>
              <button 
                onClick={() => setSelectedFeature(null)}
                className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <div className="flex flex-col gap-3">
                {/* CSV Data if matched */}
                {(() => {
                  // Find which file this feature belongs to
                  const fileItem = geoJsonData.find(item => {
                    // This is a bit tricky since onEachFeature doesn't pass the filename
                    // We'll try to find a match in any loaded CSV
                    return findMatchingCsvRow(selectedFeature, item.filename);
                  });
                  
                  if (fileItem) {
                    const csvRow = findMatchingCsvRow(selectedFeature, fileItem.filename);
                    if (csvRow) {
                      return (
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-2">
                          <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">Crop Information</h4>
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(csvRow).map(([key, value]) => (
                              <div key={key} className="flex flex-col">
                                <span className="text-[10px] text-emerald-600 font-medium uppercase">{key}</span>
                                <span className="text-sm text-emerald-900 font-semibold">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}

                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">GeoJSON Properties</h4>
                {Object.entries(selectedFeature.properties || {}).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{key}</span>
                    <span className="text-sm text-slate-800 break-words">{String(value)}</span>
                  </div>
                ))}
                {(!selectedFeature.properties || Object.keys(selectedFeature.properties).length === 0) && (
                  <p className="text-sm text-slate-500 text-center py-4">No properties available for this feature.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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

function MapBoundsFitter({ geoJsonData, focusedFile }: { geoJsonData: any[], focusedFile: string | null }) {
  const map = useMap();
  useEffect(() => {
    if (geoJsonData.length === 0) return;
    try {
      const group = new L.FeatureGroup();
      
      if (focusedFile) {
        const focusedItem = geoJsonData.find(d => d.filename === focusedFile);
        if (focusedItem) {
          const layer = L.geoJSON(focusedItem.data);
          map.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 16 });
          return;
        }
      }

      geoJsonData.forEach(item => {
        const layer = L.geoJSON(item.data);
        group.addLayer(layer);
      });
      if (group.getLayers().length > 0) {
        map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 16 });
      }
    } catch (error) {
      console.error("Error calculating bounds:", error);
    }
  }, [geoJsonData, focusedFile, map]);
  return null;
}
