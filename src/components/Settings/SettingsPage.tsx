import React, { useState } from 'react';
import { Settings, Sun, Moon, Monitor, Bell, User, ShieldCheck, Trash2, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { clearAllMatters } from '../../services/matterService';

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
    <div className="space-y-6 max-w-4xl mx-auto text-[13px]">
      
      {/* Header */}
      <div className="legal-card p-6 flex items-center gap-3">
        <div className="icon-box-32">
          <Settings className="w-4 h-4 text-[#B8935F]" />
        </div>
        <div>
          <h1 className="font-serif font-semibold text-2xl text-[#12172B] dark:text-[#F6F3EC]">
            Account & System Preferences
          </h1>
          <p className="text-[13px] text-[#8A90AC]">
            Appearance theme, notification preferences, and user profile credentials.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* Theme Card */}
        <div className="legal-card p-6 space-y-4">
          <div className="font-semibold text-sm text-[#12172B] dark:text-[#F6F3EC] flex items-center gap-2">
            <Monitor className="w-4 h-4 text-[#B8935F]" />
            Appearance Theme
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-4 rounded-lg border font-semibold flex flex-col items-center gap-2 transition ${
                theme === 'light'
                  ? 'bg-[#B8935F]/15 border-[#B8935F] text-[#B8935F]'
                  : 'bg-[#EDE8DC] dark:bg-[#12172B] border-[rgba(184,147,95,0.2)] text-[#12172B] dark:text-[#8A90AC]'
              }`}
            >
              <Sun className="w-5 h-5 text-[#B8935F]" />
              <span>Light Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-4 rounded-lg border font-semibold flex flex-col items-center gap-2 transition ${
                theme === 'dark'
                  ? 'bg-[#B8935F]/15 border-[#B8935F] text-[#B8935F]'
                  : 'bg-[#EDE8DC] dark:bg-[#12172B] border-[rgba(184,147,95,0.2)] text-[#12172B] dark:text-[#8A90AC]'
              }`}
            >
              <Moon className="w-5 h-5 text-[#B8935F]" />
              <span>Dark Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-4 rounded-lg border font-semibold flex flex-col items-center gap-2 transition ${
                theme === 'system'
                  ? 'bg-[#B8935F]/15 border-[#B8935F] text-[#B8935F]'
                  : 'bg-[#EDE8DC] dark:bg-[#12172B] border-[rgba(184,147,95,0.2)] text-[#12172B] dark:text-[#8A90AC]'
              }`}
            >
              <Monitor className="w-5 h-5 text-[#B8935F]" />
              <span>System Sync</span>
            </button>
          </div>
        </div>

        {/* Profile Info */}
        <div className="legal-card p-6 space-y-4">
          <div className="font-semibold text-sm text-[#12172B] dark:text-[#F6F3EC] flex items-center gap-2">
            <User className="w-4 h-4 text-[#B8935F]" />
            Counsel Profile Info
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.25)] font-semibold text-[#12172B] dark:text-[#F6F3EC] focus:outline-none focus:ring-2 focus:ring-[#B8935F]"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Professional Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Senior Advocate / Partner"
                className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.25)] text-[#12172B] dark:text-[#F6F3EC] focus:outline-none focus:ring-2 focus:ring-[#B8935F]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Law Firm / Organization</label>
            <input
              type="text"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="Chisom & Partners Legal Chambers"
              className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.25)] text-[#12172B] dark:text-[#F6F3EC] focus:outline-none focus:ring-2 focus:ring-[#B8935F]"
            />
          </div>
        </div>

        {/* Notifications Prefs */}
        <div className="legal-card p-6 space-y-4">
          <div className="font-semibold text-sm text-[#12172B] dark:text-[#F6F3EC] flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#B8935F]" />
            Notification Subscriptions
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-lg bg-[#EDE8DC] dark:bg-[#12172B]/60 border border-[rgba(184,147,95,0.15)] cursor-pointer">
              <div>
                <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC]">Email Notifications</div>
                <div className="text-[13px] text-[#8A90AC]">Receive upcoming cause list hearing alerts via email</div>
              </div>
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                className="w-4 h-4 accent-[#B8935F] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-[#EDE8DC] dark:bg-[#12172B]/60 border border-[rgba(184,147,95,0.15)] cursor-pointer">
              <div>
                <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC]">In-App Feed Notifications</div>
                <div className="text-[13px] text-[#8A90AC]">Receive real-time alerts in top header bell menu</div>
              </div>
              <input
                type="checkbox"
                checked={notifyInApp}
                onChange={(e) => setNotifyInApp(e.target.checked)}
                className="w-4 h-4 accent-[#B8935F] rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-lg bg-[#EDE8DC] dark:bg-[#12172B]/60 border border-[rgba(184,147,95,0.15)] cursor-pointer">
              <div>
                <div className="font-semibold text-[#12172B] dark:text-[#F6F3EC]">Daily Morning Digest</div>
                <div className="text-[13px] text-[#8A90AC]">Receive daily summary of court sittings at 7:00 AM</div>
              </div>
              <input
                type="checkbox"
                checked={notifyDigest}
                onChange={(e) => setNotifyDigest(e.target.checked)}
                className="w-4 h-4 accent-[#B8935F] rounded"
              />
            </label>
          </div>
        </div>

        {/* Database Management & Clean Slate */}
        <div className="legal-card p-6 space-y-4">
          <div className="font-semibold text-sm text-[#12172B] dark:text-[#F6F3EC] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#B8935F]" />
            Firestore Database Clean Slate
          </div>
          <p className="text-[13px] text-[#8A90AC]">
            Connected to active Cloud Firestore instance. You can clear all cause list records to start with a 100% clean practice registry.
          </p>
          <button
            type="button"
            onClick={async () => {
              if (window.confirm('Are you sure you want to delete all cause list records from Cloud Firestore? This action cannot be undone.')) {
                await clearAllMatters();
                showToast('Database Cleared', 'All placeholder and test matters have been removed from Firestore.', 'info');
                window.location.reload();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-semibold text-[12px] hover:bg-red-500/20 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Purge All Registry Matters from Firestore
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-[#B8935F] hover:bg-[#8C6F49] text-[#12172B] font-bold transition shadow-sm"
          >
            Save Preferences
          </button>
        </div>

      </form>

    </div>
  );
};
