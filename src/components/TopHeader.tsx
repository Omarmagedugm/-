import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Bell, Search, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store';
import { useState } from 'react';
import Sidebar from './Sidebar';

export default function TopHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAppStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const hideHeaderPaths = ['/splash', '/auth'];
  if (hideHeaderPaths.includes(location.pathname)) return null;

  const isHome = location.pathname === '/';
  
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'قناة الاتحاد السكندري';
    if (path === '/news') return 'مركز الأخبار';
    if (path.startsWith('/news/')) return 'تفاصيل الخبر';
    if (path === '/media') return 'ميديا الاتحاد';
    if (path === '/live') return 'البث المباشر';
    if (path === '/matches') return 'جدول المباريات';
    if (path === '/profile') return 'ملفي الشخصي';
    if (path === '/fan-zone' || path === '/feed') return 'منطقة المشجعين';
    if (path === '/history') return 'تاريخ النادي';
    if (path === '/store') return 'متجر النادي';
    if (path === '/bookmarks') return 'المحفوظات';
    if (path === '/admin') return 'لوحة التحكم';
    return 'الاتحاد السكندري';
  };

  const title = getPageTitle();

  return (
    <>
      <header id="global-header" className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-border-light/40 dark:border-border-dark/40 px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {isHome ? (
            <motion.button 
              id="menu-button"
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl glass-card text-slate-600 dark:text-slate-300 hover:text-primary transition-all duration-300"
            >
              <Menu size={20} strokeWidth={2.5} />
            </motion.button>
          ) : (
            <motion.button 
              id="back-button"
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl glass-card text-slate-600 dark:text-slate-300 hover:text-primary transition-all duration-300"
            >
              <ChevronRight size={24} className="rotate-180" />
            </motion.button>
          )}

          <div className="flex flex-col items-center">
            <h1 className="text-sm font-black tracking-tight text-primary-dark dark:text-white uppercase line-clamp-1 max-w-[180px] text-center">{title}</h1>
            <div className="flex items-center gap-1">
              <div className="h-1 w-1 bg-accent rounded-full animate-pulse"></div>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Official Platform</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isHome ? (
              <motion.button 
                id="notification-button"
                whileTap={{ scale: 0.9 }}
                className="relative flex h-10 w-10 items-center justify-center rounded-2xl glass-card text-slate-500 dark:text-slate-400 hover:text-primary transition-all duration-300"
              >
                <Bell size={20} strokeWidth={2.5} />
                <span className="absolute top-2 right-2 h-2 w-2 bg-accent rounded-full ring-2 ring-white dark:ring-surface-dark"></span>
              </motion.button>
            ) : (
              <Link 
                id="search-button-link"
                to="/news"
                className="flex h-10 w-10 items-center justify-center rounded-2xl glass-card text-slate-500 dark:text-slate-400 hover:text-primary transition-all duration-300"
              >
                <Search size={20} strokeWidth={2.5} />
              </Link>
            )}
          </div>
        </div>
      </header>

      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} profile={profile} />
    </>
  );
}
