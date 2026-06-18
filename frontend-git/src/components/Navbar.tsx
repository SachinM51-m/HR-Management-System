import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Calendar, User, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView }) => {
  const { user, isAdmin } = useAuth();

  const getViewTitle = (view: string) => {
    switch (view) {
      case 'dashboard':
        return 'Overview Analytics';
      case 'employees':
        return 'Employee Directory';
      case 'attendance':
        return 'Attendance Management';
      case 'payroll':
        return 'Payroll & Invoicing';
      case 'portal':
        return 'Employee Self-Service Portal';
      default:
        return 'Enterprise Dashboard';
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="h-16 fixed top-0 right-0 left-64 glass-panel border-b border-slate-800/60 bg-slate-950/40 flex items-center justify-between px-8 z-30">
      {/* Title */}
      <div>
        <h1 className="text-lg font-bold text-white tracking-wide">
          {getViewTitle(currentView)}
        </h1>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-6">
        {/* Calendar Widget */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
          <Calendar size={14} className="text-indigo-400" />
          <span className="font-medium">{formattedDate}</span>
        </div>

        {/* Alerts / Notifications icon */}
        <button className="relative p-2 rounded-lg bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors hover:bg-slate-800/30 cursor-pointer">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
        </button>

        {/* Vertical Divider */}
        <div className="w-px h-6 bg-slate-800" />

        {/* User Card */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-200">
              {isAdmin ? 'System Admin' : user?.employee?.name || 'User Profile'}
            </span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
              isAdmin 
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {user?.role}
            </span>
          </div>

          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            {isAdmin ? (
              <ShieldAlert size={16} className="text-indigo-400" />
            ) : (
              <User size={16} className="text-emerald-400" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
