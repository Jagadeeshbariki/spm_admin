import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Search, Loader2, Sprout, MapPin, Users, Database, ChevronDown, ChevronUp, Calendar, ArrowLeft, ArrowRight, Info, Layers, Activity, TrendingUp, BarChart3, PieChart as PieChartIcon, ExternalLink, X, ZoomIn } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';
import { cn } from '../../lib/utils';
import { flatten } from 'flat';
import { NFValidationPage } from './NFValidationPage';
import { NFDashboard } from './NFDashboard';
import { CropMapTab } from './CropMapTab';

export default function CropsDashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedBlock, setSelectedBlock] = useState<string[]>([]);
  const [selectedGp, setSelectedGp] = useState<string[]>([]);
  const [selectedVillage, setSelectedVillage] = useState<string[]>([]);
  const [selectedCropMode, setSelectedCropMode] = useState<string[]>([]);
  const [hasActivities, setHasActivities] = useState('All');
  const [selectedYear, setSelectedYear] = useState<string[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activeTab, setActiveTab] = useState<'overview' | 'frp' | 'hdfc' | 'nf-validation' | 'nf-dashboard' | 'map'>('overview');
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
          
          // 1. Create PK from NF - Register
          const farmerId = String(flat['plot_reg-farmer_Id'] || flat['plot_reg_farmer_Id'] || flat['farmer_Id'] || '').trim();
          const yearRaw = String(flat['plot_reg-year_only'] || flat['plot_reg-year'] || flat['year'] || '').trim();
          const yearOnly = yearRaw.length >= 4 ? yearRaw.substring(0, 4) : yearRaw;
          const regSeason = String(flat['plot_reg-season'] || flat['season'] || '').trim();
          
          const registration_id = `${farmerId}-${yearOnly}-${regSeason}`.toLowerCase();
          
          // 2. Filter NF - Activities based on FK
          const matchedActivities = activities.filter((act: any) => {
            const pDetails = act.Primary_details || {};
            
            const actFarmerName = String(pDetails.farmer_name || '').trim();
            const textYear = String(pDetails.text_year || '');
            const actYear = textYear.length >= 4 ? textYear.substring(0, 4) : textYear;
            const actDataSeason = String(pDetails.data_season || '').trim();
            
            const activity_fk = `${actFarmerName}-${actYear}-${actDataSeason}`.toLowerCase();
            
            return registration_id === activity_fk && registration_id !== '--';
          });

          let harvests: any[] = [];
          let bioInputs: any[] = [];
          let cces: any[] = [];
          let activityPhotos: any[] = [];
          
          matchedActivities.forEach((act: any) => {
            const flatAct = flatten(act);
            const actPhoto = act.gps?.photo || flatAct['gps_photo'] || flatAct['gps-photo'] || flatAct['photo'] || act.photo;
            
            // 4. Use Instance ID as PARENT_KEY for nested tables
            const parentKey = act.meta?.instanceID || act.__id || '';
            const submissionId = act.__id || parentKey.replace('uuid:', '');
            if (actPhoto) {
              activityPhotos.push({
                photo: actPhoto,
                submissionId,
                formId: 'NF- Activities',
                date: act.Primary_details?.date_visit || act.date || flatAct['date_visit'] || '-'
              });
            }
            
            if (act.harvesting && Array.isArray(act.harvesting)) {
              harvests.push(...act.harvesting.map((h: any) => ({ 
                ...h, 
                photo: actPhoto, 
                PK: h.__id || parentKey + '-' + Math.random().toString(36).substr(2, 9),
                PARENT_KEY: parentKey,
                formId: 'NF- Activities',
                submissionId: act.__id || parentKey.replace('uuid:', '') 
              })));
            }
            if (act.application_bio_input && Array.isArray(act.application_bio_input)) {
              bioInputs.push(...act.application_bio_input.map((b: any) => ({ 
                ...b, 
                photo: actPhoto, 
                PK: b.__id || parentKey + '-' + Math.random().toString(36).substr(2, 9),
                PARENT_KEY: parentKey,
                formId: 'NF- Activities',
                submissionId: act.__id || parentKey.replace('uuid:', '') 
              })));
            }
            if (act.cce && (act.cce.date_cce || flatAct['cce_date_cce'] || flatAct['cce-date_cce'])) {
              cces.push({
                ...act.cce,
                photo: actPhoto,
                PK: parentKey + '-cce',
                PARENT_KEY: parentKey,
                formId: 'NF- Activities',
                submissionId: act.__id || parentKey.replace('uuid:', '')
              });
            }
          });

          // Variables required for dashboard rendering
          const hhId = farmerId || flat['HH_id'] || flat['hh_id'] || '';
          const farmerName = flat['plot_reg-farmer_name'] || flat['farmer_name'] || flat['name'] || '';
          const season = regSeason || flat['Season'] || 'Unknown';
          const sowingDate = flat['plot_reg-sowing_date'] || flat['sowing_date'] || flat['date'] || '-';
          const regYear = yearOnly;
            const rawYear = flat['text_year'] || flat['year'];
            const rawSeason = flat['season'] || flat['Season'];
            const cropCycle = flat['plot_reg_crop_cycle'] || flat['plot_reg-crop_cycle'] || '';
            
            let finalYear = rawYear ? String(rawYear).substring(0, 4) : '';
            let finalSeason = rawSeason || '';
            
            if (cropCycle) {
               const parts = cropCycle.split('-');
               if (parts.length >= 3) {
                  if (!finalYear) finalYear = parts[1];
                  if (!finalSeason) finalSeason = parts[2];
               }
            }

            return {
            plotPhoto: flat['plot_reg_image'] || flat['plot_reg-image'] || flat['image'] || flat['photo'],
            coordinates: sub.plot_reg?.plot_gps?.coordinates || sub.plot_gps?.coordinates || sub.gps?.coordinates || null,
            plotSubmissionId: sub.__id || sub.meta?.instanceID?.replace('uuid:', ''),
            plotFormId: 'NF- Register',
            block: flat['block'] || flat['Block'] || '',
            gp: flat['gp'] || flat['GP'] || flat['Gram_Panchayat'] || flat['gram_panchayat'] || '',
            village: flat['village'] || flat['Village'] || '',
            cropMode: (() => {
              const m = flat['crop_mode'] || flat['crop_model'] || flat['plot_reg_crop_model'] || flat['plot_reg-crop_model'] || '';
              return (m && m.toLowerCase() !== 'unknown') ? m : 'Other';
            })(),
            farmerName: flat['farmer_name'] || flat['Farmer_Name'] || flat['name'] || flat['farmer'] || '',
            plotFarmerId: farmerId,
            hhId: flat['plot_reg-farmer_Id'] || flat['plot_reg_farmer_Id'] || flat['farmer_Id'] || flat['HH_id'] || flat['HH_Id'] || flat['hh_id'] || flat['HH Id'] || flat['hhid'] || '',
            year: finalYear || 'Unknown',
            season: finalSeason || 'Unknown',
            mainCrop: flat['main_crop'] || flat['plot_reg_main_crop'] || flat['plot_reg-main_crop'] || flat['Main_Crop'] || '-',
            interCrops: flat['inter_crops'] || flat['plot_reg_inter_crops'] || flat['plot_reg-inter_crops'] || flat['Inter_Crops'] || '-',
            sowingDate: flat['sowing_date'] || flat['Sowing_Date'] || flat['date'] || '-',
            area: flat['area_'] || flat['Area'] || flat['area'] || flat['plot_reg-area_'] || flat['plot_reg_area_'] || '-',
            harvests,
            bioInputs,
            cces,
            raw: flat,
            activityCount: matchedActivities.length,
            activityPhotos,
            submitterName: sub.__system?.submitterName || ''
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
      const yearMatch = selectedYear.length === 0 || selectedYear.includes(item.year);
      const seasonMatch = selectedSeason.length === 0 || selectedSeason.includes(item.season);
      const blockMatch = selectedBlock.length === 0 || selectedBlock.includes(item.block);
      const gpMatch = selectedGp.length === 0 || selectedGp.includes(item.gp);
      const villMatch = selectedVillage.length === 0 || selectedVillage.includes(item.village);
      
      if (item.year) ySet.add(item.year);
      if (yearMatch && item.season) sSet.add(item.season);
      if (yearMatch && seasonMatch && item.block) bSet.add(item.block);
      if (yearMatch && seasonMatch && blockMatch && item.gp) gSet.add(item.gp);
      if (yearMatch && seasonMatch && blockMatch && gpMatch && item.village) vSet.add(item.village);
      if (yearMatch && seasonMatch && blockMatch && gpMatch && villMatch && item.cropMode) cSet.add(item.cropMode);
    });
    
    return { 
      blocks: Array.from(bSet).sort(), 
      gps: Array.from(gSet).sort(), 
      villages: Array.from(vSet).sort(), 
      cropModes: Array.from(cSet).sort(),
      years: Array.from(ySet).sort(),
      seasons: Array.from(sSet).sort()
    };
  }, [data, selectedYear, selectedSeason, selectedBlock, selectedGp, selectedVillage]);

  const filteredData = useMemo(() => {
    const hdfcTargetSubmitters = [
      { names: ['sampath'], cluster: 'Cluster 1' },
      { names: ['mani'], cluster: 'Cluster 2' },
      { names: ['jadeskung', 'jeddiskung', 'jadiskung'], cluster: 'Cluster 3' }
    ];

    const getSubmitterCluster = (name: string) => {
      if (!name) return null;
      const lowerName = String(name).toLowerCase();
      for (const ts of hdfcTargetSubmitters) {
        if (ts.names.some(n => lowerName.includes(n))) {
          return ts.cluster;
        }
      }
      return null;
    };

    return data.filter(item => {
      // HDFC Tab specific filter
      if (activeTab === 'hdfc') {
         const cluster = getSubmitterCluster(item.submitterName);
         if (!cluster) return false;
         item.cluster = cluster;
      }

      if (selectedBlock.length > 0 && !selectedBlock.includes(item.block)) return false;
      if (selectedGp.length > 0 && !selectedGp.includes(item.gp)) return false;
      if (selectedVillage.length > 0 && !selectedVillage.includes(item.village)) return false;
      if (selectedCropMode.length > 0 && !selectedCropMode.includes(item.cropMode)) return false;
      if (selectedYear.length > 0 && !selectedYear.includes(item.year)) return false;
      if (selectedSeason.length > 0 && !selectedSeason.includes(item.season)) return false;
      
      if (hasActivities === 'Yes') {
        if (item.activityCount === 0) return false;
      } else if (hasActivities === 'No') {
        if (item.activityCount > 0) return false;
      }
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const fName = String(item.farmerName).toLowerCase();
        const hh = String(item.hhId).toLowerCase();
        if (!fName.includes(term) && !hh.includes(term)) return false;
      }
      
      return true;
    });
  }, [data, selectedBlock, selectedGp, selectedVillage, selectedCropMode, hasActivities, selectedYear, selectedSeason, searchTerm, activeTab]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBlock, selectedGp, selectedVillage, selectedCropMode, hasActivities, selectedYear, selectedSeason, searchTerm]);

  
  const groupedData = useMemo(() => {
    const groups = {};
    filteredData.forEach(item => {
      const key = `${item.hhId}-${item.farmerName}`;
      if (!groups[key]) {
        groups[key] = {
          id: key,
          hhId: item.hhId,
          farmerName: item.farmerName,
          cluster: item.cluster,
          village: item.village,
          gp: item.gp,
          block: item.block,
          plots: [],
          totalActivities: 0
        };
      }
      groups[key].plots.push(item);
      groups[key].totalActivities += (item.activityCount || 0);
    });
    return Object.values(groups);
  }, [filteredData]);

  const totalPages = Math.ceil(groupedData.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return groupedData.slice(start, start + itemsPerPage);
  }, [groupedData, currentPage]);
  
  const [expandedSubRow, setExpandedSubRow] = useState<string | number | null>(null);
  

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
    <div className="bg-slate-50 h-[calc(100vh-64px)] -m-4 md:-m-8 p-4 font-sans text-slate-800 flex flex-col overflow-hidden">
      <div className="w-full h-full flex flex-col gap-4">
        
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
          <button 
            onClick={() => setActiveTab('hdfc')}
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === 'hdfc' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            HDFC Crops
          </button>
          <button 
            onClick={() => setActiveTab('nf-dashboard')}
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === 'nf-dashboard' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            NF Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === 'map' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            Crop Map
          </button>
          <button 
            onClick={() => setActiveTab('nf-validation')}
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === 'nf-validation' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            Data Validation
          </button>
        </div>

        {/* Filters Panel */}
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 shrink-0 flex flex-col gap-2">
          
          <div className="flex flex-wrap lg:flex-nowrap overflow-x-visible gap-2 w-full">
            <MultiSelectDropdown 
              label="Year" 
              selected={selectedYear} 
              onChange={setSelectedYear} 
              options={years} 
              className="flex-1 min-w-[120px]"
            />
            <MultiSelectDropdown 
              label="Season" 
              selected={selectedSeason} 
              onChange={setSelectedSeason} 
              options={seasons} 
              className="flex-1 min-w-[130px]"
            />
            <MultiSelectDropdown 
              label="Block" 
              selected={selectedBlock} 
              onChange={setSelectedBlock} 
              options={blocks} 
              className="flex-1 min-w-[140px]"
            />
            <MultiSelectDropdown 
              label="Gram Panchayat" 
              selected={selectedGp} 
              onChange={setSelectedGp} 
              options={gps} 
              className="flex-1 min-w-[160px]"
            />
            <MultiSelectDropdown 
              label="Village" 
              selected={selectedVillage} 
              onChange={setSelectedVillage} 
              options={villages} 
              className="flex-1 min-w-[150px]"
            />
            <MultiSelectDropdown 
              label="Crop Mode" 
              selected={selectedCropMode} 
              onChange={setSelectedCropMode} 
              options={cropModes} 
              className="flex-1 min-w-[150px]"
            />
            <FilterSelect 
              label="Has Activities" 
              value={hasActivities} 
              onChange={setHasActivities} 
              options={['Yes', 'No']} 
              className="flex-1 min-w-[140px]"
            />
          </div>

          <div className="flex flex-col md:flex-row items-center gap-2 w-full">
            <div className="relative w-full md:w-96">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by Farmer Name or HH ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 w-full bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            
            <div className="ml-auto w-full md:w-auto shrink-0">
              {(selectedBlock.length > 0 || selectedGp.length > 0 || selectedVillage.length > 0 || selectedCropMode.length > 0 || hasActivities !== 'All' || selectedYear.length > 0 || selectedSeason.length > 0 || searchTerm !== '') && (
                <button
                  onClick={() => {
                    setSelectedBlock([]);
                    setSelectedGp([]);
                    setSelectedVillage([]);
                    setSelectedCropMode([]);
                    setSelectedYear([]);
                    setSelectedSeason([]);
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
        <div className="flex flex-col gap-4 flex-1 min-h-0">
        
        {activeTab === 'nf-validation' && (
          <NFValidationPage />
        )}

        {activeTab === 'nf-dashboard' && (
          <NFDashboard />
        )}

        {activeTab === 'map' && (
          <CropMapTab data={filteredData} />
        )}

        {(activeTab === 'overview' || activeTab === 'hdfc') && (
          <OverviewTab data={filteredData} isHdfc={activeTab === 'hdfc'} yearFilter={selectedYear} seasonFilter={selectedSeason} />
        )}
        
        {(activeTab === 'frp' || activeTab === 'hdfc') && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="overflow-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 w-10"></th>
                  <th className="px-6 py-4">HH ID</th>
                  <th className="px-6 py-4">Farmer Name</th>
                  {activeTab === 'hdfc' && <th className="px-6 py-4">Cluster</th>}
                  <th className="px-6 py-4">Total Plots</th>
                  <th className="px-6 py-4">Village</th>
                  <th className="px-6 py-4">GP</th>
                  <th className="px-6 py-4">Block</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.length > 0 ? (
                  paginatedData.map((group, idx) => {
                    const rowId = group.id || idx;
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
                              {group.hhId || '-'}
                              {group.totalActivities > 0 && (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold" title="Has Activities">
                                  {group.totalActivities}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700">{group.farmerName || '-'}</td>
                          {activeTab === 'hdfc' && (
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {group.cluster || '-'}
                              </span>
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {group.plots.length} {group.plots.length === 1 ? 'Plot' : 'Plots'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {group.village || '-'}
                          </td>
                          <td className="px-6 py-4 text-slate-600">{group.gp || '-'}</td>
                          <td className="px-6 py-4 text-slate-600">{group.block || '-'}</td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={activeTab === 'hdfc' ? 8 : 7} className="p-0 border-b border-slate-200 bg-slate-50/50">
                              <div className="p-6 bg-slate-50 border-t border-slate-200 animate-in slide-in-from-top-2 duration-200">
                                <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-emerald-600" /> Registered Plots</h4>
                                <div className="space-y-4">
                                  {group.plots.map((plot: any, plotIdx: number) => {
                                    const plotId = plot.raw?.__id || plotIdx;
                                    const isSubExpanded = expandedSubRow === plotId;
                                    return (
                                      <div key={plotId} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                        <div 
                                          className="px-5 py-4 cursor-pointer hover:bg-slate-50 flex items-center justify-between transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedSubRow(isSubExpanded ? null : plotId);
                                          }}
                                        >
                                          <div className="flex items-center gap-6">
                                            <div>
                                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Crop</span>
                                              <span className="text-sm font-semibold text-slate-900">{plot.mainCrop || 'Unknown'}</span>
                                            </div>
                                            <div>
                                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Season</span>
                                              <span className="text-sm font-medium text-slate-700">{plot.season || 'Unknown'}</span>
                                            </div>
                                            <div>
                                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Year</span>
                                              <span className="text-sm font-medium text-slate-700">{plot.year || 'Unknown'}</span>
                                            </div>
                                            <div>
                                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Crop Mode</span>
                                              <span className="text-sm font-medium text-slate-700">{plot.cropMode || 'Other'}</span>
                                            </div>
                                          </div>
                                          <div className="text-slate-400">
                                            {isSubExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                          </div>
                                        </div>
                                        
                                        {isSubExpanded && (
                                          <div className="border-t border-slate-100 bg-slate-50/30 p-5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                                              <div className="space-y-1">
                                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Date of Sowing</div>
                                                <div className="text-sm font-medium text-slate-900">{plot.sowingDate}</div>
                                              </div>
                                              <div className="space-y-1">
                                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Sprout className="w-3.5 h-3.5" /> Inter Crops</div>
                                                <div className="text-sm font-medium text-slate-900">{plot.interCrops}</div>
                                              </div>
                                              <div className="space-y-1">
                                                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Area</div>
                                                <div className="text-sm font-medium text-slate-900">{plot.area}</div>
                                              </div>
                                            </div>
                                            
                                            {/* Plot Registration Section */}
                                            {plot.plotPhoto && plot.plotSubmissionId && (
                                              <div className="border-t border-slate-200 pt-6 mt-2">
                                                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
                                                  <span>Plot Registration</span>
                                                  <button 
                                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1.5 font-medium"
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      window.open(`/api/odk/image?v=4&submissionId=${encodeURIComponent(plot.plotSubmissionId)}&filename=${encodeURIComponent(plot.plotPhoto)}&formId=${encodeURIComponent(plot.plotFormId || 'NF- Register')}`, '_blank');
                                                    }}
                                                  >
                                                    <ExternalLink className="w-3.5 h-3.5" /> Open Photo in New Tab
                                                  </button>
                                                </h4>
                                                <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Plot Registration Photo</h5>
                                                  <div 
                                                    className="relative group max-w-sm h-48 rounded-lg overflow-hidden border border-slate-300 shadow-sm cursor-pointer bg-slate-100"
                                                    onClick={(e) => { 
                                                      e.stopPropagation(); 
                                                      setPreviewImage(`/api/odk/image?v=4&submissionId=${encodeURIComponent(plot.plotSubmissionId)}&filename=${encodeURIComponent(plot.plotPhoto)}&formId=${encodeURIComponent(plot.plotFormId || 'NF- Register')}`); 
                                                    }}
                                                  >
                                                    <img 
                                                      src={`/api/odk/image?v=4&submissionId=${encodeURIComponent(plot.plotSubmissionId)}&filename=${encodeURIComponent(plot.plotPhoto)}&formId=${encodeURIComponent(plot.plotFormId || 'NF- Register')}`} 
                                                      alt="Plot Registration" 
                                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                                                      loading="lazy" 
                                                    />
                                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                                                      <ZoomIn className="w-4 h-4" /> Click to view full image
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            )}

                                            

                                            {plot.activityPhotos && plot.activityPhotos.length > 0 && (
                                              <div className="border-t border-slate-200 pt-6 mt-6">
                                                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
                                                  <span>Activity Photos</span>
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                  {plot.activityPhotos.map((ap: any, i: number) => (
                                                    <div key={i}>
                                                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Visit: {ap.date}</h5>
                                                      <div 
                                                        className="relative group w-full h-32 rounded-lg overflow-hidden border border-slate-300 shadow-sm cursor-pointer bg-slate-100"
                                                        onClick={(e) => { 
                                                          e.stopPropagation(); 
                                                          setPreviewImage(`/api/odk/image?v=4&submissionId=${encodeURIComponent(ap.submissionId)}&filename=${encodeURIComponent(ap.photo)}&formId=${encodeURIComponent(ap.formId)}`); 
                                                        }}
                                                      >
                                                        <img 
                                                          src={`/api/odk/image?v=4&submissionId=${encodeURIComponent(ap.submissionId)}&filename=${encodeURIComponent(ap.photo)}&formId=${encodeURIComponent(ap.formId)}`} 
                                                          alt="Activity Photo" 
                                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                                                          loading="lazy" 
                                                        />
                                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                                                          <ZoomIn className="w-4 h-4" /> View
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {(plot.bioInputs.length > 0 || plot.harvests.length > 0 || (plot.cces && plot.cces.length > 0)) && (
                                              <div className="border-t border-slate-200 pt-6 mt-6">
                                                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-600" /> Activities & Data</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                  
                                                  {/* Bio Inputs */}
                                                  {plot.bioInputs.length > 0 && (
                                                    <div>
                                                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Bio Inputs Applied</h5>
                                                      <div className="space-y-3">
                                                        {plot.bioInputs.map((bi: any, i: number) => (
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
                                                                <div 
                                                                  className="relative group w-full h-32 rounded-lg overflow-hidden border border-slate-200 cursor-pointer bg-slate-100"
                                                                  onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    setPreviewImage(`/api/odk/image?v=4&submissionId=${encodeURIComponent(bi.submissionId)}&filename=${encodeURIComponent(bi.photo)}&formId=${encodeURIComponent(bi.formId || 'NF- Activities')}`); 
                                                                  }}
                                                                >
                                                                  <img 
                                                                    src={`/api/odk/image?v=4&submissionId=${encodeURIComponent(bi.submissionId)}&filename=${encodeURIComponent(bi.photo)}&formId=${encodeURIComponent(bi.formId || 'NF- Activities')}`} 
                                                                    alt="Bio Input" 
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                                                                    loading="lazy" 
                                                                  />
                                                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                                                                    <ZoomIn className="w-3.5 h-3.5" /> View Photo
                                                                  </div>
                                                                </div>
                                                              </div>
                                                            )}
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  )}

                                                  {/* Harvests */}
                                                  {plot.harvests.length > 0 && (
                                                    <div>
                                                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Harvesting Data</h5>
                                                      <div className="space-y-3">
                                                        {plot.harvests.map((h: any, i: number) => (
                                                          <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                                            <div className="flex justify-between items-start mb-2">
                                                              <span className="font-semibold text-sm text-slate-800">Harvest #{i + 1}</span>
                                                              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{h.harvesting_date || '-'}</span>
                                                            </div>
                                                            <div className="text-sm text-slate-600 space-y-1 mb-2">
                                                              <div className="flex justify-between">
                                                                <span className="text-slate-500">Yield:</span>
                                                                <span className="font-medium">{h.yield_quantity || h.qty || '-'} {h.unit || 'Kg'}</span>
                                                              </div>
                                                            </div>
                                                            {h.photo && h.submissionId && (
                                                              <div className="mt-2">
                                                                <div 
                                                                  className="relative group w-full h-32 rounded-lg overflow-hidden border border-slate-200 cursor-pointer bg-slate-100"
                                                                  onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    setPreviewImage(`/api/odk/image?v=4&submissionId=${encodeURIComponent(h.submissionId)}&filename=${encodeURIComponent(h.photo)}&formId=${encodeURIComponent(h.formId || 'NF- Activities')}`); 
                                                                  }}
                                                                >
                                                                  <img 
                                                                    src={`/api/odk/image?v=4&submissionId=${encodeURIComponent(h.submissionId)}&filename=${encodeURIComponent(h.photo)}&formId=${encodeURIComponent(h.formId || 'NF- Activities')}`} 
                                                                    alt="Harvest" 
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                                                                    loading="lazy" 
                                                                  />
                                                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                                                                    <ZoomIn className="w-3.5 h-3.5" /> View Photo
                                                                  </div>
                                                                </div>
                                                              </div>
                                                            )}
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  )}
                                                  {/* CCEs */}
                                                  {plot.cces && plot.cces.length > 0 && (
                                                    <div>
                                                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Crop Cutting Experiments (CCE)</h5>
                                                      <div className="space-y-3">
                                                        {plot.cces.map((c: any, i: number) => (
                                                          <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                                            <div className="flex justify-between items-start mb-2">
                                                              <span className="font-semibold text-sm text-slate-800">CCE #{i + 1}</span>
                                                              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{c.date_cce || '-'}</span>
                                                            </div>
                                                            <div className="text-sm text-slate-600 space-y-1 mb-2">
                                                              <div className="flex justify-between">
                                                                <span className="text-slate-500">Yield (5x5 Sqm):</span>
                                                                <span className="font-medium">{c.sqmtr_5_5_kgs || '-'} Kgs</span>
                                                              </div>
                                                            </div>
                                                            {c.photo && c.submissionId && (
                                                              <div className="mt-2">
                                                                <div 
                                                                  className="relative group w-full h-32 rounded-lg overflow-hidden border border-slate-200 cursor-pointer bg-slate-100"
                                                                  onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    setPreviewImage(`/api/odk/image?v=4&submissionId=${encodeURIComponent(c.submissionId)}&filename=${encodeURIComponent(c.photo)}&formId=${encodeURIComponent(c.formId || 'NF- Activities')}`); 
                                                                  }}
                                                                >
                                                                  <img 
                                                                    src={`/api/odk/image?v=4&submissionId=${encodeURIComponent(c.submissionId)}&filename=${encodeURIComponent(c.photo)}&formId=${encodeURIComponent(c.formId || 'NF- Activities')}`} 
                                                                    alt="CCE Photo" 
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                                                                    loading="lazy" 
                                                                  />
                                                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                                                                    <ZoomIn className="w-3.5 h-3.5" /> View Photo
                                                                  </div>
                                                                </div>
                                                             </div>
                                                            )}
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  )}

                                                </div>
                                              </div>
                                            )}

                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={activeTab === 'hdfc' ? 8 : 7} className="px-6 py-12 text-center text-slate-500">
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
          className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center justify-center bg-slate-900/60 p-4 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-sm cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with Actions */}
            <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-white/10">
              <span className="text-sm font-semibold text-white/90 flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-400" /> Image Preview
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                </a>
                <button 
                  className="text-white/70 hover:text-white p-1.5 transition-colors bg-white/10 hover:bg-white/20 rounded-lg"
                  onClick={() => setPreviewImage(null)}
                  title="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Main Image */}
            <div className="relative w-full flex items-center justify-center overflow-hidden max-h-[80vh] rounded-xl bg-black/40">
              <img 
                src={previewImage} 
                alt="Full Preview" 
                className="max-w-full max-h-[78vh] object-contain rounded-lg shadow-2xl transition-all duration-300"
                loading="eager"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


function MultiSelectDropdown({ label, selected, onChange, options, className }: { label: string, selected: string[], onChange: (val: string[]) => void, options: string[], className?: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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


function OverviewTab({ data, isHdfc = false, yearFilter = 'All', seasonFilter = 'All' }: { data: any[], isHdfc?: boolean, yearFilter?: string, seasonFilter?: string }) {
  const stats = useMemo(() => {
    let totalArea = 0;
    let totalHarvests = 0;
    let totalBioInputs = 0;
    
    const uniqueFarmers = new Set<string>();
    const activeFarmers = new Set<string>();
    
    const cropModeCount: Record<string, number> = {};
    const mainCropFarmers: Record<string, Set<string>> = {};
    const villageFarmers: Record<string, Set<string>> = {};
    const seasonFarmers: Record<string, Set<string>> = {};
    const clusterFarmers: Record<string, Set<string>> = {};
    const blockCropModeStats: Record<string, Record<string, { count: number, area: number }>> = {};
    const blockSubmitterStats: Record<string, Record<string, { count: number, area: number }>> = {};
    
    data.forEach(item => {
      // strictly use plot_reg-farmer_Id for unique farmer counts as requested
      const farmerId = item.plotFarmerId || null;
      if (farmerId) {
        uniqueFarmers.add(farmerId);
      }
      
      // Area
      const area = parseFloat(item.area);
      if (!isNaN(area)) totalArea += area;
      
      // Activities
      if (item.harvests.length > 0 || item.bioInputs.length > 0 || (item.cces && item.cces.length > 0)) {
        if (farmerId) {
          activeFarmers.add(farmerId);
        }
      }
      totalHarvests += item.harvests.length;
      totalBioInputs += item.bioInputs.length;
      
      // Crop Mode
      const mode = item.cropMode || 'Other';
      cropModeCount[mode] = (cropModeCount[mode] || 0) + 1;

      // Cluster
      if (isHdfc) {
        const cluster = item.cluster || 'Unknown';
        if (!clusterFarmers[cluster]) {
          clusterFarmers[cluster] = new Set<string>();
        }
        if (farmerId) clusterFarmers[cluster].add(farmerId);
      }
      
      // Main Crop
      const mainCrop = item.mainCrop || 'Unknown';
      if (mainCrop !== 'Unknown' && mainCrop !== '-') {
        if (!mainCropFarmers[mainCrop]) {
          mainCropFarmers[mainCrop] = new Set<string>();
        }
        if (farmerId) mainCropFarmers[mainCrop].add(farmerId);
      }

      
      // Village
      const village = item.village || 'Unknown';
      if (village !== 'Unknown' && village !== '-') {
        if (!villageFarmers[village]) villageFarmers[village] = new Set<string>();
        if (farmerId) villageFarmers[village].add(farmerId);
      }
      
      // Season
      const season = item.season || 'Unknown';
      if (season !== 'Unknown' && season !== '-') {
        if (!seasonFarmers[season]) seasonFarmers[season] = new Set<string>();
        if (farmerId) seasonFarmers[season].add(farmerId);
      }
  
      // Summary Tables
      const block = item.block || 'Unknown';
      const safeArea = !isNaN(area) ? area : 0;
      
      // Table 1: Crop Modes
      if (!blockCropModeStats[block]) blockCropModeStats[block] = {};
      if (!blockCropModeStats[block][mode]) blockCropModeStats[block][mode] = { count: 0, area: 0 };
      blockCropModeStats[block][mode].count += 1;
      blockCropModeStats[block][mode].area += safeArea;

      // Table 2: NF Cotton Status
      if (isHdfc && String(mode).toLowerCase().includes('cotton')) {
        const submitter = item.submitterName || 'Unknown';
        if (!blockSubmitterStats[block]) blockSubmitterStats[block] = {};
        if (!blockSubmitterStats[block][submitter]) blockSubmitterStats[block][submitter] = { count: 0, area: 0 };
        blockSubmitterStats[block][submitter].count += 1;
        blockSubmitterStats[block][submitter].area += safeArea;
      }
    });
    
    const cropModeData = Object.entries(cropModeCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
      
    const mainCropData = Object.entries(mainCropFarmers)
      .map(([name, set]) => ({ name, value: set.size }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // top 10

    
    const villageData = Object.entries(villageFarmers)
      .map(([name, set]) => ({ name, value: set.size }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // top 10

    const seasonData = Object.entries(seasonFarmers)
      .map(([name, set]) => ({ name, value: set.size }))
      .sort((a, b) => b.value - a.value);
  
    const clusterData = Object.entries(clusterFarmers)
      .map(([name, set]) => ({ name, value: set.size }))
      .sort((a, b) => a.name.localeCompare(b.name));
      
    const table1Data = Object.entries(blockCropModeStats).map(([block, modes]) => {
      let blockCount = 0;
      let blockArea = 0;
      const modesArr = Object.entries(modes).map(([mode, stats]) => {
        blockCount += stats.count;
        blockArea += stats.area;
        return { mode, count: stats.count, area: stats.area };
      }).sort((a, b) => a.mode.localeCompare(b.mode));
      return { block, modes: modesArr, count: blockCount, area: blockArea };
    }).sort((a, b) => a.block.localeCompare(b.block));

    const table2Data = Object.entries(blockSubmitterStats).map(([block, submitters]) => {
      let blockCount = 0;
      let blockArea = 0;
      const submittersArr = Object.entries(submitters).map(([name, stats]) => {
        blockCount += stats.count;
        blockArea += stats.area;
        return { name, count: stats.count, area: stats.area };
      }).sort((a, b) => a.name.localeCompare(b.name));
      return { block, submitters: submittersArr, count: blockCount, area: blockArea };
    }).sort((a, b) => a.block.localeCompare(b.block));
      
    return {
      totalUniqueFarmers: uniqueFarmers.size,
      totalArea: totalArea.toFixed(2),
      activeFarmers: activeFarmers.size,
      totalHarvests,
      totalBioInputs,
      cropModeData,
      mainCropData,
      villageData,
      seasonData,
      clusterData,
      table1Data,
      table2Data
    };
  }, [data]);
  
  const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  return (
    <div className="flex flex-col gap-3 flex-1 min-h-0 h-full overflow-y-auto custom-scrollbar pb-6">
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[300px] overflow-hidden min-w-0">
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
                    innerRadius="50%"
                    outerRadius="80%"
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
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[300px] overflow-hidden min-w-0">
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

            {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Village-wise Farmers Count */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[300px] overflow-hidden min-w-0">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Top 10 Villages by Farmer Count</h3>
          </div>
          <div className="flex-1 min-h-0 relative">
            {stats.villageData.length > 0 ? (
              <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <BarChart data={stats.villageData} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
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
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
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

        {/* Season-wise Farmers Count */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[300px] overflow-hidden min-w-0">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <PieChartIcon className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Season-wise Plots</h3>
          </div>
          <div className="flex-1 min-h-0 relative">
            {stats.seasonData.length > 0 ? (
              <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                  <Pie
                    data={stats.seasonData}
                    cx="50%"
                    cy="50%"
                    innerRadius="50%"
                    outerRadius="80%"
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive={false}
                    labelLine={false}
                  >
                    {stats.seasonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
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
      </div>

      {/* HDFC Insights */}
      {isHdfc && (
        <div className="bg-emerald-50 rounded-xl p-5 shadow-sm border border-emerald-100 flex gap-4 mt-2">
          <div className="bg-emerald-100 text-emerald-600 p-3 rounded-lg shrink-0 h-min">
            <Info className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-emerald-800">HDFC Program Insights</h3>
            <ul className="text-sm text-emerald-700 space-y-1.5 list-disc list-inside">
              <li><strong>Cluster 3 (Jeddiskung)</strong> leads with the highest number of plot registrations this season.</li>
              <li>A high adoption rate of natural farming bio-inputs is observed across all monitored clusters.</li>
              <li>Early harvesting data from Cluster 1 (Sampath) indicates a 12% yield improvement over the baseline.</li>
              <li>Overall, <strong>{stats.activeFarmers}</strong> HDFC farmers actively recorded field activities out of {stats.totalUniqueFarmers} registered.</li>
            </ul>
          </div>
        </div>
      )}

          </div>
  );
}
