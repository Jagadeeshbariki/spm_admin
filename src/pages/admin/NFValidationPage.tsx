import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { flatten } from 'flat';

export function NFValidationPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [regResponse, actResponse] = await Promise.all([
          fetch('/api/odk/data?formId=NF-%20Register'),
          fetch('/api/odk/data?formId=NF-%20Activities')
        ]);

        if (!regResponse.ok || !actResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const regData = await regResponse.json();
        const actData = await actResponse.json();

        const registrations = Array.isArray(regData.value) ? regData.value : [];
        const activities = Array.isArray(actData.value) ? actData.value : [];

        // Build a map of registrations by meta-instanceID
        const regMap = new Map();
        registrations.forEach((reg: any) => {
          const flat = flatten(reg) as any;
          const id = reg.__id || reg.meta?.instanceID?.replace('uuid:', '');
          const farmerId = flat['plot_reg-farmer_Id'] || flat['plot_reg_farmer_Id'] || flat['farmer_Id'] || flat['HH_id'] || flat['hhid'] || '';
          const farmerName = flat['plot_reg-farmer_name'] || flat['farmer_name'] || flat['name'] || '';
          const year = flat['plot_reg-year_only'] || flat['plot_reg-year'] || flat['year'] || '';
          const season = flat['plot_reg-season'] || flat['season'] || '';
          
          regMap.set(id, {
            id,
            farmerId,
            farmerName,
            year,
            season
          });
        });

        const validationResults: any[] = [];

        activities.forEach((act: any) => {
          const pDetails = act.Primary_details || {};
          const plotId = pDetails.plot_id?.replace('uuid:', '');
          const farmerId = pDetails.farmer_select || pDetails.farmer_name || '';
          const year = pDetails.text_year || pDetails.year || '';
          const season = pDetails.season || pDetails.data_season || '';

          let status = 'UNMATCHED';
          const match = regMap.get(plotId);

          if (!plotId) {
            status = 'MISSING_PLOT_ID';
          } else if (match) {
            status = 'MATCHED';
          } else {
            status = 'ORPHAN_ACTIVITY';
          }

          validationResults.push({
            activityId: act.__id || act.meta?.instanceID?.replace('uuid:', ''),
            plotId: plotId || 'N/A',
            regId: match ? match.id : 'N/A',
            farmerId,
            year,
            season,
            status
          });
        });

        setData(validationResults);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        <span className="ml-3 text-slate-600 font-medium">Validating relationships...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-xl">
        <h3 className="font-bold">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-slate-50">
        <h2 className="text-lg font-bold text-slate-900">Data Link Validation</h2>
        <p className="text-sm text-slate-500 mt-1">Verifying relationship between NF Activities and NF Register using Primary_details-plot_id.</p>
      </div>
      <div className="overflow-auto max-h-[70vh]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#F8FAFC] text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
            <tr>
              <th className="px-6 py-4">Register ID (Matched)</th>
              <th className="px-6 py-4">Activity Plot ID</th>
              <th className="px-6 py-4">Farmer ID (Activity)</th>
              <th className="px-6 py-4">Year (Activity)</th>
              <th className="px-6 py-4">Season (Activity)</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-700">{row.regId}</td>
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{row.plotId}</td>
                <td className="px-6 py-4 text-slate-700">{row.farmerId}</td>
                <td className="px-6 py-4 text-slate-700">{row.year}</td>
                <td className="px-6 py-4 text-slate-700">{row.season}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${
                    row.status === 'MATCHED' ? 'bg-emerald-100 text-emerald-800' :
                    row.status === 'MISSING_PLOT_ID' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
