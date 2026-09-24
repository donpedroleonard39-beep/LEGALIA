import React, { useState } from 'react';
import { CheckCircle2, Clock, UserPlus } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { Matter } from '../../types';
import { respondToCollabInvite } from '../../services/collabService';

interface NotificationsPageProps {
  onSelectMatter: (m: Matter) => void;
  setActiveTab: (tab: string) => void;
  matters: Matter[];
  /** Called after an invitation is accepted so the matter list can reload. */
  onInviteAnswered?: () => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  onSelectMatter,
  setActiveTab,
  matters,
  onInviteAnswered,
}) => {
  const { notifications, markRead, reloadNotifications, showToast } = useNotifications();
  const [busyInvite, setBusyInvite] = useState<string | null>(null);

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

      <div className="panel-card space-y-3">
        <div className="divide-y divide-[var(--border-subtle)]">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)] text-[13px]">
              Nothing here yet. Hearing reminders and invitations will show up here.
            </div>
          ) : (
            notifications.map((n) => n.invite ? (
              <div
                key={n.id}
                onClick={() => { if (!n.read) markRead(n.id); }}
                className={`py-4 px-3 rounded-lg ${!n.read ? 'bg-[var(--gold-soft)]' : ''}`}
              >
                <div className="flex items-center gap-2 text-[var(--gold)]">
                  <UserPlus className="w-4 h-4" />
                  <span className="font-mono text-[12px] font-bold uppercase tracking-wide">Invitation</span>
                  {!n.read && n.invite.status === 'pending' && (
                    <span className="px-1.5 py-0.5 rounded text-[12px] font-bold bg-[var(--gold-fill)] text-[#151b28]">NEW</span>
                  )}
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-[var(--text-main)]">{n.message}</p>

                <ul className="mt-3 space-y-1.5">
                  {n.invite.grants.map((g) => (
                    <li key={g.matterId} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-subtle)] px-3 py-2">
                      <span className="min-w-0">
                        <span className="font-mono text-[12px] font-bold text-[var(--gold)]">{g.suitNumber}</span>
                        <span className="ml-2 truncate text-[12px] text-[var(--text-main)]">{g.title}</span>
                      </span>
                      <span className="shrink-0 text-[12px] text-[var(--text-muted)]">{g.permission === 'editor' ? 'Can edit' : 'Can view'}</span>
                    </li>
                  ))}
                </ul>

                {n.invite.status === 'pending' ? (
                  <div className="mt-3 flex gap-2">
                    <button disabled={busyInvite === n.invite.id} onClick={() => answerInvite(n.invite!.id, true)} className="button-primary text-[12px]">
                      Accept
                    </button>
                    <button disabled={busyInvite === n.invite.id} onClick={() => answerInvite(n.invite!.id, false)} className="button-secondary text-[12px]">
                      Decline
                    </button>
                  </div>
                ) : (
                  <p className="mt-3 text-[12px] text-[var(--text-muted)]">
                    {n.invite.status === 'accepted' && 'You accepted this invitation.'}
                    {n.invite.status === 'declined' && 'You declined this invitation.'}
                    {n.invite.status === 'revoked' && 'The sender withdrew this invitation.'}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1 text-[12px] text-[var(--text-muted)]">
                  <Clock className="w-3.5 h-3.5 text-[var(--gold)]" />
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            ) : (
              <div
                key={n.id}
                onClick={() => {
                  markRead(n.id);
                  if (n.matterId) {
                    const match = matters.find((m) => m.id === n.matterId);
                    if (match) {
                      onSelectMatter(match);
                      setActiveTab('matters');
                    }
                  }
                }}
                className={`py-4 px-3 flex items-start justify-between rounded-lg cursor-pointer transition ${
                  !n.read
                    ? 'bg-[var(--gold-soft)] font-semibold text-[var(--text-main)]'
                    : 'text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                <div className="space-y-1 text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[var(--gold)]">
                      {n.suitNumber || 'Legalia'}
                    </span>
                    {!n.read && (
                      <span className="px-1.5 py-0.5 rounded text-[12px] font-bold bg-[var(--gold-fill)] text-[#151b28]">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] leading-relaxed">{n.message}</p>
                  <div className="text-[13px] text-[var(--text-muted)] flex items-center gap-1 pt-1">
                    <Clock className="w-3.5 h-3.5 text-[var(--gold)]" />
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>

                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    n.read ? 'text-[var(--text-muted)]' : 'text-[var(--gold)]'
                  }`}
                />
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
