import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface HomeSection {
  id: string;
  type: 'hero' | 'matches' | 'news' | 'media' | 'history' | 'stadiums' | 'store' | 'polls' | 'live' | 'custom' | 'widget' | 'city' | 'ads' | 'advertise' | 'image' | 'ai_banner';
  title?: string;
  active: boolean;
  order: number;
  htmlCode?: string;
  imageUrl?: string;
  link?: string;
  spacing?: number;
  pinned?: boolean;
}

export interface NewsTag {
  id: string;
  name: string;
  color: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  image: string;
  date: string;
  type: 'manual' | 'rss';
  category?: string;
  author?: string;
  editorName?: string;
  rssUrl?: string;
  rssSource?: string;
  tagIds?: string[];
}

export interface MediaItem {
  id: string;
  title: string;
  type: 'video' | 'photo';
  source?: 'upload' | 'youtube';
  url: string;
  thumbnailUrl: string;
  videoUrl?: string;
  date: string;
  duration?: string;
  views?: string;
  likes?: string[];
}

export interface MatchItem {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: string;
  awayScore: string;
  date: string;
  status: 'live' | 'upcoming' | 'finished';
  competition: string;
  stadium?: string;
  stadiumImage?: string;
  isMatchDay?: boolean;
  isTimerRunning?: boolean;
  timerStartTime?: string | null;
  timerBaseMinute?: number;
  sport: 'football' | 'basketball';
  featured?: boolean;
  stadiumOpacity?: number;
}

export interface CityInfo {
  id: string;
  cityName: string;
  useAutoWeather?: boolean;
  temperature: string;
  condition: string;
  sunset: string;
  sunrise: string;
  description: string;
  image: string;
  weatherBg?: string;
  active: boolean;
}

export interface ClubItem {
  id: string;
  name: string;
  logo: string;
}

export interface PollItem {
  id: string;
  question: string;
  options: string[];
  votes: Record<string, number>;
  voters?: string[];
  voterChoices?: Record<string, number>;
  active: boolean;
  createdAt: string;
}

export interface PredictionItem {
  id: string;
  matchId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userAvatar?: string;
  homeScore: number;
  awayScore: number;
  createdAt: string;
}

export interface FanPostItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  image?: string;
  location?: string;
  date?: string;
  poll?: {
    options: string[];
    votes: Record<number, number>;
    voters?: string[];
    voterChoices?: Record<string, number>;
  };
  likes: number;
  likedBy?: string[];
  commentsCount?: number;
  createdAt: string;
}

export interface LiveStream {
  isActive: boolean;
  url: string;
  title: string;
  viewers: number;
}

export interface ClubTitle {
  id: string;
  name: string;
  count: number;
  icon: string;
  category: 'football' | 'basketball';
  hidden?: boolean;
}

export interface ClubStat {
  id: string;
  label: string;
  value: number;
  icon: string;
  hidden?: boolean;
}

export interface HistoryEvent {
  id: string;
  year: string;
  title: string;
  desc: string;
  hidden?: boolean;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  albumId?: string;
  audioUrl: string;
  coverUrl: string;
  duration?: string;
  category: 'anthem' | 'chant' | 'song';
  lyrics?: string;
  hidden?: boolean;
  createdAt?: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  year: string;
  hidden?: boolean;
}

export interface Playlist {
  id: string;
  title: string;
  coverUrl: string;
  songIds: string[];
  hidden?: boolean;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  pdfUrl: string;
  desc: string;
  category: string;
  hidden?: boolean;
}

export interface AdBanner {
  id: string;
  title: string;
  image: string;
  link: string;
  active: boolean;
  order: number;
  createdAt: string;
}

export interface StadiumItem {
  id: string;
  name: string;
  type: string;
  desc: string;
  imageUrl: string;
  hidden?: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: 'tshirt' | 'mug' | 'scarf' | 'bracelet' | 'other';
  imageUrl: string;
  stock: number;
}

export interface StoreOrder {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userAddress: string;
  userEmail?: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'ready' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'sold';
  createdAt: string;
}

export type AppRole = 'admin' | 'news_editor' | 'media_editor' | 'matches_editor' | 'store_editor' | 'layout_editor' | 'user_manager';

