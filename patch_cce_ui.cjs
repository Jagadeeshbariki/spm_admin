const fs = require('fs');

function patchCCE_UI() {
  const file = 'src/pages/admin/CropsDashboard.tsx';
  let content = fs.readFileSync(file, 'utf8');
  
  // 1. Update the wrapper condition to include cces
  content = content.replace(
    "{(plot.bioInputs.length > 0 || plot.harvests.length > 0) && (",
    "{(plot.bioInputs.length > 0 || plot.harvests.length > 0 || (plot.cces && plot.cces.length > 0)) && ("
  );
  content = content.replace(
    "{(row.bioInputs.length > 0 || row.harvests.length > 0) && (",
    "{(row.bioInputs.length > 0 || row.harvests.length > 0 || (row.cces && row.cces.length > 0)) && ("
  );
  content = content.replace(
    "{group.totalActivities > 0 && (",
    "{group.totalActivities > 0 && ("
  ); // nothing to change here since group.totalActivities already counts all matchedActivities
  
  // 2. Add CCE block after Harvests block
  const harvestBlockEnd = `                                                    </div>
                                                  )}`;
                                                  
  const cceBlock = `
                                                  {/* CCEs */}
                                                  {plot.cces && plot.cces.length > 0 && (
                                                    <div>
                                                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Crop Cutting Experiments (CCE)</h5>
                                                      <div className="space-y-3">
                                                        {plot.cces.map((c: any, i: number) => (
                                                          <div key={i} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                                            <div className="flex justify-between items-start mb-2">
                                                              <span className="font-semibold text-sm text-slate-800">CCE #{i + 1}</span>
                                                              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{c.date_cce || '-'}</span>
                                                            </div>
                                                            <div className="text-sm text-slate-600 space-y-1 mb-2">
                                                              <div className="flex justify-between">
                                                                <span className="text-slate-500">Yield (5x5 Sqm):</span>
                                                                <span className="font-medium">{c.sqmtr_5_5_kgs || '-'} Kgs</span>
                                                              </div>
                                                            </div>
                                                            {c.photo && c.submissionId && (
                                                              <div className="mt-2">
                                                                <img onClick={(e) => { e.stopPropagation(); setPreviewImage(\`/api/odk/image?submissionId=\${encodeURIComponent(c.submissionId)}&filename=\${encodeURIComponent(c.photo)}&formId=\${encodeURIComponent(c.formId || 'NF- Activities')}\`); }} src={\`/api/odk/image?submissionId=\${encodeURIComponent(c.submissionId)}&filename=\${encodeURIComponent(c.photo)}&formId=\${encodeURIComponent(c.formId || 'NF- Activities')}\`} alt="CCE Photo" className="w-full h-32 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity" loading="lazy" />
                                                              </div>
                                                            )}
                                                          </div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  )}
`;

  // We need to inject the cceBlock carefully after the harvests block.
  // There is only one place where harvests are rendered inside the sub-accordion:
  const harvestsMarker = "{/* Harvests */}";
  const harvestsIdx = content.indexOf(harvestsMarker);
  
  if (harvestsIdx > -1) {
    // Find the end of the harvests div
    const harvestsEndIdx = content.indexOf("</div>\n                                                  )}", harvestsIdx);
    if (harvestsEndIdx > -1) {
      const insertionPoint = harvestsEndIdx + "</div>\n                                                  )}".length;
      content = content.substring(0, insertionPoint) + cceBlock + content.substring(insertionPoint);
    }
  }

  fs.writeFileSync(file, content, 'utf8');
}
patchCCE_UI();
console.log("Successfully patched CCE UI");
