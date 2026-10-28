// הכנת המאגר לעוזר ההתאמות - בצד הדפדפן של המנהלת בלבד.
//
// הקובץ הזה טהור: הוא לא קורא ולא כותב למסד הנתונים ולא נוגע ב-Firebase.
// הוא מקבל את הכרטיסים שכבר טעונים אצל המנהלת, ומחזיר רשימה אנונימית:
//   * מזהה אנונימי קצר (M01 / F07) במקום מזהה הכרטיס האמיתי
//   * שם פרטי בלבד - בלי שם משפחה
//   * בלי טלפון, מספרים לבירורים, יישוב מדויק, הערות מנהלת והערות מורכבות
// המיפוי חזרה לכרטיסים האמיתיים נשאר אצל המנהלת ואינו יוצא החוצה.

const AVAILABLE = "פנוי";

// מי נמצא כרגע בתהליך, ואילו זוגות כבר ירדו מהפרק.
// כל הצעה שלא ירדה מהפרק - פעילה או מוקפאת - מוציאה את שני הצדדים מהמאגר.
// הצעה שירדה מהפרק לא מוציאה איש: שני הצדדים חוזרים להיות פנויים, אבל
// הזוג הספציפי הזה לעולם לא יוצע שוב.
export function busyAndDropped(proposals, { droppedStatus }) {
  const busy = new Set();
  const dropped = new Set();
  (proposals || []).forEach((p) => {
    if (!p) return;
    if (p.status === droppedStatus) {
      if (p.maleId && p.femaleId) dropped.add(pairKey(p.maleId, p.femaleId));
      return;
    }
    if (p.maleId) busy.add(p.maleId);
    if (p.femaleId) busy.add(p.femaleId);
  });
  return { busy, dropped };
}

export const pairKey = (maleId, femaleId) => `${maleId}|${femaleId}`;

// סטטוס "פנוי" בלבד, לא חסוי, ולא בתוך תהליך פתוח או מוקפא.
// כרטיס חסוי אינו נשלח החוצה כלל, גם לא באופן אנונימי.
export function isEligible(candidate, busy) {
  if (!candidate || !candidate.id) return false;
  if (candidate.availabilityStatus !== AVAILABLE) return false;
  if (candidate.confidential) return false;
  if (busy.has(candidate.id)) return false;
  return true;
}

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ניקוי טקסט חופשי מפרטים מזהים שאפשר לזהות בוודאות.
// מגבלה: פרט מזהה שנכתב בפרוזה חופשית (למשל "אבא שלי הרב כהן") ושאינו
// שם המשפחה או היישוב של המועמד/ת עצמו/ה - לא ייתפס בוודאות.
export function scrubText(text, { surnames = [], places = [] } = {}) {
  let out = String(text || "");
  // מיילים וקישורים
  out = out.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[מייל]");
  out = out.replace(/\b(?:https?:\/\/|www\.)\S+/gi, "[קישור]");
  // רצף של 7 ספרות ומעלה, עם או בלי מקפים, רווחים או קידומת בינלאומית
  out = out.replace(/\+?\d[\d\s\-–.()]{6,}\d/g, "[טלפון]");
  // שם המשפחה והיישוב - כמילה שלמה, גם עם עד שתי אותיות שימוש לפניה
  // ("ובכרמי", "מהכהנים" לא, אבל "וכהן", "לבית שמש" כן). ביטוי של כמה מילים
  // (כמו "כרמי צור") מוחלף קודם כולו, ורק אחר כך מילה-מילה.
  const replaceWord = (word, label) => {
    const w = String(word || "").trim();
    if (w.length < 2) return;
    const body = w.split(/\s+/).map(escapeRegExp).join("\\s+");
    const re = new RegExp(`(^|[^\\u0590-\\u05FFA-Za-z])[והבלמשכ]{0,2}${body}(?=$|[^\\u0590-\\u05FFA-Za-z])`, "g");
    out = out.replace(re, (_, before) => `${before}${label}`);
  };
  surnames.forEach((s) => replaceWord(s, "[שם משפחה]"));
  [...places].sort((a, b) => b.length - a.length).forEach((p) => replaceWord(p, "[יישוב]"));
  return out
    .replace(/\[יישוב\](\s+\[יישוב\])+/g, "[יישוב]")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

const splitName = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] || "", rest: parts.slice(1) };
};

