const fs = require('fs');

function patchRows() {
  const file = 'src/pages/admin/CropsDashboard.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // Replace from `paginatedData.map((row, idx) => {`
  // To the end of `</React.Fragment>`
  
  const startTag = 'paginatedData.map((row, idx) => {';
  const endTag = '                      </React.Fragment>';
  
  const startIdx = content.indexOf(startTag);
  const endIdx = content.indexOf(endTag, startIdx) + endTag.length;
  
  if (startIdx === -1 || endIdx === -1) {
    console.error("Could not find bounds");
    return;
  }
  
  const newRowLogic = `paginatedData.map((group, idx) => {
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
                                              <span className="text-sm font-medium text-slate-700">{plot.cropMode || 'Unknown'}</span>
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
                                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      window.open(\`/api/odk/image?submissionId=\${encodeURIComponent(plot.plotSubmissionId)}&filename=\${encodeURIComponent(plot.plotPhoto)}&formId=\${encodeURIComponent(plot.plotFormId)}\`, '_blank');
                                                    }}
                                                  >
                                                    <Sprout className="w-3 h-3" /> View Plot Photo
                                                  </button>
                                                </h4>
                                                <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Plot Registration Photo</h5>
                                                  <img onClick={(e) => { e.stopPropagation(); setPreviewImage(\`/api/odk/image?submissionId=\${encodeURIComponent(plot.plotSubmissionId)}&filename=\${encodeURIComponent(plot.plotPhoto)}&formId=\${encodeURIComponent(plot.plotFormId)}\`); }} src={\`/api/odk/image?submissionId=\${encodeURIComponent(plot.plotSubmissionId)}&filename=\${encodeURIComponent(plot.plotPhoto)}&formId=\${encodeURIComponent(plot.plotFormId)}\`} alt="Plot Registration" className="w-full max-w-sm h-48 object-cover rounded-lg shadow-sm border border-slate-300 cursor-pointer hover:opacity-90 transition-opacity" loading="lazy" />
                                                </div>
                                              </div>
                                            )}

                                            {(plot.bioInputs.length > 0 || plot.harvests.length > 0) && (
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
                                                                <img onClick={(e) => { e.stopPropagation(); setPreviewImage(\`/api/odk/image?submissionId=\${encodeURIComponent(bi.submissionId)}&filename=\${encodeURIComponent(bi.photo)}&formId=\${encodeURIComponent(bi.formId || 'NF- Activities')}\`); }} src={\`/api/odk/image?submissionId=\${encodeURIComponent(bi.submissionId)}&filename=\${encodeURIComponent(bi.photo)}&formId=\${encodeURIComponent(bi.formId || 'NF- Activities')}\`} alt="Bio Input" className="w-full h-32 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity" loading="lazy" />
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
                                                                <img onClick={(e) => { e.stopPropagation(); setPreviewImage(\`/api/odk/image?submissionId=\${encodeURIComponent(h.submissionId)}&filename=\${encodeURIComponent(h.photo)}&formId=\${encodeURIComponent(h.formId || 'NF- Activities')}\`); }} src={\`/api/odk/image?submissionId=\${encodeURIComponent(h.submissionId)}&filename=\${encodeURIComponent(h.photo)}&formId=\${encodeURIComponent(h.formId || 'NF- Activities')}\`} alt="Harvest" className="w-full h-32 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity" loading="lazy" />
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
                      </React.Fragment>`;

  content = content.substring(0, startIdx) + newRowLogic + content.substring(endIdx);
  fs.writeFileSync(file, content, 'utf8');
}
patchRows();
console.log("Success phase 2");
