import React from 'react';
import { 
  ReceiptIndianRupee, 
  Box, 
  CalendarDays, 
  Car, 
  Users, 
  Bed,
  Plane,
  Database,
  Droplets,
  FileBarChart,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '@/lib/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  
  const modules = [
    { name: 'Expenses', path: '/admin/expenses', icon: ReceiptIndianRupee, desc: 'Manage budget & transactions', color: 'blue' },
    { name: 'Assets', path: '/admin/assets', icon: Box, desc: 'Track inventory and supplies', color: 'emerald' },
    { name: 'Meetings', path: '/admin/meetings', icon: CalendarDays, desc: 'Schedule and manage events', color: 'indigo' },
    { name: 'Car Rentals', path: '/admin/car-rentals', icon: Car, desc: 'Vehicle allocations & tracking', color: 'amber' },
    { name: 'Vendors', path: '/admin/vendors', icon: Users, desc: 'Supplier and partner records', color: 'purple' },
    { name: 'Guest Room', path: '/admin/guest-room', icon: Bed, desc: 'Accommodation management', color: 'rose' },
    { name: 'Team Travel', path: '/admin/team-travel', icon: Plane, desc: 'Employee travel itineraries', color: 'cyan' },
    { name: 'Reports', path: '/admin/reports', icon: FileBarChart, desc: 'Exportable data analytics', color: 'pink' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen -m-4 md:-m-8 p-4 md:p-8 font-sans text-slate-800">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2 flex items-center gap-2">
            Welcome back, {user?.user_name || 'Admin'}
          </h1>
          <p className="text-slate-500 max-w-xl">
            Access your core administration tools, monitor regional operations, and manage organizational resources.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
          <Activity className="w-4 h-4 text-emerald-500" />
          System Status: Online
        </div>
      </div>

      {/* QUICK STATS (Lightweight visual flair) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard title="Active Modules" value="11" trend="System normal" icon={Database} />
        <StatCard title="Recent Activity" value="24" trend="Updates today" icon={TrendingUp} />
        <StatCard title="Resource Health" value="100%" trend="All systems operational" icon={Activity} />
      </div>

      <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
        Office Admin Modules
      </h2>

      {/* BENTO GRID NAVIGATION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {modules.map((mod, idx) => (
          <ModuleCard key={idx} {...mod} />
        ))}
      </div>
      
    </div>
  );
}

function StatCard({ title, value, trend, icon: Icon }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5">
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6 text-slate-600" />
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm font-medium text-slate-500 mt-1">{title}</div>
        <div className="text-xs text-slate-400 mt-1">{trend}</div>
      </div>
    </div>
  );
}

function ModuleCard({ name, path, icon: Icon, desc, color }: any) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white',
    amber: 'bg-amber-50 text-amber-600 border-amber-100 group-hover:bg-amber-500 group-hover:text-white',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white',
    purple: 'bg-purple-50 text-purple-600 border-purple-100 group-hover:bg-purple-600 group-hover:text-white',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100 group-hover:bg-cyan-600 group-hover:text-white',
    pink: 'bg-pink-50 text-pink-600 border-pink-100 group-hover:bg-pink-600 group-hover:text-white',
    rose: 'bg-rose-50 text-rose-600 border-rose-100 group-hover:bg-rose-600 group-hover:text-white',
  };

  const bgColors: Record<string, string> = {
    blue: 'group-hover:border-blue-200',
    emerald: 'group-hover:border-emerald-200',
    amber: 'group-hover:border-amber-200',
    indigo: 'group-hover:border-indigo-200',
    purple: 'group-hover:border-purple-200',
    cyan: 'group-hover:border-cyan-200',
    pink: 'group-hover:border-pink-200',
    rose: 'group-hover:border-rose-200',
  };

  return (
    <Link to={path}>
      <motion.div 
        whileHover={{ y: -4, scale: 1.02 }}
        className={cn(
          "bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 relative overflow-hidden group cursor-pointer h-full flex flex-col",
          bgColors[color]
        )}
      >
        <div className="flex justify-between items-start mb-6">
          <div className={cn("p-3 rounded-xl border transition-colors duration-300", colors[color])}>
            <Icon className="w-6 h-6" />
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-600 transition-colors" />
        </div>
        
        <div className="mt-auto">
          <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-slate-800">{name}</h3>
          <p className="text-sm text-slate-500 line-clamp-2">{desc}</p>
        </div>
      </motion.div>
    </Link>
  );
}
