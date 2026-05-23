import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '@/lib/AuthContext';

export default function AdminLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const role = user?.role?.toLowerCase().trim();
  const canSeeSidebar = role === 'admin' || role === 'office admin';

  // Define paths where the sidebar SHOULD be hidden even for admins (usually common interest pages)
  const isGeneralPage = 
    location.pathname === '/admin/id-explorer' || 
    location.pathname === '/admin/water-collective' || 
    location.pathname === '/admin/settings';

  const isAboutRegion = location.pathname.startsWith('/admin/about-region');

  const isOfficeSection = canSeeSidebar && 
    location.pathname.startsWith('/admin/') &&
    !isGeneralPage &&
    !isAboutRegion &&
    !location.pathname.startsWith('/admin/mail-tracker');

  const showSidebar = isOfficeSection || isAboutRegion;

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col font-sans text-slate-800">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        {showSidebar && <Sidebar collapsed={isSidebarCollapsed} setCollapsed={setIsSidebarCollapsed} />}
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${showSidebar ? 'p-6' : 'p-4 md:p-8'}`}>
          <div className={showSidebar ? '' : 'max-w-7xl mx-auto w-full'}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
