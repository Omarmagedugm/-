import { Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { ar } from 'date-fns/locale';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { Play, Image as ImageIcon, Video, Radio, Clock, Eye, X, ChevronRight, Calendar, Download, Heart } from 'lucide-react';
import { getOptimizedImage } from '../lib/cloudinary';

export default function Media() {
  const { media, mediaPlaylists } = useAppStore();
  const [activeTab, setActiveTab] = useState<'all' | 'photo' | 'video'>('all');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  useEffect(() => {
    if (selectedPlaylistId) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedPlaylistId]);

  useEffect(() => {
    if (selectedVideo || selectedPhoto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedVideo, selectedPhoto]);

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const photos = media.filter(m => m.type === 'photo' && (!selectedPlaylistId || m.playlistId === selectedPlaylistId));
  const videos = media.filter(m => m.type === 'video' && (!selectedPlaylistId || m.playlistId === selectedPlaylistId));

  const getEmbedUrl = (url: string, source?: string) => {
    if (source === 'embed') return url;
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    } else if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}?autoplay=1`;
    } else if (url.includes('youtube.com/embed/')) {
      return url.includes('?') ? `${url}&autoplay=1` : `${url}?autoplay=1`;
    } else if (url.includes('facebook.com/')) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&autoplay=1`;
    }
    return null;
  };

  const isEmbeddable = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('facebook.com');
  };
  
  const displayPlaylists = mediaPlaylists.filter(p => {
    if (activeTab === 'all') return true;
    return p.type === activeTab;
  });

  const selectedPlaylist = mediaPlaylists.find(p => p.id === selectedPlaylistId);
  
  const displayMedia = (activeTab === 'all' ? media : activeTab === 'photo' ? photos : videos)
    .filter(m => !selectedPlaylistId || m.playlistId === selectedPlaylistId);

  const featuredMedia = !selectedPlaylistId && displayMedia.length > 0 ? displayMedia[0] : null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0, 
      transition: { type: "spring", stiffness: 260, damping: 20 }
    }
  } as const;

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col pb-32 px-0 bg-background-light dark:bg-background-dark min-h-screen">
      <div className="sticky top-[65px] z-30 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-xl px-4 py-2 border-b border-border-light/40 dark:border-border-dark/40">
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-surface-dark rounded-2xl">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'photo', label: 'الصور' },
            { id: 'video', label: 'الفيديو' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-primary text-primary-dark dark:text-white shadow-premium' 
                  : 'text-slate-500 hover:text-primary-dark dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <Link to="/live" className="flex-1 py-2 rounded-xl text-[10px] font-black text-red-500 flex items-center justify-center gap-1 hover:bg-red-500/10 transition-all">
             <Radio size={12} className="animate-pulse" />
             مباشر
          </Link>
        </div>
      </div>

      <motion.main 
        key={activeTab}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-x-hidden p-4 flex flex-col gap-8"
      >
        {/* Featured Media Hero */}
        {featuredMedia && (
          <motion.section variants={itemVariants}>
            <div 
              onClick={() => featuredMedia.type === 'video' && setSelectedVideo(featuredMedia)}
              className="relative w-full aspect-[16/10] rounded-[40px] overflow-hidden group shadow-2xl cinematic-glow border border-white/5 cursor-pointer"
            >
              <img src={getOptimizedImage(featuredMedia.thumbnailUrl, 800) || undefined} alt={featuredMedia.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
              
              <div className="absolute top-4 left-4 flex gap-2">
                <div className="px-3 py-1 bg-primary/90 backdrop-blur-md rounded-xl text-[9px] font-black text-white ring-1 ring-white/20 uppercase tracking-widest">
                  {featuredMedia.type === 'video' ? 'فيديو مميز' : 'صورة مميزة'}
                </div>
                {featuredMedia.type === 'video' && featuredMedia.duration && (
                  <div className="px-3 py-1 bg-black/50 backdrop-blur-md rounded-xl text-[9px] font-black text-white flex items-center gap-1">
                    <Clock size={10} /> {featuredMedia.duration}
                  </div>
                )}
              </div>
              
              {featuredMedia.type === 'video' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:bg-primary/40 group-hover:border-primary/50">
                    <Play size={32} fill="white" className="ml-1" />
                  </div>
                </div>
              )}
              
              <div className="absolute bottom-6 left-6 right-6">
                <h3 className="text-xl font-black text-white leading-tight mb-3 drop-shadow-2xl group-hover:text-accent transition-colors">
                  {featuredMedia.title}
                </h3>
                <div className="flex items-center gap-4 text-white/60 text-[9px] font-black uppercase tracking-widest">
                    <div className="flex items-center gap-1.5 text-right">
                        <Calendar size={10} />
                        {format(new Date(featuredMedia.date), 'dd MMMM yyyy', { locale: ar })}
                    </div>
                    {featuredMedia.views && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded-full">
                            <Eye size={10} />
                            {featuredMedia.views} مشاهدة
                        </div>
                    )}
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Playlists Grid Section - Only show if not focusing on a specific playlist */}
        {!selectedPlaylistId && displayPlaylists.length > 0 && (
          <motion.section variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex flex-col">
                <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none uppercase">
                  {activeTab === 'video' ? 'ألبومات الفيديو' : activeTab === 'photo' ? 'ألبومات الصور' : 'قوائم التشغيل'}
                </h2>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">اضغط لاستعراض المحتويات</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 px-1">
              {displayPlaylists.map((playlist) => (
                <button 
                  key={playlist.id} 
                  onClick={() => {
                    setSelectedPlaylistId(playlist.id);
                    if (playlist.type === 'video' || playlist.type === 'photo') {
                      setActiveTab(playlist.type);
                    }
                  }}
                  className="flex flex-col gap-2 pressable text-right group w-full"
                >
                  <div className="aspect-square rounded-[32px] overflow-hidden border-2 transition-all border-transparent shadow-premium relative">
                    <img src={getOptimizedImage(playlist.coverUrl || '', 400) || undefined} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
                       <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Play size={20} fill="white" className="ml-1" />
                       </div>
                    </div>
                  </div>
                  <div className="px-1">
                    <p className="text-xs font-black line-clamp-1 text-slate-800 dark:text-white group-hover:text-primary transition-colors">{playlist.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {media.filter(m => m.playlistId === playlist.id).length} عنصر • استعرض الآن
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {/* Selected Playlist Header */}
        {selectedPlaylistId && selectedPlaylist && (
          <motion.section variants={itemVariants} className="bg-white dark:bg-card-dark rounded-[40px] p-6 border border-border-light dark:border-border-dark shadow-premium">
            <div className="flex items-start justify-between gap-6">
              <div className="flex flex-col items-start gap-4 flex-1">
                <button 
                  onClick={() => setSelectedPlaylistId(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-surface-dark text-slate-500 dark:text-slate-400 rounded-2xl flex items-center gap-2 text-[10px] font-black hover:bg-primary/10 hover:text-primary transition-all group"
                >
                  <ChevronRight size={14} className="group-hover:-translate-x-1 transition-transform" />
                  العودة للمالتيميديا
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-wider ${selectedPlaylist.type === 'video' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                      {selectedPlaylist.type === 'video' ? 'فيديو' : 'صور'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">قائمة تشغيل مختارة</span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{selectedPlaylist.title}</h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-2 leading-relaxed">{selectedPlaylist.description}</p>
                </div>
              </div>
              <div className="w-32 aspect-square rounded-[32px] overflow-hidden shadow-2xl border-4 border-white dark:border-surface-dark shrink-0 hidden sm:block">
                <img src={getOptimizedImage(selectedPlaylist.coverUrl || '', 300) || undefined} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            </div>
          </motion.section>
        )}

        {/* Media Grid Upgrade */}
        <div className="flex flex-col gap-8">
          {/* Photo Gallery Tiles */}
          {(activeTab === 'all' || activeTab === 'photo') && photos.length > 0 && (
            <motion.section variants={itemVariants} className="space-y-6">
              <div className="flex flex-col px-1">
                <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none uppercase">
                  {selectedPlaylistId && selectedPlaylist ? `الصور في ${selectedPlaylist.title}` : 'أحدث الصور'}
                </h2>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Stunning captures</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {photos.filter(p => p.id !== featuredMedia?.id).map((item) => (
                  <motion.div 
                    key={item.id} 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedPhoto(item)}
                    className="group relative aspect-[4/5] rounded-[32px] overflow-hidden shadow-premium border border-border-light/40 dark:border-border-dark/40 cursor-pointer"
                  >
                    <img src={getOptimizedImage(item.thumbnailUrl, 600) || undefined} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-90"></div>
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center">
                      <ImageIcon size={14} className="text-white" />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 text-right">
                      <p className="text-[10px] font-black text-white line-clamp-2 leading-tight uppercase tracking-tighter">
                        {item.title}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Featured Photo Modal */}
          <AnimatePresence>
            {selectedPhoto && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4"
              >
                <div className="relative w-full max-w-lg flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                     <div className="flex flex-col text-right">
                        <h2 className="text-white font-black text-lg line-clamp-1">{selectedPhoto.title}</h2>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Photo Gallery</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleDownload(selectedPhoto.thumbnailUrl, selectedPhoto.title)}
                          className="px-4 py-2 bg-white/10 text-white rounded-xl font-black text-[10px] flex items-center gap-2 hover:bg-white/20 transition-all"
                        >
                          <Download size={16} />
                          تحميل
                        </button>
                        <button 
                         onClick={() => setSelectedPhoto(null)}
                         className="p-3 bg-white/10 text-white hover:bg-red-500 rounded-2xl transition-all border border-white/10"
                        >
                         <X size={20} />
                        </button>
                     </div>
                  </div>

                  <div className="aspect-[4/5] w-full rounded-[40px] overflow-hidden bg-slate-900 shadow-2xl relative border border-white/10">
                     <img 
                       src={getOptimizedImage(selectedPhoto.thumbnailUrl, 1000) || undefined} 
                       className="w-full h-full object-contain" 
                       referrerPolicy="no-referrer"
                       alt={selectedPhoto.title}
                     />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Videos Feed Upgrade */}
          {(activeTab === 'all' || activeTab === 'video') && videos.length > 0 && (
            <motion.section variants={itemVariants} className="space-y-6">
              <div className="flex flex-col px-1">
                <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none uppercase">
                  {selectedPlaylistId && selectedPlaylist ? `الفيديوهات في ${selectedPlaylist.title}` : 'مكتبة الفيديو'}
                </h2>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Exclusive Highlights</span>
              </div>
              <div className="flex flex-col gap-6">
                {videos.filter(v => v.id !== featuredMedia?.id).map((item) => (
                  <motion.div 
                    key={item.id} 
                    whileTap={{ scale: 0.98 }} 
                    onClick={() => setSelectedVideo(item)}
                    className="group flex gap-4 bg-white dark:bg-surface-dark rounded-[28px] overflow-hidden border border-border-light/40 dark:border-border-dark/40 shadow-premium hover:shadow-2xl transition-all duration-300 p-2.5 cursor-pointer"
                  >
                    <div className="w-[120px] aspect-video overflow-hidden relative rounded-2xl flex-shrink-0 bg-slate-900">
                      <img src={getOptimizedImage(item.thumbnailUrl, 400) || undefined} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-10 h-10 bg-white/30 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/40 group-hover:scale-110 transition-transform">
                           <Play size={16} fill="white" className="ml-1" />
                         </div>
                      </div>
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur-md text-[8px] font-black text-white rounded-lg">
                        {item.duration || '0:00'}
                      </div>
                    </div>
                    <div className="py-2 pl-2 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                           <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400">
                              <Eye size={10} />
                              {item.views || '0'} VIEWS
                           </div>
                           <div className="text-[9px] font-bold text-slate-400">
                             {format(new Date(item.date), 'dd MMM', { locale: ar })}
                           </div>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed line-clamp-2 group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 mt-2">
                        <span>تشغيل الآن</span>
                        <ChevronRight size={10} strokeWidth={3} className="rotate-180" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Empty State Upgrade */}
          {displayMedia.length === 0 && (
             <div className="w-full py-20 flex flex-col items-center justify-center glass-card rounded-[40px] border-dashed border-2 border-slate-200 dark:border-border-dark text-slate-400">
                <Video size={48} className="opacity-20 mb-4" />
                <p className="font-black text-sm">لا يوجد محتوى في هذا القسم</p>
             </div>
          )}
        </div>
      </motion.main>

      {/* Video Player Modal Upgrade */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95"
          >
            <div className="relative w-full max-w-4xl flex flex-col gap-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex flex-col gap-1">
                   <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-primary rounded-xl text-[9px] font-black text-white uppercase tracking-widest shadow-glow">Exclusive Media</span>
                   </div>
                   <h2 className="text-white font-black text-xl drop-shadow-2xl">{selectedVideo.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedVideo(null)}
                  className="w-12 h-12 bg-white/10 hover:bg-red-500 text-white rounded-2xl flex items-center justify-center transition-all border border-white/10 shadow-2xl"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="relative w-full aspect-video bg-black rounded-[32px] overflow-hidden shadow-2xl ring-1 ring-white/10">
                {isEmbeddable(selectedVideo.url) || selectedVideo.source === 'embed' ? (
                  <iframe 
                    src={getEmbedUrl(selectedVideo.url, selectedVideo.source) || undefined} 
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                ) : (
                  <video 
                    src={selectedVideo.url} 
                    className="w-full h-full" 
                    controls 
                    autoPlay
                  ></video>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

