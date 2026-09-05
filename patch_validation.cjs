const fs = require('fs');
const filePath = 'src/pages/admin/NFValidationPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const replacement = `
        // Build a map of registrations by composite PK
        const regMap = new Map();
        registrations.forEach((reg: any) => {
          const flat = flatten(reg) as any;
          const id = reg.__id || reg.meta?.instanceID?.replace('uuid:', '');
          const farmerId = String(flat['plot_reg-farmer_Id'] || flat['plot_reg_farmer_Id'] || flat['farmer_Id'] || '').trim();
          const year = String(flat['plot_reg-year_only'] || flat['plot_reg-year'] || flat['year'] || '').trim();
          const season = String(flat['plot_reg-season'] || flat['season'] || '').trim();
          
          const compositePk = \`\${farmerId}-\${year}-\${season}\`.toLowerCase();
          
          regMap.set(compositePk, {
            id,
            farmerId,
            farmerName: flat['plot_reg-farmer_name'] || flat['farmer_name'] || flat['name'] || '',
            year,
            season
          });
        });

        const validationResults: any[] = [];
        activities.forEach((act: any) => {
          const pDetails = act.Primary_details || {};
          const actFarmerName = String(pDetails.farmer_name || '').trim();
          const textYear = String(pDetails.text_year || '');
          const actYear = textYear.length >= 4 ? textYear.substring(0, 4) : textYear;
          const actDataSeason = String(pDetails.data_season || '').trim();
          
          const compositeFk = \`\${actFarmerName}-\${actYear}-\${actDataSeason}\`.toLowerCase();
          
          let status = 'UNMATCHED';
          const match = regMap.get(compositeFk);
          
          if (compositeFk === '--' || !compositeFk) {
            status = 'MISSING_FK_COMPONENTS';
          } else if (match) {
            status = 'MATCHED';
          } else {
            status = 'ORPHAN_ACTIVITY';
          }

          validationResults.push({
            activityId: act.__id || act.meta?.instanceID?.replace('uuid:', ''),
            plotId: compositeFk || 'N/A',
            regId: match ? match.id : 'N/A',
            farmerId: actFarmerName,
            year: actYear,
            season: actDataSeason,
            status
          });
        });
`;

content = content.replace(/\/\/ Build a map of registrations[\s\S]*\}\);\s+validationResults\.push\(\{[\s\S]*?\}\);\s+\}\);/, replacement.trim());
fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully patched NFValidationPage.tsx");
