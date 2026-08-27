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
//    שקשורים למועמד/ת, ולא מהכרטיס בלבד. ראו buildAttentionData.
//
// 3. מועמד/ת עם התאמה פעילה לעולם אינו/ה "דורש/ת התייחסות" במסך הפרופילים.
//    יש עליו/ה תהליך פתוח, והמקום לעקוב אחרי תהליך שנתקע הוא מסך השידוכים
//    (שם מוצג החיווי "תקוע X ימים"). שני המסכים לא מתריעים על אותו דבר.

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
export function buildAttentionData({ proposals = [], rounds = [], notes = [], droppedStatus = "" } = {}) {
  const activity = new Map();
  // מזהי המועמדים שיש להם התאמה פתוחה כרגע
  const activeMatches = new Set();

  const bump = (id, ms) => {
    if (!id || !ms) return;
    if ((activity.get(id) || 0) < ms) activity.set(id, ms);
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

    // הצעה פעילה = כל מה שלא ירד מהפרק ואינו רשומת היסטוריה ישנה
    if (p.status !== droppedStatus && !p.isHistory) {
      if (p.maleId) activeMatches.add(p.maleId);
      if (p.femaleId) activeMatches.add(p.femaleId);
    }
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

  return { activity, activeMatches };
}

// יש למועמד/ת תהליך שידוך פתוח?
export function hasActiveMatch(candidate, data) {
  return !!data?.activeMatches?.has?.(candidate?.id);
}

// המועד האחרון שבו טופל/ה המועמד/ת - בכרטיס או מחוצה לו
export function lastActivityMs(candidate, data) {
  const own = profileTouchedMs(candidate);
  const related = data?.activity?.get?.(candidate?.id) || 0;
  return Math.max(own, related);
}

// כמה ימים שלמים עברו. כרטיס בלי שום תאריך מחזיר null - לא יודעים, ולכן לא מסמנים.
export function daysSinceActivity(candidate, now, data) {
  const ms = lastActivityMs(candidate, data);
  if (!ms) return null;
  const diff = now - ms;
  if (diff < 0) return 0;
  return Math.floor(diff / DAY_MS);
}

// חיווי "דורש התייחסות" במסך הפרופילים.
// התאמה פעילה מבטלת את החיווי לגמרי: יש תהליך פתוח, וגם אם הוא מתעכב -
// הדיווח עליו שייך למסך השידוכים ולא לכרטיס במאגר.
export function needsAttention(candidate, now, data) {
  if (hasActiveMatch(candidate, data)) return false;
  const days = daysSinceActivity(candidate, now, data);
  return days !== null && days >= ATTENTION_DAYS;
}

// בחירת כרטיסי הזרקור.
// 1. אם המנהלת סימנה כרטיסים ידנית - הם הזרקור, והם בלבד.
// 2. אחרת נבחרים אוטומטית עד 4 כרטיסים שלא טופלו 14 יום ומעלה,
//    מהוותיק ביותר להתייחסות ומטה.
export function pickSpotlight(list, now, data, { max = SPOTLIGHT_MAX } = {}) {
  const manual = (list || []).filter((c) => c.spotlight === true);
  if (manual.length > 0) return manual.slice(0, max);

  return (list || [])
    // מי שיש עליו/ה תהליך פתוח אינו/ה "נשכח/ת", ולכן אינו/ה נכנס/ת לזרקור
    // האוטומטי - בדיוק מאותו טעם שהתגית אינה מוצגת עליו/ה במאגר.
    .filter((c) => !hasActiveMatch(c, data))
    .filter((c) => {
      const days = daysSinceActivity(c, now, data);
      return days !== null && days >= SPOTLIGHT_DAYS;
    })
    .sort((a, b) => lastActivityMs(a, data) - lastActivityMs(b, data))
    .slice(0, max);
}

// --- חיווי "תקוע" במסך השידוכים ---
// כמה ימים עברו מאז שינוי הסטטוס האחרון של ההצעה. כל שינוי שלב נרשם ביומן,
// ולכן הרשומה האחרונה ביומן היא מועד השינוי האחרון. הצעה בלי יומן נמדדת
// לפי מועד ההקמה שלה.
export const STUCK_DAYS = 7;

export function lastStatusChangeMs(proposal) {
  let latest = toMillis(proposal?.createdAt);
  (proposal?.journal || []).forEach((entry) => {
    const ms = toMillis(entry?.date);
    if (ms > latest) latest = ms;
  });
  return latest;
}

export function daysSinceStatusChange(proposal, now) {
  const ms = lastStatusChangeMs(proposal);
  if (!ms) return null;
  const diff = now - ms;
  if (diff < 0) return 0;
  return Math.floor(diff / DAY_MS);
}

export function isProposalStuck(proposal, now) {
  const days = daysSinceStatusChange(proposal, now);
  return days !== null && days >= STUCK_DAYS;
}

// האם כבר נשלח נדנוד על העיכוב הנוכחי. נדנוד "מתאפס" ברגע שהסטטוס משתנה,
// כי מאותו רגע מדובר בעיכוב חדש.
export function wasNudged(proposal) {
  const nudged = toMillis(proposal?.nudgedAt);
  return nudged > 0 && nudged >= lastStatusChangeMs(proposal);
}
