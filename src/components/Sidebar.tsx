import React, { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Bell,
  Calculator,
  CalendarClock,
  Gavel,
  LayoutDashboard,
  LogOut,
  Moon,
  Plus,
  Settings,
  Sun,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openNewMatterModal: () => void;
  openDeadlineCalcModal: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Workspace', icon: LayoutDashboard },
  { id: 'matters', label: 'Matter register', icon: Gavel },
  { id: 'reminders', label: 'Hearing diary', icon: CalendarClock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

function initials(name?: string) {
  return (name || 'Counsel')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'C';
}

export function Sidebar({ activeTab, setActiveTab, openNewMatterModal, openDeadlineCalcModal }: SidebarProps) {
  const { currentUser, logout } = useAuth();
  const { setTheme, isDark } = useTheme();
  const { notifications, unreadCount, markRead } = useNotifications();
  const [profileOpen, setProfileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', closeMenus);
    return () => document.removeEventListener('mousedown', closeMenus);
  }, []);

  const recentNotifications = notifications.slice(0, 4);

  return (
    <>
      {/* Desktop icon rail */}
      <aside aria-label="Main navigation" className="rail hidden lg:flex">
        <div className="rail-logo">
          <span className="brand-mark"><Gavel className="h-[18px] w-[18px]" /></span>
        </div>

        <nav aria-label="Primary" className="rail-nav">
          <RailItem
            icon={<Plus />}
            label="Open a matter"
            active={false}
            emphasis
            onClick={openNewMatterModal}
          />
          {navItems.map((item) => (
            <RailItem
              key={item.id}
              icon={<item.icon />}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
              badge={item.id === 'notifications' && unreadCount > 0 ? unreadCount : undefined}
            />
          ))}
        </nav>

        <div className="rail-bottom">
          <div ref={bellRef} className="relative">
            <RailItem
              icon={<Bell />}
              label="Notifications"
              active={bellOpen}
              onClick={() => setBellOpen((open) => !open)}
              badge={unreadCount > 0 ? unreadCount : undefined}
            />
            {bellOpen && (
              <div className="popover-panel bottom-0 left-full ml-3 w-[320px] p-2">
                <div className="flex items-center justify-between px-3 py-2">
                  <div>
                    <p className="font-serif-title text-[15px] font-semibold">Your alerts</p>
                    <p className="text-[11px] text-[var(--text-muted)]">Updates from your matters</p>
                  </div>
                  <button onClick={() => setBellOpen(false)} className="text-[11px] font-medium text-[var(--gold)]">Close</button>
                </div>
                <div className="space-y-1">
                  {recentNotifications.length === 0 ? (
                    <div className="empty-mini">You are up to date.</div>
                  ) : recentNotifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => {
                        if (!notification.read) void markRead(notification.id);
                        setBellOpen(false);
                        if (notification.matterId) setActiveTab('matters');
                      }}
                      className={`w-full rounded-xl p-3 text-left transition hover:bg-[var(--bg-surface-hover)] ${notification.read ? '' : 'bg-[var(--gold-soft)]'}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold)]" />
                        <span className="min-w-0">
                          <span className="block text-[12px] leading-5 text-[var(--text-main)]">{notification.message}</span>
                          <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--text-muted)]">{new Date(notification.createdAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div ref={profileRef} className="relative">
            <button onClick={() => setProfileOpen((open) => !open)} className="rail-avatar" aria-expanded={profileOpen} aria-label="Account menu">
              <span className="avatar">{initials(currentUser?.name)}</span>
            </button>
            {profileOpen && (
              <div className="popover-panel bottom-0 left-full ml-3 w-[235px] p-2">
                <div className="mb-1 flex items-center gap-3 rounded-xl bg-[var(--bg-base)] p-3">
                  <span className="avatar">{initials(currentUser?.name)}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold">{currentUser?.name || 'Counsel'}</p>
                    <p className="truncate text-[10px] text-[var(--text-muted)]">{currentUser?.email}</p>
                  </div>
                </div>
                <button className="menu-item" onClick={() => { setTheme(isDark ? 'light' : 'dark'); }}>
                  {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {isDark ? 'Light appearance' : 'Dark appearance'}
                </button>
                <button className="menu-item" onClick={() => { setActiveTab('settings'); setProfileOpen(false); }}><UserRound className="h-4 w-4" /> My profile</button>
                <button className="menu-item" onClick={() => { setActiveTab('settings'); setProfileOpen(false); }}><Settings className="h-4 w-4" /> Preferences</button>
                <button className="menu-item" onClick={() => { openDeadlineCalcModal(); setProfileOpen(false); }}><Calculator className="h-4 w-4" /> Deadline calculator</button>
                <div className="my-1 border-t border-[var(--border-subtle)]" />
                <button className="menu-item text-[var(--alert-red)]" onClick={() => void logout()}><LogOut className="h-4 w-4" /> Sign out</button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav aria-label="Mobile navigation" className="bottom-tab-bar lg:hidden">
        <div className="grid grid-cols-5 items-end px-1 py-1.5">
          <MobileTab id="dashboard" label="Home" icon={<LayoutDashboard />} activeTab={activeTab} onClick={() => setActiveTab('dashboard')} />
          <MobileTab id="matters" label="Matters" icon={<Gavel />} activeTab={activeTab} onClick={() => setActiveTab('matters')} />
          <button onClick={openNewMatterModal} className="flex flex-col items-center justify-center">
            <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full border-4 border-[var(--bg-base)] bg-[var(--gold)] text-[var(--ink-raised)] shadow-lg">
              <Plus className="h-6 w-6" />
            </span>
            <span className="mt-1 text-[10px] font-semibold text-[var(--text-muted)]">New</span>
          </button>
          <MobileTab id="reminders" label="Diary" icon={<CalendarClock />} activeTab={activeTab} onClick={() => setActiveTab('reminders')} />
          <MobileTab id="notifications" label="Alerts" icon={<Bell />} activeTab={activeTab} onClick={() => setActiveTab('notifications')} badge={unreadCount} />
        </div>
      </nav>
    </>
  );
}

interface RailItemProps { icon: ReactNode; label: string; active: boolean; onClick: () => void; emphasis?: boolean; badge?: number }
const RailItem: React.FC<RailItemProps> = ({ icon, label, active, onClick, emphasis = false, badge }) => {
  return (
    <button onClick={onClick} className={`rail-item group ${active ? 'rail-item-active' : ''} ${emphasis ? 'rail-item-emphasis' : ''}`}>
      <span className="relative">
        {icon}
        {typeof badge === 'number' && badge > 0 && <span className="notification-dot">{badge > 9 ? '9+' : badge}</span>}
      </span>
      <span className="rail-tooltip">{label}</span>
    </button>
  );
};

function MobileTab({ id, label, icon, activeTab, onClick, badge }: { id: string; label: string; icon: ReactNode; activeTab: string; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} className={`bottom-tab-item ${activeTab === id ? 'active' : ''}`}>
      <span className="relative">
        {icon}
        {typeof badge === 'number' && badge > 0 && <span className="notification-dot">{badge > 9 ? '9+' : badge}</span>}
      </span>
      <span>{label}</span>
    </button>
  );
}

export default Sidebar;
