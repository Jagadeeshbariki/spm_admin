import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

old_td = """                          <td className="px-6 py-4 font-bold text-slate-900">{row.hhId || '-'}</td>
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
                          </td>"""

new_td = """                          <td className="px-6 py-4 font-bold text-slate-900">
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
                          </td>"""

content = content.replace(old_td, new_td)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
