import re

with open('src/pages/admin/HDFCCropsDashboard.tsx', 'r') as f:
    content = f.read()

# Replace component name
content = content.replace("export default function CropsDashboard() {", "export default function HDFCCropsDashboard() {")

# Add filtering logic
old_map_start = "        const mappedData = submissions.map((sub: any) => {"

new_map_start = """
        // HDFC Specific filtering
        const targetSubmitters = [
          { names: ['sampath'], cluster: 'Cluster 1' },
          { names: ['mani'], cluster: 'Cluster 2' },
          { names: ['jadeskung', 'jeddiskung', 'jadiskung'], cluster: 'Cluster 3' }
        ];

        const getSubmitterCluster = (name: string) => {
          if (!name) return null;
          const lowerName = name.toLowerCase();
          for (const ts of targetSubmitters) {
            if (ts.names.some(n => lowerName.includes(n))) {
              return ts.cluster;
            }
          }
          return null;
        };

        const filteredSubmissions = submissions.filter((sub: any) => {
           const sName = sub.__system?.submitterName || '';
           return getSubmitterCluster(sName) !== null;
        });

        const mappedData = filteredSubmissions.map((sub: any) => {
"""

content = content.replace(old_map_start, new_map_start)

# Add cluster to mappedData return
old_ret = """            raw: flat
          };
        });"""

new_ret = """            raw: flat,
            submitterName: sub.__system?.submitterName || '',
            cluster: getSubmitterCluster(sub.__system?.submitterName || '')
          };
        });"""

content = content.replace(old_ret, new_ret)

with open('src/pages/admin/HDFCCropsDashboard.tsx', 'w') as f:
    f.write(content)
