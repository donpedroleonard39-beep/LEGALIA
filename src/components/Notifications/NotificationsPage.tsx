import React from 'react';
import { Bell, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { Matter } from '../../types';

interface NotificationsPageProps {
  onSelectMatter: (m: Matter) => void;
  setActiveTab: (tab: string) => void;
  matters: Matter[];
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  onSelectMatter,
  setActiveTab,
  matters,
}) => {
  const { notifications, markRead } = useNotifications();

  return (
    <div className="space-y-6 text-[13px]">
      
      <div className="legal-card p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="icon-box-32">
            <Bell className="w-4 h-4 text-[#B8935F]" />
          </div>
          <div>
            <h1 className="font-serif font-semibold text-2xl text-[#12172B] dark:text-[#F6F3EC]">
              In-App Notification Feed
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
            notifications.map((n) => (
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
