import React, { useState, useEffect } from 'react';
import { Clock, Bell, Trash2, CheckCircle2, AlertCircle, Plus, Mail } from 'lucide-react';
import { Matter, Reminder } from '../../types';
import { fetchUserReminders, createReminder, deleteReminder } from '../../services/matterService';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface RemindersManagerProps {
  matters: Matter[];
}

export const RemindersManager: React.FC<RemindersManagerProps> = ({ matters }) => {
  const { currentUser } = useAuth();
  const { showToast } = useNotifications();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMatterId, setSelectedMatterId] = useState(matters[0]?.id || '');
  const [remindAtDate, setRemindAtDate] = useState('');
  const [message, setMessage] = useState('');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);

  useEffect(() => {
    loadReminders();
  }, [currentUser]);

  const loadReminders = async () => {
    if (!currentUser) return;
    setLoading(true);
    const list = await fetchUserReminders(currentUser.uid);
    setReminders(list);
    setLoading(false);
  };

  const selectedMatter = matters.find((m) => m.id === selectedMatterId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remindAtDate || !selectedMatter) return;

    const channels: ('email' | 'inApp')[] = [];
    if (notifyEmail) channels.push('email');
    if (notifyInApp) channels.push('inApp');

    await createReminder({
      userId: currentUser?.uid || 'user_demo',
      matterId: selectedMatter.id,
      suitNumber: selectedMatter.suitNumber,
      remindAt: new Date(remindAtDate).toISOString(),
      message: message.trim() || `Hearing for ${selectedMatter.suitNumber} before ${selectedMatter.judge || 'Court'}`,
      channel: channels,
    });

    showToast('Alert Scheduled', `Reminder created for ${selectedMatter.suitNumber}.`, 'success');
    setRemindAtDate('');
    setMessage('');
    loadReminders();
  };

  const handleDelete = async (id: string) => {
    await deleteReminder(id);
    showToast('Reminder Removed', 'Alert deleted from schedule.', 'info');
    loadReminders();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100">
              Hearing Alerts & Reminder Scheduler
            </h1>
            <p className="text-xs text-slate-500">
              Set automated notifications for upcoming court cause list dates and statutory filing windows.
            </p>
          </div>
        </div>
      </div>

      {/* Form & List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create Reminder Form */}
        <form onSubmit={handleCreate} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 text-xs">
          <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-600" />
            Schedule Suit Alert
          </div>

          <div>
            <label className="block font-bold mb-1">Select Suit / Defendant</label>
            <select
              value={selectedMatterId}
              onChange={(e) => setSelectedMatterId(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-amber-600 dark:text-amber-400"
            >
              {matters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.suitNumber} &bull; {m.title.substring(0, 30)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold mb-1">Alert Date & Time</label>
            <input
              type="datetime-local"
              required
              value={remindAtDate}
              onChange={(e) => setRemindAtDate(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Custom Alert Message</label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Prepare witness statement for P.T.C hearing before Hon. Justice Ajah"
              className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">Notification Channels</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={notifyInApp}
                  onChange={(e) => setNotifyInApp(e.target.checked)}
                  className="rounded text-amber-600"
                />
                In-App Feed
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="rounded text-amber-600"
                />
                Trigger Email
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow-md"
          >
            Schedule Alert
          </button>
        </form>

        {/* Reminders List */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center justify-between">
            <span>Scheduled Hearing Alerts ({reminders.length})</span>
            <span className="text-xs text-slate-400 font-normal">Auto-scanned daily</span>
          </div>

          <div className="space-y-3">
            {reminders.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No active hearing alerts scheduled.
              </div>
            ) : (
              reminders.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-start justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {r.suitNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(r.remindAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="font-medium text-slate-800 dark:text-slate-200">
                      {r.message}
                    </p>

                    <div className="text-[10px] text-slate-400 flex items-center gap-2">
                      <span>Channels: {r.channel.join(', ')}</span>
                      &bull;
                      <span>Status: {r.fired ? 'FIRED' : 'PENDING'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
