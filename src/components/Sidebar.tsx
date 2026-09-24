import React, { type ReactNode } from 'react';
import { Calculator, Gavel, LogOut, Moon, Plus, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { MAIN_NAV, PAGES, initials, type PageId } from './navConfig';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openNewMatterModal: () => void;
  openDeadlineCalcModal: () => void;
}

export function Sidebar({ activeTab, setActiveTab, openNewMatterModal, openDeadlineCalcModal }: SidebarProps) {
  const { currentUser, logout } = useAuth();
  const { setTheme, isDark } = useTheme();
  const { unreadCount } = useNotifications();

  return (
    <>
      {/* Desktop sidebar - every item has a visible label */}
      <aside aria-label="Main navigation" className="side hidden lg:flex">
        <button onClick={() => setActiveTab('dashboard')} className="side-brand" aria-label="Legalia home">
          <span className="brand-mark"><Gavel className="h-[18px] w-[18px]" /></span>
          <span className="font-serif-title text-[18px] font-semibold tracking-tight">Legalia</span>
        </button>

        <button onClick={openNewMatterModal} className="button-primary mt-6 w-full">
          <Plus className="h-4 w-4" /> New matter
        </button>

        <nav aria-label="Primary" className="mt-6 flex flex-1 flex-col gap-1">
          {MAIN_NAV.map((id) => (
            <SideLink key={id} id={id} activeTab={activeTab} onClick={() => setActiveTab(id)} />
          ))}
          <SideLink id="notifications" activeTab={activeTab} onClick={() => setActiveTab('notifications')} badge={unreadCount} />

          <p className="side-section-label">Tools</p>
          <button onClick={openDeadlineCalcModal} className="side-link">
            <Calculator /> <span>Deadline calculator</span>
          </button>
        </nav>

        <div className="border-t border-[var(--border-subtle)] pt-3">
          <SideLink id="settings" activeTab={activeTab} onClick={() => setActiveTab('settings')} />
          <button className="side-link" onClick={() => setTheme(isDark ? 'light' : 'dark')}>
            {isDark ? <Sun /> : <Moon />} <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-[var(--bg-base)] p-2.5">
            <span className="avatar">{initials(currentUser?.name)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{currentUser?.name}</p>
              <p className="truncate text-[12px] text-[var(--text-muted)]">{currentUser?.email}</p>
            </div>
            <button onClick={() => void logout()} className="icon-button danger" aria-label="Sign out" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav aria-label="Mobile navigation" className="bottom-tab-bar lg:hidden">
        <div className="grid grid-cols-5 items-end px-1 py-1.5">
          <MobileTab id="dashboard" activeTab={activeTab} onClick={() => setActiveTab('dashboard')} />
          <MobileTab id="matters" activeTab={activeTab} onClick={() => setActiveTab('matters')} />
          <button onClick={openNewMatterModal} className="flex flex-col items-center justify-center" aria-label="New matter">
            <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full border-4 border-[var(--bg-base)] bg-[var(--gold-fill)] text-[#151b28] shadow-lg">
              <Plus className="h-6 w-6" />
            </span>
            <span className="mt-1 text-[12px] font-semibold text-[var(--text-muted)]">New</span>
          </button>
          <MobileTab id="reminders" activeTab={activeTab} onClick={() => setActiveTab('reminders')} />
          <MobileTab id="notifications" activeTab={activeTab} onClick={() => setActiveTab('notifications')} badge={unreadCount} label="Alerts" />
        </div>
      </nav>
    </>
  );
}

const SideLink: React.FC<{ id: PageId; activeTab: string; onClick: () => void; badge?: number }> = ({ id, activeTab, onClick, badge }) => {
  const { label, icon: Icon } = PAGES[id];
  const active = activeTab === id;
  return (
    <button onClick={onClick} className={`side-link ${active ? 'side-link-active' : ''}`} aria-current={active ? 'page' : undefined}>
      <Icon /> <span className="flex-1 text-left">{label}</span>
      {typeof badge === 'number' && badge > 0 && <span className="side-badge">{badge > 9 ? '9+' : badge}</span>}
    </button>
  );
};

function MobileTab({ id, activeTab, onClick, badge, label }: { id: PageId; activeTab: string; onClick: () => void; badge?: number; label?: string }): ReactNode {
  const { label: pageLabel, icon: Icon } = PAGES[id];
  return (
    <button onClick={onClick} className={`bottom-tab-item ${activeTab === id ? 'active' : ''}`} aria-current={activeTab === id ? 'page' : undefined}>
      <span className="relative">
        <Icon />
        {typeof badge === 'number' && badge > 0 && <span className="notification-dot">{badge > 9 ? '9+' : badge}</span>}
      </span>
      <span>{label || pageLabel}</span>
    </button>
  );
}

export default Sidebar;
