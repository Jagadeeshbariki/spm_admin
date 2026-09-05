import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

old_filtered = """  const filteredData = useMemo(() => {
    return data.filter(item => {"""

new_filtered = """  const filteredData = useMemo(() => {
    const hdfcTargetSubmitters = [
      { names: ['sampath'], cluster: 'Cluster 1' },
      { names: ['mani'], cluster: 'Cluster 2' },
      { names: ['jadeskung', 'jeddiskung', 'jadiskung'], cluster: 'Cluster 3' }
    ];

    const getSubmitterCluster = (name: string) => {
      if (!name) return null;
      const lowerName = name.toLowerCase();
      for (const ts of hdfcTargetSubmitters) {
        if (ts.names.some(n => lowerName.includes(n))) {
          return ts.cluster;
        }
      }
      return null;
    };

    return data.filter(item => {
      // HDFC Tab specific filter
      if (activeTab === 'hdfc') {
         const cluster = getSubmitterCluster(item.submitterName);
         if (!cluster) return false;
         item.cluster = cluster;
      }
"""

content = content.replace(old_filtered, new_filtered)

old_dep = """  }, [data, selectedBlock, selectedGp, selectedVillage, selectedCropMode, hasActivities, selectedYear, selectedSeason, searchTerm]);"""
new_dep = """  }, [data, selectedBlock, selectedGp, selectedVillage, selectedCropMode, hasActivities, selectedYear, selectedSeason, searchTerm, activeTab]);"""
content = content.replace(old_dep, new_dep)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
