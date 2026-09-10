const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/CropsDashboard.tsx', 'utf8');

if (!code.includes('activitiesData: matchedActivities')) {
    code = code.replace(
        "activityCount: matchedActivities.length,",
        "activityCount: matchedActivities.length,\n            activitiesData: matchedActivities,"
    );
    fs.writeFileSync('src/pages/admin/CropsDashboard.tsx', code);
    console.log("Added activitiesData");
}
