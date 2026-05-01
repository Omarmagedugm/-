import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import ScrollToTop from './components/ScrollToTop';
import { useAppStore } from './store';
import { useFirestoreSync } from './hooks/useFirestore';
import { auth, requestNotificationPermission } from './lib/firebase';
import Auth from './pages/Auth';
import Home from './pages/Home';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import Media from './pages/Media';
import Live from './pages/Live';
import Matches from './pages/Matches';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import FanZone from './pages/FanZone';
import History from './pages/History';
import Store from './pages/Store';
import Bookmarks from './pages/Bookmarks';
import Library from './pages/Library';
import BottomNav from './components/BottomNav';
import TopHeader from './components/TopHeader';
import MusicPlayer from './components/MusicPlayer';

export default function App() {
  const { theme } = useAppStore();
  useFirestoreSync();

  useEffect(() => {
    const root = window.document.documentElement;
    const themeColorMeta = document.getElementById('theme-color-meta');
    
    if (theme === 'dark') {
      root.classList.add('dark');
      if (themeColorMeta) themeColorMeta.setAttribute('content', '#072418'); // background-dark
    } else {
      root.classList.remove('dark');
      if (themeColorMeta) themeColorMeta.setAttribute('content', '#F8FAFC'); // background-light
    }
  }, [theme]);

  useEffect(() => {
    const handleFcmMessage = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { title, body } = customEvent.detail;
      toast.success(
        <div className="flex flex-col gap-1 cursor-pointer">
          <div className="font-bold text-sm">{title}</div>
          {body && <div className="text-xs opacity-90">{body}</div>}
        </div>,
        { duration: 6000 }
      );
    };

    window.addEventListener('fcm-message', handleFcmMessage);
    return () => window.removeEventListener('fcm-message', handleFcmMessage);
  }, []);

  // Auth Redirection Logic
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthRedirector />
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 4000,
          className: 'bg-white dark:bg-card-dark text-slate-800 dark:text-white font-bold font-display shadow-2xl rounded-2xl border border-border-light dark:border-border-dark',
        }}
      />
      <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-[calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex flex-col font-display antialiased overflow-x-hidden transition-colors duration-200">
        <TopHeader />
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Home />} />
          <Route path="/feed" element={<FanZone />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/media" element={<Media />} />
          <Route path="/live" element={<Live />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/fan-zone" element={<FanZone />} />
          <Route path="/history" element={<History />} />
          <Route path="/store" element={<Store />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/library" element={<Library />} />
        </Routes>
        <AppNav />
        <MusicPlayer />
      </div>
    </BrowserRouter>
  );
}

function AuthRedirector() {
  return null;
}

function AppNav() {
  const location = useLocation();
  const hideNavPaths = ['/auth'];
  const isSplashOrAuth = hideNavPaths.includes(location.pathname);
  if (isSplashOrAuth) return null;
  return <BottomNav />;
}
