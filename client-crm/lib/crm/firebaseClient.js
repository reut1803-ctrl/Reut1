// חיבור Firebase של המערכת הזו בלבד.
// פרטי החיבור מוגדרים במקום אחד יחיד: lib/appConfig.js.
// אין כאן שום קשר לאף פרויקט או מערכת אחרת.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { firebaseConfig } from "@/lib/appConfig";

const crmApp = getApps().find((a) => a.name === "crm") || initializeApp(firebaseConfig, "crm");

// חלק מרשתות הסלולר, רשתות ארגוניות ודפדפנים ניידים חוסמים את ערוץ התקשורת
// המהיר של Firestore. במצב כזה הנתונים פשוט לא מגיעים, והמשתמש/ת מקבל/ת מסך
// "לא הצלחנו לאמת את ההרשאה" למרות שההרשאה תקינה לגמרי.
// ההגדרה הזו מאתרת חסימה כזו לבד ועוברת אוטומטית לשיטת תקשורת שעוברת בכל רשת.
function createDb() {
  try {
    return initializeFirestore(crmApp, { experimentalAutoDetectLongPolling: true });
  } catch {
    // אם החיבור כבר אותחל (למשל בטעינה חוזרת בפיתוח) משתמשים בקיים
    return getFirestore(crmApp);
  }
}

export const crmDb = createDb();
export const crmAuth = getAuth(crmApp);
export const googleProvider = new GoogleAuthProvider();
