import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Add MultiSelectDropdown component before FilterSelect
multi_select_code = """
function MultiSelectDropdown({ label, selected, onChange, options, className }: { label: string, selected: string[], onChange: (val: string[]) => void, options: string[], className?: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter(v => v !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between shadow-sm min-w-[140px]"
      >
        <span className="truncate pr-2">
          {selected.length === 0 ? label : `${label} (${selected.length})`}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </div>
      {isOpen && (
        <div className="absolute z-[9999] mt-1 w-full min-w-[220px] max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg py-1">
          {options.length === 0 && <div className="px-3 py-2 text-sm text-slate-500">No options</div>}
          {options.map(opt => (
            <label key={opt} className="flex items-center px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="w-4 h-4 text-emerald-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 rounded focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm text-slate-700 dark:text-slate-200">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect"""

content = content.replace("function FilterSelect", multi_select_code)

# Now replace the FilterSelect usage in Filters Panel
# We need to replace only specific ones.
filters_old = """          <div className="flex flex-nowrap overflow-x-auto gap-4 pb-2 snap-x custom-scrollbar">
            <FilterSelect 
              label="Year" 
              value={selectedYear} 
              onChange={setSelectedYear} 
              options={years} 
              className="min-w-[140px] shrink-0"
            />
            <FilterSelect 
              label="Season" 
              value={selectedSeason} 
              onChange={setSelectedSeason} 
              options={seasons} 
              className="min-w-[140px] shrink-0"
            />
            <FilterSelect 
              label="Block" 
              value={selectedBlock} 
              onChange={setSelectedBlock} 
              options={blocks} 
              className="min-w-[150px] shrink-0"
            />
            <FilterSelect 
              label="Gram Panchayat (GP)" 
              value={selectedGp} 
              onChange={setSelectedGp} 
              options={gps} 
              className="min-w-[160px] shrink-0"
            />
            <FilterSelect 
              label="Village" 
              value={selectedVillage} 
              onChange={setSelectedVillage} 
              options={villages} 
              className="min-w-[150px] shrink-0"
            />
            <FilterSelect 
              label="Crop Mode" 
              value={selectedCropMode} 
              onChange={setSelectedCropMode} 
              options={cropModes} 
              className="min-w-[150px] shrink-0"
            />
            <FilterSelect 
              label="Has Activities" 
              value={hasActivities} 
              onChange={setHasActivities} 
              options={['Yes', 'No']} 
              className="min-w-[140px] shrink-0"
            />
          </div>"""

filters_new = """          <div className="flex flex-wrap lg:flex-nowrap overflow-x-visible gap-3 pb-2 w-full">
            <MultiSelectDropdown 
              label="Year" 
              selected={selectedYear} 
              onChange={setSelectedYear} 
              options={years} 
              className="flex-1 min-w-[120px]"
            />
            <MultiSelectDropdown 
              label="Season" 
              selected={selectedSeason} 
              onChange={setSelectedSeason} 
              options={seasons} 
              className="flex-1 min-w-[130px]"
            />
            <MultiSelectDropdown 
              label="Block" 
              selected={selectedBlock} 
              onChange={setSelectedBlock} 
              options={blocks} 
              className="flex-1 min-w-[140px]"
            />
            <MultiSelectDropdown 
              label="Gram Panchayat" 
              selected={selectedGp} 
              onChange={setSelectedGp} 
              options={gps} 
              className="flex-1 min-w-[160px]"
            />
            <MultiSelectDropdown 
              label="Village" 
              selected={selectedVillage} 
              onChange={setSelectedVillage} 
              options={villages} 
              className="flex-1 min-w-[150px]"
            />
            <MultiSelectDropdown 
              label="Crop Mode" 
              selected={selectedCropMode} 
              onChange={setSelectedCropMode} 
              options={cropModes} 
              className="flex-1 min-w-[150px]"
            />
            <FilterSelect 
              label="Has Activities" 
              value={hasActivities} 
              onChange={setHasActivities} 
              options={['Yes', 'No']} 
              className="flex-1 min-w-[140px]"
            />
          </div>"""

content = content.replace(filters_old, filters_new)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

print("Patched filter rendering.")
