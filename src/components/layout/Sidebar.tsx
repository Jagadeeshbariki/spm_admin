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
  Settings
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Expenses', path: '/admin/expenses', icon: ReceiptIndianRupee },
  { name: 'Assets', path: '/admin/assets', icon: Box },
  { name: 'Meetings', path: '/admin/meetings', icon: CalendarDays },
  { name: 'Car Rentals', path: '/admin/car-rentals', icon: Car },
  { name: 'Vendors', path: '/admin/vendors', icon: Users },
  { name: 'Reports', path: '/admin/reports', icon: FileBarChart },
];

const adminItems = [
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

export default function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean, setCollapsed: (val: boolean) => void }) {
  return (
    <aside 
      className={cn(
        "bg-white border-r border-slate-200 flex flex-col transition-all duration-300 relative z-10 shrink-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex-1 py-6 flex flex-col gap-6 px-3">
        <div className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm",
                isActive 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", collapsed ? "mx-auto" : "")} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100">
          {!collapsed && <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Admin</p>}
          <div className="flex flex-col gap-2">
            {adminItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm",
                  isActive 
                    ? "bg-blue-50 text-blue-600" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", collapsed ? "mx-auto" : "")} />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-slate-100 flex justify-end">
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors w-full flex justify-center"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
