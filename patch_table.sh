#!/bin/bash
cat src/pages/admin/CropsDashboard.tsx | sed '/{\/\* Data Table \*\/}/,$d' > new_file.tsx

cat << 'INNER_EOF' >> new_file.tsx
        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="overflow-x-auto custom-scrollbar">
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
                    const isExpanded = expandedRow === idx;
                    return (
                      <React.Fragment key={idx}>
                        <tr 
                          onClick={() => setExpandedRow(isExpanded ? null : idx)}
                          className={cn(
                            "transition-colors group cursor-pointer",
                            isExpanded ? "bg-slate-50" : "hover:bg-slate-50"
                          )}
                        >
                          <td className="px-6 py-4 text-slate-400">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">{row.hhId || '-'}</td>
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
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string, value: string, onChange: (val: string) => void, options: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label>
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer hover:bg-slate-100 transition-colors w-full"
      >
        <option value="All">All {label}s</option>
        {options.filter(Boolean).map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
INNER_EOF
mv new_file.tsx src/pages/admin/CropsDashboard.tsx
