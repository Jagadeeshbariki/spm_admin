import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

# Delete lines 80 to 99 roughly. Let's just find the exact block and replace it.
block_to_remove = """    if (sheetName === "Polygons_manyam") {
      const res = await fetchWithFallback(`https://docs.google.com/spreadsheets/d/1n2qE-rdkVefVieM1z0C0Ah_Z04Gg6b7MrRca-LcNrvo/gviz/tq?tqx=out:csv&sheet=${sheetName}&t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to fetch Polygons CSV");
      const text = await res.text();
      return new Promise<any[]>((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
          complete: (results) => {
            const data = results.data.map((row: any, index: number) => ({
              ...row,
              _rowIndex: index + 2,
            }));
            resolve(data);
          },
          error: (err: any) => reject(err),
        });
      });
    }
"""

content = content.replace(block_to_remove, "")

# Now inject it into fetchSheet correctly
target = """    if (sheetName === "Processing Hubs" || sheetName === "Master") {"""

block_to_add = """    if (sheetName === "Polygons_manyam") {
      const res = await fetchWithFallback(`https://docs.google.com/spreadsheets/d/1n2qE-rdkVefVieM1z0C0Ah_Z04Gg6b7MrRca-LcNrvo/gviz/tq?tqx=out:csv&sheet=${sheetName}&t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to fetch Polygons CSV");
      const text = await res.text();
      return new Promise<any[]>((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
          complete: (results) => {
            const data = results.data.map((row: any, index: number) => ({
              ...row,
              _rowIndex: index + 2,
            }));
            resolve(data);
          },
          error: (err: any) => reject(err),
        });
      });
    }
"""

content = content.replace(target, block_to_add + target)

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

