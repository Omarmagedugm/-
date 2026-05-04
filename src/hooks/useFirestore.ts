import { useEffect, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc, limit, updateDoc, where, getDocs, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAppStore } from '../store';

export function useFirestoreSync() {
  const { 
    setNews, setMedia, setMatches, setClubs, setPolls, setPredictions, setFanPosts,
    setUsers, setSettings, updateLiveStream, updateProfile, setCityInfo, setAds 
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

    // Sync Matches (Real-time)
    const matchesQuery = query(collection(db, 'matches'), orderBy('date', 'desc'));
    const unsubMatches = onSnapshot(matchesQuery, (snapshot) => {
      const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      setMatches(matches);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'matches'));

    // Sync Fan Posts (Real-time)
    const fanPostsQuery = query(collection(db, 'fan_posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubFanPosts = onSnapshot(fanPostsQuery, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
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
                return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

          // News & Media
          fetchCol('news', setNews, query(collection(db, 'news'), orderBy('date', 'desc')));
          fetchCol('media', setMedia, query(collection(db, 'media'), orderBy('date', 'desc')));
          
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

          // Settings
          fetchDoc('settings/global', setSettings, d => { const { id, ...rest } = d; return rest; });
          fetchDoc('settings/newsCategories', useAppStore.getState().setNewsCategories, d => d.list || []);
          fetchDoc('settings/newsTags', useAppStore.getState().setNewsTags, d => d.tags || []);
          fetchDoc('city_info/alexandria', setCityInfo);
          
          fetchDoc('settings/homeLayout', useAppStore.getState().setHomeSections, d => {
            let mergedSections: any[] = [];
            if (d && d.sections) {
              const uniqueSectionsMap = new Map();
              d.sections.forEach((s: any) => { if (s && s.id) uniqueSectionsMap.set(s.id, s); });
              mergedSections = Array.from(uniqueSectionsMap.values());
              const initialSections = [
                { id: 'hero', type: 'hero', active: true, order: 0 },
                { id: 'ads', type: 'ads', active: true, order: 0.5 },
                { id: 'matches', type: 'matches', active: true, order: 1 },
                { id: 'city', type: 'city', active: true, order: 1.5, title: 'عروس البحر المتوسط' },
                { id: 'news', type: 'news', active: true, order: 2 },
                { id: 'media', type: 'media', active: true, order: 3 },
              ];
              initialSections.forEach(ds => { if (!uniqueSectionsMap.has(ds.id)) mergedSections.push(ds); });
            }
            return mergedSections.length ? mergedSections : undefined;
          });

        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'static_data');
        }
      };

      fetchStaticData();
    }

    return () => {
      unsubProfile();
      unsubLive();
      unsubMatches();
      unsubFanPosts();
      unsubOrders();
    };
  }, [auth.currentUser?.uid]); // Deliberately small dependency array to avoid re-renders triggering refetches
}
