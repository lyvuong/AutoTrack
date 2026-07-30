import type { Vehicle, ServiceRecord, ServiceReminder, FirebaseConfig } from '../types';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithCredential,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
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
import { getStoredFirebaseConfig } from './storage';

let db: ReturnType<typeof getFirestore> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let googleProvider: GoogleAuthProvider | null = null;

export const DEFAULT_ENV_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

export const isFirebaseConfigured = (): boolean => {
  const stored = getStoredFirebaseConfig();
  if (stored && stored.apiKey && stored.projectId) return true;
  return Boolean(DEFAULT_ENV_FIREBASE_CONFIG.apiKey && DEFAULT_ENV_FIREBASE_CONFIG.projectId);
};

export const getActiveFirebaseConfig = (): FirebaseConfig => {
  const stored = getStoredFirebaseConfig();
  if (stored && stored.apiKey && stored.projectId) return stored;
  return DEFAULT_ENV_FIREBASE_CONFIG;
};

export const initializeFirebaseService = (): boolean => {
  if (!isFirebaseConfigured()) return false;

  try {
    const config = getActiveFirebaseConfig();
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    return true;
  } catch (err) {
    console.error('Failed to initialize Firebase service:', err);
    return false;
  }
};

export const subscribeAuth = (callback: (user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null } | null) => void) => {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      });
    } else {
      callback(null);
    }
  });
};

export const signInWithGoogle = async () => {
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth is not initialized. Configure Firebase settings first.');
  }
  const result = await signInWithPopup(auth, googleProvider);
  if (result.user) {
    localStorage.setItem('autotrack_has_google_session', 'true');
  }
  return result.user;
};

export const tryAutoSignInGoogle = async () => {
  if (!auth || !googleProvider) return null;
  const hasSession = localStorage.getItem('autotrack_has_google_session');
  if (!hasSession) return null;

  try {
    // Check if user is already signed in or session can be restored automatically
    if (auth.currentUser) return auth.currentUser;
  } catch (err) {
    console.warn('[Firebase] Silent Google auto-signin skipped:', err);
  }
  return null;
};

export const logoutFirebase = async () => {
  if (!auth) return;
  localStorage.removeItem('autotrack_has_google_session');
  await signOut(auth);
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
