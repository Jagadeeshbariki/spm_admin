import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

old_code = "const actPhoto = act.gps?.photo || flat['gps_photo'] || flat['photo'] || (act.gps && act.gps.photo) || (act.Primary_details && act.Primary_details.photo) || act.photo;"
new_code = "const flatAct = flatten(act);\n            const actPhoto = act.gps?.photo || flatAct['gps_photo'] || flatAct['photo'] || act.photo;"
content = content.replace(old_code, new_code)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

