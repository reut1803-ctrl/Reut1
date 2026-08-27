// לוגיקת "דורש התייחסות" ו"הזרקור היומי".
//
// שני עקרונות:
//
// 1. הזמן נמדד מול השרת. השדה lastTouchedAt נכתב אך ורק על ידי Firebase
//    (serverTimestamp), ולכן שעון שגוי במכשיר אינו יכול "להזקין" או
//    "להצעיר" כרטיס. גם ה"עכשיו" שמולו משווים מתוקן לפי שעון השרת.
//
// 2. "פעולה אחרונה" אינה רק עריכת הכרטיס. מועמד/ת שנכנס/ה להצעת שידוך,
//    ששלב ההצעה שלו/ה השתנה, או שעלה/תה לסיעור מוחות - טופל/ה לכל דבר,
//    גם אם איש לא נגע בכרטיס עצמו. לכן הפעילות נאספת מכל האוספים
//    שקשורים למועמד/ת, ולא מהכרטיס בלבד. ראו buildActivityIndex.

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

const maxMs = (...values) => values.reduce((best, v) => (toMillis(v) > best ? toMillis(v) : best), 0);

// מתי נגעו בכרטיס עצמו. אם עדיין אין חותמת שרת (כרטיס ותיק שלא נערך
// מאז העדכון) - נופלים לתאריך היצירה, כדי שכרטיס לא ייחשב "טופל עכשיו"
// רק כי השדה חסר.
export function profileTouchedMs(candidate) {
  return maxMs(candidate?.lastTouchedAt, candidate?.createdAt);
}

// מפת פעילות: לכל מזהה מועמד/ת - מועד הפעולה האחרונה שנעשתה בעניינו/ה
// מחוץ לכרטיס עצמו.
//
// חשוב: המפה נבנית מהנתונים הקיימים ולא מדורשת שום כתיבה חדשה. לכן היא
// עובדת גם רטרואקטיבית, על כל ההיסטוריה שכבר במערכת - וזו בדיוק הסיבה
// שכרטיס עם הצעות שידוך פעילות הפסיק להיראות "נטוש".
// (הדרך החלופית - שדה מרוכז שמתעדכן בכל פעולה - מכירה רק אירועים שקרו
//  אחרי התקנתה, ולכן לא הייתה פותרת את מה שכבר קרה בעבר.)
export function buildActivityIndex({ proposals = [], rounds = [], notes = [] } = {}) {
  const index = new Map();
  const bump = (id, ms) => {
    if (!id || !ms) return;
    if ((index.get(id) || 0) < ms) index.set(id, ms);
  };

  // הצעות שידוך: מועד ההקמה, וכל שינוי שלב שנרשם ביומן (כולל "ירד מהפרק")
  proposals.forEach((p) => {
    let latest = toMillis(p.createdAt);
    (p.journal || []).forEach((entry) => {
      const ms = toMillis(entry?.date);
      if (ms > latest) latest = ms;
    });
    bump(p.maleId, latest);
    bump(p.femaleId, latest);
  });

  // סבבי סיעור מוחות: הכנה, שיגור לצוות וכתיבת הסיכום
  const roundCandidate = new Map();
  rounds.forEach((r) => {
    if (r.candidateId) roundCandidate.set(r.id, r.candidateId);
    bump(r.candidateId, maxMs(r.createdAt, r.openedAt, r.summaryAt));
  });

  // כרטיסיות שנכתבו בזירה על אותו/ה מועמד/ת
  notes.forEach((n) => {
    bump(roundCandidate.get(n.roundId), toMillis(n.createdAt));
  });

  return index;
}

// המועד האחרון שבו טופל/ה המועמד/ת - בכרטיס או מחוצה לו
export function lastActivityMs(candidate, activityIndex) {
  const own = profileTouchedMs(candidate);
  const related = activityIndex?.get?.(candidate?.id) || 0;
  return Math.max(own, related);
}

// כמה ימים שלמים עברו. כרטיס בלי שום תאריך מחזיר null - לא יודעים, ולכן לא מסמנים.
export function daysSinceActivity(candidate, now, activityIndex) {
  const ms = lastActivityMs(candidate, activityIndex);
  if (!ms) return null;
  const diff = now - ms;
  if (diff < 0) return 0;
  return Math.floor(diff / DAY_MS);
}

export function needsAttention(candidate, now, activityIndex) {
  const days = daysSinceActivity(candidate, now, activityIndex);
  return days !== null && days >= ATTENTION_DAYS;
}

// בחירת כרטיסי הזרקור.
// 1. אם המנהלת סימנה כרטיסים ידנית - הם הזרקור, והם בלבד.
// 2. אחרת נבחרים אוטומטית עד 4 כרטיסים שלא טופלו 14 יום ומעלה,
//    מהוותיק ביותר להתייחסות ומטה.
export function pickSpotlight(list, now, activityIndex, { max = SPOTLIGHT_MAX } = {}) {
  const manual = (list || []).filter((c) => c.spotlight === true);
  if (manual.length > 0) return manual.slice(0, max);

  return (list || [])
    .filter((c) => {
      const days = daysSinceActivity(c, now, activityIndex);
      return days !== null && days >= SPOTLIGHT_DAYS;
    })
    .sort((a, b) => lastActivityMs(a, activityIndex) - lastActivityMs(b, activityIndex))
    .slice(0, max);
}
