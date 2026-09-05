import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

old_end_overview = """            </ul>
          </div>
        </div>
      )}
    </div>
  );
}"""

new_end_overview = """            </ul>
          </div>
        </div>
      )}

      {/* Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Table 1: Crop Modes */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-800 text-sm">
            2026- Kharif - Crop Modes
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Block</th>
                  <th className="px-4 py-3">Crop Model</th>
                  <th className="px-4 py-3 text-right">Plots Count</th>
                  <th className="px-4 py-3 text-right">Extent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.table1Data.map((blockData, bIdx) => (
                  <React.Fragment key={bIdx}>
                    {blockData.modes.map((modeData, mIdx) => (
                      <tr key={`${bIdx}-${mIdx}`} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2 font-medium text-slate-700">
                          {mIdx === 0 && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-3.5 h-3.5 bg-slate-200 rounded flex items-center justify-center text-[10px] text-slate-600 font-bold">-</div>
                              {blockData.block}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-slate-600">{modeData.mode}</td>
                        <td className="px-4 py-2 text-right font-medium text-slate-800">{modeData.count}</td>
                        <td className="px-4 py-2 text-right font-medium text-slate-800">{modeData.area.toFixed(2)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                {/* Grand Total */}
                <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300">
                  <td className="px-4 py-3" colSpan={2}>Grand Total</td>
                  <td className="px-4 py-3 text-right">
                    {stats.table1Data.reduce((acc, curr) => acc + curr.count, 0)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {stats.table1Data.reduce((acc, curr) => acc + curr.area, 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: NF Cotton Status */}
        {isHdfc && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-800 text-sm">
              2026- Kharif - NF Cotton Status
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Block</th>
                    <th className="px-4 py-3">Submitter Name</th>
                    <th className="px-4 py-3 text-right">Number of plots</th>
                    <th className="px-4 py-3 text-right">Extent covered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.table2Data.map((blockData, bIdx) => (
                    <React.Fragment key={bIdx}>
                      {blockData.submitters.map((subData, sIdx) => (
                        <tr key={`${bIdx}-${sIdx}`} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2 font-medium text-slate-700">
                            {sIdx === 0 && (
                              <div className="flex items-center gap-1.5">
                                <div className="w-3.5 h-3.5 bg-slate-200 rounded flex items-center justify-center text-[10px] text-slate-600 font-bold">-</div>
                                {blockData.block}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2 text-slate-600">{subData.name}</td>
                          <td className="px-4 py-2 text-right font-medium text-slate-800">{subData.count}</td>
                          <td className="px-4 py-2 text-right font-medium text-slate-800">{subData.area.toFixed(2)}</td>
                        </tr>
                      ))}
                      {/* Block Total */}
                      <tr className="bg-slate-50 font-semibold text-slate-800 border-t border-slate-200">
                        <td className="px-4 py-2" colSpan={2}>{blockData.block} Total</td>
                        <td className="px-4 py-2 text-right">{blockData.count}</td>
                        <td className="px-4 py-2 text-right">{blockData.area.toFixed(2)}</td>
                      </tr>
                    </React.Fragment>
                  ))}
                  {/* Grand Total */}
                  <tr className="bg-slate-100 font-bold text-slate-900 border-t border-slate-300">
                    <td className="px-4 py-3" colSpan={2}>Grand Total</td>
                    <td className="px-4 py-3 text-right">
                      {stats.table2Data.reduce((acc, curr) => acc + curr.count, 0)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {stats.table2Data.reduce((acc, curr) => acc + curr.area, 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}"""

content = content.replace(old_end_overview, new_end_overview)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
