// היסטוריית גרסאות של תוכן הטופס.
//
// שמירה בלוח הבקרה דורסת את הגרסה הקודמת, ועד כה לא הייתה שום דרך
// לחזור אחורה. טעות אחת - מחיקת נוסח, כיבוי שאלה, מחיקת נספח - הייתה
// סופית. זו הייתה הנקודה המסוכנת ביותר במערכת, והיא גם מה שמנע
// להתנסות בחופשיות.
//
// הפתרון: לפני כל דריסה, הגרסה שנדרסת נשמרת בצד. הגרסאות יושבות
// באותו אוסף (publicContent) עם קידומת מזהה, ולכן אינן דורשות שינוי
// בכללי האבטחה - הכתיבה שם שמורה למנהלת ממילא. המנוי החי מאזין למסמך
// "form" בלבד, ולכן הגרסאות אינן משפיעות על שום מסך.
//
// הקובץ טהור: אין בו React ואין בו Firebase.

export const HISTORY_PREFIX = "history-";

// כמה גרסאות לשמור. עשרים הן כמה שבועות של עבודה אמיתית, ורחוק מאוד
// מכל מגבלה של מסד הנתונים.
export const KEEP_VERSIONS = 20;

export const isHistoryId = (id) => typeof id === "string" && id.startsWith(HISTORY_PREFIX);

// מזהה שממיין את עצמו: זמן ISO בסדר עולה הוא גם סדר אלפביתי עולה.
// הסיומת האקראית מונעת התנגשות בשתי שמירות באותה שנייה.
export const historyId = (at = new Date()) =>
  `${HISTORY_PREFIX}${new Date(at).toISOString().replace(/[.:]/g, "-")}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;

// הרשומה שנשמרת. content הוא הגרסה שנדרסת ברגע זה.
export function historyEntry(content, user, at = new Date()) {
  // ברירת מחדל ב-= חלה רק על undefined, ולא על null. כאן מגיע מי
  // שמחובר, ושמירה לא תיפול בגלל ערך חסר.
  const who = user && typeof user === "object" ? user : {};
  const when = new Date(at);
  return {
    kind: "history",
    savedAt: (Number.isNaN(when.getTime()) ? new Date() : when).toISOString(),
    savedBy: String(who.email || "").trim().toLowerCase(),
    savedByName: String(who.name || "").trim(),
    content: content && typeof content === "object" ? content : {},
  };
}

// מהחדשה לישנה
export const sortVersions = (list = []) =>
  [...(Array.isArray(list) ? list : [])]
    .filter((v) => v && isHistoryId(v.id))
    .sort((a, b) => String(b.savedAt || "").localeCompare(String(a.savedAt || "")));

// אילו גרסאות למחוק כדי לא לצבור בלי סוף. תמיד הישנות ביותר.
export const versionsToPrune = (list = [], keep = KEEP_VERSIONS) =>
  sortVersions(list)
    .slice(Math.max(0, keep))
    .map((v) => v.id);

const two = (n) => String(n).padStart(2, "0");
const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// תיאור בעברית, כפי שאדם היה אומר אותו
export function describeVersion(savedAt, now = new Date()) {
  const d = new Date(savedAt);
  if (!savedAt || Number.isNaN(d.getTime())) return "תאריך לא ידוע";
  const time = `${two(d.getHours())}:${two(d.getMinutes())}`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameDay(d, now)) return `היום ב-${time}`;
  if (sameDay(d, yesterday)) return `אתמול ב-${time}`;
  return `${two(d.getDate())}/${two(d.getMonth() + 1)}/${d.getFullYear()} ב-${time}`;
}

// מה בדיוק השתנה בין שתי גרסאות, בעברית. לא דיווח טכני אלא משפט
// שאפשר להחליט לפיו אם לשחזר.
export function summarizeChange(before = {}, after = {}) {
  const parts = [];
  const countQuestions = (c) => (Array.isArray(c?.questions) ? c.questions.length : 0);
  const countOff = (c) =>
    Object.values(c?.items || {}).filter((o) => o && o.enabled === false).length;

  const dq = countQuestions(after) - countQuestions(before);
  if (dq > 0) parts.push(`נוספו ${dq} שאלות`);
  if (dq < 0) parts.push(`נמחקו ${-dq} שאלות`);

  const doff = countOff(after) - countOff(before);
  if (doff > 0) parts.push(`כובו ${doff} שאלות`);
  if (doff < 0) parts.push(`הודלקו ${-doff} שאלות`);

  const texts = ["intro", "thankYou", "texts", "legal", "payment"];
  if (texts.some((k) => JSON.stringify(before?.[k]) !== JSON.stringify(after?.[k]))) {
    parts.push("שונו טקסטים");
  }
  if (JSON.stringify(before?.tags) !== JSON.stringify(after?.tags)) parts.push("שונו תוויות");
  if (JSON.stringify(before?.order) !== JSON.stringify(after?.order)) parts.push("שונה הסדר");
  if (parts.length === 0 && JSON.stringify(before) !== JSON.stringify(after)) parts.push("שינויים בנוסח");

  return parts.join(" · ");
}
