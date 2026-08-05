import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Add state for the new filter
old_state = """  const [selectedVillage, setSelectedVillage] = useState('All');
  const [selectedCropMode, setSelectedCropMode] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');"""

new_state = """  const [selectedVillage, setSelectedVillage] = useState('All');
  const [selectedCropMode, setSelectedCropMode] = useState('All');
  const [hasActivities, setHasActivities] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');"""

content = content.replace(old_state, new_state)

# 2. Add filter logic
old_filter = """    return data.filter(item => {
      if (selectedBlock !== 'All' && item.block !== selectedBlock) return false;
      if (selectedGp !== 'All' && item.gp !== selectedGp) return false;
      if (selectedVillage !== 'All' && item.village !== selectedVillage) return false;
      if (selectedCropMode !== 'All' && item.cropMode !== selectedCropMode) return false;"""

new_filter = """    return data.filter(item => {
      if (selectedBlock !== 'All' && item.block !== selectedBlock) return false;
      if (selectedGp !== 'All' && item.gp !== selectedGp) return false;
      if (selectedVillage !== 'All' && item.village !== selectedVillage) return false;
      if (selectedCropMode !== 'All' && item.cropMode !== selectedCropMode) return false;
      
      if (hasActivities === 'Yes') {
        if (item.bioInputs.length === 0 && item.harvests.length === 0) return false;
      } else if (hasActivities === 'No') {
        if (item.bioInputs.length > 0 || item.harvests.length > 0) return false;
      }"""

content = content.replace(old_filter, new_filter)

# 3. Add to dependencies
old_deps = "}, [data, selectedBlock, selectedGp, selectedVillage, selectedCropMode, searchTerm]);"
new_deps = "}, [data, selectedBlock, selectedGp, selectedVillage, selectedCropMode, hasActivities, searchTerm]);"
content = content.replace(old_deps, new_deps)

# 4. Add reset pagination dependencies
old_reset = "}, [selectedBlock, selectedGp, selectedVillage, selectedCropMode, searchTerm]);"
new_reset = "}, [selectedBlock, selectedGp, selectedVillage, selectedCropMode, hasActivities, searchTerm]);"
content = content.replace(old_reset, new_reset)

# 5. Add clear filter logic
old_clear_cond = "(selectedBlock !== 'All' || selectedGp !== 'All' || selectedVillage !== 'All' || selectedCropMode !== 'All' || searchTerm !== '')"
new_clear_cond = "(selectedBlock !== 'All' || selectedGp !== 'All' || selectedVillage !== 'All' || selectedCropMode !== 'All' || hasActivities !== 'All' || searchTerm !== '')"
content = content.replace(old_clear_cond, new_clear_cond)

old_clear_exec = """                    setSelectedVillage('All');
                    setSelectedCropMode('All');
                    setSearchTerm('');"""
new_clear_exec = """                    setSelectedVillage('All');
                    setSelectedCropMode('All');
                    setHasActivities('All');
                    setSearchTerm('');"""
content = content.replace(old_clear_exec, new_clear_exec)

# 6. Add UI Select
old_ui = """            <FilterSelect 
              label="Crop Mode" 
              value={selectedCropMode} 
              onChange={setSelectedCropMode} 
              options={cropModes} 
            />
          </div>"""

new_ui = """            <FilterSelect 
              label="Crop Mode" 
              value={selectedCropMode} 
              onChange={setSelectedCropMode} 
              options={cropModes} 
            />
            <FilterSelect 
              label="Has Activities" 
              value={hasActivities} 
              onChange={setHasActivities} 
              options={['Yes', 'No']} 
            />
          </div>"""

content = content.replace(old_ui, new_ui)
content = content.replace("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4")

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
