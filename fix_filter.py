import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

old_filter = """    return data.filter(item => {
      if (selectedBlock !== 'All' && item.block !== selectedBlock) return false;
      if (selectedGp !== 'All' && item.gp !== selectedGp) return false;
      if (selectedVillage !== 'All' && item.village !== selectedVillage) return false;
      if (selectedCropMode !== 'All' && item.cropMode !== selectedCropMode) return false;
      
      if (hasActivities === 'Yes') {"""

new_filter = """    return data.filter(item => {
      if (selectedBlock !== 'All' && item.block !== selectedBlock) return false;
      if (selectedGp !== 'All' && item.gp !== selectedGp) return false;
      if (selectedVillage !== 'All' && item.village !== selectedVillage) return false;
      if (selectedCropMode !== 'All' && item.cropMode !== selectedCropMode) return false;
      if (selectedYear !== 'All' && item.year !== selectedYear) return false;
      if (selectedSeason !== 'All' && item.season !== selectedSeason) return false;
      
      if (hasActivities === 'Yes') {"""

content = content.replace(old_filter, new_filter)

old_dep = "  }, [data, selectedBlock, selectedGp, selectedVillage, selectedCropMode, hasActivities, searchTerm]);"
new_dep = "  }, [data, selectedBlock, selectedGp, selectedVillage, selectedCropMode, hasActivities, selectedYear, selectedSeason, searchTerm]);"
content = content.replace(old_dep, new_dep)

old_dep2 = "  }, [selectedBlock, selectedGp, selectedVillage, selectedCropMode, hasActivities, searchTerm]);"
new_dep2 = "  }, [selectedBlock, selectedGp, selectedVillage, selectedCropMode, hasActivities, selectedYear, selectedSeason, searchTerm]);"
content = content.replace(old_dep2, new_dep2)

old_clear_cond = "hasActivities !== 'All' || searchTerm !== '')"
new_clear_cond = "hasActivities !== 'All' || selectedYear !== 'All' || selectedSeason !== 'All' || searchTerm !== '')"
content = content.replace(old_clear_cond, new_clear_cond)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
