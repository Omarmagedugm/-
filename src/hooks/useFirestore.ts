import { useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, limit, updateDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAppStore } from '../store';

export function useFirestoreSync() {
  const { 
    setNews, setMedia, setMatches, setClubs, setPolls, setPredictions, setFanPosts,
    setUsers, setSettings, updateLiveStream, updateProfile, profile, setCityInfo 
  } = useAppStore();

  useEffect(() => {
    // Sync News
    const newsQuery = query(collection(db, 'news'), orderBy('date', 'desc'));
    const unsubNews = onSnapshot(newsQuery, (snapshot) => {
      const news = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      setNews(news);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'news'));

    // Sync Matches
    const matchesQuery = query(collection(db, 'matches'), orderBy('date', 'desc'));
    const unsubMatches = onSnapshot(matchesQuery, (snapshot) => {
      const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      setMatches(matches);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'matches'));

    // Sync Clubs
    const unsubClubs = onSnapshot(collection(db, 'clubs'), (snapshot) => {
      const clubs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      setClubs(clubs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'clubs'));

    // Sync Polls
    const unsubPolls = onSnapshot(collection(db, 'polls'), (snapshot) => {
      const polls = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      setPolls(polls);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'polls'));

    // Sync Predictions
    const unsubPredictions = onSnapshot(collection(db, 'predictions'), (snapshot) => {
      const predictions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      setPredictions(predictions);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'predictions'));

    // Sync Fan Posts
    const fanPostsQuery = query(collection(db, 'fan_posts'), orderBy('createdAt', 'desc'), limit(50));
    const unsubFanPosts = onSnapshot(fanPostsQuery, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      setFanPosts(posts);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'fan_posts'));

    // Sync Media
    const mediaQuery = query(collection(db, 'media'), orderBy('date', 'desc'));
    const unsubMedia = onSnapshot(mediaQuery, (snapshot) => {
      const mediaItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      setMedia(mediaItems);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'media'));

    // Sync Settings
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as any);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/global'));

    // Sync News Categories
    const unsubNewsCategories = onSnapshot(doc(db, 'settings', 'newsCategories'), (docSnap) => {
      if (docSnap.exists()) {
        useAppStore.getState().setNewsCategories(docSnap.data().list || []);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/newsCategories'));

    // Sync Live Stream
    const unsubLive = onSnapshot(doc(db, 'settings', 'liveStream'), (docSnap) => {
      if (docSnap.exists()) {
        updateLiveStream(docSnap.data() as any);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/liveStream'));

    // Sync Home Layout
    const unsubHomeLayout = onSnapshot(doc(db, 'settings', 'homeLayout'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.sections) {
          const mergedSections = [...data.sections];
          const initialSections = [
            { id: 'hero', type: 'hero', active: true, order: 0 },
            { id: 'matches', type: 'matches', active: true, order: 1 },
            { id: 'city', type: 'city', active: true, order: 1.5, title: 'عروس البحر المتوسط' },
            { id: 'news', type: 'news', active: true, order: 2 },
            { id: 'media', type: 'media', active: true, order: 3 },
          ];
          initialSections.forEach(ds => {
            if (!mergedSections.find((s: any) => s.id === ds.id)) {
              mergedSections.push(ds);
            }
          });
          useAppStore.getState().setHomeSections(mergedSections);
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/homeLayout'));

    // Sync Club History
    const unsubHistoryStats = onSnapshot(collection(db, 'club_stats'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      useAppStore.getState().setClubStats(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'club_stats'));

    const unsubHistoryTitles = onSnapshot(collection(db, 'club_titles'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      useAppStore.getState().setClubTitles(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'club_titles'));

    const unsubHistoryTimeline = onSnapshot(query(collection(db, 'club_timeline'), orderBy('year', 'asc')), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      useAppStore.getState().setHistoryEvents(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'club_timeline'));

    const unsubHistoryStadiums = onSnapshot(collection(db, 'club_stadiums'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      useAppStore.getState().setStadiums(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'club_stadiums'));

    // Sync Products
    const unsubProducts = onSnapshot(query(collection(db, 'products')), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      useAppStore.getState().setProducts(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));

    // Sync Orders
    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      useAppStore.getState().setOrders(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'orders'));

    // Sync Songs
    const unsubSongs = onSnapshot(collection(db, 'songs'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      useAppStore.getState().setSongs(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'songs'));

    // Sync Albums
    const unsubAlbums = onSnapshot(collection(db, 'albums'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      useAppStore.getState().setAlbums(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'albums'));

    // Sync Playlists
    const unsubPlaylists = onSnapshot(collection(db, 'playlists'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      useAppStore.getState().setPlaylists(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'playlists'));

    // Sync Books
    const unsubBooks = onSnapshot(collection(db, 'books'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any;
      useAppStore.getState().setBooks(items);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'books'));

    // Sync City Info
    const unsubCityInfo = onSnapshot(doc(db, 'city_info', 'alexandria'), (docSnap) => {
      if (docSnap.exists()) {
        setCityInfo({ id: docSnap.id, ...docSnap.data() } as any);
      } else {
        setCityInfo(null);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'city_info/alexandria'));

    // Sync Current User Profile
    let unsubProfile = () => {};
    const currentUser = auth.currentUser;
    if (currentUser) {
      // Update last active
      updateDoc(doc(db, 'users', currentUser.uid), { lastActive: new Date().toISOString() })
        .catch(err => console.error('Failed to update activity:', err));

      unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data() as any;
          updateProfile(userData);
          
          // Auto-upgrade bootstrap admin
          const email = currentUser.email?.toLowerCase();
          const isBootstrap = email === 'copyrightofficialco@gmail.com' || email === 'omarmagedugm@ittihad.club';
          if (isBootstrap && userData.role !== 'admin') {
            updateDoc(doc(db, 'users', currentUser.uid), { role: 'admin' })
              .catch(err => console.error('Failed to auto-upgrade admin:', err));
          }
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`));
    }

    // Sync Users (Only if admin)
    let unsubUsers = () => {};
    if (profile.role === 'admin' && auth.currentUser) {
      unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as any;
        setUsers(users);
      }, (error) => {
        if (error.code !== 'permission-denied') {
          handleFirestoreError(error, OperationType.LIST, 'users');
        }
      });
    }

    return () => {
      unsubNews();
      unsubMatches();
      unsubClubs();
      unsubPolls();
      unsubPredictions();
      unsubFanPosts();
      unsubMedia();
      unsubSettings();
      unsubNewsCategories();
      unsubLive();
      unsubHomeLayout();
      unsubHistoryStats();
      unsubHistoryTitles();
      unsubHistoryTimeline();
      unsubHistoryStadiums();
      unsubProducts();
      unsubOrders();
      unsubSongs();
      unsubAlbums();
      unsubPlaylists();
      unsubBooks();
      unsubCityInfo();
      unsubProfile();
      unsubUsers();
    };
  }, [auth.currentUser?.uid, setNews, setMedia, setMatches, setClubs, setPolls, setPredictions, setFanPosts, setUsers, setSettings, updateLiveStream, updateProfile, profile.role, setCityInfo]);
}
