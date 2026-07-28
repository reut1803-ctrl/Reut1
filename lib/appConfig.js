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

// --- המנהלת הראשונה ---
// המייל הזה מקבל הרשאת מנהלת-על תמיד, גם כשרשימת הצוות במסד הנתונים ריקה לגמרי.
// בלי זה אי אפשר היה להיכנס למערכת חדשה: כללי האבטחה מרשים לגשת לרשימת הצוות
// רק למי שכבר נמצא בה - ובמערכת ריקה אף אחד לא נמצא בה.
export const BOOTSTRAP_ADMIN_EMAIL = "reut1803@gmail.com";

// --- חיבור למסד הנתונים (Firebase) ---
// הערכים האלה מזהים את פרויקט ה-Firebase של המערכת הזו בלבד.
export const firebaseConfig = {
  apiKey: "__FIREBASE_API_KEY__",
  authDomain: "__FIREBASE_PROJECT_ID__.firebaseapp.com",
  projectId: "__FIREBASE_PROJECT_ID__",
  storageBucket: "__FIREBASE_PROJECT_ID__.firebasestorage.app",
  messagingSenderId: "__FIREBASE_SENDER_ID__",
  appId: "__FIREBASE_APP_ID__",
};

// האם כבר הוזנו כאן פרטי חיבור אמיתיים. כל עוד לא - המערכת מציגה את מסך
// הכניסה עם הסבר, במקום להיתקע על מסך ריק בהמתנה למסד נתונים שאינו קיים.
export const isFirebaseConfigured = !firebaseConfig.apiKey.startsWith("__");
