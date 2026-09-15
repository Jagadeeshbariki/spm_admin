import re

with open('src/pages/admin/BYPDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Update the misStats calculation to include submitter data
# Find the start of variables inside misStats
target_init = "const blockSubs: Record<string, number> = {};"
replacement_init = target_init + "\n    const submitterSubs: Record<string, number> = {};"
content = content.replace(target_init, replacement_init)

# Find where blockSubs is populated
target_populate = """      if (b && b !== 'Unknown') {
         blockSubs[b] = (blockSubs[b] || 0) + 1;
      }"""
replacement_populate = target_populate + """

      const submitterName = String(item.__system?.submitterName || item.data_submitter || 'Unknown').trim();
      if (submitterName) {
         submitterSubs[submitterName] = (submitterSubs[submitterName] || 0) + 1;
      }"""
content = content.replace(target_populate, replacement_populate)

# Find where data arrays are constructed
target_arrays = "const blockData = Object.entries(blockSubs).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);"
replacement_arrays = target_arrays + "\n    const submitterData = Object.entries(submitterSubs).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);"
content = content.replace(target_arrays, replacement_arrays)

# Find the return block
target_return = """      monthlyData,
      blockData,"""
replacement_return = """      monthlyData,
      blockData,
      submitterData,"""
content = content.replace(target_return, replacement_return)


# 2. Update the JSX to add the third chart to the row with Monthly Submissions and Submissions by Block
# Look for the grid grid-cols-1 lg:grid-cols-2 gap-3 containing Monthly Submissions
target_grid = """{/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">"""
replacement_grid = """{/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">"""
content = content.replace(target_grid, replacement_grid)

# Add the new chart after Submissions by Block
target_chart_end = """                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>"""

new_chart = """
              {/* Submissions by Submitter (Bar) */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 h-[280px] flex flex-col">
                <h3 className="font-bold text-slate-800 text-xs mb-3">Submissions by Submitter</h3>
                <div className="flex-1 min-h-0">
                  {misStats.submitterData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" debounce={50}>
                      <BarChart data={misStats.submitterData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} dy={10} angle={-35} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="count" name="Submissions" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
                          <LabelList dataKey="count" position="top" style={{ fontSize: '10px', fill: '#64748b', fontWeight: 'bold' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>"""

# Because `target_chart_end` might match multiple times, let's use regex or string replace with count=1 after 'Submissions by Block'
parts = content.split('Submissions by Block')
if len(parts) > 1:
    sub_parts = parts[1].split('</div>\n              </div>', 1)
    if len(sub_parts) > 1:
        # Reconstruct
        content = parts[0] + 'Submissions by Block' + sub_parts[0] + '</div>\n              </div>' + new_chart + sub_parts[1]

with open('src/pages/admin/BYPDashboard.tsx', 'w') as f:
    f.write(content)

print("Added Submitter Chart successfully!")
