import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Add overflow-hidden to the flex-1 min-h-0 chart containers
content = content.replace('<div className="flex-1 min-h-0">\n            {stats.cropModeData.length > 0 ? (', '<div className="flex-1 min-h-0 overflow-hidden">\n            {stats.cropModeData.length > 0 ? (')
content = content.replace('<div className="flex-1 min-h-0">\n            {stats.mainCropData.length > 0 ? (', '<div className="flex-1 min-h-0 overflow-hidden">\n            {stats.mainCropData.length > 0 ? (')

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

