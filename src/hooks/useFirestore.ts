import { useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc, limit, updateDoc, where, getDocs, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAppStore } from '../store';

export function useFirestoreSync() {
  const { 
    setNews, setMedia, setMatches, setClubs, setPolls, setPredictions, setFanPosts,
    setUsers, setSettings, updateLiveStream, updateProfile, setCityInfo, setAds, setCustomPages 
  } = useAppStore();

  const isFetchedRef = useRef(false);

  useEffect(() => {
    // Sync Current User Profile first (Real-time)
    let unsubProfile = () => {};
    const currentUser = auth.currentUser;
    if (currentUser) {
      updateDoc(doc(db, 'users', currentUser.uid), { lastActive: new Date().toISOString() })
        .catch(err => console.error('Failed to update activity:', err));

      unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as any;
          updateProfile(userData);
          
          const email = currentUser.email?.toLowerCase();
          const isBootstrap = email === 'copyrightofficialco@gmail.com' || email === 'omarmagedugm@ittihad.club';
          if (isBootstrap && userData.role !== 'admin') {
            updateDoc(doc(db, 'users', currentUser.uid), { role: 'admin' })
              .catch(err => console.error('Failed to auto-upgrade admin:', err));
          }
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`));
    }

    // Sync Live Stream (Real-time)
    const unsubLive = onSnapshot(doc(db, 'settings', 'liveStream'), (docSnap) => {
      if (docSnap.exists()) {
        updateLiveStream(docSnap.data() as any);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/liveStream'));

    // Sync Settings (Real-time - essential for Admin UX)
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as any);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/global'));

    const unsubHomeLayout = onSnapshot(doc(db, 'settings', 'homeLayout'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
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
          useAppStore.getState().setHomeSections(mergedSections);
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/homeLayout'));

    const unsubNewsCategories = onSnapshot(doc(db, 'settings', 'newsCategories'), (docSnap) => {
      if (docSnap.exists()) {
        useAppStore.getState().setNewsCategories(docSnap.data().list || []);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/newsCategories'));

    // Sync Custom Pages (Real-time to show new pages immediately)
    const unsubCustomPages = onSnapshot(collection(db, 'custom_pages'), (snapshot) => {
      const pages = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as any;
      setCustomPages(pages);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'custom_pages'));

    // Sync News (Real-time with limit to save quota)
    const newsQuery = query(collection(db, 'news'), orderBy('date', 'desc'), limit(50));
    const unsubNews = onSnapshot(newsQuery, (snapshot) => {
      const news = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as any;
      setNews(news);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'news'));

    // Sync Media (Real-time with limit)
    const mediaQuery = query(collection(db, 'media'), orderBy('date', 'desc'), limit(50));
    const unsubMedia = onSnapshot(mediaQuery, (snapshot) => {
      const mediaItems = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as any;
      setMedia(mediaItems);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'media'));

    // Sync Matches (Real-time)
    const matchesQuery = query(collection(db, 'matches'), orderBy('date', 'desc'));
    const unsubMatches = onSnapshot(matchesQuery, (snapshot) => {
      const matches = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as any;
      setMatches(matches);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'matches'));

    // Sync Fan Posts (Real-time)
    const fanPostsQuery = query(collection(db, 'fan_posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubFanPosts = onSnapshot(fanPostsQuery, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as any;
      setFanPosts(posts);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'fan_posts'));

    // Sync Orders (Real-time)
    let unsubOrders = () => {};
    if (currentUser) {
      setTimeout(() => {
        const isAdmin = useAppStore.getState().profile?.role === 'admin';
        try {
          const ordersQuery = isAdmin 
            ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
            : query(collection(db, 'orders'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
            
          unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
            useAppStore.getState().setOrders(items);
          }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));
        } catch (e) {
          console.error('Orders Query Setup Error:', e);
        }
      }, 1000); // slight delay to allow profile load
    }

    // One-time Fetch for Static/Infrequent Data
    if (!isFetchedRef.current) {
      isFetchedRef.current = true;

      const fetchWithCache = async (cacheKey: string, fetcher: () => Promise<any>, ttlHours = 2) => {
        const isAdmin = useAppStore.getState().profile?.role === 'admin';
        if (!isAdmin) {
          try {
            const cached = localStorage.getItem(`fs_cache_${cacheKey}`);
            if (cached) {
              const { data, timestamp } = JSON.parse(cached);
              // Read from cache if within TTL
              if (Date.now() - timestamp < ttlHours * 60 * 60 * 1000) {
                return data;
              }
            }
          } catch (e) {
            // ignore cache errors
          }
        }

        const data = await fetcher();
        
        try {
          localStorage.setItem(`fs_cache_${cacheKey}`, JSON.stringify({ data, timestamp: Date.now() }));
        } catch (e) {
          // ignore cache save errors
        }
        
        return data;
      };

      const fetchStaticData = async () => {
        try {
          const catchErr = (path: string) => (err: any) => handleFirestoreError(err, OperationType.GET, path);
          
          // Helper for fetching collections
          const fetchCol = async (colName: string, setter: (data: any) => void, q?: any) => {
            try {
              const data = await fetchWithCache(colName, async () => {
                const snap = await getDocs(q || collection(db, colName));
                return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
              });
              setter(data as any);
            } catch (err) {
              catchErr(colName)(err);
            }
          };

          // Helper for fetching docs
          const fetchDoc = async (docPath: string, setter: (data: any) => void, mapFn?: (data: any) => any) => {
             try {
                const data = await fetchWithCache(docPath.replace('/', '_'), async () => {
                  const paths = docPath.split('/');
                  const snap = await getDoc(doc(db, paths[0], paths[1]));
                  if (snap.exists()) {
                    return mapFn ? mapFn({ id: snap.id, ...snap.data() }) : { id: snap.id, ...snap.data() };
                  }
                  return null;
                });
                if (data) setter(data);
             } catch (err) {
               catchErr(docPath)(err);
             }
          };

          // Clubs 
          fetchCol('clubs', setClubs);
          
          // Polls & Predictions
          fetchCol('polls', setPolls);
          fetchCol('predictions', setPredictions);

          // Products & Ads
          fetchCol('products', useAppStore.getState().setProducts);
          fetchCol('ads', setAds, query(collection(db, 'ads'), orderBy('order', 'asc')));

          // Library
          fetchCol('songs', useAppStore.getState().setSongs);
          fetchCol('albums', useAppStore.getState().setAlbums);
          fetchCol('playlists', useAppStore.getState().setPlaylists);
          fetchCol('books', useAppStore.getState().setBooks);
          
          // History
          fetchCol('club_stats', useAppStore.getState().setClubStats);
          fetchCol('club_titles', useAppStore.getState().setClubTitles);
          fetchCol('club_timeline', useAppStore.getState().setHistoryEvents, query(collection(db, 'club_timeline'), orderBy('year', 'asc')));
          fetchCol('club_stadiums', useAppStore.getState().setStadiums);

          // Users (only if needed or cache properly)
          if (currentUser) {
            fetchCol('users', setUsers);
          }

          // Settings (Only fixed static ones, the rest are real-time)
          fetchDoc('settings/newsTags', useAppStore.getState().setNewsTags, d => d.tags || []);
          fetchDoc('city_info/alexandria', setCityInfo);
          
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'static_data');
        }
      };

      fetchStaticData();
    }

    return () => {
      unsubProfile();
      unsubLive();
      unsubNews();
      unsubMedia();
      unsubSettings();
      unsubHomeLayout();
      unsubNewsCategories();
      unsubCustomPages();
      unsubMatches();
      unsubFanPosts();
      unsubOrders();
    };
  }, [auth.currentUser?.uid]); // Deliberately small dependency array to avoid re-renders triggering refetches
}
