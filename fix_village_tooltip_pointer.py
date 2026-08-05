import re
import os

files_to_fix = [
    'src/pages/admin/VillageGIS.tsx',
    'src/pages/admin/CropsDashboard.tsx'
]

for file_path in files_to_fix:
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r') as f:
        content = f.read()

    content = content.replace(
        '<RechartsTooltip ',
        '<RechartsTooltip wrapperStyle={{ pointerEvents: \'none\' }} '
    )

    with open(file_path, 'w') as f:
        f.write(content)

