// אתחול Firebase + Firestore - מסד הנתונים המשותף בענן.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyDxxesLGor5pfMiHbvLHbxozO7vkDleUM4",
  authDomain: "kehila-itcha.firebaseapp.com",
  projectId: "kehila-itcha",
  storageBucket: "kehila-itcha.firebasestorage.app",
  messagingSenderId: "658386371931",
  appId: "1:658386371931:web:bce4c43f1cfa05bd80867e",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// App Check - מוודא שהבקשות מגיעות רק מהאתר האמיתי שלנו (חוסם בוטים/סורקים).
if (typeof window !== "undefined") {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider("6LdeyT0tAAAAAJo3YCVD1KLuiGnKjQH8mLYGYxtk"),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) {
    /* כבר אותחל - מתעלמים */
  }
}

export const db = getFirestore(app);
export const auth = getAuth(app);
