import { useState, useRef, useEffect } from 'react';
import { Bell, User, LogOut, LogIn, ChevronDown, Menu, X, Search, Sun, Moon } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { 
      name: 'ID Explorer', 
      path: '/admin/id-explorer',
      roles: ['Admin', 'office admin', 'TL', 'CC', 'field']
    },
    { 
      name: 'Office Admin', 
      path: '/admin/dashboard',
      roles: ['Admin', 'office admin']
    },
    { 
      name: 'About Region', 
      path: '/admin/about-region',
      roles: ['Admin', 'office admin', 'TL', 'CC', 'field']
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
    const userRole = user?.role?.toLowerCase().trim();
    return link.roles.some(role => role.toLowerCase().trim() === userRole);
  });

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-[9999]">
      <div className="flex items-center gap-4 md:gap-8">
        <button 
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
        >
          {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <Link to="/" className="flex items-center gap-2">
          <img src="/WASSANIcon.jpg" alt="WASSAN" className="h-8 object-contain" />
          <span className="text-lg md:text-xl font-bold text-slate-800 tracking-tight whitespace-nowrap hidden sm:block">
            Seethampeta Wassan
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-6">
          {filteredLinks.map((link) => {
            const isOfficeSection = location.pathname.startsWith('/admin/') && 
              location.pathname !== '/admin/id-explorer' &&
              location.pathname !== '/admin/water-collective' && 
              !location.pathname.startsWith('/admin/about-region') && 
              location.pathname !== '/admin/settings' &&
              !location.pathname.startsWith('/admin/mail-tracker');
            const isAboutRegionSection = location.pathname.startsWith('/admin/about-region');
            const isActive = location.pathname === link.path || 
              (link.name === 'Office Admin' && isOfficeSection) ||
              (link.name === 'About Region' && isAboutRegionSection);
            
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

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 top-16 bg-slate-900/50 z-[9998]" onClick={() => setShowMobileMenu(false)}>
          <div 
            ref={mobileMenuRef}
            className="bg-white w-64 h-full shadow-xl py-4 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {filteredLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setShowMobileMenu(false)}
                  className={cn(
                    "px-6 py-3 text-sm font-medium transition-colors",
                    isActive ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 md:gap-4 flex-1 justify-end">
        {/* Global Search */}
        <div className="hidden lg:flex items-center relative max-w-md w-full ml-8 mr-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input 
            type="text" 
            placeholder="Search dashboard, reports, data..." 
            className="w-full bg-slate-100 border-none outline-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>

        <button 
          onClick={toggleTheme}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button className="p-2 hover:bg-slate-100 rounded-full relative">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                {user.user_name.substring(0, 2).toUpperCase()}
              </div>
              <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform hidden sm:block", showProfile && "rotate-180")} />
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-[9999] origin-top-right animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-900 truncate">{user.user_name}</p>
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
