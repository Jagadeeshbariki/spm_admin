import { Bell, Search, User, LogOut, LogIn } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-xl font-bold text-blue-600 tracking-tight">
          Seethampeta Wassan
        </Link>
        <div className="hidden md:flex items-center bg-slate-100 rounded-full px-3 py-1.5 ml-8">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none outline-none text-sm w-64"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-slate-100 rounded-full relative">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        {user ? (
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
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
