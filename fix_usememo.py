import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Replace the whole block manually
old_start = "  const { blocks, gps, villages, cropModes } = useMemo(() => {"
old_end = "  }, [data]);"

import re

# find the whole useMemo block
pattern = re.compile(r'  const \{ blocks, gps, villages, cropModes \} = useMemo\(\(\) => \{.*?  \}, \[data\]\);', re.DOTALL)

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

content = pattern.sub(new_usememo, content)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
