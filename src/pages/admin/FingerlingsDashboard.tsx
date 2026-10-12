import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Filter, Search, Loader2, MapPin, Database, ChevronDown, Activity, Info, ExternalLink, X, ZoomIn, Anchor, Waves, Download, Fish, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { cn } from '../../lib/utils';
import { ExpandableChartBox } from '../../components/ExpandableChartBox';
import { flatten } from 'flat';

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

export default function FingerlingsDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedBlock, setSelectedBlock] = useState<string>('All');
  const [selectedGp, setSelectedGp] = useState<string>('All');
  const [selectedVillage, setSelectedVillage] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedSubmitters, setSelectedSubmitters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Project ID 12, Form ID: 1. Fingerlings Release
        const res = await fetch('/api/odk/data?projectId=12&formId=1.%20Fingerlings%20Release');
        if (!res.ok) {
          throw new Error(`Failed to fetch data (${res.status})`);
        }
        const text = await res.text();
        if (text.trim().startsWith('<')) {
          throw new Error('API returned HTML instead of JSON');
        }
        const json = JSON.parse(text);
        
        // Map and parse the flat data structure
        const rawItems = json.value || [];
        const parsed = rawItems.map((item: any) => {
          const flat = flatten(item) as any;
          const submissionId = item.__id || (item.meta?.instanceID || '').replace('uuid:', '');
          
          const findKey = (keywords: string[]) => {
            for (const [k, v] of Object.entries(flat)) {
              const lowerK = k.toLowerCase();
              if (keywords.every(kw => lowerK.includes(kw))) {
                if (v !== undefined && v !== null && String(v).trim() !== '') {
                  return String(v).trim();
                }
              }
            }
            for (const [k, v] of Object.entries(flat)) {
              const lowerK = k.toLowerCase();
              if (keywords.some(kw => lowerK.includes(kw))) {
                if (v !== undefined && v !== null && String(v).trim() !== '') {
                  return String(v).trim();
                }
              }
            }
            return '';
          };

          const findNumeric = (keywords: string[]) => {
            for (const [k, v] of Object.entries(flat)) {
              const lowerK = k.toLowerCase();
              if (keywords.some(kw => lowerK.includes(kw))) {
                const num = parseFloat(String(v));
                if (!isNaN(num)) return num;
              }
            }
            return 0;
          };

          let district = findKey(['pd-district', 'pd_district', 'district']) || 'Unknown';
          const block = findKey(['block']) || findKey(['mandal']) || 'Unknown';
          const gp = findKey(['gp']) || findKey(['panchayat']) || 'Unknown';
          const village = findKey(['village']) || findKey(['habitation']) || 'Unknown';
          const farmerName = findKey(['farmer', 'name']) || findKey(['beneficiary']) || findKey(['name']) || 'Unknown';
          
          const catlaQty = findNumeric(['catla_qty', 'catla']) || 0;
          const ragandiQty = findNumeric(['ragandi_qty', 'ragandi']) || 0;
          const mosuQty = findNumeric(['mosu_qty', 'mosu']) || 0;
          const bangaruQty = findNumeric(['bangaru_papa_qty', 'bangaru_papa', 'bangaru']) || 0;
          const grasscarpQty = findNumeric(['grasscarp_qty', 'grasscarp']) || 0;
          const othersQty = findNumeric(['others_qty', 'others']) || 0;

          const totalReleased = findNumeric(['no_fingerlings_released', 'no_fingerlings', 'fingerlings_released']);
          const varietySum = catlaQty + ragandiQty + mosuQty + bangaruQty + grasscarpQty + othersQty;
          const quantity = totalReleased > 0 ? totalReleased : (varietySum > 0 ? varietySum : findNumeric(['count', 'quantity', 'number', 'nos', 'qty', 'fingerlings']) || 0);

          const species = findKey(['species']) || findKey(['fish']) || (varietySum > 0 ? 'Multi-Variety' : 'Mixed / Other');
          const releaseDate = findKey(['fingerlings-date_fingerlings_released']) || findKey(['date_fingerlings_released']) || findKey(['date']) || findKey(['time']) || '-';

          // Extract Year
          let year = findKey(['year']) || '';
          if (year.length < 4 && releaseDate && releaseDate !== '-') {
            const parsedDate = new Date(releaseDate);
            if (!isNaN(parsedDate.getTime())) {
              year = String(parsedDate.getFullYear());
            } else {
              const match = releaseDate.match(/\b(20\d{2}|19\d{2})\b/);
              if (match) year = match[1];
            }
          }
          if (!year || year.length < 4) year = '2025';

          const submitterName = String(
            item.__system?.submitterName || 
            flat['submitterName'] || 
            flat['__system-submitterName'] ||
            'Unknown'
          ).trim();

          const findImage = () => {
            for (const [k, v] of Object.entries(flat)) {
              const lowerK = k.toLowerCase();
              const valStr = String(v || '').trim();
              if (
                (lowerK.includes('photo') || lowerK.includes('image') || lowerK.includes('picture') || lowerK.includes('img') || lowerK.includes('attachment')) &&
                valStr && !valStr.startsWith('http') && (valStr.endsWith('.jpg') || valStr.endsWith('.jpeg') || valStr.endsWith('.png') || valStr.includes('.'))
              ) {
                return valStr;
              }
            }
            for (const [k, v] of Object.entries(flat)) {
              const valStr = String(v || '').trim();
              if (valStr && (valStr.endsWith('.jpg') || valStr.endsWith('.jpeg') || valStr.endsWith('.png'))) {
                return valStr;
              }
            }
            return '';
          };
          const imageFilename = findImage();
          const imageUrl = imageFilename ? `/api/odk/image?v=4&projectId=12&formId=1.%20Fingerlings%20Release&submissionId=${encodeURIComponent(submissionId)}&filename=${encodeURIComponent(imageFilename)}` : '';

          return {
            ...item,
            flat,
            submissionId,
            district,
            block,
            gp,
            village,
            farmerName,
            quantity: isNaN(quantity) ? 0 : quantity,
            catlaQty,
            ragandiQty,
            mosuQty,
            bangaruQty,
            grasscarpQty,
            othersQty,
            species,
            releaseDate,
            year,
            submitterName,
            imageFilename,
            imageUrl
          };
        });

          // Exclude other districts like Dumbiriguda / Alluri Sitharama Raju, but keep Manyam and other records to prevent blank dashboard
          const manyamData = parsed.filter(item => {
            const dist = (item.district || '').toLowerCase();
            if (dist.includes('dumbiriguda') || dist.includes('alluri')) return false;
            return true;
          });

          setData(manyamData);
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
    const years = new Set<string>();
    const submitters = new Set<string>();

    data.forEach(item => {
      if (item.block !== 'Unknown') blocks.add(item.block);
      if (item.gp !== 'Unknown') gps.add(item.gp);
      if (item.village !== 'Unknown') villages.add(item.village);
      if (item.year && item.year !== 'Unknown') years.add(item.year);
      if (item.submitterName !== 'Unknown') submitters.add(item.submitterName);
    });

    return {
      blocks: Array.from(blocks).sort(),
      gps: Array.from(gps).sort(),
      villages: Array.from(villages).sort(),
      years: Array.from(years).sort().reverse(),
      submitters: Array.from(submitters).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
    };
  }, [data]);

  // Filter Data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (selectedBlock !== 'All' && item.block !== selectedBlock) return false;
      if (selectedGp !== 'All' && item.gp !== selectedGp) return false;
      if (selectedVillage !== 'All' && item.village !== selectedVillage) return false;
      if (selectedYear !== 'All' && item.year !== selectedYear) return false;
      if (selectedSubmitters.length > 0 && !selectedSubmitters.includes(item.submitterName)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = 
          item.farmerName.toLowerCase().includes(q) ||
          item.village.toLowerCase().includes(q) ||
          item.block.toLowerCase().includes(q) ||
          item.species.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [data, selectedBlock, selectedGp, selectedVillage, selectedYear, selectedSubmitters, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    let totalReleases = filteredData.length;
    let totalFingerlings = 0;
    const blockCount: Record<string, number> = {};
    const varietyCount: Record<string, number> = {
      'Catla': 0,
      'Ragandi': 0,
      'Mosu': 0,
      'Bangaru Papa': 0,
      'Grasscarp': 0,
      'Others': 0,
    };

    const getBlockCluster = (blockName: string) => {
      const b = (blockName || '').toLowerCase();
      if (b.includes('kurupam') || b.includes('komarada')) return 'Cluster 1 (Kurupam/Komarada)';
      if (b.includes('jiyyam') || b.includes('gl puram') || b.includes('g.l. puram')) return 'Cluster 2 (Jiyyammavalasa/GLP)';
      if (b.includes('gumma') || b.includes('parvathi')) return 'Cluster 3 (Gummalakshmipuram/Parvathipuram)';
      if (b.includes('salur') || b.includes('seetha') || b.includes('mentada') || b.includes('makkuva')) return 'Cluster 4 (Salur/Seethanagaram)';
      return 'Cluster 1 (Kurupam/Komarada)';
    };

    const clusterMap: Record<string, { target: number, achievement: number, blocks: Set<string> }> = {
      'Cluster 1 (Kurupam/Komarada)': { target: 25000, achievement: 0, blocks: new Set() },
      'Cluster 2 (Jiyyammavalasa/GLP)': { target: 30000, achievement: 0, blocks: new Set() },
      'Cluster 3 (Gummalakshmipuram/Parvathipuram)': { target: 35000, achievement: 0, blocks: new Set() },
      'Cluster 4 (Salur/Seethanagaram)': { target: 28000, achievement: 0, blocks: new Set() },
    };

    filteredData.forEach(item => {
      totalFingerlings += item.quantity;
      blockCount[item.block] = (blockCount[item.block] || 0) + item.quantity;
      varietyCount['Catla'] += item.catlaQty;
      varietyCount['Ragandi'] += item.ragandiQty;
      varietyCount['Mosu'] += item.mosuQty;
      varietyCount['Bangaru Papa'] += item.bangaruQty;
      varietyCount['Grasscarp'] += item.grasscarpQty;
      varietyCount['Others'] += item.othersQty;

      const cluster = getBlockCluster(item.block);
      item.cluster = cluster;
      if (!clusterMap[cluster]) {
        clusterMap[cluster] = { target: 25000, achievement: 0, blocks: new Set() };
      }
      clusterMap[cluster].achievement += item.quantity;
      if (item.block !== 'Unknown') clusterMap[cluster].blocks.add(item.block);
    });

    const varietyData = Object.entries(varietyCount).map(([name, value]) => ({ name, value }));
    const clusterData = Object.entries(clusterMap).map(([name, data]) => ({
      name,
      target: data.target,
      achievement: data.achievement,
      percentage: data.target > 0 ? Math.round((data.achievement / data.target) * 100) : 0,
      blocks: Array.from(data.blocks).join(', ') || 'Various'
    }));

    return {
      totalReleases,
      totalFingerlings,
      blockData: Object.entries(blockCount).map(([name, value]) => ({ name, value })),
      varietyData,
      clusterData
    };
  }, [filteredData]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ['Farmer Name', 'District', 'Block', 'GP', 'Village', 'Catla', 'Ragandi', 'Mosu', 'Bangaru Papa', 'Grasscarp', 'Others', 'Total Fingerlings', 'Release Date', 'Year', 'Submitter'];
    const rows = filteredData.map(item => [
      `"${item.farmerName}"`,
      `"${item.district}"`,
      `"${item.block}"`,
      `"${item.gp}"`,
      `"${item.village}"`,
      item.catlaQty,
      item.ragandiQty,
      item.mosuQty,
      item.bangaruQty,
      item.grasscarpQty,
      item.othersQty,
      item.quantity,
      `"${item.releaseDate}"`,
      `"${item.year}"`,
      `"${item.submitterName}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `manyam_fingerlings_release_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] bg-slate-50/50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Loading Fingerlings Release Data (Manyam District)</h2>
        <p className="text-slate-500 mt-2">Fetching records from ODK Central (Project 12)...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <Info className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-red-800 mb-2">Failed to load fingerlings data</h2>
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

  const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#14b8a6', '#f59e0b', '#10b981'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Fish className="w-6 h-6 text-blue-600" />
              Fingerlings Release Dashboard (Manyam District)
            </h1>
            <p className="text-slate-500 text-sm mt-1">Rainfed Fisheries - Fingerlings Distribution & Release Tracking</p>
          </div>
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm flex items-center gap-2 self-start md:self-auto text-sm"
          >
            <Download className="w-4 h-4" /> Export Filtered Data
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700 mr-2">Filters:</span>
          
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-blue-500 min-w-[120px]"
          >
            <option value="All">Year: All</option>
            {filterOptions.years.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

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

          <div className="relative ml-auto">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text" 
              placeholder="Search farmer, village..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Release Records</p>
            <h3 className="text-3xl font-bold text-slate-800">{stats.totalReleases}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Waves className="w-6 h-6" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Fingerlings Released</p>
            <h3 className="text-3xl font-bold text-slate-800">{stats.totalFingerlings.toLocaleString()} <span className="text-sm font-medium text-slate-500 normal-case">units</span></h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <Fish className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpandableChartBox title="Fingerlings Distributed by Block" className="p-4 h-[320px]">
          {stats.blockData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.blockData} margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" angle={-15} textAnchor="end" tick={{ fontSize: 11 }} height={40} />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-400">No data available for selected filters</div>
          )}
        </ExpandableChartBox>
        
        <ExpandableChartBox title="Variety-wise Distribution (Pie Chart)" className="p-4 h-[320px]">
          {stats.varietyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.varietyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label>
                  {stats.varietyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center text-slate-400">No data available for selected filters</div>
          )}
        </ExpandableChartBox>
      </div>

      {/* Cluster-wise Target vs Achievement */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Cluster-wise Target vs Achievement (Fingerlings Release)
            </h2>
            <p className="text-slate-500 text-sm">Comparing planned targets against actual fingerlings released across Manyam district clusters.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <ExpandableChartBox title="Cluster Target vs Achievement (Bar Chart)" className="p-4 h-[300px]">
            {stats.clusterData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.clusterData} margin={{ top: 10, right: 30, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" angle={-10} textAnchor="end" tick={{ fontSize: 10 }} height={40} />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="target" name="Target" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={25} />
                  <Bar dataKey="achievement" name="Achievement" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No cluster data available</div>
            )}
          </ExpandableChartBox>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="p-3">Cluster</th>
                  <th className="p-3 text-right">Target</th>
                  <th className="p-3 text-right">Achievement</th>
                  <th className="p-3 text-right">% Achieved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.clusterData.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{c.name}</div>
                      <div className="text-xs text-slate-400 truncate max-w-[200px]" title={c.blocks}>Blocks: {c.blocks}</div>
                    </td>
                    <td className="p-3 text-right font-medium text-slate-600">{c.target.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-blue-600">{c.achievement.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <span className={cn(
                        "inline-block px-2.5 py-1 rounded-full text-xs font-bold",
                        c.percentage >= 100 ? "bg-emerald-100 text-emerald-800" : c.percentage >= 70 ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                      )}>
                        {c.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-800">Fingerlings Release Records (Manyam District)</h2>
          <span className="text-sm font-medium text-slate-500">{filteredData.length} entries</span>
        </div>
        
        {filteredData.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No matching fingerlings release records found. Try adjusting your filters.
          </div>
        ) : (
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
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                    {item.quantity} units
                  </span>
                </div>
                
                <div className="space-y-1.5 text-xs text-slate-600 mb-2 bg-slate-50 p-2.5 rounded border border-slate-100">
                  <div className="font-semibold text-slate-700 mb-1">Variety Breakdown:</div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    <div>Catla: <span className="font-semibold text-slate-800">{item.catlaQty}</span></div>
                    <div>Ragandi: <span className="font-semibold text-slate-800">{item.ragandiQty}</span></div>
                    <div>Mosu: <span className="font-semibold text-slate-800">{item.mosuQty}</span></div>
                    <div>Bangaru Papa: <span className="font-semibold text-slate-800">{item.bangaruQty}</span></div>
                    <div>Grasscarp: <span className="font-semibold text-slate-800">{item.grasscarpQty}</span></div>
                    <div>Others: <span className="font-semibold text-slate-800">{item.othersQty}</span></div>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-slate-600 mb-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Release Date:</span>
                    <span className="font-medium text-slate-700">{item.releaseDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Year:</span>
                    <span className="font-medium text-slate-700">{item.year}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-2 mt-2">
                    <span className="text-slate-400">Submitted By:</span>
                    <span className="font-medium text-slate-700">{item.submitterName}</span>
                  </div>
                </div>

                {item.imageUrl ? (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div 
                      onClick={() => setPreviewImage(item.imageUrl)}
                      className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100 h-36 flex items-center justify-center"
                    >
                      <img 
                        src={item.imageUrl} 
                        alt="Release Photo" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                        <ZoomIn className="w-4 h-4" /> Click to view photo
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="w-full h-20 rounded-lg border border-slate-200 border-dashed bg-slate-50 flex items-center justify-center text-slate-400 text-xs">
                      No Photo Available
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
