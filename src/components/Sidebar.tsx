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
    <aside className="w-full lg:w-64 border-r border-[rgba(184,147,95,0.2)] bg-[#FFFFFF] dark:bg-[#12172B] flex flex-col justify-between shrink-0 p-4 transition-colors">
      
      <div className="space-y-6">
        
        {/* Quick Action Buttons */}
        <div className="space-y-2">
          {(currentUser?.role === 'admin' || currentUser?.role === 'lawyer' || currentUser?.role === 'paralegal') && (
            <button
              onClick={openNewMatterModal}
              className="w-full flex items-center justify-center gap-2 py-2 px-3.5 rounded-lg bg-[#B8935F] hover:bg-[#8C6F49] text-[#12172B] font-semibold text-[13px] shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" />
              Intake New Matter
            </button>
          )}

          <button
            onClick={openDeadlineCalcModal}
            className="w-full flex items-center justify-center gap-2 py-2 px-3.5 rounded-lg border border-[rgba(184,147,95,0.25)] bg-[#F5F2EA] dark:bg-[#1B2140] text-[#12172B] dark:text-[#F6F3EC] hover:bg-[#F0EBE0] dark:hover:bg-[#232A50] text-[12px] font-medium transition"
          >
            <Calculator className="w-3.5 h-3.5 text-[#B8935F]" />
            Statutory Calculator
          </button>
        </div>

        {/* Primary Nav Menu */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#5C6278] dark:text-[#8A90AC] px-3 mb-2">
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
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'border-l-4 border-[#B8935F] bg-[#B8935F]/10 text-[#B8935F] font-semibold'
                      : 'text-[#5C6278] dark:text-[#8A90AC] hover:bg-[#B8935F]/10 hover:text-[#12172B] dark:hover:text-[#F6F3EC]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#B8935F]' : 'opacity-70'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-[rgba(184,147,95,0.18)] text-[12px] text-[#5C6278] dark:text-[#8A90AC]">
        <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC]">Chambers Practice Suite</div>
        <div>v2.4 &bull; Offline Firestore Sync</div>
      </div>

    </aside>
  );
};
