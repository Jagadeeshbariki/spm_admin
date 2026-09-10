import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

start_idx = content.find('{plot.activityPhotos && plot.activityPhotos.length > 0 && (')
end_idx = content.find('                                      </div>\n                                    );\n                                  })}')

if start_idx != -1 and end_idx != -1:
    new_jsx = """{plot.activitiesData && plot.activitiesData.length > 0 && (
                                              <div className="border-t border-slate-200 pt-6 mt-6">
                                                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                  <Activity className="w-4 h-4 text-blue-600" /> Activities & Field Visits
                                                </h4>
                                                <div className="space-y-4">
                                                  {plot.activitiesData.map((act: any, i: number) => {
                                                    const hasBioInputs = act.application_bio_input && act.application_bio_input.length > 0;
                                                    const hasHarvests = act.harvesting && act.harvesting.length > 0;
                                                    const hasCCE = act.cce && (act.cce.date_cce || act.cce.sqmtr_5_5_kgs);
                                                    
                                                    return (
                                                      <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                                                        {/* Left: Photo */}
                                                        <div className="w-full md:w-1/3 lg:w-1/4">
                                                          {act.displayPhoto ? (
                                                            <div 
                                                              className="relative group w-full h-40 rounded-lg overflow-hidden border border-slate-300 shadow-sm cursor-pointer bg-slate-100"
                                                              onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                setPreviewImage(`/api/odk/image?v=4&submissionId=${encodeURIComponent(act.displaySubmissionId)}&filename=${encodeURIComponent(act.displayPhoto)}`); 
                                                              }}
                                                            >
                                                              <img 
                                                                src={`/api/odk/image?v=4&submissionId=${encodeURIComponent(act.displaySubmissionId)}&filename=${encodeURIComponent(act.displayPhoto)}`} 
                                                                alt="Activity Photo" 
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                                                                loading="lazy" 
                                                              />
                                                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                                                                <ZoomIn className="w-4 h-4" /> View
                                                              </div>
                                                            </div>
                                                          ) : (
                                                            <div className="w-full h-40 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
                                                              No Photo
                                                            </div>
                                                          )}
                                                        </div>

                                                        {/* Right: Details */}
                                                        <div className="flex-1">
                                                          <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2">
                                                            <div>
                                                              <h5 className="font-bold text-slate-800 capitalize text-base">{act.displayActivity.replace(/_/g, ' ')}</h5>
                                                              <span className="text-xs font-medium text-slate-500">{act.displayDate}</span>
                                                            </div>
                                                          </div>

                                                          <div className="space-y-4">
                                                            {hasBioInputs && (
                                                              <div>
                                                                <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bio Inputs Applied</h6>
                                                                <div className="space-y-2">
                                                                  {act.application_bio_input.map((bi: any, j: number) => (
                                                                    <div key={j} className="text-sm bg-blue-50/50 p-3 rounded border border-blue-100">
                                                                      <div className="font-semibold text-slate-700">{bi.bio_input_name || bi.input_name || '-'}</div>
                                                                      <div className="text-slate-600 flex justify-between mt-1">
                                                                        <span>Applied: {bi.date_applied || bi.date || '-'}</span>
                                                                        <span className="font-medium text-blue-700">{bi.qty_applied || bi.qty || bi.qty_units || '-'} {bi.unit || bi.units || ''}</span>
                                                                      </div>
                                                                    </div>
                                                                  ))}
                                                                </div>
                                                              </div>
                                                            )}

                                                            {hasHarvests && (
                                                              <div>
                                                                <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Harvesting Data</h6>
                                                                <div className="space-y-2">
                                                                  {act.harvesting.map((h: any, j: number) => (
                                                                    <div key={j} className="text-sm bg-green-50/50 p-3 rounded border border-green-100">
                                                                      <div className="font-semibold text-slate-700">{h.crop_harvested || h.crop || 'Crop'}</div>
                                                                      <div className="text-slate-600 flex justify-between mt-1">
                                                                        <span>Harvested: {h.date_harvest || h.date || '-'}</span>
                                                                        <span className="font-medium text-green-700">{h.yield_quantity || h.qty || h.yield_Qntl || h.yield_qntl || '-'} {h.unit || h.units || 'Kg'}</span>
                                                                      </div>
                                                                    </div>
                                                                  ))}
                                                                </div>
                                                              </div>
                                                            )}

                                                            {hasCCE && (
                                                              <div>
                                                                <h6 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Crop Cutting Experiment</h6>
                                                                <div className="text-sm bg-amber-50/50 p-3 rounded border border-amber-100">
                                                                  <div className="text-slate-600 flex justify-between">
                                                                    <span>Date: {act.cce.date_cce || '-'}</span>
                                                                    <span className="font-medium text-amber-700">Yield: {act.cce.sqmtr_5_5_kgs || '-'} Kgs (5x5 Sqm)</span>
                                                                  </div>
                                                                </div>
                                                              </div>
                                                            )}

                                                            {!hasBioInputs && !hasHarvests && !hasCCE && (
                                                              <div className="text-sm text-slate-500 italic">
                                                                General field visit / observation
                                                              </div>
                                                            )}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            )}
"""
    new_content = content[:start_idx] + new_jsx + "\n" + content[end_idx:]
    with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
        f.write(new_content)
    print("Successfully replaced block!")
else:
    print("Could not find start or end index.")
