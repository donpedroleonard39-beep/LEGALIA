import React, { useState, type ReactNode } from 'react';
import { Bell, Monitor, Moon, Sun, User } from 'lucide-react';
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
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUserProfile({
        name: name.trim(),
        title: title.trim(),
        organization: org.trim(),
        // dailyDigest kept false: no digest is sent yet, so the toggle was removed.
        notifyPrefs: { email: notifyEmail, inApp: notifyInApp, dailyDigest: false },
      });
      showToast('Settings saved', 'Your changes are live.', 'success');
    } catch {
      showToast('Could not save', 'Please check your connection and try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const themes: Array<{ id: 'light' | 'dark' | 'system'; label: string; icon: ReactNode }> = [
    { id: 'light', label: 'Light', icon: <Sun className="h-5 w-5" /> },
    { id: 'dark', label: 'Dark', icon: <Moon className="h-5 w-5" /> },
    { id: 'system', label: 'Match device', icon: <Monitor className="h-5 w-5" /> },
  ];

  return (
    <form onSubmit={handleSave} className="page-stack mx-auto max-w-3xl">
      <section className="page-intro">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Your profile, how Legalia looks, and how we reach you.</p>
        </div>
      </section>

      <Card icon={<User />} title="Profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <Label text="Full name">
            <input required value={name} onChange={(e) => setName(e.target.value)} className="field-control mt-1.5 w-full" />
          </Label>
          <Label text="Title (optional)">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Barrister, Client, Paralegal" className="field-control mt-1.5 w-full" />
          </Label>
        </div>
        <Label text="Firm or organisation (optional)">
          <input value={org} onChange={(e) => setOrg(e.target.value)} className="field-control mt-1.5 w-full" />
        </Label>
        <p className="text-[13px] text-[var(--text-muted)]">Signed in as {currentUser?.email}</p>
      </Card>

      <Card icon={<Monitor />} title="Appearance">
        <div className="grid grid-cols-3 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              aria-pressed={theme === t.id}
              className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-[14px] font-semibold transition ${
                theme === t.id
                  ? 'border-[var(--gold)] bg-[var(--gold-soft)] text-[var(--gold)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card icon={<Bell />} title="Reminders & notifications">
        <Toggle
          label="Email reminders"
          hint="Hearing reminders the day before, and your custom reminders."
          checked={notifyEmail}
          onChange={setNotifyEmail}
        />
        <Toggle
          label="In-app notifications"
          hint="Show reminders and invitations under Notifications."
          checked={notifyInApp}
          onChange={setNotifyInApp}
        />
      </Card>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="button-primary">{saving ? 'Saving…' : 'Save changes'}</button>
      </div>
    </form>
  );
};

function Card({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="panel-card space-y-4">
      <h2 className="flex items-center gap-2.5 text-[16px] font-semibold text-[var(--text-main)]">
        <span className="icon-box-32 text-[var(--gold)]">{icon}</span> {title}
      </h2>
      {children}
    </section>
  );
}

function Label({ text, children }: { text: string; children: ReactNode }) {
  return <label className="block text-[13px] font-medium text-[var(--text-main)]">{text}{children}</label>;
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-4">
      <span>
        <span className="block text-[14px] font-semibold text-[var(--text-main)]">{label}</span>
        <span className="block text-[13px] text-[var(--text-muted)]">{hint}</span>
      </span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 shrink-0 accent-[var(--gold)]" />
    </label>
  );
}
