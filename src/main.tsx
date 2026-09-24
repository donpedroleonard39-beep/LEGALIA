import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Installable web app: register the (non-caching) service worker (not on localhost dev).
if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* not fatal */ });
  });
}

// Keep the browser's "Install app" prompt so Settings can offer an Install button.
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  (window as any).__legaliaInstallPrompt = event;
  window.dispatchEvent(new Event('legalia-installable'));
});
