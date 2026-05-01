import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import firebaseConfigJson from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
  UPLOAD = 'upload',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errCode = error?.code || '';
  const isRead = operationType === OperationType.LIST || operationType === OperationType.GET;
  const isUnavailable = errCode === 'unavailable' || errCode === 'deadline-exceeded';

  const errInfo: FirestoreErrorInfo = {
    error: error?.message || errCode || String(error),
    authInfo: {
      userId: getAuth().currentUser?.uid,
      email: getAuth().currentUser?.email,
      emailVerified: getAuth().currentUser?.emailVerified,
      isAnonymous: getAuth().currentUser?.isAnonymous,
    },
    operationType,
    path
  };

  if (isRead && isUnavailable) {
    console.warn(`Firestore [${path}] temporarily unavailable. Operating in offline mode.`, errInfo);
    return; // Don't throw for transient read errors to keep UI alive
  }

  console.error(`Firestore Error [${path}]: `, JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function handleStorageError(error: any, path: string) {
  const errInfo = {
    error: error?.message || error?.code || String(error),
    authInfo: {
      userId: getAuth().currentUser?.uid,
    },
    operationType: 'UPLOAD',
    path
  };
  console.error(`Storage Error [${path}]: `, JSON.stringify(errInfo));
  throw new Error(`STORAGE_ERROR: ${errInfo.error}`);
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigJson.measurementId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Initialize Cloud Messaging and get a reference to the service
// We wrap this in a safe check because some browsers/environments don't support FCM
let messagingInstance: any = null;

const initializeMessaging = async () => {
  if (typeof window === 'undefined') return null;
  try {
    const supported = await isSupported();
    if (supported) {
      messagingInstance = getMessaging(app);
      
      // Set up onMessage listener once initialized
      onMessage(messagingInstance, (payload) => {
        console.log('Message received. ', payload);
        const title = payload.notification?.title || 'إشعار جديد';
        const body = payload.notification?.body || '';
        
        // Broadcast via custom event so the UI can show a toast
        const event = new CustomEvent('fcm-message', { detail: { title, body, payload } });
        window.dispatchEvent(event);
      });
      
      return messagingInstance;
    }
  } catch (e) {
    console.warn("Firebase Messaging initialization failed:", e);
  }
  return null;
};

// Start initialization
initializeMessaging();

export const messaging = messagingInstance;

export const requestNotificationPermission = async () => {
  const activeMessaging = messagingInstance || await initializeMessaging();
  if (!activeMessaging) {
    console.log('Messaging not supported in this environment.');
    return;
  }
  
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      const registration = await navigator.serviceWorker.ready;
      const currentToken = await getToken(activeMessaging, { 
        vapidKey: 'BLpfNtPFcOkDCoXJ0F_vmM3RmtPtWy24cGby0tw-XL2EeZz3xxa_2DXYjS8uw_dRSsZIrcq-05Rv68nTJbJgrzg',
        serviceWorkerRegistration: registration 
      });
      
      if (currentToken) {
        console.log('FCM Token Generated:', currentToken);
        // Save the token to Firestore so we can actually reach the users
        import('firebase/firestore').then(({ doc, setDoc, serverTimestamp }) => {
          const user = getAuth().currentUser;
          setDoc(doc(db, 'fcm_tokens', currentToken), {
            token: currentToken,
            userId: user ? user.uid : 'anonymous',
            createdAt: serverTimestamp(),
            platform: navigator.platform,
            userAgent: navigator.userAgent
          }).catch(err => console.error("Could not save FCM token:", err));
        });
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    } else {
      console.log('Unable to get permission to notify.');
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    console.log('NOTE: If you get a VAPID Key error, you must generate a Web Push certificate in the Firebase Console (Cloud Messaging settings) and add the vapidKey parameter to getToken().');
  }
};

// This is now handled inside initializeMessaging
/*
if (messaging) {
  onMessage(messaging, (payload) => {
    ...
  });
}
*/

export const uploadImage = async (file: File, folder: string): Promise<string> => {
  const path = `${folder}/${Date.now()}_${file.name}`;
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (error) {
    handleStorageError(error, path);
    return '';
  }
};
