// ===================================================================
//  הגדרות מרכזיות של המערכת – המקום היחיד שצריך לגעת בו.
// ===================================================================
//
//  זו מערכת עצמאית לחלוטין. היא אינה חולקת שום נתון עם אף מערכת אחרת,
//  ויש לה פרויקט Firebase משלה בלבד – זה שמוגדר בקובץ הזה.
//

// --- שמות ומיתוג ---
export const APP_NAME = "אור בהירות הדרך";
export const APP_SUBTITLE = "מאגר שידוכים דבורה לדרמן";
export const APP_SHORT_NAME = "אור בהירות הדרך";
export const APP_TAGLINE = "מיזם להקמת בתים בישראל";
export const APP_DESCRIPTION =
  "מאגר שידוכים דבורה לדרמן – ניהול מועמדים, הצעות שידוך ומשימות צוות";

// כתובת האתר החי. משמשת לבניית הכתובת המלאה של תמונת השיתוף (og:image),
// כדי שהתצוגה המקדימה תופיע נכון כששולחים את הקישור בוואטסאפ.
// יש לעדכן לכתובת האמיתית מיד אחרי ההעלאה הראשונה לאוויר.
export const SITE_URL = "https://or-behirut-haderech.vercel.app";

// הלוגו הרשמי. יושב תחת public/ ומשמש בממשק, באייקון האפליקציה ובשיתופים.
export const LOGO_SRC = "/logo.png";
export const OG_IMAGE_SRC = "/og-image.jpg";

// --- טופס ההרשמה והסדרת דמי הרצינות ---
// טופס חיצוני נקי (Google Form או דומה) שדרכו מזינים נתונים ומסדירים
// את התהליך, באותה מתכונת שסוכמה.
// כל עוד הערך ריק, הכפתורים המובילים אליו פשוט אינם מוצגים.
export const REGISTRATION_FORM_URL = "";
export const PAYMENT_INFO_URL = "";

// --- בעלות המערכת ---
// שתי הכתובות האלה מקבלות הרשאת מנהלת תמיד, גם כשרשימת הצוות במסד הנתונים
// ריקה לגמרי. בלי זה אי אפשר להיכנס למערכת חדשה: כללי האבטחה מרשים לגעת
// ברשימת הצוות רק למי שכבר נמצא בה – ובמערכת חדשה איש אינו נמצא בה.
//
// חשוב: אותן שתי כתובות מופיעות גם ב-firestore.rules (הפונקציה isFounder).
// שינוי כאן מחייב שינוי גם שם, אחרת ההרשאה תיראה נכונה במסך אך תיחסם בשרת.

// ניהול טכנולוגי וראשי – שליטה מלאה בקוד, בפריסה ובנתונים.
export const SUPER_ADMIN_EMAIL = "reut1803@gmail.com";

// מנהלת המאגר – פאנל ניהול מלא בתוך המערכת.
export const DATABASE_MANAGER_EMAIL = "6253322@gmail.com";

export const BOOTSTRAP_ADMIN_EMAILS = [SUPER_ADMIN_EMAIL, DATABASE_MANAGER_EMAIL];

// --- חיבור למסד הנתונים (Firebase) ---
// הערכים האלה מזהים את פרויקט ה-Firebase של המערכת הזו בלבד.
// פרויקט Firebase נפרד ועצמאי של המערכת הזו: or-behirut-haderech.
export const firebaseConfig = {
  apiKey: "AIzaSyBuRzRUiPMwixSu9gYTLqmOcyfMzPaVZkc",
  authDomain: "or-behirut-haderech.firebaseapp.com",
  projectId: "or-behirut-haderech",
  storageBucket: "or-behirut-haderech.firebasestorage.app",
  messagingSenderId: "389907824664",
  appId: "1:389907824664:web:88b60e8623cfe3dba4c36d",
};

// האם כבר הוזנו כאן פרטי חיבור אמיתיים. כל עוד לא – המערכת מציגה את מסך
// הכניסה עם הסבר, במקום להיתקע על מסך ריק בהמתנה למסד נתונים שאינו קיים.
export const isFirebaseConfigured = !firebaseConfig.apiKey.startsWith("__");
