import React, { useMemo } from 'react';
import { Waves, MapPin, Database, Users, TrendingUp } from 'lucide-react';
import { cn } from '../../lib/utils';

export function WaterCollectivesTab({ data, waterCollectives }: { data: any[], waterCollectives: any[] }) {
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
    }> = {};

    waterCollectives.forEach(wc => {
      const props = wc.properties || wc;
      
      const collectiveName = String(props.Water_collective_name || props.water_collective_name || props.Irrigation_site || props.irrigation_site || props.patch || props.Patch || 'Unknown').trim();
      // Priority: Extent (capitalized per ODK Central), then others
      const targetValue = props.Extent || props.Extention || props.extention || props.Extension || props.extension || props.target_extent || props.Target_Extent || props.extent || '0';
      const target = parseFloat(String(targetValue).replace(/[^0-9.]/g, '')) || 0;
      const hhId = String(props.HH_id || props.hh_id || '').trim();

      if (!collectives[collectiveName]) {
        collectives[collectiveName] = {
          name: collectiveName,
          targetExtent: 0,
          coveredExtent: 0,
          hhCount: 0,
          coveredHhCount: 0,
          hhs: new Set()
        };
      }

      collectives[collectiveName].targetExtent += target;
      if (hhId && !collectives[collectiveName].hhs.has(hhId)) {
        collectives[collectiveName].hhs.add(hhId);
        collectives[collectiveName].hhCount++;
      }
    });

    // Map HH_id to Water_collective_name for lookup
    const hhToCollective: Record<string, string> = {};
    waterCollectives.forEach(wc => {
      const props = wc.properties || wc;
      const hhId = String(props.HH_id || props.hh_id || '').trim();
      const collectiveName = String(props.Water_collective_name || props.water_collective_name || props.Irrigation_site || props.irrigation_site || props.patch || props.Patch || 'Unknown').trim();
      if (hhId) hhToCollective[hhId] = collectiveName;
    });

    // Calculate covered extent from crops data matching on hhId (plot_reg-farmer_Id)
    const collectiveCoveredHhs: Record<string, Set<string>> = {};
    
    data.forEach(item => {
      const hhId = String(item.hhId || '').trim();
      const collectiveName = hhToCollective[hhId];
      const area = parseFloat(item.area) || 0;

      if (collectiveName && collectives[collectiveName]) {
        collectives[collectiveName].coveredExtent += area;
        
        if (hhId) {
            if (!collectiveCoveredHhs[collectiveName]) collectiveCoveredHhs[collectiveName] = new Set();
            collectiveCoveredHhs[collectiveName].add(hhId);
        }
      }
    });
    
    Object.keys(collectives).forEach(c => {
        collectives[c].coveredHhCount = collectiveCoveredHhs[c]?.size || 0;
    });

    return Object.values(collectives).sort((a, b) => b.targetExtent - a.targetExtent);
  }, [data, waterCollectives]);

  const totals = useMemo(() => {
    return collectiveStats.reduce((acc, curr) => ({
      target: acc.target + curr.targetExtent,
      covered: acc.covered + curr.coveredExtent,
      hhs: acc.hhs + curr.hhCount,
      coveredHhs: acc.coveredHhs + curr.coveredHhCount
    }), { target: 0, covered: 0, hhs: 0, coveredHhs: 0 });
  }, [collectiveStats]);

  if (waterCollectives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
        <Waves className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-800">No Water Collective Data Found</h3>
        <p className="text-slate-500 text-sm">Make sure the Water_Collectives_DB dataset is populated in ODK Central.</p>
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
                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
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

