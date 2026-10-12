import React, { useMemo } from 'react';
import { Waves, MapPin, Database, Users, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';

// Helper to find a property by multiple possible keys, case-insensitively and ignoring underscores/spaces
const getFuzzyProp = (props: any, keys: string[]) => {
  if (!props) return undefined;
  
  // 1. Try exact matches first
  for (const k of keys) {
    if (props[k] !== undefined && props[k] !== null && props[k] !== '') return props[k];
  }
  
  // 2. Try normalized matches (lowercase, no spaces, no underscores)
  const normalizedKeys = keys.map(k => k.toLowerCase().replace(/[\s_-]/g, ''));
  const actualKeys = Object.keys(props);
  
  for (const ak of actualKeys) {
    const normalizedAk = ak.toLowerCase().replace(/[\s_-]/g, '');
    if (normalizedKeys.includes(normalizedAk)) {
      if (props[ak] !== undefined && props[ak] !== null && props[ak] !== '') return props[ak];
    }
  }
  
  return undefined;
};

export function WaterCollectivesTab({ data, waterCollectives, loading, error, totalCount = 0 }: { data: any[], waterCollectives: any[], loading?: boolean, error?: string, totalCount?: number }) {
  // data is the crops data (submissions)
  // waterCollectives is the dataset entities
  
  const collectiveStats = useMemo(() => {
    const collectives: Record<string, {
      name: string;
      targetExtent: number;
      coveredExtent: number;
      hhCount: number;
      coveredHhCount: number;
      hhs: Set<string>;
      coveredHhs: Set<string>;
    }> = {};

    const NAME_KEYS = ['Water_collective_name', 'Water Collective Name', 'Irrigation_site', 'Irrigation Site', 'patch', 'Patch', 'Site_Name', 'Site Name', 'Name', 'label', 'Title', 'id', 'Water_Collective_Name', 'datasetId', 'name'];
    const TARGET_KEYS = ['Extent', 'Extention', 'Extension', 'target_extent', 'Target Extent', 'target_area', 'Target Area', 'Area', 'Target_Extent_Acres', 'Acres', 'Target', 'Goal'];
    const HH_KEYS = ['HH_id', 'hh_id', 'HH ID', 'Farmer_ID', 'Farmer ID', 'HHID', 'Farmer_Id', 'plot_reg_farmer_Id', 'farmerId', 'farmer_id'];

    const siteNameToNormalized: Record<string, string> = {};
    const validHhsBySite: Record<string, Set<string>> = {};
    const hhToCollective: Record<string, string> = {};

    // 1. Initialize collectives and PK household IDs strictly from waterCollectives (Entity table)
    waterCollectives.forEach(wc => {
      const props = wc.properties || wc;
      const rawName = getFuzzyProp(props, NAME_KEYS) || props.name || props.identifier;
      if (!rawName) return;
      const collectiveName = String(rawName).trim();
      siteNameToNormalized[collectiveName.toLowerCase()] = collectiveName;

      const targetValue = getFuzzyProp(props, TARGET_KEYS) || props.target || props.extent || '15';
      const target = parseFloat(String(targetValue).replace(/[^0-9.]/g, '')) || 15;

      const hhId = String(getFuzzyProp(props, HH_KEYS) || props.farmerId || props.hhId || '').trim();

      if (!collectives[collectiveName]) {
        collectives[collectiveName] = {
          name: collectiveName,
          targetExtent: 0,
          coveredExtent: 0,
          hhCount: 0,
          coveredHhCount: 0,
          hhs: new Set(),
          coveredHhs: new Set()
        };
        validHhsBySite[collectiveName] = new Set();
      }

      collectives[collectiveName].targetExtent += target;
      if (hhId) {
        collectives[collectiveName].hhs.add(hhId);
        validHhsBySite[collectiveName].add(hhId.toLowerCase());
        hhToCollective[hhId.toLowerCase()] = collectiveName;
      }
    });

    // 2. Match NF Register data (`data`) strictly where HH_id (FK) matches HH_id in Water Collective Entity table (PK)
    data.forEach(item => {
      const hhId = String(item.hhId || getFuzzyProp(item, HH_KEYS) || '').trim();
      if (!hhId) return;

      const collectiveName = hhToCollective[hhId.toLowerCase()];
      if (!collectiveName || !collectives[collectiveName]) {
        return; // Only count if HH_id exists as PK in water collective entity records
      }

      // Verify exact PK-FK match in site
      if (!validHhsBySite[collectiveName]?.has(hhId.toLowerCase())) {
        return;
      }

      const area = parseFloat(item.area || item.Area || item.extent || item.plot_extent || 1.5) || 1.5;

      collectives[collectiveName].coveredExtent += area;
      collectives[collectiveName].coveredHhs.add(hhId);
    });

    // 3. Finalize calculations
    const resultList = Object.values(collectives).map(c => {
      c.hhCount = Math.max(c.hhs.size, 1);
      c.coveredHhCount = c.coveredHhs.size;
      if (c.targetExtent === 0) {
        c.targetExtent = Math.max(c.coveredExtent * 1.2, 10);
      }
      return c;
    });

    return resultList.sort((a, b) => b.coveredExtent - a.coveredExtent);
  }, [data, waterCollectives]);

  const totals = useMemo(() => {
    return collectiveStats.reduce((acc, curr) => ({
      target: acc.target + curr.targetExtent,
      covered: acc.covered + curr.coveredExtent,
      hhs: acc.hhs + curr.hhCount,
      coveredHhs: acc.coveredHhs + curr.coveredHhCount
    }), { target: 0, covered: 0, hhs: 0, coveredHhs: 0 });
  }, [collectiveStats]);

  if (error && waterCollectives.length === 0 && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
        <Waves className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Error Fetching Data</h3>
        <p className="text-slate-500 text-sm mb-4">API Error: {error}. Please check ODK Central permissions.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-8 text-slate-800">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Waves className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest text-slate-600">Total Target Extent</span>
          </div>
          <div>
            <div className="text-4xl font-black text-slate-900 tracking-tight">
              {totals.target.toFixed(2)}
              <span className="text-lg font-medium text-slate-400 ml-2">Acres</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Aggregated goal across {collectiveStats.length} collectives</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Database className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest text-slate-600">Achieved Extent</span>
          </div>
          <div>
            <div className="text-4xl font-black text-emerald-600 tracking-tight">
              {totals.covered.toFixed(2)}
              <span className="text-lg font-medium text-emerald-400 ml-2">Acres</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="h-1.5 flex-1 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${Math.min(100, (totals.covered / (totals.target || 1)) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-bold text-emerald-600">Actual Area</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-sm font-bold uppercase tracking-widest text-slate-600">Completion Percentage</span>
          </div>
          <div>
            <div className="text-4xl font-black text-indigo-600 tracking-tight">
              {((totals.covered / (totals.target || 1)) * 100).toFixed(1)}
              <span className="text-lg font-medium text-indigo-400 ml-1">%</span>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">Overall achievement vs target</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 text-slate-500 mb-1">
            <Users className="w-4 h-4 text-purple-600" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Target Farmers</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totals.hhs}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 text-slate-500 mb-1">
            <Users className="w-4 h-4 text-orange-600" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Covered Farmers</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{totals.coveredHhs}</div>
          <div className="text-[10px] font-bold text-orange-600 mt-1 uppercase tracking-tight">{((totals.coveredHhs / (totals.hhs || 1)) * 100).toFixed(1)}% Coverage</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* ... table ... */}
        <div className="px-6 py-5 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            Water Collective Coverage Analysis
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
            {collectiveStats.length} Collectives
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 font-bold text-[10px] uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Collective Name</th>
                <th className="px-6 py-4">Target (Ac)</th>
                <th className="px-6 py-4">Covered (Ac)</th>
                <th className="px-6 py-4 w-1/4">Achievement %</th>
                <th className="px-6 py-4">HH Target</th>
                <th className="px-6 py-4">HH Covered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {collectiveStats.map((patch, idx) => {
                const achievement = (patch.coveredExtent / (patch.targetExtent || 1)) * 100;
                return (
                  <tr key={patch.name || idx} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-700 group-hover:text-blue-600">{patch.name}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{patch.targetExtent.toFixed(2)}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{patch.coveredExtent.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                achievement >= 80 ? "bg-emerald-500" : achievement >= 50 ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{ width: `${Math.min(100, achievement)}%` }}
                          />
                        </div>
                        <span className={cn(
                          "text-xs font-black min-w-[45px]",
                          achievement >= 80 ? "text-emerald-600" : achievement >= 50 ? "text-amber-600" : "text-red-600"
                        )}>{achievement.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-bold">{patch.hhCount}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black",
                        patch.coveredHhCount === patch.hhCount ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
                      )}>
                        {patch.coveredHhCount}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

