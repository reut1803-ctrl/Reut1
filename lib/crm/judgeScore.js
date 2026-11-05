// חישוב הציון של הסוכן השופט - בקוד בלבד, לא בידי הבינה.
//
// הבינה נותנת לכל ציר "פסק דין" בלבד: מתאים / פער קל / פער מהותי / לא ידוע,
// עם נימוק וציטוט. הציון נגזר מפסקי הדין לפי משקלים קבועים:
//   * "לא ידוע" לעולם אינו מוריד ציון ואינו פוסל: הציר פשוט לא נספר,
//     וההכרעה עליו עוברת לשדכנית (מוצג "חסר מידע").
//   * פער מהותי בציר שהוא תנאי סף (רמת הקפדה, חברה ולבוש, ערכי ליבה) - חותך
//     את הציון ל-3 לכל היותר, לא משנה כמה טובים שאר הצירים.
//   * פער מהותי באורח החיים - חותך ל-5 לכל היותר.
// הקובץ טהור: אין בו רשת ולא מסד נתונים.

export const VERDICTS = ["מתאים", "פער קל", "פער מהותי", "לא ידוע"];

export const AXES = {
  observance: { label: "רמת הקפדה והשקפה", weight: 3, dealBreaker: true },
  society: { label: "חברה ולבוש", weight: 2, dealBreaker: true },
  coreValues: { label: "ערכי ליבה ושירות", weight: 2, dealBreaker: true },
  lifestyle: { label: "אורח חיים בפועל", weight: 2, cap: 5 },
  energy: { label: "אנרגיה והשלמה", weight: 1 },
  communication: { label: "תקשורת וצרכים", weight: 1 },
};
export const AXIS_KEYS = Object.keys(AXES);

const CREDIT = { מתאים: 1, "פער קל": 0.5, "פער מהותי": 0 };
const DEALBREAKER_CAP = 3;
// פחות משני צירים ידועים - אין על מה לבסס ציון; ההכרעה כולה של השדכנית
const MIN_KNOWN_AXES = 2;

// verdicts: { [axis]: { verdict, reason, evidence } }
export function scoreVerdicts(verdicts) {
  let got = 0;
  let max = 0;
  let cap = 10;
  const unknown = [];
  const gaps = [];
  AXIS_KEYS.forEach((k) => {
    const v = verdicts?.[k]?.verdict;
    if (!v || v === "לא ידוע" || !(v in CREDIT)) {
      unknown.push(AXES[k].label);
      return;
    }
    max += AXES[k].weight;
    got += AXES[k].weight * CREDIT[v];
    if (v === "פער מהותי") {
      gaps.push(AXES[k].label);
      if (AXES[k].dealBreaker) cap = Math.min(cap, DEALBREAKER_CAP);
      else if (AXES[k].cap) cap = Math.min(cap, AXES[k].cap);
    }
  });
  const known = AXIS_KEYS.length - unknown.length;
  if (known < MIN_KNOWN_AXES || max === 0) {
    return { score: null, known, unknown, gaps, status: "חסר מידע" };
  }
  const raw = Math.round((10 * got) / max);
  const score = Math.min(raw, cap);
  const status = score >= 7 ? "מומלץ" : gaps.length ? "פער מהותי" : "פחות מתאים";
  return { score, known, unknown, gaps, status };
}
