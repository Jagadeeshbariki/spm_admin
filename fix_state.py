import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Add states for year, season and activeTab
old_states = """  const [selectedVillage, setSelectedVillage] = useState('All');
  const [selectedCropMode, setSelectedCropMode] = useState('All');
  const [hasActivities, setHasActivities] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');"""
new_states = """  const [selectedVillage, setSelectedVillage] = useState('All');
  const [selectedCropMode, setSelectedCropMode] = useState('All');
  const [hasActivities, setHasActivities] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedSeason, setSelectedSeason] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activeTab, setActiveTab] = useState<'overview' | 'frp'>('overview');"""
content = content.replace(old_states, new_states)

# Add useMemo for extracted options
old_usememo = """  const { blocks, gps, villages, cropModes } = useMemo(() => {
    const bSet = new Set<string>();
    const gSet = new Set<string>();
    const vSet = new Set<string>();
    const cSet = new Set<string>();
    data.forEach(item => {
      if (item.block) bSet.add(item.block);
      if (item.gp) gSet.add(item.gp);
      if (item.village) vSet.add(item.village);
      if (item.cropMode) cSet.add(item.cropMode);
    });
    return { 
      blocks: Array.from(bSet).sort(), 
      gps: Array.from(gSet).sort(), 
      villages: Array.from(vSet).sort(), 
      cropModes: Array.from(cSet).sort() 
    };
  }, [data]);"""

new_usememo = """  const { blocks, gps, villages, cropModes, years, seasons } = useMemo(() => {
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
content = content.replace(old_usememo, new_usememo)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
