// חיבור Firebase נפרד לגמרי למערכת ה-CRM - פרויקט "tzevet-shiduchim".
// אין שום קשר לפרויקט Firebase של האתר הישן (kehila-itcha, ב-lib/firebase.js).
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
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

// חלק מרשתות הסלולר, רשתות ארגוניות ודפדפנים ניידים חוסמים את ערוץ התקשורת
// המהיר של Firestore. במצב כזה הנתונים פשוט לא מגיעים, ואיש/אשת צוות מאושר/ת
// מקבל/ת מסך "החיבור לשרת לא הצליח" למרות שההרשאה תקינה לחלוטין.
//
// קודם לכן ניסינו זיהוי אוטומטי של חסימה כזו. הזיהוי עצמו מבוסס על בדיקה
// ראשונית, והוא נכשל בדיוק ברשתות הבעייתיות שבגללן הוא נוסף - ולכן החיבור
// נתקע במקום לעבור לשיטה החלופית.
// כאן כבר לא מנחשים: החיבור עובד תמיד בשיטה שעוברת בכל רשת. היא מעט פחות
// יעילה, אבל אמינה - וזה מה שחשוב כשאיש צוות מנסה להיכנס מהשטח.
function createDb() {
  try {
    return initializeFirestore(crmApp, { experimentalForceLongPolling: true });
  } catch {
    // אם החיבור כבר אותחל (למשל בטעינה חוזרת בפיתוח) משתמשים בקיים
    return getFirestore(crmApp);
  }
}

export const crmDb = createDb();
export const crmAuth = getAuth(crmApp);
export const googleProvider = new GoogleAuthProvider();
