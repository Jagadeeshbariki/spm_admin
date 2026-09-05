import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Update stats useMemo to include table data
old_stats_init = """    const cropModeCount: Record<string, number> = {};
    const mainCropFarmers: Record<string, Set<string>> = {};
    const clusterFarmers: Record<string, Set<string>> = {};"""

new_stats_init = """    const cropModeCount: Record<string, number> = {};
    const mainCropFarmers: Record<string, Set<string>> = {};
    const clusterFarmers: Record<string, Set<string>> = {};
    const blockCropModeStats: Record<string, Record<string, { count: number, area: number }>> = {};
    const blockSubmitterStats: Record<string, Record<string, { count: number, area: number }>> = {};"""

content = content.replace(old_stats_init, new_stats_init)

old_loop_body = """      // Main Crop
      const mainCrop = item.mainCrop || 'Unknown';
      if (mainCrop !== 'Unknown' && mainCrop !== '-') {
        if (!mainCropFarmers[mainCrop]) {
          mainCropFarmers[mainCrop] = new Set<string>();
        }
        mainCropFarmers[mainCrop].add(farmerId);
      }
    });"""

new_loop_body = """      // Main Crop
      const mainCrop = item.mainCrop || 'Unknown';
      if (mainCrop !== 'Unknown' && mainCrop !== '-') {
        if (!mainCropFarmers[mainCrop]) {
          mainCropFarmers[mainCrop] = new Set<string>();
        }
        mainCropFarmers[mainCrop].add(farmerId);
      }

      // Summary Tables
      const block = item.block || 'Unknown';
      const safeArea = !isNaN(area) ? area : 0;
      
      // Table 1: Crop Modes
      if (!blockCropModeStats[block]) blockCropModeStats[block] = {};
      if (!blockCropModeStats[block][mode]) blockCropModeStats[block][mode] = { count: 0, area: 0 };
      blockCropModeStats[block][mode].count += 1;
      blockCropModeStats[block][mode].area += safeArea;

      // Table 2: NF Cotton Status
      if (isHdfc && mode.toLowerCase().includes('cotton')) {
        const submitter = item.submitterName || 'Unknown';
        if (!blockSubmitterStats[block]) blockSubmitterStats[block] = {};
        if (!blockSubmitterStats[block][submitter]) blockSubmitterStats[block][submitter] = { count: 0, area: 0 };
        blockSubmitterStats[block][submitter].count += 1;
        blockSubmitterStats[block][submitter].area += safeArea;
      }
    });"""

content = content.replace(old_loop_body, new_loop_body)

old_ret_stats = """    const clusterData = Object.entries(clusterFarmers)
      .map(([name, set]) => ({ name, value: set.size }))
      .sort((a, b) => a.name.localeCompare(b.name));
      
    return {"""

new_ret_stats = """    const clusterData = Object.entries(clusterFarmers)
      .map(([name, set]) => ({ name, value: set.size }))
      .sort((a, b) => a.name.localeCompare(b.name));
      
    const table1Data = Object.entries(blockCropModeStats).map(([block, modes]) => {
      let blockCount = 0;
      let blockArea = 0;
      const modesArr = Object.entries(modes).map(([mode, stats]) => {
        blockCount += stats.count;
        blockArea += stats.area;
        return { mode, count: stats.count, area: stats.area };
      }).sort((a, b) => a.mode.localeCompare(b.mode));
      return { block, modes: modesArr, count: blockCount, area: blockArea };
    }).sort((a, b) => a.block.localeCompare(b.block));

    const table2Data = Object.entries(blockSubmitterStats).map(([block, submitters]) => {
      let blockCount = 0;
      let blockArea = 0;
      const submittersArr = Object.entries(submitters).map(([name, stats]) => {
        blockCount += stats.count;
        blockArea += stats.area;
        return { name, count: stats.count, area: stats.area };
      }).sort((a, b) => a.name.localeCompare(b.name));
      return { block, submitters: submittersArr, count: blockCount, area: blockArea };
    }).sort((a, b) => a.block.localeCompare(b.block));
      
    return {"""

content = content.replace(old_ret_stats, new_ret_stats)

old_ret2 = """      cropModeData,
      mainCropData,
      clusterData
    };"""

new_ret2 = """      cropModeData,
      mainCropData,
      clusterData,
      table1Data,
      table2Data
    };"""
content = content.replace(old_ret2, new_ret2)


with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
