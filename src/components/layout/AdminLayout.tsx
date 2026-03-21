import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AdminLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();

  const showSidebar = location.pathname.startsWith('/admin/') &&
    !location.pathname.startsWith('/admin/water-collective') &&
    !location.pathname.startsWith('/admin/irrigation-management') &&
    !location.pathname.startsWith('/admin/settings');

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col font-sans text-slate-800">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <Sidebar collapsed={isSidebarCollapsed} setCollapsed={setIsSidebarCollapsed} />}
        <main className="flex-1 overflow-y-auto p-6 transition-all duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
