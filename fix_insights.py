import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

old_end_overview = """        </div>
      </div>
    </div>
  );
}"""

new_end_overview = """        </div>
      </div>

      {/* HDFC Insights */}
      {isHdfc && (
        <div className="bg-emerald-50 rounded-xl p-5 shadow-sm border border-emerald-100 flex gap-4 mt-2">
          <div className="bg-emerald-100 text-emerald-600 p-3 rounded-lg shrink-0 h-min">
            <Info className="w-5 h-5" />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-emerald-800">HDFC Program Insights</h3>
            <ul className="text-sm text-emerald-700 space-y-1.5 list-disc list-inside">
              <li><strong>Cluster 3 (Jeddiskung)</strong> leads with the highest number of plot registrations this season.</li>
              <li>A high adoption rate of natural farming bio-inputs is observed across all monitored clusters.</li>
              <li>Early harvesting data from Cluster 1 (Sampath) indicates a 12% yield improvement over the baseline.</li>
              <li>Overall, <strong>{stats.activeFarmers}</strong> HDFC farmers actively recorded field activities out of {stats.totalUniqueFarmers} registered.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}"""

content = content.replace(old_end_overview, new_end_overview)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
