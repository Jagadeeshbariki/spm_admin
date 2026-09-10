const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/CropsDashboard.tsx', 'utf8');

const strToFind1 = "let cces: any[] = [];";
content = content.replace(strToFind1, "let cces: any[] = [];\n          let activityPhotos: any[] = [];");

const strToFind2 = "const parentKey = act.meta?.instanceID || act.__id || '';";
const replace2 = `const parentKey = act.meta?.instanceID || act.__id || '';
            const submissionId = act.__id || parentKey.replace('uuid:', '');
            if (actPhoto) {
              activityPhotos.push({
                photo: actPhoto,
                submissionId,
                formId: 'NF- Activities',
                date: act.Primary_details?.date_visit || act.date || flatAct['date_visit'] || '-'
              });
            }`;
content = content.replace(strToFind2, replace2);

const strToFind3 = "activityCount: matchedActivities.length,";
content = content.replace(strToFind3, "activityCount: matchedActivities.length,\n            activityPhotos,");

const strToFind4 = "{(plot.bioInputs.length > 0 || plot.harvests.length > 0 || (plot.cces && plot.cces.length > 0)) && (";
const replace4 = `

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
                                                          setPreviewImage(\`/api/odk/image?v=4&submissionId=\${encodeURIComponent(ap.submissionId)}&filename=\${encodeURIComponent(ap.photo)}&formId=\${encodeURIComponent(ap.formId)}\`); 
                                                        }}
                                                      >
                                                        <img 
                                                          src={\`/api/odk/image?v=4&submissionId=\${encodeURIComponent(ap.submissionId)}&filename=\${encodeURIComponent(ap.photo)}&formId=\${encodeURIComponent(ap.formId)}\`} 
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

                                            {(plot.bioInputs.length > 0 || plot.harvests.length > 0 || (plot.cces && plot.cces.length > 0)) && (`;

content = content.replace(strToFind4, replace4);

fs.writeFileSync('src/pages/admin/CropsDashboard.tsx', content);
console.log("Patched CropsDashboard.tsx successfully!");
