import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GoalCelebrationProps {
  show: boolean;
  onComplete: () => void;
  teamName: string;
  match?: {
    homeTeam: string;
    awayTeam: string;
    homeScore: string;
    awayScore: string;
    homeLogo?: string;
    awayLogo?: string;
  };
}

export default function GoalCelebration({ show, onComplete, teamName, match }: GoalCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Trigger confetti
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ 
            ...defaults, 
            particleCount, 
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['#10b981', '#ffffff', '#059669'] 
        });
        confetti({ 
            ...defaults, 
            particleCount, 
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#10b981', '#ffffff', '#059669'] 
        });
      }, 250);

      const timer = setTimeout(() => {
        onComplete();
      }, 6000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto"
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          
          <button 
            onClick={() => { setIsVisible(false); onComplete(); }}
            className="absolute top-8 right-8 z-50 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-xl rounded-full text-white border border-white/20 transition-all pointer-events-auto"
            title="إغلاق الاحتفال"
          >
            <X size={24} />
          </button>
          
          <motion.div
            initial={{ scale: 0.5, y: 100, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative flex flex-col items-center"
          >
            {/* Flare Background Image */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.6, scale: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="absolute -top-32 -left-32 w-64 h-64 rounded-full overflow-hidden blur-[2px] opacity-60 z-[-1] pointer-events-none hidden sm:block shadow-[0_0_50px_rgba(239,68,68,0.5)]"
            >
              <img 
                src="https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?q=80&w=600" 
                className="w-full h-full object-cover saturate-150 rotate-[-15deg]" 
                alt="flare"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            {/* Second Flare/Fan Image */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.6, scale: 1 }}
              transition={{ delay: 0.7, duration: 1 }}
              className="absolute -top-32 -right-32 w-64 h-64 rounded-full overflow-hidden blur-[1px] opacity-60 z-[-1] pointer-events-none hidden sm:block shadow-[0_0_50px_rgba(239,68,68,0.4)]"
            >
              <img 
                src="https://images.unsplash.com/photo-1521412644187-c49fa0b3334d?q=80&w=600" 
                className="w-full h-full object-cover saturate-150 rotate-[15deg]" 
                alt="fan flare"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-white p-6 rounded-full shadow-2xl mb-6 ring-8 ring-primary/20"
            >
              <Trophy size={80} className="text-primary fill-primary" />
            </motion.div>

            <div className="text-center">
              <motion.h1 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="text-7xl font-black text-white italic tracking-tighter drop-shadow-[0_10px_20px_rgba(16,185,129,0.5)]"
              >
                GOOOOAL!
              </motion.h1>
              <h2 className="text-3xl font-black text-white mt-4 uppercase drop-shadow-lg">
                سيد البلد سجل!
              </h2>
              
              {match && (
                <div className="flex items-center justify-center gap-4 sm:gap-6 mt-6 bg-black/60 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/20 shadow-2xl w-fit mx-auto">
                  <div className="flex flex-col items-center gap-1 min-w-[60px]">
                    <img src={match.homeLogo} className="w-10 h-10 object-contain drop-shadow-md" alt="" />
                    <span className="text-white/60 text-[9px] font-bold truncate max-w-[60px]">{match.homeTeam}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 px-2">
                    <span className="text-4xl font-black text-white tabular-nums drop-shadow-lg">
                      {match.homeScore}
                    </span>
                    <span className="text-2xl font-black text-white/40">:</span>
                    <span className="text-4xl font-black text-white tabular-nums drop-shadow-lg">
                      {match.awayScore}
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-1 min-w-[60px]">
                    <img src={match.awayLogo} className="w-10 h-10 object-contain drop-shadow-md" alt="" />
                    <span className="text-white/60 text-[9px] font-bold truncate max-w-[60px]">{match.awayTeam}</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
             <motion.div 
               animate={{ 
                 boxShadow: [
                   "0 0 0px 0px rgba(16,185,129,0)", 
                   "0 0 100px 50px rgba(16,185,129,0.3)", 
                   "0 0 0px 0px rgba(16,185,129,0)"
                 ] 
               }}
               transition={{ repeat: Infinity, duration: 1.5 }}
               className="w-1 h-1 rounded-full"
             />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
