// לוגיקת "דורש התייחסות" ו"הזרקור היומי".
//
// עיקרון מרכזי: כל חישוב הזמן כאן נשען על חותמות זמן של השרת.
// שדה lastTouchedAt נכתב אך ורק על ידי Firebase עצמו (serverTimestamp),
// ולכן שעון שגוי במכשיר של איש/אשת צוות אינו יכול "להזקין" או "להצעיר"
// כרטיס. גם ה"עכשיו" שמולו משווים מתוקן לפי שעון השרת (ראו serverNow בחנות).

// כמה ימים בלי טיפול עד שכרטיס מסומן כדורש התייחסות
export const ATTENTION_DAYS = 5;

// כמה ימים בלי טיפול עד שכרטיס נכנס אוטומטית לזרקור היומי
export const SPOTLIGHT_DAYS = 14;

// כמה כרטיסים לכל היותר יופיעו בזרקור
export const SPOTLIGHT_MAX = 4;

const DAY_MS = 24 * 60 * 60 * 1000;

// המרה של כל צורת תאריך אפשרית למספר מילישניות.
// חותמת שרת מגיעה כאובייקט Timestamp של Firestore, ותאריכים ותיקים
// נשמרו בעבר כמחרוזת טקסט. שני המקרים נתמכים.
export function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

// מתי הכרטיס טופל בפעם האחרונה.
// אם עדיין אין חותמת שרת (כרטיס ותיק שלא נגעו בו מאז העדכון) - נופלים
// לתאריך היצירה, כדי שכרטיס לא ייחשב "טופל עכשיו" רק כי השדה חסר.
export function lastTouchedMs(candidate) {
  return toMillis(candidate?.lastTouchedAt) || toMillis(candidate?.createdAt);
}

// כמה ימים שלמים עברו. כרטיס בלי שום תאריך מחזיר null - לא יודעים, ולכן לא מסמנים.
export function daysSinceTouch(candidate, now) {
  const ms = lastTouchedMs(candidate);
  if (!ms) return null;
  const diff = now - ms;
  if (diff < 0) return 0;
  return Math.floor(diff / DAY_MS);
}

export function needsAttention(candidate, now) {
  const days = daysSinceTouch(candidate, now);
  return days !== null && days >= ATTENTION_DAYS;
}

// בחירת כרטיסי הזרקור.
// 1. אם המנהלת סימנה כרטיסים ידנית - הם הזרקור, והם בלבד.
// 2. אחרת נבחרים אוטומטית עד 4 כרטיסים שלא נגעו בהם 14 יום ומעלה,
//    מהוותיק ביותר להתייחסות ומטה.
export function pickSpotlight(list, now, { max = SPOTLIGHT_MAX } = {}) {
  const manual = (list || []).filter((c) => c.spotlight === true);
  if (manual.length > 0) return manual.slice(0, max);

  return (list || [])
    .filter((c) => {
      const days = daysSinceTouch(c, now);
      return days !== null && days >= SPOTLIGHT_DAYS;
    })
    .sort((a, b) => lastTouchedMs(a) - lastTouchedMs(b))
    .slice(0, max);
}
