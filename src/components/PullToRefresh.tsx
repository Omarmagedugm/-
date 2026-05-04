import React, { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, PanInfo } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

const PULL_THRESHOLD = 80;

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const controls = useAnimation();
  const containerRef = useRef<HTMLDivElement>(null);

  const onPan = (_: any, info: PanInfo) => {
    if (window.scrollY > 0 || isRefreshing) return;
    
    const y = Math.max(0, info.offset.y);
    const progress = Math.min(y / PULL_THRESHOLD, 1.5);
    setPullProgress(progress);
    
    controls.set({ y: y * 0.4 });
  };

  const onPanEnd = async (_: any, info: PanInfo) => {
    if (window.scrollY > 0 || isRefreshing) return;

    if (info.offset.y >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullProgress(1);
      controls.start({ y: 60 });
      await onRefresh();
      setIsRefreshing(false);
      setPullProgress(0);
      controls.start({ y: 0 });
    } else {
      setPullProgress(0);
      controls.start({ y: 0 });
    }
  };

  return (
    <div className="relative w-full h-full">
      <motion.div
        className="absolute top-0 left-0 right-0 flex justify-center py-4 pointer-events-none z-50"
        animate={{ 
          opacity: pullProgress > 0 || isRefreshing ? 1 : 0,
          y: isRefreshing ? 20 : (pullProgress * 20 - 10)
        }}
      >
        <motion.div 
          animate={isRefreshing ? { rotate: 360 } : { rotate: pullProgress * 360 }}
          transition={isRefreshing ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
          className={`p-2 rounded-full shadow-lg ${isRefreshing ? 'bg-primary text-white' : 'bg-white dark:bg-card-dark text-primary border border-border-light dark:border-border-dark'}`}
        >
          <RefreshCw size={20} className={isRefreshing ? 'animate-spin-slow' : ''} />
        </motion.div>
      </motion.div>

      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.6}
        onPan={onPan}
        onPanEnd={onPanEnd}
        animate={controls}
        className="relative w-full h-full touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
