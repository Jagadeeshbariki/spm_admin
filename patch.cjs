const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/NFDashboard.tsx', 'utf8');

// replace the unmatched activities handling
const search = `    // Add unmatched activities to farmers if we can guess the farmer, otherwise put in a special "Unmatched" node
    unmatchedActivities.forEach(act => {
       act.Link_Status = "UNMATCHED";
       // We can just leave them or handle them under data quality. For now, we will expose them via a separate state or just ignore them in the main view if farmer doesn't exist.
       // We can put them in the farmer if farmer name matches exactly? But the instructions say "Do not delete unmatched records. Show them separately under Data Quality."
       // So we should maybe return { farmers: Array.from(farmersMap.values()), unmatchedActivities: Array.from(unmatchedActivities) }
    });`;

const replace = `    // Inject unmatched activities into the hierarchy so they are visible
    unmatchedActivities.forEach(act => {
      act.Link_Status = "UNMATCHED";
      const pDetails = act.Primary_details || {};
      const farmerId = pDetails.farmer_name || pDetails.farmer_select || 'Unknown';
      const year = pDetails.text_year || pDetails.year || 'Unknown Year';
      const season = pDetails.data_season || pDetails.season || 'Unknown Season';
      
      const farmerKey = farmerId;
      if (!farmersMap.has(farmerKey)) {
        farmersMap.set(farmerKey, {
          farmerId: farmerId,
          farmerName: pDetails.father_or_spouse_name ? \`Farmer (\${pDetails.father_or_spouse_name})\` : farmerId,
          village: pDetails.village || '',
          gp: pDetails.gp || '',
          block: pDetails.block || '',
          cropModes: new Set(),
          registrations: [],
          totalArea: 0,
          totalActivities: 0,
          totalBioInputs: 0,
          totalHarvests: 0,
          harvestCompletedRegs: 0,
          activeRegs: 0
        });
      }
      
      const farmerNode = farmersMap.get(farmerKey);
      const regId = act.registration_id;
      
      let regNode = farmerNode.registrations.find((r: any) => r.registration_id === regId);
      if (!regNode) {
         regNode = {
            id: regId,
            raw: { isVirtual: true, Link_Status: "UNMATCHED", message: "No matching registration found for this activity" },
            registration_id: regId,
            year: normalizeYear(year),
            season: normalizeCapitalization(season),
            cropMode: pDetails.crop_model || 'Unknown',
            mainCrop: pDetails.main_crop || 'Unknown',
            area: 0,
            status: 'Activity Only (No Reg)',
            activities: []
         };
         farmerNode.registrations.push(regNode);
      }
      
      if (pDetails.crop_model) farmerNode.cropModes.add(pDetails.crop_model);

      const bioInputs = Array.isArray(act.application_bio_input) ? act.application_bio_input : [];
      const harvests = Array.isArray(act.harvesting) ? act.harvesting : [];
      
      farmerNode.totalActivities += 1;
      farmerNode.totalBioInputs += bioInputs.length;
      farmerNode.totalHarvests += harvests.length;
      
      const processedAct = {
          id: act.__id || act.meta?.instanceID,
          raw: act,
          registration_id: regId,
          date: act.crop_activity || act.Primary_details?.date || '-',
          stage: act.crop_stage || '-',
          bioInputs: bioInputs.map(b => ({ ...b, registration_id: regId })),
          harvests: harvests.map(h => ({ ...h, registration_id: regId }))
      };
      
      regNode.activities.push(processedAct);
      
      // update status
      if (regNode.activities.some((a: any) => a.harvests.length > 0)) {
         regNode.status = 'Harvest Completed (Unmatched)';
      } else {
         regNode.status = 'Active (Unmatched)';
      }
    });`;

if(code.includes(search)) {
  code = code.replace(search, replace);
  fs.writeFileSync('src/pages/admin/NFDashboard.tsx', code);
  console.log("Patched successfully");
} else {
  console.log("Search string not found!");
}
