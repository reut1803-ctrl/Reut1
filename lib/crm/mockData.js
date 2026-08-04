// קבועי בחירה (רשימות בחירה בטפסים) וברירות מחדל טקסטואליות בלבד.
// נתוני מועמדים, צוות, משימות והצעות חיים כעת ב-Firestore (ראו lib/crm/firebaseClient.js ו-lib/crm/store.js).

export const REGIONS = ["ירושלים", "בנימין", "יהודה", "שומרון", "מרכז", "שפלה", "שרון", "דרום", "צפון"];

// סגנון חיים והשקפה - בחירה מרובה. משמש הן בכרטיס המועמד/ת והן בסינון
// במבחן ההתאמות, ולכן הרשימה חייבת להיות אחת ומשותפת לשניהם.
export const LIFESTYLE_TAGS = ["חווה", "גבעה", "פאות", "בלי פאות", "עשה צבא", "אברך בישיבה"];

export const RELIGIOUS_LEVELS_MALE = ["חרד\"ל", "חסידי", "תורני", "דתי", "הכל"];
export const RELIGIOUS_LEVELS_FEMALE = ["חרד\"לית", "חסידית", "תורנית", "דתייה", "הכל"];
export const religiousLevelsFor = (gender) => (gender === "female" ? RELIGIOUS_LEVELS_FEMALE : RELIGIOUS_LEVELS_MALE);

// מסלול השכלה/עיסוק - למאגר הבנות בלבד (לבנים יש YESHIVA_LEVELS נפרד)
export const EDUCATION_OPTIONS = ["תיכון", "אולפנה", "מדרשה", "שירות", "סמינר", "תואר ראשון", "תואר שני", "עובדת ולומדת", "עובדת", "לא משנה"];
export const YESHIVA_LEVELS = ["ישיבה גבוהה", "הסדר", "צבא", "עובד ולומד", "עובד", "תואר ראשון", "תואר שני", "תעודה", "לא משנה"];

export const SMOKING_OPTIONS_MALE = ["לא מעשן - חובה", "לא מפריע לי", "לא משנה"];
export const SMOKING_OPTIONS_FEMALE = ["לא מעשנת - חובה", "לא מפריע לי", "לא משנה"];
export const smokingOptionsFor = (gender) => (gender === "female" ? SMOKING_OPTIONS_FEMALE : SMOKING_OPTIONS_MALE);

export const TRAITS = ["הומור", "רוגע", "משפחתיות", "רגישות", "שאפתנות", "רוחניות", "ביטחון עצמי", "מנהיגות"];

// תוויות סינון למאגר המועמדים - סקלת גוונים אחת ממשפחת הצבע הראשי של המערכת, מהכהה לבהיר
export const CANDIDATE_TAGS = [
  { name: "תורני", color: "#4A2523", textColor: "#FFFFFF" },
  { name: 'דתל"שים ומסורתיים', color: "#5E2F2D", textColor: "#FFFFFF" },
  { name: 'חב"ד', color: "#844442", textColor: "#FFFFFF" },
  { name: "ברסלב", color: "#A85D50", textColor: "#3A2E26" },
  { name: "פרק ב'", color: "#C9A79A", textColor: "#3A2E26" },
];

export const DEFAULT_TERMS_TEXT = `נהלי עבודה וסודיות - צוות השידוכים

1. כל מידע אישי על מועמדים ומועמדות (שמות, טלפונים, תמונות, הקלטות, תעודות זהות) חסוי ואסור בשיתוף מחוץ לצוות.
2. אין להעביר פרטי קשר של מועמד/ת לצד שלישי ללא אישור מפורש מהמנהלת.
3. יש לעדכן סטטוס ותיעוד בכרטיס המועמד/ת באופן שוטף ומיידי לאחר כל שיחה או פגישה.
4. פנייה למועמדים תיעשה בשפה מכבדת ורגישה בכל שלב בתהליך.

באישור התיבה למטה, הנך מאשר/ת שקראת את הנהלים ומתחייב/ת לפעול לפיהם.`;

export const DEFAULT_DAILY_TIP =
  "טיפ השבוע: בשיחה ראשונה עם מועמד/ת חדש/ה, התחילו בשאלות פתוחות על התחביבים והיומיום שלהם לפני שעוברים לשאלות על ציפיות מבן/בת הזוג - זה בונה אמון ומוציא תשובות אמיתיות יותר.";

export const DEFAULT_SERVICE_TYPES = [
  { name: "שיחת סינון", price: 150, commission: 40 },
  { name: "מסלול עומק", price: 600, commission: 150 },
];

export const PAYMENT_STATUSES = ["ממתין לתשלום", "שולם"];