export interface UserProfile {
  uid?: string;
  name: string;
  username?: string;
  location: string;
  joinDate: string;
  avatar: string;
  isVerified?: boolean;
  role?: 'user' | 'admin' | 'moderator' | 'writer'; // Legacy support
  roles?: AppRole[];
  tier?: 'new' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'premium';
  bio?: string;
  email?: string;
  stats: {
    predictions: number;
    comments: number;
    favorites: number;
  };
}

interface AppState {
  news: NewsItem[];
  media: MediaItem[];
  matches: MatchItem[];
  clubs: ClubItem[];
  polls: PollItem[];
  predictions: PredictionItem[];
  fanPosts: FanPostItem[];
  users: UserProfile[];
  appSettings: {
    appName: string;
    appLogo: string;
    headerLogoLight?: string;
    headerLogoDark?: string;
    logoType?: 'image' | 'text';
    logoText?: string;
    defaultSport?: 'football' | 'basketball' | 'auto';
  };
  liveStream: LiveStream;
  theme: 'dark' | 'light';
  profile: UserProfile;
  clubTitles: ClubTitle[];
  clubStats: ClubStat[];
  historyEvents: HistoryEvent[];
  stadiums: StadiumItem[];
  newsCategories: string[];
  newsTags: NewsTag[];
  products: Product[];
  orders: StoreOrder[];
  ads: AdBanner[];
  customPages: any[];
  homeSections: HomeSection[];
  songs: Song[];
  albums: Album[];
  playlists: Playlist[];
  books: Book[];
  cityInfo: CityInfo | null;
  currentSong: Song | null;
  isPlaying: boolean;
  playerVolume: number;
  stadiumOpacity: number;
  isAuthReady: boolean;
  activePlaylist: Song[];
  undoStack: { collection: string; action: 'add' | 'delete' | 'update'; data: any }[];
  setNews: (news: NewsItem[]) => void;
  addNews: (item: NewsItem) => void;
  deleteNews: (id: string) => void;
  updateNews: (id: string, item: Partial<NewsItem>) => void;
  setMedia: (media: MediaItem[]) => void;
  addMedia: (item: MediaItem) => void;
  deleteMedia: (id: string) => void;
  updateMedia: (id: string, item: Partial<MediaItem>) => void;
  setMatches: (matches: MatchItem[]) => void;
  addMatch: (item: MatchItem) => void;
  deleteMatch: (id: string) => void;
  updateMatch: (id: string, item: Partial<MatchItem>) => void;
  setClubs: (clubs: ClubItem[]) => void;
  setPolls: (polls: PollItem[]) => void;
  setPredictions: (predictions: PredictionItem[]) => void;
  setFanPosts: (posts: FanPostItem[]) => void;
  setUsers: (users: UserProfile[]) => void;
  updateUser: (uid: string, item: Partial<UserProfile>) => void;
  deleteUser: (uid: string) => void;
  setSettings: (settings: any) => void;
  updateLiveStream: (stream: Partial<LiveStream>) => void;
  toggleTheme: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  setClubTitles: (titles: ClubTitle[]) => void;
  setClubStats: (stats: ClubStat[]) => void;
  setHistoryEvents: (events: HistoryEvent[]) => void;
  setStadiums: (stadiums: StadiumItem[]) => void;
  setNewsCategories: (categories: string[]) => void;
  setNewsTags: (tags: NewsTag[]) => void;
  setProducts: (products: Product[]) => void;
  setOrders: (orders: StoreOrder[]) => void;
  setAds: (ads: AdBanner[]) => void;
  setCustomPages: (pages: any[]) => void;
  setHomeSections: (sections: HomeSection[]) => void;
  setSongs: (songs: Song[]) => void;
  setAlbums: (albums: Album[]) => void;
  setPlaylists: (playlists: Playlist[]) => void;
  setBooks: (books: Book[]) => void;
  setCityInfo: (info: CityInfo | null) => void;
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlayerVolume: (volume: number) => void;
  setStadiumOpacity: (opacity: number) => void;
  setIsAuthReady: (ready: boolean) => void;
  setActivePlaylist: (songs: Song[]) => void;
  pushToUndoStack: (op: { collection: string; action: 'add' | 'delete' | 'update'; data: any }) => void;
  popFromUndoStack: () => { collection: string; action: 'add' | 'delete' | 'update'; data: any } | undefined;
}

