import React, { useState } from 'react';
import { Archive, ArchiveRestore, Bell, CheckCheck, Clock, Inbox, Trash2, UserPlus } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { AppNotification, Matter } from '../../types';
import { respondToCollabInvite } from '../../services/collabService';

interface NotificationsPageProps {
  onSelectMatter: (m: Matter) => void;
  setActiveTab: (tab: string) => void;
  matters: Matter[];
  /** Called after an invitation is accepted so the matter list can reload. */
  onInviteAnswered?: () => void;
}

type View = 'inbox' | 'archive';

// An invitation still waiting for an answer can't be deleted (the person
// would lose the only way to accept it) - it can only be archived.
const isPendingInvite = (n: AppNotification) => n.invite?.status === 'pending';

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  onSelectMatter,
  setActiveTab,
  matters,
  onInviteAnswered,
}) => {
  const { notifications, markRead, markAllRead, archive, unarchive, remove, reloadNotifications, showToast } = useNotifications();
  const [view, setView] = useState<View>('inbox');
  const [busyInvite, setBusyInvite] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const inbox = notifications.filter((n) => !n.archived);
  const archived = notifications.filter((n) => n.archived);
  const list = view === 'inbox' ? inbox : archived;
  const unreadInbox = inbox.filter((n) => !n.read).length;

  const run = async (task: () => Promise<void>, success?: [string, string]) => {
    setWorking(true);
    try {
      await task();
      if (success) showToast(success[0], success[1], 'success');
    } catch {
      showToast('Something went wrong', 'Please check your connection and try again.', 'error');
    } finally {
      setWorking(false);
    }
  };

  const handleMarkAllRead = () => run(() => markAllRead(), ['All caught up', 'Every notification is marked as read.']);

  const handleDeleteAll = () => {
    const deletable = list.filter((n) => !isPendingInvite(n));
    const kept = list.length - deletable.length;
    if (deletable.length === 0) {
      showToast('Nothing to delete', 'Invitations waiting for your answer can’t be deleted — accept or decline them first.', 'info');
      return;
    }
    const where = view === 'inbox' ? 'your inbox' : 'the archive';
    const note = kept > 0 ? `\n\n${kept} invitation${kept === 1 ? '' : 's'} still waiting for your answer will be kept.` : '';
    if (!window.confirm(`Delete ${deletable.length} notification${deletable.length === 1 ? '' : 's'} in ${where}? This can’t be undone.${note}`)) return;
    void run(() => remove(deletable.map((n) => n.id)), ['Deleted', `${deletable.length} notification${deletable.length === 1 ? '' : 's'} removed.`]);
  };

  const handleArchiveAll = () => {
    if (inbox.length === 0) return;
    void run(() => archive(inbox.map((n) => n.id)), ['Archived', 'Your inbox is clear. Find them under Archive.']);
  };

  const handleDeleteOne = (n: AppNotification) => {
    if (!window.confirm('Delete this notification? This can’t be undone.')) return;
    void run(() => remove([n.id]));
  };

  const openNotification = (n: AppNotification) => {
    if (!n.read) void markRead(n.id);
    if (n.matterId) {
      const match = matters.find((m) => m.id === n.matterId);
      if (match) {
        onSelectMatter(match);
        setActiveTab('matters');
      }
    }
  };

  const answerInvite = async (inviteId: string, accept: boolean) => {
    setBusyInvite(inviteId);
    try {
      await respondToCollabInvite(inviteId, accept);
      showToast(accept ? 'Invitation accepted' : 'Invitation declined', accept ? 'The matters are now in your Matters list.' : 'The sender has been told.', 'success');
      if (accept) onInviteAnswered?.();
    } catch (err: any) {
      showToast('Invitation', err?.message || 'Could not answer this invitation.', 'error');
    } finally {
      await reloadNotifications().catch(() => {});
      setBusyInvite(null);
    }
  };

  return (
    <div className="page-stack">
      <section className="page-intro">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Hearing reminders and invitations to other people’s matters. Click one to open the matter.</p>
        </div>
      </section>

      <section className="panel-card !p-0 overflow-hidden">
        {/* Tabs + actions */}
        <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="flex rounded-xl bg-[var(--bg-base)] p-1" role="tablist" aria-label="Notification folders">
            <FolderTab active={view === 'inbox'} onClick={() => setView('inbox')} icon={<Inbox className="h-4 w-4" />} label="Inbox" count={unreadInbox} />
            <FolderTab active={view === 'archive'} onClick={() => setView('archive')} icon={<Archive className="h-4 w-4" />} label="Archive" count={archived.length} muted />
          </div>

          <div className="flex flex-wrap gap-2">
            {view === 'inbox' && (
              <>
                <button onClick={handleMarkAllRead} disabled={working || unreadInbox === 0} className="button-secondary !min-h-[34px] !py-1.5 text-[13px] disabled:opacity-50">
                  <CheckCheck className="h-4 w-4" /> Mark all as read
                </button>
                <button onClick={handleArchiveAll} disabled={working || inbox.length === 0} className="button-secondary !min-h-[34px] !py-1.5 text-[13px] disabled:opacity-50">
                  <Archive className="h-4 w-4" /> Archive all
                </button>
              </>
            )}
            <button
              onClick={handleDeleteAll}
              disabled={working || list.length === 0}
              className="button-secondary !min-h-[34px] !py-1.5 text-[13px] text-[var(--alert-red)] hover:!border-[var(--alert-red)] hover:!bg-[rgba(189,81,75,.08)] disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> Delete all
            </button>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{view === 'inbox' ? <Bell className="h-6 w-6" /> : <Archive className="h-6 w-6" />}</div>
            <h2 className="font-serif-title text-[18px] font-semibold">{view === 'inbox' ? 'You’re all caught up' : 'Archive is empty'}</h2>
            <p className="mt-2 max-w-sm text-[14px] text-[var(--text-muted)]">
              {view === 'inbox'
                ? 'Hearing reminders and invitations will show up here.'
                : 'Archive notifications you want to keep but get out of your inbox.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border-subtle)]">
            {list.map((n) => (
              <li key={n.id} className={`group flex gap-3 px-4 py-4 ${!n.read ? 'bg-[var(--gold-soft)]' : ''}`}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? 'bg-[var(--gold)]' : 'bg-transparent'}`} aria-hidden />

                <div className="min-w-0 flex-1">
                  {n.invite ? (
                    <InviteBody n={n} busy={busyInvite === n.invite.id} onAnswer={answerInvite} onSeen={() => { if (!n.read) void markRead(n.id); }} />
                  ) : (
                    <button onClick={() => openNotification(n)} className="block w-full text-left">
                      <span className="font-mono text-[12px] font-bold text-[var(--gold)]">{n.suitNumber || 'Legalia'}</span>
                      <span className={`mt-0.5 block text-[14px] leading-relaxed text-[var(--text-main)] ${!n.read ? 'font-semibold' : ''}`}>{n.message}</span>
                    </button>
                  )}
                  <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[var(--text-muted)]">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(n.createdAt).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>

                <div className="flex shrink-0 items-start gap-1">
                  {view === 'inbox' ? (
                    <button onClick={() => void run(() => archive([n.id]))} disabled={working} className="icon-button" aria-label="Archive" title="Archive">
                      <Archive className="h-4 w-4" />
                    </button>
                  ) : (
                    <button onClick={() => void run(() => unarchive([n.id]))} disabled={working} className="icon-button" aria-label="Move to inbox" title="Move to inbox">
                      <ArchiveRestore className="h-4 w-4" />
                    </button>
                  )}
                  {!isPendingInvite(n) && (
                    <button onClick={() => handleDeleteOne(n)} disabled={working} className="icon-button danger" aria-label="Delete" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

function FolderTab({ active, onClick, icon, label, count, muted }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number; muted?: boolean }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-[14px] font-semibold transition ${active ? 'bg-[var(--bg-surface)] text-[var(--gold)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
    >
      {icon} {label}
      {count > 0 && (
        <span className={`min-w-[20px] rounded-full px-1.5 text-center text-[11px] font-bold ${muted ? 'bg-[var(--neutral-soft)] text-[var(--text-muted)]' : 'bg-[var(--alert-red)] text-white'}`}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

function InviteBody({ n, busy, onAnswer, onSeen }: { n: AppNotification; busy: boolean; onAnswer: (id: string, accept: boolean) => void; onSeen: () => void }) {
  const invite = n.invite!;
  return (
    <div onClick={onSeen}>
      <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-[var(--gold)]">
        <UserPlus className="h-4 w-4" /> Invitation
      </p>
      <p className={`mt-0.5 text-[14px] leading-relaxed text-[var(--text-main)] ${!n.read ? 'font-semibold' : ''}`}>{n.message}</p>
      <ul className="mt-3 space-y-1.5">
        {invite.grants.map((g) => (
          <li key={g.matterId} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2">
            <span className="min-w-0 truncate">
              <span className="font-mono text-[12px] font-bold text-[var(--gold)]">{g.suitNumber}</span>
              <span className="ml-2 text-[13px] text-[var(--text-main)]">{g.title}</span>
            </span>
            <span className="shrink-0 text-[12px] text-[var(--text-muted)]">{g.permission === 'editor' ? 'Can edit' : 'Can view'}</span>
          </li>
        ))}
      </ul>
      {invite.status === 'pending' ? (
        <div className="mt-3 flex gap-2">
          <button disabled={busy} onClick={(e) => { e.stopPropagation(); onAnswer(invite.id, true); }} className="button-primary !min-h-[34px] !py-1.5 text-[13px]">Accept</button>
          <button disabled={busy} onClick={(e) => { e.stopPropagation(); onAnswer(invite.id, false); }} className="button-secondary !min-h-[34px] !py-1.5 text-[13px]">Decline</button>
        </div>
      ) : (
        <p className="mt-3 text-[13px] text-[var(--text-muted)]">
          {invite.status === 'accepted' && 'You accepted this invitation.'}
          {invite.status === 'declined' && 'You declined this invitation.'}
          {invite.status === 'revoked' && 'The sender withdrew this invitation.'}
        </p>
      )}
    </div>
  );
}
