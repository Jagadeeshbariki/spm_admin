import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Add overflow-x-hidden to the main div
content = content.replace(
    '<div className="bg-[#F5F7FA] min-h-[calc(100vh-64px)] -m-4 md:-m-8 p-4 md:p-6 font-sans text-slate-800">',
    '<div className="bg-[#F5F7FA] min-h-[calc(100vh-64px)] -m-4 md:-m-8 p-4 md:p-6 font-sans text-slate-800 overflow-x-hidden">'
)

# 2. Add state for image preview
if 'const [previewImage, setPreviewImage] = useState<string | null>(null);' not in content:
    content = content.replace(
        "const [activeTab, setActiveTab] = useState<'overview' | 'frp'>('overview');",
        "const [activeTab, setActiveTab] = useState<'overview' | 'frp'>('overview');\n  const [previewImage, setPreviewImage] = useState<string | null>(null);"
    )

# 3. Update img tags to support click for preview
content = content.replace(
    '<img src={`/api/odk/image?submissionId=${encodeURIComponent(row.plotSubmissionId)}&filename=${encodeURIComponent(row.plotPhoto)}&formId=${encodeURIComponent(row.plotFormId)}`} alt="Plot Registration" className="w-full max-w-sm h-48 object-cover rounded-lg shadow-sm border border-slate-300" loading="lazy" />',
    '<img onClick={(e) => { e.stopPropagation(); setPreviewImage(`/api/odk/image?submissionId=${encodeURIComponent(row.plotSubmissionId)}&filename=${encodeURIComponent(row.plotPhoto)}&formId=${encodeURIComponent(row.plotFormId)}`); }} src={`/api/odk/image?submissionId=${encodeURIComponent(row.plotSubmissionId)}&filename=${encodeURIComponent(row.plotPhoto)}&formId=${encodeURIComponent(row.plotFormId)}`} alt="Plot Registration" className="w-full max-w-sm h-48 object-cover rounded-lg shadow-sm border border-slate-300 cursor-pointer hover:opacity-90 transition-opacity" loading="lazy" />'
)

content = content.replace(
    '<img src={`/api/odk/image?submissionId=${encodeURIComponent(bi.submissionId)}&filename=${encodeURIComponent(bi.photo)}&formId=${encodeURIComponent(bi.formId || \'NF- Activities\')}`} alt="Bio Input" className="w-full h-32 object-cover rounded-lg border border-slate-200" loading="lazy" />',
    '<img onClick={(e) => { e.stopPropagation(); setPreviewImage(`/api/odk/image?submissionId=${encodeURIComponent(bi.submissionId)}&filename=${encodeURIComponent(bi.photo)}&formId=${encodeURIComponent(bi.formId || \'NF- Activities\')}`); }} src={`/api/odk/image?submissionId=${encodeURIComponent(bi.submissionId)}&filename=${encodeURIComponent(bi.photo)}&formId=${encodeURIComponent(bi.formId || \'NF- Activities\')}`} alt="Bio Input" className="w-full h-32 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity" loading="lazy" />'
)

content = content.replace(
    '<img src={`/api/odk/image?submissionId=${encodeURIComponent(h.submissionId)}&filename=${encodeURIComponent(h.photo)}&formId=${encodeURIComponent(h.formId || \'NF- Activities\')}`} alt="Harvest" className="w-full h-32 object-cover rounded-lg border border-slate-200" loading="lazy" />',
    '<img onClick={(e) => { e.stopPropagation(); setPreviewImage(`/api/odk/image?submissionId=${encodeURIComponent(h.submissionId)}&filename=${encodeURIComponent(h.photo)}&formId=${encodeURIComponent(h.formId || \'NF- Activities\')}`); }} src={`/api/odk/image?submissionId=${encodeURIComponent(h.submissionId)}&filename=${encodeURIComponent(h.photo)}&formId=${encodeURIComponent(h.formId || \'NF- Activities\')}`} alt="Harvest" className="w-full h-32 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity" loading="lazy" />'
)

# 4. Add the image preview modal at the end of the return statement
modal_code = """      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-[5000] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center">
            <button 
              className="absolute -top-12 right-0 md:-right-12 text-white/70 hover:text-white p-2 transition-colors bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImage(null);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/20"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </div>
  );
}"""

content = re.sub(r'    </div>\s*\n\s*\);\s*\n\}\s*$', modal_code, content)

# 5. Fix the tooltip pointer events just in case
content = content.replace(
    "<RechartsTooltip wrapperStyle={{ pointerEvents: 'none' }} isAnimationActive={false}",
    "<RechartsTooltip isAnimationActive={false} wrapperStyle={{ pointerEvents: 'none' }}"
)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

