with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

target1 = """    const uniqueFarmers = new Set<string>();
    const activeFarmers = new Set<string>();"""
replacement1 = """    const uniqueFarmers = new Set<string>();
    const activeFarmers = new Set<string>();
    const bioInputFarmers = new Set<string>();
    const harvestFarmers = new Set<string>();"""

target2 = """      // Activities
      if (item.harvests.length > 0 || item.bioInputs.length > 0 || (item.cces && item.cces.length > 0)) {
        if (farmerId) {
          activeFarmers.add(farmerId);
        }
      }"""
replacement2 = """      // Activities
      if (item.harvests.length > 0 || item.bioInputs.length > 0 || (item.cces && item.cces.length > 0)) {
        if (farmerId) {
          activeFarmers.add(farmerId);
        }
      }
      if (item.bioInputs && item.bioInputs.length > 0 && farmerId) {
        bioInputFarmers.add(farmerId);
      }
      if (item.harvests && item.harvests.length > 0 && farmerId) {
        harvestFarmers.add(farmerId);
      }"""

target3 = """      totalBioInputs,"""
replacement3 = """      totalBioInputs,
      bioInputFarmersCount: bioInputFarmers.size,
      harvestFarmersCount: harvestFarmers.size,"""

if target1 in content and target2 in content and target3 in content:
    content = content.replace(target1, replacement1)
    content = content.replace(target2, replacement2)
    content = content.replace(target3, replacement3)
    with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
        f.write(content)
    print("Stats updated!")
else:
    print("Failed to find targets for stats update")
    if target1 not in content: print("target1 missing")
    if target2 not in content: print("target2 missing")
    if target3 not in content: print("target3 missing")

