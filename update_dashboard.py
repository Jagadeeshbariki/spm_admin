import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Update Mapping Logic
old_mapping = """          matchedActivities.forEach((act: any) => {
            if (act.harvesting && Array.isArray(act.harvesting)) harvests.push(...act.harvesting);
            if (act.application_bio_input && Array.isArray(act.application_bio_input)) bioInputs.push(...act.application_bio_input);
          });
          return {
            block: flat['block'] || flat['Block'] || '',"""
new_mapping = """          matchedActivities.forEach((act: any) => {
            const actPhoto = act.gps?.photo || flatten(act)['gps_photo'] || flatten(act)['photo'];
            const actSubId = act.__id;
            if (act.harvesting && Array.isArray(act.harvesting)) harvests.push(...act.harvesting.map(h => ({ ...h, photo: actPhoto, submissionId: actSubId, formId: 'NF- Activities' })));
            if (act.application_bio_input && Array.isArray(act.application_bio_input)) bioInputs.push(...act.application_bio_input.map(b => ({ ...b, photo: actPhoto, submissionId: actSubId, formId: 'NF- Activities' })));
          });
          return {
            plotPhoto: flat['plot_reg_image'] || flat['image'] || flat['photo'],
            plotSubmissionId: sub.__id,
            plotFormId: 'NF- Register',
            block: flat['block'] || flat['Block'] || '',"""
content = content.replace(old_mapping, new_mapping)


# 2. Update Harvest Render
old_harvest = """                                                <div className="text-sm text-slate-600">
                                                  Yield: <span className="font-medium text-emerald-600">{h.yield_Qntl || h.yield || '-'} Qntl</span>
                                                </div>"""
new_harvest = """                                                <div className="text-sm text-slate-600">
                                                  Yield: <span className="font-medium text-emerald-600">{((parseFloat(h.yield_Qntl || h.yield || 0) || 0) * 100).toFixed(2)} KG</span>
                                                </div>
                                                {h.photo && h.submissionId && (
                                                  <div className="mt-3">
                                                    <img src={`/api/odk/image?submissionId=${encodeURIComponent(h.submissionId)}&filename=${encodeURIComponent(h.photo)}&formId=${encodeURIComponent(h.formId || 'NF- Activities')}`} alt="Harvest" className="w-full h-32 object-cover rounded-lg border border-slate-200" loading="lazy" />
                                                  </div>
                                                )}"""
content = content.replace(old_harvest, new_harvest)

# 3. Update Bio Input Render
old_bio = """                                                <div className="text-sm text-slate-600 flex justify-between">
                                                  <span>Qty: {bi.Dhravajeevamrutham_Quantity || bi.qty || '-'} {bi.unit || ''}</span>
                                                  <span>Source: {bi.bioinputs_source || '-'}</span>
                                                </div>"""
new_bio = """                                                <div className="text-sm text-slate-600 flex justify-between mb-2">
                                                  <span>Qty: {bi.Dhravajeevamrutham_Quantity || bi.qty || '-'} {bi.unit || ''}</span>
                                                  <span>Source: {bi.bioinputs_source || '-'}</span>
                                                </div>
                                                {bi.photo && bi.submissionId && (
                                                  <div className="mt-2">
                                                    <img src={`/api/odk/image?submissionId=${encodeURIComponent(bi.submissionId)}&filename=${encodeURIComponent(bi.photo)}&formId=${encodeURIComponent(bi.formId || 'NF- Activities')}`} alt="Bio Input" className="w-full h-32 object-cover rounded-lg border border-slate-200" loading="lazy" />
                                                  </div>
                                                )}"""
content = content.replace(old_bio, new_bio)

# 4. Add Plot Registration Photo to Accordion
old_accordion = """                                    <h4 className="text-sm font-bold text-slate-900 mb-4">Activities & Data</h4>"""
new_accordion = """                                    <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center justify-between">
                                      <span>Activities & Data</span>
                                      {row.plotPhoto && row.plotSubmissionId && (
                                        <button 
                                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            window.open(`/api/odk/image?submissionId=${encodeURIComponent(row.plotSubmissionId)}&filename=${encodeURIComponent(row.plotPhoto)}&formId=${encodeURIComponent(row.plotFormId)}`, '_blank');
                                          }}
                                        >
                                          <Sprout className="w-3 h-3" /> View Plot Photo
                                        </button>
                                      )}
                                    </h4>
                                    {row.plotPhoto && row.plotSubmissionId && (
                                      <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Plot Registration Photo</h5>
                                        <img src={`/api/odk/image?submissionId=${encodeURIComponent(row.plotSubmissionId)}&filename=${encodeURIComponent(row.plotPhoto)}&formId=${encodeURIComponent(row.plotFormId)}`} alt="Plot Registration" className="w-full max-w-sm h-48 object-cover rounded-lg shadow-sm border border-slate-300" loading="lazy" />
                                      </div>
                                    )}"""
content = content.replace(old_accordion, new_accordion)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

