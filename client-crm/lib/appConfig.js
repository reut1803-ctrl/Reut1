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

// --- המנהלת הראשונה ---
// המייל הזה מקבל הרשאת מנהלת-על תמיד, גם כשרשימת הצוות במסד הנתונים ריקה.
// בלי זה אי אפשר להיכנס למערכת חדשה: כללי האבטחה מרשים לקרוא את רשימת
// הצוות רק למי שכבר נמצא בה – ובמערכת חדשה איש אינו נמצא בה.
export const BOOTSTRAP_ADMIN_EMAIL = "__MAIL_SHEL_HALAKOHA__";

// --- חיבור למסד הנתונים (Firebase) ---
// הערכים האלה מזהים את פרויקט ה-Firebase של המערכת הזו בלבד.
// יש להחליף אותם בפרטים של פרויקט Firebase חדש ונפרד של הלקוחה.
export const firebaseConfig = {
  apiKey: "__API_KEY__",
  authDomain: "__PROJECT_ID__.firebaseapp.com",
  projectId: "__PROJECT_ID__",
  storageBucket: "__PROJECT_ID__.firebasestorage.app",
  messagingSenderId: "__SENDER_ID__",
  appId: "__APP_ID__",
};

// האם כבר הוזנו כאן פרטי חיבור אמיתיים. כל עוד לא – המערכת מציגה את מסך
// הכניסה עם הסבר, במקום להיתקע על מסך ריק בהמתנה למסד נתונים שאינו קיים.
export const isFirebaseConfigured = !firebaseConfig.apiKey.startsWith("__");
