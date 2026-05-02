import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { auth } from '../lib/firebase';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { 
  Menu, 
  LayoutDashboard, 
  Flag, 
  Info, 
  ShieldCheck, 
  Mail, 
  Edit2, 
  Bell, 
  Search, 
  Settings,
  CloudSun,
  Cloud,
  CloudMoon,
  Moon,
  MapPin,
  Sunrise,
  Sunset,
  Thermometer,
  Trophy,
  CloudRain,
  Sun,
  Snowflake,
  Activity,
  BarChart2,
  Dribbble
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import AdvertiseWidget from '../components/AdvertiseWidget';
import HtmlWidget from '../components/HtmlWidget';

export default function Home() {
  const { news, media, matches, liveStream, profile, homeSections, cityInfo, ads } = useAppStore();
  const [tick, setTick] = useState(0);
  const [selectedSport, setSelectedSport] = useState<'football' | 'basketball'>('football');
  const [autoWeather, setAutoWeather] = useState<{ temp: string, condition: string, sunrise: string, sunset: string, isDay?: boolean } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const citySection = homeSections.find(s => s.type === 'city' || s.id === 'city');
    if (citySection?.active && (!cityInfo || cityInfo.active !== false)) {
      fetch('https://api.open-meteo.com/v1/forecast?latitude=31.2001&longitude=29.9187&current_weather=true&daily=sunrise,sunset&timezone=Africa%2FCairo&forecast_days=1')
        .then(async r => {
          if (!r.ok) {
            throw new Error(`Weather API responded with status: ${r.status}`);
          }
          return r.json();
        })
        .then(data => {
          if (!data || !data.current_weather || !data.daily || !data.daily.sunrise || !data.daily.sunset) return;
          
          const weatherCodeToText = (code: number) => {
             if (code === 0) return 'sunny';
             if (code === 1) return 'mostly_sunny';
             if (code === 2) return 'partly_cloudy';
             if (code === 3) return 'cloudy';
             if (code === 45 || code === 48) return 'foggy';
             if (code >= 51 && code <= 55) return 'drizzle';
             if (code >= 61 && code <= 65) return 'rainy';
             if (code >= 71 && code <= 75) return 'snowy';
             if (code >= 80 && code <= 82) return 'showers';
             if (code >= 95) return 'thunderstorm';
             return 'cloudy';
          };

          const formatTime = (timeStr: string) => {
             try {
               if (!timeStr) return '--:--';
               const date = new Date(timeStr);
               if (isNaN(date.getTime())) return '--:--';
               let hours = date.getHours();
               const mins = date.getMinutes().toString().padStart(2, '0');
               const ampm = hours >= 12 ? 'PM' : 'AM';
               hours = hours % 12;
               hours = hours ? hours : 12;
               return `${hours}:${mins} ${ampm}`;
             } catch (e) {
               return '--:--';
             }
          };

          setAutoWeather({
             temp: Math.round(data.current_weather.temperature ?? 25).toString(),
             condition: weatherCodeToText(data.current_weather.weathercode ?? 0),
             sunrise: formatTime(data.daily.sunrise[0]),
             sunset: formatTime(data.daily.sunset[0]),
             isDay: data.current_weather.is_day === 1
          });
        })
        .catch(err => {
          console.warn('Weather fetch suppressed:', err.message);
        });
    }
  }, [homeSections, cityInfo?.active]);

  const calculateCurrentMinute = (match: any) => {
    if (!match.isTimerRunning || !match.timerStartTime) return Number(match.timerBaseMinute || 0);
    const start = new Date(match.timerStartTime).getTime();
    if (isNaN(start)) return Number(match.timerBaseMinute || 0);
    const elapsed = Math.max(0, Math.floor((new Date().getTime() - start) / 60000));
    return Number(match.timerBaseMinute || 0) + elapsed;
  };
  
  const recentNews = news.slice(0, 5);
  const recentMedia = media.slice(0, 5);
  
  const sportMatches = matches.filter(m => m.sport === selectedSport || (!m.sport && selectedSport === 'football'));
  const liveMatch = sportMatches.find(m => m.status === 'live');
  const heroMatch = liveMatch || sportMatches.find(m => m.status === 'upcoming') || sportMatches[0];
  const upcomingMatches = sportMatches.filter(m => m.status === 'upcoming').slice(0, 3);
  
  // High-level admin check
  const isOmar = auth.currentUser?.email === 'omarmagedugm@ittihad.club';
  const isDev = auth.currentUser?.email === 'copyrightofficialco@gmail.com';
  const isAdmin = profile.role === 'admin' || isOmar || isDev;

  let timeLeft = { d: 0, h: 0, m: 0, s: 0 };
  let isUpcoming = false;
  if (heroMatch?.status === 'upcoming' && heroMatch.date) {
    const diff = new Date(heroMatch.date).getTime() - new Date().getTime();
    if (diff > 0) {
      isUpcoming = true;
      timeLeft = {
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60)
      };
    }
  }

  const renderSection = (section: any) => {
    if (!section.active) return null;

    switch (section.type === 'custom' && section.id === 'city' ? 'city' : section.type) {
      case 'hero':
        if (!heroMatch) return (
           <motion.section key={section.id} variants={itemVariants} className="space-y-4">
             <div className="relative bg-slate-50 dark:bg-surface-dark p-12 rounded-[40px] flex flex-col items-center justify-center text-center gap-3 border border-dashed border-slate-300 dark:border-border-dark shadow-sm">
               <div className="absolute top-4 right-4 z-50 flex gap-1 bg-white dark:bg-card-dark p-1 rounded-2xl shadow-sm border border-border-light dark:border-border-dark">
                  <button 
                    onClick={() => setSelectedSport('football')} 
                    className={`p-1.5 rounded-xl transition-all ${selectedSport === 'football' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-dark'}`}
                  >
                    <Trophy size={12} />
                  </button>
                  <button 
                    onClick={() => setSelectedSport('basketball')} 
                    className={`p-1.5 rounded-xl transition-all ${selectedSport === 'basketball' ? 'bg-[#ea580c] text-white shadow-md' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-dark'}`}
                  >
                    <Dribbble size={12} />
                  </button>
               </div>
               {selectedSport === 'football' ? <Trophy size={48} className="text-slate-300 dark:text-slate-600" /> : <Dribbble size={48} className="text-slate-300 dark:text-slate-600" />}
               <p className="text-[11px] font-black text-slate-500">لا توجد مباريات {selectedSport === 'football' ? 'كرة قدم' : 'كرة سلة'} حالياً</p>
             </div>
           </motion.section>
        );
        return (
          <motion.section key={section.id} variants={itemVariants} className="relative group space-y-4">
            <div className="relative">
              {isAdmin && (
                <button 
                  onClick={() => navigate('/admin', { state: { editCategory: 'matches', editId: heroMatch.id } })}
                  className="absolute -top-2 -right-2 z-50 p-2.5 bg-accent text-white rounded-2xl shadow-premium shadow-accent/20 pressable"
                >
                  <Edit2 size={16} />
                </button>
              )}
              
              <div className={`relative overflow-hidden rounded-[40px] shadow-2xl cinematic-glow ${selectedSport === 'basketball' ? 'bg-gradient-to-br from-orange-600 via-orange-900 to-slate-900 border border-orange-500/30' : 'stadium-gradient'}`}>
                <div className={`absolute inset-0 opacity-20 mix-blend-overlay ${selectedSport === 'basketball' ? 'bg-[url("https://www.transparenttextures.com/patterns/carbon-fibre.png")]' : 'bg-[url("https://www.transparenttextures.com/patterns/stardust.png")]'}`}></div>
                
                <div className="relative p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className={`text-[10px] font-black text-white px-2.5 py-1.5 rounded-lg backdrop-blur-md border border-white/10 tracking-tighter ${selectedSport === 'basketball' ? 'bg-orange-500/20' : 'bg-accent/20'}`}>
                      {heroMatch.competition}
                    </div>

                    {isUpcoming && (
                      <div className="flex items-center gap-1 sm:gap-1.5 text-white dir-ltr" dir="ltr">
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-black/30 rounded flex items-center justify-center border border-white/10 text-[10px] sm:text-xs font-mono font-black tabular-nums backdrop-blur-md">{timeLeft.d}</div>
                          <span className="text-[7px] sm:text-[8px] opacity-70 leading-none tracking-widest font-bold">يوم</span>
                        </div>
                        <span className="text-white/30 text-[10px] mb-3 font-bold">:</span>
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-black/30 rounded flex items-center justify-center border border-white/10 text-[10px] sm:text-xs font-mono font-black tabular-nums backdrop-blur-md">{timeLeft.h.toString().padStart(2, '0')}</div>
                          <span className="text-[7px] sm:text-[8px] opacity-70 leading-none tracking-widest font-bold">ساعة</span>
                        </div>
                        <span className="text-white/30 text-[10px] mb-3 font-bold">:</span>
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-black/30 rounded flex items-center justify-center border border-white/10 text-[10px] sm:text-xs font-mono font-black tabular-nums backdrop-blur-md">{timeLeft.m.toString().padStart(2, '0')}</div>
                          <span className="text-[7px] sm:text-[8px] opacity-70 leading-none tracking-widest font-bold">دقيقة</span>
                        </div>
                        <span className="text-white/30 text-[10px] mb-3 font-bold">:</span>
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-black/30 rounded flex items-center justify-center border border-white/10 text-[10px] sm:text-xs font-mono font-black tabular-nums backdrop-blur-md text-accent">{timeLeft.s.toString().padStart(2, '0')}</div>
                          <span className="text-[7px] sm:text-[8px] opacity-70 leading-none tracking-widest font-bold">ثانية</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-1 bg-black/20 backdrop-blur-md p-1 rounded-xl shadow-sm border border-white/10">
                      <button 
                        onClick={() => setSelectedSport('football')} 
                        className={`p-1.5 rounded-lg transition-all ${selectedSport === 'football' ? 'bg-primary text-white shadow-md' : 'text-white/50 hover:bg-white/10 hover:text-white'}`}
                      >
                        <Trophy size={14} className="sm:w-4 sm:h-4" />
                      </button>
                      <button 
                        onClick={() => setSelectedSport('basketball')} 
                        className={`p-1.5 rounded-lg transition-all ${selectedSport === 'basketball' ? 'bg-[#ea580c] text-white shadow-md' : 'text-white/50 hover:bg-white/10 hover:text-white'}`}
                      >
                        <Dribbble size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between sm:justify-center items-center gap-1 sm:gap-6 py-4 sm:py-6 px-1 sm:px-4">
                    <div className="flex flex-col items-center gap-2 sm:gap-5 w-[80px] sm:w-44 group/team shrink-0 z-10">
                      <div className={`relative flex items-center justify-center rounded-[24px] sm:rounded-[44px] bg-white/10 p-2.5 sm:p-5 ring-1 ring-white/20 backdrop-blur-xl shadow-premium ${heroMatch.status === 'upcoming' ? 'h-20 w-20 sm:h-40 sm:w-40' : 'h-16 w-16 sm:h-32 sm:w-32'}`}>
                        <img alt={heroMatch.homeTeam} className="w-full h-full object-contain filter drop-shadow-2xl" src={heroMatch.homeLogo || undefined} referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-center text-[10px] sm:text-[14px] font-black text-white uppercase tracking-wider line-clamp-2 w-full">{heroMatch.homeTeam}</span>
                    </div>
                    
                    <div className="flex flex-col items-center flex-1 px-1 sm:px-4 z-10 min-w-0">
                      <div className={`font-black text-white filter flex flex-col items-center w-full ${selectedSport === 'basketball' ? 'drop-shadow-[0_5px_15px_rgba(234,88,12,0.3)]' : 'drop-shadow-[0_5px_15px_rgba(46,204,113,0.3)]'}`}>
                        {heroMatch.status === 'upcoming' ? (
                          <div className="flex flex-col items-center w-full justify-center gap-1 sm:gap-2">
                            <div className="text-xl sm:text-3xl opacity-60">VS</div>
                            <div className="w-fit mx-auto text-center font-bold text-white/90 bg-black/40 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-xl border border-white/10 whitespace-nowrap" style={{ fontSize: "clamp(10px, 2.5vw, 13px)" }}>
                              {heroMatch.date && !isNaN(new Date(heroMatch.date).getTime()) ? format(new Date(heroMatch.date), 'EEEE d MMMM | p', { locale: ar }) : 'غير محدد'}
                            </div>
                          </div>
                        ) : (
                          <div className={`flex items-center justify-center gap-2 sm:gap-4 tracking-widest tabular-nums ${String(heroMatch.homeScore).length > 2 || String(heroMatch.awayScore).length > 2 ? 'text-4xl sm:text-7xl' : 'text-5xl sm:text-8xl'}`}>
                            <span>{heroMatch.homeScore}</span>
                            <span className={selectedSport === 'basketball' ? 'text-orange-400' : 'text-accent'}>:</span>
                            <span>{heroMatch.awayScore}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 sm:mt-5 flex flex-col items-center gap-1.5 sm:gap-3">
                        {heroMatch.status === 'live' ? (
                          <>
                            <div className="flex items-center gap-1.5 sm:gap-2.5 rounded-full bg-red-600 px-3 py-1.5 text-[9px] sm:text-[11px] font-black text-white shadow-glow">
                              <div className="relative h-2 w-2 sm:h-2.5 sm:w-2.5">
                                <div className="animate-ping absolute h-full w-full rounded-full bg-white opacity-75"></div>
                                <div className="relative rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-white"></div>
                              </div>
                              بث مباشر
                            </div>
                            <div className="px-3 py-1 bg-white/10 rounded-full text-[9px] sm:text-[11px] font-black text-white backdrop-blur-md border border-white/10">
                              {calculateCurrentMinute(heroMatch)}'
                            </div>
                          </>
                        ) : heroMatch.status === 'finished' ? (
                          <div className="flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-md px-3 sm:px-4 py-1 sm:py-1.5 text-[9px] sm:text-[11px] font-black text-white ring-1 ring-white/10 uppercase tracking-tighter text-center">
                            انتهت
                          </div>
                        ) : null}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2 sm:gap-5 w-[80px] sm:w-44 group/team shrink-0 z-10">
                      <div className={`relative flex items-center justify-center rounded-[24px] sm:rounded-[44px] bg-white/10 p-2.5 sm:p-5 ring-1 ring-white/20 backdrop-blur-xl shadow-premium ${heroMatch.status === 'upcoming' ? 'h-20 w-20 sm:h-40 sm:w-40' : 'h-16 w-16 sm:h-32 sm:w-32'}`}>
                        <img alt={heroMatch.awayTeam} className="w-full h-full object-contain filter drop-shadow-2xl" src={heroMatch.awayLogo || undefined} referrerPolicy="no-referrer" />
                      </div>
                      <span className="text-center text-[10px] sm:text-[14px] font-black text-white uppercase tracking-wider line-clamp-2 w-full">{heroMatch.awayTeam}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-2 gap-3 relative z-20">
                    <Link 
                      to={heroMatch.status === 'live' || liveStream.isActive ? "/live" : "/matches"} 
                      className="h-14 rounded-2xl bg-white text-primary-dark hover:bg-primary-light hover:text-white transition-all duration-300 font-black text-[11px] flex items-center justify-center gap-2 shadow-premium group/btn relative z-30 cursor-pointer"
                    >
                      <span className="material-symbols-outlined !text-[20px] group-hover/btn:translate-x-1 transition-transform">
                        {heroMatch.status === 'live' || liveStream.isActive ? 'sensors' : 'event'}
                      </span>
                      {heroMatch.status === 'live' || liveStream.isActive ? 'دخول البث' : 'التفاصيل'}
                    </Link>

                    {heroMatch.status === 'upcoming' ? (
                      <Link 
                        to="/fan-zone" 
                        state={{ activeTab: 'predictions' }}
                        className={`h-14 rounded-2xl text-white transition-all duration-300 font-black text-[11px] flex items-center justify-center gap-2 shadow-premium animate-pulse relative z-30 cursor-pointer ${selectedSport === 'basketball' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-accent hover:bg-accent-dark'}`}
                      >
                        <span className="material-symbols-outlined !text-[20px]">stadium</span>
                        توقع النتيجة
                      </Link>
                    ) : (
                      <Link 
                        to="/media" 
                        className="h-14 rounded-2xl bg-[#EAB308] text-white hover:bg-[#CA8A04] transition-all duration-300 font-black text-[11px] flex items-center justify-center gap-2 shadow-premium relative z-30 cursor-pointer"
                      >
                        <span className="material-symbols-outlined !text-[20px]">movie</span>
                        ملخص المباراة
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        );

      case 'live':
        if (!liveStream.isActive) return null;
        return (
          <motion.section key={section.id} variants={itemVariants} className="relative z-20">
            <Link to="/live" className="flex items-center justify-between p-4 rounded-[32px] bg-accent/10 border border-accent/20 cinematic-glow pressable relative z-30 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-accent flex items-center justify-center text-white shadow-glow animate-pulse">
                  <span className="material-symbols-outlined font-variation-settings-fill">broadcast_on_home</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-800 dark:text-white">بث مباشر متاح الآن</span>
                  <span className="text-[10px] font-bold text-accent">اضغط للمتابعة الفورية</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-white dark:bg-surface-dark flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined rotate-180">arrow_back</span>
              </div>
            </Link>
          </motion.section>
        );

      case 'custom':
        return (
          <motion.section key={section.id} variants={itemVariants}>
            <Link to="/fan-zone" className="block relative overflow-hidden rounded-[40px] bg-slate-900 shadow-2xl group cinematic-glow border border-white/5">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-110 transition-transform duration-1000"></div>
              <div className="absolute inset-0 stadium-gradient mix-blend-multiply opacity-60"></div>
              <div className="absolute inset-0 bg-gradient-to-l from-slate-900/90 via-slate-900/40 to-transparent"></div>
              
              <div className="relative p-7 flex flex-col items-start gap-2">
                <div className="flex items-center gap-2 rounded-full bg-primary/20 backdrop-blur-md px-3 py-1 border border-primary/30">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse shadow-glow"></div>
                  <span className="text-[9px] font-black text-accent uppercase tracking-widest">{section.title || 'Fan Community Hub'}</span>
                </div>
                <h3 className="text-2xl font-black text-white leading-tight">منطقة المشجعين</h3>
                <p className="text-[10px] text-slate-300 font-bold max-w-[200px] leading-relaxed mt-1">ساهم في النقاشات، توقع نتائج المباريات، وكن المشجع المثالي لزعيم الثغر.</p>
                <div className="mt-6 h-11 px-6 bg-white text-primary-dark rounded-2xl text-[11px] font-black shadow-2xl flex items-center justify-center gap-2 group/cta hover:bg-primary-light hover:text-white transition-all">
                  دخول Fan Zone
                  <span className="material-symbols-outlined !text-sm group-hover:translate-x-1 transition-transform">forum</span>
                </div>
              </div>
            </Link>
          </motion.section>
        );

      case 'news':
        return (
          <motion.section key={section.id} variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex flex-col">
                <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none">{section.title || 'آخر الأخبار'}</h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Latest Club Updates</span>
              </div>
              <Link to="/news" className="h-8 px-4 rounded-xl glass-card flex items-center justify-center text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all">
                عرض الكل
              </Link>
            </div>
            
            <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-1 -mx-4 px-4">
              {recentNews.map((item) => (
                <motion.div 
                  key={item.id}
                  className="flex-shrink-0 w-[280px] snap-center group"
                  whileTap={{ scale: 0.98 }}
                >
                  <Link to={`/news/${item.id}`} className="block relative overflow-hidden rounded-[32px] bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-premium hover:shadow-2xl transition-all duration-500">
                    <div className="aspect-[16/10] overflow-hidden relative">
                      <img src={item.image || undefined} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      <div className="absolute top-4 left-4 h-7 px-3 bg-primary/90 backdrop-blur-md rounded-lg flex items-center justify-center text-[8px] font-black text-white uppercase tracking-widest ring-1 ring-white/20">
                        {item.type === 'rss' ? 'أخبار خارجية' : 'رسمي'}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-2 leading-relaxed min-h-[40px] group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400">
                          <span className="material-symbols-outlined !text-[12px]">schedule</span>
                          {formatDistanceToNow(new Date(item.date), { locale: ar, addSuffix: true })}
                        </div>
                        <div className="text-[10px] font-black text-primary-light">اقرأ المزيد</div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        );

      case 'media':
        return (
          <motion.section key={section.id} variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none">{section.title || 'ميديا الاتحاد'}</h2>
                  <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">{media.length}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Exclusive Multimedia</span>
              </div>
              <Link to="/media" className="h-8 px-4 rounded-xl glass-card flex items-center justify-center text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all">
                عرض المزيد
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {recentMedia.map((item, idx) => (
                <motion.div 
                  key={item.id} 
                  whileHover={{ y: -4 }} 
                  whileTap={{ scale: 0.96 }}
                  className={idx === 0 ? 'col-span-2' : ''}
                >
                  <Link to="/media" className={`relative flex ${idx === 0 ? 'aspect-[16/9]' : 'aspect-square'} overflow-hidden rounded-[32px] shadow-premium group cinematic-glow`}>
                    <img src={item.thumbnailUrl || undefined} alt={item.title} className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                    
                    <div className="absolute top-4 right-4 h-9 w-9 rounded-2xl glass-card flex items-center justify-center text-white ring-1 ring-white/10 group-hover:bg-primary transition-colors">
                      <span className="material-symbols-outlined !text-[18px] font-variation-settings-fill">
                        {item.type === 'video' ? 'play_arrow' : 'photo_library'}
                      </span>
                    </div>
                    
                    <div className="absolute bottom-5 left-5 right-5">
                      {item.type === 'video' && item.duration && (
                        <span className="inline-block mb-2 text-[8px] bg-accent px-1.5 py-0.5 rounded-lg text-white font-black tracking-tighter shadow-glow">
                          {item.duration}
                        </span>
                      )}
                      <p className={`font-black text-white leading-tight ${idx === 0 ? 'text-lg' : 'text-xs'} line-clamp-2 drop-shadow-xl`}>
                        {item.title}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        );

      case 'matches':
        if (upcomingMatches.length === 0) return null;
        return (
          <motion.section key={section.id} variants={itemVariants} className="space-y-4">
            <div className="flex flex-col px-1">
              <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none">{section.title || 'مباريات مرتقبة'}</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Upcoming Fixtures</span>
            </div>
            
            <div className="flex flex-col gap-3">
              {upcomingMatches.map((match) => (
                <Link key={match.id} to="/matches" className="flex items-center justify-between glass-card p-3 sm:p-4 rounded-[28px] sm:rounded-[32px] shadow-premium hover:border-primary/30 transition-all duration-300">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex items-center -space-x-4 rtl:space-x-reverse">
                      <div className="h-14 w-14 rounded-2xl bg-white dark:bg-background-dark p-2.5 shadow-premium ring-1 ring-border-light dark:ring-border-dark flex items-center justify-center z-10 transition-transform hover:scale-110">
                        <img src={match.homeLogo || undefined} alt="Home" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <div className="h-14 w-14 rounded-2xl bg-white dark:bg-background-dark p-2.5 shadow-premium ring-1 ring-border-light dark:ring-border-dark flex items-center justify-center z-0 scale-90 opacity-90 transition-transform hover:scale-110">
                        <img src={match.awayLogo || undefined} alt="Away" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-xs font-black text-slate-800 dark:text-white">{match.homeTeam} × {match.awayTeam}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                         <span className="text-[9px] font-black text-primary-light bg-primary/5 px-2 py-0.5 rounded-lg">{match.competition}</span>
                         <span className="text-[9px] font-bold text-slate-400">{format(new Date(match.date), 'EEEE d MMMM | p', { locale: ar })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-background-dark text-slate-300 group-hover:text-primary transition-colors">
                     <span className="material-symbols-outlined !text-[18px] rotate-180">arrow_back</span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        );

       case 'history':
        return (
          <motion.section key={section.id} variants={itemVariants} className="relative overflow-hidden rounded-[40px] bg-primary text-white p-6 shadow-2xl cinematic-glow">
             <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
             <div className="relative flex flex-col gap-4">
                <div className="flex items-center justify-between">
                   <h2 className="text-2xl font-black">{section.title || 'تاريخ العراقة'}</h2>
                   <Link to="/history" className="h-9 px-4 bg-white/20 backdrop-blur-md rounded-xl text-[10px] font-black flex items-center justify-center hover:bg-white text-white hover:text-primary transition-all">تصفح التاريخ</Link>
                </div>
                <p className="text-xs font-bold opacity-80 leading-relaxed">أكثر من ١٠٠ عام من المجد والبطولات وتاريخ كتبه الرواد في قلب الإسكندرية.</p>
                <div className="flex items-center gap-4 mt-2">
                   <div className="flex flex-col">
                      <span className="text-3xl font-black">٦</span>
                      <span className="text-[8px] font-black uppercase opacity-60">كأس مصر</span>
                   </div>
                   <div className="h-10 w-[1px] bg-white/20"></div>
                   <div className="flex flex-col">
                      <span className="text-3xl font-black">٧٥</span>
                      <span className="text-[8px] font-black uppercase opacity-60">بطولة سلة</span>
                   </div>
                   <div className="h-10 w-[1px] bg-white/20"></div>
                   <div className="flex flex-col">
                      <span className="text-3xl font-black">١٩٠٦</span>
                      <span className="text-[8px] font-black uppercase opacity-60">سنة التأسيس</span>
                   </div>
                </div>
             </div>
          </motion.section>
        );

      case 'ads': {
        const activeAds = ads.filter(a => a.active);
        if (activeAds.length === 0) return null;
        
        return (
          <motion.section key={section.id} variants={itemVariants} className="relative z-20">
            <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2">
              {activeAds.map((ad) => (
                <div key={ad.id} className="flex-shrink-0 w-full group snap-center">
                  {ad.link ? (
                    <a 
                      href={ad.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="block relative aspect-[21/9] rounded-[32px] overflow-hidden shadow-premium group-hover:shadow-2xl transition-all duration-500"
                    >
                      <img src={ad.image} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-5 left-5 right-5 text-right">
                        <h4 className="text-white text-lg font-black leading-tight drop-shadow-lg">{ad.title}</h4>
                      </div>
                    </a>
                  ) : (
                    <div className="relative aspect-[21/9] rounded-[32px] overflow-hidden shadow-premium">
                      <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-5 left-5 right-5 text-right">
                        <h4 className="text-white text-lg font-black leading-tight drop-shadow-lg">{ad.title}</h4>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {activeAds.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-2">
                {activeAds.map((_, i) => (
                  <div key={i} className="h-1 w-4 rounded-full bg-slate-200 dark:bg-slate-700" />
                ))}
              </div>
            )}
          </motion.section>
        );
      }

      case 'poll':
        // Wait, the store uses 'polls' in the switch but let's check
      case 'polls':
        return (
          <motion.section key={section.id} variants={itemVariants}>
            <div className="glass-card rounded-[40px] p-8 border border-primary/10 shadow-premium relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all"></div>
               <div className="relative flex flex-col items-center text-center gap-4">
                  <div className="h-14 w-14 rounded-[24px] bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined !text-3xl">how_to_vote</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white leading-none">توقعات الجماهير</h3>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Voice your opinion</span>
                  </div>
                  <p className="text-xs text-slate-500 font-bold max-w-[240px]">شاركنا رأيك وتوقعاتك في استفتاءات نادي الاتحاد الأسبوعية.</p>
                  <Link to="/fan-zone" className="w-full h-12 bg-slate-900 dark:bg-primary text-white rounded-2xl text-[11px] font-black shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                    عرض الاستطلاعات
                  </Link>
               </div>
            </div>
          </motion.section>
        );

      case 'widget':
        if (!section.htmlCode) return null;
        return (
          <motion.section key={section.id} variants={itemVariants} className="overflow-hidden rounded-2xl shadow-sm">
            <HtmlWidget htmlCode={section.htmlCode} id={section.id} />
          </motion.section>
        );

      case 'image':
        if (!section.imageUrl) return null;
        const ImageContent = (
          <motion.section key={section.id} variants={itemVariants} className="relative overflow-hidden rounded-2xl shadow-lg border border-border-light dark:border-border-dark bg-white dark:bg-card-dark">
            <img 
              src={section.imageUrl} 
              alt={section.title || "Banner"} 
              className="w-full h-auto object-cover max-h-[400px]" 
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            {section.title && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                 <h3 className="text-white text-sm font-black">{section.title}</h3>
              </div>
            )}
          </motion.section>
        );

        if (section.link) {
          return (
            <a key={section.id} href={section.link} target="_blank" rel="noopener noreferrer" className="block active:scale-[0.98] transition-transform">
              {ImageContent}
            </a>
          );
        }
        return ImageContent;

      case 'advertise':
        return (
          <motion.section key={section.id} variants={itemVariants}>
            <AdvertiseWidget />
          </motion.section>
        );

      case 'city': {
        const isCityActive = cityInfo ? cityInfo.active : true;
        if (!isCityActive) return null;
        
        const useAuto = cityInfo?.useAutoWeather ?? true;
        const isDay = useAuto ? (autoWeather?.isDay ?? true) : true;
        const cond = useAuto ? (autoWeather?.condition || 'sunny') : 'sunny';

        const displayCity = {
           cityName: cityInfo?.cityName || '📍 الاسكندرية',
           temperature: (useAuto && autoWeather?.temp) ? autoWeather.temp : (cityInfo?.temperature || '25'),
           conditionText: (useAuto && autoWeather?.condition) ? (
             autoWeather.condition === 'sunny' ? 'صافي' :
             autoWeather.condition === 'mostly_sunny' ? 'غالباً صافي' :
             autoWeather.condition === 'partly_cloudy' ? 'غائم جزئياً' :
             autoWeather.condition === 'cloudy' ? 'غائم' :
             autoWeather.condition === 'foggy' ? 'ضباب' :
             autoWeather.condition === 'drizzle' ? 'رذاذ' :
             autoWeather.condition === 'rainy' ? 'ممطر' :
             autoWeather.condition === 'snowy' ? 'ثلوج' :
             autoWeather.condition === 'showers' ? 'زخات مطر' :
             autoWeather.condition === 'thunderstorm' ? 'عواصف رعدية' : 'غائم'
           ) : (cityInfo?.condition || 'صافي'),
           sunrise: (useAuto && autoWeather?.sunrise) ? autoWeather.sunrise : (cityInfo?.sunrise || '06:30 AM'),
           sunset: (useAuto && autoWeather?.sunset) ? autoWeather.sunset : (cityInfo?.sunset || '07:15 PM'),
           image: cityInfo?.image || 'https://images.unsplash.com/photo-1572214350916-571eac7bfced?q=80&w=1000&auto=format&fit=crop',
           weatherBg: cityInfo?.weatherBg || '',
           description: cityInfo?.description || 'عروس البحر الأبيض المتوسط وعاصمة الرياضة والثقافة.'
        };

        const tempInt = parseInt(displayCity.temperature) || 25;
        let cardBg = '';
        let iconBg = '';
        let iconColor = '';
        let IconElement = CloudSun;
        let textColor = 'text-white';
        let subtextColor = 'text-white/80';
        let effectType: 'sun' | 'clouds' | 'stars' | 'rain' | 'snow' | 'storm' = 'sun';

        // Day Theme Logic
        if (isDay) {
          if (cond === 'sunny' || cond === 'mostly_sunny') {
            cardBg = 'from-amber-400 via-orange-400 to-amber-600 border-amber-300/30';
            iconBg = 'bg-yellow-100 shadow-yellow-200/50';
            iconColor = 'text-orange-500';
            IconElement = Sun;
            effectType = 'sun';
          } else if (cond === 'cloudy' || cond === 'partly_cloudy' || cond === 'foggy') {
            cardBg = 'from-sky-400 via-blue-400 to-sky-600 border-sky-300/30';
            iconBg = 'bg-white/20 backdrop-blur-md';
            iconColor = 'text-white';
            IconElement = CloudSun;
            effectType = 'clouds';
          } else if (cond === 'rainy' || cond === 'showers' || cond === 'drizzle') {
            cardBg = 'from-blue-600 via-slate-600 to-blue-800 border-blue-400/30';
            iconBg = 'bg-white/10';
            iconColor = 'text-blue-100';
            IconElement = CloudRain;
            effectType = 'rain';
          } else if (cond === 'thunderstorm') {
            cardBg = 'from-slate-800 via-indigo-900 to-black border-slate-700/30';
            iconBg = 'bg-yellow-400/20';
            iconColor = 'text-yellow-400';
            IconElement = CloudRain;
            effectType = 'storm';
          } else if (cond === 'snowy') {
            cardBg = 'from-blue-100 via-sky-200 to-blue-300 border-white/30';
            iconBg = 'bg-white shadow-white/30';
            iconColor = 'text-sky-500';
            IconElement = Snowflake;
            effectType = 'snow';
            textColor = 'text-slate-800';
            subtextColor = 'text-slate-600';
          } else {
            cardBg = 'from-emerald-600 via-teal-600 to-emerald-800 border-emerald-500/30';
            iconBg = 'bg-white/20';
            iconColor = 'text-white';
            IconElement = Sun;
            effectType = 'sun';
          }
        } 
        // Night Theme Logic
        else {
          if (cond === 'sunny' || cond === 'mostly_sunny') {
            cardBg = 'from-indigo-950 via-slate-900 to-black border-indigo-500/20';
            iconBg = 'bg-indigo-900/50 shadow-indigo-500/20';
            iconColor = 'text-indigo-200';
            IconElement = Moon;
            effectType = 'stars';
          } else if (cond === 'cloudy' || cond === 'partly_cloudy' || cond === 'foggy') {
            cardBg = 'from-slate-900 via-slate-800 to-black border-slate-700/20';
            iconBg = 'bg-white/5 backdrop-blur-md';
            iconColor = 'text-slate-400';
            IconElement = CloudMoon;
            effectType = 'clouds';
          } else if (cond === 'rainy' || cond === 'showers' || cond === 'drizzle' || cond === 'thunderstorm') {
            cardBg = 'from-blue-950 via-indigo-950 to-black border-blue-900/20';
            iconBg = 'bg-blue-900/30';
            iconColor = 'text-blue-300';
            IconElement = CloudRain;
            effectType = cond === 'thunderstorm' ? 'storm' : 'rain';
          } else if (cond === 'snowy') {
            cardBg = 'from-slate-900 via-blue-950 to-slate-900 border-white/10';
            iconBg = 'bg-white/5';
            iconColor = 'text-blue-100';
            IconElement = Snowflake;
            effectType = 'snow';
          } else {
            cardBg = 'from-slate-950 via-slate-900 to-black border-slate-800/30';
            iconBg = 'bg-white/5';
            iconColor = 'text-slate-400';
            IconElement = Moon;
            effectType = 'stars';
          }
        }

        return (
          <motion.section 
            key={section.id} 
            variants={itemVariants}
            className="overflow-hidden"
          >
            <div className={`relative overflow-hidden rounded-[40px] bg-gradient-to-br ${cardBg} shadow-2xl transition-all duration-1000 border`}>
              {/* Optional Background Image */}
              {displayCity.weatherBg && (
                <div className="absolute inset-0 z-0">
                   <img src={displayCity.weatherBg || undefined} className="w-full h-full object-cover opacity-30 mix-blend-overlay" alt="" referrerPolicy="no-referrer" />
                </div>
              )}

              {/* Background Effects Container */}
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
                
                {/* Sun Rays Effect */}
                {effectType === 'sun' && (
                  <motion.div 
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 0.7, 0.5]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-60 -right-60 w-[800px] h-[800px]"
                    style={{
                      background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)',
                    }}
                  />
                )}

                {/* Stars Effect */}
                {effectType === 'stars' && (
                  <div className="absolute inset-0">
                    {[...Array(60)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute h-1.5 w-1.5 bg-white rounded-full"
                        style={{
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          filter: 'blur(0.5px)'
                        }}
                        animate={{ 
                          opacity: [0.4, 1, 0.4],
                          scale: [1, 1.5, 1]
                        }}
                        transition={{
                          duration: 1 + Math.random() * 2,
                          repeat: Infinity,
                          delay: Math.random() * 3
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Cloud Effects */}
                {(effectType === 'clouds' || effectType === 'rain' || effectType === 'storm') && (
                  <div className="absolute inset-0">
                    <motion.div 
                      animate={{ x: [-200, 600] }}
                      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                      className="absolute top-0 -left-40 w-80 h-40 bg-white/40 blur-3xl rounded-full"
                    />
                    <motion.div 
                      animate={{ x: [600, -200] }}
                      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                      className="absolute top-10 -right-40 w-[400px] h-[200px] bg-white/30 blur-3xl rounded-full"
                    />
                    <motion.div 
                      animate={{ x: [-300, 700], opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                      className="absolute bottom-0 -left-60 w-[500px] h-[250px] bg-white/20 blur-[80px] rounded-full"
                    />
                  </div>
                )}

                {/* Rain Drops Effect */}
                {(effectType === 'rain' || effectType === 'storm') && (
                  <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
                    {[...Array(90)].map((_, i) => {
                      const leftPos = Math.random() * 120 - 10;
                      const duration = 1.2 + Math.random() * 1.8;
                      const delay = Math.random() * -5;
                      
                      return (
                        <motion.div
                          key={i}
                          className="absolute bg-gradient-to-t from-white/60 to-transparent rounded-full"
                          style={{
                            left: `${leftPos}%`,
                            top: `-80px`,
                            width: `${Math.random() > 0.5 ? 2 : 1}px`,
                            height: `${15 + Math.random() * 25}px`,
                            transform: 'rotate(12deg)',
                            opacity: 0.3 + Math.random() * 0.7
                          }}
                          animate={{ 
                            top: ['-10%', '130%'],
                            x: [0, 40]
                          }}
                          transition={{
                            duration: duration,
                            repeat: Infinity,
                            ease: "linear",
                            delay: delay
                          }}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Storm Flash Effect */}
                {effectType === 'storm' && (
                  <motion.div 
                    animate={{ opacity: [0, 0, 0.6, 0, 0.4, 0, 0] }}
                    transition={{ duration: 6, repeat: Infinity, delay: Math.random() * 8, times: [0, 0.8, 0.82, 0.84, 0.86, 0.9, 1] }}
                    className="absolute inset-0 bg-white/80 z-[10]"
                  />
                )}

                {/* Snow Effect */}
                {effectType === 'snow' && (
                  <div className="absolute inset-0">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute h-1 w-1 bg-white rounded-full blur-[0.5px]"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `-10px`
                        }}
                        animate={{ 
                          top: ['0%', '110%'],
                          x: [0, Math.random() * 20 - 10, 0]
                        }}
                        transition={{
                          duration: 3 + Math.random() * 4,
                          repeat: Infinity,
                          ease: "linear",
                          delay: Math.random() * 5
                        }}
                      />
                    ))}
                  </div>
                )}

                <div className="absolute inset-0 bg-black/5 opacity-40"></div>
              </div>

              <div className="relative p-5 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                       <div className="p-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                         <MapPin size={14} className={textColor} />
                       </div>
                       <h3 className={`text-lg font-black tracking-tight ${textColor} drop-shadow-sm`}>{displayCity.cityName}</h3>
                    </div>
                    
                    <div className={`flex flex-col gap-0.5 ${subtextColor} text-[10px] font-bold mt-1 pr-1`}>
                       <div className="flex items-center gap-2 opacity-100">
                          <span className="material-symbols-outlined !text-[12px]">calendar_today</span>
                          <span>{format(new Date(), 'EEEE d MMMM', { locale: ar })}</span>
                       </div>
                       <div className="flex items-center gap-2 mt-0.5">
                          <span className="material-symbols-outlined !text-[14px] animate-pulse">schedule</span>
                          <span className="font-black tracking-wider">{format(new Date(), 'p', { locale: ar })}</span>
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <div className="flex items-start">
                        <span className={`text-4xl font-black ${textColor} leading-none tracking-tighter drop-shadow-2xl`}>
                          {displayCity.temperature}
                        </span>
                        <span className={`text-xl font-bold ${textColor} mt-1 opacity-60`}>°</span>
                      </div>
                      <span className={`mt-2 text-[9px] font-black uppercase px-3 py-1 bg-white/20 backdrop-blur-md ${textColor} rounded-xl text-center border border-white/10 shadow-lg`}>
                        {displayCity.conditionText}
                      </span>
                    </div>
                    <motion.div 
                      animate={{ scale: [1, 1.05, 1], rotate: effectType === 'sun' ? [0, 5, -5, 0] : 0 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className={`h-12 w-12 rounded-[20px] ${iconBg} flex items-center justify-center ${iconColor} shadow-2xl ring-1 ring-white/30`}
                    >
                      <IconElement size={24} strokeWidth={2.5} />
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        );
      }


      default:
        return null;
    }
  };

  const sortedSections = [...homeSections].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return a.order - b.order;
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 260, damping: 20 }
    }
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col pb-32 px-0 bg-background-light dark:bg-background-dark min-h-screen">
      <motion.main 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-x-hidden px-4 flex flex-col gap-0 py-6"
      >
        {sortedSections.map(section => {
          const content = renderSection(section);
          if (!content) return null;
          return (
            <div key={section.id} style={{ marginBottom: `${section.spacing ?? 24}px` }}>
              {content}
            </div>
          );
        })}
      </motion.main>
    </div>
  );
}

