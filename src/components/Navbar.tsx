import React, { useState } from 'react';
import {
  Scale,
  Bell,
  Sun,
  Moon,
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
} from 'lucide-react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
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
  const { currentUser, logout, switchDemoUser } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const { notifications, unreadCount, markRead } = useNotifications();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors duration-200 shadow-xs">
      <div className="flex items-center justify-between px-4 lg:px-8 h-16">
        
        {/* Brand logo & mobile badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-md shadow-amber-600/20">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <span className="font-serif font-bold text-xl text-slate-900 dark:text-slate-100 tracking-tight">
              LEGALIA
            </span>
            <span className="hidden sm:inline-block ml-2 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/20">
              Proceedings Manager
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-8 relative">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suit no, defendant, judge, plot..."
            className="w-full pl-10 pr-12 py-2 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:bg-white dark:focus:bg-slate-800 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-1.5 py-0.5 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 lg:gap-3">

          {/* Quick Demo Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowDemoMenu(!showDemoMenu);
                setShowNotifMenu(false);
                setShowProfileMenu(false);
              }}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Role:</span>
              <span className="capitalize font-bold">{currentUser?.role || 'Guest'}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showDemoMenu && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 text-xs">
                <div className="px-2 py-1.5 font-bold text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
                  Switch Role / Persona
                </div>
                {Object.entries(DEMO_USERS).map(([key, u]) => (
                  <button
                    key={key}
                    onClick={() => {
                      switchDemoUser(key as keyof typeof DEMO_USERS);
                      setShowDemoMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition ${
                      currentUser?.uid === u.uid
                        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-900 dark:text-amber-300 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div>
                      <div>{u.name}</div>
                      <div className="text-[10px] opacity-70 capitalize">{u.role} &bull; {u.organization}</div>
                    </div>
                    {currentUser?.uid === u.uid && <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowProfileMenu(false);
                setShowDemoMenu(false);
              }}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                    Hearing & Court Alerts ({notifications.length})
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('notifications');
                      setShowNotifMenu(false);
                    }}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-medium"
                  >
                    View All
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
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
                        className={`p-2.5 rounded-lg text-xs cursor-pointer border transition ${
                          !n.read
                            ? 'bg-amber-500/5 border-amber-500/20 text-slate-800 dark:text-slate-100'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="font-semibold flex items-center justify-between text-slate-900 dark:text-slate-200 mb-0.5">
                          <span>{n.suitNumber || 'System Notice'}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="leading-snug">{n.message}</p>
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
                setShowDemoMenu(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-amber-600 text-white font-bold text-xs flex items-center justify-center">
                {currentUser?.name.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden lg:block text-left text-xs">
                <div className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  {currentUser?.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                  {currentUser?.role}
                </div>
              </div>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 text-xs">
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <div className="font-bold text-slate-800 dark:text-slate-200">{currentUser?.name}</div>
                  <div className="text-slate-400 text-[11px] truncate">{currentUser?.email}</div>
                  <div className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    {currentUser?.role}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <User className="w-3.5 h-3.5" />
                  Account & Settings
                </button>

                <button
                  onClick={() => logout()}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center gap-2 mt-1"
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
