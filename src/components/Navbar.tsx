import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Calculator,
  ChevronDown,
  Command,
  LogOut,
  Moon,
  Search,
  Settings,
  Shield,
  Sun,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  openDeadlineCalcModal: () => void;
}

const navLabels: Record<string, string> = {
  dashboard: 'Workspace',
  matters: 'Matter register',
  reminders: 'Hearing diary',
  notifications: 'Notifications',
  settings: 'Preferences',
};

function initials(name?: string) {
  return (name || 'Counsel')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'C';
}

export function Navbar({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  openDeadlineCalcModal,
}: NavbarProps) {
  const { currentUser, logout } = useAuth();
  const { setTheme, isDark } = useTheme();
  const { notifications, unreadCount, markRead } = useNotifications();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', closeMenus);
    return () => document.removeEventListener('mousedown', closeMenus);
  }, []);

  const recentNotifications = notifications.slice(0, 4);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] w-full max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="group flex shrink-0 items-center gap-3 text-left"
          aria-label="Go to Legalia workspace"
        >
          <span className="brand-mark"><Shield className="h-[18px] w-[18px]" /></span>
          <span className="hidden sm:block">
            <span className="block font-serif-title text-[17px] font-semibold leading-none tracking-[-0.02em]">Legalia</span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Matter intelligence</span>
          </span>
        </button>

        <div className="hidden h-8 w-px bg-[var(--border-subtle)] lg:block" />
        <div className="hidden min-w-0 flex-1 lg:block">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">Current desk</p>
          <p className="mt-0.5 truncate text-[13px] font-medium text-[var(--text-main)]">{navLabels[activeTab] || 'Workspace'}</p>
        </div>

        <div className="relative ml-auto hidden w-full max-w-[390px] md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search matters, parties, judges…"
            className="field-control w-full pl-10 pr-16"
            aria-label="Search matters"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded border border-[var(--border-subtle)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--text-muted)] xl:flex">
            <Command className="h-3 w-3" /> K
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="icon-button"
            title={isDark ? 'Use light appearance' : 'Use dark appearance'}
            aria-label={isDark ? 'Use light appearance' : 'Use dark appearance'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setNotificationsOpen((open) => !open)}
              className="icon-button relative"
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && <span className="notification-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {notificationsOpen && (
              <div className="popover-panel right-0 top-12 w-[320px] p-2">
                <div className="flex items-center justify-between px-3 py-2">
                  <div>
                    <p className="font-serif-title text-[15px] font-semibold">Your alerts</p>
                    <p className="text-[11px] text-[var(--text-muted)]">Updates from your matters</p>
                  </div>
                  <button onClick={() => setNotificationsOpen(false)} className="text-[11px] font-medium text-[var(--gold)]">Close</button>
                </div>
                <div className="space-y-1">
                  {recentNotifications.length === 0 ? (
                    <div className="empty-mini">You are up to date.</div>
                  ) : recentNotifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => {
                        if (!notification.read) void markRead(notification.id);
                        setNotificationsOpen(false);
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

          <div ref={profileRef} className="relative ml-1">
            <button onClick={() => setProfileOpen((open) => !open)} className="profile-trigger" aria-expanded={profileOpen}>
              <span className="avatar avatar-sm">{initials(currentUser?.name)}</span>
              <span className="hidden max-w-[120px] truncate text-left sm:block">
                <span className="block truncate text-[12px] font-semibold text-[var(--text-main)]">{currentUser?.name || 'Counsel'}</span>
                <span className="block truncate text-[10px] text-[var(--text-muted)]">{currentUser?.title || 'Practitioner'}</span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-[var(--text-muted)] sm:block" />
            </button>
            {profileOpen && (
              <div className="popover-panel right-0 top-12 w-[235px] p-2">
                <div className="mb-1 flex items-center gap-3 rounded-xl bg-[var(--bg-base)] p-3">
                  <span className="avatar">{initials(currentUser?.name)}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-semibold">{currentUser?.name || 'Counsel'}</p>
                    <p className="truncate text-[10px] text-[var(--text-muted)]">{currentUser?.email}</p>
                  </div>
                </div>
                <button className="menu-item" onClick={() => { setActiveTab('settings'); setProfileOpen(false); }}><UserRound className="h-4 w-4" /> My profile</button>
                <button className="menu-item" onClick={() => { setActiveTab('settings'); setProfileOpen(false); }}><Settings className="h-4 w-4" /> Preferences</button>
                <button className="menu-item" onClick={() => { openDeadlineCalcModal(); setProfileOpen(false); }}><Calculator className="h-4 w-4" /> Deadline calculator</button>
                <div className="my-1 border-t border-[var(--border-subtle)]" />
                <button className="menu-item text-[var(--alert-red)]" onClick={() => void logout()}><LogOut className="h-4 w-4" /> Sign out</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-2 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search your matters…" className="field-control w-full pl-10" aria-label="Search matters" />
        </div>
      </div>
    </header>
  );
}

export default Navbar;
