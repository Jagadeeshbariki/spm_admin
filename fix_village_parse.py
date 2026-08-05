import re

with open('src/pages/admin/VillageGIS.tsx', 'r') as f:
    content = f.read()

old_fetch_block = """        const json = await response.json();
        const actJson = actResponse.ok ? await actResponse.json() : { value: [] };"""

new_fetch_block = """        let json, actJson;
        try {
          const regText = await response.text();
          if (regText.trim().startsWith('<')) {
            throw new Error('API returned HTML. Backend may not be deployed correctly.');
          }
          json = JSON.parse(regText);
          
          if (actResponse.ok) {
            const actText = await actResponse.text();
            actJson = actText.trim().startsWith('<') ? { value: [] } : JSON.parse(actText);
          } else {
            actJson = { value: [] };
          }
        } catch (e: any) {
          throw new Error('Failed to parse API response: ' + e.message);
        }"""

content = content.replace(old_fetch_block, new_fetch_block)

with open('src/pages/admin/VillageGIS.tsx', 'w') as f:
    f.write(content)

