import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, Bell, CalendarDays, Plus, Trash2, X } from 'lucide-react';
import { Matter, Reminder } from '../../types';
import { fetchUserReminders, createReminder, deleteReminder } from '../../services/matterService';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { daysUntil, formatDate, isOpenStatus, parseLocalDate, relativeDay, todayISO } from '../../utils/dates';

interface RemindersManagerProps {
  matters: Matter[];
  onSelectMatter?: (matter: Matter) => void;
}

// Automatic hearing reminders use deterministic ids (see syncHearingReminders).
const isAutomatic = (r: Reminder) => r.id.startsWith('hr_');

const channelLabel = (r: Reminder) => {
  const email = r.channel.includes('email');
  const app = r.channel.includes('inApp');
  return email && app ? 'Email + in-app' : email ? 'Email' : 'In-app';
};

export const RemindersManager: React.FC<RemindersManagerProps> = ({ matters, onSelectMatter }) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedMatterId, setSelectedMatterId] = useState('');
  const [remindAtDate, setRemindAtDate] = useState('');
  const [message, setMessage] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);

  // matters often arrive after this page mounts - pick a default once they do.
  useEffect(() => {
    if (!selectedMatterId && matters.length) setSelectedMatterId(matters[0].id);
  }, [matters, selectedMatterId]);

  const loadReminders = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      setReminders(await fetchUserReminders(currentUser.uid));
    } catch {
      showToast('Could not load reminders', 'Please refresh and try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadReminders(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [currentUser]);

  const openMatters = matters.filter((m) => isOpenStatus(m.status));
  const upcoming = useMemo(() => openMatters
    .filter((m) => (daysUntil(m.nextHearingDate) ?? -1) >= 0)
    .sort((a, b) => (a.nextHearingDate || '').localeCompare(b.nextHearingDate || '')), [openMatters]);
  const thisWeek = upcoming.filter((m) => (daysUntil(m.nextHearingDate) ?? 99) <= 7);
  const later = upcoming.filter((m) => (daysUntil(m.nextHearingDate) ?? 0) > 7);
  const passed = openMatters.filter((m) => (daysUntil(m.nextHearingDate) ?? 0) < 0);

  const now = Date.now();
  // Old per-person hearing reminders ("hr_…") are now worked out by the
  // server from each matter's hearing date, so only custom ones are listed.
  const scheduled = reminders
    .filter((r) => !isAutomatic(r))
    .filter((r) => !r.fired && new Date(r.remindAt).getTime() >= now - 3600_000)
    .sort((a, b) => a.remindAt.localeCompare(b.remindAt));

  const selectedMatter = matters.find((m) => m.id === selectedMatterId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!selectedMatter) return showToast('Choose a matter', 'Pick which matter this reminder is for.', 'warning');
    if (!remindAtDate) return showToast('Choose a date and time', 'When should we remind you?', 'warning');
    if (!notifyEmail && !notifyInApp) return showToast('Choose how', 'Tick email, in-app, or both.', 'warning');
    if (remindAtDate < todayISO()) return showToast('That date has passed', 'Pick today or a later date.', 'warning');

    const channels: ('email' | 'inApp')[] = [];
    if (notifyEmail) channels.push('email');
    if (notifyInApp) channels.push('inApp');

    setSaving(true);
    try {
      await createReminder({
        userId: currentUser.uid,
        matterId: selectedMatter.id,
        suitNumber: selectedMatter.suitNumber,
        remindAt: new Date(`${remindAtDate}T06:00:00`).toISOString(),
        message: message.trim() || `Reminder for ${selectedMatter.suitNumber} – ${selectedMatter.title}`,
        channel: channels,
      });
      showToast('Reminder set', `We'll remind you about ${selectedMatter.suitNumber}.`, 'success');
      setRemindAtDate('');
      setMessage('');
      setShowForm(false);
      void loadReminders();
    } catch {
      showToast('Could not save reminder', 'Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await deleteReminder(id);
      setReminders((cur) => cur.filter((r) => r.id !== id));
      showToast('Reminder deleted', 'You will not be notified for it.', 'info');
    } catch {
      showToast('Could not delete', 'Please try again.', 'error');
    }
  };

  const open = (m: Matter) => onSelectMatter?.(m);

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div>
          <h1 className="page-title">Hearings</h1>
          <p className="page-subtitle">
            Your upcoming court dates. Everyone on a matter gets an email and in-app reminder the day before each hearing — you don’t need to set these up.
          </p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="button-secondary" disabled={matters.length === 0}>
          {showForm ? <><X className="h-4 w-4" /> Close</> : <><Plus className="h-4 w-4" /> Add a custom reminder</>}
        </button>
      </section>

      {showForm && (
        <form onSubmit={handleCreate} className="panel-card space-y-4">
          <div>
            <h2 className="section-title">Custom reminder</h2>
            <p className="mt-1 text-[13px] text-[var(--text-muted)]">For anything besides the hearing itself — e.g. “file witness statement”. Custom reminders are sent by the daily 7:00am run on the day you pick.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-[13px] font-medium">Matter
              <select value={selectedMatterId} onChange={(e) => setSelectedMatterId(e.target.value)} className="field-control mt-1.5 w-full">
                {matters.map((m) => <option key={m.id} value={m.id}>{m.suitNumber} — {m.title.slice(0, 40)}</option>)}
              </select>
            </label>
            <label className="block text-[13px] font-medium">Remind me on (sent at 7:00am)
              <input type="date" value={remindAtDate} onChange={(e) => setRemindAtDate(e.target.value)} className="field-control mt-1.5 w-full" />
            </label>
          </div>
          <label className="block text-[13px] font-medium">What should it say? (optional)
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. File witness statement before the pre-trial conference" maxLength={500} className="field-control mt-1.5 w-full" />
          </label>
          <div className="flex flex-wrap items-center gap-5 text-[14px]">
            <label className="flex items-center gap-2"><input type="checkbox" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" /> Email</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={notifyInApp} onChange={(e) => setNotifyInApp(e.target.checked)} className="h-4 w-4 accent-[var(--gold)]" /> In-app notification</label>
            <button type="submit" disabled={saving} className="button-primary ml-auto">{saving ? 'Saving…' : 'Save reminder'}</button>
          </div>
        </form>
      )}

      {passed.length > 0 && (
        <section className="panel-card !border-[rgba(183,120,36,.4)]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--caution-amber)]" />
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold">{passed.length} hearing date{passed.length === 1 ? ' has' : 's have'} passed</h2>
              <p className="mt-1 text-[14px] text-[var(--text-muted)]">Open the matter, record what happened and set the next date.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {passed.map((m) => (
                  <button key={m.id} onClick={() => open(m)} className="filter-chip !normal-case">
                    {m.suitNumber} · was {formatDate(m.nextHearingDate)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="panel-card overflow-hidden">
        {upcoming.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CalendarDays className="h-6 w-6" /></div>
            <h2 className="font-serif-title text-[18px] font-semibold">No upcoming hearings</h2>
            <p className="mt-2 max-w-sm text-[14px] text-[var(--text-muted)]">Add a “Next hearing date” to a matter and it will appear here.</p>
          </div>
        ) : (
          <>
            <HearingGroup title="Next 7 days" items={thisWeek} onOpen={open} urgent />
            <HearingGroup title="Later" items={later} onOpen={open} />
          </>
        )}
      </section>

      <section className="panel-card">
        <div className="panel-heading">
          <div>
            <h2 className="section-title">Your custom reminders</h2>
            <p className="mt-1 text-[13px] text-[var(--text-muted)]">Hearing reminders are automatic: everyone on a matter gets one at 7:00am the day before each hearing. Custom reminders you add are listed here.</p>
          </div>
        </div>
        {loading ? (
          <p className="py-4 text-[14px] text-[var(--text-muted)]">Loading…</p>
        ) : scheduled.length === 0 ? (
          <p className="py-4 text-[14px] text-[var(--text-muted)]">No custom reminders. Use “Add a custom reminder” for things like filing deadlines.</p>
        ) : (
          <ul className="divide-y divide-[var(--border-subtle)]">
            {scheduled.map((r) => (
              <li key={r.id} className="flex items-start gap-3 py-3">
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] text-[var(--text-main)]">{r.message}</p>
                  <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">
                    {new Date(r.remindAt).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    {' · '}{channelLabel(r)}
                  </p>
                </div>
                <button onClick={() => handleDelete(r.id)} className="icon-button danger" aria-label="Delete reminder" title="Delete reminder">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

const HearingGroup: React.FC<{ title: string; items: Matter[]; onOpen: (m: Matter) => void; urgent?: boolean }> = ({ title, items, onOpen, urgent }) => {
  if (items.length === 0) return null;
  return (
    <div className="border-b border-[var(--border-subtle)] last:border-b-0">
      <p className="px-5 pt-4 text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">{title}</p>
      <div className="divide-y divide-[var(--border-subtle)]">
        {items.map((m) => {
          const d = parseLocalDate(m.nextHearingDate);
          return (
            <button key={m.id} onClick={() => onOpen(m)} className="matter-row group w-full text-left">
              <div className={`date-tile ${urgent ? 'date-tile-urgent' : ''}`}>
                <span className="font-mono text-[12px] uppercase">{d?.toLocaleDateString(undefined, { month: 'short' })}</span>
                <strong>{d?.getDate()}</strong>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{m.title}</p>
                <p className="mt-0.5 truncate text-[13px] text-[var(--text-muted)]">{m.suitNumber} · {m.purpose || 'Hearing'} · {m.court || 'Court not added'}</p>
              </div>
              <span className={`hidden shrink-0 text-[13px] font-semibold sm:block ${urgent ? 'text-[var(--alert-red)]' : ''}`}>{relativeDay(m.nextHearingDate)}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
