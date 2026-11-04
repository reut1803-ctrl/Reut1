// "המשפך" - סינון ודירוג בקוד, בלי בינה, לפני שמשהו נשלח לבינה.
//
// במקום לשלוח לבינה את כל המאגר ולבקש ממנה למצוא את המחט בערימה, הקוד
// מוצא עבור מועמד/ת אחד/ת את מי שבכלל רלוונטי, ומדרג אותם. רק הרשימה
// הקצרה (עד 12) נשלחת לבינה, עם התיאור המלא, לשיפוט מעמיק.
//
// הקובץ טהור: הוא עובד על הרשימה האנונימית (lib/crm/aiAnonymize.js),
// לא קורא ולא כותב למסד הנתונים ולא פונה לרשת.

import { internalPairProblem } from "@/lib/crm/dealBreakers";

export const SHORTLIST_SIZE = 12;

// סולם רמת התורניות, מהתורני אל הפתוח. "הכל" ושדה ריק - לא ידוע.
const LEVEL_SCALE = {
  'חרד"ל': 0,
  'חרד"לית': 0,
  תורני: 1,
  תורנית: 1,
  חסידי: 1,
  חסידית: 1,
  דתי: 2,
  דתייה: 2,
  מסורתי: 3,
  מסורתית: 3,
  'דתל"ש': 3,
  'דתל"שית': 3,
};
const levelOf = (v) => {
  const key = String(v || "").replace(/[״]/g, '"').trim();
  return Object.prototype.hasOwnProperty.call(LEVEL_SCALE, key) ? LEVEL_SCALE[key] : null;
};

// סימן לשירות צבאי/לאומי, מתוך המסלול, העיסוק והתיאור. "לא צוין" אינו "לא שירת".
// שלילה מפורשת ("לא שירתתי", "לא התגייס", "פטור") גוברת - אחרת "לא שירת בצבא"
// היה נספר כשירות בגלל המילה "צבא".
const SERVICE_WORDS = /צבא|צה"ל|צה״ל|הסדר|מכינה|שירות לאומי|שירות|מילואים|קרבי|גולני|צנחנים|גבעתי|קצין|קצינה|שריון|תותחנים|הנדסה קרבית/;
const NO_SERVICE = /לא (שירת|שירתתי|שירתה|התגייס|התגייסתי|התגייסה|עשיתי צבא|עשה צבא|הייתי בצבא|היה בצבא)|פטור מ?(שירות|צבא)|פטורה מ?(שירות|צבא)/;
export function serviceSignal(p) {
  const text = [...(p?.occupations || []), p?.yeshivaLevel, p?.currentOccupation, p?.bio].join(" ");
  if (NO_SERVICE.test(text)) return "לא שירת/ה";
  return SERVICE_WORDS.test(text) ? "שירת/ה" : "לא צוין";
}

// למה מועמד/ת לא נכנס/ה לרשימה - לשקיפות מול המנהלת
const REASONS = {
  גיל: "גיל",
  גובה: "גובה",
  מגזר: "מגזר",
  וייב: "סגנון חזותי",
  רמה: "פער ברמת התורניות",
  ירד: "כבר ירדה ביניהם הצעה",
};

function score(focus, p) {
  let s = 0;
  const lf = levelOf(focus.religiousLevel);
  const lp = levelOf(p.religiousLevel);
  if (lf !== null && lp !== null) s += lf === lp ? 3 : 1;
  if (focus.tag && focus.tag === p.tag) s += 2;
  const [male, female] = focus.gender === "בחור" ? [focus, p] : [p, focus];
  const gap = Number(male.age) - Number(female.age);
  if (Number.isFinite(gap)) s += gap >= 0 && gap <= 4 ? 2 : gap > 4 && gap <= 7 ? 0.5 : 0;
  if (focus.region && focus.region === p.region) s += 1;
  if (serviceSignal(focus) === serviceSignal(p)) s += 1;
  if (String(p.bio || "").length > 150) s += 1;
  if (focus.visual?.visual_style && focus.visual.visual_style === p.visual?.visual_style) s += 1;
  return s;
}

// הרשימה הקצרה עבור מועמד/ת אחד/ת (לפי הקוד האנונימי שלו/ה).
// מחזיר גם כמה נפסלו ומאיזו סיבה.
export function buildShortlist(pool, forbiddenPairs, focusCode, size = SHORTLIST_SIZE) {
  const focus = (pool || []).find((p) => p.code === focusCode);
  if (!focus) return { focus: null, options: [], considered: 0, excluded: {} };
  const forbidden = new Set((forbiddenPairs || []).map(([a, b]) => `${a}|${b}`));
  const excluded = {};
  const count = (r) => {
    excluded[REASONS[r] || r] = (excluded[REASONS[r] || r] || 0) + 1;
  };
  const others = pool.filter((p) => p.gender !== focus.gender);
  const passing = others.filter((p) => {
    const [m, f] = focus.gender === "בחור" ? [focus.code, p.code] : [p.code, focus.code];
    if (forbidden.has(`${m}|${f}`)) return count("ירד"), false;
    const problem = internalPairProblem(focus, p);
    if (problem) return count(problem), false;
    // פער של שתי דרגות ומעלה בסולם התורניות (למשל חרד"ל מול דתי) - לא נכנס
    const lf = levelOf(focus.religiousLevel);
    const lp = levelOf(p.religiousLevel);
    if (lf !== null && lp !== null && Math.abs(lf - lp) >= 2) return count("רמה"), false;
    return true;
  });
  const options = passing
    .map((p) => ({ p, s: score(focus, p) }))
    .sort((a, b) => b.s - a.s || String(a.p.code).localeCompare(String(b.p.code)))
    .slice(0, size)
    .map((x) => x.p);
  return { focus, options, considered: others.length, passed: passing.length, excluded };
}
