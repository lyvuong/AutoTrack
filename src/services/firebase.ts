import { initializeApp, getApps, getApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseConfig, Vehicle, ServiceRecord, ServiceReminder, UserProfile } from '../types';
import { getStoredFirebaseConfig, setStoredFirebaseConfig } from './storage';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: ReturnType<typeof getAuth> | null = null;

const envConfig: FirebaseConfig | null = import.meta.env.VITE_FIREBASE_API_KEY ? {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
} : null;

export const initializeFirebaseService = (customConfig?: FirebaseConfig): boolean => {
  const config = customConfig || getStoredFirebaseConfig() || envConfig;
  if (!config || !config.apiKey || !config.projectId) {
    console.log('[Firebase] Running in Local Demo Mode');
    return false;
  }

  try {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    db = getFirestore(app);
    auth = getAuth(app);
    if (customConfig) {
      setStoredFirebaseConfig(customConfig);
    }
    console.log('[Firebase] Initialized for project:', config.projectId);
    return true;
  } catch (err) {
    console.warn('[Firebase] Initialization failed:', err);
    return false;
  }
};

export const isFirebaseConfigured = (): boolean => {
  return db !== null && auth !== null;
};

export const subscribeAuth = (callback: (user: UserProfile | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0] || 'Car Owner',
        photoURL: user.photoURL,
        isAnonymous: user.isAnonymous
      });
    } else {
      callback(null);
    }
  });
};

export const loginWithGoogle = async (): Promise<UserProfile | null> => {
  if (!auth) throw new Error('Firebase Auth is not configured.');
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  localStorage.setItem('autotrack_auto_signin_google', 'true');
  return {
    uid: res.user.uid,
    email: res.user.email,
    displayName: res.user.displayName,
    photoURL: res.user.photoURL
  };
};

export const signInWithGoogle = loginWithGoogle;

export const tryAutoSignInGoogle = async (): Promise<UserProfile | null> => {
  if (!auth) return null;
  if (auth.currentUser) {
    return {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName,
      photoURL: auth.currentUser.photoURL
    };
  }
  return null;
};

export const loginWithEmail = async (email: string, pass: string): Promise<UserProfile | null> => {
  if (!auth) throw new Error('Firebase Auth is not configured.');
  const res = await signInWithEmailAndPassword(auth, email, pass);
  return {
    uid: res.user.uid,
    email: res.user.email,
    displayName: res.user.displayName || email.split('@')[0],
    photoURL: res.user.photoURL
  };
};

export const registerWithEmail = async (email: string, pass: string): Promise<UserProfile | null> => {
  if (!auth) throw new Error('Firebase Auth is not configured.');
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  return {
    uid: res.user.uid,
    email: res.user.email,
    displayName: email.split('@')[0],
    photoURL: res.user.photoURL
  };
};

export const logoutFirebase = async (): Promise<void> => {
  localStorage.removeItem('autotrack_auto_signin_google');
  if (auth) {
    await firebaseSignOut(auth);
  }
};

export const subscribeFirestoreVehicles = (userId: string, callback: (vehicles: Vehicle[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, 'users', userId, 'vehicles'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const vehicles: Vehicle[] = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as Vehicle));
    callback(vehicles);
  }, (error) => {
    console.error('[Firestore] Vehicles sync error:', error);
  });
};

export const saveFirestoreVehicle = async (userId: string, vehicle: Vehicle): Promise<void> => {
  if (!db) return;
  const docRef = doc(db, 'users', userId, 'vehicles', vehicle.id);
  await setDoc(docRef, vehicle, { merge: true });
};

export const deleteFirestoreVehicle = async (userId: string, vehicleId: string): Promise<void> => {
  if (!db) return;
  await deleteDoc(doc(db, 'users', userId, 'vehicles', vehicleId));
};

export const subscribeFirestoreRecords = (userId: string, callback: (records: ServiceRecord[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, 'users', userId, 'records'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const records: ServiceRecord[] = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as ServiceRecord));
    callback(records);
  }, (error) => {
    console.error('[Firestore] Records sync error:', error);
  });
};

export const saveFirestoreRecord = async (userId: string, record: ServiceRecord): Promise<void> => {
  if (!db) return;
  const docRef = doc(db, 'users', userId, 'records', record.id);
  await setDoc(docRef, record, { merge: true });
};

export const deleteFirestoreRecord = async (userId: string, recordId: string): Promise<void> => {
  if (!db) return;
  await deleteDoc(doc(db, 'users', userId, 'records', recordId));
};

export const saveFirestoreReminder = async (userId: string, reminder: ServiceReminder): Promise<void> => {
  if (!db) return;
  const docRef = doc(db, 'users', userId, 'reminders', reminder.id);
  await setDoc(docRef, reminder, { merge: true });
};

export const subscribeFirestoreReminders = (userId: string, callback: (reminders: ServiceReminder[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, 'users', userId, 'reminders'));
  return onSnapshot(q, (snapshot) => {
    const reminders: ServiceReminder[] = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as ServiceReminder));
    callback(reminders);
  }, (error) => {
    console.error('[Firestore] Reminders sync error:', error);
  });
};

export const deleteFirestoreReminder = async (userId: string, reminderId: string): Promise<void> => {
  if (!db) return;
  await deleteDoc(doc(db, 'users', userId, 'reminders', reminderId));
};
