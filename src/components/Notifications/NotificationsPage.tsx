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
    <div className="space-y-6">
      
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-2xl text-slate-900 dark:text-slate-100">
              In-App Notification Feed
            </h1>
            <p className="text-xs text-slate-500">
              Hearing updates, status changes, and document deposit alerts.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
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
                className={`py-4 px-3 flex items-start justify-between rounded-xl cursor-pointer transition ${
                  !n.read
                    ? 'bg-amber-500/5 font-semibold text-slate-900 dark:text-slate-100'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {n.suitNumber || 'System Alert'}
                    </span>
                    {!n.read && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed">{n.message}</p>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                    <Clock className="w-3 h-3" />
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>

                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    n.read ? 'text-slate-300 dark:text-slate-700' : 'text-amber-600'
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
