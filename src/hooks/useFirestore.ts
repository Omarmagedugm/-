import { useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc, limit, updateDoc, where, getDocs, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAppStore } from '../store';

export function useFirestoreSync() {
  const { 
    setNews, setMedia, setMatches, setClubs, setPolls, setPredictions, setFanPosts,
    setUsers, setSettings, setAiConfig, updateLiveStream, updateLiveStreams, updateProfile, setCityInfo, setAds, setCustomPages,
    setNewsCategories, setNewsTags, setHomeSections, setProducts, setSongs, setAlbums, setPlaylists, setMediaPlaylists, setBooks,
    setClubStats, setClubTitles, setHistoryEvents, setStadiums, setDataLoaded, setOrders,
    setClubCommittees, setClubAnnouncements, setClubServices, setClubTrips, setClubMembersSettings, setMemberDiscounts,
    setBusinesses, setBusinessUpdates, setBusinessReports
  } = useAppStore();

  const isFetchedRef = useRef(false);

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const subscribeSnapshot = (
      docOrQuery: any, 
      onNext: (snap: any) => void, 
      path: string, 
      op: OperationType = OperationType.LIST
    ) => {
      try {
        const unsub = onSnapshot(
          docOrQuery, 
          (snap) => {
            try {
              onNext(snap);
            } catch (e) {
              console.warn(`Snapshot callback error for ${path}:`, e);
            }
          }, 
          (err) => {
            handleFirestoreError(err, op, path);
            setDataLoaded(true);
          }
        );
        return unsub;
      } catch (err) {
        handleFirestoreError(err, op, path);
        setDataLoaded(true);
        return () => {};
      }
    };

    // Real-time Collections Sync
    const setupRealtimeSync = () => {
      const unsubProfile = (uid: string) => subscribeSnapshot(doc(db, 'users', uid), (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as any;
          updateProfile({ ...userData, uid });
          
          const email = auth.currentUser?.email?.toLowerCase();
          if ((email === 'copyrightofficialco@gmail.com' || email === 'omarmagedugm@ittihad.club') && userData.role !== 'admin') {
            updateDoc(doc(db, 'users', uid), { role: 'admin' }).catch(() => {});
          }
        }
      }, `users/${uid}`, OperationType.GET);

      const unsubLiveFootball = subscribeSnapshot(doc(db, 'settings', 'liveStream'), (snap) => {
        if (snap.exists()) updateLiveStreams({ football: snap.data() as any });
      }, 'settings/liveStream', OperationType.GET);

      const unsubLiveBasketball = subscribeSnapshot(doc(db, 'settings', 'liveStream_basketball'), (snap) => {
        if (snap.exists()) updateLiveStreams({ basketball: snap.data() as any });
      }, 'settings/liveStream_basketball', OperationType.GET);

      const unsubMatches = subscribeSnapshot(query(collection(db, 'matches'), orderBy('date', 'desc')), (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        if (data.length > 0 || !isFetchedRef.current) setMatches(data as any);
      }, 'matches');

      const unsubNews = subscribeSnapshot(query(collection(db, 'news'), orderBy('date', 'desc'), limit(50)), (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        if (data.length > 0 || !isFetchedRef.current) setNews(data as any);
      }, 'news');

      const unsubMedia = subscribeSnapshot(query(collection(db, 'media'), orderBy('date', 'desc'), limit(50)), (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        if (data.length > 0 || !isFetchedRef.current) setMedia(data as any);
      }, 'media');

      const unsubLayout = subscribeSnapshot(doc(db, 'settings', 'homeLayout'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data && data.sections) {
            const uniqueSectionsMap = new Map();
            data.sections.forEach((s: any) => { if (s && s.id) uniqueSectionsMap.set(s.id, s); });
            const mergedSections = Array.from(uniqueSectionsMap.values());
            const initialSections = [
              { id: 'hero', type: 'hero', active: true, order: 0 },
              { id: 'ads', type: 'ads', active: true, order: 0.5 },
              { id: 'matches', type: 'matches', active: true, order: 1 },
              { id: 'ai_banner', type: 'ai_banner', active: true, order: 1.2 },
              { id: 'city', type: 'city', active: true, order: 1.5, title: 'عروس البحر المتوسط' },
              { id: 'news', type: 'news', active: true, order: 2 },
              { id: 'media', type: 'media', active: true, order: 3 },
            ];
            initialSections.forEach(ds => { if (!uniqueSectionsMap.has(ds.id)) mergedSections.push(ds); });
            setHomeSections(mergedSections);
          }
        }
      }, 'settings/homeLayout', OperationType.GET);

      // Real-time listener additions with safe error catching
      unsubs.push(subscribeSnapshot(collection(db, 'clubs'), s => setClubs(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 'clubs'));
      unsubs.push(subscribeSnapshot(collection(db, 'products'), s => setProducts(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 'products'));
      unsubs.push(subscribeSnapshot(collection(db, 'ads'), s => setAds(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 'ads'));
      unsubs.push(subscribeSnapshot(collection(db, 'custom_pages'), s => setCustomPages(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 'custom_pages'));
      unsubs.push(subscribeSnapshot(doc(db, 'settings', 'global'), s => { if (s.exists()) setSettings({ id: s.id, ...(s.data() as any) }); }, 'settings/global', OperationType.GET));
      unsubs.push(subscribeSnapshot(doc(db, 'settings', 'ai_config'), s => { if (s.exists()) setAiConfig(s.data()); }, 'settings/ai_config', OperationType.GET));
      unsubs.push(subscribeSnapshot(doc(db, 'city_info', 'alexandria'), s => { if (s.exists()) setCityInfo({ id: s.id, ...(s.data() as any) }); }, 'city_info/alexandria', OperationType.GET));
      unsubs.push(subscribeSnapshot(collection(db, 'songs'), s => setSongs(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 'songs'));
      unsubs.push(subscribeSnapshot(collection(db, 'books'), s => setBooks(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 'books'));
      unsubs.push(subscribeSnapshot(collection(db, 'news_categories'), s => setNewsCategories(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 'news_categories'));
      unsubs.push(subscribeSnapshot(collection(db, 'news_tags'), s => setNewsTags(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 'news_tags'));
      unsubs.push(subscribeSnapshot(collection(db, 'club_titles'), s => setClubTitles(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 'club_titles'));
      unsubs.push(subscribeSnapshot(collection(db, 'club_stats'), s => setClubStats(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 'club_stats'));
      unsubs.push(subscribeSnapshot(collection(db, 'club_stadiums'), s => setStadiums(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 'club_stadiums'));
      unsubs.push(subscribeSnapshot(collection(db, 'club_timeline'), s => setHistoryEvents(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 'club_timeline'));
      unsubs.push(subscribeSnapshot(collection(db, 'club_committees'), s => setClubCommittees(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 'club_committees'));
      unsubs.push(subscribeSnapshot(collection(db, 'club_announcements'), s => setClubAnnouncements(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 'club_announcements'));
      unsubs.push(subscribeSnapshot(collection(db, 'club_services'), s => setClubServices(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 'club_services'));
      unsubs.push(subscribeSnapshot(collection(db, 'club_trips'), s => setClubTrips(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 'club_trips'));
      unsubs.push(subscribeSnapshot(doc(db, 'club_members_settings', 'main'), s => { if (s.exists()) setClubMembersSettings({ id: s.id, ...(s.data() as any) }); }, 'club_members_settings/main', OperationType.GET));
      unsubs.push(subscribeSnapshot(collection(db, 'member_discounts'), s => { if (!s.empty) setMemberDiscounts(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any); }, 'member_discounts'));
      unsubs.push(subscribeSnapshot(collection(db, 'businesses'), s => setBusinesses(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 'businesses'));
      unsubs.push(subscribeSnapshot(collection(db, 'business_updates'), s => setBusinessUpdates(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 'business_updates'));
      unsubs.push(subscribeSnapshot(collection(db, 'business_reports'), s => setBusinessReports(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as any), 'business_reports'));

      // Add common unsubs
      unsubs.push(unsubLiveFootball, unsubLiveBasketball, unsubMatches, unsubNews, unsubMedia, unsubLayout);
      unsubs.push(subscribeSnapshot(collection(db, 'media_playlists'), s => setMediaPlaylists(s.docs.map(d => ({id: d.id, ...(d.data() as any)})) as any), 'media_playlists'));
      unsubs.push(subscribeSnapshot(query(collection(db, 'fan_posts'), orderBy('createdAt', 'desc'), limit(50)), s => setFanPosts(s.docs.map(d => ({id: d.id, ...(d.data() as any)})) as any), 'fan_posts'));
      unsubs.push(subscribeSnapshot(query(collection(db, 'polls'), orderBy('createdAt', 'desc'), limit(20)), s => setPolls(s.docs.map(d => ({id: d.id, ...(d.data() as any)})) as any), 'polls'));
      unsubs.push(subscribeSnapshot(query(collection(db, 'predictions'), orderBy('createdAt', 'desc'), limit(100)), s => setPredictions(s.docs.map(d => ({id: d.id, ...(d.data() as any)})) as any), 'predictions'));
      unsubs.push(subscribeSnapshot(collection(db, 'users'), s => setUsers(s.docs.map(d => ({id: d.id, uid: d.id, ...(d.data() as any)})) as any), 'users'));

      const currentUser = auth.currentUser;
      if (currentUser) {
        unsubs.push(unsubProfile(currentUser.uid));
        
        // Activity Update
        const lastUpdateKey = `last_active_update_${currentUser.uid}`;
        try {
          const lastUpdate = typeof window !== 'undefined' ? localStorage.getItem(lastUpdateKey) : null;
          const now = Date.now();
          if (!lastUpdate || now - parseInt(lastUpdate) > 300000) {
            updateDoc(doc(db, 'users', currentUser.uid), { lastActive: new Date().toISOString() })
              .then(() => {
                try {
                  if (typeof window !== 'undefined') localStorage.setItem(lastUpdateKey, now.toString());
                } catch (e) {}
              })
              .catch(() => {});
          }
        } catch (e) {
          console.warn('Activity update tracking failed', e);
        }

        // Orders
        setTimeout(() => {
          const profile = useAppStore.getState().profile;
          const isAdmin = profile?.role === 'admin' || (profile?.roles && profile.roles.includes('admin'));
          const ordersQuery = isAdmin 
            ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
            : query(collection(db, 'orders'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
            
          unsubs.push(subscribeSnapshot(ordersQuery, (s) => setOrders(s.docs.map(d => ({id: d.id, ...(d.data() as any)})) as any), 'orders'));
        }, 1500);
      }
    };

    setupRealtimeSync();

    const dataLoadTimeout = setTimeout(() => {
      if (!isFetchedRef.current) {
        console.warn('Initial data load taking too long (6s), forcing ready state');
        setDataLoaded(true);
      }
    }, 6000);

    // Static Data Fetching
    const fetchStaticData = async () => {
      const fetchWithCache = async (key: string, fetcher: () => Promise<any>) => {
        const cacheKey = `fs_cache_${key}`;
        try {
          const cached = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : null;
          if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < 15000) return data; // 15s cache
          }
        } catch (e) {
          console.warn('Cache read failed', e);
        }

        const data = await fetcher();
        try { 
          if (typeof window !== 'undefined') {
            localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() })); 
          }
        } catch (e) {
          console.warn('Cache write failed', e);
        }
        return data;
      };

      const fetchCol = async (col: string, setter: (d: any) => void, q?: any) => {
        try {
          const data = col === 'users'
            ? await (async () => {
                const s = await getDocs(q || collection(db, col));
                return s.docs.map(d => ({ id: d.id, uid: d.id, ...(d.data() as any) }));
              })()
            : await fetchWithCache(col, async () => {
                const s = await getDocs(q || collection(db, col));
                return s.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
              });
          if (data && (data.length > 0 || !isFetchedRef.current)) setter(data);
        } catch (e) { console.warn(`Fetch ${col} failed`, e); }
      };

      const fetchDocItem = async (path: string, setter: (d: any) => void) => {
        try {
          const parts = path.split('/');
          const data = await fetchWithCache(path.replace('/', '_'), async () => {
            const s = await getDoc(doc(db, parts[0], parts[1]));
            return s.exists() ? { id: s.id, ...(s.data() as any) } : null;
          });
          if (data) setter(data);
        } catch (e) { console.warn(`Fetch doc ${path} failed`, e); }
      };

      await Promise.allSettled([
        fetchDocItem('settings/global', setSettings),
        fetchDocItem('city_info/alexandria', setCityInfo),
        fetchCol('users', setUsers),
        fetchCol('clubs', setClubs),
        fetchCol('products', setProducts),
        fetchCol('ads', setAds, query(collection(db, 'ads'), where('active', '==', true), orderBy('order', 'asc'))),
        fetchCol('club_titles', setClubTitles, query(collection(db, 'club_titles'), orderBy('count', 'desc'))),
        fetchCol('club_stats', setClubStats),
        fetchCol('club_stadiums', setStadiums),
        fetchCol('club_timeline', setHistoryEvents, query(collection(db, 'club_timeline'), orderBy('year', 'asc')))
      ]);
      
      isFetchedRef.current = true;
      setDataLoaded(true);
    };

    fetchStaticData();

    return () => {
      clearTimeout(dataLoadTimeout);
      unsubs.forEach(unsub => unsub());
    };
  }, [auth.currentUser?.uid]);
 // Deliberately small dependency array to avoid re-renders triggering refetches
}
