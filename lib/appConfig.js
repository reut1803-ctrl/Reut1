// ===================================================================
//  הגדרות מרכזיות של המערכת - המקום היחיד לשנות בו שם וחיבור למסד הנתונים.
// ===================================================================
//
//  זו מערכת עצמאית לחלוטין, שאינה חולקת שום נתון עם אף מערכת אחרת.
//  כל המערכת מדברת עם פרויקט Firebase אחד ויחיד - זה שמוגדר כאן.
//

// --- שם המערכת (מופיע בכותרות, במסכים ובאתר) ---
export const APP_NAME = "אדמה";
export const APP_SUBTITLE = "מאגר השידוכים לחוות גבעות";
export const APP_SHORT_NAME = "אדמה";
export const APP_DESCRIPTION = "מאגר השידוכים לחוות גבעות - ניהול מועמדים, הצעות שידוך ומשימות צוות";

// --- כתובות האתר החי ---
// שתי כתובות, שתיהן קוראות מאותו מסד נתונים. הכתובת הקצרה היא הראשית,
// וזו של GitHub נשארת כגיבוי. הן משמשות לבניית כתובת מוחלטת לתמונת
// התצוגה המקדימה בשיתוף קישור.
export const SITE_URL_VERCEL = "https://adama-gamma.vercel.app";
export const SITE_URL_PAGES = "https://reut1803-ctrl.github.io/adama";

// --- המנהלת הראשונה ---
// המייל הזה מקבל הרשאת מנהלת-על תמיד, גם כשרשימת הצוות במסד הנתונים ריקה לגמרי.
// בלי זה אי אפשר היה להיכנס למערכת חדשה: כללי האבטחה מרשים לגשת לרשימת הצוות
// רק למי שכבר נמצא בה - ובמערכת ריקה אף אחד לא נמצא בה.
export const BOOTSTRAP_ADMIN_EMAIL = "reut1803@gmail.com";

// --- חיבור למסד הנתונים (Firebase) ---
// הערכים האלה מזהים את פרויקט ה-Firebase של המערכת הזו בלבד.
export const firebaseConfig = {
  apiKey: "AIzaSyDfwRLnsRH6bSnVkqee0dxcSPTx7xrTL54",
  authDomain: "adama-afcf2.firebaseapp.com",
  projectId: "adama-afcf2",
  storageBucket: "adama-afcf2.firebasestorage.app",
  messagingSenderId: "76396149262",
  appId: "1:76396149262:web:788f6b48cda8641dce1a5f",
};

// האם כבר הוזנו כאן פרטי חיבור אמיתיים. כל עוד לא - המערכת מציגה את מסך
// הכניסה עם הסבר, במקום להיתקע על מסך ריק בהמתנה למסד נתונים שאינו קיים.
export const isFirebaseConfigured = !firebaseConfig.apiKey.startsWith("__");
