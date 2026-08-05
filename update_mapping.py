import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

old_mapping = """          matchedActivities.forEach((act: any) => {
            if (act.harvesting && Array.isArray(act.harvesting)) harvests.push(...act.harvesting);
            if (act.application_bio_input && Array.isArray(act.application_bio_input)) bioInputs.push(...act.application_bio_input);
          });

          return {
            block: flat['block'] || flat['Block'] || '',"""

new_mapping = """          matchedActivities.forEach((act: any) => {
            const actPhoto = act.gps?.photo || flat['gps_photo'] || flat['photo'] || (act.gps && act.gps.photo) || (act.Primary_details && act.Primary_details.photo) || act.photo;
            const actSubId = act.__id || act.meta?.instanceID?.replace('uuid:', '');
            
            if (act.harvesting && Array.isArray(act.harvesting)) {
              harvests.push(...act.harvesting.map((h: any) => ({ ...h, photo: actPhoto, submissionId: actSubId, formId: 'NF- Activities' })));
            }
            if (act.application_bio_input && Array.isArray(act.application_bio_input)) {
              bioInputs.push(...act.application_bio_input.map((b: any) => ({ ...b, photo: actPhoto, submissionId: actSubId, formId: 'NF- Activities' })));
            }
          });

          return {
            plotPhoto: flat['plot_reg_image'] || flat['image'] || flat['photo'],
            plotSubmissionId: sub.__id || sub.meta?.instanceID?.replace('uuid:', ''),
            plotFormId: 'NF- Register',
            block: flat['block'] || flat['Block'] || '',"""

if old_mapping in content:
    content = content.replace(old_mapping, new_mapping)
else:
    print("Mapping not found, using regex...")
    # fallback
    content = re.sub(
        r"matchedActivities\.forEach\(\(act: any\) => \{.*?\n\s*\}\);\n\s*return \{\n\s*block: flat\['block'\] \|\| flat\['Block'\] \|\| '',",
        new_mapping,
        content,
        flags=re.DOTALL
    )

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

