import { useState, useEffect, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import { fetchWithFallback } from '../../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Filter, Users, Map, Sprout, TrendingUp, FlaskConical, Wheat, ChevronDown, ChevronRight, Image as ImageIcon, Calendar, X, Maximize, Minimize } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { cn } from '../../lib/utils';

function MapResizer({ isFullscreen }: { isFullscreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 350);
    if (isFullscreen) {
      map.scrollWheelZoom.enable();
    } else {
      map.scrollWheelZoom.disable();
    }
    return () => clearTimeout(timeout);
  }, [isFullscreen, map]);
  return null;
}

function MapUpdater({ bounds }: { bounds?: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [bounds, map]);
  return null;
}

const MASTER_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4QtZipnTgk2e8RU7NapbDg0b0re6_0YRrkd8fK34HEibBwpx6sa0g5gR9WK4UP3bEnuYSmO7fZpCN/pub?gid=1609179150&single=true&output=csv";
const BIO_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4QtZipnTgk2e8RU7NapbDg0b0re6_0YRrkd8fK34HEibBwpx6sa0g5gR9WK4UP3bEnuYSmO7fZpCN/pub?gid=1233605541&single=true&output=csv";
const HARVEST_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vR4QtZipnTgk2e8RU7NapbDg0b0re6_0YRrkd8fK34HEibBwpx6sa0g5gR9WK4UP3bEnuYSmO7fZpCN/pub?gid=282552033&single=true&output=csv";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function CropsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Raw data
  const [masterData, setMasterData] = useState<any[]>([]);
  const [bioData, setBioData] = useState<any[]>([]);
  const [harvestData, setHarvestData] = useState<any[]>([]);

  // Filter options
  const [blocks, setBlocks] = useState<string[]>([]);
  const [villages, setVillages] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [years, setYears] = useState<string[]>([]);

  // Selected filters
  const [selectedBlock, setSelectedBlock] = useState('All');
  const [selectedVillage, setSelectedVillage] = useState('All');
  const [selectedSeason, setSelectedSeason] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [searchHHId, setSearchHHId] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeModelFilter, setActiveModelFilter] = useState<string | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewImage(null);
    };
    if (previewImage) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const fetchCSV = async (url: string) => {
          const res = await fetchWithFallback(`${url}&t=${Date.now()}`);
          if (!res.ok) throw new Error("Failed to fetch CSV");
          const text = await res.text();
          return new Promise<any[]>((resolve, reject) => {
            Papa.parse(text, {
              header: true,
              skipEmptyLines: true,
              transformHeader: (h) => h.trim(),
              complete: (results) => resolve(results.data),
              error: (err: any) => reject(err),
            });
          });
        };

        const [master, bio, harvest] = await Promise.all([
          fetchCSV(MASTER_URL),
          fetchCSV(BIO_URL),
          fetchCSV(HARVEST_URL)
        ]);

        setMasterData(master);
        setBioData(bio);
        setHarvestData(harvest);

        // Extract filter options
        const bSet = new Set<string>();
        const vSet = new Set<string>();
        const sSet = new Set<string>();
        const ySet = new Set<string>();

        master.forEach(row => {
          if (row['block']) bSet.add(row['block']);
          if (row['Village']) vSet.add(row['Village']);
          if (row['plot_reg-season']) sSet.add(row['plot_reg-season']);
          if (row['Year']) ySet.add(row['Year']);
        });

        setBlocks(Array.from(bSet).sort());
        setVillages(Array.from(vSet).sort());
        setSeasons(Array.from(sSet).sort());
        setYears(Array.from(ySet).sort());

      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Loading Crops Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 shadow-sm max-w-md w-full">
          <h2 className="font-semibold mb-2">Error</h2>
          <p className="text-sm opacity-90">{error}</p>
        </div>
      </div>
    );
  }

  // Filter Data
  const filteredMaster = masterData.filter(row => {
    if (selectedBlock !== 'All' && row['block'] !== selectedBlock) return false;
    if (selectedVillage !== 'All' && row['Village'] !== selectedVillage) return false;
    if (selectedSeason !== 'All' && row['plot_reg-season'] !== selectedSeason) return false;
    if (selectedYear !== 'All' && row['Year'] !== selectedYear) return false;
    if (searchHHId && !String(row['HH Id'] || row['HH_id'] || '').toLowerCase().includes(searchHHId.toLowerCase())) return false;
    return true;
  });

  const validHHIdsForBreakdown = new Set(filteredMaster.map(r => r['HH Id']));
  const filteredHarvestForBreakdown = harvestData.filter(row => validHHIdsForBreakdown.has(row['HH_id']));
  const filteredBioForBreakdown = bioData.filter(row => validHHIdsForBreakdown.has(row['HH_id']));

  // Calculate Crop Models Breakdown for Tabs
  const cropModelsBreakdown: Record<string, {
    farmers: Set<string>;
    extent: number;
    yield: number;
    bioInputsAcres: Record<string, number>;
    mainCrops: Record<string, number>;
    hhIds: string[];
  }> = {};

  filteredMaster.forEach(row => {
    let model = row['plot_reg-crop_model'];
    if (!model || model.trim() === '') model = 'Unknown';
    
    if (!cropModelsBreakdown[model]) {
      cropModelsBreakdown[model] = {
        farmers: new Set(),
        extent: 0,
        yield: 0,
        bioInputsAcres: {},
        mainCrops: {},
        hhIds: []
      };
    }
    const hhId = row['HH Id'];
    if (hhId) {
      cropModelsBreakdown[model].farmers.add(hhId);
      cropModelsBreakdown[model].hhIds.push(hhId);
    }
    
    cropModelsBreakdown[model].extent += (parseFloat(row['Extent']) || parseFloat(row['plot_reg-area']) || 0);
    
    const crop = row['plot_reg-main_crop'] || row['plot_reg-crop_type'] || 'Unknown';
    if (crop) {
      cropModelsBreakdown[model].mainCrops[crop] = (cropModelsBreakdown[model].mainCrops[crop] || 0) + 1;
    }
  });

  filteredHarvestForBreakdown.forEach(row => {
    const hhId = row['HH_id'];
    const y = parseFloat(row['yield_Qntl']) || 0;
    if (hhId && y > 0) {
      const models = Object.keys(cropModelsBreakdown).filter(m => cropModelsBreakdown[m].hhIds.includes(hhId));
      if (models.length > 0) {
        const splitY = y / models.length;
        models.forEach(m => {
          cropModelsBreakdown[m].yield += splitY;
        });
      }
    }
  });

  filteredBioForBreakdown.forEach(row => {
    const hhId = row['HH_id'];
    const input = row['inputs_applied'] || 'Unknown';
    if (hhId) {
      const models = Object.keys(cropModelsBreakdown).filter(m => cropModelsBreakdown[m].hhIds.includes(hhId));
      if (models.length > 0) {
        const masterRow = filteredMaster.find(m => m['HH Id'] === hhId);
        const acres = masterRow ? (parseFloat(masterRow['Extent']) || parseFloat(masterRow['plot_reg-area']) || 0) : 0;
        const splitAcres = acres / models.length;
        models.forEach(m => {
          cropModelsBreakdown[m].bioInputsAcres[input] = (cropModelsBreakdown[m].bioInputsAcres[input] || 0) + splitAcres;
        });
      }
    }
  });

  const breakdownArray = Object.entries(cropModelsBreakdown)
    .filter(([model]) => model !== 'Unknown')
    .sort((a, b) => b[1].farmers.size - a[1].farmers.size);


  const tabFilteredMaster = activeTab === 'Overview' 
    ? filteredMaster 
    : filteredMaster.filter(row => row['plot_reg-crop_model'] === activeTab);

  const validHHIds = new Set(tabFilteredMaster.map(r => r['HH Id']));

  const filteredHarvest = harvestData.filter(row => validHHIds.has(row['HH_id']));
  const filteredBio = bioData.filter(row => validHHIds.has(row['HH_id']));

  // Calculate KPIs
  const totalFarmers = validHHIds.size;
  const totalArea = tabFilteredMaster.reduce((sum, row) => sum + (parseFloat(row['Extent']) || parseFloat(row['plot_reg-area']) || 0), 0);
  const totalYield = filteredHarvest.reduce((sum, row) => sum + (parseFloat(row['yield_Qntl']) || 0), 0);
  const totalBioInputs = filteredBio.length;

  // Process data for charts
  
  // 1. Crop Types Distribution
  const cropTypeCounts: Record<string, number> = {};
  tabFilteredMaster.forEach(row => {
    const crop = row['plot_reg-main_crop'] || row['plot_reg-crop_type'] || 'Unknown';
    if (crop) {
      cropTypeCounts[crop] = (cropTypeCounts[crop] || 0) + 1;
    }
  });
  const cropTypeData = Object.entries(cropTypeCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10

  // 2. Additional Crops (Inter/Border/Bund)
  const isValidCrop = (val: string) => val && val.toLowerCase() !== 'no' && val.toLowerCase() !== 'none';
  const additionalCrops = [
    { name: 'Inter Crops', value: tabFilteredMaster.filter(r => isValidCrop(r['plot_reg-inter_crops']) || isValidCrop(r['plot_reg-intercrops_others'])).length },
    { name: 'Border Crops', value: tabFilteredMaster.filter(r => isValidCrop(r['plot_reg-border_crops']) || r['plot_reg-border_crops_followed'] === 'yes').length },
    { name: 'Bund Plants', value: tabFilteredMaster.filter(r => isValidCrop(r['plot_reg-bund_plants']) || r['plot_reg-bund_plantation_followed'] === 'yes').length },
  ];

  // 3. Crop Models
  const cropModelCounts: Record<string, number> = {};
  tabFilteredMaster.forEach(row => {
    const model = row['plot_reg-crop_model'] || 'Unknown';
    if (model) {
      cropModelCounts[model] = (cropModelCounts[model] || 0) + 1;
    }
  });
  const cropModelData = Object.entries(cropModelCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // 4. Bio Inputs usage (Acres)
  const bioInputAcres: Record<string, number> = {};
  filteredBio.forEach(row => {
    const input = row['inputs_applied'] || 'Unknown';
    // Match with master to get acres
    const hhId = row['HH_id'];
    const masterRow = tabFilteredMaster.find(m => m['HH Id'] === hhId);
    let acres = 0;
    if (masterRow) {
      acres = parseFloat(masterRow['Extent']) || parseFloat(masterRow['plot_reg-area']) || 0;
    }
    bioInputAcres[input] = (bioInputAcres[input] || 0) + acres;
  });
  
  const bioInputData = Object.entries(bioInputAcres)
    .map(([name, acres]) => ({ name, count: parseFloat(acres.toFixed(2)) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 5. Plot Locations for Map
  const plotLocations = tabFilteredMaster
    .map(row => {
      const lat = parseFloat(row['plot_reg-plot_gps-Latitude']);
      const lng = parseFloat(row['plot_reg-plot_gps-Longitude']);
      const name = row['Farmer name'] || row['plot_reg-farmer_name'] || 'Unknown Farmer';
      const crop = row['plot_reg-main_crop'] || row['plot_reg-crop_type'] || 'Unknown';
      const area = row['Extent'] || row['plot_reg-area'] || '0';
      const village = row['Village'] || 'Unknown';
      const model = row['plot_reg-crop_model'] || 'Unknown';
      const hhId = row['HH Id'] || 'N/A';
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng, name, crop, area, village, model, hhId };
      }
      return null;
    })
    .filter(Boolean);

  const filteredPlotLocations = activeModelFilter 
    ? plotLocations.filter(p => p.model === activeModelFilter)
    : plotLocations;

  let mapBounds: L.LatLngBounds | undefined = undefined;
  if (filteredPlotLocations.length > 0) {
    try {
      const bounds = L.latLngBounds(filteredPlotLocations.map((p: any) => [p.lat, p.lng]));
      if (bounds.isValid()) {
        mapBounds = bounds;
      }
    } catch (e) {
      // ignore
    }
  }

  // 6. Crop Models Colors
  const uniqueModels = Array.from(new Set(plotLocations.map(p => p.model))).filter(Boolean).sort();
  const modelColors: Record<string, string> = {};
  const MODEL_PALETTE = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', 
    '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
  ];
  uniqueModels.forEach((model: any, idx) => {
    modelColors[model] = MODEL_PALETTE[idx % MODEL_PALETTE.length];
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Crops Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Analytics for master plot, bio inputs, and harvest data.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 px-2 text-slate-500 border-r border-slate-100">
            <Filter className="w-4 h-4" />
            <input
              type="text"
              placeholder="HH ID..."
              value={searchHHId}
              onChange={e => setSearchHHId(e.target.value)}
              className="bg-transparent text-sm outline-none w-24 text-slate-700 placeholder:text-slate-400"
            />
          </div>

          <select 
            value={selectedBlock} 
            onChange={e => {
              setSelectedBlock(e.target.value);
              setSelectedVillage('All');
            }}
            className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 outline-none font-medium text-slate-700 min-w-[120px]"
          >
            <option value="All">All Blocks</option>
            {blocks.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          
          <select 
            value={selectedVillage} 
            onChange={e => setSelectedVillage(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 outline-none font-medium text-slate-700 min-w-[120px]"
          >
            <option value="All">All Villages</option>
            {villages.map(v => <option key={v} value={v}>{v}</option>)}
          </select>

          <select 
            value={selectedSeason} 
            onChange={e => setSelectedSeason(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 outline-none font-medium text-slate-700"
          >
            <option value="All">All Seasons</option>
            {seasons.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 outline-none font-medium text-slate-700"
          >
            <option value="All">All Years</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto whitespace-nowrap pb-2">
        <button
          onClick={() => setActiveTab('Overview')}
          className={`pb-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'Overview' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Overview
        </button>
        {breakdownArray.map(([model]) => (
          <button
            key={model}
            onClick={() => setActiveTab(model)}
            className={`pb-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === model
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {model}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Farmers</p>
            <p className="text-2xl font-bold text-slate-900">{totalFarmers}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Map className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Extent (Acres)</p>
            <p className="text-2xl font-bold text-slate-900">{totalArea.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            {activeTab === 'Overview' ? <Sprout className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">
              {activeTab === 'Overview' ? 'Crop Models' : 'Total Yield (Qntl)'}
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {activeTab === 'Overview' ? Object.keys(cropModelCounts).length : totalYield.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Top Bio Input</p>
            <p className="text-lg font-bold text-slate-900 truncate" title={bioInputData[0]?.name || '-'}>{bioInputData[0]?.name || '-'}</p>
          </div>
        </div>
      </div>

      {/* Map View */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-800">Plot Locations</h2>
          </div>
          <span className="text-sm text-slate-500 font-medium bg-slate-50 px-3 py-1 rounded-full">{plotLocations.length} Plots Mapped</span>
        </div>
        <div className={cn(
          "w-full bg-slate-50 z-0 transition-all duration-300",
          isMapFullscreen ? "!fixed !inset-0 !h-[100dvh] !w-[100dvw] !z-[9999]" : "relative h-[450px]"
        )}>
          {typeof window !== 'undefined' && (
            <MapContainer 
              center={[20.5937, 78.9629]}
              zoom={5}
              scrollWheelZoom={isMapFullscreen} 
              className="w-full h-full relative"
            >
              <MapResizer isFullscreen={isMapFullscreen} />
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="OpenStreetMap">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Satellite">
                  <TileLayer
                    attribution='&copy; Google'
                    url="https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
                    subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                  />
                </LayersControl.BaseLayer>
              </LayersControl>
              <MapUpdater bounds={mapBounds} />
              {filteredPlotLocations.map((plot: any, idx: number) => (
                <PlotMarker key={`plot-${plot.hhId}-${idx}`} plot={plot} color={modelColors[plot.model] || '#94a3b8'} />
              ))}
              
              {/* Controls Overlay */}
              <div className="absolute bottom-8 right-4 z-[1000]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMapFullscreen(!isMapFullscreen);
                  }}
                  className="bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-md border border-slate-200 hover:bg-white text-slate-700 transition-colors"
                  title={isMapFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isMapFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
              </div>

              {/* Legend overlay */}
              <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-slate-200 max-h-[300px] min-w-[120px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Crop Models</h4>
                  {activeModelFilter && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModelFilter(null);
                      }}
                      className="text-[10px] text-red-500 hover:text-red-700 font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  {uniqueModels.map((model: any) => (
                    <div 
                      key={model} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveModelFilter(activeModelFilter === model ? null : model);
                      }}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer p-1 rounded-md transition-colors",
                        activeModelFilter === model ? "bg-slate-100" : "hover:bg-slate-50",
                        activeModelFilter && activeModelFilter !== model ? "opacity-40" : "opacity-100"
                      )}
                    >
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: modelColors[model] }}></div>
                      <span className="text-xs font-medium text-slate-700 capitalize">{model}</span>
                    </div>
                  ))}
                </div>
              </div>
            </MapContainer>
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Main Crop Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Sprout className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold">Top Main Crops</h2>
          </div>
          <div className="w-full" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cropTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {cropTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Practices */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Sprout className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-semibold">Secondary Practices Followed</h2>
          </div>
          <div className="w-full" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={additionalCrops} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} dx={-10} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Plots" fill="#0ea5e9" radius={[4, 4, 0, 0]}>
                  {additionalCrops.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      {activeTab === 'Overview' && (
        <>
          {/* Crop Models */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <Sprout className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold">Interested Crop Models</h2>
            </div>
            <div className="w-full" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropModelData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" name="Plots" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bio Inputs */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <FlaskConical className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold">Bio Inputs Application Count (Acres)</h2>
            </div>
            <div className="w-full" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bioInputData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="count" name="Applications" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      </div>

      {/* Crop Models Breakdown Details */}
      {activeTab === 'Overview' && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
            <Sprout className="w-6 h-6 text-slate-800" />
            <h2 className="text-xl font-bold text-slate-900">Crop Models Overview</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {breakdownArray.map(([model, data]) => {
              const topCrop = Object.entries(data.mainCrops).sort((a, b) => b[1] - a[1])[0];
              const topBio = Object.entries(data.bioInputsAcres).sort((a, b) => b[1] - a[1])[0];
              
              return (
                <div key={model} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-slate-800">{model}</h3>
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {data.farmers.size} {data.farmers.size === 1 ? 'Farmer' : 'Farmers'}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Total Extent</p>
                        <p className="text-xl font-bold text-slate-900">{data.extent.toFixed(2)} Acres</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Total Harvest</p>
                        <p className="text-xl font-bold text-slate-900">{data.yield.toFixed(2)} Qntl</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Top Crop</p>
                        <p className="text-lg font-bold text-slate-900 truncate" title={topCrop ? topCrop[0] : '-'}>
                          {topCrop ? topCrop[0] : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Top Bio Input</p>
                        <p className="text-lg font-bold text-slate-900 truncate" title={topBio ? topBio[0] : '-'}>
                          {topBio ? topBio[0] : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Model Specific Details */}
      {activeTab !== 'Overview' && (
        <ModelSpecificDetails 
          modelName={activeTab} 
          masterData={tabFilteredMaster} 
          bioData={filteredBio} 
          harvestData={filteredHarvest} 
          setPreviewImage={setPreviewImage}
        />
      )}

      {/* Full Screen Image Preview */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-slate-900/90 z-[9999] flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <button 
            className="absolute top-6 right-6 md:top-10 md:right-10 z-[10000] bg-slate-800/80 hover:bg-slate-700 text-white rounded-full p-3 transition-all border border-slate-600 shadow-xl backdrop-blur-md"
            onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
            title="Close image"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={previewImage} 
            alt="Full size preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

function getOdkImageUrl(formId: string, instanceId: string, filename: string) {
  if (!filename || !instanceId) return null;
  const instanceClean = instanceId.startsWith('uuid:') ? instanceId : `uuid:${instanceId}`;
  
  return `/api/odk/image?submissionId=${encodeURIComponent(instanceClean)}&filename=${encodeURIComponent(filename)}&formId=${encodeURIComponent(formId)}`;
}

function ModelSpecificDetails({ modelName, masterData, bioData, harvestData, setPreviewImage }: { modelName: string, masterData: any[], bioData: any[], harvestData: any[], setPreviewImage: (url: string) => void }) {
  // Aggregate bio inputs
  const bioSummary: Record<string, { quantity: number, acres: number, records: number }> = {};
  
  bioData.forEach(row => {
    const input = row['inputs_applied'];
    if (!input) return;
    if (!bioSummary[input]) {
      bioSummary[input] = { quantity: 0, acres: 0, records: 0 };
    }
    const q = parseFloat(row['Dhravajeevamrutham_Quantity']) || 0;
    const hhId = row['HH_id'];
    const masterRow = masterData.find(m => m['HH Id'] === hhId);
    const acres = masterRow ? (parseFloat(masterRow['Extent']) || parseFloat(masterRow['plot_reg-area']) || 0) : 0;
    
    bioSummary[input].quantity += q;
    bioSummary[input].acres += acres; // This might double count acres if multiple inputs per plot, but that's how it was done before.
    bioSummary[input].records += 1;
  });

  return (
    <div className="mt-8 space-y-8">
      {/* Bio Inputs Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
          <FlaskConical className="w-6 h-6 text-purple-600" />
          <h2 className="text-xl font-bold text-slate-900">Bio Inputs Usage Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="py-3 px-4 font-semibold rounded-tl-lg">Bio Input Type</th>
                <th className="py-3 px-4 font-semibold">Total Quantity (Liters/Kg)</th>
                <th className="py-3 px-4 font-semibold rounded-tr-lg">Applied Extent (Acres)</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(bioSummary).length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate-500">No bio inputs data available for this model.</td>
                </tr>
              )}
              {Object.entries(bioSummary).sort((a, b) => b[1].quantity - a[1].quantity).map(([input, data], idx) => (
                <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                  <td className="py-4 px-4 font-medium text-slate-800">{input}</td>
                  <td className="py-4 px-4 font-bold text-purple-700">{data.quantity.toFixed(2)}</td>
                  <td className="py-4 px-4 font-semibold text-slate-600">{data.acres.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Farmers Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900">Farmers Details</h2>
        </div>
        <div className="space-y-4">
          {masterData.map((farmerRow, idx) => (
            <FarmerAccordion 
              key={`${farmerRow['HH Id']}-${idx}`} 
              farmerRow={farmerRow} 
              bioData={bioData.filter(b => b['HH_id'] === farmerRow['HH Id'])} 
              harvestData={harvestData.filter(h => h['HH_id'] === farmerRow['HH Id'])} 
              setPreviewImage={setPreviewImage}
            />
          ))}
          {masterData.length === 0 && (
            <div className="py-8 text-center text-slate-500">No farmers found for this model.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function FarmerAccordion({ farmerRow, bioData, harvestData, setPreviewImage }: { farmerRow: any, bioData: any[], harvestData: any[], setPreviewImage: (url: string) => void, key?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Group activities by year
  // Try to parse year from sowing_date or date_harvest or application_date_bio_input, or fallback to farmerRow['Year']
  const activitiesByYear: Record<string, { bio: any[], harvest: any[] }> = {};
  
  const getYear = (dateStr: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.getFullYear().toString();
    return null;
  };

  const defaultYear = farmerRow['Year'] || 'Unknown';

  bioData.forEach(b => {
    const y = getYear(b['application_date_bio_input']) || defaultYear;
    if (!activitiesByYear[y]) activitiesByYear[y] = { bio: [], harvest: [] };
    activitiesByYear[y].bio.push(b);
  });

  harvestData.forEach(h => {
    const y = getYear(h['date_harvest']) || defaultYear;
    if (!activitiesByYear[y]) activitiesByYear[y] = { bio: [], harvest: [] };
    activitiesByYear[y].harvest.push(h);
  });

  // If no activities, just show an empty year block or the default year
  if (Object.keys(activitiesByYear).length === 0) {
    activitiesByYear[defaultYear] = { bio: [], harvest: [] };
  }

  const name = farmerRow['Farmer name'] || farmerRow['plot_reg-farmer_name'] || 'Unknown Farmer';
  const hhId = farmerRow['HH Id'] || 'N/A';
  const village = farmerRow['Village'] || 'N/A';
  
  const masterPhotoUrl = getOdkImageUrl('NF- Register', farmerRow['meta-instanceID'], farmerRow['plot_reg-image'] || farmerRow['plot_reg-farmer_photo'] || farmerRow['Photo']);
  const sowingImageUrl = getOdkImageUrl('NF- Register', farmerRow['meta-instanceID'], farmerRow['plot_reg-image']);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm flex-shrink-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); if (masterPhotoUrl) setPreviewImage(masterPhotoUrl); }}>
            {masterPhotoUrl ? (
              <img src={masterPhotoUrl} alt={name} className="w-full h-full object-cover hover:opacity-90 transition-opacity" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <Users className="w-6 h-6 text-blue-500" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{name}</h3>
            <p className="text-sm text-slate-500">{village} • ID: {hhId}</p>
          </div>
        </div>
        {isOpen ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="p-6 border-t border-slate-200 bg-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Extent</span>
              <span className="font-bold text-slate-800">{farmerRow['Extent'] || farmerRow['plot_reg-area'] || '0'} Acres</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Main Crop</span>
              <span className="font-bold text-slate-800 truncate">{farmerRow['plot_reg-main_crop'] || farmerRow['plot_reg-crop_type'] || '-'}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Season</span>
              <span className="font-bold text-slate-800">{farmerRow['plot_reg-season'] || '-'}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sowing Date</span>
              <span className="font-bold text-slate-800">{farmerRow['plot_reg-sowing_date'] || '-'}</span>
            </div>
          </div>

          {sowingImageUrl && (
            <div className="mb-6">
              <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-green-600" />
                Sowing Image
              </h4>
              <div 
                className="w-32 h-32 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 cursor-pointer shadow-sm"
                onClick={() => setPreviewImage(sowingImageUrl)}
              >
                <img 
                  src={sowingImageUrl} 
                  alt="Sowing" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform" 
                  onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                />
              </div>
            </div>
          )}

          <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Yearly Activities
          </h4>
          
          <div className="space-y-4">
            {Object.entries(activitiesByYear).sort(([yA], [yB]) => Number(yB) - Number(yA)).map(([year, data]) => (
              <YearlyAccordion key={year} year={year} data={data} setPreviewImage={setPreviewImage} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function YearlyAccordion({ year, data, setPreviewImage }: { year: string, data: { bio: any[], harvest: any[] }, setPreviewImage: (url: string) => void, key?: any }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border border-slate-100 rounded-lg overflow-hidden bg-slate-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-slate-100/50 hover:bg-slate-200/50 transition-colors text-left border-b border-slate-100"
      >
        <h5 className="font-bold text-slate-700">Year {year}</h5>
        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>

      {isOpen && (
        <div className="p-4 space-y-6">
          {/* Bio Inputs */}
          <div>
            <h6 className="text-sm font-bold text-purple-700 mb-3 flex items-center gap-2">
              <FlaskConical className="w-4 h-4" /> Bio Inputs Applied ({data.bio.length})
            </h6>
            {data.bio.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.bio.map((b, i) => {
                  const photoUrl = getOdkImageUrl('NF- Activities', b['PARENT_KEY'] || b['KEY'] || b['meta-instanceID'], b['Photos'] || b['photo'] || b['Photo']);
                  return (
                    <div key={i} className="bg-white p-3 rounded-lg border border-purple-100 shadow-sm flex gap-3">
                      {photoUrl && (
                        <div 
                          className="w-16 h-16 rounded-md bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 cursor-pointer shadow-sm"
                          onClick={() => setPreviewImage(photoUrl)}
                        >
                          <img src={photoUrl} alt="Bio Input" className="w-full h-full object-cover hover:scale-110 transition-transform" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-sm text-slate-800">{b['inputs_applied'] || 'Unknown'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{b['application_date_bio_input'] || 'No Date'}</p>
                        <p className="text-xs font-semibold text-purple-600 mt-1">
                          {b['Dhravajeevamrutham_Quantity'] ? `${b['Dhravajeevamrutham_Quantity']} Qty` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No bio inputs recorded.</p>
            )}
          </div>

          {/* Harvests */}
          <div>
            <h6 className="text-sm font-bold text-amber-600 mb-3 flex items-center gap-2">
              <Wheat className="w-4 h-4" /> Harvest Records ({data.harvest.length})
            </h6>
            {data.harvest.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.harvest.map((h, i) => {
                  const photoUrl = getOdkImageUrl('NF- Activities', h['PARENT_KEY'] || h['KEY'] || h['meta-instanceID'], h['photo'] || h['Photo'] || h['Photos']);
                  return (
                    <div key={i} className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm flex gap-3">
                      {photoUrl && (
                        <div 
                          className="w-16 h-16 rounded-md bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 cursor-pointer shadow-sm"
                          onClick={() => setPreviewImage(photoUrl)}
                        >
                          <img src={photoUrl} alt="Harvest" className="w-full h-full object-cover hover:scale-110 transition-transform" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-sm text-slate-800">Harvest Yield</p>
                        <p className="text-xs text-slate-500 mt-0.5">{h['date_harvest'] || 'No Date'}</p>
                        <p className="text-xs font-semibold text-amber-600 mt-1">
                          {h['yield_Qntl'] ? `${h['yield_Qntl']} Qntl` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No harvest records.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PlotMarker({ plot, color }: { plot: any, color?: string, key?: any }) {
  const markerColor = color || '#10b981';
  const icon = L.divIcon({
    className: 'custom-dot',
    html: `<div class="rounded-full border-2 border-white shadow-sm w-3 h-3 hover:scale-125 transition-transform" style="background-color: ${markerColor}"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
  });

  return (
    <Marker position={[plot.lat, plot.lng]} icon={icon}>
      <Popup className="custom-popup">
        <div className="p-1 min-w-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: markerColor }} />
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{plot.village} Village</span>
          </div>
          <h3 className="font-bold text-slate-800 text-sm mb-1">{plot.name}</h3>
          <p className="text-xs text-slate-500 mb-2">ID: {plot.hhId}</p>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
            <div>
              <span className="block text-[10px] text-slate-400 font-semibold mb-0.5">CROP</span>
              <span className="block text-xs font-medium text-slate-700 truncate" title={plot.crop}>{plot.crop}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-semibold mb-0.5">AREA</span>
              <span className="block text-xs font-medium text-slate-700">{plot.area} Ac</span>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
