import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Replace data fetching
old_fetch = """        const response = await fetch('/api/odk/data?formId=NF-%20Register');
        if (!response.ok) {
          throw new Error('Failed to fetch data from ODK Central. Please check permissions or network.');
        }
        const json = await response.json();
        const submissions = json.value || [];"""

new_fetch = """        const [regResponse, actResponse] = await Promise.all([
          fetch('/api/odk/data?formId=NF-%20Register'),
          fetch('/api/odk/data?formId=NF-%20Activities')
        ]);
        if (!regResponse.ok) {
          throw new Error('Failed to fetch data from ODK Central. Please check permissions or network.');
        }
        const json = await regResponse.json();
        const actJson = actResponse.ok ? await actResponse.json() : { value: [] };
        const submissions = json.value || [];
        const activities = actJson.value || [];"""

content = content.replace(old_fetch, new_fetch)

# Replace data mapping
old_map = """            hhId: flat['plot_reg-farmer_Id'] || flat['plot_reg_farmer_Id'] || flat['farmer_Id'] || flat['HH_id'] || flat['HH_Id'] || flat['hh_id'] || flat['HH Id'] || flat['hhid'] || '',
            season: flat['season'] || flat['Season'] || 'Unknown',
            mainCrop: flat['main_crop'] || flat['Main_Crop'] || '-',
            interCrops: flat['inter_crops'] || flat['Inter_Crops'] || '-',
            sowingDate: flat['sowing_date'] || flat['Sowing_Date'] || flat['date'] || '-',
            area: flat['area_'] || flat['Area'] || flat['area'] || '-',"""

new_map = """            hhId: flat['plot_reg-farmer_Id'] || flat['plot_reg_farmer_Id'] || flat['farmer_Id'] || flat['HH_id'] || flat['HH_Id'] || flat['hh_id'] || flat['HH Id'] || flat['hhid'] || '',
            season: flat['season'] || flat['Season'] || 'Unknown',
            mainCrop: flat['main_crop'] || flat['Main_Crop'] || '-',
            interCrops: flat['inter_crops'] || flat['Inter_Crops'] || '-',
            sowingDate: flat['sowing_date'] || flat['Sowing_Date'] || flat['date'] || '-',
            area: flat['area_'] || flat['Area'] || flat['area'] || '-',
            harvests,
            bioInputs,"""

# Add matched logic before `return {`
old_return = "          return {\n            block: flat['block']"

new_logic = """          const hhId = flat['plot_reg-farmer_Id'] || flat['plot_reg_farmer_Id'] || flat['farmer_Id'] || flat['HH_id'] || flat['HH_Id'] || flat['hh_id'] || flat['HH Id'] || flat['hhid'] || '';
          const farmerName = flat['farmer_name'] || flat['Farmer_Name'] || flat['name'] || flat['farmer'] || '';
          const season = flat['season'] || flat['Season'] || 'Unknown';
          const sowingDate = flat['sowing_date'] || flat['Sowing_Date'] || flat['date'] || '-';
          
          const matchedActivities = activities.filter((act: any) => {
            const pDetails = act.Primary_details || {};
            const actFarmer = String(pDetails.farmer_name || '').trim().toLowerCase();
            const actSeason = String(pDetails.season || pDetails.data_season || '').trim().toLowerCase();
            const actSowing = String(pDetails.sowing_date || '').trim();
            
            const f1 = String(hhId).trim().toLowerCase();
            const f2 = String(farmerName).trim().toLowerCase();
            
            const isFarmerMatch = actFarmer && (actFarmer === f1 || actFarmer === f2);
            const isSeasonMatch = actSeason === String(season).trim().toLowerCase();
            const isSowingMatch = actSowing === String(sowingDate).trim();
            
            return isFarmerMatch && isSeasonMatch && isSowingMatch;
          });

          let harvests: any[] = [];
          let bioInputs: any[] = [];
          
          matchedActivities.forEach((act: any) => {
            if (act.harvesting && Array.isArray(act.harvesting)) harvests.push(...act.harvesting);
            if (act.application_bio_input && Array.isArray(act.application_bio_input)) bioInputs.push(...act.application_bio_input);
          });

          return {
            block: flat['block']"""

content = content.replace(old_map, new_map)
content = content.replace(old_return, new_logic)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)
