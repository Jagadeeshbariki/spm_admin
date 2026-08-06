import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Search, Loader2, Sprout, MapPin, Users, Database, ChevronDown, ChevronUp, Calendar, ArrowLeft, ArrowRight, Info, Layers, Activity, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';
import { cn } from '../../lib/utils';

export default function CropsDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedBlock, setSelectedBlock] = useState('All');
  const [selectedGp, setSelectedGp] = useState('All');
  const [selectedVillage, setSelectedVillage] = useState('All');
  const [selectedCropMode, setSelectedCropMode] = useState('All');
  const [hasActivities, setHasActivities] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedSeason, setSelectedSeason] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activeTab, setActiveTab] = useState<'overview' | 'frp'>('overview');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Pagination & Accordion
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | number | null>(null);
  const itemsPerPage = 20;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [regResponse, actResponse] = await Promise.all([
          fetch('/api/odk/data?formId=NF-%20Register'),
          fetch('/api/odk/data?formId=NF-%20Activities')
        ]);
        if (!regResponse.ok) {
          const regErrText = await regResponse.text();
          let errDetail = regErrText;
          try {
            const parsed = JSON.parse(regErrText);
            errDetail = parsed.details || parsed.error || regErrText;
          } catch (e) {}
          throw new Error(`Failed to fetch data from ODK Central (${regResponse.status}): ${errDetail}`);
        }
        let json, actJson;
        try {
          const regText = await regResponse.text();
          if (regText.trim().startsWith('<')) {
            throw new Error('API returned HTML instead of JSON. The backend server might not be running correctly on the hosted link.');
          }
          json = JSON.parse(regText);
          
          if (actResponse.ok) {
            const actText = await actResponse.text();
            actJson = actText.trim().startsWith('<') ? { value: [] } : JSON.parse(actText);
          } else {
            actJson = { value: [] };
          }
        } catch (e: any) {
          throw new Error('Failed to parse API response: ' + e.message);
        }
        const submissions = json.value || [];
        const activities = actJson.value || [];
        
        const flatten = (obj: any, prefix = ''): any => {
          return Object.keys(obj).reduce((acc: any, k: string) => {
            const pre = prefix.length ? prefix + '_' : '';
            if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
              Object.assign(acc, flatten(obj[k], pre + k));
            } else {
              acc[pre + k] = obj[k];
              if (acc[k] === undefined) acc[k] = obj[k]; // fallback for direct access
            }
            return acc;
          }, {});
        };

        const mappedData = submissions.map((sub: any) => {
          const flat = flatten(sub);
          
          const hhId = flat['plot_reg-farmer_Id'] || flat['plot_reg_farmer_Id'] || flat['farmer_Id'] || flat['HH_id'] || flat['HH_Id'] || flat['hh_id'] || flat['HH Id'] || flat['hhid'] || '';
          const farmerName = flat['farmer_name'] || flat['Farmer_Name'] || flat['name'] || flat['farmer'] || '';
          const season = flat['season'] || flat['Season'] || 'Unknown';
          const sowingDate = flat['sowing_date'] || flat['Sowing_Date'] || flat['date'] || '-';
          
          const matchedActivities = activities.filter((act: any) => {
            const pDetails = act.Primary_details || {};
            const actFarmer = String(pDetails.farmer_name || '').trim().toLowerCase();
            const actSeason = String(pDetails.season || pDetails.data_season || '').trim().toLowerCase();
            const actSowing = String(pDetails.sowing_date || '').trim();
            
            const f1 = String(hhId).trim().toLowerCase();
            const f2 = String(farmerName).trim().toLowerCase();
            
            const isFarmerMatch = actFarmer && (actFarmer === f1 || actFarmer === f2);
            const isSeasonMatch = actSeason === String(season).trim().toLowerCase();
            const isSowingMatch = actSowing === String(sowingDate).trim();
            
            return isFarmerMatch && isSeasonMatch && isSowingMatch;
          });

          let harvests: any[] = [];
          let bioInputs: any[] = [];
          
          matchedActivities.forEach((act: any) => {
            const flatAct = flatten(act);
            const actPhoto = act.gps?.photo || flatAct['gps_photo'] || flatAct['photo'] || act.photo;
            const actSubId = act.__id || act.meta?.instanceID?.replace('uuid:', '');
            
            if (act.harvesting && Array.isArray(act.harvesting)) {
              harvests.push(...act.harvesting.map((h: any) => ({ ...h, photo: actPhoto, submissionId: actSubId, formId: 'NF- Activities' })));
            }
            if (act.application_bio_input && Array.isArray(act.application_bio_input)) {
              bioInputs.push(...act.application_bio_input.map((b: any) => ({ ...b, photo: actPhoto, submissionId: actSubId, formId: 'NF- Activities' })));
            }
          });

          return {
            plotPhoto: flat['plot_reg_image'] || flat['image'] || flat['photo'],
            plotSubmissionId: sub.__id || sub.meta?.instanceID?.replace('uuid:', ''),
            plotFormId: 'NF- Register',
            block: flat['block'] || flat['Block'] || '',
            gp: flat['gp'] || flat['GP'] || flat['Gram_Panchayat'] || flat['gram_panchayat'] || '',
            village: flat['village'] || flat['Village'] || '',
            cropMode: flat['crop_mode'] || flat['crop_model'] || flat['plot_reg_crop_model'] || flat['plot_reg-crop_model'] || '',
            farmerName: flat['farmer_name'] || flat['Farmer_Name'] || flat['name'] || flat['farmer'] || '',
            hhId: flat['plot_reg-farmer_Id'] || flat['plot_reg_farmer_Id'] || flat['farmer_Id'] || flat['HH_id'] || flat['HH_Id'] || flat['hh_id'] || flat['HH Id'] || flat['hhid'] || '',
            year: (flat['text_year'] || flat['year'] || '').substring(0, 4) || 'Unknown',
            season: flat['season'] || flat['Season'] || 'Unknown',
            mainCrop: flat['main_crop'] || flat['Main_Crop'] || '-',
            interCrops: flat['inter_crops'] || flat['Inter_Crops'] || '-',
            sowingDate: flat['sowing_date'] || flat['Sowing_Date'] || flat['date'] || '-',
            area: flat['area_'] || flat['Area'] || flat['area'] || '-',
            harvests,
            bioInputs,
            raw: flat
          };
        });

        setData(mappedData);
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const { blocks, gps, villages, cropModes, years, seasons } = useMemo(() => {
    const bSet = new Set<string>();
    const gSet = new Set<string>();
    const vSet = new Set<string>();
    const cSet = new Set<string>();
    const ySet = new Set<string>();
    const sSet = new Set<string>();
    data.forEach(item => {
      if (item.block) bSet.add(item.block);
      if (item.gp) gSet.add(item.gp);
      if (item.village) vSet.add(item.village);
      if (item.cropMode) cSet.add(item.cropMode);
      if (item.year) ySet.add(item.year);
      if (item.season) sSet.add(item.season);
    });
    return { 
      blocks: Array.from(bSet).sort(), 
      gps: Array.from(gSet).sort(), 
      villages: Array.from(vSet).sort(), 
      cropModes: Array.from(cSet).sort(),
      years: Array.from(ySet).sort(),
      seasons: Array.from(sSet).sort()
    };
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (selectedBlock !== 'All' && item.block !== selectedBlock) return false;
      if (selectedGp !== 'All' && item.gp !== selectedGp) return false;
      if (selectedVillage !== 'All' && item.village !== selectedVillage) return false;
      if (selectedCropMode !== 'All' && item.cropMode !== selectedCropMode) return false;
      if (selectedYear !== 'All' && item.year !== selectedYear) return false;
      if (selectedSeason !== 'All' && item.season !== selectedSeason) return false;
      
      if (hasActivities === 'Yes') {
        if (item.bioInputs.length === 0 && item.harvests.length === 0) return false;
      } else if (hasActivities === 'No') {
        if (item.bioInputs.length > 0 || item.harvests.length > 0) return false;
      }
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const fName = String(item.farmerName).toLowerCase();
        const hh = String(item.hhId).toLowerCase();
        if (!fName.includes(term) && !hh.includes(term)) return false;
      }
      
      return true;
    });
  }, [data, selectedBlock, selectedGp, selectedVillage, selectedCropMode, hasActivities, selectedYear, selectedSeason, searchTerm]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBlock, selectedGp, selectedVillage, selectedCropMode, hasActivities, selectedYear, selectedSeason, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
          <p className="text-slate-600 font-medium">Fetching crop data from ODK Central...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-200 shadow-sm max-w-md w-full">
          <h2 className="font-bold text-lg mb-2">Error Loading Data</h2>
          <p className="text-sm opacity-90">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F7FA] min-h-[calc(100vh-64px)] -m-4 md:-m-8 p-4 md:p-6 font-sans text-slate-800 overflow-x-hidden">
      <div className="w-full flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-600" />
            Crops Dashboard
          </h1>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200 shrink-0">
            <Database className="w-4 h-4 text-emerald-500" />
            {filteredData.length} Records Found
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === 'overview' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            Overview Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('frp')}
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === 'frp' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            FRP Dashboard
          </button>
        </div>

        {/* Filters Panel */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
            <Filter className="w-5 h-5 text-slate-400" />
            <h2 className="font-bold text-slate-700">Filter Data</h2>
          </div>
          
          <div className="flex flex-nowrap overflow-x-auto gap-4 pb-2 snap-x custom-scrollbar">
            <FilterSelect 
              label="Year" 
              value={selectedYear} 
              onChange={setSelectedYear} 
              options={years} 
              className="min-w-[140px] shrink-0"
            />
            <FilterSelect 
              label="Season" 
              value={selectedSeason} 
              onChange={setSelectedSeason} 
              options={seasons} 
              className="min-w-[140px] shrink-0"
            />
            <FilterSelect 
              label="Block" 
              value={selectedBlock} 
              onChange={setSelectedBlock} 
              options={blocks} 
              className="min-w-[150px] shrink-0"
            />
            <FilterSelect 
              label="Gram Panchayat (GP)" 
              value={selectedGp} 
              onChange={setSelectedGp} 
              options={gps} 
              className="min-w-[160px] shrink-0"
            />
            <FilterSelect 
              label="Village" 
              value={selectedVillage} 
              onChange={setSelectedVillage} 
              options={villages} 
              className="min-w-[150px] shrink-0"
            />
            <FilterSelect 
              label="Crop Mode" 
              value={selectedCropMode} 
              onChange={setSelectedCropMode} 
              options={cropModes} 
              className="min-w-[150px] shrink-0"
            />
            <FilterSelect 
              label="Has Activities" 
              value={hasActivities} 
              onChange={setHasActivities} 
              options={['Yes', 'No']} 
              className="min-w-[140px] shrink-0"
            />
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by Farmer Name or HH ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            
            <div className="ml-auto w-full md:w-auto">
              {(selectedBlock !== 'All' || selectedGp !== 'All' || selectedVillage !== 'All' || selectedCropMode !== 'All' || hasActivities !== 'All' || selectedYear !== 'All' || selectedSeason !== 'All' || searchTerm !== '') && (
                <button
                  onClick={() => {
                    setSelectedBlock('All');
                    setSelectedGp('All');
                    setSelectedVillage('All');
                    setSelectedCropMode('All');
                    setHasActivities('All');
                    setSearchTerm('');
                  }}
                  className="w-full md:w-auto px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-col">
        {activeTab === 'overview' ? (
          <OverviewTab data={filteredData} />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="overflow-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
              <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 w-10"></th>
                  <th className="px-6 py-4">HH ID</th>
                  <th className="px-6 py-4">Farmer Name</th>
                  <th className="px-6 py-4">Crop Mode</th>
                  <th className="px-6 py-4">Village</th>
                  <th className="px-6 py-4">GP</th>
                  <th className="px-6 py-4">Block</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, idx) => {
                    const rowId = row.raw?.__id || idx;
                    const isExpanded = expandedRow === rowId;
                    return (
                      <React.Fragment key={rowId}>
                        <tr 
                          onClick={() => setExpandedRow(isExpanded ? null : rowId)}
                          className={cn(
                            "transition-colors group cursor-pointer",
                            isExpanded ? "bg-slate-50" : "hover:bg-slate-50"
                          )}
                        >
                          <td className="px-6 py-4 text-slate-400">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              {row.hhId || '-'}
                              {(row.bioInputs.length > 0 || row.harvests.length > 0) && (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold" title="Has Activities">
                                  {row.bioInputs.length + row.harvests.length}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700">{row.farmerName || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide",
                              row.cropMode 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            )}>
                              {row.cropMode || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {row.village || '-'}
                          </td>
                          <td className="px-6 py-4 text-slate-600">{row.gp || '-'}</td>
                          <td className="px-6 py-4 text-slate-600">{row.block || '-'}</td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={7} className="p-0 border-b border-slate-200 bg-slate-50/50">
                              <div className="px-16 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="space-y-1">
                                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date of Sowing</div>
                                  <div className="text-sm font-medium text-slate-900">{row.sowingDate}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Season</div>
                                  <div className="text-sm font-medium text-slate-900">{row.season}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Main Crop</div>
                                  <div className="text-sm font-medium text-slate-900">{row.mainCrop}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Sprout className="w-3.5 h-3.5" /> Inter Crops</div>
                                  <div className="text-sm font-medium text-slate-900">{row.interCrops}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Area</div>
                                  <div className="text-sm font-medium text-slate-900">{row.area}</div>
                                </div>
                              </div>
                              
                              {/* Activities Section */}
                              {(row.bioInputs.length > 0 || row.harvests.length > 0) && (
                                <div className="px-16 pb-6 pt-0 animate-in slide-in-from-top-2 duration-200">
                                  <div className="border-t border-slate-200 pt-6 mt-2">
                                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
                                      <span>Activities & Data</span>
                                      {row.plotPhoto && row.plotSubmissionId && (
                                        <button 
                                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            window.open(`/api/odk/image?submissionId=${encodeURIComponent(row.plotSubmissionId)}&filename=${encodeURIComponent(row.plotPhoto)}&formId=${encodeURIComponent(row.plotFormId)}`, '_blank');
                                          }}
                                        >
                                          <Sprout className="w-3 h-3" /> View Plot Photo
                                        </button>
                                      )}
                                    </h4>
                                    {row.plotPhoto && row.plotSubmissionId && (
                                      <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Plot Registration Photo</h5>
                                        <img onClick={(e) => { e.stopPropagation(); setPreviewImage(`/api/odk/image?submissionId=${encodeURIComponent(row.plotSubmissionId)}&filename=${encodeURIComponent(row.plotPhoto)}&formId=${encodeURIComponent(row.plotFormId)}`); }} src={`/api/odk/image?submissionId=${encodeURIComponent(row.plotSubmissionId)}&filename=${encodeURIComponent(row.plotPhoto)}&formId=${encodeURIComponent(row.plotFormId)}`} alt="Plot Registration" className="w-full max-w-sm h-48 object-cover rounded-lg shadow-sm border border-slate-300 cursor-pointer hover:opacity-90 transition-opacity" loading="lazy" />
                                      </div>
                                    )}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                      
                                      {/* Bio Inputs */}
                                      {row.bioInputs.length > 0 && (
                                        <div>
                                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Bio Inputs Applied</h5>
                                          <div className="space-y-3">
                                            {row.bioInputs.map((bi: any, i: number) => (
                                              <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                  <span className="font-semibold text-sm text-slate-800">{bi.inputs_applied || 'Unknown Input'}</span>
                                                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{bi.application_date_bio_input || '-'}</span>
                                                </div>
                                                <div className="text-sm text-slate-600 flex justify-between mb-2">
                                                  <span>Qty: {bi.Dhravajeevamrutham_Quantity || bi.qty || '-'} {bi.unit || ''}</span>
                                                  <span>Source: {bi.bioinputs_source || '-'}</span>
                                                </div>
                                                {bi.photo && bi.submissionId && (
                                                  <div className="mt-2">
                                                    <img onClick={(e) => { e.stopPropagation(); setPreviewImage(`/api/odk/image?submissionId=${encodeURIComponent(bi.submissionId)}&filename=${encodeURIComponent(bi.photo)}&formId=${encodeURIComponent(bi.formId || 'NF- Activities')}`); }} src={`/api/odk/image?submissionId=${encodeURIComponent(bi.submissionId)}&filename=${encodeURIComponent(bi.photo)}&formId=${encodeURIComponent(bi.formId || 'NF- Activities')}`} alt="Bio Input" className="w-full h-32 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity" loading="lazy" />
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Harvests */}
                                      {row.harvests.length > 0 && (
                                        <div>
                                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Harvesting Data</h5>
                                          <div className="space-y-3">
                                            {row.harvests.map((h: any, i: number) => (
                                              <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                  <span className="font-semibold text-sm text-slate-800">{h.crop_harvested || 'Unknown Crop'}</span>
                                                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{h.date_harvest || '-'}</span>
                                                </div>
                                                <div className="text-sm text-slate-600">
                                                  Yield: <span className="font-medium text-emerald-600">{((parseFloat(h.yield_Qntl || h.yield || 0) || 0) * 100).toFixed(2)} KG</span>
                                                </div>
                                                {h.photo && h.submissionId && (
                                                  <div className="mt-3">
                                                    <img onClick={(e) => { e.stopPropagation(); setPreviewImage(`/api/odk/image?submissionId=${encodeURIComponent(h.submissionId)}&filename=${encodeURIComponent(h.photo)}&formId=${encodeURIComponent(h.formId || 'NF- Activities')}`); }} src={`/api/odk/image?submissionId=${encodeURIComponent(h.submissionId)}&filename=${encodeURIComponent(h.photo)}&formId=${encodeURIComponent(h.formId || 'NF- Activities')}`} alt="Harvest" className="w-full h-32 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity" loading="lazy" />
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                    </div>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="w-8 h-8 text-slate-300 mb-3" />
                        <p className="text-base font-medium">No records found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-white">
              <div className="text-sm text-slate-500">
                Showing <span className="font-medium text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="font-medium text-slate-900">{filteredData.length}</span> results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="text-sm font-medium text-slate-700 px-2">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          </div>
        )}
        </div>
      </div>
      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[99999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            <button 
              className="fixed top-4 right-4 z-[99999] text-white/70 hover:text-white p-2 transition-colors bg-slate-900/50 hover:bg-slate-900/80 rounded-full backdrop-blur-md ring-1 ring-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImage(null);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/20"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, className }: { label: string, value: string, onChange: (val: string) => void, options: string[], className?: string }) {
  return (
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm shrink-0 min-w-[120px] pr-8", className)}
      style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' }}
    >
      <option value="All">{label}: All</option>
      {options.filter(Boolean).map(o => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}


function OverviewTab({ data }: { data: any[] }) {
  const stats = useMemo(() => {
    let totalArea = 0;
    let totalHarvests = 0;
    let totalBioInputs = 0;
    
    const uniqueFarmers = new Set<string>();
    const activeFarmers = new Set<string>();
    
    const cropModeCount: Record<string, number> = {};
    const mainCropFarmers: Record<string, Set<string>> = {};
    
    data.forEach(item => {
      const farmerId = item.hhId || item.farmerName || 'unknown';
      uniqueFarmers.add(farmerId);
      
      // Area
      const area = parseFloat(item.area);
      if (!isNaN(area)) totalArea += area;
      
      // Activities
      if (item.harvests.length > 0 || item.bioInputs.length > 0) {
        activeFarmers.add(farmerId);
      }
      totalHarvests += item.harvests.length;
      totalBioInputs += item.bioInputs.length;
      
      // Crop Mode
      const mode = item.cropMode || 'Unknown';
      cropModeCount[mode] = (cropModeCount[mode] || 0) + 1;
      
      // Main Crop
      const mainCrop = item.mainCrop || 'Unknown';
      if (mainCrop !== 'Unknown' && mainCrop !== '-') {
        if (!mainCropFarmers[mainCrop]) {
          mainCropFarmers[mainCrop] = new Set<string>();
        }
        mainCropFarmers[mainCrop].add(farmerId);
      }
    });
    
    const cropModeData = Object.entries(cropModeCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
      
    const mainCropData = Object.entries(mainCropFarmers)
      .map(([name, set]) => ({ name, value: set.size }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // top 10
      
    return {
      totalUniqueFarmers: uniqueFarmers.size,
      totalArea: totalArea.toFixed(2),
      activeFarmers: activeFarmers.size,
      totalHarvests,
      totalBioInputs,
      cropModeData,
      mainCropData
    };
  }, [data]);
  
  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <div className="flex flex-col gap-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Users className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-xs uppercase tracking-wider">Unique Farmers</h3>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalUniqueFarmers}</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Layers className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-xs uppercase tracking-wider">Total Area (Acres)</h3>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalArea}</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-xs uppercase tracking-wider">Active Farmers</h3>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.activeFarmers}</div>
          <div className="text-xs text-slate-500 mt-1">With logged activities</div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-xs uppercase tracking-wider">Total Activities</h3>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalHarvests + stats.totalBioInputs}</div>
          <div className="text-xs text-slate-500 mt-1">{stats.totalHarvests} Harvests, {stats.totalBioInputs} Bio Inputs</div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[400px] overflow-hidden min-w-0">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <PieChartIcon className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Crop Modes Distribution</h3>
          </div>
          <div className="flex-1 min-h-0 relative">
            {stats.cropModeData.length > 0 ? (
              <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                  <Pie
                    data={stats.cropModeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive={false}
                    labelLine={false}
                  >
                    {stats.cropModeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip isAnimationActive={false} wrapperStyle={{ pointerEvents: 'none' }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[400px] overflow-hidden min-w-0">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Crop-wise Farmers Count</h3>
          </div>
          <div className="flex-1 min-h-0 relative">
            {stats.mainCropData.length > 0 ? (
              <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <BarChart data={stats.mainCropData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    dy={10}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                  />
                  <RechartsTooltip isAnimationActive={false} wrapperStyle={{ pointerEvents: 'none' }}
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
                    <LabelList dataKey="value" position="top" style={{ fontSize: '11px', fill: '#64748b', fontWeight: 'bold' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
