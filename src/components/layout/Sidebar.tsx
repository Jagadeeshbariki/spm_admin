import { 
  LayoutDashboard, 
  ReceiptIndianRupee, 
  Box, 
  CalendarDays, 
  Car, 
  Users, 
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  Bed,
  Map as MapIcon,
  Database,
  Droplets,
  Plane,
  Menu
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { useState, useEffect } from 'react';

const officeAdminItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Expenses', path: '/admin/expenses', icon: ReceiptIndianRupee },
  { name: 'Assets', path: '/admin/assets', icon: Box },
  { name: 'Meetings', path: '/admin/meetings', icon: CalendarDays },
  { name: 'Car Rentals', path: '/admin/car-rentals', icon: Car },
  { name: 'Vendors', path: '/admin/vendors', icon: Users },
  { name: 'Guest Room', path: '/admin/guest-room', icon: Bed },
  { name: 'Team Travel', path: '/admin/team-travel', icon: Plane },
  { name: 'GIS Management', path: '/admin/village-gis-management', icon: Database },
  { name: 'Water Management', path: '/admin/water-collective-management', icon: Droplets },
  { name: 'Reports', path: '/admin/reports', icon: FileBarChart },
];

const aboutRegionItems = [
  { name: 'Working Villages', path: '/admin/about-region/working-villages', icon: MapIcon },
  { name: 'Processing Hubs', path: '/admin/about-region/processing-hubs', icon: Database },
];

export default function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean, setCollapsed: (val: boolean) => void }) {
  const { user } = useAuth();
  const location = useLocation();
  const role = user?.role?.toLowerCase().trim();
  const isOfficeAccess = role === 'admin' || role === 'office admin';
  
  const isAboutRegion = location.pathname.startsWith('/admin/about-region');

  // On mobile, let's treat "collapsed" as fully hidden off-screen, and "not collapsed" as full drawer
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [setCollapsed]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && !collapsed && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-[9990] md:hidden" 
          onClick={() => setCollapsed(true)}
        />
      )}
      
      <aside 
        className={cn(
          "bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-[9995] shrink-0 h-full",
          isMobile ? "fixed left-0 top-0 bottom-0 shadow-2xl" : "relative",
          collapsed 
            ? (isMobile ? "-translate-x-full" : "w-16 lg:w-20 translate-x-0") 
            : "w-64 translate-x-0"
        )}
      >
        <div className="flex-1 py-6 flex flex-col gap-6 px-3 overflow-y-auto">
          {isOfficeAccess && !isAboutRegion && (
            <div className="flex flex-col gap-2">
              {!collapsed && <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Office Admin</p>}
              {officeAdminItems.map((item) => (
                <NavLink
                  key={item.path}
                  onClick={() => isMobile && setCollapsed(true)}
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm",
                    isActive 
                      ? "bg-blue-50 text-blue-600" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    collapsed && !isMobile && "justify-center px-0"
                  )}
                  title={collapsed && !isMobile ? item.name : undefined}
                >
                  <item.icon className={cn("w-5 h-5 shrink-0", collapsed && !isMobile ? "mx-auto" : "")} />
                  {(!collapsed || isMobile) && <span>{item.name}</span>}
                </NavLink>
              ))}
            </div>
          )}

          {isAboutRegion && (
            <div className="flex flex-col gap-2">
              {!collapsed && <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">About Region</p>}
              {aboutRegionItems.map((item) => (
                <NavLink
                  key={item.path}
                  onClick={() => isMobile && setCollapsed(true)}
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm",
                    isActive 
                      ? "bg-blue-50 text-blue-600" 
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    collapsed && !isMobile && "justify-center px-0"
                  )}
                  title={collapsed && !isMobile ? item.name : undefined}
                >
                  <item.icon className={cn("w-5 h-5 shrink-0", collapsed && !isMobile ? "mx-auto" : "")} />
                  {(!collapsed || isMobile) && <span>{item.name}</span>}
                </NavLink>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors w-full flex justify-center items-center"
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>
      
      {/* Mobile Toggle Button (when collapsed) */}
      {isMobile && collapsed && (
        <button 
          onClick={() => setCollapsed(false)}
          className="fixed bottom-6 left-6 z-[9900] p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}
    </>
  );
}
