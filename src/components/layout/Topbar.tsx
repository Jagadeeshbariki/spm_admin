import { useState, useRef, useEffect } from 'react';
import { Bell, User, LogOut, LogIn, ChevronDown } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { 
      name: 'Office Admin', 
      path: '/admin/dashboard',
      roles: ['Admin', 'office admin', 'TL', 'CC'] // All roles can view data
    },
    { 
      name: 'Water Collective', 
      path: '/admin/water-collective',
      roles: ['Admin', 'office admin', 'TL', 'CC']
    },
    { 
      name: 'Admin', 
      path: '/admin/settings',
      roles: ['Admin']
    },
  ];

  const filteredLinks = navLinks.filter(link => {
    if (!link.roles) return true;
    return link.roles.some(role => role.toLowerCase() === user?.role?.toLowerCase());
  });

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-xl font-bold text-blue-600 tracking-tight">
          Seethampeta Wassan
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          {filteredLinks.map((link) => {
            const isActive = location.pathname === link.path || 
              (link.name === 'Office Admin' && location.pathname.startsWith('/admin/') && 
               !location.pathname.startsWith('/admin/water-collective') && 
               !location.pathname.startsWith('/admin/irrigation-management') && 
               !location.pathname.startsWith('/admin/settings'));
            
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-blue-600",
                  isActive ? "text-blue-600" : "text-slate-600"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-slate-100 rounded-full relative">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", showProfile && "rotate-180")} />
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-900">{user.user_name}</p>
                  <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link 
            to="/login"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
