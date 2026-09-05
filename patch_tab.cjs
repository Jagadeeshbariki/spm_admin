const fs = require('fs');

function patch() {
  const file = 'src/pages/admin/CropsDashboard.tsx';
  let content = fs.readFileSync(file, 'utf8');

  content = content.replace(
    "const [activeTab, setActiveTab] = useState<'overview' | 'frp' | 'hdfc' | 'nf-validation' | 'nf-dashboard'>('overview');",
    "const [activeTab, setActiveTab] = useState<'overview' | 'frp' | 'hdfc' | 'nf-validation' | 'nf-dashboard' | 'map'>('overview');"
  );
  
  const mapBtn = `          <button 
            onClick={() => setActiveTab('map')}
            className={cn(
              "px-4 py-3 text-sm font-semibold border-b-2 transition-colors",
              activeTab === 'map' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            Crop Map
          </button>`;

  content = content.replace(
    /<\/button>\s*<button \s*onClick=\{\(\) => setActiveTab\('nf-validation'\)\}/,
    `</button>\n${mapBtn}\n          <button 
            onClick={() => setActiveTab('nf-validation')}`
  );

  fs.writeFileSync(file, content, 'utf8');
}
patch();
console.log("Successfully patched map tab");
