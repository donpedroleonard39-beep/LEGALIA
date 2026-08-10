import React, { useState } from 'react';
import { Settings, Sun, Moon, Monitor, Bell, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

export const SettingsPage: React.FC = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useNotifications();

  const [name, setName] = useState(currentUser?.name || '');
  const [title, setTitle] = useState(currentUser?.title || '');
  const [org, setOrg] = useState(currentUser?.organization || '');

  const [notifyEmail, setNotifyEmail] = useState(currentUser?.notifyPrefs?.email ?? true);
  const [notifyInApp, setNotifyInApp] = useState(currentUser?.notifyPrefs?.inApp ?? true);
  const [notifyDigest, setNotifyDigest] = useState(currentUser?.notifyPrefs?.dailyDigest ?? true);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name,
      title,
      organization: org,
      notifyPrefs: { email: notifyEmail, inApp: notifyInApp, dailyDigest: notifyDigest },
    });
    showToast('Profile Updated', 'User preferences saved successfully.', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100">
            Account & System Preferences
          </h1>
          <p className="text-xs text-slate-500">
            Appearance theme, notification preferences, and user profile credentials.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
        
        {/* Theme Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-amber-600" />
            Appearance Theme
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-xl border font-bold flex flex-col items-center gap-2 transition ${
                theme === 'light'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span>Light Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-xl border font-bold flex flex-col items-center gap-2 transition ${
                theme === 'dark'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon className="w-5 h-5 text-amber-500" />
              <span>Dark Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-4 rounded-xl border font-bold flex flex-col items-center gap-2 transition ${
                theme === 'system'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Monitor className="w-5 h-5 text-amber-500" />
              <span>System Sync</span>
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-amber-600" />
            Counsel Profile Info
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">Professional Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Senior Advocate / Partner"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">Law Firm / Organization</label>
            <input
              type="text"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="Chisom & Partners Legal Chambers"
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        {/* Notifications Prefs */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600" />
            Notification Subscriptions
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
              <div>
                <div className="font-bold">Email Notifications</div>
                <div className="text-[11px] text-slate-500">Receive upcoming cause list hearing alerts via email</div>
              </div>
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
              <div>
                <div className="font-bold">In-App Feed Notifications</div>
                <div className="text-[11px] text-slate-500">Receive real-time alerts in top header bell menu</div>
              </div>
              <input
                type="checkbox"
                checked={notifyInApp}
                onChange={(e) => setNotifyInApp(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
              <div>
                <div className="font-bold">Daily Morning Digest</div>
                <div className="text-[11px] text-slate-500">Receive daily summary of court sittings at 7:00 AM</div>
              </div>
              <input
                type="checkbox"
                checked={notifyDigest}
                onChange={(e) => setNotifyDigest(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow-md"
          >
            Save Preferences
          </button>
        </div>

      </form>

    </div>
  );
};
