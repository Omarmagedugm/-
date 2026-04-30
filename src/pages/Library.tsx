import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Music, 
  BookOpen, 
  Play, 
  Pause, 
  Search, 
  Filter, 
  ChevronRight, 
  Clock, 
  Star,
  Download,
  Share2,
  Headphones,
  Gamepad2,
  Disc,
  Library as LibraryIcon,
  Book as BookIcon,
  Maximize2,
  X
} from 'lucide-react';
import { useAppStore } from '../store';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Library() {
  const { 
    songs, 
    setSongs, 
    books, 
    setBooks, 
    albums, 
    setAlbums, 
    currentSong, 
    setCurrentSong, 
    setIsPlaying, 
    isPlaying,
    setActivePlaylist 
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<'music' | 'books'>('music');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    const unsubSongs = onSnapshot(collection(db, 'songs'), (snap) => {
      setSongs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });
    const unsubBooks = onSnapshot(collection(db, 'books'), (snap) => {
      setBooks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });
    const unsubAlbums = onSnapshot(collection(db, 'albums'), (snap) => {
      setAlbums(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    });
    return () => {
      unsubSongs();
      unsubBooks();
      unsubAlbums();
    };
  }, []);

  const filteredSongs = songs.filter(s => 
    (s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.artist.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filterType === 'all' || s.category === filterType)
  );

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlaySong = (song: any) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setActivePlaylist(filteredSongs);
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark pb-32">
      {/* Header */}
      <div className="relative h-[300px] overflow-hidden bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-green-600 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2000')] bg-cover bg-center mix-blend-overlay"></div>
        
        <div className="relative z-10 h-full flex flex-col justify-end p-8 max-w-7xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <LibraryIcon size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tighter">المكتبة الرقمية</h1>
            </div>
          </motion.div>

          <div className="flex gap-2 mb-6">
            <button 
              onClick={() => setActiveTab('music')}
              className={`px-6 py-2.5 rounded-full font-black text-sm transition-all flex items-center gap-2 ${activeTab === 'music' ? 'bg-white text-primary shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <Music size={18} />
              الأغاني
            </button>
            <button 
              onClick={() => setActiveTab('books')}
              className={`px-6 py-2.5 rounded-full font-black text-sm transition-all flex items-center gap-2 ${activeTab === 'books' ? 'bg-white text-primary shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              <BookOpen size={18} />
              المكتبة
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8 relative z-20">
        {/* Search & Stats */}
        <div className="bg-white dark:bg-card-dark rounded-3xl p-4 shadow-xl border border-border-light dark:border-border-dark flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="ابحث عن أغنية، فنان، أو كتاب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-surface-dark rounded-2xl border-none outline-none focus:ring-2 ring-primary/20 text-sm font-bold"
            />
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex -space-x-2">
               {[1,2,3].map(i => (
                 <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-card-dark bg-slate-200 overflow-hidden">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="" />
                 </div>
               ))}
             </div>
             <p className="text-[10px] font-black text-slate-500 uppercase">١.٢٤٠ شخص يستمعون الآن</p>
          </div>
        </div>

        <div className="mt-8">
          <AnimatePresence mode="wait">
            {activeTab === 'music' ? (
              <motion.div
                key="music-tab"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-10"
              >
                {/* Popular Albums */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black flex items-center gap-2">
                       <Disc className="text-primary" />
                       الألبومات الرسمية
                    </h2>
                    <button className="text-primary text-xs font-black uppercase hover:underline">عرض الكل</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {albums.map((album) => (
                      <motion.div 
                        key={album.id}
                        whileHover={{ y: -5 }}
                        className="group bg-white dark:bg-card-dark p-4 rounded-[32px] border border-border-light dark:border-border-dark shadow-premium hover:shadow-2xl transition-all"
                      >
                        <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative">
                          {album.coverUrl && album.coverUrl.trim() !== '' ? (
                            <img src={album.coverUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                              <Disc size={48} className="text-slate-300" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <button className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">
                               <Play fill="currentColor" size={24} />
                             </button>
                          </div>
                        </div>
                        <h3 className="font-black text-sm truncate">{album.title}</h3>
                        <p className="text-[10px] text-slate-400 font-bold">{album.artist} • {album.year}</p>
                      </motion.div>
                    ))}
                    {albums.length === 0 && (
                      <div className="col-span-full py-12 text-center bg-white dark:bg-card-dark rounded-3xl border-2 border-dashed border-slate-200 dark:border-border-dark">
                         <Music className="mx-auto text-slate-300 mb-2" size={48} />
                         <p className="text-slate-400 font-bold">لا توجد ألبومات مضافة حالياً</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* All Songs List */}
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black flex items-center gap-2">
                       <Headphones className="text-primary" />
                       الأغاني
                    </h2>
                    <div className="flex gap-2">
                      {['all', 'anthem', 'chant', 'song'].map(cat => (
                        <button 
                          key={cat}
                          onClick={() => setFilterType(cat)}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${filterType === cat ? 'bg-primary text-white' : 'bg-white dark:bg-card-dark text-slate-500 border border-border-light dark:border-border-dark'}`}
                        >
                          {cat === 'all' ? 'الكل' : cat === 'anthem' ? 'النشيد' : cat === 'chant' ? 'أهزوجة' : 'أغنية'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid gap-3">
                    {filteredSongs.map((song, index) => (
                      <motion.div 
                        key={song.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`group flex items-center gap-4 p-3 rounded-2xl border transition-all ${currentSong?.id === song.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white dark:bg-card-dark border-border-light dark:border-border-dark hover:shadow-lg'}`}
                      >
                         <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
                           {song.coverUrl && song.coverUrl.trim() !== '' ? (
                             <img src={song.coverUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                           ) : (
                             <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                               <Music size={24} className="text-slate-300" />
                             </div>
                           )}
                           <button 
                            onClick={() => handlePlaySong(song)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             {currentSong?.id === song.id && isPlaying ? <Pause fill="white" size={20} /> : <Play fill="white" size={20} />}
                           </button>
                         </div>
                         
                         <div className="flex-1 min-w-0">
                           <h4 className="text-xs font-black truncate">{song.title}</h4>
                           <p className="text-[10px] text-slate-400 font-bold truncate">{song.artist}</p>
                         </div>

                         <div className="flex items-center gap-6 px-4">
                            <div className="hidden md:flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                               <Clock size={12} />
                               {song.duration || '03:45'}
                            </div>
                            <div className="flex items-center gap-2">
                               <button className="p-2 text-slate-400 hover:text-primary transition-all">
                                 <Download size={16} />
                               </button>
                               <button className="p-2 text-slate-400 hover:text-yellow-500 transition-all">
                                 <Star size={16} />
                               </button>
                            </div>
                         </div>
                      </motion.div>
                    ))}
                    {filteredSongs.length === 0 && (
                       <p className="text-center py-10 text-slate-400 font-bold bg-white dark:bg-card-dark rounded-3xl border-2 border-dashed border-slate-200 dark:border-border-dark">لا توجد نتائج بحث مطابقة</p>
                    )}
                  </div>
                </section>
              </motion.div>
            ) : (
              <motion.div
                key="books-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
              >
                {filteredBooks.map((book) => (
                  <motion.div 
                    key={book.id}
                    whileHover={{ y: -10 }}
                    className="flex flex-col group"
                  >
                    <div className="aspect-[3/4] rounded-[32px] overflow-hidden shadow-premium group-hover:shadow-2xl transition-all relative mb-4">
                      {book.coverUrl && book.coverUrl.trim() !== '' ? (
                        <img src={book.coverUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <BookOpen size={48} className="text-slate-300" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity"></div>
                      
                      <div className="absolute inset-0 flex flex-col justify-end p-6 translate-y-4 group-hover:translate-y-0 transition-transform opacity-0 group-hover:opacity-100">
                        <p className="text-white/70 text-[10px] font-black uppercase mb-1">{book.category}</p>
                        <h3 className="text-white text-lg font-black leading-tight mb-4">{book.title}</h3>
                        <button 
                          onClick={() => setSelectedBook(book)}
                          className="w-full bg-white text-primary py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg"
                        >
                          <BookIcon size={18} />
                          اقرأ الآن
                        </button>
                      </div>
                    </div>
                    <div className="px-2">
                       <h3 className="font-black text-sm text-slate-800 dark:text-white truncate">{book.title}</h3>
                       <p className="text-[10px] text-slate-400 font-bold">{book.author}</p>
                    </div>
                  </motion.div>
                ))}
                {filteredBooks.length === 0 && (
                   <div className="col-span-full py-12 text-center bg-white dark:bg-card-dark rounded-3xl border-2 border-dashed border-slate-200 dark:border-border-dark">
                      <BookIcon className="mx-auto text-slate-300 mb-2" size={48} />
                      <p className="text-slate-400 font-bold">لا توجد كتب مضافة حالياً</p>
                   </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Book Reader Modal */}
      <AnimatePresence>
        {selectedBook && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 md:p-10"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl h-full bg-white dark:bg-card-dark rounded-[40px] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-border-light dark:border-border-dark flex items-center justify-between bg-white dark:bg-surface-dark">
                <div className="flex items-center gap-4">
                  {selectedBook.coverUrl && selectedBook.coverUrl.trim() !== '' ? (
                    <img src={selectedBook.coverUrl} className="w-12 h-12 rounded-xl object-cover shadow-sm" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shadow-sm">
                      <BookOpen size={20} className="text-slate-300" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-black text-lg">{selectedBook.title}</h3>
                    <p className="text-xs text-slate-400 font-bold">{selectedBook.author}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-background-dark rounded-xl text-xs font-black hover:bg-slate-200 transition-all">
                     <Download size={16} />
                     تحميل PDF
                   </button>
                   <button 
                    onClick={() => setSelectedBook(null)}
                    className="p-3 bg-slate-100 dark:bg-background-dark hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-500 hover:text-red-500 rounded-2xl transition-all"
                   >
                    <X size={20} />
                   </button>
                </div>
              </div>
              
              <div className="flex-1 bg-slate-900 relative">
                {selectedBook.pdfUrl.includes('drive.google.com') ? (
                  <iframe 
                    src={selectedBook.pdfUrl.replace('/view', '/preview')} 
                    className="w-full h-full border-none"
                    allow="autoplay"
                  />
                ) : (
                  <iframe 
                    src={selectedBook.pdfUrl} 
                    className="w-full h-full border-none"
                    title="book-reader"
                  />
                )}
              </div>
              
              <div className="p-6 bg-white dark:bg-surface-dark flex items-center justify-center gap-6">
                 <button className="p-3 hover:bg-slate-100 dark:hover:bg-card-dark rounded-full transition-all text-slate-400">
                    <Maximize2 size={20} />
                 </button>
                 <div className="h-6 w-[1px] bg-border-light dark:border-border-dark"></div>
                 <div className="flex items-center gap-4">
                   <button className="flex items-center gap-2 text-xs font-black text-primary hover:bg-primary/10 px-4 py-2 rounded-xl transition-all">
                     <Share2 size={16} />
                     مشاركة الكتاب
                   </button>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
