import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

old_ret = """            raw: flat
          };
        });"""

new_ret = """            raw: flat,
            submitterName: sub.__system?.submitterName || ''
          };
        });"""

content = content.replace(old_ret, new_ret)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
