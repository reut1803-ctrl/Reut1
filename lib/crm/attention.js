// לוגיקת הזמנים של המערכת: חלון התצוגה של הצעה שירדה מהפרק, וזיהוי עיכובים.
//
// עיקרון מנחה: כל חישוב זמן נעשה בזמן התצוגה מול חותמות שנשמרו,
// ולא נשמר בשדה סטטי במסד הנתונים. שדה סטטי היה יוצא מסנכרון ברגע
// שהשעה עוברת בלי שאיש פותח את המסך, והמצב היה משתנה רק בטעינה הבאה.

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// המרה של כל צורת תאריך אפשרית למספר מילישניות.
// חותמת שרת מגיעה כאובייקט Timestamp של Firestore, ותאריכים במערכת
// נשמרים כמחרוזת ISO. שני המקרים נתמכים, וכך גם רשומות ותיקות.
export function toMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

// --- חלון התצוגה של הצעה שירדה מהפרק ---
//
// הצעה שירדה מהפרק ממשיכה להופיע במסכי הניהול השוטף במשך 48 שעות בדיוק,
// עם חיווי כמה זמן נותר, ואז נעלמת מהם כדי שהמסך יישאר נקי.
//
// חשוב מאוד: זו הסתרה בתצוגה בלבד. ההצעה עצמה נשמרת במסד הנתונים לתמיד,
// וכך התראת הכפילות ("הצעה בין השניים האלה כבר עלתה וירדה") ממשיכה לעבוד
// גם שנים אחר כך. מי שקורא/ת את הקוד הזה: אין למחוק כאן שום רשומה.
export const DROPPED_VISIBLE_MS = 48 * HOUR_MS;

// מתי בדיוק ירדה ההצעה מהפרק - לפי הרשומה האחרונה ביומן שבה נקבע הסטטוס הזה.
// אם אין רשומה כזו (למשל היסטוריה שהוזנה ידנית), נופלים למועד ההקמה.
export function droppedAtMs(proposal, droppedStatus) {
  let latest = 0;
  (proposal?.journal || []).forEach((entry) => {
    if (entry?.status !== droppedStatus) return;
    const ms = toMillis(entry?.date);
    if (ms > latest) latest = ms;
  });
  return latest || toMillis(proposal?.createdAt);
}

// האם להציג את ההצעה במסך הניהול השוטף.
// כל מה שלא ירד מהפרק מוצג תמיד. מה שירד - רק ב-48 השעות הראשונות.
export function isProposalRowVisible(proposal, now, droppedStatus) {
  if (proposal?.status !== droppedStatus) return true;
  const ms = droppedAtMs(proposal, droppedStatus);
  if (!ms) return false;
  return now - ms < DROPPED_VISIBLE_MS;
}

// כמה שעות שלמות נותרו עד שהשורה תיעלם - לחיווי עדין למשתמש/ת
export function droppedHoursLeft(proposal, now, droppedStatus) {
  const ms = droppedAtMs(proposal, droppedStatus);
  if (!ms) return 0;
  return Math.max(0, Math.ceil((ms + DROPPED_VISIBLE_MS - now) / HOUR_MS));
}

// טקסט החיווי שמופיע על הצעה שירדה, כל עוד היא בחלון התצוגה
export function droppedNoticeText(proposal, now, droppedStatus) {
  const hours = droppedHoursLeft(proposal, now, droppedStatus);
  if (hours <= 0) return "";
  // תמיד בשעות: החלון כולו 48 שעות, ו"בעוד יומיים" היה מטעה כשנותרו 47 שעות
  if (hours <= 1) return "יורד מהתצוגה בעוד פחות משעה";
  return `יורד מהתצוגה בעוד ${hours} שעות`;
}

// --- התראת כפילות ---
// נבדקת מול כל ההיסטוריה במסד הנתונים, כולל הצעות שכבר אינן מוצגות.
// זו בדיוק הסיבה שאסור למחוק הצעות שירדו מהפרק.
export function pastProposalsForPair(proposals, maleId, femaleId) {
  if (!maleId || !femaleId) return [];
  return (proposals || [])
    .filter((p) => p.maleId === maleId && p.femaleId === femaleId)
    .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
}
