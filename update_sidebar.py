with open('src/components/layout/Sidebar.tsx', 'r') as f:
    content = f.read()

nav_item = "  { name: 'BYP Dashboard', path: '/admin/about-region/byp/dashboard', icon: LayoutDashboard },\n"
if "{ name: 'Crops Dashboard', path: '/admin/about-region/crops/dashboard', icon: LayoutDashboard }," in content:
    content = content.replace(
        "{ name: 'Crops Dashboard', path: '/admin/about-region/crops/dashboard', icon: LayoutDashboard },",
        "{ name: 'Crops Dashboard', path: '/admin/about-region/crops/dashboard', icon: LayoutDashboard },\n" + nav_item
    )

with open('src/components/layout/Sidebar.tsx', 'w') as f:
    f.write(content)
print("Updated Sidebar.tsx")
