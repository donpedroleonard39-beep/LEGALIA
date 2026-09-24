import React, { useState } from 'react';
import { Bell, CheckCircle2, Clock, UserPlus } from 'lucide-react';
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
      showToast(accept ? 'Invitation accepted' : 'Invitation declined', accept ? 'The matters are now in your register.' : 'The sender has been told.', 'success');
      if (accept) onInviteAnswered?.();
    } catch (err: any) {
      showToast('Invitation', err?.message || 'Could not answer this invitation.', 'error');
    } finally {
      await reloadNotifications().catch(() => {});
      setBusyInvite(null);
    }
  };

  return (
    <div className="space-y-6 text-[13px]">
      
      <div className="legal-card p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="icon-box-32">
            <Bell className="w-4 h-4 text-[#B8935F]" />
          </div>
          <div>
            <h1 className="font-serif font-semibold text-2xl text-[#12172B] dark:text-[#F6F3EC]">
              Notifications
            </h1>
            <p className="text-[13px] text-[#8A90AC]">
              Hearing updates, status changes, and document deposit alerts.
            </p>
          </div>
        </div>
      </div>

      <div className="legal-card p-6 space-y-3">
        <div className="divide-y divide-[rgba(184,147,95,0.15)]">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-[#8A90AC] text-[13px]">
              No notifications in feed.
            </div>
          ) : (
            notifications.map((n) => n.invite ? (
              <div
                key={n.id}
                onClick={() => { if (!n.read) markRead(n.id); }}
                className={`py-4 px-3 rounded-lg ${!n.read ? 'bg-[#B8935F]/10' : ''}`}
              >
                <div className="flex items-center gap-2 text-[#B8935F]">
                  <UserPlus className="w-4 h-4" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wide">Collaboration invitation</span>
                  {!n.read && n.invite.status === 'pending' && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#B8935F] text-[#12172B]">NEW</span>
                  )}
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-[#12172B] dark:text-[#F6F3EC]">{n.message}</p>

                <ul className="mt-3 space-y-1.5">
                  {n.invite.grants.map((g) => (
                    <li key={g.matterId} className="flex items-center justify-between gap-3 rounded-lg border border-[rgba(184,147,95,0.2)] px-3 py-2">
                      <span className="min-w-0">
                        <span className="font-mono text-[11px] font-bold text-[#B8935F]">{g.suitNumber}</span>
                        <span className="ml-2 truncate text-[12px] text-[#12172B]/80 dark:text-[#F6F3EC]/80">{g.title}</span>
                      </span>
                      <span className="shrink-0 text-[11px] text-[#8A90AC]">{g.permission === 'editor' ? 'Can edit' : 'Can view'}</span>
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
                  <p className="mt-3 text-[12px] text-[#8A90AC]">
                    {n.invite.status === 'accepted' && 'You accepted this invitation.'}
                    {n.invite.status === 'declined' && 'You declined this invitation.'}
                    {n.invite.status === 'revoked' && 'The sender withdrew this invitation.'}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1 text-[12px] text-[#8A90AC]">
                  <Clock className="w-3.5 h-3.5 text-[#B8935F]" />
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
                    ? 'bg-[#B8935F]/10 font-semibold text-[#12172B] dark:text-[#F6F3EC]'
                    : 'text-[#12172B]/80 dark:text-[#F6F3EC]/80 hover:bg-[#EDE8DC] dark:hover:bg-[#12172B]/40'
                }`}
              >
                <div className="space-y-1 text-[13px]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#B8935F]">
                      {n.suitNumber || 'System Alert'}
                    </span>
                    {!n.read && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#B8935F] text-[#12172B]">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] leading-relaxed">{n.message}</p>
                  <div className="text-[13px] text-[#8A90AC] flex items-center gap-1 pt-1">
                    <Clock className="w-3.5 h-3.5 text-[#B8935F]" />
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>

                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    n.read ? 'text-[#8A90AC]' : 'text-[#B8935F]'
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
