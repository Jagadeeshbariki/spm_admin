import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, MapPin, Database, Loader2, Download, User as UserIcon, ChevronRight, X, Phone, Fingerprint, Info, RefreshCw, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { useAuth } from '../../lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { fetchWithFallback } from '../../lib/api';

const REGION_SPREADSHEETS = {
  'Veeraghattam': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTxKXjBmGYclZfGzh11pzGexNZBZRm1G1XyyLXbGhtsAjW4M80fh_QWoejOVV3JecYZ0tSQAHVGWqud/pub?gid=143167692&single=true&output=csv',
  'Seethampeta': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTxKXjBmGYclZfGzh11pzGexNZBZRm1G1XyyLXbGhtsAjW4M80fh_QWoejOVV3JecYZ0tSQAHVGWqud/pub?gid=1555182794&single=true&output=csv',
  'Bhamini': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTxKXjBmGYclZfGzh11pzGexNZBZRm1G1XyyLXbGhtsAjW4M80fh_QWoejOVV3JecYZ0tSQAHVGWqud/pub?gid=1014644263&single=true&output=csv'
};

export default function IdExplorer() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedGP, setSelectedGP] = useState<string>('All');
  const [selectedVillage, setSelectedVillage] = useState<string>('All');
  const [selectedHousehold, setSelectedHousehold] = useState<any | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [displayLimit, setDisplayLimit] = useState<number>(50);
  const [benIdToOldIdsMap, setBenIdToOldIdsMap] = useState<Record<string, { oldIds: string[], phone: string, category: string }>>({});

  const canSeeAll = user?.role === 'Admin' || 
                    user?.role === 'TL' || 
                    user?.role === 'CC' || 
                    String(user?.region).toLowerCase() === 'all';

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(inputValue);
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const loadData = async () => {
    setLoading(true);
    setDebugInfo('');
    try {
      let regionsToFetch: string[] = [];
      
      const debugLogs: string[] = [`User Region: ${user?.region}`, `User Role: ${user?.role}`];

      if (canSeeAll) {
        regionsToFetch = Object.keys(REGION_SPREADSHEETS);
        debugLogs.push('Full access mode: Fetching all regions');
      } else if (user?.region) {
        const userRegion = String(user.region).trim().toLowerCase();
        const matchedRegion = Object.keys(REGION_SPREADSHEETS).find(
          key => key.toLowerCase() === userRegion
        );
        if (matchedRegion) {
          regionsToFetch = [matchedRegion];
          setSelectedRegion(matchedRegion);
          debugLogs.push(`Matched Region: ${matchedRegion}`);
        } else {
          debugLogs.push(`No match for region: "${userRegion}" in [${Object.keys(REGION_SPREADSHEETS).join(', ')}]`);
        }
      } else {
        debugLogs.push('No region assigned to user');
      }

      setDebugInfo(debugLogs.join(' | '));

      if (regionsToFetch.length === 0 && !canSeeAll) {
        setData([]);
        setLoading(false);
        return;
      }

      const allData: any[] = [];
      
      for (const region of regionsToFetch) {
        const url = REGION_SPREADSHEETS[region as keyof typeof REGION_SPREADSHEETS];
        if (!url) continue;

        try {
          // Use fetchWithFallback to handle CORS issues if they arise
          const response = await fetchWithFallback(url);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const csvText = await response.text();
          
          // Basic check if we got HTML instead of CSV (common with Google Sheets login/error pages)
          if (csvText.includes('<!DOCTYPE html>') || csvText.includes('<html')) {
            console.warn(`Got HTML instead of CSV for region ${region}. Check if the sheet is "Published to the web" correctly.`);
            continue;
          }

          const parsed = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim()
          });

          if (parsed.data && parsed.data.length > 0) {
            const regionData = parsed.data.map((row: any) => ({
              ...row,
              Region: region
            }));
            allData.push(...regionData);
          }
        } catch (err) {
          console.error(`Failed to fetch data for region ${region}:`, err);
        }
      }

      // Fetch Old-to-New ID Map
      try {
        const mappingUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTOv15M_GF_4uJvmS3xcz3x89E25JNj22tewJ8O6323XYmurKukYPE-Km91ASul1w/pub?gid=1540773827&single=true&output=csv';
        const response = await fetchWithFallback(mappingUrl);
        if (response.ok) {
          const csvText = await response.text();
          const parsed = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim()
          });
          
          if (parsed.data && parsed.data.length > 0) {
            const tempMap: Record<string, { oldIds: string[], phone: string, category: string }> = {};
            parsed.data.forEach((row: any) => {
              const oldId = String(row.Old_id || row['Old_id'] || '').trim().toLowerCase();
              const benId = String(row.Ben_id || row['Ben_id'] || row.ben_id || row['ben_id'] || '').trim().toLowerCase();
              const phone = String(row.phone_number || row['phone_number'] || '').trim();
              const category = String(row.Category || row['Category'] || '').trim();

              if (oldId && benId) {
                if (!tempMap[benId]) tempMap[benId] = { oldIds: [], phone: '', category: '' };
                if (!tempMap[benId].oldIds.includes(oldId)) {
                  tempMap[benId].oldIds.push(oldId);
                }
                if (phone && !tempMap[benId].phone) tempMap[benId].phone = phone;
                if (category && !tempMap[benId].category) tempMap[benId].category = category;
              }
            });
            setBenIdToOldIdsMap(tempMap);
          }
        }
      } catch (err) {
        console.error('Failed to fetch Old ID mapping:', err);
      }

      setData(allData);
      if (allData.length > 0) {
        toast.success(`Loaded ${allData.length} records successfully`);
      } else if (regionsToFetch.length > 0) {
        toast.error('Fetched successfully but found 0 records. Check CSV formatting.');
      }
    } catch (error) {
      console.error('Error loading ID data:', error);
      toast.error('Failed to load data. Please check your region access.');
    } finally {
      setLoading(false);
    }
  };

  const gps = useMemo(() => {
    const filteredByRegion = selectedRegion === 'All' 
      ? data 
      : data.filter(item => item.Region === selectedRegion);
    const uniqueGPs = Array.from(new Set(filteredByRegion.map(item => item.gp || item.GP || item['Gram Panchayat']).filter(Boolean)));
    return ['All', ...uniqueGPs.sort()];
  }, [data, selectedRegion]);

  const villages = useMemo(() => {
    const filteredByRegion = selectedRegion === 'All' 
      ? data 
      : data.filter(item => item.Region === selectedRegion);
    const filteredByGP = selectedGP === 'All' 
      ? filteredByRegion 
      : filteredByRegion.filter(item => (item.gp || item.GP || item['Gram Panchayat']) === selectedGP);
    const uniqueVillages = Array.from(new Set(filteredByGP.map(item => item.village || item.Village).filter(Boolean)));
    return ['All', ...uniqueVillages.sort()];
  }, [data, selectedRegion, selectedGP]);

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const searchLower = searchTerm.toLowerCase().trim();

    return data.filter(item => {
      const name = String(item.farmer_name || item['Farmer Name'] || '').toLowerCase();
      const aadhar = String(item['Adhar Number'] || item['Aadhar Number'] || '').toLowerCase().trim();
      const id = String(item.farmer_ID || item['Farmer ID'] || '').toLowerCase();

      // Check if this aadhar matches any old ID the user might be searching for
      const oldDataForAadhar = benIdToOldIdsMap[aadhar];
      const matchesMappedBenId = oldDataForAadhar?.oldIds?.some(oldId => oldId.includes(searchLower));

      const matchesSearch = !searchLower || 
        name.includes(searchLower) || 
        aadhar.includes(searchLower) || 
        id.includes(searchLower) ||
        matchesMappedBenId;
      
      const matchesRegion = selectedRegion === 'All' || item.Region === selectedRegion;
      const gpValue = item.gp || item.GP || item['Gram Panchayat'];
      const matchesGP = selectedGP === 'All' || gpValue === selectedGP;
      const villageValue = item.village || item.Village;
      const matchesVillage = selectedVillage === 'All' || villageValue === selectedVillage;

      return matchesSearch && matchesRegion && matchesGP && matchesVillage;
    });
  }, [data, searchTerm, selectedRegion, selectedGP, selectedVillage, benIdToOldIdsMap]);

  // Reset display limit when filter changes
  useEffect(() => {
    setDisplayLimit(50);
  }, [searchTerm, selectedRegion, selectedGP, selectedVillage]);

  const displayedData = filteredData.slice(0, displayLimit);

  const handleExport = () => {
    if (filteredData.length === 0) {
      toast.error('No data to export');
      return;
    }
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Id_Explorer_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">ID Explorer</h1>
          <p className="text-sm text-slate-500">Search and view household records</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-sm text-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Name, Aadhar, Old ID..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>

          {canSeeAll && (
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <MapPin className="w-4 h-4 text-slate-400 mr-2" />
              <select 
                className="bg-transparent border-none outline-none text-sm text-slate-600 w-full"
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setSelectedGP('All');
                  setSelectedVillage('All');
                }}
              >
                <option value="All">All Regions</option>
                {Object.keys(REGION_SPREADSHEETS).map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400 mr-2" />
            <select 
              className="bg-transparent border-none outline-none text-sm text-slate-600 w-full"
              value={selectedGP}
              onChange={(e) => {
                setSelectedGP(e.target.value);
                setSelectedVillage('All');
              }}
            >
              <option value="All">All GP</option>
              {gps.filter(gp => gp !== 'All').map(gp => (
                <option key={gp} value={gp}>{gp}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Filter className="w-4 h-4 text-slate-400 mr-2" />
            <select 
              className="bg-transparent border-none outline-none text-sm text-slate-600 w-full"
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
            >
              <option value="All">All Village</option>
              {villages.filter(v => v !== 'All').map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              {loading ? 'Refreshing...' : `Found ${filteredData.length} Records`}
            </p>
            {canSeeAll && debugInfo && (
              <div className="group relative">
                <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                <div className="absolute left-0 top-6 hidden group-hover:block bg-slate-800 text-white text-[10px] p-2 rounded shadow-lg z-20 whitespace-normal min-w-[200px]">
                  {debugInfo}
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-slate-500 font-medium">Loading household data...</p>
            </div>
          ) : displayedData.length === 0 ? (
            <div className="col-span-full py-12 px-6 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Database className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-slate-900 font-bold text-lg mb-2">No records visible</h3>
              <p className="text-slate-500 max-w-sm mx-auto text-sm mb-6">
                {data.length === 0 
                  ? "We couldn't fetch any data from the regions assigned to you. Try logging out and back in if your permissions were recently updated."
                  : "No records match your current search or filter criteria. Try clearing filters."}
              </p>
              {!canSeeAll && data.length === 0 && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3 text-left max-w-md mx-auto">
                  <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-amber-900 font-bold text-xs uppercase mb-1">Region Mismatch</p>
                    <p className="text-amber-800 text-xs">
                      Your profile shows region <strong>"{user?.region || 'None'}"</strong>. 
                      Make sure this name exactly matches one of: Veeraghattam, Seethampeta, or Bhamini in the database.
                    </p>
                  </div>
                </div>
              )}
              {data.length > 0 && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedGP('All');
                    setSelectedVillage('All');
                  }}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-sm"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {displayedData.map((row, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => setSelectedHousehold(row)}
                >
                  <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-slate-100 rounded-lg text-slate-500">
                    {row.Region}
                  </span>
                </div>
                
                <h3 className="font-bold text-slate-900 text-lg mb-1 line-clamp-1">
                  {row.farmer_name || row['Farmer Name'] || 'Unknown Name'}
                </h3>
                
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center text-sm text-slate-500">
                    <span className="w-20 font-medium text-slate-400">Father/Hus:</span>
                    <span className="truncate">{row.father_husband_name || row['Father/Husband Name'] || '-'}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-500">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                    <span className="truncate">{row.village || row.Village || '-'}</span>
                  </div>
                  <div className="flex items-start text-sm text-slate-500 mt-2">
                    <Fingerprint className="w-3.5 h-3.5 mr-1.5 mt-0.5 text-slate-400 shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-slate-700">ID: {row.farmer_ID || row['Farmer ID'] || row['Adhar Number'] || 'N/A'}</span>
                      {benIdToOldIdsMap[String(row['Adhar Number'] || row['Aadhar Number']).toLowerCase().trim()]?.oldIds?.length > 0 && (
                        <span className="text-xs text-slate-400 font-mono">Old ID: {benIdToOldIdsMap[String(row['Adhar Number'] || row['Aadhar Number']).toLowerCase().trim()].oldIds.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-50 flex justify-end">
                  <div className="flex items-center text-blue-600 text-xs font-bold gap-1">
                    <span>View More</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
                </div>
              ))}
              {filteredData.length > displayLimit && (
                <div className="col-span-full flex justify-center mt-6">
                  <button
                    onClick={() => setDisplayLimit(prev => prev + 50)}
                    className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold shadow-sm transition-colors"
                  >
                    Load More ({filteredData.length - displayLimit} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedHousehold && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="bg-slate-900 p-6 text-white relative">
                <button 
                  onClick={() => setSelectedHousehold(null)}
                  className="absolute right-4 top-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center">
                    <UserIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedHousehold.farmer_name || selectedHousehold['Farmer Name']}</h2>
                    <p className="text-blue-200 text-sm">{selectedHousehold.Region} Region • {selectedHousehold.village || selectedHousehold.Village}</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                  <DetailItem icon={<UserIcon className="w-4 h-4"/>} label="Father/Husband" value={selectedHousehold.father_husband_name || selectedHousehold['Father/Husband Name']} />
                  <DetailItem icon={<Fingerprint className="w-4 h-4"/>} label="Aadhar Number" value={selectedHousehold['Adhar Number'] || selectedHousehold['Aadhar Number']} />
                  
                  <DetailItem icon={<Fingerprint className="w-4 h-4"/>} label="Farmer ID (New)" value={selectedHousehold.farmer_ID || selectedHousehold['Farmer ID'] || selectedHousehold['Adhar Number']} />
                  <DetailItem icon={<Fingerprint className="w-4 h-4"/>} label="Old ID" value={benIdToOldIdsMap[String(selectedHousehold['Adhar Number'] || selectedHousehold['Aadhar Number']).toLowerCase().trim()]?.oldIds?.join(', ')} />
                  
                  <DetailItem icon={<Phone className="w-4 h-4"/>} label="Phone" value={selectedHousehold.phone_number || selectedHousehold['Phone Number'] || benIdToOldIdsMap[String(selectedHousehold['Adhar Number'] || selectedHousehold['Aadhar Number']).toLowerCase().trim()]?.phone} />
                  <DetailItem icon={<Info className="w-4 h-4"/>} label="Age / Gender" value={`${selectedHousehold.age || '-'} / ${selectedHousehold.gender || '-'}`} />
                  <DetailItem icon={<Database className="w-4 h-4"/>} label="Category" value={selectedHousehold.category || selectedHousehold.Category || benIdToOldIdsMap[String(selectedHousehold['Adhar Number'] || selectedHousehold['Aadhar Number']).toLowerCase().trim()]?.category} />
                  <DetailItem icon={<Filter className="w-4 h-4"/>} label="Sub Classification" value={selectedHousehold.sub_classification} />
                  <DetailItem icon={<MapPin className="w-4 h-4"/>} label="Gram Panchayat (GP)" value={selectedHousehold.gp || selectedHousehold.GP || selectedHousehold['Gram Panchayat']} />
                  <DetailItem icon={<MapPin className="w-4 h-4"/>} label="Village CD" value={selectedHousehold['vill-cd']} />
                  <div className="col-span-2 border-t border-slate-100 pt-6 mt-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Location Hierarchy</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">Block</p>
                        <p className="text-xs font-medium text-slate-700">{selectedHousehold['sub_district/block'] || '-'}</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">District</p>
                        <p className="text-xs font-medium text-slate-700">{selectedHousehold.District || '-'}</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">State</p>
                        <p className="text-xs font-medium text-slate-700">{selectedHousehold.State || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setSelectedHousehold(null)}
                  className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors"
                >
                  Close Explorer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: any }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
        <span className="mr-1.5">{icon}</span>
        {label}
      </div>
      <p className="text-sm font-semibold text-slate-800">{value || '-'}</p>
    </div>
  );
}

