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
    if (!remindAtDate || !selectedMatter || !currentUser) return;

    const channels: ('email' | 'inApp')[] = [];
    if (notifyEmail) channels.push('email');
    if (notifyInApp) channels.push('inApp');

    await createReminder({
      userId: currentUser.uid,
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
    <div className="space-y-6 text-[13px]">
      
      {/* Header */}
      <div className="legal-card p-6">
        <div className="flex items-center gap-3">
          <div className="icon-box-32">
            <Clock className="w-4 h-4 text-[#B8935F]" />
          </div>
          <div>
            <h1 className="font-serif font-semibold text-2xl text-[#12172B] dark:text-[#F6F3EC]">
              Hearing Alerts & Reminder Scheduler
            </h1>
            <p className="text-[13px] text-[#8A90AC]">
              Set automated notifications for upcoming court cause list dates and statutory filing windows.
            </p>
          </div>
        </div>
      </div>

      {/* Form & List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Create Reminder Form */}
        <form onSubmit={handleCreate} className="legal-card p-6 space-y-4">
          <div className="font-semibold text-sm text-[#12172B] dark:text-[#F6F3EC] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#B8935F]" />
            Schedule Suit Alert
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Select Suit / Defendant</label>
            <select
              value={selectedMatterId}
              onChange={(e) => setSelectedMatterId(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.25)] font-bold text-[#B8935F] focus:outline-none focus:ring-2 focus:ring-[#B8935F]"
            >
              {matters.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.suitNumber} &bull; {m.title.substring(0, 30)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Alert Date & Time</label>
            <input
              type="datetime-local"
              required
              value={remindAtDate}
              onChange={(e) => setRemindAtDate(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.25)] font-semibold text-[#12172B] dark:text-[#F6F3EC] focus:outline-none focus:ring-2 focus:ring-[#B8935F]"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Custom Alert Message</label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Prepare witness statement for P.T.C hearing before Hon. Justice Ajah"
              className="w-full p-2.5 rounded-lg bg-[#F6F3EC] dark:bg-[#12172B] border border-[rgba(184,147,95,0.25)] text-[#12172B] dark:text-[#F6F3EC] focus:outline-none focus:ring-2 focus:ring-[#B8935F]"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1 text-[#12172B] dark:text-[#F6F3EC]">Notification Channels</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#12172B] dark:text-[#F6F3EC]">
                <input
                  type="checkbox"
                  checked={notifyInApp}
                  onChange={(e) => setNotifyInApp(e.target.checked)}
                  className="rounded accent-[#B8935F]"
                />
                In-App Feed
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[#12172B] dark:text-[#F6F3EC]">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="rounded accent-[#B8935F]"
                />
                Trigger Email
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-[#B8935F] hover:bg-[#8C6F49] text-[#12172B] font-bold transition shadow-sm"
          >
            Schedule Alert
          </button>
        </form>

        {/* Reminders List */}
        <div className="lg:col-span-2 legal-card p-6 space-y-4">
          <div className="font-semibold text-sm text-[#12172B] dark:text-[#F6F3EC] flex items-center justify-between">
            <span>Scheduled Hearing Alerts ({reminders.length})</span>
            <span className="text-[13px] text-[#8A90AC] font-normal">Auto-scanned daily</span>
          </div>

          <div className="space-y-3">
            {reminders.length === 0 ? (
              <div className="text-center py-12 text-[#8A90AC] text-[13px]">
                No active hearing alerts scheduled.
              </div>
            ) : (
              reminders.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-lg bg-[#EDE8DC] dark:bg-[#12172B]/60 border border-[rgba(184,147,95,0.2)] flex items-start justify-between text-[13px]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#B8935F]">
                        {r.suitNumber}
                      </span>
                      <span className="text-[13px] text-[#8A90AC]">
                        {new Date(r.remindAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="font-medium text-[#12172B] dark:text-[#F6F3EC]">
                      {r.message}
                    </p>

                    <div className="text-[13px] text-[#8A90AC] flex items-center gap-2">
                      <span>Channels: {r.channel.join(', ')}</span>
                      &bull;
                      <span>Status: {r.fired ? 'FIRED' : 'PENDING'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(r.id)}
                    className="p-1.5 rounded-lg text-[#8A90AC] hover:text-[#C1554A] hover:bg-[#C1554A]/10 transition"
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