const defaultNews: NewsItem[] = [
  {
    id: uuidv4(),
    title: 'الإسكندرية تستعد لكرنفال رياضي كبير بمناسبة مئوية النادي',
    content: 'بدأت اللجنة المنظمة لاحتفالات مئوية نادي الاتحاد السكندري في وضع اللمسات الأخيرة للبرنامج الحافل الذي يتضمن مباريات ودية عالمية وعروض فنية وجماهيرية تليق بتاريخ سيد البلد.',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1000&auto=format&fit=crop',
    date: new Date(Date.now() - 1 * 3600000).toISOString(),
    type: 'manual',
  },
  {
    id: uuidv4(),
    title: 'الاتحاد يستعد لمواجهة الزمالك بتدريبات مكثفة',
    content: 'أجرى الفريق الأول لكرة القدم بنادي الاتحاد السكندري تدريباته اليوم تحت قيادة الجهاز الفني، استعداداً للمباراة المرتقبة أمام الزمالك في الجولة القادمة من الدوري المصري الممتاز.',
    image: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=1000&auto=format&fit=crop',
    date: new Date(Date.now() - 2 * 3600000).toISOString(),
    type: 'manual',
  }
];

const defaultMedia: MediaItem[] = [
  {
    id: uuidv4(),
    title: 'أجمل أهداف فريق الاتحاد هذا الموسم',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1510563399035-7140409890a5?q=80&w=1000&auto=format&fit=crop',
    date: new Date(Date.now() - 24 * 3600000).toISOString(),
    duration: '04:20',
    views: '150K',
  },
  {
    id: uuidv4(),
    title: 'صور مران الفريق الصباحي اليوم',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1000&auto=format&fit=crop',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1000&auto=format&fit=crop',
    date: new Date().toISOString(),
  }
];

const defaultMatches: MatchItem[] = [
  {
    id: uuidv4(),
    homeTeam: 'الاتحاد',
    awayTeam: 'الأهلي',
    homeLogo: 'https://upload.wikimedia.org/wikipedia/ar/thumb/0/0e/Al_Ittihad_Alexandria_Club_Logo.svg/1024px-Al_Ittihad_Alexandria_Club_Logo.svg.png',
    awayLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/Al_Ahly_SC_logo.svg/1200px-Al_Ahly_SC_logo.svg.png',
    homeScore: '1',
    awayScore: '1',
    date: new Date().toISOString(),
    status: 'live',
    competition: 'الدوري المصري الممتاز',
    sport: 'football',
  },
  {
    id: uuidv4(),
    homeTeam: 'الزمالك',
    awayTeam: 'الاتحاد',
    homeLogo: 'https://upload.wikimedia.org/wikipedia/en/thumb/0/04/Zamalek_SC_logo.svg/1200px-Zamalek_SC_logo.svg.png',
    awayLogo: 'https://upload.wikimedia.org/wikipedia/ar/thumb/0/0e/Al_Ittihad_Alexandria_Club_Logo.svg/1024px-Al_Ittihad_Alexandria_Club_Logo.svg.png',
    homeScore: '-',
    awayScore: '-',
    date: new Date(Date.now() + 7 * 86400000).toISOString(),
    status: 'upcoming',
    competition: 'الدوري المصري الممتاز',
    sport: 'football',
  }
];

const defaultLiveStream: LiveStream = {
  isActive: true,
  url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  title: 'مباراة الاتحاد والأهلي - بث مباشر',
  viewers: 1240,
};

