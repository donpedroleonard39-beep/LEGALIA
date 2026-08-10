import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppNotification } from '../types';
import { fetchNotifications, markNotificationAsRead } from '../services/matterService';
import { useAuth } from './AuthContext';

interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => Promise<void>;
  toasts: Toast[];
  showToast: (title: string, message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  reloadNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const reloadNotifications = async () => {
    if (!currentUser) return;
    const list = await fetchNotifications(currentUser.uid);
    setNotifications(list);
  };

  useEffect(() => {
    reloadNotifications();
  }, [currentUser]);

  const markRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const showToast = (title: string, message: string, type: Toast['type'] = 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markRead,
        toasts,
        showToast,
        removeToast,
        reloadNotifications,
      }}
    >
      {children}
      {/* Toast Render overlay */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/40 text-rose-100'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/40 text-amber-100'
                : 'bg-slate-900/90 border-slate-700 text-slate-100'
            }`}
          >
            <div className="font-bold text-sm tracking-wide">{toast.title}</div>
            <div className="text-xs opacity-90 mt-1 leading-relaxed">{toast.message}</div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
