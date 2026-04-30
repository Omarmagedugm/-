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
  const { currentSong, isPlaying, setIsPlaying, setCurrentSong } = useAppStore();
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current && currentSong?.audioUrl) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.warn("Playback prevented or failed:", e);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

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
        className={`fixed bottom-24 left-4 right-4 z-[90] transition-all duration-500 ease-in-out ${showFullPlayer ? 'bottom-4 h-[calc(100vh-32px)] md:h-[600px] md:max-w-4xl md:left-1/2 md:-translate-x-1/2' : 'h-20'}`}
      >
        <div className={`w-full h-full bg-white dark:bg-card-dark rounded-[32px] border border-border-light dark:border-border-dark shadow-2xl overflow-hidden shadow-primary/20 flex flex-col transition-all duration-500`}>
          
          <audio 
            ref={audioRef}
            src={currentSong.audioUrl || undefined}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onError={() => {
              console.error("Audio error occurred");
              setIsPlaying(false);
            }}
          />

          {/* Mini Player View */}
          <div className={`p-3 flex items-center gap-4 ${showFullPlayer ? 'hidden' : 'flex'}`}>
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 group cursor-pointer" onClick={() => setShowFullPlayer(true)}>
              {currentSong.coverUrl && currentSong.coverUrl.trim() !== '' ? (
                <img src={currentSong.coverUrl} className={`w-full h-full object-cover transition-transform ${isPlaying ? 'animate-spin-slow' : ''}`} referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-slate-100 dark:bg-surface-dark flex items-center justify-center">
                  <Music className="text-slate-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronUp size={24} />
              </div>
            </div>

            <div className="flex-1 min-w-0" onClick={() => setShowFullPlayer(true)}>
              <h4 className="text-xs font-black truncate">{currentSong.title}</h4>
              <p className="text-[10px] text-slate-400 font-bold truncate">{currentSong.artist}</p>
            </div>

            <div className="flex items-center gap-1 md:gap-4 px-2">
               <button className="hidden sm:block p-2 text-slate-400 hover:text-primary transition-all">
                  <SkipBack size={18} />
               </button>
               <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg transform active:scale-90 transition-all"
               >
                 {isPlaying ? <Pause fill="white" size={20} /> : <Play fill="white" size={20} className="ml-1" />}
               </button>
               <button className="hidden sm:block p-2 text-slate-400 hover:text-primary transition-all">
                  <SkipForward size={18} />
               </button>
               <button 
                onClick={() => setCurrentSong(null)}
                className="p-2 text-slate-300 hover:text-red-500 transition-all ml-2"
               >
                  <X size={18} />
               </button>
            </div>

            {/* Progress Bar (Mini) */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-surface-dark overflow-hidden">
               <div 
                className="h-full bg-primary transition-all duration-300" 
                style={{ width: `${progress}%` }}
               />
            </div>
          </div>

          {/* Full Player View */}
          <div className={`${showFullPlayer ? 'flex' : 'hidden'} flex-col h-full bg-gradient-to-b from-primary/10 to-transparent`}>
            {/* Header */}
            <div className="p-6 flex items-center justify-between">
              <button 
                onClick={() => setShowFullPlayer(false)}
                className="p-2 bg-slate-100 dark:bg-surface-dark rounded-xl text-slate-500"
              >
                <ChevronDown size={24} />
              </button>
              <h3 className="font-black text-sm uppercase tracking-widest text-primary">Now Playing</h3>
              <button className="p-2 bg-slate-100 dark:bg-surface-dark rounded-xl text-slate-500">
                <Maximize2 size={20} />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
               <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-64 h-64 md:w-80 md:h-80 mb-10"
               >
                 <div className={`absolute -inset-4 bg-primary/20 rounded-full blur-3xl transition-all duration-1000 ${isPlaying ? 'scale-125 opacity-60' : 'scale-100 opacity-0'}`} />
                  <div className="w-full h-full rounded-[48px] overflow-hidden shadow-2xl relative z-10 p-1 bg-white dark:bg-surface-dark ring-4 ring-white/20">
                    {currentSong.coverUrl && currentSong.coverUrl.trim() !== '' ? (
                      <img src={currentSong.coverUrl} className={`w-full h-full object-cover rounded-[44px] ${isPlaying ? 'animate-spin-slow' : ''}`} referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 dark:bg-surface-dark flex items-center justify-center rounded-[44px]">
                        <Music className="text-slate-400" size={64} />
                      </div>
                    )}
                  </div>
               </motion.div>

               <div className="mb-10 w-full max-w-md">
                 <h2 className="text-2xl font-black mb-2 tracking-tighter">{currentSong.title}</h2>
                 <p className="text-slate-400 font-bold">{currentSong.artist}</p>
               </div>

               {/* Controls */}
               <div className="w-full max-w-md space-y-8">
                 <div className="space-y-2">
                   <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={progress}
                    onChange={handleProgressChange}
                    className="w-full h-1.5 bg-slate-200 dark:bg-surface-dark rounded-lg appearance-none cursor-pointer accent-primary"
                   />
                   <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                     <span>0:45</span>
                     <span>3:12</span>
                   </div>
                 </div>

                 <div className="flex items-center justify-center gap-10">
                    <button className="text-slate-300 hover:text-primary transition-all">
                      <Shuffle size={20} />
                    </button>
                    <button className="text-slate-500 hover:text-primary hover:scale-110 transition-all transform active:scale-90">
                      <SkipBack size={32} />
                    </button>
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all"
                    >
                      {isPlaying ? <Pause fill="white" size={36} /> : <Play fill="white" size={36} className="ml-1" />}
                    </button>
                    <button className="text-slate-500 hover:text-primary hover:scale-110 transition-all transform active:scale-90">
                      <SkipForward size={32} />
                    </button>
                    <button className="text-slate-300 hover:text-primary transition-all">
                      <Repeat size={20} />
                    </button>
                 </div>

                 <div className="flex items-center gap-4 px-10">
                    <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400">
                      {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="flex-1 h-1 bg-slate-200 dark:bg-surface-dark rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                 </div>
               </div>
            </div>

            <div className="p-8 border-t border-border-light dark:border-border-dark flex items-center justify-center gap-4">
               <button className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-primary transition-all">
                  <Music size={14} />
                  Up Next: أغنية مئوية الاتحاد
               </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
