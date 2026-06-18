import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  CalendarRange, 
  CircleDollarSign, 
  UserSquare, 
  LogOut,
  Building2
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const { user, isAdmin, logout } = useAuth();

  const adminNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: CalendarRange },
    { id: 'payroll', label: 'Payroll & Salary', icon: CircleDollarSign },
  ];

  const employeeNavItems = [
    { id: 'portal', label: 'Employee Portal', icon: UserSquare },
  ];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  return (
    <aside className="w-64 fixed inset-y-0 left-0 glass-panel border-r border-slate-800 flex flex-col z-35">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/60 bg-slate-900/40">
        <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Building2 size={20} className="animate-pulse" />
        </div>
        <div>
          <span className="font-bold text-white tracking-wide text-lg">NEXUS</span>
          <span className="font-semibold text-indigo-400 tracking-wider text-sm ml-1">HRMS</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Navigation
        </div>
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-300 border-l-2 border-indigo-500 shadow-[inset_4px_0_15px_-4px_rgba(99,102,241,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-l-2 border-transparent'
              }`}
            >
              <IconComponent 
                size={18} 
                className={`transition-colors duration-200 ${
                  isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                }`} 
              />
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Session Info & Logout */}
      <div className="p-4 border-t border-slate-800/60 bg-slate-900/20">
        <div className="flex items-center gap-3 px-2 py-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm shadow-md shadow-indigo-500/10">
            {user?.email.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {isAdmin ? 'HR Administrator' : user?.employee?.name || 'Employee'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/5 text-slate-400 hover:text-rose-400 text-xs font-semibold transition-all duration-200 cursor-pointer"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