const defaultProfile: UserProfile = {
  name: 'مشجع سكندري',
  username: 'fan_ittihad',
  location: 'الإسكندرية، مصر',
  joinDate: '٢٠٢٤',
  avatar: 'https://ui-avatars.com/api/?name=%D9%85%D8%B4%D8%AC%D8%B9+%D8%B3%D9%83%D9%86%D8%AF%D8%B1%D9%8A&background=random',
  isVerified: false,
  role: 'user',
  tier: 'new',
  bio: 'مشجع عاشق لنادي الاتحاد السكندري - زعيم الثغر',
  stats: {
    predictions: 0,
    comments: 0,
    favorites: 0
  }
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      news: defaultNews,
      media: defaultMedia,
      matches: defaultMatches,
      clubs: [],
      polls: [],
      predictions: [],
      fanPosts: [],
      users: [],
      appSettings: {
        appName: 'قناة الاتحاد السكندري',
        appLogo: 'https://upload.wikimedia.org/wikipedia/ar/thumb/0/0e/Al_Ittihad_Alexandria_Club_Logo.svg/1024px-Al_Ittihad_Alexandria_Club_Logo.svg.png',
        headerLogoLight: '',
        headerLogoDark: '',
        logoType: 'image',
        logoText: 'الاتحاد السكندري',
        defaultSport: 'auto'
      },
      liveStream: defaultLiveStream,
      theme: 'dark',
      profile: defaultProfile,
      isAuthReady: false,
      clubTitles: [
        { id: uuidv4(), name: 'كأس مصر', count: 6, icon: 'trophy', category: 'football' },
        { id: uuidv4(), name: 'دوري الأسكندرية', count: 27, icon: 'shield', category: 'football' },
        { id: uuidv4(), name: 'كأس السلطان', count: 1, icon: 'star', category: 'football' },
        { id: uuidv4(), name: 'الدورة الصيفية', count: 9, icon: 'star', category: 'football' },
        { id: uuidv4(), name: 'كأس ستاد البلدية', count: 1, icon: 'star', category: 'football' },
        { id: uuidv4(), name: 'كأس بورسودان', count: 1, icon: 'star', category: 'football' },
        { id: uuidv4(), name: 'الدوري العام', count: 16, icon: 'trophy', category: 'basketball' },
        { id: uuidv4(), name: 'كأس مصر', count: 15, icon: 'trophy', category: 'basketball' },
        { id: uuidv4(), name: 'الدوري المرتبط', count: 9, icon: 'shield', category: 'basketball' },
        { id: uuidv4(), name: 'بطولة أفريقيا', count: 1, icon: 'star', category: 'basketball' },
        { id: uuidv4(), name: 'البطولة العربية', count: 9, icon: 'star', category: 'basketball' },
        { id: uuidv4(), name: 'دورة الحريري', count: 6, icon: 'star', category: 'basketball' },
        { id: uuidv4(), name: 'السوبر المصري', count: 4, icon: 'star', category: 'basketball' },
        { id: uuidv4(), name: 'سوبر مصر البحرين', count: 1, icon: 'star', category: 'basketball' },
        { id: uuidv4(), name: 'بطولة دبي', count: 1, icon: 'star', category: 'basketball' },
        { id: uuidv4(), name: 'دورة حلب', count: 1, icon: 'star', category: 'basketball' },
        { id: uuidv4(), name: 'مصر الدولية', count: 1, icon: 'star', category: 'basketball' },
        { id: uuidv4(), name: 'بطولة أخبار اليوم', count: 1, icon: 'star', category: 'basketball' },
        { id: uuidv4(), name: 'دورة الوحدة', count: 1, icon: 'star', category: 'basketball' },
      ],
      clubStats: [
        { id: uuidv4(), label: 'سنة مرت', value: 120, icon: 'calendar' },
        { id: uuidv4(), label: 'كأس مصر', value: 6, icon: 'trophy' },
        { id: uuidv4(), label: 'دوري منطقة', value: 27, icon: 'shield' },
        { id: uuidv4(), label: 'بطولة سلة', value: 75, icon: 'award' },
      ],
      historyEvents: [
        { id: uuidv4(), year: '1906', title: 'تأسيس النادي', desc: 'أسس حسن رسمي ناديًا باسم نادي الاتحاد، في منطقة رأس التين واتخذ من غرفة بالدور الأرضي بمنزله مقرًّا له، أمام مدرسة رأس التين الثانوية العسكرية.' },
        { id: uuidv4(), year: '1908', title: 'الأتحاد الوطني', desc: 'تمت إضافة كلمة الوطني على الاسم كمدلول للنادي ليكون فعليًّا أول نادٍ شعبي وطني حيث لم يتدخل في تأسيسه أجانب كما كان الحال مع بقية الأندية المصرية التي تأسست في هذه الفترة، وكذلك تيمنًا بالحزب الوطني الذي أسسه مصطفى كامل في 1908.' },
        { id: uuidv4(), year: '1916', title: 'الابطال المتحدة', desc: 'وافق حسن رسمي على تولي رئاسة نادي الأبطال ولكن بشرط واحد وهو تغيير اسم نادي الأبطال المتحدة ليصبح نادي الاتحاد، وذلك ليكون امتدادًا لنادي الاتحاد الوطني الذي أسسه حسن رسمي في 1906، ليعود من جديد اسم نادي الاتحاد للظهور مرة أخرى برئاسة حسن رسمي.' },
        { id: uuidv4(), year: '1918', title: 'النادي السكندري', desc: 'في عام 1918 تولى محمد شاهين رئاسة نادي الاتحاد، وبدأ تواصل مسئولي نادي الاتحاد في أحدى المناسبات مع مسئولي النادي السكندري، وذلك لتكوين فريق قوي يضم العناصر الممتازة من الفريقين بتوحديهما فريق واحد، وانتهت المفاوضات بتوحيد اسم الناديين تحت اسم الاتحاد السكندري ليجمع بين اسمي نادي الاتحاد والنادي السكندري.' },
        { id: uuidv4(), year: '2014', title: 'مئوية سيد البلد', desc: 'تم الاحتفال بمئوية نادي الاتحاد السكندري عام 2014.' },
      ],
      stadiums: [
        { id: uuidv4(), name: 'ملعب المتروبول بالمنشية', type: 'أول ملعب للفريق', desc: 'بعد انتخاب السيد علي عبادي سكرتير عام محافظة الإسكندرية رئيسًا للنادي، حصل النادي على قطعة أرض أمام مركز مطافي المنشية لتكون ملعبه وكان معروفة باسم ملعب المتروبول (محكمة الإسكندرية حالًّيا) وبعد ذلك حصل النادي على إذن حتى يستخدم لاعبوه إحدى الحجرات داخل مركز الإطفاء المواجه للملعب لتغيير ملابسهم.', imageUrl: 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&q=80' },
        { id: uuidv4(), name: 'أرض الحضرة', type: 'ثاني ملعب للفريق', desc: 'تعد أرض الحضرة ثاني الملاعب لنادي الاتحاد السكندري، وقد حصل عليها النادي عام 1928، وكانت عبارة عن أرض من أملاك الحكومة وكانت تشغلها ورش البلدية بجوار السكة الحديد، وبدأت قصة هذه الأرض بإعجاب محمود فهمي النقراشي باشا بنادي الاتحاد بعد فوزه بكأس التفوق المصري عام 1926.', imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80' },
        { id: uuidv4(), name: 'إستاد الشاطبي', type: 'ملعب الشاطبي 1914', desc: 'أسسه أنجلو بولاناكي في 1914، وهو أول ملعب في العالم يرفع على ساريته العلم الأوليمبي وكان ذلك في 5 إبريل عام 1914، واستمر عليه الاتحاد حتى يومنا هذا معقلاً لزعيم الثغر.', imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80' },
      ],
      newsCategories: ['أخبار الفريق', 'كرة سلة', 'ألعاب أخرى', 'تقارير', 'انتقالات'],
      newsTags: [
        { id: '1', name: 'مباشر', color: '#ef4444' },
        { id: '2', name: 'عاجل', color: '#eab308' },
        { id: '3', name: 'رائج', color: '#22c55e' },
      ],
      products: [],
      orders: [],
      ads: [],
      customPages: [],
      homeSections: [
        { id: 'hero', type: 'hero', active: true, order: 0 },
        { id: 'matches', type: 'matches', active: true, order: 1 },
        { id: 'city', type: 'city', active: true, order: 1.5, title: 'عروس البحر المتوسط' },
        { id: 'news', type: 'news', active: true, order: 2 },
        { id: 'media', type: 'media', active: true, order: 3 },
        { id: 'polls', type: 'polls', active: true, order: 4 },
        { id: 'history', type: 'history', active: true, order: 5 },
        { id: 'advertise', type: 'advertise', active: true, order: 10 },
      ],
      songs: [],
      albums: [],
      playlists: [],
      books: [],
      cityInfo: null,
      currentSong: null,
      isPlaying: false,
      playerVolume: 1,
      stadiumOpacity: 0.2,
      activePlaylist: [],
      undoStack: [],
      setNews: (news) => set({ news }),
      addNews: (item) => set((state) => ({ news: [item, ...state.news] })),
      deleteNews: (id) => set((state) => ({ news: state.news.filter(n => n.id !== id) })),
      updateNews: (id, updatedItem) => set((state) => ({
        news: state.news.map(n => n.id === id ? { ...n, ...updatedItem } : n)
      })),
      setMedia: (media) => set({ media }),
      addMedia: (item) => set((state) => ({ media: [item, ...state.media] })),
      deleteMedia: (id) => set((state) => ({ media: state.media.filter(m => m.id !== id) })),
      updateMedia: (id, updatedItem) => set((state) => ({
        media: state.media.map(m => m.id === id ? { ...m, ...updatedItem } : m)
      })),
      setMatches: (matches) => set({ matches }),
      addMatch: (item) => set((state) => ({ matches: [item, ...state.matches] })),
      deleteMatch: (id) => set((state) => ({ matches: state.matches.filter(m => m.id !== id) })),
      updateMatch: (id, updatedItem) => set((state) => ({
        matches: state.matches.map(m => m.id === id ? { ...m, ...updatedItem } : m)
      })),
      setClubs: (clubs) => set({ clubs }),
      setPolls: (polls) => set({ polls }),
      setPredictions: (predictions) => set({ predictions }),
      setFanPosts: (posts) => set({ fanPosts: posts }),
      setUsers: (users) => set({ users }),
      updateUser: (uid, updatedItem) => set((state) => ({
        users: state.users.map(u => u.uid === uid ? { ...u, ...updatedItem } : u)
      })),
      deleteUser: (uid) => set((state) => ({
        users: state.users.filter(u => u.uid !== uid)
      })),
      setSettings: (settings) => set((state) => ({ appSettings: { ...state.appSettings, ...settings } })),
      updateLiveStream: (stream) => set((state) => ({ liveStream: { ...state.liveStream, ...stream } })),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      updateProfile: (profile) => set((state) => ({ profile: { ...state.profile, ...profile } as UserProfile })),
      setClubTitles: (clubTitles) => set({ clubTitles }),
      setClubStats: (clubStats) => set({ clubStats }),
      setHistoryEvents: (historyEvents) => set({ historyEvents }),
      setStadiums: (stadiums) => set({ stadiums }),
      setNewsCategories: (newsCategories) => set({ newsCategories }),
      setNewsTags: (newsTags) => set({ newsTags }),
      setProducts: (products) => set({ products }),
      setOrders: (orders) => set({ orders }),
      setAds: (ads) => set({ ads }),
      setCustomPages: (customPages) => set({ customPages }),
      setHomeSections: (homeSections) => set({ homeSections }),
      setSongs: (songs) => set({ songs }),
      setAlbums: (albums) => set({ albums }),
      setPlaylists: (playlists) => set({ playlists }),
      setBooks: (books) => set({ books }),
      setCityInfo: (cityInfo) => set({ cityInfo }),
      setCurrentSong: (currentSong) => set({ currentSong }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setPlayerVolume: (playerVolume) => set({ playerVolume }),
      setStadiumOpacity: (stadiumOpacity) => set({ stadiumOpacity }),
      setIsAuthReady: (isAuthReady) => set({ isAuthReady }),
      setActivePlaylist: (activePlaylist) => set({ activePlaylist }),
      pushToUndoStack: (op) => set((state) => ({ 
        undoStack: [op, ...state.undoStack].slice(0, 20) // Keep last 20 operations
      })),
      popFromUndoStack: () => {
        let op: any = undefined;
        set((state) => {
          if (state.undoStack.length === 0) return state;
          const [first, ...rest] = state.undoStack;
          op = first;
          return { undoStack: rest };
        });
        return op;
      },
    }),
    {
      name: 'ittihad-app-storage',
    }
  )
);
