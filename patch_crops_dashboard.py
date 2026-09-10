import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Replace states
content = re.sub(
    r"const \[selectedBlock, setSelectedBlock\] = useState\('All'\);",
    "const [selectedBlock, setSelectedBlock] = useState<string[]>([]);",
    content
)
content = re.sub(
    r"const \[selectedGp, setSelectedGp\] = useState\('All'\);",
    "const [selectedGp, setSelectedGp] = useState<string[]>([]);",
    content
)
content = re.sub(
    r"const \[selectedVillage, setSelectedVillage\] = useState\('All'\);",
    "const [selectedVillage, setSelectedVillage] = useState<string[]>([]);",
    content
)
content = re.sub(
    r"const \[selectedCropMode, setSelectedCropMode\] = useState\('All'\);",
    "const [selectedCropMode, setSelectedCropMode] = useState<string[]>([]);",
    content
)
content = re.sub(
    r"const \[selectedYear, setSelectedYear\] = useState\('All'\);",
    "const [selectedYear, setSelectedYear] = useState<string[]>([]);",
    content
)
content = re.sub(
    r"const \[selectedSeason, setSelectedSeason\] = useState\('All'\);",
    "const [selectedSeason, setSelectedSeason] = useState<string[]>([]);",
    content
)

# 2. Replace the availableOptions logic (formerly just options)
options_old = """  const { blocks, gps, villages, cropModes, years, seasons } = useMemo(() => {
    const bSet = new Set<string>();
    const gSet = new Set<string>();
    const vSet = new Set<string>();
    const cSet = new Set<string>();
    const ySet = new Set<string>();
    const sSet = new Set<string>();
    data.forEach(item => {
      if (item.block) bSet.add(item.block);
      if (item.gp) gSet.add(item.gp);
      if (item.village) vSet.add(item.village);
      if (item.cropMode) cSet.add(item.cropMode);
      if (item.year) ySet.add(item.year);
      if (item.season) sSet.add(item.season);
    });
    return { 
      blocks: Array.from(bSet).sort(), 
      gps: Array.from(gSet).sort(), 
      villages: Array.from(vSet).sort(), 
      cropModes: Array.from(cSet).sort(),
      years: Array.from(ySet).sort(),
      seasons: Array.from(sSet).sort()
    };
  }, [data]);"""

options_new = """  const { blocks, gps, villages, cropModes, years, seasons } = useMemo(() => {
    const bSet = new Set<string>();
    const gSet = new Set<string>();
    const vSet = new Set<string>();
    const cSet = new Set<string>();
    const ySet = new Set<string>();
    const sSet = new Set<string>();
    
    data.forEach(item => {
      const yearMatch = selectedYear.length === 0 || selectedYear.includes(item.year);
      const seasonMatch = selectedSeason.length === 0 || selectedSeason.includes(item.season);
      const blockMatch = selectedBlock.length === 0 || selectedBlock.includes(item.block);
      const gpMatch = selectedGp.length === 0 || selectedGp.includes(item.gp);
      const villMatch = selectedVillage.length === 0 || selectedVillage.includes(item.village);
      
      if (item.year) ySet.add(item.year);
      if (yearMatch && item.season) sSet.add(item.season);
      if (yearMatch && seasonMatch && item.block) bSet.add(item.block);
      if (yearMatch && seasonMatch && blockMatch && item.gp) gSet.add(item.gp);
      if (yearMatch && seasonMatch && blockMatch && gpMatch && item.village) vSet.add(item.village);
      if (yearMatch && seasonMatch && blockMatch && gpMatch && villMatch && item.cropMode) cSet.add(item.cropMode);
    });
    
    return { 
      blocks: Array.from(bSet).sort(), 
      gps: Array.from(gSet).sort(), 
      villages: Array.from(vSet).sort(), 
      cropModes: Array.from(cSet).sort(),
      years: Array.from(ySet).sort(),
      seasons: Array.from(sSet).sort()
    };
  }, [data, selectedYear, selectedSeason, selectedBlock, selectedGp, selectedVillage]);"""

content = content.replace(options_old, options_new)

# 3. Replace filtering logic
filter_old = """      if (selectedBlock !== 'All' && item.block !== selectedBlock) return false;
      if (selectedGp !== 'All' && item.gp !== selectedGp) return false;
      if (selectedVillage !== 'All' && item.village !== selectedVillage) return false;
      if (selectedCropMode !== 'All' && item.cropMode !== selectedCropMode) return false;
      if (selectedYear !== 'All' && item.year !== selectedYear) return false;
      if (selectedSeason !== 'All' && item.season !== selectedSeason) return false;"""

filter_new = """      if (selectedBlock.length > 0 && !selectedBlock.includes(item.block)) return false;
      if (selectedGp.length > 0 && !selectedGp.includes(item.gp)) return false;
      if (selectedVillage.length > 0 && !selectedVillage.includes(item.village)) return false;
      if (selectedCropMode.length > 0 && !selectedCropMode.includes(item.cropMode)) return false;
      if (selectedYear.length > 0 && !selectedYear.includes(item.year)) return false;
      if (selectedSeason.length > 0 && !selectedSeason.includes(item.season)) return false;"""

content = content.replace(filter_old, filter_new)

# 4. Replace clear filters check
clear_check_old = """(selectedBlock !== 'All' || selectedGp !== 'All' || selectedVillage !== 'All' || selectedCropMode !== 'All' || hasActivities !== 'All' || selectedYear !== 'All' || selectedSeason !== 'All' || searchTerm !== '')"""
clear_check_new = """(selectedBlock.length > 0 || selectedGp.length > 0 || selectedVillage.length > 0 || selectedCropMode.length > 0 || hasActivities !== 'All' || selectedYear.length > 0 || selectedSeason.length > 0 || searchTerm !== '')"""
content = content.replace(clear_check_old, clear_check_new)

# 5. Replace clear filters setters
clear_setters_old = """                    setSelectedBlock('All');
                    setSelectedGp('All');
                    setSelectedVillage('All');
                    setSelectedCropMode('All');
                    setHasActivities('All');
                    setSearchTerm('');"""
clear_setters_new = """                    setSelectedBlock([]);
                    setSelectedGp([]);
                    setSelectedVillage([]);
                    setSelectedCropMode([]);
                    setSelectedYear([]);
                    setSelectedSeason([]);
                    setHasActivities('All');
                    setSearchTerm('');"""
content = content.replace(clear_setters_old, clear_setters_new)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

print("Patched state, filtering, and options.")
