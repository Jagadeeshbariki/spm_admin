import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Fix PieChart container
old_pie = """          <div className="flex-1 min-h-0 overflow-hidden">
            {stats.cropModeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">"""
new_pie = """          <div className="flex-1 min-h-0 relative">
            {stats.cropModeData.length > 0 ? (
              <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">"""
content = content.replace(old_pie, new_pie)

old_pie_close = """              </ResponsiveContainer>
            ) : ("""
new_pie_close = """              </ResponsiveContainer>
              </div>
            ) : ("""
content = content.replace(old_pie_close, new_pie_close)

# 2. Fix BarChart container
old_bar = """          <div className="flex-1 min-h-0 overflow-hidden">
            {stats.mainCropData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">"""
new_bar = """          <div className="flex-1 min-h-0 relative">
            {stats.mainCropData.length > 0 ? (
              <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">"""
content = content.replace(old_bar, new_bar)

old_bar_close = """              </ResponsiveContainer>
            ) : ("""
new_bar_close = """              </ResponsiveContainer>
              </div>
            ) : ("""
content = content.replace(old_bar_close, new_bar_close)

# 3. Add isAnimationActive={false} to RechartsTooltip
content = content.replace('<RechartsTooltip ', '<RechartsTooltip isAnimationActive={false} ')
content = content.replace('<RechartsTooltip\\n', '<RechartsTooltip isAnimationActive={false}\\n')

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

