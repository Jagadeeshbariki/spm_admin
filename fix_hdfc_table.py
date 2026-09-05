import re

with open('src/pages/admin/HDFCCropsDashboard.tsx', 'r') as f:
    content = f.read()

# Add Cluster column header
old_thead = """                  <th className="px-6 py-4">HH ID</th>
                  <th className="px-6 py-4">Farmer Name</th>"""

new_thead = """                  <th className="px-6 py-4">HH ID</th>
                  <th className="px-6 py-4">Farmer Name</th>
                  <th className="px-6 py-4">Cluster</th>"""

content = content.replace(old_thead, new_thead)

# Add Cluster column data
old_td = """                          <td className="px-6 py-4 font-medium text-slate-700">{row.farmerName || '-'}</td>
                          <td className="px-6 py-4">
                            <span className={cn("""

new_td = """                          <td className="px-6 py-4 font-medium text-slate-700">{row.farmerName || '-'}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {row.cluster || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn("""

content = content.replace(old_td, new_td)

# Update colSpan for empty states
content = content.replace('colSpan={7}', 'colSpan={8}')

with open('src/pages/admin/HDFCCropsDashboard.tsx', 'w') as f:
    f.write(content)
