// אתחול Firebase + Firestore - מסד הנתונים המשותף בענן.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDxxesLGor5pfMiHbvLHbxozO7vkDleUM4",
  authDomain: "kehila-itcha.firebaseapp.com",
  projectId: "kehila-itcha",
  storageBucket: "kehila-itcha.firebasestorage.app",
  messagingSenderId: "658386371931",
  appId: "1:658386371931:web:bce4c43f1cfa05bd80867e",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
