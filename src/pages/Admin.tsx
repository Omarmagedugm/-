import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAppStore, AppRole } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { toDate, formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { db, auth, uploadImage, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  getDocs,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  query,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Newspaper, 
  PlayCircle, 
  Trophy, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Radio, 
  Rss, 
  ArrowRight, 
  Users as UsersIcon, 
  Settings as SettingsIcon,
  ShieldAlert,
  Loader2,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Activity,
  UserPlus,
  Check,
  Menu,
  Tags,
  Star,
  History as HistoryIcon,
  ShoppingCart,
  Undo,
  Eye,
  EyeOff,
  RotateCcw,
  Music,
  BookOpen,
  Disc,
  ListMusic,
  ChevronDown,
  CloudSun,
  MapPin,
  Sunrise,
  Sunset,
  Thermometer,
  Phone,
  AtSign,
  Bell,
  Download,
  Database,
  Shield,
  Copy,
  Pin,
  Maximize2,
  MoveVertical,
  Minus,
  Search,
  Calendar,
  Zap
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar';
import ScoreSelector from '../components/ScoreSelector';
import ImageUploader from '../components/ImageUploader';

const handleFileUploadFn = async (
  e: React.ChangeEvent<HTMLInputElement>, 
  fieldName: string, 
  activeTab: string,
  setUploading: (val: boolean) => void,
  setFormData: (fn: any) => void,
  type: 'image' | 'video' | 'audio' = 'image'
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setUploading(true);
  try {
    const url = await uploadImage(file, activeTab);
    if (type === 'video' && activeTab === 'media') {
      // Try to capture a frame or use a default thumbnail
      setFormData((prev: any) => ({ ...prev, [fieldName]: url, thumbnailUrl: 'https://images.unsplash.com/photo-1510563399035-7140409890a5' }));
    } else {
      setFormData((prev: any) => ({ ...prev, [fieldName]: url }));
    }
  } catch (err) {
    console.error(err);
    alert('فشل في رفع الملف');
  } finally {
    setUploading(false);
  }
};

const UploadField = ({ 
  label, 
  fieldName, 
  currentUrl, 
  type = 'image', 
  uploading, 
  handleFileUpload,
  setFormData
}: { 
  label: string, 
  fieldName: string, 
  currentUrl?: string, 
  type?: 'image' | 'video' | 'audio',
  uploading: boolean,
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, type: 'image' | 'video' | 'audio') => void,
  setFormData: (data: any) => void
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      {label && <label className="text-[10px] font-black text-slate-500 mb-1 block uppercase tracking-wider">{label}</label>}
      <div className="flex flex-col gap-2">
        {currentUrl && currentUrl.trim() !== '' ? (
          <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-border-light dark:border-border-dark group flex items-center justify-center bg-slate-900 shadow-xl">
            {type === 'image' ? (
              <img src={currentUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : type === 'video' ? (
              <video src={currentUrl} className="w-full h-full object-cover" controls />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Music size={40} className="text-primary" />
                <span className="text-[10px] font-bold text-white uppercase px-6 truncate w-full text-center bg-black/40 py-1 rounded-full backdrop-blur-md">Audio File</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
              <button 
                type="button"
                onClick={() => setFormData((prev: any) => ({ ...prev, [fieldName]: '' }))}
                className="bg-red-500 text-white p-3 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <input 
              type="file" 
              ref={fileInputRef}
              accept={type === 'video' ? "video/*" : type === 'audio' ? "audio/*" : "image/*"} 
              className="hidden" 
              onChange={(e) => handleFileUpload(e, fieldName, type)}
              disabled={uploading}
            />
            
            {type === 'image' ? (
              <div className="bg-slate-50 dark:bg-surface-dark border-2 border-dashed border-slate-200 dark:border-border-dark py-10 rounded-2xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all group">
                <ImageUploader 
                  folderName={`admin_${fieldName}`}
                  onUploadSuccess={(url) => setFormData((prev: any) => ({ ...prev, [fieldName]: url }))}
                  buttonText={uploading ? "جاري الرفع..." : "اختر صورة للرفع"}
                  showPreview={false}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-surface-dark border-2 border-dashed border-slate-200 dark:border-border-dark py-10 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all group relative overflow-hidden"
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-primary" size={28} />
                    <span className="text-[10px] font-black text-slate-500 uppercase">جاري الرفع...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:scale-110 transition-all shadow-sm">
                      <Plus size={24} />
                    </div>
                    <div className="text-center">
                       <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 block">اضغط لرفع ملف {type === 'video' ? 'فيديو' : 'صوت'}</span>
                       <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">MP4, MP3, WAV</span>
                    </div>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const UploadOrUrlField = ({ 
  label, 
  fieldName, 
  currentUrl, 
  type = 'image', 
  uploading, 
  handleFileUpload,
  setFormData,
  formData
}: { 
  label: string, 
  fieldName: string, 
  currentUrl?: string, 
  type?: 'image' | 'video' | 'audio',
  uploading: boolean,
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, type: 'image' | 'video' | 'audio') => void,
  setFormData: (fn: any) => void,
  formData: any
}) => {
  const isExternalUrl = currentUrl && currentUrl.startsWith('http') && !currentUrl.includes('firebasestorage');
  const [internalMode, setInternalMode] = useState<'upload' | 'url'>(isExternalUrl ? 'url' : 'upload');

  // Keep internal mode in sync ONLY when field is initialized (e.g. opening different edit modals)
  useEffect(() => {
    if (currentUrl) {
      const isExt = currentUrl.startsWith('http') && !currentUrl.includes('firebasestorage');
      if (isExt) setInternalMode('url');
    }
  }, [fieldName]); // Re-evaluate only when the field being edited changes

  return (
    <div className="space-y-2 bg-slate-50/50 dark:bg-white/5 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter block">{label}</label>
        <div className="flex gap-1 bg-white dark:bg-surface-dark p-1 rounded-lg border border-slate-200 dark:border-border-dark">
          <button 
            type="button"
            onClick={() => setInternalMode('upload')}
            className={`text-[8px] font-black px-2.5 py-1 rounded-md transition-all ${internalMode === 'upload' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            UPLD
          </button>
          <button 
            type="button"
            onClick={() => setInternalMode('url')}
            className={`text-[8px] font-black px-2.5 py-1 rounded-md transition-all ${internalMode === 'url' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            URL
          </button>
        </div>
      </div>
      
      {internalMode === 'upload' ? (
        <UploadField 
          label="" 
          fieldName={fieldName} 
          currentUrl={currentUrl} 
          type={type} 
          uploading={uploading} 
          handleFileUpload={handleFileUpload} 
          setFormData={setFormData}
        />
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder={type === 'image' ? "https://example.com/image.jpg" : type === 'video' ? "https://example.com/video.mp4" : "https://example.com/audio.mp3"} 
              className="w-full p-3 rounded-xl border border-border-light bg-white dark:bg-surface-dark dark:border-border-dark text-xs font-mono text-left dir-ltr focus:border-primary outline-none transition-all" 
              value={currentUrl || ''} 
              onChange={(e) => setFormData({ ...formData, [fieldName]: e.target.value })}
            />
          </div>
          {currentUrl && currentUrl.trim() !== '' && (
            <div className="relative w-full h-32 rounded-xl overflow-hidden border border-border-light dark:border-border-dark flex items-center justify-center bg-slate-900 group shadow-inner">
              {type === 'image' ? (
                <img src={currentUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                  <PlayCircle size={32} className="text-white opacity-50 group-hover:scale-110 group-hover:opacity-100 transition-all" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Music size={32} className="text-primary" />
                  <span className="text-[10px] font-bold text-white uppercase truncate px-4 w-full text-center">{currentUrl.split('/').pop()}</span>
                </div>
              )}
              <button 
                type="button"
                onClick={() => setFormData({ ...formData, [fieldName]: '' })}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Triggering deployment change
const ADMIN_VERSION = '1.3.0';

const APP_ROLES: { id: AppRole; label: string; icon: any; color: string }[] = [
  { id: 'admin', label: 'مدير كامل', icon: Shield, color: 'text-red-500' },
  { id: 'news_editor', label: 'محرر أخبار', icon: Newspaper, color: 'text-blue-500' },
  { id: 'media_editor', label: 'مدير الميديا', icon: PlayCircle, color: 'text-purple-500' },
  { id: 'matches_editor', label: 'مدير المباريات', icon: Trophy, color: 'text-orange-500' },
  { id: 'store_editor', label: 'مدير المتجر', icon: ShoppingCart, color: 'text-green-500' },
  { id: 'layout_editor', label: 'مدير الواجهة', icon: LayoutDashboard, color: 'text-accent' },
  { id: 'user_manager', label: 'مدير أعضاء', icon: UsersIcon, color: 'text-indigo-500' },
];

export default function Admin() {
  const { 
    news, media, matches, liveStream, users, appSettings, profile, clubs, polls, fanPosts, predictions,
    clubTitles, clubStats, historyEvents, stadiums, newsCategories,
    products, orders, ads, homeSections, undoStack,
    songs, albums, playlists, books, cityInfo,
    setClubTitles, setClubStats, setHistoryEvents, setStadiums, setNewsCategories,
    setProducts, setOrders, setAds, setHomeSections, pushToUndoStack, popFromUndoStack,
    setSongs, setAlbums, setPlaylists, setBooks, setCityInfo
  } = useAppStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as any) || 'overview';
  
  const setActiveTab = (tab: any) => {
    setSearchParams({ tab });
  };
  const [rssSources, setRssSources] = useState<any[]>([]);
  const [rssNews, setRssNews] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [sentNotifications, setSentNotifications] = useState<any[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [historySubTab, setHistorySubTab] = useState<'stats' | 'titles' | 'timeline' | 'stadiums'>('stats');
  const [musicSubTab, setMusicSubTab] = useState<'songs' | 'albums' | 'playlists'>('songs');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snapshot) => {
      setSentNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleExportDatabase = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في تحميل نسخة كاملة من قاعدة البيانات؟ قد تستغرق هذه العملية بعض الوقت.')) return;
    
    setIsExporting(true);
    try {
      const collectionsToExport = [
        'users', 'news', 'matches', 'clubs', 'polls', 'predictions', 'fan_posts', 
        'media', 'live_comments', 'fan_comments', 'city_info', 'settings', 'fcm_tokens', 
        'match_day_moments', 'match_day_attendance', 'ads', 'club_titles', 
        'club_stats', 'club_timeline', 'club_stadiums', 'songs', 'albums', 
        'playlists', 'books', 'news_categories', 'products', 'orders', 'home_sections',
        'notifications', 'bookmarks'
      ];

      const backupData: any = {};

      for (const collName of collectionsToExport) {
        try {
          const snapshot = await getDocs(collection(db, collName));
          backupData[collName] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } catch (err) {
          console.warn(`Could not export collection ${collName}:`, err);
        }
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('تم تحميل النسخة الاحتياطية بنجاح');
    } catch (error) {
      console.error('Backup error:', error);
      alert('فشل في إنشاء النسخة الاحتياطية');
    } finally {
      setIsExporting(false);
    }
  };

  const [notificationForm, setNotificationForm] = useState({ title: '', body: '', target: 'all' });
  const [isSending, setIsSending] = useState(false);

  const handleSendNotification = async () => {
    if (!notificationForm.title.trim() || !notificationForm.body.trim()) return alert('يرجى ملء جميع الحقول');
    setIsSending(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        title: notificationForm.title,
        body: notificationForm.body,
        target: notificationForm.target,
        readBy: [],
        createdAt: new Date().toISOString()
      });
      alert('تم إرسال الإشعار بنجاح');
      setNotificationForm({ title: '', body: '', target: 'all' });
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الإرسال');
    } finally {
      setIsSending(false);
    }
  };
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'processing' | 'delivered'>('all');
  const [comments, setComments] = useState<any[]>([]);
  const [fanComments, setFanComments] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [baseData, setBaseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  const handleEditItem = (item: any) => {
    setFormData({ ...item });
    setBaseData({ ...item });
    setIsEditing(true);
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string, type: 'image' | 'video' | 'audio' = 'image') => {
    handleFileUploadFn(e, fieldName, activeTab, setUploading, setFormData, type);
  };

  useEffect(() => {
    if (location.state?.editId && location.state?.editCategory) {
      const { editId, editCategory } = location.state;
      const list = editCategory === 'news' ? news : editCategory === 'media' ? media : matches;
      const item = list.find((i: any) => i.id === editId);
      if (item) {
        handleEditItem(item);
        setActiveTab(editCategory as any);
      }
    }
  }, [location.state, news, media, matches]);

  // Security check
  const isDev = auth.currentUser?.email === 'copyrightofficialco@gmail.com' || auth.currentUser?.email === 'omarmagedugm@ittihad.club';
  
  const hasPermission = (roles: AppRole | AppRole[]) => {
    if (isDev) return true;
    if (profile.role === 'admin') return true;
    const userRoles = [...(profile.roles || [])];
    
    // Legacy support for writer/moderator roles
    if (profile.role === 'writer') userRoles.push('news_editor');
    if (profile.role === 'moderator') userRoles.push('user_manager');
    
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    return requiredRoles.some(r => userRoles.includes(r));
  };

  const isTabAllowed = (tab: string) => {
    if (isDev || profile.role === 'admin') return true;
    if (tab === 'overview') return true;
    
    const roleMap: Record<string, AppRole[]> = {
      'news': ['news_editor'],
      'news-categories': ['news_editor'],
      'fanzone': ['news_editor', 'user_manager'],
      'media': ['media_editor'],
      'music': ['media_editor'],
      'books': ['media_editor'],
      'matches': ['matches_editor'],
      'live': ['matches_editor'],
      'comments': ['matches_editor', 'user_manager'],
      'clubs': ['matches_editor', 'layout_editor'],
      'products': ['store_editor'],
      'orders': ['store_editor'],
      'layout': ['layout_editor'],
      'city': ['layout_editor'],
      'history': ['layout_editor'],
      'polls': ['layout_editor', 'user_manager'],
      'users': ['user_manager'],
      'notifications': ['user_manager'],
      'posts': ['user_manager'],
      'fan-comments': ['user_manager'],
      'predictions': ['user_manager', 'matches_editor'],
    };

    const required = roleMap[tab];
    if (!required) return false;
    return hasPermission(required);
  };

  // If Omar or Dev, they are always admin in UI regardless of DB role
  const effectiveRole = isDev ? 'admin' : profile.role;
  const isAdminOrWriter = isDev || profile.role === 'admin' || (profile.roles && profile.roles.length > 0) || profile.role === 'writer' || profile.role === 'moderator';

  if (!isAdminOrWriter) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-background-dark flex flex-col items-center justify-center p-6 text-center">
        <ShieldAlert size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-black mb-2">عذراً، لا تمتلك صلاحيات</h1>
        <p className="text-slate-500 mb-6">هذه الصفحة مخصصة لمديري النظام أو المحررين فقط.</p>
        <button onClick={() => navigate('/')} className="bg-primary text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2">
          <ArrowRight size={20} />
          العودة للرئيسية
        </button>
      </div>
    );
  }

  // Redirection logic based on role permissions
  useEffect(() => {
    if (!isTabAllowed(activeTab)) {
      const allowedTabs = ['overview', 'news', 'media', 'matches', 'live', 'users', 'settings', 'clubs', 'polls', 'comments', 'posts', 'predictions', 'fanzone', 'history', 'news-categories', 'products', 'orders', 'layout', 'music', 'books', 'city', 'notifications', 'backup'];
      const firstAllowed = allowedTabs.find(tab => isTabAllowed(tab));
      if (firstAllowed) {
        setActiveTab(firstAllowed as any);
      }
    }
  }, [profile.roles, profile.role, isDev]);

  const [userSearch, setUserSearch] = useState('');
  const [contentSearch, setContentSearch] = useState('');
  const [newsTags, setNewsTags] = useState<string[]>([]);
  const [featuredMatchId, setFeaturedMatchId] = useState<string | null>(null);

  // Sync featured match and news categories/tags
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'featured_match'), (snap) => {
      if (snap.exists()) setFeaturedMatchId(snap.data().matchId);
    });
    return () => unsub();
  }, []);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    }
  };

  const handleAdd = async () => {
    setLoading(true);
    const cleanPayload = (obj: any) => JSON.parse(JSON.stringify(obj));
    try {
      if (activeTab === 'news') {
        const payload = {
          title: formData.title || 'عنوان افتراضي',
          content: formData.content || '',
          image: formData.image || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018',
          category: formData.category || 'أخبار النادي',
          date: isEditing ? (formData.date || new Date().toISOString()) : new Date().toISOString(),
          author: formData.author || 'الموقع الرسمي',
          editorName: formData.editorName || '',
          type: formData.rssUrl ? 'rss' : 'manual',
          rssUrl: formData.rssUrl || '',
          tagIds: formData.tagIds || []
        };
        
        if (isEditing && editingId) {
          await updateDoc(doc(db, 'news', editingId), cleanPayload(payload));
        } else {
          await addDoc(collection(db, 'news'), cleanPayload(payload));
        }
      } else if (activeTab === 'media') {
        const payload = {
          title: formData.title || 'فيديو جديد',
          type: formData.type || 'video',
          source: formData.source || (formData.url?.includes('youtube.com') || formData.url?.includes('youtu.be') ? 'youtube' : formData.url?.includes('facebook.com') ? 'facebook' : 'upload'),
          url: formData.url || '',
          videoUrl: formData.type === 'video' ? (formData.url || '') : '',
          thumbnailUrl: formData.thumbnailUrl || (formData.type === 'video' ? 'https://images.unsplash.com/photo-1510563399035-7140409890a5' : (formData.url || 'https://images.unsplash.com/photo-1510563399035-7140409890a5')),
          date: isEditing ? (formData.date || new Date().toISOString()) : new Date().toISOString(),
          duration: formData.duration || '',
          views: formData.views || '0',
          likes: isEditing ? (formData.likes || []) : []
        };

        if (isEditing && editingId) {
          await updateDoc(doc(db, 'media', editingId), cleanPayload(payload));
        } else {
          await addDoc(collection(db, 'media'), cleanPayload(payload));
        }
      } else if (activeTab === 'users') {
        const payload = {
          name: formData.name || '',
          role: formData.role || 'user',
          roles: formData.roles || [],
          tier: formData.tier || 'new'
        };

        if (isEditing && editingId) {
          await updateDoc(doc(db, 'users', editingId), cleanPayload(payload));
        }
      } else if (activeTab === 'matches') {
        const payload = {
          homeTeam: formData.homeTeam || 'الاتحاد',
          awayTeam: formData.awayTeam || 'الفريق الخصم',
          homeLogo: formData.homeLogo || 'https://upload.wikimedia.org/wikipedia/ar/thumb/0/0e/Al_Ittihad_Alexandria_Club_Logo.svg/512px-Al_Ittihad_Alexandria_Club_Logo.svg.png',
          awayLogo: formData.awayLogo || 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e4/Al_Ahly_SC_logo.png/150px-Al_Ahly_SC_logo.png',
          homeScore: formData.homeScore !== undefined && formData.homeScore !== null ? String(formData.homeScore) : (formData.status === 'upcoming' ? '-' : '0'),
          awayScore: formData.awayScore !== undefined && formData.awayScore !== null ? String(formData.awayScore) : (formData.status === 'upcoming' ? '-' : '0'),
          date: formData.date || new Date().toISOString(),
          competition: formData.competition || 'الدوري المصري',
          status: formData.status || 'upcoming',
          stadium: formData.stadium || '',
          // If we are editing a live match, we refresh the timerStartTime to "now" 
          // and use the provided base minute as the new starting point to ensure continuity
          timerStartTime: (formData.status === 'live' && formData.isTimerRunning) ? new Date().toISOString() : (formData.timerStartTime || null),
          timerBaseMinute: Number(formData.timerBaseMinute || 0),
          isTimerRunning: formData.isTimerRunning || false,
          isMatchDay: formData.isMatchDay || false,
          featured: formData.featured || false,
          sport: formData.sport || 'football'
        };

        if (isEditing && editingId) {
          await updateDoc(doc(db, 'matches', editingId), cleanPayload(payload));
        } else {
          await addDoc(collection(db, 'matches'), cleanPayload(payload));
        }
      } else if (activeTab === 'city') {
        const payload = {
          cityName: formData.cityName || 'الإسكندرية',
          temperature: formData.temperature || '--',
          condition: formData.condition || 'صافي',
          sunset: formData.sunset || '--:--',
          sunrise: formData.sunrise || '--:--',
          description: formData.description || '',
          image: formData.image || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e',
          active: formData.active ?? true,
          useAutoWeather: formData.useAutoWeather ?? true,
          weatherBg: formData.weatherBg || ''
        };
        
        await setDoc(doc(db, 'city_info', 'alexandria'), payload);
      } else if (activeTab === 'settings') {
        const payload = {
          appName: formData.appName || appSettings.appName,
          appLogo: formData.appLogo || appSettings.appLogo,
          headerLogoLight: formData.headerLogoLight !== undefined ? formData.headerLogoLight : (appSettings.headerLogoLight || ''),
          headerLogoDark: formData.headerLogoDark !== undefined ? formData.headerLogoDark : (appSettings.headerLogoDark || ''),
          logoType: formData.logoType || appSettings.logoType || 'image',
          logoText: formData.logoText || appSettings.logoText || '',
          defaultSport: formData.defaultSport || appSettings.defaultSport || 'auto'
        };
        await setDoc(doc(db, 'settings', 'global'), payload);
        const { setSettings } = useAppStore.getState();
        setSettings(payload);
      } else if (activeTab === 'live') {
        await setDoc(doc(db, 'settings', 'liveStream'), {
          isActive: formData.isActive ?? liveStream.isActive,
          url: formData.url || liveStream.url,
          title: formData.title || liveStream.title,
          viewers: Number(formData.viewers || liveStream.viewers)
        });
      } else if (activeTab === 'clubs') {
        const payload = {
          name: formData.name || '',
          logo: formData.logo || ''
        };
        if (isEditing && editingId) {
          await updateDoc(doc(db, 'clubs', editingId), cleanPayload(payload));
        } else {
          await addDoc(collection(db, 'clubs'), cleanPayload(payload));
        }
      } else if (activeTab === 'polls') {
        const options = (Array.isArray(formData.options) 
          ? formData.options 
          : (formData.options ? formData.options.split(',').map((o: string) => o.trim()) : []))
          .filter(o => o.trim() !== '');
        const payload = {
          question: formData.question || '',
          options,
          votes: isEditing ? (formData.votes || {}) : Object.fromEntries(options.map((_, i) => [i, 0])),
          voters: isEditing ? (formData.voters || []) : [],
          voterChoices: isEditing ? (formData.voterChoices || {}) : {},
          active: formData.active ?? true,
          createdAt: isEditing ? formData.createdAt : new Date().toISOString()
        };
        if (isEditing && editingId) {
          await updateDoc(doc(db, 'polls', editingId), cleanPayload(payload));
        } else {
          await addDoc(collection(db, 'polls'), cleanPayload(payload));
        }
      } else if (activeTab === 'predictions') {
        const payload = {
          matchId: formData.matchId || '',
          homeScore: Number(formData.homeScore || 0),
          awayScore: Number(formData.awayScore || 0),
          userId: isEditing ? formData.userId : (auth.currentUser?.uid || 'guest'),
          userName: formData.userName || 'مشجع إتحادي',
          userEmail: formData.userEmail || '',
          createdAt: isEditing ? formData.createdAt : new Date().toISOString()
        };
        if (isEditing && editingId) {
          await updateDoc(doc(db, 'predictions', editingId), cleanPayload(payload));
        } else {
          await addDoc(collection(db, 'predictions'), cleanPayload(payload));
        }
      } else if (activeTab === 'news-categories') {
        const categories = formData.categories || newsCategories;
        await setDoc(doc(db, 'settings', 'newsCategories'), { list: categories });
        setNewsCategories(categories);
      } else if (activeTab === 'news-tags') {
        const tags = formData.tags || useAppStore.getState().newsTags;
        await setDoc(doc(db, 'settings', 'newsTags'), { tags });
        useAppStore.getState().setNewsTags(tags);
      } else if (activeTab === 'products') {
        const payload = {
          name: formData.name || '',
          price: Number(formData.price || 0),
          description: formData.description || '',
          category: formData.category || 'tshirt',
          imageUrl: formData.imageUrl || '',
          stock: Number(formData.stock || 0)
        };
        if (isEditing && editingId) {
          await updateDoc(doc(db, 'products', editingId), cleanPayload(payload));
        } else {
          await addDoc(collection(db, 'products'), cleanPayload(payload));
        }
      } else if (activeTab === 'history') {
        if (historySubTab === 'stats') {
          const payload = {
            label: formData.label || '',
            value: Number(formData.value || 0),
            icon: formData.icon || 'star',
            hidden: formData.hidden ?? false
          };
          if (isEditing && editingId) {
            const oldData = clubStats.find(s => s.id === editingId);
            if (oldData) pushToUndoStack({ collection: 'club_stats', action: 'update', data: { ...oldData } });
            await updateDoc(doc(db, 'club_stats', editingId), cleanPayload(payload));
          } else {
            const res = await addDoc(collection(db, 'club_stats'), cleanPayload(payload));
            pushToUndoStack({ collection: 'club_stats', action: 'add', data: { id: res.id } });
          }
        } else if (historySubTab === 'titles') {
          const payload = {
            name: formData.name || '',
            count: Number(formData.count || 0),
            icon: formData.icon || 'trophy',
            category: formData.category || 'football',
            hidden: formData.hidden ?? false
          };
          if (isEditing && editingId) {
            const oldData = clubTitles.find(t => t.id === editingId);
            if (oldData) pushToUndoStack({ collection: 'club_titles', action: 'update', data: { ...oldData } });
            await updateDoc(doc(db, 'club_titles', editingId), cleanPayload(payload));
          } else {
            const res = await addDoc(collection(db, 'club_titles'), cleanPayload(payload));
            pushToUndoStack({ collection: 'club_titles', action: 'add', data: { id: res.id } });
          }
        } else if (historySubTab === 'timeline') {
          const payload = {
            year: formData.year || '',
            title: formData.title || '',
            desc: formData.desc || '',
            hidden: formData.hidden ?? false
          };
          if (isEditing && editingId) {
            const oldData = historyEvents.find(e => e.id === editingId);
            if (oldData) pushToUndoStack({ collection: 'club_timeline', action: 'update', data: { ...oldData } });
            await updateDoc(doc(db, 'club_timeline', editingId), cleanPayload(payload));
          } else {
            const res = await addDoc(collection(db, 'club_timeline'), cleanPayload(payload));
            pushToUndoStack({ collection: 'club_timeline', action: 'add', data: { id: res.id } });
          }
        } else if (historySubTab === 'stadiums') {
          const payload = {
            name: formData.name || '',
            type: formData.type || '',
            desc: formData.desc || '',
            imageUrl: formData.imageUrl || '',
            hidden: formData.hidden ?? false
          };
          if (isEditing && editingId) {
            const oldData = stadiums.find(s => s.id === editingId);
            if (oldData) pushToUndoStack({ collection: 'club_stadiums', action: 'update', data: { ...oldData } });
            await updateDoc(doc(db, 'club_stadiums', editingId), cleanPayload(payload));
          } else {
            const res = await addDoc(collection(db, 'club_stadiums'), cleanPayload(payload));
            pushToUndoStack({ collection: 'club_stadiums', action: 'add', data: { id: res.id } });
          }
        }
      } else if (activeTab === 'music') {
        if (musicSubTab === 'songs') {
          const payload = {
            title: formData.title || '',
            artist: formData.artist || '',
            audioUrl: formData.audioUrl || '',
            coverUrl: formData.coverUrl || '',
            category: formData.category || 'chant',
            duration: formData.duration || '03:30',
            hidden: formData.hidden || false,
            createdAt: new Date().toISOString()
          };
          if (isEditing && editingId) {
            await updateDoc(doc(db, 'songs', editingId), cleanPayload(payload));
          } else {
            await addDoc(collection(db, 'songs'), cleanPayload(payload));
          }
        } else if (musicSubTab === 'albums') {
          const payload = {
            title: formData.title || '',
            artist: formData.artist || '',
            coverUrl: formData.coverUrl || '',
            year: formData.year || new Date().getFullYear().toString(),
            hidden: formData.hidden || false
          };
          if (isEditing && editingId) {
            await updateDoc(doc(db, 'albums', editingId), cleanPayload(payload));
          } else {
            await addDoc(collection(db, 'albums'), cleanPayload(payload));
          }
        } else if (musicSubTab === 'playlists') {
          const payload = {
            title: formData.title || '',
            coverUrl: formData.coverUrl || '',
            songIds: formData.songIds || [],
            hidden: formData.hidden || false
          };
          if (isEditing && editingId) {
            await updateDoc(doc(db, 'playlists', editingId), cleanPayload(payload));
          } else {
            await addDoc(collection(db, 'playlists'), cleanPayload(payload));
          }
        }
      } else if (activeTab === 'books') {
        const payload = {
          title: formData.title || '',
          author: formData.author || '',
          coverUrl: formData.coverUrl || '',
          pdfUrl: formData.pdfUrl || '',
          desc: formData.desc || '',
          category: formData.category || 'كتاب',
          hidden: formData.hidden || false
        };
        if (isEditing && editingId) {
          await updateDoc(doc(db, 'books', editingId), cleanPayload(payload));
        } else {
          await addDoc(collection(db, 'books'), cleanPayload(payload));
        }
      }

      alert('تم الحفظ بنجاح');
      setShowModal(false);
      setFormData({});
      setIsEditing(false);
      setEditingId(null);
    } catch (err: any) {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'comments') {
      const q = query(collection(db, 'live_comments'), orderBy('createdAt', 'desc'), limit(50));
      return onSnapshot(q, (snapshot) => {
        setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'live_comments'));
    } else if (activeTab === 'fan-comments' || activeTab === 'fanzone') {
      const q = query(collection(db, 'fan_comments'), orderBy('createdAt', 'desc'), limit(100));
      return onSnapshot(q, (snapshot) => {
        setFanComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'fan_comments'));
    }
  }, [activeTab]);

  const handleDelete = async (coll: string, id: string) => {
    if (window.confirm('هل أنت متأكد من الحذف؟')) {
      try {
        const docRef = doc(db, coll, id);
        // Find item for undo
        let item: any = null;
        if (coll === 'club_stats') item = clubStats.find(i => i.id === id);
        else if (coll === 'club_titles') item = clubTitles.find(i => i.id === id);
        else if (coll === 'club_timeline') item = historyEvents.find(i => i.id === id);
        else if (coll === 'club_stadiums') item = stadiums.find(i => i.id === id);
        else if (coll === 'songs') item = songs.find(i => i.id === id);
        else if (coll === 'albums') item = albums.find(i => i.id === id);
        else if (coll === 'books') item = books.find(i => i.id === id);

        if (item) pushToUndoStack({ collection: coll, action: 'delete', data: { ...item } });

        await deleteDoc(docRef);
      } catch (err) {
        console.error(err);
        alert('فشل الحذف');
      }
    }
  };

  const handleToggleVisibility = async (coll: string, item: any) => {
    try {
      const newHidden = !item.hidden;
      pushToUndoStack({ collection: coll, action: 'update', data: { ...item } });
      await updateDoc(doc(db, coll, item.id), { hidden: newHidden });
    } catch (err) {
      console.error(err);
      alert('فشل تغيير الحالة');
    }
  };

  const handleUndo = async () => {
    const op = popFromUndoStack();
    if (!op) {
      alert('لا توجد عمليات للتراجع عنها');
      return;
    }

    setLoading(true);
    try {
      if (op.action === 'add') {
        // Reverse of add is delete
        await deleteDoc(doc(db, op.collection, op.data.id));
      } else if (op.action === 'delete') {
        // Reverse of delete is add (re-create with same ID)
        const { id, ...data } = op.data;
        await setDoc(doc(db, op.collection, id), data);
      } else if (op.action === 'update') {
        // Reverse of update is setting it back to original data
        const { id, ...data } = op.data;
        await updateDoc(doc(db, op.collection, id), data);
      }
      alert('تم التراجع بنجاح');
    } catch (err) {
      console.error(err);
      alert('فشل التراجع');
    } finally {
      setLoading(false);
    }
  };

  const handleTimerAction = async (action: 'start' | 'pause' | 'reset', match: any) => {
    let updates: any = {};
    const now = new Date().toISOString();
    
    if (action === 'start') {
      updates = {
        isTimerRunning: true,
        timerStartTime: now,
        status: 'live'
      };
    } else if (action === 'pause') {
      const elapsed = match.timerStartTime ? Math.floor((new Date().getTime() - new Date(match.timerStartTime).getTime()) / 60000) : 0;
      updates = {
        isTimerRunning: false,
        timerBaseMinute: (match.timerBaseMinute || 0) + elapsed,
        timerStartTime: null
      };
    } else if (action === 'reset') {
      updates = {
        isTimerRunning: false,
        timerBaseMinute: 0,
        timerStartTime: null,
        status: 'upcoming'
      };
    }

    try {
      await updateDoc(doc(db, 'matches', match.id), updates);
    } catch (err) {
      console.error(err);
      alert('فشل تحديث المؤقت');
    }
  };

  const [tick, setTick] = useState(0);

  useEffect(() => {
    // Auto-seed history if empty
    const seedHistory = async () => {
      // Check if all history collections are empty to avoid partial seeding
      // We use a local check to avoid double-seeding if the state hasn't updated yet
      const isSeededKey = 'history_data_seeded_v1';
      if (localStorage.getItem(isSeededKey)) return;

      if (clubStats.length === 0 && clubTitles.length === 0 && historyEvents.length === 0 && stadiums.length === 0) {
        console.log('Seeding initial history data...');
        try {
          // Double check with a real server fetch to be absolutely sure
          const statsSnap = await getDocs(collection(db, 'club_stats'));
          if (!statsSnap.empty) {
            localStorage.setItem(isSeededKey, 'true');
            return;
          }

          const stats = [
            { label: 'سنة مرت', value: 120, icon: 'calendar' },
            { label: 'كأس مصر', value: 6, icon: 'trophy' },
            { label: 'دوري منطقة', value: 27, icon: 'shield' },
            { label: 'بطولة سلة', value: 75, icon: 'award' },
          ];
          for (const s of stats) await addDoc(collection(db, 'club_stats'), s);

          const titles = [
            { name: 'كأس مصر', count: 6, icon: 'trophy', category: 'football' },
            { name: 'دوري الأسكندرية', count: 27, icon: 'shield', category: 'football' },
            { name: 'كأس السلطان', count: 1, icon: 'star', category: 'football' },
            { name: 'الدورة الصيفية', count: 9, icon: 'star', category: 'football' },
            { name: 'كأس ستاد البلدية', count: 1, icon: 'star', category: 'football' },
            { name: 'كأس بورسودان', count: 1, icon: 'star', category: 'football' },
            { name: 'بطولة سلة', count: 75, icon: 'award', category: 'basketball' },
            { name: 'الدوري العام', count: 16, icon: 'trophy', category: 'basketball' },
            { name: 'كأس مصر', count: 15, icon: 'trophy', category: 'basketball' },
            { name: 'الدوري المرتبط', count: 9, icon: 'shield', category: 'basketball' },
            { name: 'بطولة أفريقيا', count: 1, icon: 'star', category: 'basketball' },
            { name: 'البطولة العربية', count: 9, icon: 'star', category: 'basketball' },
            { name: 'دورة الحريري', count: 6, icon: 'star', category: 'basketball' },
            { name: 'السوبر المصري', count: 4, icon: 'star', category: 'basketball' },
            { name: 'سوبر مصر البحرين', count: 1, icon: 'star', category: 'basketball' },
            { name: 'بطولة دبي', count: 1, icon: 'star', category: 'basketball' },
            { name: 'دورة حلب', count: 1, icon: 'star', category: 'basketball' },
            { name: 'مصر الدولية', count: 1, icon: 'star', category: 'basketball' },
            { name: 'بطولة أخبار اليوم', count: 1, icon: 'star', category: 'basketball' },
            { name: 'دورة الوحدة', count: 1, icon: 'star', category: 'basketball' },
          ];
          for (const t of titles) await addDoc(collection(db, 'club_titles'), t);

          const timeline = [
            { year: '1906', title: 'تأسيس النادي', desc: 'أسس حسن رسمي ناديًا باسم نادي الاتحاد، في منطقة رأس التين واتخذ من غرفة بالدور الأرضي بمنزله مقرًّا له، أمام مدرسة رأس التين الثانوية العسكرية.' },
            { year: '1908', title: 'الأتحاد الوطني', desc: 'تمت إضافة كلمة الوطني على الاسم ليكون فعليًّا أول نادٍ شعبي وطني حيث لم يتدخل في تأسيسه أجانب كما كان الحال مع بقية الأندية المصرية التي تأسست في هذه الفترة، وكذلك تيمنًا بالحزب الوطني الذي أسسه مصطفى كامل في 1908.' },
            { year: '1916', title: 'الابطال المتحدة', desc: 'وافق حسن رسمي على تولي رئاسة نادي الأبطال ولكن بشرط واحد وهو تغيير اسم نادي الأبطال المتحدة ليصبح نادي الاتحاد، وذلك ليكون امتدادًا لنادي الاتحاد الوطني الذي أسسه حسن رسمي في 1906.' },
            { year: '1918', title: 'النادي السكندري', desc: 'في عام 1918 تولى محمد شاهين رئاسة نادي الاتحاد، وبدأ تواصل مسئولي نادي الاتحاد في أحدى المناسبات مع مسئولي النادي السكندري، وذلك لتكوين فريق قوي يضم العناصر الممتازة من الفريقين بتوحديهما فريق واحد، وانتهت المفاوضات بتوحيد اسم الناديين تحت اسم الاتحاد السكندري ليجمع بين اسمي نادي الاتحاد والنادي السكندري' },
            { year: '2014', title: 'مئوية سيد البلد', desc: 'تم الاحتفال بمئوية نادي الاتحاد السكندري عام 2014' },
          ];
          for (const ev of timeline) await addDoc(collection(db, 'club_timeline'), ev);

          const stadiumsList = [
            { name: 'ملعب المتروبول بالمنشية', type: 'أول ملعب لنادي الاتحاد', desc: 'بعد انتخاب السيد علي عبادي سكرتير عام محافظة الإسكندرية رئيسًا للنادي، حصل النادي على قطعة أرض أمام مركز مطافي المنشية لتكون ملعبه وكان معروفًا باسم ملعب المتروبول (محكمة الإسكندرية حالًّيا).', imageUrl: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781' },
            { name: 'أرض الحضرة', type: 'ثاني ملعب لنادي الاتحاد', desc: 'تعد أرض الحضرة ثاني الملاعب لنادي الاتحاد السكندري، وقد حصل عليها النادي عام 1928، وكانت عبارة عن أرض من أملاك الحكومة وكانت تشغلها ورش البلدية بجوار السكة الحديد، ساعد محمود فهمي النقراشي باشا النادي في الحصول عليها.', imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018' },
            { name: 'إستاد الشاطبي', type: 'ملعب الشاطبي 1914', desc: 'أسسه أنجلو بولاناكي في 1914، وهو أول ملعب في العالم يرفع على ساريته العلم الأوليمبي وكان ذلك في 5 إبريل عام 1914، واستمر عليه الاتحاد حتى يومنا هذا، حيث انتقل إليه النادي كملعب دائم.', imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e' },
          ];
          for (const st of stadiumsList) await addDoc(collection(db, 'club_stadiums'), st);

          console.log('Seeding complete.');
          localStorage.setItem(isSeededKey, 'true');
        } catch (error) {
          console.error('Error auto-seeding history:', error);
        }
      }
    };
    seedHistory();

    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [clubStats.length, clubTitles.length, historyEvents.length, stadiums.length]);

  const calculateCurrentMinute = (match: any) => {
    if (!match.isTimerRunning || !match.timerStartTime) return Number(match.timerBaseMinute || 0);
    const start = new Date(match.timerStartTime).getTime();
    if (isNaN(start)) return Number(match.timerBaseMinute || 0);
    const elapsed = Math.max(0, Math.floor((new Date().getTime() - start) / 60000));
    return Number(match.timerBaseMinute || 0) + elapsed;
  };

  const openEditModal = (data: any, id: string) => {
    const freshData = { ...data };
    setFormData(freshData);
    setBaseData(freshData);
    setIsEditing(true);
    setEditingId(id);
    setShowModal(true);
  };

  const handleEditMatch = (match: any) => {
    const data = { ...match };
    setFormData(data);
    setBaseData(data);
    setIsEditing(true);
    setEditingId(match.id);
    setActiveTab('matches');
    setShowModal(true);
  };

  const handleEditNews = (item: any) => {
    const data = { ...item, image: item.image || item.imageUrl };
    setFormData(data);
    setBaseData(data);
    setIsEditing(true);
    setEditingId(item.id);
    setShowModal(true);
  };

  const openAddModal = () => {
    let initialData = {};
    if (activeTab === 'polls') {
      initialData = { options: ['', ''], active: true };
    }
    setFormData(initialData);
    setBaseData(initialData);
    setIsEditing(false);
    setEditingId(null);
    setShowModal(true);
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col pb-32 min-h-screen bg-slate-50 dark:bg-background-dark relative">
      {/* Sidebar Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={() => setShowSidebar(false)}
        />
      )}
      
      {/* Sidebar Drawer */}
      <div className={`fixed inset-y-0 right-0 z-[70] transition-transform duration-300 transform ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
        <AdminSidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setShowSidebar(false); }} onClose={() => setShowSidebar(false)} />
      </div>

      <div className="p-4 flex items-center justify-between gap-3">
         <button onClick={() => setShowSidebar(true)} className="flex-1 h-12 bg-white dark:bg-surface-dark rounded-2xl flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 border border-border-light dark:border-border-dark shadow-sm pressable active:scale-95 transition-all">
           <Menu size={18} />
           <span className="text-[10px] font-black uppercase tracking-widest">قائمة الإدارة</span>
         </button>

         <button 
           onClick={async () => {
             try {
               await auth.signOut();
               localStorage.clear();
               sessionStorage.clear();
               window.location.href = '/auth';
             } catch (error) {
               console.error('Logout error:', error);
               window.location.href = '/auth';
             }
           }}
           className="h-12 px-5 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm pressable active:scale-95 transition-all"
         >
           خروج
         </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {activeTab === 'overview' ? 'لوحة التحكم' :
             activeTab === 'news' ? 'إدارة الأخبار' : 
             activeTab === 'news-categories' ? 'إدارة أقسام الأخبار' :
             activeTab === 'news-tags' ? 'إدارة وسوم الأخبار' :
             activeTab === 'fanzone' ? 'إدارة منطقة الجماهير' :
             activeTab === 'media' ? 'إدارة الميديا' : 
             activeTab === 'matches' ? 'إدارة المباريات' : 
             activeTab === 'posts' ? 'منشورات الجماهير' :
             activeTab === 'predictions' ? 'إدارة توقعات المباريات' :
             activeTab === 'notifications' ? 'إرسال الإشعارات' :
             activeTab === 'users' ? 'إدارة الأعضاء' : 
             activeTab === 'settings' ? 'إعدادات التطبيق' : 
             activeTab === 'clubs' ? 'إدارة الأندية' : 
             activeTab === 'orders' ? 'إدارة المشتريات' :
             activeTab === 'polls' ? 'إدارة الاستطلاعات' : 
             activeTab === 'layout' ? 'تعديل الصفحة الرئيسية' :
             activeTab === 'history' ? 'تاريخ النادي' :
             activeTab === 'city' ? 'طقس الإسكندرية' :
             activeTab === 'live' ? 'البث المباشر' :
             activeTab === 'comments' ? 'تعليقات البث المباشر' : 'لوحة التحكم'}
          </h1>
          {['news', 'media', 'matches', 'clubs', 'polls', 'predictions', 'products', 'history', 'music', 'books'].includes(activeTab) && (
            <button 
              onClick={openAddModal}
              className="flex items-center gap-1 bg-primary text-white px-3 py-1.5 rounded-lg font-bold shadow-sm shadow-primary/20 hover:scale-105 transition-all text-xs"
            >
              <Plus size={14} />
              إضافة
            </button>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {activeTab === 'fanzone' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setActiveTab('posts')}
                  className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-border-light dark:border-border-dark flex flex-col items-center gap-2 shadow-sm hover:scale-105 transition-all"
                >
                  <MessageSquare size={24} className="text-orange-500" />
                  <span className="font-black text-xs">منشورات الجماهير</span>
                  <span className="text-[10px] font-bold text-slate-400">{fanPosts.length} منشور</span>
                </button>
                <button 
                  onClick={() => setActiveTab('fan-comments')}
                  className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-border-light dark:border-border-dark flex flex-col items-center gap-2 shadow-sm hover:scale-105 transition-all"
                >
                  <MessageSquare size={24} className="text-pink-500" />
                  <span className="font-black text-xs">تعليقات الفان زون</span>
                  <span className="text-[10px] font-bold text-slate-400">{fanComments.length} تعليق</span>
                </button>
                <button 
                  onClick={() => setActiveTab('polls')}
                  className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-border-light dark:border-border-dark flex flex-col items-center gap-2 shadow-sm hover:scale-105 transition-all"
                >
                  <BarChart3 size={24} className="text-green-500" />
                  <span className="font-black text-xs">الاستطلاعات</span>
                  <span className="text-[10px] font-bold text-slate-400">{polls.length} استطلاع</span>
                </button>
                <button 
                  onClick={() => setActiveTab('predictions')}
                  className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-border-light dark:border-border-dark flex flex-col items-center gap-2 shadow-sm hover:scale-105 transition-all"
                >
                  <Trophy size={24} className="text-yellow-500" />
                  <span className="font-black text-xs">توقعات المباريات</span>
                  <span className="text-[10px] font-bold text-slate-400">{predictions.length} توقع</span>
                </button>
                <button 
                  onClick={() => setActiveTab('comments')}
                  className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-border-light dark:border-border-dark flex flex-col items-center gap-2 shadow-sm hover:scale-105 transition-all"
                >
                  <MessageSquare size={24} className="text-blue-500" />
                  <span className="font-black text-xs">تعليقات البث</span>
                  <span className="text-[10px] font-bold text-slate-400">{comments.length} تعليق</span>
                </button>
              </div>

              <div className="bg-primary/5 rounded-2xl p-6 border border-primary/20">
                <h3 className="font-black text-sm mb-2 text-primary">إحصائيات سريعة</h3>
                <div className="flex justify-between items-center bg-white dark:bg-card-dark p-4 rounded-xl">
                  <div className="text-center flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">الأكثر تفاعلاً</p>
                    <p className="text-sm font-black text-primary">
                      {fanPosts.length > 0 ? (fanPosts.sort((a,b) => (b.likes||0) - (a.likes||0))[0].userName) : '---'}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-slate-100 mx-4"></div>
                  <div className="text-center flex-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">تصويتات اليوم</p>
                    <p className="text-sm font-black text-primary">
                      {polls.filter(p => p.active).length} نشط
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'city' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-card-dark rounded-3xl p-6 border border-border-light dark:border-border-dark shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <CloudSun size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-sm">بيانات مدينة الإسكندرية</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Alexandria City Info</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => openEditModal(cityInfo || {}, 'cityInfo')}
                    className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-primary/20 flex items-center gap-2 transition-all pressable"
                  >
                    <Edit2 size={14} />
                    تعديل البيانات
                  </button>
                </div>

                {cityInfo ? (
                  <div className="space-y-6">
                    <div className="relative h-48 rounded-3xl overflow-hidden border border-border-light dark:border-border-dark">
                      <img src={cityInfo.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                        <div className="flex items-end justify-between">
                          <div>
                            <h2 className="text-2xl font-black text-white leading-none">{cityInfo.cityName}</h2>
                            <p className="text-white/70 text-[10px] font-bold mt-1 flex items-center gap-1">
                              <MapPin size={10} /> مصر، الإسكندرية
                            </p>
                          </div>
                          <div className="text-right">
                             <div className="flex items-center gap-2 text-white">
                               <Thermometer size={20} className="text-primary" />
                               <span className="text-3xl font-black">{cityInfo.temperature}°</span>
                             </div>
                             <p className="text-white/80 text-[10px] font-black uppercase tracking-widest">{cityInfo.condition}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-surface-dark p-4 rounded-2xl border border-slate-100 dark:border-border-dark flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                          <Sunrise size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">الشروق</p>
                          <p className="text-sm font-black tabular-nums">{cityInfo.sunrise}</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-surface-dark p-4 rounded-2xl border border-slate-100 dark:border-border-dark flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                          <Sunset size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">الغروب</p>
                          <p className="text-sm font-black tabular-nums">{cityInfo.sunset}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-surface-dark p-4 rounded-2xl border border-slate-100 dark:border-border-dark">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">نبذة عن المدينة</h4>
                       <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-bold">{cityInfo.description}</p>
                    </div>

                    <div className="flex items-center gap-2 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <div className={`w-3 h-3 rounded-full ${cityInfo.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-xs font-black uppercase tracking-tighter">
                        الحالة: {cityInfo.active ? 'نشط على الموقع' : 'مخفي'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3 border-2 border-dashed border-slate-100 rounded-3xl">
                     <CloudSun size={48} className="opacity-20" />
                     <p className="text-xs font-bold">لا توجد بيانات مسجلة لمدينة الإسكندرية</p>
                     <button onClick={openAddModal} className="text-primary text-xs font-black border-b border-primary/30">إضافة البيانات الآن</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'layout' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight">إدارة الصفحة الرئيسية</h2>
                  <p className="text-[10px] font-bold text-slate-400">Home Page Mobile Optimizer</p>
                </div>
                <button 
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const cleanSections = homeSections.map(section => JSON.parse(JSON.stringify(section)));
                      await setDoc(doc(db, 'settings', 'homeLayout'), { sections: cleanSections });
                      alert('تم حفظ التغييرات بنجاح');
                    } catch (err: any) {
                      console.error(err);
                      alert('فشل في الحفظ: ' + (err?.message || err));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="bg-primary text-white px-5 py-2.5 rounded-2xl text-xs font-black shadow-lg shadow-primary/20 flex items-center gap-2 pressable"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  حفظ الكل
                </button>
              </div>

              <div className="bg-white dark:bg-card-dark rounded-[32px] p-4 border border-border-light dark:border-border-dark shadow-sm">
                <div className="flex flex-col gap-3">
                  {[...homeSections].sort((a,b) => {
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    return a.order - b.order;
                  }).map((section, index) => (
                    <div key={section.id} className={`flex flex-col gap-3 p-4 rounded-3xl border transition-all ${section.active ? 'bg-slate-50 dark:bg-surface-dark border-slate-100 dark:border-border-dark' : 'bg-slate-100/50 dark:bg-slate-800/30 opacity-60 border-dashed border-slate-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1 items-center bg-white dark:bg-card-dark p-1 rounded-xl shadow-sm border border-border-light dark:border-border-dark">
                          <button 
                            disabled={index === 0}
                            onClick={() => {
                              const sorted = [...homeSections].sort((a,b) => a.order - b.order);
                              const idx = sorted.findIndex(s => s.id === section.id);
                              if (idx > 0) {
                                const current = sorted[idx];
                                const prev = sorted[idx - 1];
                                [current.order, prev.order] = [prev.order, current.order];
                                setHomeSections([...sorted]);
                              }
                            }}
                            className="p-1 text-slate-300 hover:text-primary disabled:opacity-0"
                          >
                            <ChevronDown size={14} className="rotate-180" />
                          </button>
                          <button 
                            disabled={index === homeSections.length - 1}
                            onClick={() => {
                              const sorted = [...homeSections].sort((a,b) => a.order - b.order);
                              const idx = sorted.findIndex(s => s.id === section.id);
                              if (idx < sorted.length - 1) {
                                const current = sorted[idx];
                                const next = sorted[idx + 1];
                                [current.order, next.order] = [next.order, current.order];
                                setHomeSections([...sorted]);
                              }
                            }}
                            className="p-1 text-slate-300 hover:text-primary disabled:opacity-0"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black uppercase text-slate-400">{section.type}</span>
                             {section.pinned && <Pin size={10} className="text-accent fill-accent" />}
                             <h4 className="text-xs font-black">{section.title || 'بدون عنوان'}</h4>
                          </div>
                          <p className="text-[8px] text-slate-500 font-mono">ID: {section.id.slice(0, 8)}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="relative inline-flex items-center cursor-pointer scale-75">
                            <input 
                              type="checkbox" 
                              checked={section.active} 
                              onChange={(e) => {
                                const newSections = homeSections.map(s => s.id === section.id ? { ...s, active: e.target.checked } : s);
                                setHomeSections(newSections);
                              }}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                        <div className="flex gap-1.5">
                           <button 
                            onClick={() => {
                              const newSections = homeSections.map(s => s.id === section.id ? { ...s, pinned: !s.pinned, order: !s.pinned ? -1 : 100 } : s);
                              setHomeSections(newSections);
                            }}
                            className={`p-2 rounded-xl border transition-all ${section.pinned ? 'bg-accent text-white border-accent' : 'bg-white dark:bg-card-dark text-slate-400 border-border-light dark:border-border-dark'}`}
                            title="تثبيت في الأعلى"
                          >
                            <Pin size={12} className={section.pinned ? 'fill-current' : ''} />
                          </button>
                          <button 
                            onClick={() => {
                              const newSection = { ...section, id: uuidv4(), order: homeSections.length, pinned: false };
                              setHomeSections([...homeSections, newSection]);
                            }}
                            className="p-2 bg-white dark:bg-card-dark text-slate-400 rounded-xl border border-border-light dark:border-border-dark hover:text-blue-500"
                            title="نسخ البلوك"
                          >
                            <Copy size={12} />
                          </button>
                          {(section.type === 'widget' || section.type === 'image') && (
                            <button 
                              onClick={() => {
                                const newTitle = window.prompt('تعديل العنوان', section.title || '');
                                if (section.type === 'widget') {
                                  const newHtml = window.prompt('تعديل كود الـ HTML', section.htmlCode || '');
                                  if (newTitle !== null || newHtml !== null) {
                                    setHomeSections(homeSections.map(s => s.id === section.id ? { 
                                      ...s, 
                                      title: newTitle !== null ? newTitle : s.title,
                                      htmlCode: newHtml !== null ? newHtml : s.htmlCode 
                                    } : s));
                                  }
                                } else if (section.type === 'image') {
                                  const newUrl = window.prompt('تعديل رابط الصورة', section.imageUrl || '');
                                  const newLink = window.prompt('تعديل الرابط (Link)', section.link || '');
                                  if (newTitle !== null || newUrl !== null || newLink !== null) {
                                    setHomeSections(homeSections.map(s => s.id === section.id ? { 
                                      ...s, 
                                      title: newTitle !== null ? newTitle : s.title,
                                      imageUrl: newUrl !== null ? newUrl : s.imageUrl,
                                      link: newLink !== null ? newLink : s.link
                                    } : s));
                                  }
                                }
                              }}
                              className="p-2 bg-white dark:bg-card-dark text-slate-400 rounded-xl border border-border-light dark:border-border-dark"
                            >
                              <Edit2 size={12} />
                            </button>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                           {/* Spacing */}
                           <div className="flex items-center gap-1.5 bg-white dark:bg-card-dark px-2 py-1 rounded-xl border border-border-light dark:border-border-dark">
                              <button 
                                onClick={() => {
                                  const sp = Math.max(0, (section.spacing || 0) - 4);
                                  setHomeSections(homeSections.map(s => s.id === section.id ? { ...s, spacing: sp } : s));
                                }}
                                className="text-slate-400"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="text-[9px] font-black min-w-[24px] text-center">{section.spacing || 0}</span>
                              <button 
                                onClick={() => {
                                  const sp = (section.spacing || 0) + 4;
                                  setHomeSections(homeSections.map(s => s.id === section.id ? { ...s, spacing: sp } : s));
                                }}
                                className="text-slate-400"
                              >
                                <Plus size={10} />
                              </button>
                           </div>

                           <button 
                            onClick={() => {
                              if (window.confirm('هل أنت متأكد من حذف هذا البلوك؟')) {
                                setHomeSections(homeSections.filter(s => s.id !== section.id));
                              }
                            }}
                            className="p-2 bg-red-50 text-red-500 rounded-xl"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-border-dark">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">إضافة بلوك جديد</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500">نوع البلوك</label>
                      <select 
                        id="new-section-type"
                        className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark text-xs font-bold"
                        onChange={(e) => {
                          const widgetCode = document.getElementById('new-section-widget-code');
                          if (widgetCode) {
                            if (e.target.value === 'widget') {
                              widgetCode.style.display = 'block';
                              const imageInputs = document.getElementById('new-section-image-inputs');
                              if (imageInputs) imageInputs.style.display = 'none';
                            } else if (e.target.value === 'image') {
                              widgetCode.style.display = 'none';
                              const imageInputs = document.getElementById('new-section-image-inputs');
                              if (imageInputs) imageInputs.style.display = 'block';
                            } else {
                              widgetCode.style.display = 'none';
                              const imageInputs = document.getElementById('new-section-image-inputs');
                              if (imageInputs) imageInputs.style.display = 'none';
                            }
                          }
                        }}
                      >
                        <option value="news">أخبار</option>
                        <option value="matches">مباريات</option>
                        <option value="media">ميديا</option>
                        <option value="polls">استطلاعات</option>
                        <option value="history">تاريخ النادي</option>
                        <option value="hero">المباراة القادمة / الحية</option>
                        <option value="live">بث مباشر متاح</option>
                        <option value="custom">مخصص (Fan Zone)</option>
                        <option value="widget">برمجية HTML مخصصة</option>
                        <option value="image">صورة بانر </option>
                        <option value="city">طقس وتاريخ الإسكندرية</option>
                        <option value="advertise">أعلن معنا (Widget)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500">العنوان (اختياري)</label>
                      <input 
                        id="new-section-title"
                        type="text" 
                        placeholder="أدخل عنواناً..."
                        className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark text-xs font-bold"
                      />
                    </div>
                    <div id="new-section-widget-code" className="col-span-2 space-y-2" style={{ display: 'none' }}>
                      <label className="text-[10px] font-black text-slate-500">كود الـ Widget (HTML)</label>
                      <textarea 
                        id="new-section-html"
                        placeholder="<div class='my-widget'>...</div>"
                        className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark text-[10px] font-mono dir-ltr min-h-[100px]"
                      />
                    </div>
                    <div id="new-section-image-inputs" className="col-span-2 space-y-4" style={{ display: 'none' }}>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500">رابط الصورة (URL)</label>
                          <input 
                            id="new-section-image-url"
                            type="text" 
                            placeholder="https://..."
                            className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark text-xs font-bold text-left dir-ltr"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500">الرابط عند الضغط (اختياري)</label>
                          <input 
                            id="new-section-image-link"
                            type="text" 
                            placeholder="https://..."
                            className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark text-xs font-bold text-left dir-ltr"
                          />
                       </div>
                    </div>
                    <button 
                      onClick={() => {
                        const type = (document.getElementById('new-section-type') as HTMLSelectElement).value as any;
                        const title = (document.getElementById('new-section-title') as HTMLInputElement).value;
                        const htmlCode = (document.getElementById('new-section-html') as HTMLTextAreaElement).value;
                        const imageUrl = (document.getElementById('new-section-image-url') as HTMLInputElement).value;
                        const link = (document.getElementById('new-section-image-link') as HTMLInputElement).value;
                        
                        const newSection = {
                          id: uuidv4(),
                          type,
                          title: title || undefined,
                          active: true,
                          order: homeSections.length,
                          pinned: false,
                          spacing: 16,
                          htmlCode: type === 'widget' ? htmlCode : undefined,
                          imageUrl: type === 'image' ? imageUrl : undefined,
                          link: type === 'image' ? link : undefined
                        };
                        setHomeSections([...homeSections, newSection]);
                        (document.getElementById('new-section-title') as HTMLInputElement).value = '';
                        (document.getElementById('new-section-html') as HTMLTextAreaElement).value = '';
                      }}
                      className="col-span-2 bg-primary/10 text-primary py-3 rounded-xl text-[10px] font-black border border-primary/20 hover:bg-primary hover:text-white transition-all mt-2"
                    >
                      تأكيد الإضافة للقائمة
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 <div className="bg-white dark:bg-card-dark p-6 rounded-[32px] border border-border-light dark:border-border-dark flex flex-col gap-2 shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center text-primary mb-2">
                       <UsersIcon size={24} />
                    </div>
                    <span className="text-3xl font-black">{users.length}</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">عضو مسجل</span>
                 </div>
                 <div className="bg-white dark:bg-card-dark p-6 rounded-[32px] border border-border-light dark:border-border-dark flex flex-col gap-2 shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="bg-blue-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-500 mb-2">
                       <Newspaper size={24} />
                    </div>
                    <span className="text-3xl font-black">{news.length}</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">خبر منشور</span>
                 </div>
                 <div className="bg-white dark:bg-card-dark p-6 rounded-[32px] border border-border-light dark:border-border-dark flex flex-col gap-2 shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="bg-orange-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-orange-500 mb-2">
                       <MessageSquare size={24} />
                    </div>
                    <span className="text-3xl font-black">{fanPosts.length}</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">منشور جماهير</span>
                 </div>
                 <div className="bg-white dark:bg-card-dark p-6 rounded-[32px] border border-border-light dark:border-border-dark flex flex-col gap-2 shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="bg-green-500/10 w-12 h-12 rounded-2xl flex items-center justify-center text-green-500 mb-2">
                       <BarChart3 size={24} />
                    </div>
                    <span className="text-3xl font-black">{predictions.length}</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">توقعات مباريات</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-card-dark rounded-[32px] border border-border-light dark:border-border-dark p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-base flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Activity size={18} /></div>
                      النشاط الأخير
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {(([...news, ...media, ...fanPosts] as any[])
                      .sort((a, b) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime())
                      .slice(0, 5) as any[])
                      .map((item, i) => (
                        <div key={i} className="flex items-center gap-4 pb-4 border-b border-slate-50 dark:border-border-dark last:border-0 last:pb-0">
                          <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-surface-dark flex items-center justify-center flex-shrink-0 text-slate-400">
                             {item.title ? <Newspaper size={18} /> : <MessageSquare size={18} />}
                          </div>
                          <div className="flex-1">
                             <p className="text-xs font-black line-clamp-1">{item.title || item.content}</p>
                             <p className="text-[10px] text-slate-400 font-bold mt-0.5">{new Date(item.date || item.createdAt || 0).toLocaleString('ar-EG')}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-card-dark rounded-[32px] border border-border-light dark:border-border-dark p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-black text-base flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><UserPlus size={18} /></div>
                      أحدث الأعضاء
                    </h3>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {users.slice(0, 5).map((u, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
                        <div className="relative">
                          {u.avatar && u.avatar.trim() !== '' ? (
                            <img src={u.avatar} className="w-12 h-12 rounded-2xl border-2 border-white dark:border-border-dark shadow-md group-hover:scale-110 transition-transform" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-surface-dark flex items-center justify-center text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-md">
                              <UsersIcon size={20} />
                            </div>
                          )}
                        </div>
                        <span className="text-[9px] font-black truncate w-full text-center text-slate-500 group-hover:text-primary transition-colors">{u.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'news-categories' && (
            <div className="bg-white dark:bg-card-dark rounded-3xl border border-border-light dark:border-border-dark p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Tags size={20} />
                </div>
                <div>
                   <h3 className="font-black text-sm">أقسام الأخبار</h3>
                   <p className="text-[10px] font-bold text-slate-400">إدارة التصنيفات المتاحة للأخبار</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {newsCategories.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-50 dark:bg-surface-dark px-3 py-2 rounded-xl border border-slate-100 dark:border-border-dark group">
                    <span className="text-xs font-bold">{cat}</span>
                    <button 
                      onClick={() => {
                        const newList = [...newsCategories];
                        const updatedName = prompt('تعديل اسم القسم:', cat);
                        if (updatedName && updatedName.trim() !== '') {
                          newList[i] = updatedName.trim();
                          setDoc(doc(db, 'settings', 'newsCategories'), { list: newList });
                        }
                      }}
                      className="text-blue-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={() => {
                        const newList = newsCategories.filter((_, idx) => idx !== i);
                        setDoc(doc(db, 'settings', 'newsCategories'), { list: newList });
                      }}
                      className="text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 ml-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  id="new-category"
                  placeholder="اسم القسم الجديد..." 
                  className="flex-1 p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark text-xs font-bold" 
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('new-category') as HTMLInputElement;
                    if (input.value.trim()) {
                      const newList = [...newsCategories, input.value.trim()];
                      setDoc(doc(db, 'settings', 'newsCategories'), { list: newList });
                      input.value = '';
                    }
                  }}
                  className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-xs"
                >
                  إضافة
                </button>
              </div>
            </div>
          )}

          {activeTab === 'news-tags' && (
            <div className="bg-white dark:bg-card-dark rounded-3xl border border-border-light dark:border-border-dark p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Tags size={20} />
                </div>
                <div>
                   <h3 className="font-black text-sm">وسوم الأخبار</h3>
                   <p className="text-[10px] font-bold text-slate-400">الوسوم الافتراضية: مباشر, عاجل, رائج, هام، إلخ</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {useAppStore.getState().newsTags?.map((tag, i) => (
                  <div key={tag.id} className="flex items-center gap-2 bg-slate-50 dark:bg-surface-dark px-3 py-2 rounded-xl border border-slate-100 dark:border-border-dark group">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="text-xs font-bold" style={{ color: tag.color }}>{tag.name}</span>
                    <button 
                      onClick={() => {
                        const tags = [...useAppStore.getState().newsTags];
                        const updatedName = prompt('تعديل اسم الوسم:', tag.name);
                        const updatedColor = prompt('لون الوسم (HEX):', tag.color);
                        if (updatedName && updatedName.trim() !== '') {
                          tags[i] = { ...tag, name: updatedName.trim(), color: updatedColor || tag.color };
                          setDoc(doc(db, 'settings', 'newsTags'), { tags });
                        }
                      }}
                      className="text-blue-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100 mr-2"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذا الوسم؟')) {
                          const tags = useAppStore.getState().newsTags.filter((_, idx) => idx !== i);
                          setDoc(doc(db, 'settings', 'newsTags'), { tags });
                        }
                      }}
                      className="text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 ml-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 items-center">
                <input 
                  type="color" 
                  id="new-tag-color"
                  defaultValue="#3B82F6"
                  className="w-12 h-10 rounded-xl cursor-pointer"
                />
                <input 
                  type="text" 
                  id="new-tag-name"
                  placeholder="اسم الوسم الجديد..." 
                  className="flex-1 p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark text-xs font-bold" 
                />
                <button 
                  onClick={() => {
                    const nameInput = document.getElementById('new-tag-name') as HTMLInputElement;
                    const colorInput = document.getElementById('new-tag-color') as HTMLInputElement;
                    if (nameInput.value.trim()) {
                      const tags = [...(useAppStore.getState().newsTags || [])];
                      tags.push({ id: uuidv4(), name: nameInput.value.trim(), color: colorInput.value });
                      setDoc(doc(db, 'settings', 'newsTags'), { tags });
                      nameInput.value = '';
                    }
                  }}
                  className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-xs"
                >
                  إضافة
                </button>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <button onClick={openAddModal} className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-[11px] flex items-center gap-2 pressable">
                  <Plus size={14} /> منتج جديد
                </button>
                <div className="text-right">
                   <h3 className="text-xs font-black">إدارة المخزن</h3>
                   <p className="text-[10px] text-slate-400 font-bold">إضافة وتعديل منتجات متجر الجماهير</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {products.map(product => (
                  <div key={product.id} className="bg-white dark:bg-card-dark p-3 rounded-2xl border border-border-light dark:border-border-dark flex items-center gap-4">
                    {product.imageUrl && product.imageUrl.trim() !== '' ? (
                      <img src={product.imageUrl} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center">
                        <ShoppingCart size={24} className="text-slate-300" />
                      </div>
                    )}
                    <div className="flex-1 text-right">
                       <h4 className="text-xs font-black">{product.name}</h4>
                       <p className="text-[10px] text-primary font-bold tabular-nums mt-0.5">{product.price} ج.م</p>
                       <span className="text-[9px] bg-slate-100 dark:bg-surface-dark px-2 py-0.5 rounded-lg text-slate-500 font-bold">{product.category}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEditModal(product, product.id)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete('products', product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="flex flex-col gap-6">
               <div className="flex items-center justify-between px-2">
                 <div className="flex flex-col text-right">
                   <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight">سجل المشتريات</h3>
                 </div>
                 <div className="bg-primary/10 dark:bg-primary/20 px-4 py-2 rounded-2xl border border-primary/20 text-primary flex items-center gap-2">
                   <ShoppingCart size={18} />
                   <span className="text-sm font-black tabular-nums">{orders.length}</span>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {orders.map(order => (
                   <div key={order.id} className="relative bg-white dark:bg-card-dark p-6 rounded-[32px] border border-border-light dark:border-border-dark shadow-premium hover:shadow-2xl transition-all overflow-hidden group text-right">
                     <div className="flex items-center justify-between border-b border-slate-50 dark:border-border-dark pb-3 mb-4">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${
                          order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-600' : 
                          order.status === 'ready' ? 'bg-purple-100 text-purple-600' : 
                          order.status === 'sold' ? 'bg-green-100 text-green-600' : 
                          order.status === 'delivered' ? 'bg-slate-100 text-slate-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {order.status === 'pending' ? 'تحت التحضير' : 
                           order.status === 'processing' ? 'جاري التنفيذ' :
                           order.status === 'ready' ? 'جاهز' : 
                           order.status === 'sold' ? 'تم البيع' : 
                           order.status === 'delivered' ? 'تم الاستلام' : 'جاري التنفيذ'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 tabular-nums">{new Date(order.createdAt).toLocaleString('ar-EG')}</span>
                     </div>

                     <div className="flex gap-4 items-start mb-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-50 dark:bg-surface-dark border border-border-light dark:border-border-dark">
                           {order.productImage && order.productImage.trim() !== '' ? (
                             <img src={order.productImage} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                           ) : (
                             <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                               <ShoppingCart size={20} className="text-slate-300" />
                             </div>
                           )}
                        </div>
                        <div className="flex-1 space-y-2">
                           <div className="flex justify-between items-start">
                              <p className="text-xs font-black text-slate-800 dark:text-white">{order.productName}</p>
                              <div className="text-left">
                                 <p className="text-[10px] text-primary font-bold tabular-nums">الإجمالي: {order.totalPrice} ج.م</p>
                                 <p className="text-[9px] text-slate-500 font-bold">الكمية: {order.quantity || 1}</p>
                              </div>
                           </div>
                           
                           <div className="bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-border-dark p-3 rounded-2xl space-y-2 group-hover:bg-white dark:group-hover:bg-card-dark transition-colors">
                              <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <UsersIcon size={12} />
                                 </div>
                                 <p className="text-[10px] font-black text-slate-800 dark:text-white">{order.userName}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Phone size={12} />
                                 </div>
                                 <p className="text-[10px] text-slate-500 font-bold tabular-nums">{order.userPhone}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                    <AtSign size={12} />
                                 </div>
                                 <p className="text-[9px] text-slate-400 font-bold">{order.userEmail}</p>
                              </div>
                              <div className="flex items-start gap-2 pt-1 border-t border-slate-100 dark:border-border-dark">
                                 <div className="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                                    <MapPin size={12} />
                                 </div>
                                 <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                                    📍 {order.userAddress}
                                 </p>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="flex gap-2">
                        <select 
                          className="flex-1 p-2 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-[10px] font-black outline-none appearance-none"
                          value={order.status}
                          onChange={async (e) => {
                            try {
                              const { updateDoc, doc } = await import('firebase/firestore');
                              const { db } = await import('../lib/firebase');
                              await updateDoc(doc(db, 'orders', order.id), { status: e.target.value as any });
                              alert('تم تحديث الحالة بنجاح');
                            } catch (err) {
                              console.error(err);
                              alert('فشل تحديث الحالة');
                            }
                          }}
                        >
                          <option value="pending">تحت التحضير</option>
                          <option value="processing">جاري التنفيذ</option>
                          <option value="ready">جاهز</option>
                          <option value="delivered">تم الاستلام</option>
                          <option value="sold">تم البيع</option>
                        </select>
                        <button 
                          onClick={() => { if(window.confirm('هل أنت متأكد من حذف الطلب؟')) handleDelete('orders', order.id) }} 
                          className="px-4 text-red-500 border border-red-100 dark:border-red-900/30 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-all flex items-center justify-center"
                        >
                          <Trash2 size={16} />
                        </button>
                     </div>
                   </div>
                 ))}
                 {orders.length === 0 && (
                   <div className="py-20 text-center text-slate-400 font-bold text-sm">لا توجد طلبات شراء حالياً</div>
                 )}
               </div>
            </div>
          )}

          {/* Content Search Bar for applicable tabs */}
          {['news', 'media', 'matches', 'products', 'books', 'music'].includes(activeTab) && (
            <div className="mb-6">
               <div className="relative group">
                  <div className="absolute inset-y-0 right-4 flex items-center text-slate-400 group-focus-within:text-primary transition-colors">
                     <Search size={18} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="ابحث في المحتوى..." 
                    className="w-full pr-12 pl-4 py-4 rounded-2xl bg-white dark:bg-surface-dark border border-slate-100 dark:border-border-dark text-sm font-bold focus:border-primary outline-none transition-all shadow-sm"
                    value={contentSearch}
                    onChange={(e) => setContentSearch(e.target.value)}
                  />
                  {contentSearch && (
                    <button 
                      onClick={() => setContentSearch('')} 
                      className="absolute inset-y-0 left-4 flex items-center text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  )}
               </div>
            </div>
          )}

          {activeTab === 'news' && (
            <div className="grid grid-cols-1 gap-6">
              {news.filter(item => 
                item.title.toLowerCase().includes(contentSearch.toLowerCase()) || 
                item.content?.toLowerCase().includes(contentSearch.toLowerCase()) ||
                item.category?.toLowerCase().includes(contentSearch.toLowerCase())
              ).map((item) => (
                <div key={item.id} className="bg-white dark:bg-card-dark rounded-3xl border border-border-light dark:border-border-dark p-6 flex flex-col gap-4 shadow-sm hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center gap-4">
                        <div className="relative overflow-hidden rounded-2xl">
                          {item.image && item.image.trim() !== '' ? (
                            <img src={item.image} alt="" className="w-20 h-20 object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-20 h-20 bg-slate-100 dark:bg-surface-dark flex items-center justify-center">
                              <Newspaper size={32} className="text-slate-300" />
                            </div>
                          )}
                        </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                         <h3 className="font-black text-base line-clamp-2 leading-tight text-slate-800 dark:text-white">{item.title}</h3>
                         {item.type === 'rss' && <div className="bg-orange-500/10 text-orange-500 p-1 rounded-lg"><Rss size={12} /></div>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(item.date).toLocaleDateString('ar-EG')}
                        </span>
                        <span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-100 dark:bg-surface-dark text-slate-500 rounded-lg">{item.category || 'أخبار'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditNews(item)} className="p-3 text-blue-500 bg-blue-500/5 hover:bg-blue-500/10 rounded-2xl transition-all"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete('news', item.id)} className="p-3 text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-2xl transition-all"><Trash2 size={18} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'media' && (
            <div className="grid grid-cols-1 gap-6">
              {media.filter(item => 
                item.title.toLowerCase().includes(contentSearch.toLowerCase())
              ).map((item) => (
                <div key={item.id} className="bg-white dark:bg-card-dark rounded-3xl border border-border-light dark:border-border-dark p-6 flex flex-col gap-4 shadow-sm hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                      {item.thumbnailUrl && item.thumbnailUrl.trim() !== '' ? (
                        <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <PlayCircle size={32} className="text-slate-300" />
                        </div>
                      )}
                      {item.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                           <PlayCircle size={20} className="text-white drop-shadow-lg" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-base line-clamp-1 leading-tight text-slate-800 dark:text-white mb-1">{item.title}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-100 dark:bg-surface-dark text-slate-500 rounded-lg">
                          {item.type === 'video' ? 'فيديو' : 'صورة'}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          {new Date(item.date).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditItem(item)} 
                        className="p-3 text-blue-500 bg-blue-500/5 hover:bg-blue-500/10 rounded-2xl transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete('media', item.id)} className="p-3 text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-2xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'matches' && matches.filter(item => 
            item.homeTeam.toLowerCase().includes(contentSearch.toLowerCase()) || 
            item.awayTeam.toLowerCase().includes(contentSearch.toLowerCase()) ||
            item.competition?.toLowerCase().includes(contentSearch.toLowerCase())
          ).map((item) => (
            <div key={item.id} className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-3 flex flex-col gap-2">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-right whitespace-nowrap">{item.homeTeam} × {item.awayTeam}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold text-right ${item.status === 'live' ? 'text-red-500' : 'text-slate-500'}`}>
                        {item.status === 'live' ? 'مباشر' : item.status === 'finished' ? 'منتهية' : 'قادمة'}
                      </span>
                      {item.isMatchDay && (
                        <span className="text-[10px] font-black bg-accent/20 text-accent px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Match Day</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black ml-1">{item.homeScore} - {item.awayScore}</span>
                  {item.status === 'live' && (
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-surface-dark px-2 py-1 rounded-lg border border-border-light dark:border-border-dark">
                      <span className="text-[10px] font-black tabular-nums">{calculateCurrentMinute(item)}'</span>
                      <button 
                        onClick={() => handleTimerAction(item.isTimerRunning ? 'pause' : 'start', item)}
                        className={`p-1 rounded-md transition-colors ${item.isTimerRunning ? 'text-orange-500 bg-orange-50' : 'text-green-500 bg-green-50'}`}
                      >
                        {item.isTimerRunning ? <X size={12} /> : <PlayCircle size={12} />}
                      </button>
                      <button 
                        onClick={() => handleTimerAction('reset', item)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={async () => {
                        const newId = featuredMatchId === item.id ? null : item.id;
                        await setDoc(doc(db, 'settings', 'featured_match'), { matchId: newId });
                        toast.success(newId ? 'تم تمييز المباراة في الصفحة الرئيسية' : 'تم إلغاء تمييز المباراة');
                      }}
                      className={`p-1.5 rounded-lg transition-all ${featuredMatchId === item.id ? 'text-yellow-500 bg-yellow-50' : 'text-slate-400 hover:text-yellow-500'}`}
                    >
                      <Star size={16} fill={featuredMatchId === item.id ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={() => handleEditMatch(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-all"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete('matches', item.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'posts' && (
            <div className="flex flex-col gap-3">
              {fanPosts.map((post) => (
                <div key={post.id} className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-3 flex flex-col gap-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                  {post.userAvatar && post.userAvatar.trim() !== '' ? (
                    <img src={post.userAvatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <UsersIcon size={14} className="text-slate-400" />
                  )}
                </div>
                      <div>
                        <p className="text-xs font-black">{post.userName}</p>
                        <p className="text-[9px] text-slate-400 font-bold">{post.createdAt ? new Date(post.createdAt).toLocaleString('ar-EG') : 'منذ فترة'}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDelete('fan_posts', post.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">{post.content}</p>
                  {post.image && post.image.trim() !== '' && (
                    <img src={post.image} className="w-full h-32 object-cover rounded-lg border border-border-light dark:border-border-dark" referrerPolicy="no-referrer" />
                  )}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-50 dark:border-border-dark">
                    <span className="text-[10px] font-black text-slate-500">إعجابات: {post.likes || 0}</span>
                  </div>
                </div>
              ))}
              {fanPosts.length === 0 && <div className="text-center py-10 bg-white dark:bg-card-dark rounded-xl border border-dashed border-slate-200 dark:border-border-dark text-slate-400 font-bold text-sm">لا توجد منشورات جماهير</div>}
            </div>
          )}

          {activeTab === 'predictions' && (
            <div className="flex flex-col gap-3">
              {predictions.map((p) => {
                const match = matches.find(m => m.id === p.matchId);
                const isMatchFinished = match?.status === 'finished';
                const isCorrect = isMatchFinished && 
                                Number(match.homeScore) === Number(p.homeScore) && 
                                Number(match.awayScore) === Number(p.awayScore);
                
                return (
                  <div key={p.id} className={`bg-white dark:bg-card-dark rounded-xl border ${isCorrect ? 'border-green-500 shadow-green-100' : 'border-border-light dark:border-border-dark shadow-sm'} p-3 flex flex-col gap-2`}>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded-full w-fit">{p.userName}</span>
                          {isMatchFinished && (
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {isCorrect ? <Check size={8} /> : <X size={8} />}
                              {isCorrect ? 'توقع صحيح' : 'توقع خاطئ'}
                            </span>
                          )}
                        </div>
                        <span className="text-[8px] text-slate-400 font-bold mt-1">{p.userEmail}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleEditItem(p)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete('predictions', p.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-surface-dark p-2 rounded-lg">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{match?.homeTeam || 'فريق غير معروف'}</span>
                      <div className="flex items-center gap-2">
                         <div className="flex flex-col items-center">
                           <span className="text-[8px] text-slate-400 mb-0.5">توقعه</span>
                           <span className={`w-6 h-6 flex items-center justify-center bg-white dark:bg-card-dark border ${isCorrect ? 'border-green-200 text-green-600' : 'border-border-light dark:border-border-dark'} rounded font-black text-sm`}>{p.homeScore}</span>
                         </div>
                         <span className="text-xs text-slate-400 font-black">-</span>
                         <div className="flex flex-col items-center">
                           <span className="text-[8px] text-slate-400 mb-0.5">توقعه</span>
                           <span className={`w-6 h-6 flex items-center justify-center bg-white dark:bg-card-dark border ${isCorrect ? 'border-green-200 text-green-600' : 'border-border-light dark:border-border-dark'} rounded font-black text-sm`}>{p.awayScore}</span>
                         </div>
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{match?.awayTeam || 'فريق غير معروف'}</span>
                    </div>
                    {isMatchFinished && (
                      <div className="text-center px-2 py-1 bg-slate-100/50 dark:bg-surface-dark/50 rounded-md flex items-center justify-center gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase">النتيجة الحقيقية:</span>
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">{match.homeScore} - {match.awayScore}</span>
                      </div>
                    )}
                    <p className="text-[8px] text-slate-400 text-left font-bold">{p.createdAt ? new Date(p.createdAt).toLocaleString('ar-EG') : ''}</p>
                  </div>
                );
              })}
              {predictions.length === 0 && <div className="text-center py-10 bg-white dark:bg-card-dark rounded-xl border border-dashed border-slate-200 dark:border-border-dark text-slate-400 font-bold text-sm">لا توجد توقعات بعد</div>}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="bg-white dark:bg-card-dark p-6 rounded-[32px] border border-border-light dark:border-border-dark shadow-sm">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><UsersIcon size={24} /></div>
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">إجمالي الأعضاء</p>
                          <h4 className="text-xl font-black">{users.length}</h4>
                       </div>
                    </div>
                 </div>
                 <div className="bg-white dark:bg-card-dark p-6 rounded-[32px] border border-border-light dark:border-border-dark shadow-sm">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center"><Star size={24} /></div>
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">الأعضاء بريميوم</p>
                          <h4 className="text-xl font-black">{users.filter(u => u.tier === 'premium').length}</h4>
                       </div>
                    </div>
                 </div>
                 <div className="bg-white dark:bg-card-dark p-6 rounded-[32px] border border-border-light dark:border-border-dark shadow-sm flex-1 md:col-span-2">
                    <div className="relative h-full flex items-center">
                      <div className="absolute inset-y-0 right-4 flex items-center text-slate-400"><Search size={18} /></div>
                      <input 
                        type="text" 
                        placeholder="ابحث عن عضو بالإسم أو البريد..." 
                        className="w-full pr-12 pl-4 py-4 rounded-2xl bg-slate-50 dark:bg-surface-dark border border-slate-100 dark:border-border-dark text-sm font-bold focus:border-primary outline-none transition-all"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                      />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {users
                  .filter(u => 
                    u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
                    u.email?.toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map(member => (
                  <div key={member.uid} className="bg-white dark:bg-card-dark p-4 rounded-[28px] border border-border-light dark:border-border-dark flex items-center justify-between group hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {member.avatar ? (
                          <img src={member.avatar} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-primary/20" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400"><UsersIcon size={24} /></div>
                        )}
                        {member.role === 'admin' && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white"><Shield size={10} /></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2">
                          {member.name}
                          {member.tier === 'premium' && <Star size={12} className="text-yellow-500 fill-current" />}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400">{member.email}</p>
                        <div className="flex gap-1.5 mt-1.5">
                           <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${member.role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                             {member.role === 'admin' ? 'مدير' : 'عضو'}
                           </span>
                           {member.roles?.slice(0, 2).map(r => (
                             <span key={r} className="px-2 py-0.5 rounded-lg text-[8px] font-black bg-slate-100 dark:bg-surface-dark text-slate-500 uppercase">{r}</span>
                           ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEditItem({...member, id: member.uid, roles: member.roles || []})}
                        className="p-2.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all"
                      >
                        <Shield size={18} />
                      </button>
                      <button onClick={() => handleDelete('users', member.uid!)} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {users.length === 0 && <div className="py-20 text-center bg-white dark:bg-card-dark rounded-[32px] border-2 border-dashed border-slate-200 text-slate-400 font-bold">لا يوجد أعضاء مضافون</div>}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-card-dark rounded-xl p-5 shadow-sm space-y-5 border border-border-light dark:border-border-dark">
                <div className="pb-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
                   <div>
                     <h3 className="text-sm font-black mb-1">إرسال إشعار لحظي</h3>
                     <p className="text-[10px] text-slate-500 font-bold">إرسال إشعارات لجميع المستخدمين أو لمستخدم محدد</p>
                   </div>
                   <Bell className="text-primary opacity-20" size={32} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 mb-1.5 block">عنوان الإشعار</label>
                  <input 
                    type="text" 
                    value={notificationForm.title} 
                    onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                    className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold focus:border-primary outline-none transition-colors"
                    placeholder="مثال: عاجل - تعاقد جديد"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 mb-1.5 block">نص الإشعار</label>
                  <textarea 
                    value={notificationForm.body} 
                    onChange={(e) => setNotificationForm({...notificationForm, body: e.target.value})}
                    className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold focus:border-primary outline-none transition-colors min-h-[100px] resize-none"
                    placeholder="محتوى الإشعار وتفاصيله..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 mb-1.5 block">الجمهور المستهدف (all للجميع أو UID)</label>
                  <input 
                    type="text" 
                    value={notificationForm.target} 
                    onChange={(e) => setNotificationForm({...notificationForm, target: e.target.value})}
                    className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-mono focus:border-primary outline-none transition-colors text-left"
                    dir="ltr"
                  />
                </div>
                <button 
                  onClick={handleSendNotification} 
                  disabled={isSending}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95"
                >
                  {isSending ? <Loader2 className="animate-spin" size={18} /> : <Bell size={18} />}
                  إرسال الإشعار
                </button>
              </div>

              <div className="bg-white dark:bg-card-dark rounded-xl p-5 shadow-sm border border-border-light dark:border-border-dark">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-border-light dark:border-border-dark">
                  <h3 className="text-sm font-black">سجل الإشعارات المرسلة</h3>
                  <button 
                    onClick={async () => {
                      if (confirm('هل أنت متأكد من حذف جميع الإشعارات؟')) {
                        const snap = await getDocs(collection(db, 'notifications'));
                        const batch = snap.docs.map(d => deleteDoc(doc(db, 'notifications', d.id)));
                        await Promise.all(batch);
                        toast.success('تم حذف جميع الإشعارات');
                      }
                    }}
                    className="text-[10px] font-black text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
                  >
                    <Trash2 size={12} />
                    حذف الكل
                  </button>
                </div>
                
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {sentNotifications.map((n: any) => (
                    <div key={n.id} className="p-4 bg-white dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark flex items-center justify-between gap-4 group hover:shadow-md transition-all">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-card-dark flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <Bell size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-black truncate text-slate-800 dark:text-white mb-0.5">{n.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold truncate">{n.body}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[8px] text-slate-400 font-black uppercase tracking-wider">{new Date(n.createdAt).toLocaleDateString('ar-EG')}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="text-[8px] font-black text-primary uppercase">MEMBER: {n.target || 'ALL'}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete('notifications', n.id)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {sentNotifications.length === 0 && (
                    <div className="py-20 text-center bg-slate-50/50 dark:bg-surface-dark/50 rounded-[28px] border-2 border-dashed border-slate-200 dark:border-border-dark">
                       <Bell className="mx-auto text-slate-300 mb-2" size={40} />
                       <p className="text-slate-400 font-black text-xs uppercase tracking-widest">لا توجد إشعارات مرسلة</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col text-right px-2">
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase italic tracking-tight">إدارة النظام والنسخ الاحتياطي</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">System Maintenance & Data Management</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-card-dark p-6 rounded-3xl border border-border-light dark:border-border-dark flex flex-col items-center text-center">
                   <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-4">
                      <Database size={28} />
                   </div>
                   <h4 className="text-sm font-black mb-1">نسخة احتياطية كاملة</h4>
                   <p className="text-[10px] font-bold text-slate-500 mb-6 leading-relaxed">
                     تحميل ملف JSON يحتوي على كافة بيانات التطبيق من Firestore
                   </p>
                   <button 
                    onClick={handleExportDatabase}
                    disabled={isExporting}
                    className="w-full py-3 bg-blue-500 text-white rounded-xl font-black text-[10px] flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors disabled:opacity-50"
                   >
                     {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                     تحميل النسخة الآن
                   </button>
                </div>

                <div className="bg-white dark:bg-card-dark p-6 rounded-3xl border border-border-light dark:border-border-dark flex flex-col items-center text-center">
                   <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
                      <LayoutDashboard size={28} />
                   </div>
                   <h4 className="text-sm font-black mb-1">معلومات النظام</h4>
                   <div className="w-full space-y-2 mb-4">
                      <div className="flex justify-between items-center bg-slate-50 dark:bg-surface-dark p-2 px-3 rounded-lg border border-border-light dark:border-white/5">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Version</span>
                        <span className="text-[10px] font-black tabular-nums">{ADMIN_VERSION}</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 dark:bg-surface-dark p-2 px-3 rounded-lg border border-border-light dark:border-white/5">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Status</span>
                        <span className="text-[10px] font-black text-green-500">Active</span>
                      </div>
                   </div>
                   <p className="text-[9px] font-bold text-slate-400 italic">
                     تم تصميم النظام لخدمة مشجعي نادي الاتحاد السكندري
                   </p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-2xl border border-amber-200 dark:border-amber-500/20 flex gap-3 items-start text-right">
                <Shield size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                   <h5 className="font-black text-amber-800 dark:text-amber-500 text-[10px] mb-0.5">تنبيه أمني</h5>
                   <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                     النسخة الاحتياطية تحتوي على بيانات حساسة. يرجى الحفاظ على الملف في مكان آمن وعدم مشاركته مع أطراف غير مصرح لها.
                   </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-card-dark rounded-xl p-5 shadow-sm space-y-5 border border-border-light dark:border-border-dark">
              <div className="pb-4 border-b border-border-light dark:border-border-dark">
                 <h3 className="text-sm font-black mb-1">الهوية البصرية</h3>
                 <p className="text-[10px] text-slate-500 font-bold">تحكم في اسم وشعار التطبيق الذي يظهر لجميع المستخدمين</p>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 mb-1.5 block">اسم التطبيق</label>
                <input 
                  type="text" 
                  value={formData.appName ?? appSettings.appName} 
                  onChange={(e) => setFormData({...formData, appName: e.target.value})}
                  className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold focus:border-primary outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 mb-1.5 block">نوع الشعار</label>
                <div className="flex bg-slate-100 dark:bg-surface-dark rounded-xl p-1 mb-4">
                  <button 
                    onClick={() => setFormData({...formData, logoType: 'image'})}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      (formData.logoType || appSettings.logoType || 'image') === 'image' ? 'bg-white dark:bg-card-dark shadow-sm text-primary' : 'text-slate-500'
                    }`}
                  >
                    صورة
                  </button>
                  <button 
                    onClick={() => setFormData({...formData, logoType: 'text'})}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      (formData.logoType || appSettings.logoType) === 'text' ? 'bg-white dark:bg-card-dark shadow-sm text-primary' : 'text-slate-500'
                    }`}
                  >
                    نص مكتوب
                  </button>
                </div>

                {(formData.logoType || appSettings.logoType || 'image') === 'image' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 mb-1.5 block">لوجو التطبيق الأساسي (يظهر خارج الهيدر)</label>
                       <ImageUploader 
                         folderName="brand"
                         onUploadSuccess={(url) => setFormData({...formData, appLogo: url})}
                         onError={(err) => toast.error(err)}
                       />
                       {formData.appLogo && (
                         <input 
                           type="text" 
                           value={formData.appLogo} 
                           onChange={(e) => setFormData({...formData, appLogo: e.target.value})}
                           className="w-full p-2 mt-2 rounded-lg border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-[10px] font-mono focus:border-primary outline-none"
                         />
                       )}
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 mb-1.5 block">لوجو الهيدر (الوضع الفاتح)</label>
                       <ImageUploader 
                         folderName="brand"
                         onUploadSuccess={(url) => setFormData({...formData, headerLogoLight: url})}
                         onError={(err) => toast.error(err)}
                       />
                       {(formData.headerLogoLight ?? appSettings.headerLogoLight) && (
                         <div className="flex gap-2 items-center">
                           <input 
                             type="text" 
                             value={formData.headerLogoLight ?? appSettings.headerLogoLight} 
                             onChange={(e) => setFormData({...formData, headerLogoLight: e.target.value})}
                             className="w-full p-2 rounded-lg border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-[10px] font-mono focus:border-primary outline-none"
                           />
                           <button onClick={() => setFormData({...formData, headerLogoLight: ''})} className="text-red-500 p-2"><X size={16} /></button>
                         </div>
                       )}
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 mb-1.5 block">لوجو الهيدر (الوضع المظلم)</label>
                       <ImageUploader 
                         folderName="brand"
                         onUploadSuccess={(url) => setFormData({...formData, headerLogoDark: url})}
                         onError={(err) => toast.error(err)}
                       />
                       {(formData.headerLogoDark ?? appSettings.headerLogoDark) && (
                         <div className="flex gap-2 items-center">
                           <input 
                             type="text" 
                             value={formData.headerLogoDark ?? appSettings.headerLogoDark} 
                             onChange={(e) => setFormData({...formData, headerLogoDark: e.target.value})}
                             className="w-full p-2 rounded-lg border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-[10px] font-mono focus:border-primary outline-none"
                           />
                           <button onClick={() => setFormData({...formData, headerLogoDark: ''})} className="text-red-500 p-2"><X size={16} /></button>
                         </div>
                       )}
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="text-[10px] font-black text-slate-500 mb-1.5 block">النص البديل للشعار</label>
                    <input 
                      type="text" 
                      value={formData.logoText ?? appSettings.logoText ?? ''} 
                      onChange={(e) => setFormData({...formData, logoText: e.target.value})}
                      className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold focus:border-primary outline-none transition-colors"
                      placeholder="مثال: الاتحاد السكندري"
                    />
                  </>
                )}

                <div className="mt-4 p-6 bg-slate-50 dark:bg-surface-dark rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-border-dark min-h-[120px]">
                   {(formData.logoType || appSettings.logoType || 'image') === 'image' ? (
                     (formData.appLogo || appSettings.appLogo) && (
                       <img src={formData.appLogo ?? appSettings.appLogo} onError={(e) => { e.currentTarget.src = 'https://res.cloudinary.com/dqj6gzwfg/image/upload/v1777716805/favicon_gd0ic4.png'; }} className="h-20 object-contain drop-shadow-lg mb-2" referrerPolicy="no-referrer" />
                     )
                   ) : (
                     <h1 className="text-3xl font-black text-primary-dark dark:text-white drop-shadow-md mb-2">
                       {formData.logoText || appSettings.logoText || 'شعار الموقع'}
                     </h1>
                   )}
                   <span className="text-[10px] text-slate-400 font-bold">معاينة الشعار</span>
                </div>
              </div>

               <div className="pt-4 border-t border-border-light dark:border-border-dark">
                 <h3 className="text-sm font-black mb-1">إعدادات الصفحة الرئيسية</h3>
                 <p className="text-[10px] text-slate-500 font-bold mb-4">تحكم في القسم الافتراضي الذي يظهر للمستخدم عند فتح التطبيق</p>
                 
                 <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-500 block">الرياضة الافتراضية لعرض المباريات</label>
                   <div className="grid grid-cols-3 gap-2">
                     <button 
                       onClick={() => setFormData({...formData, defaultSport: 'auto'})}
                       className={`py-3 px-2 rounded-xl border text-[10px] font-black transition-all ${
                         (formData.defaultSport || appSettings.defaultSport || 'auto') === 'auto' 
                           ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                           : 'bg-slate-50 dark:bg-surface-dark border-border-light dark:border-border-dark text-slate-500'
                       }`}
                     >
                       تلقائي (حسب الأولوية)
                     </button>
                     <button 
                       onClick={() => setFormData({...formData, defaultSport: 'football'})}
                       className={`py-3 px-2 rounded-xl border text-[10px] font-black transition-all ${
                         (formData.defaultSport || appSettings.defaultSport) === 'football' 
                           ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                           : 'bg-slate-50 dark:bg-surface-dark border-border-light dark:border-border-dark text-slate-500'
                       }`}
                     >
                       كرة القدم دائماً
                     </button>
                     <button 
                       onClick={() => setFormData({...formData, defaultSport: 'basketball'})}
                       className={`py-3 px-2 rounded-xl border text-[10px] font-black transition-all ${
                         (formData.defaultSport || appSettings.defaultSport) === 'basketball' 
                           ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                           : 'bg-slate-50 dark:bg-surface-dark border-border-light dark:border-border-dark text-slate-500'
                       }`}
                     >
                       كرة السلة دائماً
                     </button>
                   </div>
                   <p className="text-[9px] text-slate-400 font-bold italic leading-relaxed">
                     * ملاحظة: الخيار الافتراضي هو "تلقائي" حيث يقوم النظام بإظهار مباريات كرة القدم أو السلة حسب وجود مباريات جارية أو تم تمييزها. اختيار رياضة محددة سيلغي هذا السلوك وسيظهر الرياضة المختارة دائماً عند الفتح.
                   </p>
                 </div>
               </div>
              <button 
                onClick={handleAdd} 
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-95"
              >
                {loading && <Loader2 className="animate-spin" size={18} />}
                حفظ كافة الإعدادات
              </button>
            </div>
          )}

          {activeTab === 'clubs' && (
            <div className="flex flex-col gap-3">
              {clubs.map((club) => (
                  <div key={club.id} className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {club.logo && club.logo.trim() !== '' ? (
                        <img src={club.logo} alt="" className="w-10 h-10 rounded-lg object-contain bg-slate-50 dark:bg-surface-dark p-1" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-surface-dark flex items-center justify-center p-1">
                           <Trophy size={20} className="text-slate-300" />
                        </div>
                      )}
                      <span className="font-bold text-sm">{club.name}</span>
                    </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleEditItem(club)} 
                      className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete('clubs', club.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {clubs.length === 0 && <div className="text-center py-10 bg-white dark:bg-card-dark rounded-xl border border-dashed border-slate-200 dark:border-border-dark text-slate-400 font-bold text-sm">لا توجد أندية مضافة</div>}
            </div>
          )}

          {activeTab === 'polls' && (
            <div className="flex flex-col gap-3">
              {polls.map((poll) => (
                <div key={poll.id} className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-sm leading-tight mb-1">{poll.question}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${poll.active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {poll.active ? 'نشط' : 'مغلق'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">{poll.options?.length || 0} خيارات • {Object.values(poll.votes || {}).reduce((a, b) => a + Number(b), 0)} صوت</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleEditItem(poll)} 
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete('polls', poll.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {polls.length === 0 && <div className="text-center py-10 bg-white dark:bg-card-dark rounded-xl border border-dashed border-slate-200 dark:border-border-dark text-slate-400 font-bold text-sm">لا توجد استطلاعات رأي</div>}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="flex flex-col gap-3">
              <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 mb-2">
                <span className="text-[10px] font-black text-primary uppercase">تعليقات الدردشة المباشرة (Live Chat)</span>
              </div>
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs">{comment.userName}</span>
                      <span className="text-[10px] text-slate-400">{comment.createdAt?.seconds ? new Date(comment.createdAt.seconds * 1000).toLocaleString('ar-EG') : 'الآن'}</span>
                    </div>
                    <button onClick={() => handleDelete('live_comments', comment.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-surface-dark p-2 rounded-lg">{comment.text}</p>
                </div>
              ))}
              {comments.length === 0 && <div className="text-center py-10 bg-white dark:bg-card-dark rounded-xl border border-dashed border-slate-200 text-slate-400 font-bold text-sm">لا توجد تعليقات</div>}
            </div>
          )}

           {activeTab === 'history' && (
            <div className="flex flex-col gap-6">
              {/* History Header */}
              <div className="bg-gradient-to-r from-primary to-primary-dark p-8 rounded-[40px] text-white shadow-2xl shadow-primary/20 p-8 border border-white/10 group overflow-hidden relative">
                <div className="relative z-10">
                   <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-3 opacity-80">
                        <HistoryIcon size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">History Management</span>
                     </div>
                     <button 
                       onClick={handleUndo}
                       disabled={undoStack.length === 0}
                       className="flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 p-2 px-3 rounded-full backdrop-blur-md border border-white/10 transition-all text-[10px] font-black uppercase"
                     >
                       <Undo size={14} />
                       Undo ({undoStack.length})
                     </button>
                   </div>
                   <h2 className="text-3xl font-black mb-1 tracking-tighter">إدارة البيانات التاريخية</h2>
                   <p className="text-sm text-white/70 max-w-md font-bold">
                      تحكم في سجل البطولات والأرقام القياسية والتاريخ العريق لناديكم المفضل.
                   </p>
                </div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rotate-45 translate-x-12 -translate-y-12"></div>
              </div>

              <div className="flex p-1 bg-slate-100 dark:bg-surface-dark rounded-2xl">
                {['stats', 'titles', 'timeline', 'stadiums'].map((sub) => (
                  <button 
                    key={sub}
                    onClick={() => setHistorySubTab(sub as any)}
                    className={`flex-1 py-1.5 text-[10px] font-black rounded-xl transition-all ${historySubTab === sub ? 'bg-white dark:bg-card-dark text-primary shadow-sm' : 'text-slate-500'}`}
                  >
                    {sub === 'stats' ? 'أرقام' : sub === 'titles' ? 'كؤوس' : sub === 'timeline' ? 'أحداث' : 'ملاعب'}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                {historySubTab === 'stats' && clubStats.map((item) => (
                  <div key={item.id} className={`bg-white dark:bg-card-dark p-3 rounded-xl border border-border-light dark:border-border-dark flex items-center justify-between ${item.hidden ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-surface-dark flex items-center justify-center text-primary">
                        <Star size={14} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black">{item.label}</p>
                          {item.hidden && <span className="bg-slate-100 dark:bg-surface-dark text-[8px] font-black px-1.5 py-0.5 rounded text-slate-500">مخفي</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold">{item.value}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleToggleVisibility('club_stats', item)} className="p-2 text-slate-400 hover:text-primary transition-all">
                        {item.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button onClick={() => handleEditItem(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete('club_stats', item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}

                {historySubTab === 'titles' && clubTitles.map((item) => (
                  <div key={item.id} className={`bg-white dark:bg-card-dark p-3 rounded-xl border border-border-light dark:border-border-dark flex items-center justify-between ${item.hidden ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-surface-dark flex items-center justify-center text-primary">
                        <Trophy size={14} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black">{item.name}</p>
                          {item.hidden && <span className="bg-slate-100 dark:bg-surface-dark text-[8px] font-black px-1.5 py-0.5 rounded text-slate-500">مخفي</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold">{item.count} بطل • {item.category === 'football' ? 'قدم' : 'سلة'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleToggleVisibility('club_titles', item)} className="p-2 text-slate-400 hover:text-primary transition-all">
                        {item.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button onClick={() => openEditModal(item, item.id)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete('club_titles', item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}

                {historySubTab === 'timeline' && historyEvents.map((item) => (
                  <div key={item.id} className={`bg-white dark:bg-card-dark p-3 rounded-xl border border-border-light dark:border-border-dark flex items-center justify-between ${item.hidden ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-surface-dark flex items-center justify-center text-primary flex-shrink-0">
                        <HistoryIcon size={14} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black truncate">{item.year}: {item.title}</p>
                          {item.hidden && <span className="bg-slate-100 dark:bg-surface-dark text-[8px] font-black px-1.5 py-0.5 rounded text-slate-500">مخفي</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold truncate">{item.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleToggleVisibility('club_timeline', item)} className="p-2 text-slate-400 hover:text-primary transition-all">
                        {item.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button onClick={() => openEditModal(item, item.id)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete('club_timeline', item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}

                {historySubTab === 'stadiums' && stadiums.map((item) => (
                  <div key={item.id} className={`bg-white dark:bg-card-dark p-3 rounded-xl border border-border-light dark:border-border-dark flex items-center justify-between ${item.hidden ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex items-center gap-3">
                      {item.imageUrl && item.imageUrl.trim() !== '' ? (
                        <img src={item.imageUrl} className="w-10 h-10 rounded-lg object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                           <Activity size={20} className="text-slate-300" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black">{item.name}</p>
                          {item.hidden && <span className="bg-slate-100 dark:bg-surface-dark text-[8px] font-black px-1.5 py-0.5 rounded text-slate-500">مخفي</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold">{item.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleToggleVisibility('club_stadiums', item)} className="p-2 text-slate-400 hover:text-primary transition-all">
                        {item.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button onClick={() => openEditModal(item, item.id)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete('club_stadiums', item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'fan-comments' && (
            <div className="flex flex-col gap-3">
              <div className="bg-primary/5 p-3 rounded-xl border border-primary/10 mb-2">
                <span className="text-[10px] font-black text-primary uppercase">تعليقات Fan Zone (المنشورات)</span>
              </div>
              {fanComments.map((comment) => (
                <div key={comment.id} className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs">{comment.userName}</span>
                      <span className="text-[10px] text-slate-400">{comment.createdAt ? new Date(comment.createdAt).toLocaleString('ar-EG') : 'غير متوفر'}</span>
                    </div>
                    <button onClick={() => handleDelete('fan_comments', comment.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[8px] text-slate-400 font-black uppercase">التواجد في المنشور ID: {comment.postId?.slice(0, 8)}...</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-surface-dark p-2 rounded-lg">{comment.text}</p>
                  </div>
                </div>
              ))}
              {fanComments.length === 0 && <div className="text-center py-10 bg-white dark:bg-card-dark rounded-xl border border-dashed border-slate-200 text-slate-400 font-bold text-sm">لا توجد تعليقات في Fan Zone</div>}
            </div>
          )}

          {activeTab === 'live' && (
             <div className="bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark p-4 flex flex-col gap-4">
               <div>
                  <label className="text-xs font-bold mb-1.5 block">حالة البث</label>
                  <select 
                    className="w-full p-2.5 rounded-lg border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" 
                    value={formData.isActive ?? (liveStream.isActive ? '1' : '0')} 
                    onChange={(e) => setFormData({...formData, isActive: e.target.value === '1'})}
                  >
                     <option value="1">مباشر الآن (مفتوح)</option>
                     <option value="0">مغلق (يظهر مؤشر الانتظار)</option>
                  </select>
               </div>
               <div>
                  <label className="text-xs font-bold mb-1.5 block">عنوان البث</label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 rounded-lg border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" 
                    value={formData.title ?? liveStream.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
               </div>
               <div>
                  <label className="text-xs font-bold mb-1.5 block flex items-center justify-between">
                     رابط البث
                  </label>
                  <input 
                    type="text" 
                    className="w-full p-2.5 rounded-lg border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm text-left dir-ltr" 
                    value={formData.url ?? liveStream.url} 
                    placeholder="https://..."
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                  />
               </div>
               <button onClick={handleAdd} className="w-full mt-2 bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-sm">
                  تحديث البث
               </button>
             </div>
          )}

          {activeTab === 'music' && (
             <div className="flex flex-col gap-6">
                <div className="flex bg-slate-100 dark:bg-surface-dark p-1 rounded-xl w-fit">
                   <button onClick={() => setMusicSubTab('songs')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${musicSubTab === 'songs' ? 'bg-white dark:bg-card-dark text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>الأغاني</button>
                   <button onClick={() => setMusicSubTab('albums')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${musicSubTab === 'albums' ? 'bg-white dark:bg-card-dark text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>الألبومات</button>
                   <button onClick={() => setMusicSubTab('playlists')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${musicSubTab === 'playlists' ? 'bg-white dark:bg-card-dark text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>القوائم</button>
                </div>
                
                <div className="flex flex-col gap-3">
                   {musicSubTab === 'songs' && songs.map(song => (
                     <div key={song.id} className="bg-white dark:bg-card-dark p-3 rounded-xl border border-border-light dark:border-border-dark flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {song.coverUrl && song.coverUrl.trim() !== '' ? (
                              <img src={song.coverUrl} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-surface-dark flex items-center justify-center">
                                 <Music size={20} className="text-slate-300" />
                              </div>
                            )}
                           <div>
                              <p className="text-xs font-black">{song.title}</p>
                              <p className="text-[10px] text-slate-400 font-bold">{song.artist} • {song.category}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEditItem(song)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"><Edit2 size={16} /></button>
                           <button onClick={() => handleDelete('songs', song.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                        </div>
                     </div>
                   ))}
                   {musicSubTab === 'albums' && albums.map(album => (
                     <div key={album.id} className="bg-white dark:bg-card-dark p-3 rounded-xl border border-border-light dark:border-border-dark flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {album.coverUrl && album.coverUrl.trim() !== '' ? (
                              <img src={album.coverUrl} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-surface-dark flex items-center justify-center">
                                 <Disc size={20} className="text-slate-300" />
                              </div>
                            )}
                           <div>
                              <p className="text-xs font-black">{album.title}</p>
                              <p className="text-[10px] text-slate-400 font-bold">{album.artist} • {album.year}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEditItem(album)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"><Edit2 size={16} /></button>
                           <button onClick={() => handleDelete('albums', album.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                        </div>
                     </div>
                   ))}
                   {musicSubTab === 'playlists' && playlists.map(playlist => (
                     <div key={playlist.id} className="bg-white dark:bg-card-dark p-3 rounded-xl border border-border-light dark:border-border-dark flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {playlist.coverUrl && playlist.coverUrl.trim() !== '' ? (
                              <img src={playlist.coverUrl} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-surface-dark flex items-center justify-center">
                                 <ListMusic size={20} className="text-slate-300" />
                              </div>
                            )}
                           <div>
                              <p className="text-xs font-black">{playlist.title}</p>
                              <p className="text-[10px] text-slate-400 font-bold">{playlist.songIds?.length || 0} أغنية</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleEditItem(playlist)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"><Edit2 size={16} /></button>
                           <button onClick={() => handleDelete('playlists', playlist.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {activeTab === 'books' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {books.map(book => (
                  <div key={book.id} className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-border-light dark:border-border-dark flex gap-4">
                    <div className="relative w-20 h-28 bg-slate-100 rounded-xl overflow-hidden shadow-md flex items-center justify-center">
                      {book.coverUrl && book.coverUrl.trim() !== '' ? (
                        <img src={book.coverUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <BookOpen size={32} className="text-slate-300" />
                      )}
                    </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="font-black text-xs mb-1 truncate">{book.title}</h4>
                        <p className="text-[10px] text-slate-400 font-bold mb-2">{book.author}</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleEditItem(book)} className="flex-1 bg-slate-50 dark:bg-surface-dark py-2 rounded-lg text-[10px] font-black text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all">تعديل</button>
                           <button onClick={() => handleDelete('books', book.id)} className="px-3 bg-slate-50 dark:bg-surface-dark py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                        </div>
                     </div>
                  </div>
                ))}
                {books.length === 0 && <div className="col-span-full py-10 text-center bg-white dark:bg-card-dark rounded-xl border border-dashed border-slate-200 text-slate-400 font-bold text-sm">لا توجد كتب مضافة</div>}
             </div>
           )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-card-dark w-full max-w-md rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">
                {isEditing ? 'تعديل' : 'إضافة'} {
                  activeTab === 'news' ? 'خبر' : 
                  activeTab === 'media' ? 'ميديا' : 
                  activeTab === 'matches' ? 'مباراة' : 
                  activeTab === 'city' ? 'بيانات المدينة' :
                  activeTab === 'clubs' ? 'نادي' : 
                  activeTab === 'products' ? 'منتج' :
                  activeTab === 'history' ? (historySubTab === 'stats' ? 'رقم' : historySubTab === 'titles' ? 'بطولة' : historySubTab === 'timeline' ? 'حدث' : 'ملعب') :
                  'استطلاع'
                }
              </h3>
              <div className="flex items-center gap-2">
                {isEditing && (
                  <button 
                    onClick={() => {
                      if (window.confirm('هل تريد استرجاع البيانات الأصلية؟')) {
                        setFormData({ ...baseData });
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-surface-dark text-slate-500 text-[10px] font-black hover:bg-slate-200 transition-all border border-border-light dark:border-border-dark"
                  >
                    <RotateCcw size={12} />
                    استرجاع
                  </button>
                )}
                <button 
                  onClick={() => {
                    setShowModal(false);
                    setIsEditing(false);
                    setEditingId(null);
                  }} 
                  className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1 no-scrollbar text-right">
                {activeTab === 'products' && (
                 <>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">اسم المنتج</label>
                      <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">السعر</label>
                      <input type="number" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.price || ''} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">النوع</label>
                      <select className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.category || 'tshirt'} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                        <option value="tshirt">تيشيرت</option>
                        <option value="mug">مج / كوب</option>
                        <option value="scarf">سكارف</option>
                        <option value="bracelet">حظاظة</option>
                        <option value="other">أخرى</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">الوصف</label>
                      <textarea className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold min-h-[100px]" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <UploadOrUrlField label="صورة المنتج" fieldName="imageUrl" currentUrl={formData.imageUrl} formData={formData} setFormData={setFormData} uploading={uploading} handleFileUpload={handleFileUpload} />
                 </>
               )}

               {activeTab === 'history' && (
                 <>
                   {historySubTab === 'stats' && (
                     <>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">العنوان (مثل: سنة تاريخ)</label>
                          <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.label || ''} onChange={(e) => setFormData({...formData, label: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">القيمة (الرقم)</label>
                          <input type="number" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.value || ''} onChange={(e) => setFormData({...formData, value: e.target.value})} />
                        </div>
                     </>
                   )}
                   {historySubTab === 'titles' && (
                     <>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">اسم البطولة</label>
                          <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">العدد</label>
                          <input type="number" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.count || ''} onChange={(e) => setFormData({...formData, count: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">التصنيف</label>
                          <select className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.category || 'football'} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                            <option value="football">كرة قدم</option>
                            <option value="basketball">كرة سلة</option>
                          </select>
                        </div>
                     </>
                   )}
                   {historySubTab === 'timeline' && (
                     <>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">السنة</label>
                          <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.year || ''} onChange={(e) => setFormData({...formData, year: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">العنوان</label>
                          <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">الوصف</label>
                          <textarea className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm min-h-[100px]" value={formData.desc || ''} onChange={(e) => setFormData({...formData, desc: e.target.value})} />
                        </div>
                     </>
                   )}
                   {historySubTab === 'stadiums' && (
                     <>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">اسم الملعب</label>
                          <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">النوع (مثل: أول ملعب)</label>
                          <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.type || ''} onChange={(e) => setFormData({...formData, type: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">الوصف</label>
                          <textarea className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm min-h-[100px]" value={formData.desc || ''} onChange={(e) => setFormData({...formData, desc: e.target.value})} />
                        </div>
                        <UploadOrUrlField label="صورة الملعب" fieldName="imageUrl" currentUrl={formData.imageUrl} formData={formData} setFormData={setFormData} uploading={uploading} handleFileUpload={handleFileUpload} />
                     </>
                   )}
                   <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark mt-2">
                     <input 
                       type="checkbox" 
                       id="hide-history-item" 
                       className="w-4 h-4 accent-primary" 
                       checked={formData.hidden || false} 
                       onChange={(e) => setFormData({...formData, hidden: e.target.checked})} 
                     />
                     <label htmlFor="hide-history-item" className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">إخفاء هذا العنصر من الموقع الرسمي</label>
                   </div>
                 </>
               )}

               {activeTab === 'music' && (
                 <>
                   {musicSubTab === 'songs' ? (
                     <>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">عنوان الأغنية/الأهزوجة</label>
                          <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">الفنان / المؤدي</label>
                          <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.artist || ''} onChange={(e) => setFormData({...formData, artist: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">التصنيف</label>
                          <select className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.category || 'chant'} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                             <option value="chant">أهزوجة مدرج</option>
                             <option value="anthem">النشيد الرسمي</option>
                             <option value="song">أغنية خاصة</option>
                          </select>
                        </div>
                        <UploadOrUrlField label="رابط الملف الصوتي (MP3)" fieldName="audioUrl" currentUrl={formData.audioUrl} type="audio" formData={formData} setFormData={setFormData} uploading={uploading} handleFileUpload={handleFileUpload} />
                        <UploadOrUrlField label="صورة الغلاف" fieldName="coverUrl" currentUrl={formData.coverUrl} formData={formData} setFormData={setFormData} uploading={uploading} handleFileUpload={handleFileUpload} />
                     </>
                   ) : musicSubTab === 'albums' ? (
                     <>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">عنوان الألبوم</label>
                          <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">الفنان</label>
                          <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.artist || ''} onChange={(e) => setFormData({...formData, artist: e.target.value})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">سنة الإصدار</label>
                          <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.year || ''} onChange={(e) => setFormData({...formData, year: e.target.value})} />
                        </div>
                        <UploadOrUrlField label="صورة الغلاف" fieldName="coverUrl" currentUrl={formData.coverUrl} formData={formData} setFormData={setFormData} uploading={uploading} handleFileUpload={handleFileUpload} />
                     </>
                   ) : (
                     <>
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">عنوان قائمة التشغيل</label>
                          <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                        </div>
                        <UploadOrUrlField label="صورة الغلاف" fieldName="coverUrl" currentUrl={formData.coverUrl} formData={formData} setFormData={setFormData} uploading={uploading} handleFileUpload={handleFileUpload} />
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 block text-right">اختر الأغاني</label>
                           <div className="max-h-[200px] overflow-y-auto border border-border-light dark:border-border-dark rounded-xl p-2 space-y-1">
                              {songs.map(song => (
                                <label key={song.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-card-dark rounded-lg cursor-pointer">
                                   <input 
                                    type="checkbox" 
                                    className="w-4 h-4 accent-primary"
                                    checked={formData.songIds?.includes(song.id)} 
                                    onChange={(e) => {
                                      const ids = formData.songIds || [];
                                      if (e.target.checked) setFormData({...formData, songIds: [...ids, song.id]});
                                      else setFormData({...formData, songIds: ids.filter((id: string) => id !== song.id)});
                                    }}
                                   />
                                   <div className="flex items-center gap-2">
                                      {song.coverUrl && song.coverUrl.trim() !== '' ? (
                                        <img src={song.coverUrl} className="w-6 h-6 rounded object-cover" />
                                      ) : (
                                        <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center">
                                          <Music size={10} className="text-slate-400" />
                                        </div>
                                      )}
                                      <span className="text-[10px] font-bold">{song.title}</span>
                                   </div>
                                </label>
                              ))}
                              {songs.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4">لا توجد أغاني لاختيارها</p>}
                           </div>
                        </div>
                     </>
                   )}
                 </>
               )}

               {activeTab === 'books' && (
                 <>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">عنوان الكتاب</label>
                      <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">الكاتب / المصدر</label>
                      <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm" value={formData.author || ''} onChange={(e) => setFormData({...formData, author: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">رابط الـ PDF (رابط مباشر أو Google Drive Preview)</label>
                      <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm text-left dir-ltr" value={formData.pdfUrl || ''} onChange={(e) => setFormData({...formData, pdfUrl: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">وصف قصير</label>
                      <textarea className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm min-h-[80px]" value={formData.desc || ''} onChange={(e) => setFormData({...formData, desc: e.target.value})} />
                    </div>
                    <UploadOrUrlField label="صورة الغلاف" fieldName="coverUrl" currentUrl={formData.coverUrl} formData={formData} setFormData={setFormData} uploading={uploading} handleFileUpload={handleFileUpload} />
                 </>
               )}

               {activeTab === 'news' && (
                 <>
                   <div>
                     <label className="text-[10px] font-black text-slate-500 mb-1 block">عنوان الخبر</label>
                     <input type="text" placeholder="مثلاً: الاتحاد يحقق فوزاً ثميناً" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-500 mb-1 block">محتوى الخبر</label>
                     <textarea placeholder="اكتب تفاصيل الخبر هنا..." className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm min-h-[120px]" value={formData.content || ''} onChange={(e) => setFormData({...formData, content: e.target.value})} />
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">التصنيف</label>
                      <select className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-sm font-bold" value={formData.category || 'أخبار النادي'} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                          {newsCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">مصدر الخبر</label>
                      <input type="text" placeholder="مثلاً: الموقع الرسمي" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm" value={formData.author || ''} onChange={(e) => setFormData({...formData, author: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">اسم المحرر</label>
                      <input type="text" placeholder="مثلاً: أحمد محمد" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm" value={formData.editorName || ''} onChange={(e) => setFormData({...formData, editorName: e.target.value})} />
                    </div>
                   </div>
                    <UploadOrUrlField label="صورة الخبر" fieldName="image" currentUrl={formData.image} formData={formData} setFormData={setFormData} uploading={uploading} handleFileUpload={handleFileUpload} />
                   <div>
                     <label className="text-[10px] font-black text-slate-500 mb-1 block">رابط RSS (لجلب الخبر تلقائياً)</label>
                     <input type="text" placeholder="https://..." className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm" value={formData.rssUrl || ''} onChange={(e) => setFormData({...formData, rssUrl: e.target.value})} />
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-500 mb-1 block mt-2">وسوم الخبر</label>
                     <div className="flex flex-wrap gap-2">
                       {useAppStore.getState().newsTags?.map((tag: any) => (
                         <label key={tag.id} className="cursor-pointer flex items-center gap-1 bg-slate-50 dark:bg-surface-dark px-3 py-1.5 rounded-xl border border-slate-100 dark:border-border-dark group active:scale-95 transition-transform">
                           <input 
                             type="checkbox" 
                             checked={formData.tagIds?.includes(tag.id) || false}
                             onChange={(e) => {
                               const currentTags = formData.tagIds || [];
                               if (e.target.checked) setFormData({...formData, tagIds: [...currentTags, tag.id]});
                               else setFormData({...formData, tagIds: currentTags.filter((id: any) => id !== tag.id)});
                             }}
                             className="hidden"
                           />
                           <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                           <span className={`text-xs font-bold ${formData.tagIds?.includes(tag.id) ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`}>{tag.name}</span>
                           {formData.tagIds?.includes(tag.id) && <Check size={12} className="text-primary ml-1" />}
                         </label>
                       ))}
                     </div>
                   </div>
                 </>
               )}

               {activeTab === 'users' && (
                 <>
                   <div className="flex flex-col items-center mb-4">
                     {formData.avatar && formData.avatar.trim() !== '' ? (
                       <img src={formData.avatar} className="w-20 h-20 rounded-full border-2 border-primary mb-2 shadow-lg" alt="avatar" referrerPolicy="no-referrer" />
                     ) : (
                       <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-slate-200 mb-2 flex items-center justify-center">
                         <UsersIcon size={32} className="text-slate-300" />
                       </div>
                     )}
                     <p className="text-[10px] font-bold text-slate-400 capitalize">{formData.tier || 'new'} Member</p>
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-500 mb-1 block">اسم العضو</label>
                     <input type="text" placeholder="الاسم الجديد" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-500 mb-1 block">البريد الإلكتروني (للعرض فقط)</label>
                     <input type="text" disabled className="w-full p-3 rounded-xl border border-border-light bg-slate-200 dark:bg-slate-800 dark:border-border-dark text-sm opacity-50 cursor-not-allowed text-left dir-ltr" value={formData.email || ''} />
                   </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">الصلاحيات الأساسية</label>
                        <select className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" value={formData.role || 'user'} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                          <option value="user">عضو عادي</option>
                          <option value="writer">محرر بسيط</option>
                          <option value="moderator">مشرف</option>
                          <option value="admin">مدير نظام كامل</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">الرتبة (Tier)</label>
                        <select className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" value={formData.tier || 'new'} onChange={(e) => setFormData({...formData, tier: e.target.value})}>
                          <option value="new">عضو جديد (New)</option>
                          <option value="bronze">عضو برونزي (Bronze)</option>
                          <option value="silver">عضو فضي (Silver)</option>
                          <option value="gold">عضو ذهبي (Gold)</option>
                          <option value="diamond">عضو ماسي (Diamond)</option>
                          <option value="premium">عضو ملكي (Premium)</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-slate-50 dark:bg-surface-dark rounded-2xl border border-border-light dark:border-border-dark">
                      <label className="text-xs font-black text-slate-800 dark:text-white mb-3 block">الرتب والصلاحيات المخصصة</label>
                      <div className="grid grid-cols-1 gap-2">
                        {APP_ROLES.map(role => (
                          <label 
                            key={role.id} 
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                              formData.roles?.includes(role.id) 
                                ? 'bg-primary/5 border-primary/20' 
                                : 'bg-white dark:bg-card-dark border-transparent hover:border-slate-200'
                            }`}
                          >
                            <input 
                              type="checkbox"
                              className="hidden"
                              checked={formData.roles?.includes(role.id)}
                              onChange={(e) => {
                                const currentRoles = formData.roles || [];
                                if (e.target.checked) {
                                  setFormData({ ...formData, roles: [...currentRoles, role.id] });
                                } else {
                                  setFormData({ ...formData, roles: currentRoles.filter((r: string) => r !== role.id) });
                                }
                              }}
                            />
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${formData.roles?.includes(role.id) ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-surface-dark text-slate-400'}`}>
                              <role.icon size={16} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-black">{role.label}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{role.id.replace('_', ' ')}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.roles?.includes(role.id) ? 'bg-primary border-primary text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                              {formData.roles?.includes(role.id) && <Check size={12} strokeWidth={4} />}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                 </>
               )}

               {activeTab === 'media' && (
                 <>
                   <div>
                     <label className="text-[10px] font-black text-slate-500 mb-1 block">العنوان</label>
                     <input type="text" placeholder="مثلاً: أهداف مباراة الأمس" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" value={formData.title || ''} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">النوع</label>
                      <select className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" value={formData.type || 'video'} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                         <option value="video">فيديو</option>
                         <option value="photo">صورة</option>
                      </select>
                    </div>
                    {formData.type === 'video' && (
                      <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">المصدر</label>
                        <select className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" value={formData.source || 'upload'} onChange={(e) => setFormData({...formData, source: e.target.value})}>
                          <option value="upload">رفع فيديو</option>
                          <option value="youtube">رابط يوتيوب</option>
                          <option value="embed">تضمين (Embed URL)</option>
                        </select>
                      </div>
                    )}
                   </div>

                   {formData.type === 'video' && formData.source === 'youtube' && (
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">رابط يوتيوب</label>
                      <input 
                        type="text" 
                        placeholder="https://www.youtube.com/watch?v=..." 
                        className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-mono text-left dir-ltr" 
                        value={formData.url || ''} 
                        onChange={(e) => {
                          const url = e.target.value;
                          let thumb = formData.thumbnailUrl;
                          if (url.includes('youtube.com/watch?v=')) {
                            const id = url.split('v=')[1]?.split('&')[0];
                            thumb = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
                          } else if (url.includes('youtu.be/')) {
                            const id = url.split('youtu.be/')[1]?.split('?')[0];
                            thumb = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
                          }
                          setFormData({...formData, url, thumbnailUrl: thumb});
                        }} 
                      />
                    </div>
                   )}

                   {formData.type === 'video' && formData.source === 'embed' && (
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">رابط التضمين (Embed URL)</label>
                      <input 
                        type="text" 
                        placeholder="https://..." 
                        className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-mono text-left dir-ltr" 
                        value={formData.url || ''} 
                        onChange={(e) => setFormData({...formData, url: e.target.value})} 
                      />
                      <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-tighter">Enter direct embed URL (src of iframe)</p>
                    </div>
                   )}

                   {formData.type === 'video' && formData.source === 'upload' && (
                    <UploadOrUrlField label="ميديا الفيديو" fieldName="url" currentUrl={formData.url} type="video" formData={formData} setFormData={setFormData} uploading={uploading} handleFileUpload={handleFileUpload} />
                   )}

                   {formData.type === 'photo' && (
                    <UploadOrUrlField label="ميديا الصورة" fieldName="url" currentUrl={formData.url} type="image" formData={formData} setFormData={setFormData} uploading={uploading} handleFileUpload={handleFileUpload} />
                   )}

                   {formData.type === 'video' && (
                     <>
                        <UploadOrUrlField label="صورة الغلاف (Thumbnail)" fieldName="thumbnailUrl" currentUrl={formData.thumbnailUrl} formData={formData} setFormData={setFormData} uploading={uploading} handleFileUpload={handleFileUpload} />
                        <div>
                          <label className="text-[10px] font-black text-slate-500 mb-1 block">المدة (مثلاً 05:20)</label>
                          <input type="text" placeholder="00:00" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm" value={formData.duration || ''} onChange={(e) => setFormData({...formData, duration: e.target.value})} />
                        </div>
                     </>
                   )}
                 </>
               )}
               
                {activeTab === 'city' && (
                  <>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">اسم المدينة</label>
                      <input type="text" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" value={formData.cityName || ''} onChange={(e) => setFormData({...formData, cityName: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <div>
                         <label className="text-[10px] font-black text-slate-500 mb-1 block">درجة الحرارة</label>
                         <input type="text" placeholder="مثلاً: 25" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" value={formData.temperature || ''} onChange={(e) => setFormData({...formData, temperature: e.target.value})} />
                       </div>
                       <div>
                         <label className="text-[10px] font-black text-slate-500 mb-1 block">حالة الطقس</label>
                         <input type="text" placeholder="مثلاً: صافي / غائم جزئياً" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" value={formData.condition || ''} onChange={(e) => setFormData({...formData, condition: e.target.value})} />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <div>
                         <label className="text-[10px] font-black text-slate-500 mb-1 block">وقت الشروق</label>
                         <input type="text" placeholder="06:30 AM" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-black tabular-nums" value={formData.sunrise || ''} onChange={(e) => setFormData({...formData, sunrise: e.target.value})} />
                       </div>
                       <div>
                         <label className="text-[10px] font-black text-slate-500 mb-1 block">وقت الغروب</label>
                         <input type="text" placeholder="07:15 PM" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-black tabular-nums" value={formData.sunset || ''} onChange={(e) => setFormData({...formData, sunset: e.target.value})} />
                       </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 mb-1 block">وصف للمدينة</label>
                      <textarea className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm min-h-[100px]" value={formData.description || ''} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                    </div>
                    <UploadOrUrlField label="صورة الغلاف للمدينة" fieldName="image" currentUrl={formData.image} formData={formData} setFormData={setFormData} uploading={uploading} handleFileUpload={handleFileUpload} />
                    <UploadOrUrlField label="خلفية بطاقة الطقس" fieldName="weatherBg" currentUrl={formData.weatherBg} formData={formData} setFormData={setFormData} uploading={uploading} handleFileUpload={handleFileUpload} />
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark">
                        <input type="checkbox" id="cityActive" checked={formData.active ?? true} onChange={(e) => setFormData({...formData, active: e.target.checked})} />
                        <label htmlFor="cityActive" className="text-xs font-bold cursor-pointer">تفعيل عرض بطاقة المدينة في الصفحة الرئيسية</label>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark">
                        <input type="checkbox" id="cityAutoWeather" checked={formData.useAutoWeather ?? true} onChange={(e) => setFormData({...formData, useAutoWeather: e.target.checked})} />
                        <label htmlFor="cityAutoWeather" className="text-xs font-bold cursor-pointer">ترتبيط تلقائي للطقس من الإنترنت (Open-Meteo)</label>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'matches' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">الرياضة</label>
                        <select className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" value={formData.sport || 'football'} onChange={(e) => setFormData({...formData, sport: e.target.value})}>
                           <option value="football">كرة قدم</option>
                           <option value="basketball">كرة سلة</option>
                        </select>
                      </div>
                      <div className="opacity-0 pointer-events-none">Placeholder</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">الفريق المضيف</label>
                        <input type="text" placeholder="الفريق المضيف" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" value={formData.homeTeam || ''} onChange={(e) => setFormData({...formData, homeTeam: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">الفريق الخصم</label>
                        <input type="text" placeholder="الفريق الخصم" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" value={formData.awayTeam || ''} onChange={(e) => setFormData({...formData, awayTeam: e.target.value})} />
                      </div>
                    </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <UploadOrUrlField label="لوجو صاحب الأرض" fieldName="homeLogo" currentUrl={formData.homeLogo} formData={formData} setFormData={setFormData} uploading={uploading} handleFileUpload={handleFileUpload} />
                     </div>
                     <div>
                       <UploadOrUrlField label="لوجو الخصم" fieldName="awayLogo" currentUrl={formData.awayLogo} formData={formData} setFormData={setFormData} uploading={uploading} handleFileUpload={handleFileUpload} />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">أهدافنا</label>
                       <input 
                         type="text" 
                         placeholder="0" 
                         className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" 
                         value={formData.homeScore ?? ''} 
                         onChange={(e) => setFormData({...formData, homeScore: e.target.value})} 
                       />
                     </div>
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">أهداف الخصم</label>
                       <input 
                         type="text" 
                         placeholder="0" 
                         className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" 
                         value={formData.awayScore ?? ''} 
                         onChange={(e) => setFormData({...formData, awayScore: e.target.value})} 
                       />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">الحالة</label>
                       <select className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" value={formData.status || 'upcoming'} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                          <option value="upcoming">قادمة</option>
                          <option value="live">مباشر</option>
                          <option value="finished">منتهية</option>
                       </select>
                     </div>
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">الدقيقة الحالية</label>
                       <input 
                         type="number" 
                         placeholder="0" 
                         className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" 
                         value={formData.timerBaseMinute || 0} 
                         onChange={(e) => setFormData({...formData, timerBaseMinute: e.target.value})} 
                       />
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2">
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">البطولة</label>
                       <input type="text" placeholder="البطولة" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm" value={formData.competition || ''} onChange={(e) => setFormData({...formData, competition: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">الملعب</label>
                       <input type="text" placeholder="الملعب" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm" value={formData.stadium || ''} onChange={(e) => setFormData({...formData, stadium: e.target.value})} />
                     </div>
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-500 mb-1 block">تاريخ ووقت المباراة (بتوقيت مصر)</label>
                     <input type="datetime-local" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm" value={formData.date && !isNaN(new Date(formData.date).getTime()) ? formatInTimeZone(new Date(formData.date), 'Africa/Cairo', 'yyyy-MM-dd\'T\'HH:mm') : ''} onChange={(e) => setFormData({...formData, date: e.target.value ? fromZonedTime(e.target.value, 'Africa/Cairo').toISOString() : ''})} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                       <div className="flex items-center gap-3 p-4 bg-slate-100/50 dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark group cursor-pointer hover:bg-primary/5 hover:border-primary/20 transition-all">
                          <input 
                            type="checkbox" 
                            id="matchFeatured" 
                            className="w-5 h-5 rounded-lg border-border-light text-primary focus:ring-primary h-5 w-5"
                            checked={formData.featured || false} 
                            onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                          />
                          <label htmlFor="matchFeatured" className="flex-1 cursor-pointer">
                             <p className="text-xs font-black text-slate-800 dark:text-white">تمييز المباراة (Featured)</p>
                             <p className="text-[9px] text-slate-500 font-bold uppercase">Show in prominent hero slider</p>
                          </label>
                          <Star size={18} className={formData.featured ? 'text-yellow-500 fill-current' : 'text-slate-300'} />
                       </div>

                       <div className="flex items-center gap-3 p-4 bg-slate-100/50 dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-border-dark group cursor-pointer hover:bg-accent/5 hover:border-accent/20 transition-all">
                          <input 
                            type="checkbox" 
                            id="isMatchDay" 
                            className="w-5 h-5 rounded-lg border-border-light text-accent focus:ring-accent h-5 w-5"
                            checked={formData.isMatchDay || false} 
                            onChange={(e) => setFormData({...formData, isMatchDay: e.target.checked})}
                          />
                          <label htmlFor="isMatchDay" className="flex-1 cursor-pointer">
                             <p className="text-xs font-black text-slate-800 dark:text-white">جعلها مباراة اليوم (Match Day)</p>
                             <p className="text-[9px] text-slate-500 font-bold uppercase">Activate match-day specific UI</p>
                          </label>
                          <Zap size={18} className={formData.isMatchDay ? 'text-accent fill-current' : 'text-slate-300'} />
                       </div>
                    </div>
                   </div>
                  </>
                )}

                {activeTab === 'clubs' && (
                   <>
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">اسم النادي</label>
                       <input type="text" placeholder="مثلاً: نادي الاتحاد" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                     </div>
                     <div>
                      <UploadField label="شعار النادي" fieldName="logo" currentUrl={formData.logo} uploading={uploading} handleFileUpload={handleFileUpload} setFormData={setFormData} />

                     </div>
                   </>
                 )}

                  {activeTab === 'polls' && (
                    <>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block">سؤال الاستطلاع</label>
                        <input type="text" placeholder="مثلاً: من هو أفضل لاعب هذا الشهر؟" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" value={formData.question || ''} onChange={(e) => setFormData({...formData, question: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-500 mb-1 block uppercase">خيارات الاستطلاع</label>
                        <div className="space-y-2">
                          {(Array.isArray(formData.options) ? formData.options : ['', '']).map((option: string, idx: number) => (
                             <div key={idx} className="flex gap-2">
                               <div className="flex flex-col gap-1 flex-1">
                                 <label className="text-[8px] font-bold text-slate-400 uppercase px-1">الخيار {idx + 1}</label>
                                 <input 
                                   type="text" 
                                   placeholder={`الخيار ${idx + 1}`}
                                   className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" 
                                   value={option || ''} 
                                   onChange={(e) => {
                                     const newOptions = [...(formData.options || ['', ''])];
                                     newOptions[idx] = e.target.value;
                                     setFormData({...formData, options: newOptions});
                                   }} 
                                 />
                               </div>
                               <div className="w-20">
                                 <label className="text-[8px] font-bold text-slate-400 uppercase px-1">الأصوات</label>
                                 <input 
                                   type="number" 
                                   className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-black text-primary text-center" 
                                   value={formData.votes?.[idx] || 0} 
                                   onChange={(e) => {
                                     const newVotes = { ...(formData.votes || {}) };
                                     newVotes[idx] = Number(e.target.value);
                                     setFormData({...formData, votes: newVotes});
                                   }}
                                 />
                               </div>
                               {((formData.options?.length || 0) > 2) && (
                                <button 
                                  onClick={() => {
                                    const newOptions = [...(formData.options || [])];
                                    newOptions.splice(idx, 1);
                                    setFormData({...formData, options: newOptions});
                                  }}
                                  className="px-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                         ))}
                         <button 
                           onClick={() => {
                             const newOptions = Array.isArray(formData.options) ? [...formData.options] : ['', ''];
                             newOptions.push('');
                             setFormData({...formData, options: newOptions});
                           }}
                           className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-border-dark rounded-xl text-[10px] font-black text-slate-400 hover:text-primary hover:border-primary transition-all flex items-center justify-center gap-1"
                         >
                           <Plus size={12} />
                           إضافة خيار
                         </button>
                       </div>
                     </div>
                     <div className="flex items-center gap-2 mt-2">
                        <input 
                          type="checkbox" 
                          id="pollActive" 
                          checked={formData.active ?? true} 
                          onChange={(e) => setFormData({...formData, active: e.target.checked})}
                        />
                        <label htmlFor="pollActive" className="text-xs font-bold font-sans dark:text-white">تفعيل الاستطلاع ليظهر للمشجعين</label>
                     </div>
                   </>
                 )}

                 {activeTab === 'predictions' && (
                   <>
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">المباراة</label>
                       <select 
                        className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold"
                        value={formData.matchId || ''}
                        onChange={(e) => setFormData({...formData, matchId: e.target.value})}
                       >
                         <option value="">اختر المباراة</option>
                         {matches.map(m => (
                           <option key={m.id} value={m.id}>{m.homeTeam} × {m.awayTeam} ({new Date(m.date).toLocaleDateString('ar-EG')})</option>
                         ))}
                       </select>
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                       <div>
                         <label className="text-[10px] font-black text-slate-500 mb-1 block">أهداف الفريق 1</label>
                         <input type="number" placeholder="0" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" value={formData.homeScore ?? ''} onChange={(e) => setFormData({...formData, homeScore: Number(e.target.value)})} />
                       </div>
                       <div>
                         <label className="text-[10px] font-black text-slate-500 mb-1 block">أهداف الفريق 2</label>
                         <input type="number" placeholder="0" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm font-bold" value={formData.awayScore ?? ''} onChange={(e) => setFormData({...formData, awayScore: Number(e.target.value)})} />
                       </div>
                     </div>
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">اسم المتوقع</label>
                       <input type="text" placeholder="مثلاً: محمد علي" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm" value={formData.userName || ''} onChange={(e) => setFormData({...formData, userName: e.target.value})} />
                     </div>
                     <div>
                       <label className="text-[10px] font-black text-slate-500 mb-1 block">البريد الإلكتروني (اختياري)</label>
                       <input type="email" placeholder="email@example.com" className="w-full p-3 rounded-xl border border-border-light bg-slate-50 dark:bg-surface-dark dark:border-border-dark text-slate-800 dark:text-white text-sm" value={formData.userEmail || ''} onChange={(e) => setFormData({...formData, userEmail: e.target.value})} />
                     </div>
                   </>
                 )}
            </div>

            <button 
              onClick={() => {
                if (window.confirm(isEditing ? 'هل أنت متأكد من حفظ التعديلات؟' : 'هل أنت متأكد من الإضافة؟')) {
                  handleAdd();
                }
              }} 
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm mt-6 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              {isEditing ? 'تعديل وحفظ' : 'إضافة وحفظ'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
