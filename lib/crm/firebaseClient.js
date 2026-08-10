// חיבור Firebase נפרד לגמרי למערכת ה-CRM - פרויקט "tzevet-shiduchim".
// אין שום קשר לפרויקט Firebase של האתר הישן (kehila-itcha, ב-lib/firebase.js).
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBKVXp-sbfm-ZfSSmSYKiWcepTEsF_UXNY",
  authDomain: "tzevet-shiduchim.firebaseapp.com",
  projectId: "tzevet-shiduchim",
  storageBucket: "tzevet-shiduchim.firebasestorage.app",
  messagingSenderId: "11266468746",
  appId: "1:11266468746:web:a1513741048e3c600c7673",
  measurementId: "G-JF31LK43CQ",
};

const crmApp = getApps().find((a) => a.name === "crm") || initializeApp(firebaseConfig, "crm");

export const crmDb = getFirestore(crmApp);
export const crmAuth = getAuth(crmApp);
export const googleProvider = new GoogleAuthProvider();
