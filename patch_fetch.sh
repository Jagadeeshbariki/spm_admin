#!/bin/bash
cat src/pages/admin/CropsDashboard.tsx | awk '
/const response = await fetch/ {
    print "        const [regResponse, actResponse] = await Promise.all(["
    print "          fetch(\"/api/odk/data?formId=NF-%20Register\"),"
    print "          fetch(\"/api/odk/data?formId=NF-%20Activities\")"
    print "        ]);"
    print "        if (!regResponse.ok) throw new Error(\"Failed to fetch data from ODK Central. Please check permissions or network.\");"
    print "        const json = await regResponse.json();"
    print "        const actJson = actResponse.ok ? await actResponse.json() : { value: [] };"
    print "        const submissions = json.value || [];"
    print "        const activities = actJson.value || [];"
    skip = 1
    next
}
/if \(!response\.ok\)/ { if(skip) { skip=2; next } }
/throw new Error/ { if(skip==2) { skip=3; next } }
/}/ { if(skip==3) { skip=4; next } }
/const json = await response\.json\(\);/ { if(skip==4) { skip=5; next } }
/const submissions = json\.value || \[\];/ { if(skip==5) { skip=0; next } }

/const hhId = flat/ {
    print "          const hhId = flat['plot_reg-farmer_Id'] || flat['plot_reg_farmer_Id'] || flat['farmer_Id'] || flat['HH_id'] || flat['HH_Id'] || flat['hh_id'] || flat['HH Id'] || flat['hhid'] || '';"
    print "          const farmerName = flat['farmer_name'] || flat['Farmer_Name'] || flat['name'] || flat['farmer'] || '';"
    print "          const season = flat['season'] || flat['Season'] || 'Unknown';"
    print "          const sowingDate = flat['sowing_date'] || flat['Sowing_Date'] || flat['date'] || '-';"
    print ""
    print "          const matchedActivities = activities.filter((act: any) => {"
    print "            const pDetails = act.Primary_details || {};"
    print "            const actFarmer = String(pDetails.farmer_name || '').trim().toLowerCase();"
    print "            const actSeason = String(pDetails.season || pDetails.data_season || '').trim().toLowerCase();"
    print "            const actSowing = String(pDetails.sowing_date || '').trim();"
    print "            "
    print "            const isFarmerMatch = actFarmer && (actFarmer === String(hhId).trim().toLowerCase() || actFarmer === String(farmerName).trim().toLowerCase());"
    print "            const isSeasonMatch = actSeason === String(season).trim().toLowerCase();"
    print "            const isSowingMatch = actSowing === String(sowingDate).trim();"
    print "            "
    print "            return isFarmerMatch && isSeasonMatch && isSowingMatch;"
    print "          });"
    print ""
    print "          let harvests: any[] = [];"
    print "          let bioInputs: any[] = [];"
    print "          matchedActivities.forEach((act: any) => {"
    print "            if (act.harvesting && Array.isArray(act.harvesting)) harvests.push(...act.harvesting);"
    print "            if (act.application_bio_input && Array.isArray(act.application_bio_input)) bioInputs.push(...act.application_bio_input);"
    print "          });"
    skip2 = 1
    next
}
/season: flat\['season'\]/ {
    if(skip2) { skip2=2; next }
}
/sowingDate: flat\['sowing_date'\]/ {
    if(skip2==2) { skip2=3; next }
}
/area: flat\['area_'\]/ {
    print "            area: flat['area_'] || flat['Area'] || flat['area'] || '-',"
    print "            harvests,"
    print "            bioInputs,"
    if(skip2==3) { skip2=0; next }
}
{ print }
' > tmp.tsx && mv tmp.tsx src/pages/admin/CropsDashboard.tsx
