// דרישות סף קשיחות להתאמה - בדיקה בקוד, שאינה סומכת על שיקול הדעת של הבינה.
//
// עדיף "לא נמצאה התאמה" מאשר הצעת סרק. לכן כל התאמה שהבינה מציעה עוברת כאן
// בדיקה של שני פוסלים מובהקים, ונזרקת אם נכשלה:
//   1. מגזר/השקפה: חב"ד, ברסלב, חרדי ודתי-לאומי הם עולמות נפרדים. בתוך
//      הדתי-לאומי - "תורני" ו"דתל"ש/מסורתי" אינם מתאימים זה לזה.
//      מגזר שאי אפשר לזהות בוודאות - לא נפסל כאן (ההחלטה נשארת לבינה).
//   2. גיל: הבחור באותו גיל כמו הבחורה או מבוגר ממנה. חריגה של חצי שנה
//      לכל היותר (חודשים בודדים).
// חריגה מותרת רק כשבכרטיס נכתב במפורש שיש פתיחות לכך.
//
// הקובץ טהור: אין בו פניות לרשת ולא גישה למסד הנתונים.

const MAX_YOUNGER_MALE_YEARS = 0.5;

const has = (text, words) => words.some((w) => text.includes(w));
const norm = (v) =>
  String(v || "")
    .replace(/[״"׳'`]/g, '"')
    .replace(/[-–]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// מזהה עולם השקפתי מטקסט חופשי. מחזיר { family, band }:
// family: "chabad" | "breslov" | "haredi" | "dl" (דתי לאומי) | null
// band (רק ב-dl): "torani" | "light" | null
export function sectorOf(raw) {
  const t = norm(raw);
  if (!t) return { family: null, band: null };
  if (has(t, ['חב"ד', "חבד", "חבדני", 'חב"דני', 'חב"דניק', "חבדניק"])) return { family: "chabad", band: null };
  if (has(t, ["ברסלב"])) return { family: "breslov", band: null };
  const hardal = has(t, ['חרד"ל', "חרדל", "חרדי לאומי", "חרדית לאומית"]);
  if (!hardal && has(t, ["חרדי", "חרדית", "ליטאי", "ליטאית"])) return { family: "haredi", band: null };
  const torani = hardal || has(t, ["תורני", "תורנית"]);
  const light = has(t, ['דתל"ש', "דתלש", "מסורתי", "מסורתית", "לייט"]);
  const dl = torani || light || has(t, ["דתי לאומי", "דתית לאומית", "דתיה לאומית", "דתייה לאומית", "ציוני", "דתי", "דתייה", "דתיה"]);
  if (!dl) return { family: null, band: null };
  return { family: "dl", band: torani && !light ? "torani" : light && !torani ? "light" : null };
}

// מגזר של מועמד/ת מהמאגר: קודם התווית, ואם היא לא מכריעה - רמת התורניות
export function candidateSector(c) {
  const byTag = sectorOf(c?.tag);
  const byLevel = sectorOf(c?.religiousLevel);
  if (byTag.family) return { family: byTag.family, band: byTag.band || (byLevel.family === "dl" ? byLevel.band : null) };
  return byLevel;
}

export function sectorsClash(a, b) {
  if (!a?.family || !b?.family) return false;
  if (a.family !== b.family) return true;
  return a.family === "dl" && !!a.band && !!b.band && a.band !== b.band;
}

export function ageOf(v) {
  const m = /(\d+(?:\.\d+)?)/.exec(String(v ?? ""));
  const n = m ? Number(m[1]) : NaN;
  return n >= 16 && n <= 99 ? n : null;
}

// הבחור באותו גיל או מבוגר; גיל לא ידוע - לא נפסל כאן
export function ageClash(maleAge, femaleAge) {
  const m = ageOf(maleAge);
  const f = ageOf(femaleAge);
  if (m === null || f === null) return false;
  return m < f - MAX_YOUNGER_MALE_YEARS;
}

// כרטיס חיצוני מוואטסאפ מול מועמד/ת מהמאגר.
// מה שהכרטיס מבקש (requirements) קובע; אם לא כתוב מה מבקשים - המגזר שלו עצמו.
export function externalMatchProblem(profile, candidate) {
  const sought = sectorOf(profile?.requirements);
  const own = sectorOf(profile?.sector);
  const wanted = sought.family ? { family: sought.family, band: sought.band || (own.family === sought.family ? own.band : null) } : own;
  if (!profile?.openToOtherSectors && sectorsClash(wanted, candidateSector(candidate))) return "מגזר";
  const externalIsMale = profile?.gender === "בחור";
  const [maleAge, femaleAge] = externalIsMale ? [profile?.age, candidate?.age] : [candidate?.age, profile?.age];
  if (!profile?.openToYounger && ageClash(maleAge, femaleAge)) return "גיל";
  return null;
}

// שני מועמדים מהמאגר (ההכרעות היומיות)
export function internalPairProblem(a, b) {
  if (!a || !b) return null;
  if (sectorsClash(candidateSector(a), candidateSector(b))) return "מגזר";
  const [male, female] = a.gender === "בחור" ? [a, b] : [b, a];
  if (ageClash(male.age, female.age)) return "גיל";
  return null;
}

// סעיף "לבירור" שמודה בעצמו בפער מהותי בגיל או בהשקפה - זו פסילה, לא בירור
export function blindSpotAdmitsGap(text) {
  const t = norm(text);
  if (!t) return false;
  const gap = has(t, ["פער", "פערי", "פערים", "הבדל", "שונות", "אי התאמה", "חוסר התאמה"]);
  const topic = has(t, ["גיל", "מגזר", "השקפ", "שיוך", 'חב"ד', "ברסלב", "חרדי", "תורני", "דתי לאומי", "רקע הדתי", "רקע דתי"]);
  return gap && topic;
}
