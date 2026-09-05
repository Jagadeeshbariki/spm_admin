import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

old_thead = """                  <th className="px-6 py-4">HH ID</th>
                  <th className="px-6 py-4">Farmer Name</th>"""

new_thead = """                  <th className="px-6 py-4">HH ID</th>
                  <th className="px-6 py-4">Farmer Name</th>
                  {activeTab === 'hdfc' && <th className="px-6 py-4">Cluster</th>}"""
content = content.replace(old_thead, new_thead)

old_tdata = """                          <td className="px-6 py-4 font-medium text-slate-700">{row.farmerName || '-'}</td>
                          <td className="px-6 py-4">"""

new_tdata = """                          <td className="px-6 py-4 font-medium text-slate-700">{row.farmerName || '-'}</td>
                          {activeTab === 'hdfc' && (
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {row.cluster || '-'}
                              </span>
                            </td>
                          )}
                          <td className="px-6 py-4">"""
content = content.replace(old_tdata, new_tdata)

old_colspan = """<td colSpan={7} className="p-0 border-b border-slate-200 bg-slate-50/50">"""
new_colspan = """<td colSpan={activeTab === 'hdfc' ? 8 : 7} className="p-0 border-b border-slate-200 bg-slate-50/50">"""
content = content.replace(old_colspan, new_colspan)

old_colspan_empty = """<td colSpan={7} className="px-6 py-12 text-center text-slate-500">"""
new_colspan_empty = """<td colSpan={activeTab === 'hdfc' ? 8 : 7} className="px-6 py-12 text-center text-slate-500">"""
content = content.replace(old_colspan_empty, new_colspan_empty)


with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
