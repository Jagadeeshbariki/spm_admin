import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
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
  Minimize2,
  Navigation,
  Globe,
  MapPin,
  X
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

const CustomYTick = (props: any) => {
  const { x, y, payload } = props;
  const words = payload.value.replace(/_/g, ' ').split(' ');
  const lines = [];
  let line = '';
  words.forEach((w: string) => {
    if ((line + w).length > 15) {
      if (line) lines.push(line.trim());
      line = w + ' ';
    } else {
      line += w + ' ';
    }
  });
  if (line) lines.push(line.trim());
  return (
    <text x={x - 5} y={y - (lines.length - 1) * 6} textAnchor="end" fill="#64748b" fontSize={10} fontWeight={500} dy={3}>
      {lines.map((l, i) => (
        <tspan key={i} x={x - 5} dy={i === 0 ? 0 : 12}>{l}</tspan>
      ))}
    </text>
  );
};

const CustomXTick = (props: any) => {
  const { x, y, payload } = props;
  const name = payload.value.replace(/_/g, ' ');

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="end" fill="#64748b" fontSize={10} fontWeight={500} transform="rotate(-45)">
        {name}
      </text>
    </g>
  );
};

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

export function ProcessingHubsDashboard({
  hubs,
  hubClusters,
  hubGPs,
  hubVillages,
  hubUnits,
  selectedHubCluster,
  setSelectedHubCluster,
  selectedHubGP,
  setSelectedHubGP,
  selectedHubVillage,
  setSelectedHubVillage,
  selectedHubUnit,
  setSelectedHubUnit,
  searchTerm,
  setSearchTerm,
  totalHubUnits,
  totalHubVillagesCovered,
}: {
  hubs: any[];
  hubClusters: string[];
  hubGPs: string[];
  hubVillages: string[];
  hubUnits: string[];
  selectedHubCluster: string; setSelectedHubCluster: (s: string) => void;
  selectedHubGP: string; setSelectedHubGP: (s: string) => void;
  selectedHubVillage: string; setSelectedHubVillage: (s: string) => void;
  selectedHubUnit: string; setSelectedHubUnit: (s: string) => void;
  searchTerm: string; setSearchTerm: (s: string) => void;
  totalHubUnits: number;
  totalHubVillagesCovered: number;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('satellite');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isFullscreenMap, setIsFullscreenMap] = useState(false);
  const [fullscreenElement, setFullscreenElement] = useState<'map' | 'status-chart' | 'cluster-chart' | 'types-chart' | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreenMap(false);
        setFullscreenElement(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);
  
  const center = hubs.length > 0 && !isNaN(parseFloat(hubs[0].lat)) && !isNaN(parseFloat(hubs[0].long)) 
    ? [parseFloat(hubs[0].lat), parseFloat(hubs[0].long)] 
    : [18.9103, 83.8252];
  
  const statusData = useMemo(() => {
    let working = 0;
    let notUsing = 0;
    let underRepair = 0;
    let others = 0;
    hubs.forEach(h => {
      const st = (h['status '] || h['status_of_unit-status'] || h['Status'] || '').toString().toLowerCase();
      if (st.includes('working')) working++;
      else if (st.includes('not_using') || st.includes('not using')) notUsing++;
      else if (st.includes('under_repair') || st.includes('under repair') || st.includes('repair')) underRepair++;
      else others++;
    });
    return [
      { name: 'Working', value: working, color: '#10b981' },
      { name: 'Not Using', value: notUsing, color: '#f43f5e' },
      { name: 'Under Repair', value: underRepair, color: '#3b82f6' },
      { name: 'Others', value: others, color: '#f59e0b' }
    ].filter(d => d.value > 0);
  }, [hubs]);

  const filteredLocalHubs = useMemo(() => {
     if (!statusFilter) return hubs;
     return hubs.filter(hub => {
        const st = (hub['status '] || hub['status_of_unit-status'] || hub['Status'] || '').toLowerCase();
        if (statusFilter === 'Working') {
          return st.includes('working');
        } else if (statusFilter === 'Not Using') {
          return st.includes('not_using') || st.includes('not using');
        } else if (statusFilter === 'Under Repair') {
          return st.includes('under_repair') || st.includes('under repair') || st.includes('repair');
        } else {
          return !st.includes('working') && !st.includes('not_using') && !st.includes('not using') && !st.includes('under_repair') && !st.includes('under repair') && !st.includes('repair');
        }
     });
  }, [hubs, statusFilter]);

  const clusterData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLocalHubs.forEach(hub => {
      const cluster = hub.Cluster || hub.cluster || 'Unknown';
      counts[cluster] = (counts[cluster] || 0) + 1;
    });
    
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b'];
    return Object.keys(counts).map((key, i) => ({
      name: key,
      value: counts[key],
      color: colors[i % colors.length]
    })).sort((a,b) => b.value - a.value);
  }, [filteredLocalHubs]);

  const unitNameData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLocalHubs.forEach(hub => {
      const unit = hub['Unit name'] || hub.unit_name || 'Unknown';
      counts[unit] = (counts[unit] || 0) + 1;
    });
    
    return Object.keys(counts).map((key) => ({
      name: key,
      fullName: key,
      count: counts[key],
    })).sort((a,b) => b.count - a.count);
  }, [filteredLocalHubs]);

  return (
    <div className="flex-1 overflow-y-auto w-full custom-scrollbar bg-slate-50 relative">
      <div className="flex flex-col space-y-4 p-4 md:p-6 pb-20">
        
        {/* Header & Stats area */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between lg:items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
               <h2 className="text-xl font-bold text-slate-800">Processing Hubs Dashboard</h2>
               <p className="text-sm text-slate-500">Overview of established units across the region</p>
            </div>
            <div className="flex gap-4 items-stretch">
               <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 min-w-[120px] flex flex-col justify-center">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Units</p>
                 <p className="text-2xl font-black text-slate-800">{filteredLocalHubs.length}</p>
               </div>
               <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 min-w-[120px] flex flex-col justify-center">
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Villages Covered</p>
                 <p className="text-2xl font-black text-emerald-600">{new Set(filteredLocalHubs.map(h => h.Village || h.village || h['Village']).filter(Boolean)).size}</p>
               </div>
            </div>
          </div>
          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-2 lg:grid-cols-4 gap-3">
             <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none font-medium focus:ring-2 focus:ring-blue-500" value={selectedHubCluster} onChange={(e) => { setSelectedHubCluster(e.target.value); setSelectedHubGP('All GPs'); setSelectedHubVillage('All Villages'); }}>
               <option>All Clusters</option>
               {hubClusters.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
             <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none font-medium focus:ring-2 focus:ring-blue-500" value={selectedHubGP} onChange={(e) => { setSelectedHubGP(e.target.value); setSelectedHubVillage('All Villages'); }}>
               <option>All GPs</option>
               {hubGPs.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
             <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none font-medium focus:ring-2 focus:ring-blue-500" value={selectedHubVillage} onChange={(e) => setSelectedHubVillage(e.target.value)}>
               <option>All Villages</option>
               {hubVillages.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
             <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none font-medium focus:ring-2 focus:ring-blue-500" value={selectedHubUnit} onChange={(e) => setSelectedHubUnit(e.target.value)}>
               <option>All Units</option>
               {hubUnits.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
             <div className="relative col-span-2 lg:col-span-4 flex flex-wrap sm:flex-nowrap gap-2">
               <div className="relative flex-1">
                 <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                 <input type="text" placeholder="Search entity..." className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none font-medium focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>
               {(selectedHubCluster !== 'All Clusters' || selectedHubGP !== 'All GPs' || selectedHubVillage !== 'All Villages' || selectedHubUnit !== 'All Units' || searchTerm !== '' || statusFilter !== null) && (
                 <button 
                   onClick={() => {
                     setSelectedHubCluster('All Clusters');
                     setSelectedHubGP('All GPs');
                     setSelectedHubVillage('All Villages');
                     setSelectedHubUnit('All Units');
                     setSearchTerm('');
                     setStatusFilter(null);
                   }}
                   className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
                 >
                   <X className="w-4 h-4" /> Clear Filters
                 </button>
               )}
             </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* Status Breakdown Pie Chart Card */}
          {statusData.length > 0 && (
             <div className={cn("bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col relative transition-all duration-300 isolate", fullscreenElement === 'status-chart' ? "fixed inset-0 z-[1001] m-0 rounded-none h-[100dvh] w-[100vw] overflow-y-auto" : "")}>
                <div className="absolute top-4 right-4 z-[1002]">
                   <button 
                     onClick={() => setFullscreenElement(fullscreenElement === 'status-chart' ? null : 'status-chart')}
                     className="bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors rounded-lg flex items-center justify-center p-2"
                     title={fullscreenElement === 'status-chart' ? "Exit Fullscreen" : "Expand Chart"}
                   >
                     {fullscreenElement === 'status-chart' ? <Minimize2 className="w-4 h-4 text-slate-700" /> : <Maximize2 className="w-4 h-4 text-slate-700" />}
                   </button>
                </div>
               <p className="text-sm font-bold text-slate-800 mb-4">Status Breakdown <span className="text-[10px] font-normal text-slate-400 ml-1">(Click to filter)</span></p>
               
               <div className="min-h-[200px] w-full flex-1 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                       data={statusData} 
                       dataKey="value" 
                       innerRadius={60} 
                       outerRadius={90} 
                       paddingAngle={2} 
                       stroke="none"
                       onClick={(data) => {
                          setStatusFilter(statusFilter === data.name ? null : data.name);
                       }}
                       className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} opacity={statusFilter && statusFilter !== entry.name ? 0.3 : 1} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ fontSize: '12px', padding: '6px 10px', borderRadius: '6px' }} itemStyle={{ color: '#333' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 max-h-[80px] overflow-y-auto custom-scrollbar">
                {statusData.map(d => (
                  <div 
                     key={d.name} 
                     className={cn(
                       "flex items-center gap-1.5 cursor-pointer transition-all px-2 py-1 rounded-md", 
                       statusFilter === d.name ? "bg-slate-100 ring-1 ring-slate-200" : "hover:bg-slate-50 opacity-80 hover:opacity-100"
                     )}
                     onClick={() => setStatusFilter(statusFilter === d.name ? null : d.name)}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shadow-inner shrink-0" style={{backgroundColor: d.color}}></div>
                    <span className={cn("text-[11px] whitespace-nowrap", statusFilter === d.name ? "font-black text-slate-800" : "font-semibold text-slate-600")}>{d.name} <span className="text-slate-400 font-medium">({d.value})</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={cn("bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col relative transition-all duration-300 isolate", fullscreenElement === 'cluster-chart' ? "fixed inset-0 z-[1001] m-0 rounded-none h-[100dvh] w-[100vw] overflow-y-auto" : "")}>
             <div className="absolute top-4 right-4 z-[1002]">
                <button 
                  onClick={() => setFullscreenElement(fullscreenElement === 'cluster-chart' ? null : 'cluster-chart')}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors rounded-lg flex items-center justify-center p-2"
                  title={fullscreenElement === 'cluster-chart' ? "Exit Fullscreen" : "Expand Chart"}
                >
                  {fullscreenElement === 'cluster-chart' ? <Minimize2 className="w-4 h-4 text-slate-700" /> : <Maximize2 className="w-4 h-4 text-slate-700" />}
                </button>
             </div>
            <h3 className="text-sm font-bold text-slate-800 mb-4">Cluster-wise Hub Distribution</h3>
            <div className="min-h-[200px] w-full flex-1 relative flex items-center justify-center">
              {clusterData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={clusterData} 
                      dataKey="value" 
                      innerRadius={0} 
                      outerRadius={90} 
                      paddingAngle={1} 
                      stroke="#ffffff"
                      label={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
                    >
                      {clusterData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ fontSize: '12px', padding: '6px 10px', borderRadius: '6px' }} 
                      itemStyle={{ color: '#333' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-sm text-slate-400">No clusters found</div>
              )}
            </div>
            {clusterData.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 max-h-[80px] overflow-y-auto custom-scrollbar">
                {clusterData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: d.color}}></div>
                    <span className="text-[11px] font-semibold text-slate-600">{d.name} <span className="text-slate-400">({d.value})</span></span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className={cn("bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col relative transition-all duration-300 isolate lg:col-span-2", fullscreenElement === 'types-chart' ? "fixed inset-0 z-[1001] m-0 rounded-none h-[100dvh] w-[100vw] overflow-y-auto" : "")}>
             <div className="absolute top-4 right-4 z-[1002]">
                <button 
                  onClick={() => setFullscreenElement(fullscreenElement === 'types-chart' ? null : 'types-chart')}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors rounded-lg flex items-center justify-center p-2"
                  title={fullscreenElement === 'types-chart' ? "Exit Fullscreen" : "Expand Chart"}
                >
                  {fullscreenElement === 'types-chart' ? <Minimize2 className="w-4 h-4 text-slate-700" /> : <Maximize2 className="w-4 h-4 text-slate-700" />}
                </button>
             </div>
            <h3 className="text-sm font-bold text-slate-800 mb-4">Processing Unit Types</h3>
            <div className="w-full relative" style={{ height: fullscreenElement === 'types-chart' ? 'calc(100vh - 120px)' : '400px' }}>
              {unitNameData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={unitNameData} layout="horizontal" margin={{ top: 20, right: 10, left: 0, bottom: 60 }} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      type="category" 
                      tick={<CustomXTick />} 
                      axisLine={false} 
                      tickLine={false}
                      interval={0}
                      height={90}
                    />
                    <YAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      cursor={{fill: '#f1f5f9'}} 
                      contentStyle={{ fontSize: '12px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                      formatter={(value) => [<span className="font-bold text-slate-800">{value} Units</span>, 'Count']}
                      labelFormatter={(label, payload) => {
                        return payload && payload.length > 0 ? (payload[0].payload.fullName) : label;
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-400">No units found</div>
              )}
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className={cn(
           "bg-slate-100 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden transition-all duration-300 z-10 isolate flex flex-col w-full",
           isFullscreenMap ? "fixed inset-0 z-[1000] m-0 rounded-none h-[100dvh] w-[100vw]" : "h-[400px] md:h-[450px]"
        )}>
          <div className="absolute top-4 right-4 z-[1000] flex gap-2">
              <button 
                 onClick={() => setMapType(mapType === 'streets' ? 'satellite' : 'streets')}
                 className="px-3 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200 text-[10px] uppercase font-bold text-slate-700 hover:bg-white transition-colors"
                 title="Toggle Map Base Layer"
              >
                Toggle Map
              </button>
              <button 
                 onClick={() => setIsFullscreenMap(!isFullscreenMap)}
                 className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200 hover:bg-white transition-colors flex items-center justify-center p-2.5"
                 title={isFullscreenMap ? "Exit Fullscreen" : "Fullscreen Map"}
              >
                {isFullscreenMap ? <Minimize2 className="w-4 h-4 text-slate-700" /> : <Maximize2 className="w-4 h-4 text-slate-700" />}
              </button>
            </div>
            <MapContainer center={center as [number, number]} zoom={11} className="w-full h-full" zoomControl={true}>
              {mapType === 'streets' ? (
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />
              ) : (
                <TileLayer
                  attribution='&copy; Google Maps'
                  url="https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
                  subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                />
              )}
              {filteredLocalHubs.map((hub) => {
                  const lat = parseFloat(hub.lat);
                  const lng = parseFloat(hub.long);
                  if (isNaN(lat) || isNaN(lng)) return null;
                  
                  const hubStatus = (hub['status '] || hub['status_of_unit-status'] || hub['Status'] || '').toLowerCase();
                  let colorClass = 'bg-amber-500';
                  let pulseClass = 'ring-amber-200 bg-amber-600';
                  
                  if (hubStatus.includes('working')) {
                    colorClass = 'bg-emerald-500';
                    pulseClass = 'ring-emerald-200 bg-emerald-600';
                  } else if (hubStatus.includes('not_using') || hubStatus.includes('not using')) {
                    colorClass = 'bg-rose-500';
                    pulseClass = 'ring-rose-200 bg-rose-600';
                  } else if (hubStatus.includes('under_repair') || hubStatus.includes('under repair') || hubStatus.includes('repair')) {
                    colorClass = 'bg-blue-500';
                    pulseClass = 'ring-blue-200 bg-blue-600';
                  }

                  const isExpanded = expandedId === hub._rowIndex;
                  // Avoid recreating L.divIcon on every render to prevent _leaflet_pos crash
                  const hubIcon = L.divIcon({
                      className: 'custom-dot',
                      html: `<div class="${cn("rounded-full border-1.5 border-white shadow-sm transition-all", colorClass, isExpanded ? `w-4 h-4 -mt-0.5 -ml-0.5 ring-4 animate-pulse ${pulseClass}` : "w-3 h-3 hover:scale-110")}"></div>`,
                      iconSize: isExpanded ? [24, 24] : [20, 20],
                      iconAnchor: isExpanded ? [12, 12] : [10, 10],
                      popupAnchor: [0, -10]
                  });

                  return (
                    <Marker key={hub._rowIndex} position={[lat, lng]} icon={hubIcon}>
                      <Popup className="custom-popup">
                        <div className="p-1 min-w-[200px]">
                           <div className="flex items-center gap-2 mb-2">
                             <div className={cn("w-2 h-2 rounded-full", colorClass)} />
                             <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{hub['Village']} Village</span>
                           </div>
                           <div className="font-bold text-sm text-slate-800 leading-tight mb-1">{hub['entr_name']}</div>
                           <div className="text-[10px] text-slate-500 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">{hub['Unit name']}</div>
                        </div>
                      </Popup>
                    </Marker>
                  )
              })}
            </MapContainer>
        </div>

        {/* Full width List Accordion */}
        <div className="w-full space-y-3 pt-6">
          <h3 className="font-bold text-slate-800 text-lg mb-2 pl-1 flex gap-2 items-center"><Layers className="w-5 h-5 text-blue-600" /> Processing Hubs List</h3>
          {filteredLocalHubs.length === 0 ? (
            <div className="p-8 text-center text-sm font-medium text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">No processing hubs found.</div>
          ) : filteredLocalHubs.map(hub => {
            const isExpanded = expandedId === hub._rowIndex;
            return (
              <div key={hub._rowIndex} className={cn("bg-white rounded-xl border transition-all overflow-hidden", isExpanded ? "border-blue-300 shadow-md ring-1 ring-blue-100 bg-slate-50/30" : "border-slate-200 shadow-sm hover:border-slate-300")}>
                 <button onClick={() => setExpandedId(isExpanded ? null : hub._rowIndex)} className="w-full p-4 flex flex-col md:flex-row md:items-center justify-between text-left hover:bg-slate-50/50 transition-colors gap-2">
                    <div>
                       <div className="text-sm font-bold text-slate-800">{hub['entr_name']}</div>
                       <div className="text-[11px] font-medium text-slate-500 mt-0.5">{hub['Unit name']} &bull; <span className="text-slate-700">{hub['Village']}</span></div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto mt-2 md:mt-0">
                       <span className={cn("text-[10px] font-bold px-2 py-1 rounded-md capitalize", 
                          (hub['status '] || hub['status_of_unit-status'] || hub['Status'] || '').toLowerCase().includes('working') ? "bg-emerald-100 text-emerald-700" : 
                          (hub['status '] || hub['status_of_unit-status'] || hub['Status'] || '').toLowerCase().includes('not') ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"
                        )}>
                          {(hub['status '] || hub['status_of_unit-status'] || hub['Status'] || 'N/A').replace(/_/g, ' ')}
                       </span>
                       <ChevronRight className={cn("w-5 h-5 text-slate-400 transition-transform", isExpanded && "rotate-90")} />
                    </div>
                 </button>
                 {isExpanded && (
                   <div className="px-4 pb-4 border-t border-slate-100 pt-4 bg-slate-50/30">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-y-5 gap-x-4 mb-4">
                       <div>
                          <span className="block text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-1">Village & GP</span>
                          <span className="font-semibold text-slate-700 text-xs">{hub.Village} / {hub.GP || 'N/A'}</span>
                       </div>
                       <div>
                          <span className="block text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-1">Cluster</span>
                          <span className="font-semibold text-slate-700 text-xs">{hub.Cluster || 'N/A'}</span>
                       </div>
                       <div>
                          <span className="block text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-1">Father/Husband</span>
                          <span className="font-semibold text-slate-700 text-xs">{hub['Father/husband Name'] || 'N/A'}</span>
                       </div>
                       <div>
                          <span className="block text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-1">Phone Number</span>
                          <span className="font-semibold text-blue-600 text-xs">{hub['Phone Number'] || 'N/A'}</span>
                       </div>
                       <div>
                          <span className="block text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-1">HH ID</span>
                          <span className="font-semibold text-slate-700 text-xs">{hub['HH_id'] || 'N/A'}</span>
                       </div>
                       <div>
                          <span className="block text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-1">Unit Name</span>
                          <span className="font-semibold text-slate-700 text-xs">{hub['Unit name'] || 'N/A'}</span>
                       </div>
                       <div>
                          <span className="block text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-1">Unit Issued Date</span>
                          <span className="font-semibold text-slate-700 text-xs">{hub['Unit issued date'] || 'N/A'}</span>
                       </div>
                       <div>
                          <span className="block text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-1">Contribution Paid</span>
                          <span className="font-semibold text-emerald-600 text-xs font-mono">{hub['Contribution paid'] || 'N/A'}</span>
                       </div>
                       {(hub['Reason for not working/using'] || hub['status_of_unit-reason_not_using'] || hub['status_of_unit-reason_repair']) && (
                         <div className="col-span-2 md:col-span-4 mt-2">
                            <span className="block text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-1">Reason If Not Working</span>
                            <span className="font-semibold text-rose-600 text-xs">
                              {hub['Reason for not working/using'] || hub['status_of_unit-reason_not_using'] || hub['status_of_unit-reason_repair']}
                            </span>
                         </div>
                       )}
                     </div>
                     
                     {hub['Photo'] && (
                       <div className="flex justify-center md:justify-start">
                         <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm ring-1 ring-slate-100 mt-2 w-full md:w-[320px]">
                           <img 
                             src={`/api/odk/image?submissionId=${encodeURIComponent(hub.Key || hub.KEY || hub['meta-instanceID'] || '')}&filename=${encodeURIComponent(hub['Photo'])}`} 
                             alt="Hub photo" 
                             className="w-full h-auto max-h-48 object-cover bg-slate-100 cursor-pointer hover:opacity-90 transition-opacity"
                             loading="lazy"
                             onClick={() => setPreviewImage(`/api/odk/image?submissionId=${encodeURIComponent(hub.Key || hub.KEY || hub['meta-instanceID'] || '')}&filename=${encodeURIComponent(hub['Photo'])}`)}
                           />
                         </div>
                       </div>
                     )}
                   </div>
                 )}
              </div>
            )
          })}
        </div>
      </div>
      {previewImage && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-900/95 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setPreviewImage(null)}>
          <button 
            className="absolute top-6 right-6 md:top-10 md:right-10 z-[100000] bg-slate-800 hover:bg-slate-700 text-white rounded-full p-3 transition-all border border-slate-600 shadow-xl"
            onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
            title="Close image"
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={previewImage} 
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/10" 
            alt="Full size preview"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>,
        document.body
      )}
    </div>
  )
}

export default function VillageGIS({ tab = 'assets' }: { tab?: 'assets' | 'hubs' }) {
  const [loading, setLoading] = useState(true);
  const [villageAssets, setVillageAssets] = useState<ActivityAsset[]>([]);
  const [processingHubs, setProcessingHubs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'assets' | 'hubs'>(tab);

  useEffect(() => {
    setActiveTab(tab);
    setSelectedAssetId(null);
  }, [tab]);
  const [boundaryDataList, setBoundaryDataList] = useState<any[]>([]);
  const [geoVillages, setGeoVillages] = useState<GeoVillage[]>([]);
  const [loadingBoundary, setLoadingBoundary] = useState(false);
  const [selectedMandal, setSelectedMandal] = useState('All Mandals');
  const [selectedActivity, setSelectedActivity] = useState('All Activities');
  const [selectedHubUnit, setSelectedHubUnit] = useState('All Units');
  const [selectedHubCluster, setSelectedHubCluster] = useState('All Clusters');
  const [selectedHubGP, setSelectedHubGP] = useState('All GPs');
  const [selectedHubVillage, setSelectedHubVillage] = useState('All Villages');
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [showActivityLayer, setShowActivityLayer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default to false on mobile, will expand initially
  const [mapCenter, setMapCenter] = useState<[number, number]>([18.85, 83.8]); // Centered on Manyam area

  // Check screen size
  useEffect(() => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    }
  }, []);
  const [mapZoom, setMapZoom] = useState(10);
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('satellite');

  useEffect(() => {
    const initData = async () => {
      await loadData();
      await loadBoundaries();
    };
    initData();
  }, []);

  const loadBoundaries = async () => {
    try {
      setLoadingBoundary(true);
      const polygons = await fetchSheet('Polygons_manyam');
      
      const geoResults = [];
      for (const row of polygons) {
        if (!row['File ID']) {
          geoResults.push(null);
          continue;
        }
        try {
          const data = await fetchGeoJson(row['File ID']);
          geoResults.push({ row, data });
        } catch (err) {
          console.error(`Failed to load GeoJSON for ${row['File Name']}:`, err);
          geoResults.push(null);
        }
      }

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
      const [hubsData] = await Promise.all([
        fetchSheet('Master').catch(() => [])
      ]);
      setVillageAssets([]);
      const hubsWithIndex = hubsData.map((h: any, i: number) => ({ ...h, _rowIndex: h._rowIndex || i.toString() }));
      setProcessingHubs(hubsWithIndex);
      
      // Auto-center if we have data AND no boundary is present
      if (hubsData.length > 0 && boundaryDataList.length === 0) {
        const first = hubsData.find((h: any) => h.lat && h.long);
        if (first) {
          const lat = parseFloat(first.lat);
          const lng = parseFloat(first.long);
          if (!isNaN(lat) && !isNaN(lng)) {
            setMapCenter([lat, lng]);
            setMapZoom(11);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
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

  const hubUnits = useMemo(() => {
    return Array.from(new Set(processingHubs.map(h => h['Unit name']).filter(Boolean))).sort();
  }, [processingHubs]);

  const hubClusters = useMemo(() => {
    return Array.from(new Set(processingHubs.map(h => h['Cluster']).filter(Boolean))).sort();
  }, [processingHubs]);

  const hubGPs = useMemo(() => {
    let hubs = processingHubs;
    if (selectedHubCluster !== 'All Clusters') {
      hubs = hubs.filter(h => h['Cluster'] === selectedHubCluster);
    }
    return Array.from(new Set(hubs.map(h => h['GP']).filter(Boolean))).sort();
  }, [processingHubs, selectedHubCluster]);

  const hubVillages = useMemo(() => {
    let hubs = processingHubs;
    if (selectedHubCluster !== 'All Clusters') {
      hubs = hubs.filter(h => h['Cluster'] === selectedHubCluster);
    }
    if (selectedHubGP !== 'All GPs') {
      hubs = hubs.filter(h => h['GP'] === selectedHubGP);
    }
    return Array.from(new Set(hubs.map(h => h['Village']).filter(Boolean))).sort();
  }, [processingHubs, selectedHubCluster, selectedHubGP]);

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

  const filteredHubs = useMemo(() => {
    return processingHubs.filter(hub => {
      const matchesUnit = selectedHubUnit === 'All Units' || hub['Unit name'] === selectedHubUnit;
      const matchesCluster = selectedHubCluster === 'All Clusters' || hub['Cluster'] === selectedHubCluster;
      const matchesGP = selectedHubGP === 'All GPs' || hub['GP'] === selectedHubGP;
      const matchesVillage = selectedHubVillage === 'All Villages' || hub['Village'] === selectedHubVillage;

      const matchesSearch = !searchTerm || 
        hub['Village']?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        hub['entr_name']?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const hasCoords = !isNaN(parseFloat(hub.lat)) && !isNaN(parseFloat(hub.long));
      return matchesUnit && matchesCluster && matchesGP && matchesVillage && matchesSearch && hasCoords;
    });
  }, [processingHubs, selectedHubUnit, selectedHubCluster, selectedHubGP, selectedHubVillage, searchTerm]);

  // Derived dashboard stats
  const totalHubVillagesCovered = useMemo(() => new Set(filteredHubs.map(h => h['Village']).filter(Boolean)).size, [filteredHubs]);
  const totalHubUnits = filteredHubs.length;

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
    <div className="h-auto md:h-[calc(100vh-140px)] flex flex-col md:flex-row bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 relative">
      {activeTab === 'hubs' ? (
        <ProcessingHubsDashboard
          hubs={filteredHubs}
          hubClusters={hubClusters}
          hubGPs={hubGPs}
          hubVillages={hubVillages}
          hubUnits={hubUnits}
          selectedHubCluster={selectedHubCluster}
          setSelectedHubCluster={setSelectedHubCluster}
          selectedHubGP={selectedHubGP}
          setSelectedHubGP={setSelectedHubGP}
          selectedHubVillage={selectedHubVillage}
          setSelectedHubVillage={setSelectedHubVillage}
          selectedHubUnit={selectedHubUnit}
          setSelectedHubUnit={setSelectedHubUnit}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          totalHubUnits={totalHubUnits}
          totalHubVillagesCovered={totalHubVillagesCovered}
        />
      ) : (
        <>
          {/* Sidebar Filters - Mobile Overlay / Desktop Sidebar */}
          <div className={cn(
            "absolute inset-0 z-[5000] md:relative md:inset-auto md:z-auto transition-all duration-300 md:duration-300 flex flex-col bg-white",
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
      <div className="flex-1 relative z-0">
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
          {activeTab === 'assets' && showActivityLayer && filteredAssets.map((asset, idx) => {
            const lat = parseFloat(asset.Latitude as any);
            const lng = parseFloat(asset.Longitude as any);
            if (isNaN(lat) || isNaN(lng)) return null;

            const isSelected = selectedAssetId === asset._rowIndex;
            // Prevent _leaflet_pos crash by avoiding recreation on same key
            const assetIcon = L.divIcon({
                  className: 'custom-dot-blue',
                  html: `<div class="${cn(
                    "rounded-full border-1.5 border-white shadow-sm transition-all duration-300",
                    isSelected ? "bg-blue-600 w-4 h-4 -mt-0.5 -ml-0.5 ring-4 ring-blue-200 animate-pulse-blue" : "bg-blue-500 w-2.5 h-2.5"
                  )}"></div>`,
                  iconSize: isSelected ? [24, 24] : [20, 20],
                  iconAnchor: isSelected ? [12, 12] : [10, 10],
                  popupAnchor: [0, -8]
                });

            return (
              <Marker 
                key={`asset-${asset._rowIndex || idx}`} 
                position={[lat, lng]}
                icon={assetIcon}
                zIndexOffset={isSelected ? 2000 : 1000}
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
      </>
      )}
    </div>
  );
}
