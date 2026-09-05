import re

file_path = 'src/pages/admin/CropsDashboard.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Locate the mappedData block
start_marker = "const mappedData = submissions.map((sub: any) => {"
if start_marker not in content:
    print("Could not find start marker")
    exit(1)

# We will replace the mappedData generation with exactly what the user asked
replacement = """        const mappedData = submissions.map((sub: any) => {
          const flat = flatten(sub);
          
          // 1. Create PK from NF - Register
          const farmerId = String(flat['plot_reg-farmer_Id'] || flat['plot_reg_farmer_Id'] || flat['farmer_Id'] || '').trim();
          const yearOnly = String(flat['plot_reg-year_only'] || flat['plot_reg-year'] || flat['year'] || '').trim();
          const regSeason = String(flat['plot_reg-season'] || flat['season'] || '').trim();
          
          const registration_id = `${farmerId}-${yearOnly}-${regSeason}`.toLowerCase();
          
          // 2. Filter NF - Activities based on FK
          const matchedActivities = activities.filter((act: any) => {
            const pDetails = act.Primary_details || {};
            
            const actFarmerName = String(pDetails.farmer_name || '').trim();
            const textYear = String(pDetails.text_year || '');
            const actYear = textYear.length >= 4 ? textYear.substring(0, 4) : textYear;
            const actDataSeason = String(pDetails.data_season || '').trim();
            
            const activity_fk = `${actFarmerName}-${actYear}-${actDataSeason}`.toLowerCase();
            
            return registration_id === activity_fk && registration_id !== '--';
          });

          let harvests: any[] = [];
          let bioInputs: any[] = [];
          
          matchedActivities.forEach((act: any) => {
            const flatAct = flatten(act);
            const actPhoto = act.gps?.photo || flatAct['gps_photo'] || flatAct['photo'] || act.photo;
            
            // 4. Use Instance ID as PARENT_KEY for nested tables
            const parentKey = act.meta?.instanceID || act.__id || '';
            
            if (act.harvesting && Array.isArray(act.harvesting)) {
              harvests.push(...act.harvesting.map((h: any) => ({ 
                ...h, 
                photo: actPhoto, 
                PK: h.__id || parentKey + '-' + Math.random().toString(36).substr(2, 9),
                PARENT_KEY: parentKey,
                formId: 'NF- Activities' 
              })));
            }
            if (act.application_bio_input && Array.isArray(act.application_bio_input)) {
              bioInputs.push(...act.application_bio_input.map((b: any) => ({ 
                ...b, 
                photo: actPhoto, 
                PK: b.__id || parentKey + '-' + Math.random().toString(36).substr(2, 9),
                PARENT_KEY: parentKey,
                formId: 'NF- Activities' 
              })));
            }
          });

          // Variables required for dashboard rendering
          const hhId = farmerId || flat['HH_id'] || flat['hh_id'] || '';
          const farmerName = flat['plot_reg-farmer_name'] || flat['farmer_name'] || flat['name'] || '';
          const season = regSeason || flat['Season'] || 'Unknown';
          const sowingDate = flat['plot_reg-sowing_date'] || flat['sowing_date'] || flat['date'] || '-';
          const regYear = yearOnly;
          const rawYear = yearOnly;
          const rawSeason = regSeason;
          const cropCycle = flat['plot_reg_crop_cycle'] || flat['plot_reg-crop_cycle'] || '';
"""

# Now find the block to replace
# We want to replace from start_marker up to `const rawYear = flat['text_year'] || flat['year'];`
pattern = r"const mappedData = submissions\.map\(\(sub: any\) => \{[\s\S]*?(?=let finalYear = rawYear \? String\(rawYear\)\.substring\(0, 4\) : '';)"

if re.search(pattern, content):
    content = re.sub(pattern, replacement, content)
    with open(file_path, 'w') as f:
        f.write(content)
    print("Successfully patched CropsDashboard.tsx")
else:
    print("Regex replacement failed.")
