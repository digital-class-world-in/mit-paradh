import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCcuNPJ1vExS-99EzbP6fa7f2Wp9u7on78",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mit-paradh.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mit-paradh",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mit-paradh.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "466918434374",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:466918434374:web:90413b76f9b6ed1b364c47",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-4KR4XHVBZJ",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 
               "https://mit-paradh-default-rtdb.firebaseio.com"
};

// Safe initialization for build time and Vercel deployments
const isConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let app: FirebaseApp;
let auth: Auth;
let studentApp: FirebaseApp;
let studentAuth: Auth;
let collegeApp: FirebaseApp;
let collegeAuth: Auth;
let staffApp: FirebaseApp;
let staffAuth: Auth;
let db: Firestore;
let realtimeDb: Database;
let storage: FirebaseStorage;

if (isConfigured) {
  try {
    // Default App
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Named Apps for concurrent sessions
    const initApp = (name: string) => {
      const existing = getApps().find(a => a.name === name);
      if (existing) return existing;
      return initializeApp(firebaseConfig, name);
    };

    studentApp = initApp('StudentApp');
    studentAuth = getAuth(studentApp);
    setPersistence(studentAuth, browserSessionPersistence).catch(() => {});

    collegeApp = initApp('CollegeApp');
    collegeAuth = getAuth(collegeApp);
    setPersistence(collegeAuth, browserSessionPersistence).catch(() => {});

    staffApp = initApp('StaffApp');
    staffAuth = getAuth(staffApp);
    setPersistence(staffAuth, browserSessionPersistence).catch(() => {});

    db = getFirestore(app);
    realtimeDb = getDatabase(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    // Fallback to prevents crashes
    app = {} as any;
    auth = { onAuthStateChanged: () => () => {} } as any;
    studentApp = app;
    studentAuth = auth;
    collegeApp = app;
    collegeAuth = auth;
    staffApp = app;
    staffAuth = auth;
    db = {} as any;
    realtimeDb = {} as any;
    storage = {} as any;
  }
} else {
  if (typeof window !== 'undefined') {
    console.warn("Firebase is not fully configured. Please add required NEXT_PUBLIC_FIREBASE_* environment variables.");
  }
  // Provide safer mocks to prevent common function calls from throwing
  app = {} as any;
  auth = { onAuthStateChanged: () => () => {} } as any;
  studentApp = app;
  studentAuth = auth;
  collegeApp = app;
  collegeAuth = auth;
  staffApp = app;
  staffAuth = auth;
  db = {} as any;
  realtimeDb = {} as any;
}

export { 
  app, auth, 
  studentApp, studentAuth, 
  collegeApp, collegeAuth, 
  staffApp, staffAuth,
  db, realtimeDb, storage 
};
