import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  setPersistence, 
  browserSessionPersistence,
  browserLocalPersistence,
  indexedDBLocalPersistence
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Final consolidated Firebase initialization with env var support and robust fallbacks
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCcuNPJ1vExS-99EzbP6fa7f2Wp9u7on78",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mit-paradh.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mit-paradh",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mit-paradh.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "466918434374",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:466918434374:web:90413b76f9b6ed1b364c47",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-4KR4XHVBZJ",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://mit-paradh-default-rtdb.firebaseio.com"
};

const isConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let realtimeDb: Database;
let storage: FirebaseStorage;
let studentStorage: FirebaseStorage;
let staffStorage: FirebaseStorage;
let collegeStorage: FirebaseStorage;

let studentApp: FirebaseApp;
let studentAuth: Auth;
let staffApp: FirebaseApp;
let staffAuth: Auth;
let collegeApp: FirebaseApp;
let collegeAuth: Auth;

if (isConfigured) {
  try {
    app = getApps().find(a => a.name === '[DEFAULT]') || initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    db = getFirestore(app);
    realtimeDb = getDatabase(app, firebaseConfig.databaseURL);
    storage = getStorage(app);

    // Named apps for portal isolation
    const sApp = getApps().find(a => a.name === 'Student') || initializeApp(firebaseConfig, 'Student');
    const stAuth = getAuth(sApp);
    
    const fApp = getApps().find(a => a.name === 'Staff') || initializeApp(firebaseConfig, 'Staff');
    const fAuth = getAuth(fApp);
    
    const cApp = getApps().find(a => a.name === 'College') || initializeApp(firebaseConfig, 'College');
    const cAuth = getAuth(cApp);

    if (typeof window !== 'undefined') {
      // Use Session Persistence to allow multiple tabs with different logins
      const p = browserSessionPersistence;
      setPersistence(auth, p).catch(() => setPersistence(auth, browserLocalPersistence));
      setPersistence(stAuth, p).catch(() => setPersistence(stAuth, browserLocalPersistence));
      setPersistence(fAuth, p).catch(() => setPersistence(fAuth, browserLocalPersistence));
      setPersistence(cAuth, p).catch(() => setPersistence(cAuth, browserLocalPersistence));
    }

    studentApp = sApp;
    studentAuth = stAuth;
    staffApp = fApp;
    staffAuth = fAuth;
    collegeApp = cApp;
    collegeAuth = cAuth;

    storage = getStorage(app);
    studentStorage = getStorage(sApp);
    staffStorage = getStorage(fApp);
    collegeStorage = getStorage(cApp);

  } catch (error) {
    console.error("Firebase initialization failed:", error);
    app = {} as any;
    auth = { onAuthStateChanged: () => () => {} } as any;
    studentAuth = auth;
    staffAuth = auth;
    collegeAuth = auth;
    db = {} as any;
    realtimeDb = {} as any;
    storage = {} as any;
    studentStorage = {} as any;
    staffStorage = {} as any;
    collegeStorage = {} as any;
  }
} else {
  app = {} as any;
  auth = { onAuthStateChanged: () => () => {} } as any;
  studentAuth = auth;
  staffAuth = auth;
  collegeAuth = auth;
  db = {} as any;
  realtimeDb = {} as any;
  storage = {} as any;
  studentStorage = {} as any;
  staffStorage = {} as any;
  collegeStorage = {} as any;
}

export { 
  app, auth, 
  studentApp, studentAuth, 
  collegeApp, collegeAuth, 
  staffApp, staffAuth,
  db, realtimeDb, storage,
  studentStorage, staffStorage, collegeStorage
};
