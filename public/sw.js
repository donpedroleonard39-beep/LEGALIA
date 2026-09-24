// Minimal service worker: makes Legalia installable as an app.
// It deliberately caches nothing, so every deploy is picked up immediately
// and no one ever sees stale matters or hearing dates.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => { /* network only */ });

// Ready for future push notifications: shows them with the Legalia icon and badge.
self.addEventListener('push', (event) => {
  const data = (() => { try { return event.data ? event.data.json() : {}; } catch { return { body: event.data && event.data.text() }; } })();
  event.waitUntil(self.registration.showNotification(data.title || 'Legalia', {
    body: data.body || '',
    icon: '/icons/notification-icon-192.png',
    badge: '/icons/badge-96.png',
    data: { url: data.url || '/' },
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) { c.navigate(url); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});
