import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

old_mapped = """            hhId: flat['plot_reg-farmer_Id'] || flat['plot_reg_farmer_Id'] || flat['farmer_Id'] || flat['HH_id'] || flat['HH_Id'] || flat['hh_id'] || flat['HH Id'] || flat['hhid'] || '',
            season: flat['season'] || flat['Season'] || 'Unknown',"""

new_mapped = """            hhId: flat['plot_reg-farmer_Id'] || flat['plot_reg_farmer_Id'] || flat['farmer_Id'] || flat['HH_id'] || flat['HH_Id'] || flat['hh_id'] || flat['HH Id'] || flat['hhid'] || '',
            year: (flat['text_year'] || flat['year'] || '').substring(0, 4) || 'Unknown',
            season: flat['season'] || flat['Season'] || 'Unknown',"""

content = content.replace(old_mapped, new_mapped)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
