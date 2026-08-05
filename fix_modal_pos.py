import re

with open('src/pages/admin/CropsDashboard.tsx', 'r') as f:
    content = f.read()

# Remove the modal from the bottom of the file
modal_pattern = r'\s*\{\/\* Image Preview Modal \*\/\}.*?<\/div>\s*\)\s*\}\s*$'
content = re.sub(modal_pattern, '', content, flags=re.DOTALL)

# Insert it before the last </div> of CropsDashboard
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

content = content.replace(
    '        </div>\n      </div>\n    </div>\n  );\n}',
    '        </div>\n      </div>\n' + modal_code
)

with open('src/pages/admin/CropsDashboard.tsx', 'w') as f:
    f.write(content)

