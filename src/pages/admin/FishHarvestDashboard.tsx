import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Filter, Search, Loader2, MapPin, Database, ChevronDown, Activity, Info, ExternalLink, X, ZoomIn, Anchor, Waves, Download, Fish, Calendar, Scale } from 'lucide-react';
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

export default function FishHarvestDashboard() {
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
        // Project ID 12, Form ID: 5. Harvesting
        const res = await fetch('/api/odk/data?projectId=12&formId=5.%20Harvesting');
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
          
          // Varieties / Quantities for harvest
          const catlaQty = findNumeric(['catla_qty', 'catla', 'catla_weight']) || 0;
          const ragandiQty = findNumeric(['ragandi_qty', 'ragandi', 'ragandi_weight']) || 0;
          const mosuQty = findNumeric(['mosu_qty', 'mosu', 'mosu_weight']) || 0;
          const bangaruQty = findNumeric(['bangaru_papa_qty', 'bangaru_papa', 'bangaru']) || 0;
          const grasscarpQty = findNumeric(['grasscarp_qty', 'grasscarp']) || 0;
          const othersQty = findNumeric(['others_qty', 'others']) || 0;

          const totalHarvested = findNumeric(['harvest-fisheries_harvested_this_month_kgs', 'fisheries_harvested_this_month_kgs', 'total_harvest', 'harvest_qty', 'quantity_harvested', 'weight_harvested', 'total_quantity', 'qty_harvested']);
          const varietySum = catlaQty + ragandiQty + mosuQty + bangaruQty + grasscarpQty + othersQty;
          const quantity = totalHarvested > 0 ? totalHarvested : (varietySum > 0 ? varietySum : findNumeric(['count', 'quantity', 'number', 'nos', 'qty', 'weight']) || 0);

          const species = findKey(['species']) || findKey(['fish']) || (varietySum > 0 ? 'Multi-Variety' : 'Mixed / Other');
          const harvestDate = findKey(['harvest-date_harvested', 'date_harvested', 'harvest_date', 'date']) || findKey(['time']) || '-';

          // Extract Year
          let year = findKey(['year']) || '';
          if (year.length < 4 && harvestDate && harvestDate !== '-') {
            const parsedDate = new Date(harvestDate);
            if (!isNaN(parsedDate.getTime())) {
              year = String(parsedDate.getFullYear());
            } else {
              const match = harvestDate.match(/\b(20\d{2}|19\d{2})\b/);
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
          const imageUrl = imageFilename ? `/api/odk/image?v=4&projectId=12&formId=5.%20Harvesting&submissionId=${encodeURIComponent(submissionId)}&filename=${encodeURIComponent(imageFilename)}` : '';

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
            harvestDate,
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
    let totalHarvests = filteredData.length;
    let totalHarvestQty = 0;
    const blockCount: Record<string, number> = {};
    const varietyCount: Record<string, number> = {
      'Catla': 0,
      'Ragandi': 0,
      'Mosu': 0,
      'Bangaru Papa': 0,
      'Grasscarp': 0,
      'Others': 0,
    };

    filteredData.forEach(item => {
      totalHarvestQty += item.quantity;
      blockCount[item.block] = (blockCount[item.block] || 0) + item.quantity;
      varietyCount['Catla'] += item.catlaQty;
      varietyCount['Ragandi'] += item.ragandiQty;
      varietyCount['Mosu'] += item.mosuQty;
      varietyCount['Bangaru Papa'] += item.bangaruQty;
      varietyCount['Grasscarp'] += item.grasscarpQty;
      varietyCount['Others'] += item.othersQty;
    });

    const varietyData = Object.entries(varietyCount).map(([name, value]) => ({ name, value }));

    return {
      totalHarvests,
      totalHarvestQty,
      blockData: Object.entries(blockCount).map(([name, value]) => ({ name, value })),
      varietyData
    };
  }, [filteredData]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ['Farmer Name', 'District', 'Block', 'GP', 'Village', 'Catla', 'Ragandi', 'Mosu', 'Bangaru Papa', 'Grasscarp', 'Others', 'Total Harvest Qty', 'Harvest Date', 'Year', 'Submitter'];
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
      `"${item.harvestDate}"`,
      `"${item.year}"`,
      `"${item.submitterName}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `manyam_fish_harvest_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] bg-slate-50/50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Loading Fish Harvest Data (Manyam District)</h2>
        <p className="text-slate-500 mt-2">Fetching records from ODK Central (Project 12 - Harvesting)...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <Info className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-red-800 mb-2">Failed to load fish harvest data</h2>
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
              <Anchor className="w-6 h-6 text-blue-600" />
              Fish Harvest Dashboard (Manyam District)
            </h1>
            <p className="text-slate-500 text-sm mt-1">Rainfed Fisheries - Fish Harvesting & Production Tracking</p>
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
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Years</option>
            {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <select 
            value={selectedBlock}
            onChange={(e) => { setSelectedBlock(e.target.value); setSelectedGp('All'); setSelectedVillage('All'); }}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Blocks</option>
            {filterOptions.blocks.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select 
            value={selectedGp}
            onChange={(e) => { setSelectedGp(e.target.value); setSelectedVillage('All'); }}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All GPs</option>
            {filterOptions.gps.map(gp => <option key={gp} value={gp}>{gp}</option>)}
          </select>

          <select 
            value={selectedVillage}
            onChange={(e) => setSelectedVillage(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Villages</option>
            {filterOptions.villages.map(v => <option key={v} value={v}>{v}</option>)}
          </select>

          <MultiSelect 
            label="Submitters"
            options={filterOptions.submitters}
            selected={selectedSubmitters}
            onChange={setSelectedSubmitters}
          />

          {(selectedBlock !== 'All' || selectedGp !== 'All' || selectedVillage !== 'All' || selectedYear !== 'All' || selectedSubmitters.length > 0 || searchQuery) && (
            <button 
              onClick={() => { setSelectedBlock('All'); setSelectedGp('All'); setSelectedVillage('All'); setSelectedYear('All'); setSelectedSubmitters([]); setSearchQuery(''); }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold ml-auto underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by farmer name, village, block, or species..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Harvest Records</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.totalHarvests}</h3>
            <p className="text-xs text-slate-500 mt-1">Filtered harvesting entries</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Anchor className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Fish Harvest Qty / Weight (KG)</p>
            <h3 className="text-3xl font-bold text-emerald-600 mt-1">{stats.totalHarvestQty.toLocaleString()} <span className="text-lg font-normal text-slate-500">KG</span></h3>
            <p className="text-xs text-slate-500 mt-1">Total quantity in kilograms harvested</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Scale className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Block Wise Harvest */}
        <ExpandableChartBox title="Harvest Quantity (KG) by Block">
          {stats.blockData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.blockData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} height={40} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: any) => [Number(val).toLocaleString() + ' KG', 'Harvest Qty']}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ExpandableChartBox>

        {/* Variety Wise Pie Chart */}
        <ExpandableChartBox title="Variety Wise Fish Harvest Share (KG)">
          {stats.varietyData.every(d => d.value === 0) ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No variety breakdown available</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={stats.varietyData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {stats.varietyData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(val: any) => [Number(val).toLocaleString() + ' KG', 'Quantity']} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ExpandableChartBox>
      </div>

      {/* Individual Records List / Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Fish className="w-5 h-5 text-blue-600" />
            Individual Harvest Records ({filteredData.length})
          </h2>
          <span className="text-xs text-slate-400">Showing Manyam District entries</span>
        </div>

        {filteredData.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
            No matching fish harvest records found. Try adjusting your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.map((item, idx) => (
              <div key={item.submissionId || idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-slate-800 text-base truncate" title={item.farmerName}>
                      {item.farmerName}
                    </h3>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full shrink-0">
                      {item.year}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm text-slate-600 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Harvest Date:</span>
                      <span className="font-medium text-slate-700">{item.harvestDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Village / GP:</span>
                      <span className="font-medium text-slate-700 truncate max-w-[160px]" title={`${item.village}, ${item.gp}`}>
                        {item.village}, {item.gp}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Block (Mandal):</span>
                      <span className="font-medium text-slate-700">{item.block}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Harvest Qty:</span>
                      <span className="font-bold text-emerald-600">{item.quantity.toLocaleString()} KG</span>
                    </div>
                  </div>

                  {/* Variety breakdown pills */}
                  <div className="flex flex-wrap gap-1 mb-3 pt-2 border-t border-slate-200 text-xs">
                    {item.catlaQty > 0 && <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded">Catla: {item.catlaQty} KG</span>}
                    {item.ragandiQty > 0 && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded">Ragandi: {item.ragandiQty} KG</span>}
                    {item.mosuQty > 0 && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded">Mosu: {item.mosuQty} KG</span>}
                    {item.bangaruQty > 0 && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded">Bangaru: {item.bangaruQty} KG</span>}
                    {item.grasscarpQty > 0 && <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded">Grasscarp: {item.grasscarpQty} KG</span>}
                    {item.othersQty > 0 && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded">Others: {item.othersQty} KG</span>}
                  </div>

                  {/* Image thumbnail if available */}
                  {item.imageUrl && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div 
                        onClick={() => setPreviewImage(item.imageUrl)}
                        className="relative group cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white h-24 flex items-center justify-center"
                      >
                        <img 
                          src={item.imageUrl} 
                          alt="Harvest Record" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1">
                          <ZoomIn className="w-4 h-4" /> View Image
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                  <span>Submitter: <strong className="text-slate-600">{item.submitterName}</strong></span>
                  <span className="font-mono text-[10px]">{item.district}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewImage} 
              alt="Harvest Full Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
}
