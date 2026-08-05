import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

old_accordion = """                                <div className="space-y-1">
                                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Area</div>
                                  <div className="text-sm font-medium text-slate-900">{row.area}</div>
                                </div>
                              </div>
                            </td>
                          </tr>"""

new_accordion = """                                <div className="space-y-1">
                                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Area</div>
                                  <div className="text-sm font-medium text-slate-900">{row.area}</div>
                                </div>
                              </div>
                              
                              {/* Activities Section */}
                              {(row.bioInputs.length > 0 || row.harvests.length > 0) && (
                                <div className="px-16 pb-6 pt-0 animate-in slide-in-from-top-2 duration-200">
                                  <div className="border-t border-slate-200 pt-6 mt-2">
                                    <h4 className="text-sm font-bold text-slate-900 mb-4">Activities & Data</h4>
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
                                                <div className="text-sm text-slate-600 flex justify-between">
                                                  <span>Qty: {bi.Dhravajeevamrutham_Quantity || bi.qty || '-'} {bi.unit || ''}</span>
                                                  <span>Source: {bi.bioinputs_source || '-'}</span>
                                                </div>
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
                                                  Yield: <span className="font-medium text-emerald-600">{h.yield_Qntl || h.yield || '-'} Qntl</span>
                                                </div>
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
                          </tr>"""

content = content.replace(old_accordion, new_accordion)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
