import React from 'react';
import {
  LayoutDashboard,
  Gavel,
  Clock,
  ShieldAlert,
  Users,
  Bell,
  Settings,
  Home,
  PlusCircle,
  FileSpreadsheet,
  Calculator,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openNewMatterModal: () => void;
  openDeadlineCalcModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openNewMatterModal,
  openDeadlineCalcModal,
}) => {
  const { currentUser } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard & Analytics', icon: LayoutDashboard },
    { id: 'matters', label: 'Cause List & Matters', icon: Gavel },
    { id: 'reminders', label: 'Reminders & Alerts', icon: Clock },
    { id: 'conflict', label: 'Conflict Checker', icon: ShieldAlert },
    ...(currentUser?.role === 'admin' || currentUser?.role === 'lawyer'
      ? [{ id: 'team', label: 'Team & Access', icon: Users }]
      : []),
    { id: 'notifications', label: 'Notification Center', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'landing', label: 'Product Landing Page', icon: Home },
  ];

  return (
    <aside className="w-full lg:w-64 border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/40 flex flex-col justify-between shrink-0 p-4 transition-colors">
      
      <div className="space-y-6">
        
        {/* Quick Action Buttons */}
        <div className="space-y-2">
          {(currentUser?.role === 'admin' || currentUser?.role === 'lawyer' || currentUser?.role === 'paralegal') && (
            <button
              onClick={openNewMatterModal}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-amber-600/15 transition transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              Intake New Matter
            </button>
          )}

          <button
            onClick={openDeadlineCalcModal}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-xs font-semibold shadow-xs transition"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Statutory Calculator
          </button>
        </div>

        {/* Primary Nav Menu */}
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 mb-2">
            Litigation Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-amber-600/10 text-amber-800 dark:text-amber-400 font-bold border border-amber-500/25 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-600 dark:text-amber-400' : 'opacity-70'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-slate-500">
        <div className="font-semibold text-slate-700 dark:text-slate-300">High Court Suite</div>
        <div>v2.4 &bull; Offline Firestore Sync</div>
      </div>

    </aside>
  );
};
