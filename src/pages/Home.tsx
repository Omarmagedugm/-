import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../store";
import { auth } from "../lib/firebase";
import { formatDistanceToNow, format } from "date-fns";
import { ar } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
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
  CloudLightning,
  Activity,
  BarChart2,
  Dribbble,
  Plus,
  Minus,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import AdvertiseWidget from "../components/AdvertiseWidget";
import HtmlWidget from "../components/HtmlWidget";
import { SafeImage } from "../components/SafeImage";
import { getOptimizedImage } from "../lib/cloudinary";

export default function Home() {
  const {
    news,
    media,
    matches,
    liveStream,
    profile,
    homeSections,
    cityInfo,
    ads,
    appSettings,
    newsTags,
  } = useAppStore();
  const [tick, setTick] = useState(0);
  const [selectedSport, setSelectedSport] = useState<"football" | "basketball" | "auto">(
    appSettings?.defaultSport || "auto"
  );
  const [autoWeather, setAutoWeather] = useState<{
    temp: string;
    condition: string;
    sunrise: string;
    sunset: string;
    isDay?: boolean;
  } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (appSettings?.defaultSport) {
      setSelectedSport(appSettings.defaultSport);
    }
  }, [appSettings?.defaultSport]);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const citySection = homeSections.find(
      (s) => s.type === "city" || s.id === "city",
    );
    if (citySection?.active && (!cityInfo || cityInfo.active !== false)) {
      fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=31.2001&longitude=29.9187&current_weather=true&daily=sunrise,sunset&timezone=Africa%2FCairo&forecast_days=1",
      )
        .then(async (r) => {
          if (!r.ok) {
            throw new Error(`Weather API responded with status: ${r.status}`);
          }
          return r.json();
        })
        .then((data) => {
          if (
            !data ||
            !data.current_weather ||
            !data.daily ||
            !data.daily.sunrise ||
            !data.daily.sunset
          )
            return;

          const weatherCodeToText = (code: number) => {
            if (code === 0) return "sun";
            if (code === 1) return "sun";
            if (code === 2) return "partly_cloudy";
            if (code === 3) return "cloudy";
            if (code === 45 || code === 48) return "foggy";
            if (code >= 51 && code <= 55) return "drizzle";
            if (code >= 61 && code <= 65) return "rainy";
            if (code >= 71 && code <= 75) return "snowy";
            if (code >= 80 && code <= 82) return "showers";
            if (code >= 95) return "thunderstorm";
            return "cloudy";
          };

          const formatTime = (timeStr: string) => {
            try {
              if (!timeStr) return "--:--";
              const date = new Date(timeStr);
              if (isNaN(date.getTime())) return "--:--";
              let hours = date.getHours();
              const mins = date.getMinutes().toString().padStart(2, "0");
              const ampm = hours >= 12 ? "PM" : "AM";
              hours = hours % 12;
              hours = hours ? hours : 12;
              return `${hours}:${mins} ${ampm}`;
            } catch (e) {
              return "--:--";
            }
          };

          setAutoWeather({
            temp: Math.round(data.current_weather.temperature ?? 25).toString(),
            condition: weatherCodeToText(data.current_weather.weathercode ?? 0),
            sunrise: formatTime(data.daily.sunrise[0]),
            sunset: formatTime(data.daily.sunset[0]),
            isDay: data.current_weather.is_day === 1,
          });
        })
        .catch((err) => {
          console.warn("Weather fetch suppressed:", err.message);
        });
    }
  }, [homeSections, cityInfo?.active]);

  const calculateCurrentMinute = (match: any) => {
    if (!match.isTimerRunning || !match.timerStartTime)
      return Number(match.timerBaseMinute || 0);
    const start = new Date(match.timerStartTime).getTime();
    if (isNaN(start)) return Number(match.timerBaseMinute || 0);
    const elapsed = Math.max(
      0,
      Math.floor((new Date().getTime() - start) / 60000),
    );
    return Number(match.timerBaseMinute || 0) + elapsed;
  };

  const handleScoreUpdate = async (matchId: string, team: 'home' | 'away', change: number) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const currentScore = team === 'home' ? parseInt(match.homeScore || "0") : parseInt(match.awayScore || "0");
    const newScore = Math.max(0, currentScore + change);

    try {
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      await updateDoc(doc(db, 'matches', matchId), {
        [team === 'home' ? 'homeScore' : 'awayScore']: newScore.toString(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  const recentNews = news.slice(0, 5);
  const recentMedia = media.slice(0, 5);

  const allFeatured = matches
    .filter((m) => m.featured === true)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const allLive = matches.filter((m) => m.status === "live");

  const defaultSport = allFeatured[0]?.sport || allLive[0]?.sport || 'football';
  const effectiveSport = selectedSport === "auto" ? defaultSport : selectedSport;

  const sportMatches = matches.filter(
    (m) =>
      m.sport === effectiveSport || (!m.sport && effectiveSport === "football"),
  );

  // Strict hero selection that respects active filter without cross-sport fallbacks
  const heroMatch =
    sportMatches.find((m) => m.status === "live") ||
    sportMatches.find((m) => m.featured === true) ||
    sportMatches.find((m) => m.status === "upcoming") ||
    sportMatches[0]; // If there are no matches, this is undefined. We do NOT fallback to another sport here to avoid bugs.

  // Logic for upcoming matches: prioritize the 'other' sport if available
  const currentSport = heroMatch?.sport || effectiveSport || "football";
  const otherSport = currentSport === "basketball" ? "football" : "basketball";

  const matchesFromOtherSport = matches.filter(
    (m) =>
      m.status === "upcoming" &&
      m.id !== heroMatch?.id &&
      (m.sport === otherSport || (!m.sport && otherSport === "football")),
  );

  const upcomingMatches =
    matchesFromOtherSport.length > 0
      ? matchesFromOtherSport.slice(0, 3)
      : matches
          .filter(
            (m) =>
              m.status === "upcoming" &&
              m.id !== heroMatch?.id &&
              (m.sport === currentSport ||
                (!m.sport && currentSport === "football")),
          )
          .slice(0, 3);

  // High-level admin check
  const isOmar = auth.currentUser?.email === "omarmagedugm@ittihad.club";
  const isDev = auth.currentUser?.email === "copyrightofficialco@gmail.com";
  const isAdmin = profile.role === "admin" || isOmar || isDev;

  let timeLeft = { d: 0, h: 0, m: 0, s: 0 };
  let isUpcoming = false;
  if (heroMatch?.status === "upcoming" && heroMatch.date) {
    const diff = new Date(heroMatch.date).getTime() - new Date().getTime();
    if (diff > 0) {
      isUpcoming = true;
      timeLeft = {
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60),
      };
    }
  }

  const renderSection = (section: any) => {
    if (!section.active) return null;

    switch (
      section.type === "custom" && section.id === "city" ? "city" : section.type
    ) {
      case "hero":
        if (!heroMatch)
          return (
            <motion.section
              key={section.id}
              variants={itemVariants}
              className="space-y-4"
            >
              <div className="relative bg-slate-50 dark:bg-surface-dark p-12 rounded-[40px] flex flex-col items-center justify-center text-center gap-3 border border-dashed border-slate-300 dark:border-border-dark shadow-sm">
                <div className="absolute top-4 right-4 z-50 flex gap-1 bg-white dark:bg-card-dark p-1 rounded-2xl shadow-sm border border-border-light dark:border-border-dark">
                  <button
                    onClick={() => setSelectedSport("football")}
                    className={`p-1.5 rounded-xl transition-all ${effectiveSport === "football" ? "bg-primary text-white shadow-md" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-dark"}`}
                  >
                    <Trophy size={12} />
                  </button>
                  <button
                    onClick={() => setSelectedSport("basketball")}
                    className={`p-1.5 rounded-xl transition-all ${effectiveSport === "basketball" ? "bg-[#ea580c] text-white shadow-md" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-dark"}`}
                  >
                    <Dribbble size={12} />
                  </button>
                </div>
                {effectiveSport === "football" ? (
                  <Trophy
                    size={48}
                    className="text-slate-300 dark:text-slate-600"
                  />
                ) : (
                  <Dribbble
                    size={48}
                    className="text-slate-300 dark:text-slate-600"
                  />
                )}
                <p className="text-[11px] font-black text-slate-500">
                  لا توجد مباريات{" "}
                  {effectiveSport === "football" ? "كرة قدم" : "كرة سلة"} حالياً
                </p>
              </div>
            </motion.section>
          );
        return (
          <motion.section
            key={section.id}
            variants={itemVariants}
            className="relative group space-y-4"
          >
            <div className="relative">
              {isAdmin && (
                <button
                  onClick={() =>
                    navigate("/admin", {
                      state: { editCategory: "matches", editId: heroMatch.id },
                    })
                  }
                  className="absolute -top-2 -right-2 z-50 p-2.5 bg-accent text-white rounded-2xl shadow-premium shadow-accent/20 pressable"
                >
                  <Edit2 size={16} />
                </button>
              )}

              <div
                className={`relative overflow-hidden rounded-[40px] shadow-2xl cinematic-glow ${effectiveSport === "basketball" ? "bg-gradient-to-br from-orange-600 via-orange-900 to-slate-900 border border-orange-500/30" : "stadium-gradient"}`}
              >
                {/* Stadium Background */}
                <div className="absolute inset-0 z-0 rounded-[inherit] overflow-hidden">
                   <img 
                      src={heroMatch?.stadiumImage || (effectiveSport === "basketball" ? "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2000" : "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=2000")} 
                      className="w-full h-full object-cover opacity-20 filter saturate-50 blur-[2px] rounded-[inherit]" 
                      alt="stadium"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent rounded-[inherit]"></div>
                </div>

                <div
                  className={`absolute inset-0 opacity-10 mix-blend-overlay rounded-[inherit] ${effectiveSport === "basketball" ? 'bg-[url("https://www.transparenttextures.com/patterns/carbon-fibre.png")]' : 'bg-[url("https://www.transparenttextures.com/patterns/stardust.png")]'}`}
                ></div>

                <div className="relative p-5 sm:p-6 z-10">
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className={`text-[10px] font-black text-white px-2.5 py-1.5 rounded-lg backdrop-blur-md border border-white/10 tracking-tighter flex items-center gap-1.5 ${effectiveSport === "basketball" ? "bg-orange-500/20" : "bg-accent/20"}`}
                    >
                      {effectiveSport === "basketball" ? (
                        <Dribbble size={10} className="text-orange-400" />
                      ) : (
                        <Trophy size={10} className="text-accent" />
                      )}
                      {heroMatch.competition}
                    </div>

                    {isUpcoming && (
                      <div
                        className="flex items-center gap-1 sm:gap-1.5 text-white dir-ltr"
                        dir="ltr"
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-black/30 rounded flex items-center justify-center border border-white/10 text-[10px] sm:text-xs font-mono font-black tabular-nums backdrop-blur-md">
                            {timeLeft.d}
                          </div>
                          <span className="text-[7px] sm:text-[8px] opacity-70 leading-none tracking-widest font-bold">
                            يوم
                          </span>
                        </div>
                        <span className="text-white/30 text-[10px] mb-3 font-bold">
                          :
                        </span>
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-black/30 rounded flex items-center justify-center border border-white/10 text-[10px] sm:text-xs font-mono font-black tabular-nums backdrop-blur-md">
                            {timeLeft.h.toString().padStart(2, "0")}
                          </div>
                          <span className="text-[7px] sm:text-[8px] opacity-70 leading-none tracking-widest font-bold">
                            ساعة
                          </span>
                        </div>
                        <span className="text-white/30 text-[10px] mb-3 font-bold">
                          :
                        </span>
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-black/30 rounded flex items-center justify-center border border-white/10 text-[10px] sm:text-xs font-mono font-black tabular-nums backdrop-blur-md">
                            {timeLeft.m.toString().padStart(2, "0")}
                          </div>
                          <span className="text-[7px] sm:text-[8px] opacity-70 leading-none tracking-widest font-bold">
                            دقيقة
                          </span>
                        </div>
                        <span className="text-white/30 text-[10px] mb-3 font-bold">
                          :
                        </span>
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-black/30 rounded flex items-center justify-center border border-white/10 text-[10px] sm:text-xs font-mono font-black tabular-nums backdrop-blur-md text-accent">
                            {timeLeft.s.toString().padStart(2, "0")}
                          </div>
                          <span className="text-[7px] sm:text-[8px] opacity-70 leading-none tracking-widest font-bold">
                            ثانية
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-1 bg-black/20 backdrop-blur-md p-1 rounded-xl shadow-sm border border-white/10">
                      <button
                        onClick={() => setSelectedSport("football")}
                        className={`p-1.5 rounded-lg transition-all ${effectiveSport === "football" ? "bg-primary text-white shadow-md" : "text-white/50 hover:bg-white/10 hover:text-white"}`}
                      >
                        <Trophy size={14} className="sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedSport("basketball")}
                        className={`p-1.5 rounded-lg transition-all ${effectiveSport === "basketball" ? "bg-[#ea580c] text-white shadow-md" : "text-white/50 hover:bg-white/10 hover:text-white"}`}
                      >
                        <Dribbble size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between sm:justify-center items-center gap-1 sm:gap-6 py-4 sm:py-6 px-1 sm:px-4">
                    <div className="flex flex-col items-center gap-2 sm:gap-5 w-[80px] sm:w-44 group/team shrink-0 z-10">
                      <div
                        className={`relative flex items-center justify-center rounded-[24px] sm:rounded-[44px] bg-white/10 p-2.5 sm:p-5 ring-1 ring-white/20 backdrop-blur-xl shadow-premium ${heroMatch.status === "upcoming" ? "h-20 w-20 sm:h-40 sm:w-40" : "h-16 w-16 sm:h-32 sm:w-32"}`}
                      >
                        <SafeImage
                          alt={heroMatch.homeTeam}
                          className="w-full h-full object-contain filter drop-shadow-2xl"
                          src={heroMatch.homeLogo || undefined}
                          width={200}
                        />
                      </div>
                      <span className="text-center text-[10px] sm:text-[14px] font-black text-white uppercase tracking-wider line-clamp-2 w-full">
                        {heroMatch.homeTeam}
                      </span>
                    </div>

                    <div className="flex flex-col items-center flex-1 px-1 sm:px-4 z-10 min-w-0">
                      <div
                        className={`font-black text-white filter flex flex-col items-center w-full ${effectiveSport === "basketball" ? "drop-shadow-[0_5px_15px_rgba(234,88,12,0.3)]" : "drop-shadow-[0_5px_15px_rgba(46,204,113,0.3)]"}`}
                      >
                        {effectiveSport === "basketball" && (
                          <div className="mb-2 animate-bounce">
                            <Dribbble
                              size={24}
                              className="text-orange-400 opacity-80"
                            />
                          </div>
                        )}
                        {heroMatch.status === "upcoming" ? (
                          <div className="flex flex-col items-center w-full justify-center gap-1 sm:gap-2">
                            <div className="text-xl sm:text-3xl opacity-60">
                              VS
                            </div>
                            <div
                              className="w-fit max-w-[110px] sm:max-w-none mx-auto text-center font-bold text-white/90 bg-black/40 px-2 py-1.5 sm:px-5 sm:py-2.5 rounded-xl border border-white/10 leading-tight"
                              style={{ fontSize: "clamp(8.5px, 2.5vw, 13px)" }}
                            >
                              {heroMatch.date &&
                              !isNaN(new Date(heroMatch.date).getTime()) ? (
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5">
                                  <span className="truncate w-full text-center">
                                    {format(
                                      new Date(heroMatch.date),
                                      "EEEE d MMMM",
                                      { locale: ar },
                                    )}
                                  </span>
                                  <span className="hidden sm:inline">|</span>
                                  <span className="text-white/70">
                                    {format(new Date(heroMatch.date), "h:mm a", {
                                      locale: ar,
                                    })}
                                  </span>
                                </div>
                              ) : (
                                "غير محدد"
                              )}
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`flex items-center justify-center gap-2 sm:gap-4 tracking-widest tabular-nums ${String(heroMatch.homeScore).length > 2 || String(heroMatch.awayScore).length > 2 ? "text-4xl sm:text-7xl" : "text-5xl sm:text-8xl"}`}
                          >
                            <div className="flex flex-col items-center gap-1">
                              {profile?.role === 'admin' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleScoreUpdate(heroMatch.id, 'home', 1); }}
                                  className="p-1 bg-white/20 hover:bg-white/40 rounded-full transition-colors mb-1"
                                >
                                  <Plus size={16} className="text-white" />
                                </button>
                              )}
                              <span>{heroMatch.homeScore}</span>
                              {profile?.role === 'admin' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleScoreUpdate(heroMatch.id, 'home', -1); }}
                                  className="p-1 bg-white/20 hover:bg-white/40 rounded-full transition-colors mt-1"
                                >
                                  <Minus size={16} className="text-white" />
                                </button>
                              )}
                            </div>
                            <span
                              className={
                                effectiveSport === "basketball"
                                  ? "text-orange-400"
                                  : "text-accent"
                              }
                            >
                              :
                            </span>
                            <div className="flex flex-col items-center gap-1">
                              {profile?.role === 'admin' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleScoreUpdate(heroMatch.id, 'away', 1); }}
                                  className="p-1 bg-white/20 hover:bg-white/40 rounded-full transition-colors mb-1"
                                >
                                  <Plus size={16} className="text-white" />
                                </button>
                              )}
                              <span>{heroMatch.awayScore}</span>
                              {profile?.role === 'admin' && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleScoreUpdate(heroMatch.id, 'away', -1); }}
                                  className="p-1 bg-white/20 hover:bg-white/40 rounded-full transition-colors mt-1"
                                >
                                  <Minus size={16} className="text-white" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-2 sm:mt-5 flex flex-col items-center gap-1.5 sm:gap-3">
                        {heroMatch.status === "live" ? (
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
                        ) : heroMatch.status === "finished" ? (
                          <div className="flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-md px-3 sm:px-4 py-1 sm:py-1.5 text-[9px] sm:text-[11px] font-black text-white ring-1 ring-white/10 uppercase tracking-tighter text-center">
                            انتهت
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 sm:gap-5 w-[80px] sm:w-44 group/team shrink-0 z-10">
                      <div
                        className={`relative flex items-center justify-center rounded-[24px] sm:rounded-[44px] bg-white/10 p-2.5 sm:p-5 ring-1 ring-white/20 backdrop-blur-xl shadow-premium ${heroMatch.status === "upcoming" ? "h-20 w-20 sm:h-40 sm:w-40" : "h-16 w-16 sm:h-32 sm:w-32"}`}
                      >
                        <SafeImage
                          alt={heroMatch.awayTeam}
                          className="w-full h-full object-contain filter drop-shadow-2xl"
                          src={heroMatch.awayLogo || undefined}
                          width={200}
                        />
                      </div>
                      <span className="text-center text-[10px] sm:text-[14px] font-black text-white uppercase tracking-wider line-clamp-2 w-full">
                        {heroMatch.awayTeam}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 relative z-20">
                    <Link
                      to={
                        heroMatch.status === "live" || liveStream.isActive
                          ? "/live"
                          : "/matches"
                      }
                      className="h-14 rounded-2xl bg-white text-primary-dark hover:bg-primary-light hover:text-white transition-all duration-300 font-black text-[11px] flex items-center justify-center gap-2 shadow-premium group/btn relative z-30 cursor-pointer"
                    >
                      <span className="material-symbols-outlined !text-[20px] group-hover/btn:translate-x-1 transition-transform">
                        {heroMatch.status === "live" || liveStream.isActive
                          ? "sensors"
                          : "event"}
                      </span>
                      {heroMatch.status === "live" || liveStream.isActive
                        ? "دخول البث"
                        : "التفاصيل"}
                    </Link>

                    {heroMatch.status === "upcoming" ? (
                      <Link
                        to="/fan-zone"
                        state={{ activeTab: "predictions" }}
                        className={`h-14 rounded-2xl text-white transition-all duration-300 font-black text-[11px] flex items-center justify-center gap-2 shadow-premium animate-pulse relative z-30 cursor-pointer ${effectiveSport === "basketball" ? "bg-orange-600 hover:bg-orange-700" : "bg-accent hover:bg-accent-dark"}`}
                      >
                        <span className="material-symbols-outlined !text-[20px]">
                          stadium
                        </span>
                        توقع النتيجة
                      </Link>
                    ) : (
                      <Link
                        to="/media"
                        className="h-14 rounded-2xl bg-[#EAB308] text-white hover:bg-[#CA8A04] transition-all duration-300 font-black text-[11px] flex items-center justify-center gap-2 shadow-premium relative z-30 cursor-pointer"
                      >
                        <span className="material-symbols-outlined !text-[20px]">
                          movie
                        </span>
                        ملخص المباراة
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        );

      case "live":
        if (!liveStream.isActive) return null;
        return (
          <motion.section
            key={section.id}
            variants={itemVariants}
            className="relative z-20"
          >
            <Link
              to="/live"
              className="flex items-center justify-between p-4 rounded-[32px] bg-accent/10 border border-accent/20 cinematic-glow pressable relative z-30 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-accent flex items-center justify-center text-white shadow-glow animate-pulse">
                  <span className="material-symbols-outlined font-variation-settings-fill">
                    broadcast_on_home
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black text-slate-800 dark:text-white">
                    بث مباشر متاح الآن
                  </span>
                  <span className="text-[10px] font-bold text-accent">
                    اضغط للمتابعة الفورية
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-white dark:bg-surface-dark flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined rotate-180">
                  arrow_back
                </span>
              </div>
            </Link>
          </motion.section>
        );

      case "custom":
        return (
          <motion.section key={section.id} variants={itemVariants}>
            <Link
              to="/fan-zone"
              className="block relative overflow-hidden rounded-[40px] bg-slate-900 shadow-2xl group cinematic-glow border border-white/5"
            >
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-110 transition-transform duration-1000"></div>
              <div className="absolute inset-0 stadium-gradient mix-blend-multiply opacity-60"></div>
              <div className="absolute inset-0 bg-gradient-to-l from-slate-900/90 via-slate-900/40 to-transparent"></div>

              <div className="relative p-7 flex flex-col items-start gap-2">
                <div className="flex items-center gap-2 rounded-full bg-primary/20 backdrop-blur-md px-3 py-1 border border-primary/30">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse shadow-glow"></div>
                  <span className="text-[9px] font-black text-accent uppercase tracking-widest">
                    {section.title || "Fan Community Hub"}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white leading-tight">
                  منطقة المشجعين
                </h3>
                <p className="text-[10px] text-slate-300 font-bold max-w-[200px] leading-relaxed mt-1">
                  ساهم في النقاشات، توقع نتائج المباريات، وكن المشجع المثالي
                  لزعيم الثغر.
                </p>
                <div className="mt-6 h-11 px-6 bg-white text-primary-dark rounded-2xl text-[11px] font-black shadow-2xl flex items-center justify-center gap-2 group/cta hover:bg-primary-light hover:text-white transition-all">
                  دخول Fan Zone
                  <span className="material-symbols-outlined !text-sm group-hover:translate-x-1 transition-transform">
                    forum
                  </span>
                </div>
              </div>
            </Link>
          </motion.section>
        );

      case "news":
        return (
          <motion.section
            key={section.id}
            variants={itemVariants}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex flex-col">
                <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none">
                  {section.title || "آخر الأخبار"}
                </h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Latest Club Updates
                </span>
              </div>
              <Link
                to="/news"
                className="h-8 px-4 rounded-xl glass-card flex items-center justify-center text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all"
              >
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
                  <Link
                    to={`/news/${item.id}`}
                    className="block relative overflow-hidden rounded-[32px] bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-premium hover:shadow-2xl transition-all duration-500"
                  >
                    <div className="aspect-[16/10] overflow-hidden relative">
                      <SafeImage
                        src={item.image || undefined}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700"
                        width={800}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      <div className="absolute top-4 left-4 z-20 flex gap-1.5 flex-wrap max-w-[90%]">
                        <div className="h-7 px-3 bg-primary/90 backdrop-blur-md rounded-lg flex items-center justify-center text-[8px] font-black text-white uppercase tracking-widest ring-1 ring-white/20 shadow-premium">
                          {item.category || (item.type === "rss" ? "أخبار خارجية" : "رسمي")}
                        </div>
                        {item.tagIds?.map((tagId: string) => {
                          const tagObj = newsTags?.find((t: any) => t.id === tagId);
                          if (!tagObj) return null;
                          return (
                            <div 
                              key={tagObj.id} 
                              className="h-7 px-3 backdrop-blur-md rounded-lg flex items-center justify-center text-[8px] font-black text-white uppercase tracking-widest ring-1 ring-white/20 shadow-premium"
                              style={{ backgroundColor: `${tagObj.color}cc` }}
                            >
                              {tagObj.name}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-2 leading-relaxed min-h-[40px] group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400">
                          <span className="material-symbols-outlined !text-[12px]">
                            schedule
                          </span>
                          {formatDistanceToNow(new Date(item.date), {
                            locale: ar,
                            addSuffix: true,
                          })}
                        </div>
                        <div className="text-[10px] font-black text-primary-light">
                          اقرأ المزيد
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        );

      case "media":
        return (
          <motion.section
            key={section.id}
            variants={itemVariants}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-1">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none">
                    {section.title || "ميديا الاتحاد"}
                  </h2>
                  <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">
                    {media.length}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Exclusive Multimedia
                </span>
              </div>
              <Link
                to="/media"
                className="h-8 px-4 rounded-xl glass-card flex items-center justify-center text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all"
              >
                عرض المزيد
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {recentMedia.map((item, idx) => (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.96 }}
                  className={idx === 0 ? "col-span-2" : ""}
                >
                  <Link
                    to="/media"
                    className={`relative flex ${idx === 0 ? "aspect-[16/9]" : "aspect-square"} overflow-hidden rounded-[32px] shadow-premium group cinematic-glow`}
                  >
                    <SafeImage
                      src={item.thumbnailUrl || undefined}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                      width={600}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

                    <div className="absolute top-4 right-4 h-9 w-9 rounded-2xl glass-card flex items-center justify-center text-white ring-1 ring-white/10 group-hover:bg-primary transition-colors">
                      <span className="material-symbols-outlined !text-[18px] font-variation-settings-fill">
                        {item.type === "video" ? "play_arrow" : "photo_library"}
                      </span>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                      {item.type === "video" && item.duration && (
                        <span className="inline-block mb-2 text-[8px] bg-accent px-1.5 py-0.5 rounded-lg text-white font-black tracking-tighter shadow-glow">
                          {item.duration}
                        </span>
                      )}
                      <p
                        className={`font-black text-white leading-tight ${idx === 0 ? "text-lg" : "text-xs"} line-clamp-2 drop-shadow-xl`}
                      >
                        {item.title}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>
        );

      case "matches":
        if (upcomingMatches.length === 0) return null;
        return (
          <motion.section
            key={section.id}
            variants={itemVariants}
            className="space-y-4"
          >
            <div className="flex flex-col px-1">
              <h2 className="text-lg font-black text-slate-800 dark:text-white leading-none">
                {section.title || "مباريات مرتقبة"}
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Upcoming Fixtures
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {upcomingMatches.map((match) => (
                <Link
                  key={match.id}
                  to="/matches"
                  className="flex items-center justify-between glass-card p-3 sm:p-4 rounded-[28px] sm:rounded-[32px] shadow-premium hover:border-primary/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex items-center -space-x-4 rtl:space-x-reverse">
                      <div className="h-14 w-14 rounded-2xl bg-white dark:bg-background-dark p-2.5 shadow-premium ring-1 ring-border-light dark:ring-border-dark flex items-center justify-center z-10 transition-transform hover:scale-110">
                        <img
                          src={match.homeLogo || undefined}
                          alt="Home"
                          className="h-full w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="h-14 w-14 rounded-2xl bg-white dark:bg-background-dark p-2.5 shadow-premium ring-1 ring-border-light dark:ring-border-dark flex items-center justify-center z-0 scale-90 opacity-90 transition-transform hover:scale-110">
                        <img
                          src={match.awayLogo || undefined}
                          alt="Away"
                          className="h-full w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-xs font-black text-slate-800 dark:text-white">
                        {match.homeTeam} × {match.awayTeam}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] font-black text-primary-light bg-primary/5 px-2 py-0.5 rounded-lg">
                          {match.competition}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">
                          {format(new Date(match.date), "EEEE d MMMM | h:mm a", {
                            locale: ar,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-50 dark:bg-background-dark text-slate-300 group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined !text-[18px] rotate-180">
                      arrow_back
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        );

      case "history":
        return (
          <motion.section
            key={section.id}
            variants={itemVariants}
            className="relative overflow-hidden rounded-[40px] bg-primary text-white p-6 shadow-2xl cinematic-glow"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <div className="relative flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black">
                  {section.title || "تاريخ العراقة"}
                </h2>
                <Link
                  to="/history"
                  className="h-9 px-4 bg-white/20 backdrop-blur-md rounded-xl text-[10px] font-black flex items-center justify-center hover:bg-white text-white hover:text-primary transition-all"
                >
                  تصفح التاريخ
                </Link>
              </div>
              <p className="text-xs font-bold opacity-80 leading-relaxed">
                أكثر من ١٠٠ عام من المجد والبطولات وتاريخ كتبه الرواد في قلب
                الإسكندرية.
              </p>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex flex-col">
                  <span className="text-3xl font-black">٦</span>
                  <span className="text-[8px] font-black uppercase opacity-60">
                    كأس مصر
                  </span>
                </div>
                <div className="h-10 w-[1px] bg-white/20"></div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black">٧٥</span>
                  <span className="text-[8px] font-black uppercase opacity-60">
                    بطولة سلة
                  </span>
                </div>
                <div className="h-10 w-[1px] bg-white/20"></div>
                <div className="flex flex-col">
                  <span className="text-3xl font-black">١٩٠٦</span>
                  <span className="text-[8px] font-black uppercase opacity-60">
                    سنة التأسيس
                  </span>
                </div>
              </div>
            </div>
          </motion.section>
        );

      case "ads": {
        const activeAds = ads.filter((a) => a.active);
        if (activeAds.length === 0) return null;

        return (
          <motion.section
            key={section.id}
            variants={itemVariants}
            className="relative z-20"
          >
            <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 pb-2">
              {activeAds.map((ad) => (
                <div
                  key={ad.id}
                  className="flex-shrink-0 w-full group snap-center"
                >
                  {ad.link ? (
                    <a
                      href={ad.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block relative aspect-[21/9] rounded-[32px] overflow-hidden shadow-premium group-hover:shadow-2xl transition-all duration-500"
                    >
                      <img
                        src={ad.image}
                        alt={ad.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-5 left-5 right-5 text-right">
                        <h4 className="text-white text-lg font-black leading-tight drop-shadow-lg">
                          {ad.title}
                        </h4>
                      </div>
                    </a>
                  ) : (
                    <div className="relative aspect-[21/9] rounded-[32px] overflow-hidden shadow-premium">
                      <img
                        src={ad.image}
                        alt={ad.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-5 left-5 right-5 text-right">
                        <h4 className="text-white text-lg font-black leading-tight drop-shadow-lg">
                          {ad.title}
                        </h4>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {activeAds.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-2">
                {activeAds.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 w-4 rounded-full bg-slate-200 dark:bg-slate-700"
                  />
                ))}
              </div>
            )}
          </motion.section>
        );
      }

      case "poll":
      // Wait, the store uses 'polls' in the switch but let's check
      case "polls":
        return (
          <motion.section key={section.id} variants={itemVariants}>
            <div className="glass-card rounded-[40px] p-8 border border-primary/10 shadow-premium relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all"></div>
              <div className="relative flex flex-col items-center text-center gap-4">
                <div className="h-14 w-14 rounded-[24px] bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined !text-3xl">
                    how_to_vote
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <h3 className="text-xl font-black text-slate-800 dark:text-white leading-none">
                    توقعات الجماهير
                  </h3>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                    Voice your opinion
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-bold max-w-[240px]">
                  شاركنا رأيك وتوقعاتك في استفتاءات نادي الاتحاد الأسبوعية.
                </p>
                <Link
                  to="/fan-zone"
                  className="w-full h-12 bg-slate-900 dark:bg-primary text-white rounded-2xl text-[11px] font-black shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                >
                  عرض الاستطلاعات
                </Link>
              </div>
            </div>
          </motion.section>
        );

      case "widget":
        if (!section.htmlCode) return null;
        return (
          <motion.section
            key={section.id}
            variants={itemVariants}
            className="overflow-hidden rounded-2xl shadow-sm"
          >
            <HtmlWidget htmlCode={section.htmlCode} id={section.id} />
          </motion.section>
        );

      case "image":
        if (!section.imageUrl) return null;
        const ImageContent = (
          <motion.section
            key={section.id}
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl shadow-lg border border-border-light dark:border-border-dark bg-white dark:bg-card-dark"
          >
            <img
              src={section.imageUrl}
              alt={section.title || "Banner"}
              className="w-full h-auto object-cover max-h-[400px]"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            {section.title && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <h3 className="text-white text-sm font-black">
                  {section.title}
                </h3>
              </div>
            )}
          </motion.section>
        );

        if (section.link) {
          return (
            <a
              key={section.id}
              href={section.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block active:scale-[0.98] transition-transform"
            >
              {ImageContent}
            </a>
          );
        }
        return ImageContent;

      case "advertise":
        return (
          <motion.section key={section.id} variants={itemVariants}>
            <AdvertiseWidget />
          </motion.section>
        );

      case "city": {
        const isCityActive = cityInfo ? cityInfo.active : true;
        if (!isCityActive) return null;

        const useAuto = cityInfo?.useAutoWeather ?? true;
        
        // Cairo time for manual day/night determination
        const cairoHourStr = new Intl.DateTimeFormat("en-US", {
          timeZone: "Africa/Cairo",
          hour: "numeric",
          hour12: false,
        }).format(new Date());
        const cairoHour = parseInt(cairoHourStr === "24" ? "0" : cairoHourStr);

        const isDay = useAuto ? (autoWeather?.isDay ?? (cairoHour >= 6 && cairoHour < 19)) : (cairoHour >= 6 && cairoHour < 19);
        
        // Improved mapping for condition to ensure effects trigger correctly even with Arabic text
        const rawCondition = (useAuto ? autoWeather?.condition || "sun" : (cityInfo?.condition || "صافي")).toLowerCase();
        let cond = "sun";
        
        if (rawCondition.includes("rain") || rawCondition.includes("مطر") || rawCondition.includes("زخات")) cond = "rainy";
        else if (rawCondition.includes("storm") || rawCondition.includes("رعد")) cond = "thunderstorm";
        else if (rawCondition.includes("snow") || rawCondition.includes("ثلج")) cond = "snowy";
        else if (rawCondition.includes("cloud") || rawCondition.includes("غائم") || rawCondition.includes("سحب")) cond = "cloudy";
        else if (rawCondition.includes("fog") || rawCondition.includes("ضباب")) cond = "foggy";
        else if (rawCondition.includes("clear") || rawCondition.includes("sunny") || rawCondition.includes("صافي") || rawCondition.includes("شمس")) cond = "sun";

        const displayCity = {
          cityName: cityInfo?.cityName || "الاسكندرية",
          temperature:
            useAuto && autoWeather?.temp
              ? autoWeather.temp
              : cityInfo?.temperature || "25",
          conditionText:
            useAuto && autoWeather?.condition
              ? autoWeather.condition === "sun"
                ? "صافي"
                : autoWeather.condition === "mostly_sunny"
                  ? "غالباً صافي"
                  : autoWeather.condition === "partly_cloudy"
                    ? "غائم جزئياً"
                    : autoWeather.condition === "cloudy"
                      ? "غائم"
                      : autoWeather.condition === "foggy"
                        ? "ضباب"
                        : autoWeather.condition === "drizzle"
                          ? "رذاذ"
                          : autoWeather.condition === "rainy"
                            ? "ممطر"
                            : autoWeather.condition === "snowy"
                              ? "ثلوج"
                              : autoWeather.condition === "showers"
                                ? "زخات مطر"
                                : autoWeather.condition === "thunderstorm"
                                  ? "عواصف رعدية"
                                  : "غائم"
              : cityInfo?.condition || "صافي",
          sunrise:
            useAuto && autoWeather?.sunrise
              ? autoWeather.sunrise
              : cityInfo?.sunrise || "06:30 AM",
          sunset:
            useAuto && autoWeather?.sunset
              ? autoWeather.sunset
              : cityInfo?.sunset || "07:15 PM",
          image:
            cityInfo?.image ||
            "https://images.unsplash.com/photo-1572214350916-571eac7bfced?q=80&w=1000&auto=format&fit=crop",
          weatherBg: cityInfo?.weatherBg || "",
          description:
            cityInfo?.description ||
            "عروس البحر الأبيض المتوسط وعاصمة الرياضة والثقافة.",
        };

        const tempInt = parseInt(displayCity.temperature) || 25;
        let cardBg = "";
        let iconBg = "";
        let iconColor = "";
        let IconElement = CloudSun;
        let textColor = "text-white";
        let subtextColor = "text-white/80";
        let effectType:
          | "sun"
          | "clouds"
          | "stars"
          | "rain"
          | "snow"
          | "storm"
          | "sunset" = "sun";

        let timePhase = "day";
        if (!isDay) {
          timePhase = "night";
        } else if (cairoHour >= 4 && cairoHour < 7) {
          timePhase = "dawn";
        } else if (cairoHour >= 7 && cairoHour < 11) {
          timePhase = "morning";
        } else if (cairoHour >= 16 && cairoHour <= 19) {
          timePhase = "sunset";
        }

        // Theme Logic based on timePhase and condition
        if (cond === "rainy" || cond === "showers" || cond === "drizzle") {
          // Winter / Rain
          cardBg =
            timePhase === "night"
              ? "from-slate-900 via-indigo-950 to-black border-blue-900/20"
              : "from-blue-600 via-blue-800 to-indigo-900 border-blue-400/30";
          iconBg = "bg-white/10";
          iconColor = "text-blue-200";
          IconElement = CloudRain;
          effectType = "rain";
        } else if (cond === "thunderstorm") {
          // Storms
          cardBg =
            timePhase === "night"
              ? "from-slate-950 via-indigo-950 to-black border-slate-800/40"
              : "from-slate-800 via-slate-900 to-slate-950 border-slate-700/40";
          iconBg = "bg-yellow-400/20";
          iconColor = "text-yellow-400";
          IconElement = CloudLightning;
          effectType = "storm";
        } else if (cond === "snowy") {
          // Snow
          cardBg =
            timePhase === "night"
              ? "from-slate-900 via-blue-950 to-slate-900 border-white/10"
              : "from-sky-100 via-white to-blue-100 border-white/50";
          iconBg =
            timePhase === "night"
              ? "bg-white/5"
              : "bg-white/60 shadow-white/30";
          iconColor = timePhase === "night" ? "text-blue-200" : "text-sky-600";
          IconElement = Snowflake;
          effectType = "snow";
          if (timePhase !== "night") {
            textColor = "text-slate-800";
            subtextColor = "text-slate-700";
          }
        } else if (
          cond === "cloudy" ||
          cond === "partly_cloudy" ||
          cond === "foggy"
        ) {
          // Clouds
          IconElement = timePhase === "night" ? CloudMoon : CloudSun;
          effectType = "clouds";
          if (timePhase === "night") {
            cardBg =
              "from-slate-900 via-indigo-950 to-black border-slate-800/20";
            iconBg = "bg-white/5 backdrop-blur-md";
            iconColor = "text-slate-400";
          } else if (timePhase === "sunset") {
            cardBg =
              "from-orange-800 via-rose-900 to-purple-950 border-orange-500/20";
            iconBg = "bg-white/10";
            iconColor = "text-orange-200";
          } else if (timePhase === "dawn") {
            cardBg =
              "from-indigo-800 via-slate-800 to-sky-900 border-indigo-400/20";
            iconBg = "bg-white/20";
            iconColor = "text-blue-100";
          } else {
            // Day cloudy
            cardBg = "from-sky-400 via-blue-500 to-indigo-600 border-sky-300/30";
            iconBg = "bg-white/20 backdrop-blur-md";
            iconColor = "text-white";
          }
        } else {
          // Clear / Sunny
          if (timePhase === "night") {
            cardBg =
              "from-slate-950 via-indigo-950 to-black border-indigo-500/10";
            iconBg = "bg-indigo-900/30 shadow-indigo-500/10";
            iconColor = "text-indigo-200";
            IconElement = Moon;
            effectType = "stars";
          } else if (timePhase === "sunset") {
            cardBg =
              "from-orange-500 via-rose-600 to-indigo-950 border-orange-400/20";
            iconBg = "bg-white/20 shadow-orange-500/30";
            iconColor = "text-orange-100";
            IconElement = Sun;
            effectType = "sunset";
          } else if (timePhase === "dawn") {
            cardBg =
              "from-indigo-900 via-purple-900 to-orange-500 border-indigo-300/30";
            iconBg = "bg-white/20";
            iconColor = "text-amber-100";
            IconElement = Sun;
            effectType = "sun";
          } else if (timePhase === "morning") {
            cardBg = "from-sky-400 via-blue-500 to-sky-600 border-sky-200/40";
            iconBg = "bg-white/30 shadow-sky-300/50";
            iconColor = "text-yellow-300";
            IconElement = Sun;
            effectType = "sun";
          } else {
            // Day Clear
            cardBg = "from-sky-400 via-blue-600 to-indigo-700 border-sky-300/30";
            iconBg = "bg-yellow-300/30 shadow-yellow-200/50";
            iconColor = "text-yellow-300";
            IconElement = Sun;
            effectType = "sun";
          }
        }

        return (
          <motion.section
            key={section.id}
            variants={itemVariants}
            className="p-1" // Add padding to prevent shadow clipping
          >
            <div
              className={`relative overflow-hidden rounded-[40px] bg-gradient-to-br ${cardBg} shadow-2xl transition-all duration-1000 border hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-[1.02]`}
            >
              {/* Optional Background Image */}
              {displayCity.weatherBg && (
                <div className="absolute inset-0 z-0 rounded-[inherit] overflow-hidden">
                  <img
                    src={getOptimizedImage(displayCity.weatherBg, 800) || undefined}
                    className="w-full h-full object-cover opacity-30 mix-blend-overlay rounded-[inherit]"
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Background Effects Container */}
              <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden select-none rounded-[inherit] bg-black/5">
                {/* CSS Rain Overlay for extra visibility if needed */}
                {(effectType === "rain" || effectType === "storm") && (
                  <div className="rain-css absolute inset-0 rounded-[inherit] z-[6]"></div>
                )}
                {effectType === "sun" && (
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [0.6, 0.9, 0.6]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-32 -right-32 w-96 h-96 bg-yellow-400/70 blur-[100px] rounded-full"
                  />
                )}

                {/* Sun Rays Effect / Sunset Glow */}
                {(effectType === "sun" || effectType === "sunset") && (
                  <motion.div
                    animate={{
                      rotate: effectType === "sunset" ? 180 : 360,
                      scale:
                        effectType === "sunset" ? [1.3, 1.6, 1.3] : [1.1, 1.4, 1.1],
                      opacity:
                        effectType === "sunset"
                          ? [0.8, 1, 0.8]
                          : [0.6, 0.8, 0.6],
                    }}
                    transition={{
                      duration: 25,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className={`absolute ${effectType === "sunset" ? "-bottom-60 right-0" : "-top-60 -right-60"} w-[900px] h-[900px] rounded-[inherit]`}
                    style={{
                      background:
                        effectType === "sunset"
                          ? "radial-gradient(circle, rgba(255,100,50,1) 0%, rgba(255,100,50,0) 75%)"
                          : "radial-gradient(circle, rgba(255,255,220,1) 0%, rgba(255,255,255,0) 85%)",
                    }}
                  />
                )}

                {/* Night Stars Effect */}
                {(timePhase === "night" || effectType === "stars") && (
                  <div className="absolute inset-0 rounded-[40px] overflow-hidden z-[6]">
                    {[...Array(80)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute bg-white rounded-full"
                        style={{
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          width: `${1 + Math.random() * 2}px`,
                          height: `${1 + Math.random() * 2}px`,
                        }}
                        animate={{
                          opacity: [0.2, 1, 0.2],
                          scale: [1, 1.3, 1],
                        }}
                        transition={{
                          duration: 1.5 + Math.random() * 3,
                          repeat: Infinity,
                          delay: Math.random() * 5,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Cloud Effects Improved */}
                {/* Scattered Clouds Effect */}
                {(effectType === "clouds" ||
                  effectType === "rain" ||
                  effectType === "storm") && (
                  <div className="absolute inset-0 rounded-[40px] overflow-hidden z-[10]">
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          x: i % 2 === 0 ? [-300, 900] : [900, -300],
                          opacity: [0.3, 0.6, 0.3]
                        }}
                        transition={{
                          duration: 25 + i * 5,
                          repeat: Infinity,
                          ease: "linear",
                          delay: i * 2
                        }}
                        className="absolute bg-white/40 blur-[40px] rounded-full"
                        style={{
                          width: `${150 + Math.random() * 200}px`,
                          height: `${80 + Math.random() * 100}px`,
                          top: `${(i * 15) % 100}%`,
                          left: `${(i * 20) % 100}%`,
                        }}
                      />
                    ))}
                    {/* Darker clouds for storms */}
                    {effectType === "storm" && [...Array(5)].map((_, i) => (
                      <motion.div
                        key={`storm-${i}`}
                        animate={{ 
                          x: i % 2 === 0 ? [-200, 800] : [800, -200],
                        }}
                        transition={{
                          duration: 30 + i * 5,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="absolute bg-slate-800/20 blur-[50px] rounded-full"
                        style={{
                          width: `${200 + Math.random() * 300}px`,
                          height: `${100 + Math.random() * 150}px`,
                          top: `${(i * 20) % 100}%`,
                          left: `${(i * 25) % 100}%`,
                        }}
                        />
                    ))}
                  </div>
                )}

                {/* Rain Drops Effect */}
                {(effectType === "rain" || effectType === "storm") && (
                  <div className="absolute inset-0 z-[12] overflow-hidden pointer-events-none rounded-[40px]">
                    {/* Background Mist layer during rain */}
                    <motion.div 
                      animate={{ 
                        opacity: [0.45, 0.75, 0.45],
                        scale: [1, 1.15, 1]
                      }}
                      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 bg-blue-900/40 backdrop-blur-[3px] rounded-[40px]"
                    />
                    
                    {[...Array(60)].map((_, i) => {
                      const leftPos = Math.random() * 120 - 10;
                      const duration = 0.6 + Math.random() * 0.8;
                      const delay = Math.random() * -5;
                      const isMain = i < 30; // 30 main drops, 30 background ones

                      return (
                        <motion.div
                          key={i}
                          className="absolute bg-gradient-to-t from-white/60 to-transparent rounded-full"
                          style={{
                            left: `${leftPos}%`,
                            top: `-100px`,
                            width: isMain ? '1.5px' : '0.8px',
                            height: isMain ? `${30 + Math.random() * 40}px` : `${15 + Math.random() * 20}px`,
                            transform: "rotate(15deg)",
                            opacity: isMain ? 0.5 + Math.random() * 0.4 : 0.2 + Math.random() * 0.2,
                            filter: isMain ? "none" : "blur(1px)",
                          }}
                          animate={{
                            top: ["-10%", "120%"],
                            x: [0, 30],
                          }}
                          transition={{
                            duration: duration,
                            repeat: Infinity,
                            ease: "linear",
                            delay: delay,
                          }}
                        />
                      );
                    })}

                    {/* Ground Splash effect (simulated) */}
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white/10 to-transparent blur-sm" />
                  </div>
                )}

                {/* Storm Flash Effect */}
                {effectType === "storm" && (
                  <motion.div
                    animate={{ opacity: [0, 0, 0.6, 0, 0.4, 0, 0] }}
                    transition={{
                      duration: 6,
                      repeat: Infinity,
                      delay: Math.random() * 8,
                      times: [0, 0.8, 0.82, 0.84, 0.86, 0.9, 1],
                    }}
                    className="absolute inset-0 bg-white/80 z-[15]"
                  />
                )}

                {/* Snow Effect */}
                {effectType === "snow" && (
                  <div className="absolute inset-0 rounded-[40px] overflow-hidden z-[12]">
                    {[...Array(30)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute h-1.5 w-1.5 bg-white rounded-full blur-[0.3px]"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `-10px`,
                        }}
                        animate={{
                          top: ["0%", "110%"],
                          x: [0, Math.random() * 30 - 15, 0],
                          rotate: [0, 360],
                        }}
                        transition={{
                          duration: 4 + Math.random() * 6,
                          repeat: Infinity,
                          ease: "linear",
                          delay: Math.random() * 5,
                        }}
                      />
                    ))}
                  </div>
                )}

                <div className="absolute inset-0 bg-black/5 opacity-10 rounded-[40px] z-[8]"></div>
              </div>

              <div className="relative p-5 z-20">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
                        <MapPin size={14} className={textColor} />
                      </div>
                      <h3
                        className={`text-lg font-black tracking-tight ${textColor} drop-shadow-sm`}
                      >
                        {displayCity.cityName}
                      </h3>
                    </div>

                    <div
                      className={`flex flex-col gap-0.5 ${subtextColor} text-[10px] font-bold mt-1 pr-1`}
                    >
                      <div className="flex items-center gap-2 opacity-100">
                        <span className="material-symbols-outlined !text-[12px]">
                          calendar_today
                        </span>
                        <span>
                          {format(new Date(), "EEEE d MMMM", { locale: ar })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="material-symbols-outlined !text-[14px] animate-pulse">
                          schedule
                        </span>
                        <span className="font-black tracking-wider">
                          {format(new Date(), "h:mm a", { locale: ar })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <div className="flex items-start">
                        <span
                          className={`text-4xl font-black ${textColor} leading-none tracking-tighter drop-shadow-2xl`}
                        >
                          {displayCity.temperature}
                        </span>
                        <span
                          className={`text-xl font-bold ${textColor} mt-1 opacity-60`}
                        >
                          °
                        </span>
                      </div>
                      <span
                        className={`mt-2 text-[9px] font-black uppercase px-3 py-1 bg-white/20 backdrop-blur-md ${textColor} rounded-xl text-center border border-white/10 shadow-lg`}
                      >
                        {displayCity.conditionText}
                      </span>
                    </div>
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                        rotate: effectType === "sun" ? [0, 5, -5, 0] : 0,
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
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
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 20 },
    },
  };

  return (
    <div className="flex-1 w-full max-w-md mx-auto flex flex-col pb-32 px-0 bg-background-light dark:bg-background-dark min-h-screen">
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-x-hidden px-4 flex flex-col gap-0 py-6"
      >
        {sortedSections.map((section) => {
          const content = renderSection(section);
          if (!content) return null;
          return (
            <div
              key={section.id}
              style={{ marginBottom: `${section.spacing ?? 24}px` }}
            >
              {content}
            </div>
          );
        })}
      </motion.main>
    </div>
  );
}
