with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

target1 = """        {/* Bio Inputs Applied */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[300px] overflow-hidden min-w-0">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Bio Inputs Quantity Used</h3>
          </div>"""

replacement1 = """        {/* Bio Inputs Applied */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[300px] overflow-hidden min-w-0">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <FlaskConical className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              Bio Inputs Quantity Used
              <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full">
                from {stats.bioInputFarmersCount} farmers
              </span>
            </h3>
          </div>"""

target2 = """        {/* Harvest Data */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[300px] overflow-hidden min-w-0">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm">Harvest Quantity by Crop</h3>
          </div>"""

replacement2 = """        {/* Harvest Data */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col h-[300px] overflow-hidden min-w-0">
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <Wheat className="w-4 h-4 text-slate-400" />
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              Harvest Quantity by Crop
              <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full">
                from {stats.harvestFarmersCount} farmers
              </span>
            </h3>
          </div>"""

if target1 in content and target2 in content:
    content = content.replace(target1, replacement1)
    content = content.replace(target2, replacement2)
    with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
        f.write(content)
    print("UI updated!")
else:
    print("Failed to find targets for UI update")

