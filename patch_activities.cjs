const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/CropsDashboard.tsx', 'utf8');

// We will replace how activitiesData is generated.
const oldMatchStr = "activityCount: matchedActivities.length,\n            activitiesData: matchedActivities,";
const newMatchStr = `activityCount: matchedActivities.length,
            activitiesData: matchedActivities.map((act) => {
              const flatAct = flatten(act);
              const parentKey = act.meta?.instanceID || act.__id || '';
              return {
                ...act,
                displayPhoto: act.gps?.photo || flatAct['gps_photo'] || flatAct['gps-photo'] || flatAct['photo'] || act.photo,
                displaySubmissionId: act.__id || parentKey.replace('uuid:', ''),
                displayDate: act.Primary_details?.date_visit || act.Primary_details?.date || flatAct['date_visit'] || '-',
                displayActivity: act.crop_activity || flatAct['crop_activity'] || 'Activity'
              };
            }),`;
code = code.replace(oldMatchStr, newMatchStr);
fs.writeFileSync('src/pages/admin/CropsDashboard.tsx', code);
console.log("Updated activitiesData mapping");
