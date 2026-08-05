import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    '<RechartsTooltip isAnimationActive={false}',
    '<RechartsTooltip isAnimationActive={false} wrapperStyle={{ pointerEvents: \'none\' }}'
)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

