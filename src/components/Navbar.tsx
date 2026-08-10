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
  Database,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
}) => {
  const { currentUser, logout } = useAuth();
  const { setTheme, isDark } = useTheme();
  const { notifications, unreadCount, markRead } = useNotifications();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[rgba(184,147,95,0.2)] bg-[#FFFFFF]/95 dark:bg-[#12172B]/95 backdrop-blur-md transition-colors duration-200 shadow-xs">
      <div className="flex items-center justify-between px-4 lg:px-8 h-14">
        
        {/* Brand logo & title */}
        <div className="flex items-center gap-2.5">
          <div className="icon-box-32 border border-[#B8935F]/30 bg-[#B8935F]/15">
            <Scale className="w-4 h-4 text-[#B8935F]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-serif font-semibold text-[16px] text-[#12172B] dark:text-[#F6F3EC] tracking-tight">
              LEGALIA
            </span>
            <span className="hidden sm:inline-block text-[11px] font-normal px-2 py-0.5 rounded bg-[#B8935F]/10 text-[#B8935F] border border-[#B8935F]/20">
              Proceedings Manager
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 text-[#5C6278] dark:text-[#8A90AC]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suit no, defendant, judge, plot..."
            className="w-full pl-9 pr-12 py-1.5 text-[13px] rounded-lg bg-[#F5F2EA] dark:bg-[#1B2140] text-[#12172B] dark:text-[#F6F3EC] border border-[rgba(184,147,95,0.2)] focus:outline-none focus:ring-1 focus:ring-[#B8935F] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-[12px] font-medium text-[#5C6278] dark:text-[#8A90AC] hover:text-[#B8935F] px-1.5 py-0.5 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 lg:gap-3">

          {/* Active Firestore Database Indicator Badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span>Firestore Live</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-1.5 rounded-lg text-[#5C6278] dark:text-[#8A90AC] hover:text-[#B8935F] hover:bg-[#B8935F]/10 transition"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? <Sun className="w-4 h-4 text-[#B8935F]" /> : <Moon className="w-4 h-4 text-[#12172B]" />}
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowProfileMenu(false);
              }}
              className="p-1.5 rounded-lg text-[#5C6278] dark:text-[#8A90AC] hover:text-[#B8935F] hover:bg-[#B8935F]/10 transition relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-[#C13B30] text-white text-[10px] font-semibold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-[#FFFFFF] dark:bg-[#1B2140] border border-[rgba(184,147,95,0.25)] shadow-xl p-3 z-50 text-[13px]">
                <div className="flex items-center justify-between border-b border-[rgba(184,147,95,0.15)] pb-2 mb-2">
                  <div className="font-semibold text-[13px] text-[#12172B] dark:text-[#F6F3EC] flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#B8935F]" />
                    Hearing & Court Alerts ({notifications.length})
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('notifications');
                      setShowNotifMenu(false);
                    }}
                    className="text-[12px] text-[#B8935F] hover:underline font-medium"
                  >
                    View All
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-[12px] text-[#5C6278] dark:text-[#8A90AC]">
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
                            ? 'bg-[#B8935F]/10 border-[#B8935F]/30 text-[#12172B] dark:text-[#F6F3EC]'
                            : 'bg-[#F5F2EA] dark:bg-[#12172B]/40 border-[rgba(184,147,95,0.15)] text-[#5C6278] dark:text-[#8A90AC]'
                        }`}
                      >
                        <div className="font-semibold flex items-center justify-between text-[#12172B] dark:text-[#F6F3EC] mb-0.5">
                          <span className="font-mono text-[12px]">{n.suitNumber || 'System Notice'}</span>
                          <span className="text-[11px] text-[#5C6278] dark:text-[#8A90AC] flex items-center gap-0.5">
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

          {/* User Profile Badge & Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifMenu(false);
              }}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#B8935F]/10 transition"
            >
              <div className="w-7 h-7 rounded-lg bg-[#B8935F] text-[#12172B] font-bold text-[12px] flex items-center justify-center">
                {currentUser?.name.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="font-medium text-[14px] text-[#12172B] dark:text-[#F6F3EC] leading-none">
                  {currentUser?.name}
                </div>
                <div className="text-[12px] text-[#5C6278] dark:text-[#8A90AC] font-normal capitalize mt-0.5">
                  {currentUser?.role}
                </div>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#FFFFFF] dark:bg-[#1B2140] border border-[rgba(184,147,95,0.25)] shadow-xl p-2 z-50 text-[13px]">
                <div className="p-2 border-b border-[rgba(184,147,95,0.15)] mb-1">
                  <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC] text-[13px]">{currentUser?.name}</div>
                  <div className="text-[#5C6278] dark:text-[#8A90AC] text-[11px] truncate">{currentUser?.email}</div>
                  <div className="inline-block mt-1 text-[11px] font-medium uppercase tracking-wide px-2 py-0.5 rounded bg-[#B8935F]/10 text-[#B8935F] border border-[#B8935F]/20">
                    {currentUser?.role}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#B8935F]/10 text-[#12172B] dark:text-[#F6F3EC] flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5 text-[#B8935F]" />
                  Account & Settings
                </button>

                <button
                  onClick={() => logout()}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#C13B30]/10 text-[#C13B30] flex items-center gap-2 mt-1"
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