// רשימה אנונימית ויציבה. הסדר נקבע לפי מזהה הכרטיס, ולכן אותו מאגר
// מייצר בדיוק אותו טקסט בכל פעם - כך שירות הבינה יכול לשמור אותו במטמון
// ולחייב פחות בשיחה החוזרת.
export function anonymizePool(candidates, proposals, { droppedStatus }) {
  const { busy, dropped } = busyAndDropped(proposals, { droppedStatus });
  const eligible = (candidates || [])
    .filter((c) => isEligible(c, busy))
    .filter((c) => c.gender === "male" || c.gender === "female")
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  const codeToId = {};
  const idToCode = {};
  let m = 0;
  let f = 0;
  const pool = eligible.map((c) => {
    const isMale = c.gender === "male";
    const code = isMale ? `M${String(++m).padStart(2, "0")}` : `F${String(++f).padStart(2, "0")}`;
    codeToId[code] = c.id;
    idToCode[c.id] = code;
    const { first, rest } = splitName(c.name);
    const city = String(c.city || "").trim();
    const places = [city, ...city.split(/\s+/)].filter((w) => w.length >= 2);
    const clean = (t) => scrubText(t, { surnames: rest, places });
    return {
      code,
      gender: isMale ? "בחור" : "בחורה",
      firstName: first,
      age: c.age ?? null,
      height: c.height ?? null,
      eda: c.eda || "",
      tag: c.tag || "",
      religiousLevel: c.religiousLevel || "",
      region: c.region || "",
      education: c.education || "",
      yeshivaLevel: c.yeshivaLevel || "",
      currentOccupation: clean(c.currentOccupation || ""),
      occupations: Array.isArray(c.occupations) ? c.occupations : [],
      traits: Array.isArray(c.traits) ? c.traits : [],
      smoking: c.smoking || "",
      bio: clean(c.bio || ""),
    };
  });

  // זוגות שירדו מהפרק, במונחי המזהים האנונימיים - רק כשאת שני הצדדים יש במאגר
  const forbiddenPairs = [];
  dropped.forEach((key) => {
    const [maleId, femaleId] = key.split("|");
    if (idToCode[maleId] && idToCode[femaleId]) forbiddenPairs.push([idToCode[maleId], idToCode[femaleId]]);
  });
  forbiddenPairs.sort((a, b) => (a[0] + a[1]).localeCompare(b[0] + b[1]));

  return { pool, codeToId, idToCode, forbiddenPairs };
}

// בדיקה שאינה סומכת על הבינה: כל הכרעה שמזכירה מזהה לא קיים, מעמתת שני
// אנשים מאותו מגדר, או מציעה זוג שכבר ירד מהפרק - נזרקת לפני שמוצגת.
export function validateDecisions(decisions, { pool, forbiddenPairs }) {
  const byCode = new Map(pool.map((p) => [p.code, p]));
  const forbidden = new Set(forbiddenPairs.map(([a, b]) => `${a}|${b}`));
  const isForbidden = (x, y) => {
    const [male, female] = x.startsWith("M") ? [x, y] : [y, x];
    return forbidden.has(`${male}|${female}`);
  };
  const seen = new Set();
  const out = [];
  (Array.isArray(decisions) ? decisions : []).forEach((d) => {
    if (!d || out.length >= 3) return;
    const c = byCode.get(d.candidate);
    const a = byCode.get(d.optionA);
    const b = byCode.get(d.optionB);
    if (!c || !a || !b) return;
    if (d.optionA === d.optionB) return;
    if (a.gender === c.gender || b.gender === c.gender) return;
    if (d.winner !== d.optionA && d.winner !== d.optionB) return;
    // גם אפשרות שמפסידה בהשוואה נחשבת הצעה - זוג שירד מהפרק לא יופיע כלל
    if (isForbidden(d.candidate, d.optionA) || isForbidden(d.candidate, d.optionB)) return;
    if (seen.has(d.candidate)) return;
    seen.add(d.candidate);
    out.push(d);
  });
  return out;
}
