import React, { useState } from 'react';
import {
  Scale,
  Bell,
  Sun,
  Moon,
  User,
  LogOut,
  Clock,
  Search,
  Calculator,
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

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  openDeadlineCalcModal,
}) => {
  const { currentUser, logout } = useAuth();
  const { setTheme, isDark } = useTheme();
  const { notifications, unreadCount, markRead } = useNotifications();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/95 backdrop-blur-md transition-colors duration-200 shadow-xs">
      <div className="flex items-center justify-between px-4 lg:px-8 h-14">

        {/* Brand logo & title */}
        <div className="flex items-center gap-2.5">
          <div className="icon-box-32 border border-[var(--gold)]/30 bg-[var(--gold)]/15">
            <Scale className="w-4 h-4 text-[var(--gold)]" />
          </div>
          <span className="font-serif font-semibold text-[16px] text-[var(--text-main)] tracking-tight">
            Legalia
          </span>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suit no, defendant, judge, plot..."
            className="w-full pl-9 pr-12 py-1.5 text-[13px] rounded-lg bg-[var(--bg-base)] text-[var(--text-main)] border border-[var(--border-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--gold)] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-[12px] font-medium text-[var(--text-muted)] hover:text-[var(--gold)] px-1.5 py-0.5 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 lg:gap-3">

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/10 transition"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? <Sun className="w-4 h-4 text-[var(--gold)]" /> : <Moon className="w-4 h-4 text-[var(--text-main)]" />}
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowProfileMenu(false);
              }}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/10 transition relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[var(--alert-red)] text-white text-[10px] font-semibold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xl p-3 z-50 text-[13px]">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2 mb-2">
                  <div className="font-semibold text-[13px] text-[var(--text-main)] flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[var(--gold)]" />
                    Hearing & Court Alerts ({notifications.length})
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('notifications');
                      setShowNotifMenu(false);
                    }}
                    className="text-[12px] text-[var(--gold)] hover:underline font-medium"
                  >
                    View All
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-[12px] text-[var(--text-muted)]">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markRead(n.id);
                          if (n.matterId) {
                            setActiveTab('matters');
                          }
                          setShowNotifMenu(false);
                        }}
                        className={`p-2.5 rounded-lg text-[13px] cursor-pointer border transition ${
                          !n.read
                            ? 'bg-[var(--gold)]/10 border-[var(--gold)]/30 text-[var(--text-main)]'
                            : 'bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                        }`}
                      >
                        <div className="font-semibold flex items-center justify-between text-[var(--text-main)] mb-0.5">
                          <span className="font-mono text-[12px]">{n.suitNumber || 'System Notice'}</span>
                          <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="leading-snug text-[12px]">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge & Menu - this is the "hamburger" equivalent:
              account-scoped, occasional actions live here rather than in the
              main nav (see Calculator / Settings / Sign out below). */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifMenu(false);
              }}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-[var(--gold)]/10 transition"
            >
              <div className="w-7 h-7 rounded-lg bg-[var(--gold)] text-[var(--ink-raised)] font-bold text-[12px] flex items-center justify-center">
                {currentUser?.name.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="font-medium text-[14px] text-[var(--text-main)] leading-none">
                  {currentUser?.name}
                </div>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xl p-2 z-50 text-[13px]">
                <div className="p-2 border-b border-[var(--border-subtle)] mb-1">
                  <div className="font-semibold text-[var(--text-main)] text-[13px]">{currentUser?.name}</div>
                  <div className="text-[var(--text-muted)] text-[11px] truncate">{currentUser?.email}</div>
                </div>

                <button
                  onClick={() => {
                    openDeadlineCalcModal();
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--gold)]/10 text-[var(--text-main)] flex items-center gap-2"
                >
                  <Calculator className="w-3.5 h-3.5 text-[var(--gold)]" />
                  Statutory Calculator
                </button>

                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--gold)]/10 text-[var(--text-main)] flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-[var(--gold)]" />
                  Account & Settings
                </button>

                <button
                  onClick={() => logout()}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--alert-red)]/10 text-[var(--alert-red)] flex items-center gap-2 mt-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
