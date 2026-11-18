import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore,
} from "firebase/firestore";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config";

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

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
  return db;
}

export const fb = {
  auth: (): Auth => getAuth(getApp()),
  db: getDb,
};
