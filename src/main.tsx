import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Handle service worker updates
const updateSW = registerSW({
  onNeedRefresh() {
    // When a new version is available, we force a reload
    // Since we use autoUpdate, this might not be strictly necessary
    // but it's a good safety measure for some browsers
    if (confirm('يتوفر تحديث جديد للتطبيق. هل ترغب في التحديث الآن؟')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App is ready for offline use');
  },
});

// CRITICAL: Handle chunk loading errors which cause white screens
// This happens when the browser tries to load a JS chunk that was deleted/replaced on the server
const handleChunkError = (error: any) => {
  const message = error?.message || error?.reason?.message || '';
  const isChunkError = 
    message.toLowerCase().includes('loading chunk') || 
    message.toLowerCase().includes('supported type') ||
    (error?.filename && error.filename.includes('assets/'));

  if (isChunkError) {
    console.warn('Detected chunk loading error, forcing reload to get latest version...');
    // Add a small delay to avoid infinite reload loops if the server is actually down
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }
};

window.addEventListener('error', (event) => handleChunkError(event), true);
window.addEventListener('unhandledrejection', (event) => handleChunkError(event));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
