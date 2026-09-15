with open('src/App.tsx', 'r') as f:
    content = f.read()

import_statement = "import BYPDashboard from './pages/admin/BYPDashboard';\n"
if "import CropsDashboard from './pages/admin/CropsDashboard';" in content:
    content = content.replace(
        "import CropsDashboard from './pages/admin/CropsDashboard';", 
        "import CropsDashboard from './pages/admin/CropsDashboard';\n" + import_statement
    )

route_statement = "              <Route path=\"about-region/byp/dashboard\" element={<BYPDashboard />} />\n"
if "<Route path=\"about-region/crops/dashboard\" element={<CropsDashboard />} />" in content:
    content = content.replace(
        "<Route path=\"about-region/crops/dashboard\" element={<CropsDashboard />} />",
        "<Route path=\"about-region/crops/dashboard\" element={<CropsDashboard />} />\n" + route_statement
    )

with open('src/App.tsx', 'w') as f:
    f.write(content)
print("Updated App.tsx")
