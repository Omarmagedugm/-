import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  X,
  Maximize2,
  ChevronUp,
  ChevronDown,
  Repeat,
  Shuffle,
  Music
} from 'lucide-react';
import { useAppStore } from '../store';

export default function MusicPlayer() {
  const { currentSong, isPlaying, setIsPlaying, setCurrentSong, activePlaylist } = useAppStore();
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleNext = () => {
    if (!activePlaylist.length || !currentSong) return;
    const currentIndex = activePlaylist.findIndex(s => s.id === currentSong.id);
    const nextIndex = (currentIndex + 1) % activePlaylist.length;
    setCurrentSong(activePlaylist[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    if (!activePlaylist.length || !currentSong) return;
    const currentIndex = activePlaylist.findIndex(s => s.id === currentSong.id);
    const prevIndex = (currentIndex - 1 + activePlaylist.length) % activePlaylist.length;
    setCurrentSong(activePlaylist[prevIndex]);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current && currentSong?.audioUrl) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.warn("Playback prevented or failed:", e);
          setIsPlaying(false);
          if (e.name === 'NotAllowedError') {
            setError("التشغيل التلقائي محظور. يرجى الضغط على زر التشغيل يدوياً.");
          }
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    setError(null);
  }, [currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  if (!currentSong) return null;

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const p = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = (p / 100) * audioRef.current.duration;
      setProgress(p);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-24 left-4 right-4 z-[90] h-20"
      >
        <div className="w-full h-full bg-white/95 dark:bg-card-dark/95 backdrop-blur-md rounded-[32px] border border-border-light dark:border-border-dark shadow-2xl overflow-hidden shadow-primary/20 flex flex-col">
          
          <audio 
            ref={audioRef}
            src={currentSong.audioUrl || undefined}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleNext}
            onError={(e) => {
              const audio = e.currentTarget;
              const error = audio.error;
              let errorMessage = "حدث خطأ أثناء تحميل الملف الصوتي";
              
              if (error) {
                switch (error.code) {
                  case 1: errorMessage = "تم إيقاف التحميل"; break;
                  case 2: errorMessage = "خطأ في الشبكة - تأكد من اتصالك"; break;
                  case 3: errorMessage = "خطأ في معالجة الملف الصوتي"; break;
                  case 4: errorMessage = "رابط غير صالح أو صيغة غير مدعومة"; break;
                }
              }
              
              setError(errorMessage);
              console.error(`Audio error (${error?.code || 'N/A'}): ${errorMessage}`, {
                url: currentSong.audioUrl,
                title: currentSong.title
              });
              setIsPlaying(false);
            }}
          />

          <div className="flex-1 flex items-center justify-between px-4 gap-4">
            {/* Song Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-lg">
                {currentSong.coverUrl && currentSong.coverUrl.trim() !== '' ? (
                  <img src={currentSong.coverUrl} className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`} referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-slate-100 dark:bg-surface-dark flex items-center justify-center">
                    <Music className="text-slate-400" size={20} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-[11px] md:text-sm font-black truncate">{error || currentSong.title}</h4>
                <p className={`text-[9px] md:text-xs font-bold truncate ${error ? 'text-red-500' : 'text-slate-400'}`}>
                  {error ? 'خطأ في التشغيل' : currentSong.artist}
                </p>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
               <button 
                onClick={handlePrevious}
                className="p-2 text-slate-400 hover:text-primary transition-all active:scale-90"
               >
                  <SkipBack size={18} fill="currentColor" />
               </button>
               <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg transform active:scale-90 transition-all hover:scale-105"
               >
                 {isPlaying ? <Pause fill="white" size={18} /> : <Play fill="white" size={18} className="ml-0.5" />}
               </button>
               <button 
                onClick={handleNext}
                className="p-2 text-slate-400 hover:text-primary transition-all active:scale-90"
               >
                  <SkipForward size={18} fill="currentColor" />
               </button>
            </div>

            {/* Volume & Close */}
            <div className="flex items-center gap-1 md:gap-3 flex-1 justify-end">
               <div className="hidden md:flex items-center gap-2 max-w-[100px]">
                 <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-primary transition-colors">
                   {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                 </button>
                 <input 
                   type="range" 
                   min="0" 
                   max="1" 
                   step="0.01"
                   value={isMuted ? 0 : volume}
                   onChange={(e) => setVolume(parseFloat(e.target.value))}
                   className="w-16 h-1 bg-slate-100 dark:bg-surface-dark rounded-full appearance-none cursor-pointer accent-primary"
                 />
               </div>
               <button 
                onClick={() => setCurrentSong(null)}
                className="p-2 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
               >
                  <X size={18} />
               </button>
            </div>
          </div>

          {/* Progress Slider (Bottom of Bar) */}
          <div className="relative h-1 w-full px-4 mb-2">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress}
              onChange={handleProgressChange}
              className="absolute inset-x-4 h-1 bg-slate-100 dark:bg-surface-dark rounded-full appearance-none cursor-pointer accent-primary z-10 opacity-0 hover:opacity-100 transition-opacity"
            />
            <div className="h-1 bg-slate-100 dark:bg-surface-dark rounded-full overflow-hidden">
               <div 
                className="h-full bg-primary transition-all duration-300" 
                style={{ width: `${progress}%` }}
               />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
