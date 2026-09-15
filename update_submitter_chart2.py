import re

with open('src/pages/admin/BYPDashboard.tsx', 'r') as f:
    content = f.read()

target_grid = """{/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">"""
replacement_grid = """{/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">"""
content = content.replace(target_grid, replacement_grid)

target_chart = """                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}"""

new_chart = """                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">No data</div>
                  )}
                </div>
              </div>

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
              </div>
            </div>

            {/* Charts Row 2 */}"""

content = content.replace(target_chart, new_chart)

with open('src/pages/admin/BYPDashboard.tsx', 'w') as f:
    f.write(content)

print("Added Submitter Chart successfully (attempt 2)!")
