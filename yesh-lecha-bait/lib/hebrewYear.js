// ============================================================================
//  שנה עברית, כיתה, גיל וטלפונים — לוגיקה טהורה.
//  הועתק מ"הקהילה איתך" (lib/contactSheet.js) כפי שהוא. הקוד המקורי לא שונה.
// ============================================================================

const GEM = { א: 1, ב: 2, ג: 3, ד: 4, ה: 5, ו: 6, ז: 7, ח: 8, ט: 9, י: 10, כ: 20, ך: 20, ל: 30, מ: 40, ם: 40, נ: 50, ן: 50, ס: 60, ע: 70, פ: 80, ף: 80, צ: 90, ץ: 90, ק: 100, ר: 200, ש: 300, ת: 400 };
const gematria = (s) => [...(s || "")].reduce((n, ch) => n + (GEM[ch] || 0), 0);

// השנה העברית הנוכחית (למשל 5787 = תשפ"ז), לפי לוח השנה של הדפדפן.
export function currentHebrewYear(date = new Date()) {
  try {
    const y = parseInt(new Intl.DateTimeFormat("en-u-ca-hebrew", { year: "numeric" }).format(date).replace(/\D/g, ""), 10);
    if (y > 5700 && y < 5900) return y;
  } catch (e) {}
  return date.getFullYear() + 3760 + (date.getMonth() >= 8 ? 1 : 0);
}

// "תשפ"ב" -> 5782 (null אם לא נראה כמו שנה סבירה)
export function parseHebrewYear(s) {
  const letters = (s || "").replace(/[^א-ת]/g, "");
  if (!letters.startsWith("ת")) return null;
  const y = 5000 + gematria(letters);
  return y >= 5740 && y <= 5800 ? y : null;
}

// "ח" -> 8, "יא" -> 11
export function parseGrade(s) {
  const g = gematria((s || "").replace(/[^א-ת]/g, ""));
  return g >= 1 && g <= 12 ? g : null;
}

export const GRADE_LETTERS = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "יא", "יב"];

export function hebrewYearLabel(y) {
  if (!y) return "";
  let n = y - 5000; let out = "";
  for (const [ch, v] of [["ת", 400], ["ש", 300], ["ר", 200], ["ק", 100], ["צ", 90], ["פ", 80], ["ע", 70], ["ס", 60], ["נ", 50], ["מ", 40], ["ל", 30], ["כ", 20], ["י", 10], ["ט", 9], ["ח", 8], ["ז", 7], ["ו", 6], ["ה", 5], ["ד", 4], ["ג", 3], ["ב", 2], ["א", 1]]) {
    while (n >= v) { out += ch; n -= v; }
  }
  out = out.replace("יה", "טו").replace("יו", "טז");
  return out.length > 1 ? `${out.slice(0, -1)}"${out.slice(-1)}` : `${out}'`;
}

// גיל משוער כיום: בכיתה ח' הילדים בני 13–14; מוסיפים את מספר השנים שעברו.
export function estimateAge(grade, year, nowYear = currentHebrewYear()) {
  if (!grade || !year) return null;
  const low = grade + 5 + (nowYear - year);
  return low > 0 ? { low, high: low + 1 } : null;
}

// ---------- טלפונים ----------
export function normalizePhone(raw) {
  let d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("972")) d = "0" + d.slice(3);
  if (/^5\d{8}$/.test(d)) d = "0" + d;
  if (!(/^05\d{8}$/.test(d) || /^0[2-489]\d{7}$/.test(d) || /^07\d{8}$/.test(d))) return "";
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 2)}-${d.slice(2)}`;
}
export const isMobile = (p) => /^05/.test(p || "");
export function waNumber(p) {
  const d = (p || "").replace(/\D/g, "");
  return d.startsWith("0") ? "972" + d.slice(1) : d;
}
