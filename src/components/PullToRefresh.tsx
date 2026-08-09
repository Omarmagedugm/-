import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void> | void;
}

export default function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReadyToRelease, setIsReadyToRelease] = useState(false);

  const startYRef = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);
  const PULL_THRESHOLD = 70; // px needed to trigger refresh
  const MAX_PULL = 110; // max visual pull px

  useEffect(() => {
    let startY = 0;
    let currentY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      // Only initiate pull-to-refresh if page is scrolled at the top
      if (window.scrollY <= 0) {
        startY = e.touches[0].clientY;
        startYRef.current = startY;
        isPullingRef.current = true;
      } else {
        isPullingRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshing) return;

      currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;

      // Only pull if swiping DOWN at top of page
      if (deltaY > 0 && window.scrollY <= 0) {
        // Resistance formula for natural spring feel
        const distance = Math.min(Math.pow(deltaY, 0.82) * 2.2, MAX_PULL);
        setPullDistance(distance);
        setIsReadyToRelease(distance >= PULL_THRESHOLD);

        // Prevent native bounce/scroll when pulling down at top
        if (distance > 10 && e.cancelable) {
          e.preventDefault();
        }
      } else {
        setPullDistance(0);
        setIsReadyToRelease(false);
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingRef.current || isRefreshing) return;
      isPullingRef.current = false;

      if (pullDistance >= PULL_THRESHOLD) {
        setIsRefreshing(true);
        setPullDistance(55); // Hold at spinner position

        // Trigger vibration feedback if available
        if ('vibrate' in navigator) {
          try {
            navigator.vibrate(20);
          } catch (_) {}
        }

        try {
          if (onRefresh) {
            await onRefresh();
          } else {
            // Default refresh effect
            await new Promise((resolve) => setTimeout(resolve, 800));
          }
          toast.success('تم تحديث البيانات بنجاح 🟢', { id: 'pull-refresh-toast' });
        } catch (err) {
          console.error('Error during refresh:', err);
          toast.error('حدث خطأ أثناء التحديث');
        } finally {
          setIsRefreshing(false);
          setPullDistance(0);
          setIsReadyToRelease(false);
        }
      } else {
        setPullDistance(0);
        setIsReadyToRelease(false);
      }
    };

    const options = { passive: false };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, options);
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, isRefreshing, onRefresh]);

  return (
    <div className="relative min-h-screen">
      {/* Pull To Refresh Top Indicator Bar */}
      <div 
        className="fixed top-14 left-0 right-0 z-40 flex items-center justify-center pointer-events-none transition-all duration-150 ease-out"
        style={{
          transform: `translateY(${isRefreshing ? 14 : pullDistance > 0 ? pullDistance - 40 : -50}px)`,
          opacity: pullDistance > 0 || isRefreshing ? 1 : 0
        }}
      >
        <div className="bg-white/90 dark:bg-card-dark/90 backdrop-blur-md border border-border-light/60 dark:border-border-dark/60 shadow-xl rounded-full p-2 flex items-center justify-center">
          <div className={`p-2 rounded-full transition-all duration-200 ${isReadyToRelease || isRefreshing ? 'bg-primary text-white scale-110 shadow-md shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
            {isRefreshing ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <ArrowDown 
                size={18} 
                className={`transition-transform duration-200 ${isReadyToRelease ? 'rotate-180 text-white' : ''}`} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Main App Content Wrapper */}
      <div 
        style={{
          transform: pullDistance > 0 ? `translateY(${Math.min(pullDistance * 0.4, 35)}px)` : undefined,
          transition: isPullingRef.current ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        {children}
      </div>
    </div>
  );
}
