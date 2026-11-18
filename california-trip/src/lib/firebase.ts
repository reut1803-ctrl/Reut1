import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator, getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore,
} from "firebase/firestore";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

// בדיקות בלבד: כשמריצים מול אמולטור מקומי של Firebase (לא פעיל באתר האמיתי).
const emulator = typeof window !== "undefined" && (window as unknown as { __ctEmulators?: boolean }).__ctEmulators === true;

function getApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase is not configured yet");
  }
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  return app;
}

function getDb(): Firestore {
  if (db) return db;
  const a = getApp();
  try {
    // שמירה מקומית בטלפון: האפליקציה ממשיכה לעבוד גם בלי קליטה בדרכים,
    // והשינויים נשלחים כשהחיבור חוזר.
    db = initializeFirestore(a, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    db = getFirestore(a);
  }
  if (emulator) connectFirestoreEmulator(db, "127.0.0.1", 8085);
  return db;
}

function getAuthOnce(): Auth {
  if (auth) return auth;
  auth = getAuth(getApp());
  if (emulator) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    (window as unknown as { __ctTestLogin?: (email: string, name: string) => Promise<void> }).__ctTestLogin = async (email, name) => {
      try { await createUserWithEmailAndPassword(auth!, email, "test-password"); } catch { /* already exists */ }
      const cred = await signInWithEmailAndPassword(auth!, email, "test-password");
      await updateProfile(cred.user, { displayName: name });
      await cred.user.getIdToken(true);
    };
  }
  return auth;
}

export const fb = {
  auth: getAuthOnce,
  db: getDb,
};
