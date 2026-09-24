import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Filter, Search, Loader2, MapPin, Database, ChevronDown, Activity, Info, ExternalLink, X, ZoomIn, Anchor, Waves } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { cn } from '../../lib/utils';
import { ExpandableChartBox } from '../../components/ExpandableChartBox';
import { flatten } from 'flat';
import { FisheriesMapTab } from './FisheriesMapTab';

function MultiSelect({ label, options, selected, onChange, className }: { label: string, options: string[], selected: string[], onChange: (val: string[]) => void, className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter(v => v !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between shadow-sm min-w-[140px]"
      >
        <span className="truncate pr-2">
          {selected.length === 0 ? label : `${label} (${selected.length})`}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </div>
      
      {isOpen && (
        <div className="absolute z-[9999] mt-1 w-full min-w-[220px] max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg py-1">
          {options.length === 0 && <div className="px-3 py-2 text-sm text-slate-500">No options</div>}
          {options.map(opt => (
            <label key={opt} className="flex items-center px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="w-4 h-4 text-emerald-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 rounded focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm text-slate-700 dark:text-slate-200">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FisheriesAssessmentDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Filters
  const [selectedBlock, setSelectedBlock] = useState<string>('All');
  const [selectedGp, setSelectedGp] = useState<string>('All');
  const [selectedVillage, setSelectedVillage] = useState<string>('All');
  const [selectedSubmitters, setSelectedSubmitters] = useState<string[]>([]);

  // Preview Image
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch('/api/odk/data?projectId=3&formId=Fishponds_Assessment%202025');
        if (!res.ok) {
          throw new Error(`Failed to fetch data (${res.status})`);
        }
        const text = await res.text();
        if (text.trim().startsWith('<')) {
          throw new Error('API returned HTML instead of JSON');
        }
        const json = JSON.parse(text);
        
        // Map and parse the flat data structure
        const parsed = (json.value || []).map((item: any) => {
          const flat = flatten(item) as any;
          const submissionId = item.__id || (item.meta?.instanceID || '').replace('uuid:', '');
          
          return {
             ...item,
             flat,
             submissionId,
             block: String(item.primary_details?.block || flat['block'] || 'Unknown').trim(),
             gp: String(item.primary_details?.gp || flat['gp'] || 'Unknown').trim(),
             village: String(item.primary_details?.village || flat['village'] || 'Unknown').trim(),
             farmerName: String(item.primary_details?.farmer_name || flat['farmer_name'] || 'Unknown').trim(),
             tankName: String(item.primary_details?.tank_name || flat['tank_name'] || '-').trim(),
             submitterName: String(item.__system?.submitterName || flat['submitterName'] || 'Unknown').trim(),
             extentAcre: parseFloat(item.primary_details?.extent_acre || flat['extent_acre'] || '0'),
             pondCondition: String(item.pond_info?.pond_condition || flat['pond_condition'] || 'Unknown').trim(),
             pondOwnership: String(item.pond_info?.pond_ownership || flat['pond_ownership'] || 'Unknown').trim(),
             monthsWaterAvailable: String(item.pond_info?.months_water_available || flat['pond_info-months_water_available'] || flat['months_water_available'] || 'Unknown').trim(),
             pondImage: item.pond_info?.pond_image || flat['pond_image'] || null,
             coordinates: item.pond_info?.Pond_GPS?.coordinates || flat['Pond_GPS']?.coordinates || null,
          };
        });
        
        setData(parsed);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute Filter Options
  const filterOptions = useMemo(() => {
    const blocks = new Set<string>();
    const gps = new Set<string>();
    const villages = new Set<string>();
    const submitters = new Set<string>();

    data.forEach(item => {
      if (item.block !== 'Unknown') blocks.add(item.block);
      if (item.gp !== 'Unknown') gps.add(item.gp);
      if (item.village !== 'Unknown') villages.add(item.village);
      if (item.submitterName !== 'Unknown') submitters.add(item.submitterName);
    });

    return {
      blocks: Array.from(blocks).sort(),
      gps: Array.from(gps).sort(),
      villages: Array.from(villages).sort(),
      submitters: Array.from(submitters).sort( (a, b) => a.toLowerCase().localeCompare(b.toLowerCase()) ),
    };
  }, [data]);

  // Filter Data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (selectedBlock !== 'All' && item.block !== selectedBlock) return false;
      if (selectedGp !== 'All' && item.gp !== selectedGp) return false;
      if (selectedVillage !== 'All' && item.village !== selectedVillage) return false;
      if (selectedSubmitters.length > 0 && !selectedSubmitters.includes(item.submitterName)) return false;
      return true;
    });
  }, [data, selectedBlock, selectedGp, selectedVillage, selectedSubmitters]);

  // Statistics
  const stats = useMemo(() => {
    let totalPonds = filteredData.length;
    let totalArea = 0;
    const conditionCount: Record<string, number> = {};
    const ownershipCount: Record<string, number> = {};

    filteredData.forEach(item => {
      if (!isNaN(item.extentAcre)) totalArea += item.extentAcre;
      
      const cond = item.pondCondition;
      conditionCount[cond] = (conditionCount[cond] || 0) + 1;
      
      const own = item.pondOwnership.replace(/_/g, ' ');
      ownershipCount[own] = (ownershipCount[own] || 0) + 1;
    });

    return {
      totalPonds,
      totalArea: totalArea.toFixed(2),
      conditionData: Object.entries(conditionCount).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })),
      ownershipData: Object.entries(ownershipCount).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
    };
  }, [filteredData]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] bg-slate-50/50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Loading Fisheries Data</h2>
        <p className="text-slate-500 mt-2">Fetching records from ODK Central...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <Info className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-red-800 mb-2">Failed to load data</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#14b8a6'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Waves className="w-6 h-6 text-blue-600" />
              Rainfed Fisheries Dashboard
            </h1>
            <p className="text-slate-500 text-sm mt-1">Assessment of Water Bodies (Fishponds)</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700 mr-2">Filters:</span>
          
          <select 
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-blue-500 min-w-[120px]"
          >
            <option value="All">Block: All</option>
            {filterOptions.blocks.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          
          <select 
            value={selectedGp}
            onChange={(e) => setSelectedGp(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-blue-500 min-w-[120px]"
          >
            <option value="All">GP: All</option>
            {filterOptions.gps.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          
          <select 
            value={selectedVillage}
            onChange={(e) => setSelectedVillage(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-blue-500 min-w-[120px]"
          >
            <option value="All">Village: All</option>
            {filterOptions.villages.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          
          <MultiSelect 
            label="Submitters" 
            options={filterOptions.submitters} 
            selected={selectedSubmitters} 
            onChange={setSelectedSubmitters} 
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 mt-2">
        <button 
          onClick={() => setViewMode('grid')}
          className={cn(
            "px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
            viewMode === 'grid' ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Overview Dashboard
        </button>
        <button 
          onClick={() => setViewMode('map')}
          className={cn(
            "px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
            viewMode === 'map' ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
          )}
        >
          Spatial Map
        </button>
      </div>

      {viewMode === 'map' && (
        <FisheriesMapTab data={filteredData} setPreviewImage={setPreviewImage} />
      )}

      {viewMode === 'grid' && (
        <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Ponds</p>
              <h3 className="text-3xl font-bold text-slate-800">{stats.totalPonds}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Anchor className="w-5 h-5" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Extent Area</p>
              <h3 className="text-3xl font-bold text-slate-800">{stats.totalArea} <span className="text-sm font-medium text-slate-500 normal-case">acres</span></h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpandableChartBox title="Pond Condition" className="p-4 h-[300px]">
          {stats.conditionData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.conditionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {stats.conditionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-400">No data</div>
          )}
        </ExpandableChartBox>
        
        <ExpandableChartBox title="Pond Ownership" className="p-4 h-[300px]">
          {stats.ownershipData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.ownershipData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-400">No data</div>
          )}
        </ExpandableChartBox>
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-800">Water Bodies Assessment Records</h2>
          <span className="text-sm font-medium text-slate-500">{filteredData.length} entries</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4 gap-4 bg-slate-50/50">
            {filteredData.map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-800">{item.farmerName}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {item.village}, {item.gp}, {item.block}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tank Name:</span>
                  <span className="font-medium text-slate-700">{item.tankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Extent Acre:</span>
                  <span className="font-medium text-slate-700">{item.extentAcre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Condition:</span>
                  <span className="font-medium text-slate-700 capitalize">{item.pondCondition.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Water Avail.:</span>
                  <span className="font-medium text-slate-700 capitalize">{item.monthsWaterAvailable ? item.monthsWaterAvailable.replace(/_/g, ' ') : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ownership:</span>
                  <span className="font-medium text-slate-700 capitalize">{item.pondOwnership.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
                  <span className="text-slate-400">Submitted By:</span>
                  <span className="font-medium text-slate-700">{item.submitterName}</span>
                </div>
              </div>

              {item.pondImage ? (
                <div 
                  className="relative group w-full h-40 rounded-lg overflow-hidden border border-slate-200 shadow-sm cursor-pointer bg-slate-100"
                  onClick={() => setPreviewImage(`/api/odk/image?v=4&projectId=3&formId=Fishponds_Assessment%202025&submissionId=${encodeURIComponent(item.submissionId)}&filename=${encodeURIComponent(item.pondImage)}`)}
                >
                  <img 
                    src={`/api/odk/image?v=4&projectId=3&formId=Fishponds_Assessment%202025&submissionId=${encodeURIComponent(item.submissionId)}&filename=${encodeURIComponent(item.pondImage)}`}
                    alt="Pond Assessment"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                    <ZoomIn className="w-4 h-4" /> View Full Image
                  </div>
                </div>
              ) : (
                <div className="w-full h-40 rounded-lg border border-slate-200 border-dashed bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
                  No Photo Available
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      </>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10 bg-black/20"
            />
            <div className="mt-4 flex gap-4">
              <a 
                href={previewImage}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-md text-sm font-medium transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" /> Open Original
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
