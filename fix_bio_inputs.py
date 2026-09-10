with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# We need to replace the mapping for bio inputs.
old_bio_inputs = """                                                                  {act.application_bio_input.map((bi: any, j: number) => (
                                                                    <div key={j} className="text-sm bg-blue-50/50 p-3 rounded border border-blue-100">
                                                                      <div className="font-semibold text-slate-700">{bi.bio_input_name || bi.input_name || '-'}</div>
                                                                      <div className="text-slate-600 flex justify-between mt-1">
                                                                        <span>Applied: {bi.date_applied || bi.date || '-'}</span>
                                                                        <span className="font-medium text-blue-700">{bi.qty_applied || bi.qty || bi.qty_units || '-'} {bi.unit || bi.units || ''}</span>
                                                                      </div>
                                                                    </div>
                                                                  ))}"""

new_bio_inputs = """                                                                  {act.application_bio_input.map((bi: any, j: number) => (
                                                                    <div key={j} className="text-sm bg-blue-50/50 p-3 rounded border border-blue-100">
                                                                      <div className="font-semibold text-slate-700">{bi.inputs_applied || bi.bio_input_name || bi.input_name || '-'}</div>
                                                                      <div className="text-slate-600 flex flex-col gap-1 mt-1.5 border-t border-blue-100/50 pt-1.5">
                                                                        <div className="flex justify-between">
                                                                          <span className="text-slate-500">Date:</span>
                                                                          <span className="font-medium text-slate-700">{bi.application_date_bio_input || bi.date_applied || bi.date || '-'}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                          <span className="text-slate-500">Quantity:</span>
                                                                          <span className="font-medium text-blue-700">{bi.Dhravajeevamrutham_Quantity || bi.qty_applied || bi.qty || bi.qty_units || '-'} {bi.unit || bi.units || 'Lts/Kgs'}</span>
                                                                        </div>
                                                                        {bi.bioinputs_source && (
                                                                          <div className="flex justify-between">
                                                                            <span className="text-slate-500">Source:</span>
                                                                            <span className="font-medium text-slate-700 capitalize">{String(bi.bioinputs_source).replace(/_/g, ' ')}</span>
                                                                          </div>
                                                                        )}
                                                                      </div>
                                                                    </div>
                                                                  ))}"""

if old_bio_inputs in content:
    content = content.replace(old_bio_inputs, new_bio_inputs)
    with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
        f.write(content)
    print("Fixed bio inputs mapping!")
else:
    print("Could not find old bio inputs mapping.")

