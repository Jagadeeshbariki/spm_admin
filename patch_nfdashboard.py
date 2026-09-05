import re

file_path = 'src/pages/admin/NFDashboard.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# For NF Activity table
act_pattern = r"""    // 1\. Process NF Activity table and add registration_id
    const processedActivities = activities\.map\(act => \{
      const pDetails = act\.Primary_details || \{\};
[\s\S]*?
      const registration_id = createRegistrationId\(farmerName, actYear, season\);
      return \{ \.\.\.act, registration_id \};
    \}\);"""

act_replacement = """    // 1. Process NF Activity table and add registration_id
    const processedActivities = activities.map(act => {
      const pDetails = act.Primary_details || {};
      const farmerName = String(pDetails.farmer_name || '').trim();
      const textYear = String(pDetails.text_year || '');
      const actYear = textYear.length >= 4 ? textYear.substring(0, 4) : textYear;
      const season = String(pDetails.data_season || '').trim();
      
      const registration_id = `${farmerName}-${actYear}-${season}`.toLowerCase();
      
      // Enhance bio inputs and harvests with PK and PARENT_KEY
      const parentKey = act.meta?.instanceID || act.__id || '';
      
      if (act.harvesting && Array.isArray(act.harvesting)) {
        act.harvesting = act.harvesting.map((h: any) => ({
          ...h,
          PK: h.__id || parentKey + '-' + Math.random().toString(36).substr(2, 9),
          PARENT_KEY: parentKey
        }));
      }
      if (act.application_bio_input && Array.isArray(act.application_bio_input)) {
        act.application_bio_input = act.application_bio_input.map((b: any) => ({
          ...b,
          PK: b.__id || parentKey + '-' + Math.random().toString(36).substr(2, 9),
          PARENT_KEY: parentKey
        }));
      }
      
      return { ...act, registration_id };
    });"""

if re.search(act_pattern, content):
    content = re.sub(act_pattern, act_replacement, content)
else:
    print("Could not find act_pattern")

# For NF Registration table
reg_pattern = r"""    registrations\.forEach\(reg => \{
      const flatReg = flatten\(reg\) as any;
      
      const farmerId = flatReg\['plot_reg-farmer_Id'\].*?
      let yearStr = flatReg\['plot_reg-year'\].*?
      let yMatch = yearStr\.match\(/\\b\(20\\d\{2\}\)\\b/\);
      const year = yMatch \? yMatch\[1\] : yearStr;
      const season = flatReg\['plot_reg-season'\].*?
      
      const registration_id = createRegistrationId\(farmerId, year, season\);"""

reg_replacement = """    registrations.forEach(reg => {
      const flatReg = flatten(reg) as any;
      
      const farmerId = String(flatReg['plot_reg-farmer_Id'] || flatReg['plot_reg_farmer_Id'] || flatReg['farmer_Id'] || '').trim();
      const yearOnly = String(flatReg['plot_reg-year_only'] || flatReg['plot_reg-year'] || flatReg['year'] || '').trim();
      const season = String(flatReg['plot_reg-season'] || flatReg['season'] || '').trim();
      
      const registration_id = `${farmerId}-${yearOnly}-${season}`.toLowerCase();"""

if re.search(reg_pattern, content):
    content = re.sub(reg_pattern, reg_replacement, content)
else:
    print("Could not find reg_pattern")

with open(file_path, 'w') as f:
    f.write(content)
print("Successfully patched NFDashboard.tsx")
