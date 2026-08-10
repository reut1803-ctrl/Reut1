// קבועי בחירה (רשימות בחירה בטפסים) וברירות מחדל טקסטואליות בלבד.
// נתוני מועמדים, צוות, משימות והצעות חיים כעת ב-Firestore (ראו lib/crm/firebaseClient.js ו-lib/crm/store.js).

export const REGIONS = ["ירושלים", "בנימין", "יהודה", "שומרון", "מרכז", "שפלה", "שרון", "דרום", "צפון"];

// סגנון חיים והשקפה - בחירה מרובה. משמש הן בכרטיס המועמד/ת והן בסינון
// במבחן ההתאמות, ולכן הרשימה חייבת להיות אחת ומשותפת לשניהם.
// סגנון חיים והשקפה. הרשימה שונה בין המאגרים, כי מה שמאפיין בחורה
// אינו מה שמאפיין בחור. "לא משנה" רלוונטי רק במבחן ההתאמות, כבחירה
// שמבטלת את הסינון לפי סגנון חיים.
export const LIFESTYLE_TAGS_FEMALE = [
  "חווה",
  "גבעה",
  "כיסוי ראש מלא",
  "חצי כיסוי",
  "מכנסיים",
  "לבוש צנוע",
  "לא משנה",
];
export const LIFESTYLE_TAGS_MALE = ["חווה", "גבעה", "פאות", "בלי פאות", "עשה צבא", "אברך בישיבה", "לא משנה"];
export const lifestyleTagsFor = (gender) => (gender === "female" ? LIFESTYLE_TAGS_FEMALE : LIFESTYLE_TAGS_MALE);

// הרשימה המלאה - לזיהוי בטקסט חופשי ולתאימות לאחור
export const LIFESTYLE_TAGS = Array.from(
  new Set([...LIFESTYLE_TAGS_FEMALE, ...LIFESTYLE_TAGS_MALE].filter((t) => t !== "לא משנה"))
);

export const RELIGIOUS_LEVELS_MALE = ["חרד\"ל", "חסידי", "תורני", "דתי", "הכל"];
export const RELIGIOUS_LEVELS_FEMALE = ["חרד\"לית", "חסידית", "תורנית", "דתייה", "הכל"];
export const religiousLevelsFor = (gender) => (gender === "female" ? RELIGIOUS_LEVELS_FEMALE : RELIGIOUS_LEVELS_MALE);

// מסלול השכלה/עיסוק - למאגר הבנות בלבד (לבנים יש YESHIVA_LEVELS נפרד)
export const EDUCATION_OPTIONS = ["תיכון", "אולפנה", "מדרשה", "שירות", "סמינר", "תואר ראשון", "תואר שני", "עובדת ולומדת", "עובדת", "לא משנה"];
export const YESHIVA_LEVELS = ["ישיבה גבוהה", "הסדר", "צבא", "עובד ולומד", "עובד", "תואר ראשון", "תואר שני", "תעודה", "לא משנה"];

// --- עיסוק ורקע: בחירה מרובה (תגיות) ---
// החליף את "רמת לימוד" / "השכלה" שהיו בחירה יחידה. אדם עושה כמה דברים בחייו,
// ולכן אפשר לסמן כמה תגיות במקביל. אותה רשימה בדיוק משמשת את כרטיס המועמד/ת
// ואת מבחן ההתאמות, כדי שההתאמה תיבדק מול כל מה שסומן ולא מול ערך יחיד.
export const OCCUPATION_TAGS_MALE = [
  "ישיבה גבוהה",
  "ישיבת הסדר",
  "כולל / אברך",
  "מכינה",
  "צבא",
  "שירות לאומי",
  "עבודה",
  "תואר ראשון",
  "תואר שני",
  "תעודה מקצועית",
];
export const OCCUPATION_TAGS_FEMALE = [
  "סמינר",
  "מדרשה",
  "אולפנה",
  "תיכון",
  "שירות לאומי",
  "צבא",
  "עבודה",
  "תואר ראשון",
  "תואר שני",
  "תעודה מקצועית",
];
export const occupationTagsFor = (gender) => (gender === "female" ? OCCUPATION_TAGS_FEMALE : OCCUPATION_TAGS_MALE);

// הרשימה המאוחדת - לזיהוי בטקסט חופשי (הזנה חכמה) ולתאימות לאחור
export const OCCUPATION_TAGS = Array.from(new Set([...OCCUPATION_TAGS_MALE, ...OCCUPATION_TAGS_FEMALE]));

// תרגום הערכים הישנים (בחירה יחידה) לתגיות החדשות, כדי שכרטיסים ותיקים
// ימשיכו להיקרא נכון גם בתצוגה וגם במבחן ההתאמות - בלי לגעת בנתונים בשרת.
const LEGACY_OCCUPATION_MAP = {
  "הסדר": "ישיבת הסדר",
  "עובד": "עבודה",
  "עובדת": "עבודה",
  "עובד ולומד": "עבודה",
  "עובדת ולומדת": "עבודה",
  "תעודה": "תעודה מקצועית",
  "שירות": "שירות לאומי",
  "אברך": "כולל / אברך",
  "כולל": "כולל / אברך",
};

// התגיות של כרטיס מסוים. מקור האמת הוא שדה occupations החדש; אם הוא ריק
// (כרטיס ותיק), נגזרות התגיות מהשדה הישן. "לא משנה" אינו עיסוק ולכן מושמט.
export function occupationsOf(candidate) {
  const tags = candidate?.occupations;
  if (Array.isArray(tags) && tags.length > 0) return tags.filter(Boolean);
  const legacy = candidate?.gender === "female" ? candidate?.education : candidate?.yeshivaLevel;
  if (!legacy || legacy === "לא משנה") return [];
  return [LEGACY_OCCUPATION_MAP[legacy] || legacy];
}

// מקום המגורים להצגה: תמיד היישוב המדויק שהוזן בכרטיס. אם הוא ריק (כרטיס ותיק
// או שורה מיובאת בלי עמודת עיר), נופלים לאזור הגיאוגרפי כדי שלא תישאר שורה ריקה.
export function locationOf(candidate) {
  return String(candidate?.city || "").trim() || candidate?.region || "";
}

export const SMOKING_OPTIONS_MALE = ["לא מעשן - חובה", "לא מפריע לי", "לא משנה"];
export const SMOKING_OPTIONS_FEMALE = ["לא מעשנת - חובה", "לא מפריע לי", "לא משנה"];
export const smokingOptionsFor = (gender) => (gender === "female" ? SMOKING_OPTIONS_FEMALE : SMOKING_OPTIONS_MALE);

export const TRAITS = ["הומור", "רוגע", "משפחתיות", "רגישות", "שאפתנות", "רוחניות", "ביטחון עצמי", "מנהיגות"];

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
