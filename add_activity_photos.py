import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Add activityPhotos variable
add_array_pattern = r"let cces: any\[\] = \[\];"
add_array_replacement = r"let cces: any[] = [];\n          let activityPhotos: any[] = [];"
content = re.sub(add_array_pattern, add_array_replacement, content)

# Populate activityPhotos
populate_pattern = r"const parentKey = act\.meta\?\.instanceID \|\| act\.__id \|\| '';"
populate_replacement = r"""const parentKey = act.meta?.instanceID || act.__id || '';
            const submissionId = act.__id || parentKey.replace('uuid:', '');
            if (actPhoto) {
              activityPhotos.push({
                photo: actPhoto,
                submissionId,
                formId: 'NF- Activities',
                date: act.Primary_details?.date_visit || act.date || flatAct['date_visit'] || '-'
              });
            }"""
content = re.sub(populate_pattern, populate_replacement, content)

# Add activityPhotos to returned object
return_pattern = r"activityCount: matchedActivities\.length,"
return_replacement = r"activityCount: matchedActivities.length,\n            activityPhotos,"
content = re.sub(return_pattern, return_replacement, content)

# Render Activity Photos next to Plot Registration Photo or in a new block
render_pattern = r"(\{\/\* Plot Registration Section \*\/\}[\s\S]*?)(<\/\s*div>\s*<\/div>\s*<\/div>\s*\)\})\s*\{\(plot\.bioInputs\.length > 0)"
render_replacement = r"""\1

                                            {plot.activityPhotos && plot.activityPhotos.length > 0 && (
                                              <div className="border-t border-slate-200 pt-6 mt-6">
                                                <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
                                                  <span>Activity Photos</span>
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                  {plot.activityPhotos.map((ap: any, i: number) => (
                                                    <div key={i}>
                                                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Visit: {ap.date}</h5>
                                                      <div 
                                                        className="relative group w-full h-32 rounded-lg overflow-hidden border border-slate-300 shadow-sm cursor-pointer bg-slate-100"
                                                        onClick={(e) => { 
                                                          e.stopPropagation(); 
                                                          setPreviewImage(`/api/odk/image?v=4&submissionId=${encodeURIComponent(ap.submissionId)}&filename=${encodeURIComponent(ap.photo)}&formId=${encodeURIComponent(ap.formId)}`); 
                                                        }}
                                                      >
                                                        <img 
                                                          src={`/api/odk/image?v=4&submissionId=${encodeURIComponent(ap.submissionId)}&filename=${encodeURIComponent(ap.photo)}&formId=${encodeURIComponent(ap.formId)}`} 
                                                          alt="Activity Photo" 
                                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                                                          loading="lazy" 
                                                        />
                                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                                                          <ZoomIn className="w-4 h-4" /> View
                                                        </div>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}
\2{(plot.bioInputs.length > 0"""
content = re.sub(render_pattern, render_replacement, content)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

print("Added activityPhotos rendering")
