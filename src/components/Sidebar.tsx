import { useState, useEffect } from 'react';
import { doc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { X, LayoutDashboard, Flag, MessageSquare, Info, Mail, Home, LogOut, ShieldCheck, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore, UserProfile } from '../store';
import { getOptimizedImage } from '../lib/cloudinary';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

export default function Sidebar({ isOpen, onClose, profile }: SidebarProps) {
  const { appSettings, customPages } = useAppStore();
  const navigate = useNavigate();
  
  // No longer needing local fetch as it's synced in useFirestoreSync
  
  // High-level admin check
  const isOmar = auth.currentUser?.email === 'omarmagedugm@ittihad.club';
  const isDev = auth.currentUser?.email === 'copyrightofficialco@gmail.com';
  const isAdmin = (profile?.role === 'admin' || profile?.role === 'moderator' || (profile?.roles && (profile.roles.includes('admin') || profile.roles.includes('moderator')))) || isOmar || isDev;
  const isAnonymous = !auth.currentUser || auth.currentUser.isAnonymous;

  const handleLogout = async () => {
    try {
      await auth.signOut();
      try {
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
      } catch (e) {}
      onClose();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/auth', { replace: true });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-4/5 max-w-sm h-full bg-white dark:bg-card-dark shadow-2xl flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="p-6 pb-8 bg-gradient-to-br from-primary to-primary-dark text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
              <button 
                onClick={onClose}
                className="absolute top-4 left-4 h-8 w-8 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <X size={18} />
              </button>
              <Link to="/profile" onClick={onClose} className="flex items-center gap-4 relative z-10 pt-4 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="h-16 w-16 rounded-2xl bg-white/20 p-2 ring-1 ring-white/30 shadow-inner overflow-hidden flex items-center justify-center">
                  <img src={getOptimizedImage((isAnonymous ? appSettings.appLogo : profile.avatar), 200) || undefined} onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/dqj6gzwfg/image/upload/v1777716805/favicon_gd0ic4.png'; }} alt="Profile" className="w-full h-full object-contain rounded-[14px]" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {isAnonymous ? "أهلاً مشجع اتحاداوي" : `أهلاً، ${profile.name || 'مشجع إتحادي'}`}
                  </h3>
                </div>
              </Link>
            </div>

            {/* Sidebar Links */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isAdmin && (
                <Link to="/admin" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light border border-primary/20 pressable mb-4">
                  <LayoutDashboard size={20} />
                  <div className="flex flex-col">
                    <span className="text-sm font-black italic">ADMIN CONSOLE</span>
                    <span className="text-[9px] font-bold opacity-70">إدارة محتوى التطبيق</span>
                  </div>
                </Link>
              )}

              <div className="pt-2 pb-1 px-4">
                 <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">الأقسام الرئيسية</p>
              </div>
              
              <Link to="/" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable">
                <span className="material-symbols-outlined !text-[20px] text-primary">home</span>
                <span className="text-sm font-bold">الرئيسية</span>
              </Link>

              <Link to="/news" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable">
                <span className="material-symbols-outlined !text-[20px]">newspaper</span>
                <span className="text-sm font-bold">الأخبار والتغطيات</span>
              </Link>

              <Link to="/matches" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable">
                <span className="material-symbols-outlined !text-[20px]">sports_soccer</span>
                <span className="text-sm font-bold">جدول المباريات</span>
              </Link>

              <Link to="/live" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable">
                <span className="material-symbols-outlined !text-[20px] text-red-500 animate-pulse">live_tv</span>
                <span className="text-sm font-bold">البث المباشر</span>
              </Link>

              <Link to="/fan-zone" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable">
                <span className="material-symbols-outlined !text-[20px] text-accent">stadium</span>
                <span className="text-sm font-black">منطقة الجماهير</span>
              </Link>

              <Link to="/jersey-tryon" onClick={onClose} className="flex items-center justify-between p-3.5 rounded-2xl bg-primary/5 hover:bg-primary/10 transition-colors text-slate-700 dark:text-slate-300 pressable group border border-primary/10">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined !text-[20px] text-primary group-hover:rotate-12 transition-transform">bolt</span>
                  <span className="text-sm font-black">استوديو المشجع (AI)</span>
                </div>
                <span className="px-2 py-0.5 bg-red-500 text-white text-[8px] font-black rounded-full animate-pulse uppercase">جديد</span>
              </Link>

              <Link to="/library" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable">
                <span className="material-symbols-outlined !text-[20px]">library_music</span>
                <span className="text-sm font-bold">المكتبة الرقمية</span>
              </Link>

              <Link to="/media" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable">
                <span className="material-symbols-outlined !text-[20px]">movie</span>
                <span className="text-sm font-bold">الميديا والملخصات</span>
              </Link>

              <Link to="/history" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable uppercase">
                <span className="material-symbols-outlined !text-[20px]">history_edu</span>
                <span className="text-sm font-bold">تاريخ النادي</span>
              </Link>

              <Link to="/store" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable uppercase">
                <span className="material-symbols-outlined !text-[20px]">shopping_bag</span>
                <span className="text-sm font-bold">متجر الجماهير</span>
              </Link>

              {customPages.length > 0 && (
                <div className="pt-2 pb-1 px-4 mt-2 border-t border-slate-100 dark:border-border-dark">
                  <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mt-2">صفحات إضافية</p>
                </div>
              )}
              {customPages.map(page => (
                <Link key={page.id} to={`/page/${page.slug}`} onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable">
                  <FileText size={20} className="text-slate-400" />
                  <span className="text-sm font-bold">{page.title}</span>
                </Link>
              ))}

              <div className="pt-2 pb-1 px-4 border-t border-slate-100 dark:border-border-dark mt-2">
                 <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mt-2">استكشف المزيد</p>
              </div>

              <Link to="/profile" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable">
                <span className="material-symbols-outlined !text-[20px]">person</span>
                <span className="text-sm font-bold">حسابي</span>
              </Link>

              <Link to="/bookmarks" onClick={onClose} className="flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable uppercase">
                <span className="material-symbols-outlined !text-[20px]">bookmark</span>
                <span className="text-sm font-bold">محفوظاتي</span>
              </Link>
              <button onClick={() => { 
                toast((t) => (
                  <div className="flex flex-col gap-2 p-1">
                    <p className="font-black text-sm text-slate-800">يمكنك مراسلتنا عبر:</p>
                    <p className="text-xs font-bold text-primary">info@itthadalextv.com</p>
                    <p className="text-[10px] font-bold text-slate-500">أو عبر رسائل الصفحة الرسمية على فيسبوك</p>
                    <button 
                      onClick={() => toast.dismiss(t.id)}
                      className="mt-2 bg-slate-100 py-1.5 rounded-lg text-[10px] font-black uppercase"
                    >
                      إغلاق
                    </button>
                  </div>
                ), { duration: 6000 });
                onClose(); 
              }} className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-surface-dark transition-colors text-slate-700 dark:text-slate-300 pressable text-right">
                <Mail size={20} />
                <span className="text-sm font-bold">اتصل بنا</span>
              </button>
              
              {!isAnonymous ? (
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-red-50 text-red-500 dark:hover:bg-red-500/10 transition-colors pressable text-right mt-4"
                >
                  <LogOut size={20} />
                  <span className="text-sm font-black">تسجيل الخروج</span>
                </button>
              ) : (
                <Link 
                  to="/auth"
                  onClick={onClose}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-primary text-white hover:bg-primary-dark transition-colors pressable text-right mt-4"
                >
                  <span className="material-symbols-outlined !text-[20px]">login</span>
                  <span className="text-sm font-black">تسجيل الدخول</span>
                </Link>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-border-dark">
              <div className="flex items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-card-dark/50 border border-border-light dark:border-border-dark gap-3">
                {(appSettings.logoType || 'image') === 'image' ? (
                  <img src={getOptimizedImage(appSettings.appLogo, 100) || undefined} onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/dqj6gzwfg/image/upload/v1777716805/favicon_gd0ic4.png'; }} className="h-8 w-8 opacity-40 grayscale" alt="" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-xl font-black text-slate-400 opacity-60">{appSettings.logoText}</span>
                )}
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400">إصدار التطبيق 1.2.0</p>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">{appSettings.appName}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
