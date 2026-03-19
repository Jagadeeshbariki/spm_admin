import { Bell, Search, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Topbar() {
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
        <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg">
          <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-sm">
            <p className="font-medium leading-none">Admin User</p>
            <p className="text-xs text-slate-500 mt-1">Office Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
