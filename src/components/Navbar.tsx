import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Gavel,
  Clock,
  Bell,
  PlusCircle,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openNewMatterModal: () => void;
}

// Everyone gets the same nav now - there is no staff/client split anymore.
// This is deliberately short: Dashboard, Matters, New Matter, Reminders,
// Notifications. Settings, the Statutory Calculator, and sign-out live in
// the avatar menu in Navbar.tsx, not here - see the earlier discussion on
// keeping the always-used items one tap away and the occasional ones in an
// overflow.
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'matters', label: 'Matters', icon: Gavel },
  { id: 'reminders', label: 'Reminders', icon: Clock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, openNewMatterModal }) => {
  return (
    <>
      {/* Desktop icon rail - lg and up */}
      <aside className="hidden lg:flex w-20 shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] flex-col items-center justify-between py-6 transition-colors">
        <div className="flex flex-col items-center gap-2">
          <button onClick={openNewMatterModal} className="icon-rail-item mb-2" style={{ color: 'var(--gold)' }}>
            <PlusCircle className="w-5 h-5" />
            <span className="icon-rail-tooltip">New Matter</span>
          </button>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`icon-rail-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span className="icon-rail-tooltip">{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Mobile bottom tab bar - below lg */}
      <nav className="bottom-tab-bar lg:hidden">
        <div className="grid grid-cols-5 items-center px-1 py-1.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`bottom-tab-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Home
          </button>

          <button
            onClick={() => setActiveTab('matters')}
            className={`bottom-tab-item ${activeTab === 'matters' ? 'active' : ''}`}
          >
            <Gavel className="w-5 h-5" />
            Matters
          </button>

          <button onClick={openNewMatterModal} className="flex flex-col items-center justify-center">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="w-11 h-11 -mt-5 rounded-full flex items-center justify-center shadow-md"
              style={{ backgroundColor: 'var(--gold)' }}
            >
              <PlusCircle className="w-6 h-6" style={{ color: 'var(--ink-raised)' }} />
            </motion.div>
          </button>

          <button
            onClick={() => setActiveTab('reminders')}
            className={`bottom-tab-item ${activeTab === 'reminders' ? 'active' : ''}`}
          >
            <Clock className="w-5 h-5" />
            Reminders
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`bottom-tab-item ${activeTab === 'notifications' ? 'active' : ''}`}
          >
            <Bell className="w-5 h-5" />
            Alerts
          </button>
        </div>
      </nav>
    </>
  );
};
