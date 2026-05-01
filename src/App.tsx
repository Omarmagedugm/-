import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppStore } from './store';
import { useFirestoreSync } from './hooks/useFirestore';
import { auth } from './lib/firebase';
import Splash from './pages/Splash';
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
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Auth Redirection Logic
  return (
    <BrowserRouter>
      <AuthRedirector />
      <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display antialiased overflow-x-hidden transition-colors duration-200">
        <TopHeader />
        <Routes>
          <Route path="/splash" element={<Splash />} />
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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Guest browsing allowed, no automatic redirection except for splash
    if (location.pathname === '/splash') {
      const timer = setTimeout(() => navigate('/'), 2000);
      return () => clearTimeout(timer);
    }
  }, [navigate, location.pathname]);

  return null;
}

function AppNav() {
  const location = useLocation();
  const hideNavPaths = ['/splash', '/auth'];
  const isSplashOrAuth = hideNavPaths.includes(location.pathname);
  if (isSplashOrAuth) return null;
  return <BottomNav />;
}
