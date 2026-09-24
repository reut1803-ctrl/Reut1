// מנוע מבחן ההתאמות: ניקוד, לא סינון.
// לכל מועמד/ת נבנית רשימת בדיקות. הציון הוא אחוז הבדיקות שעברו מתוך אלה שנבדקו בפועל.
//
// שלושה כללים:
// 1. קריטריון שלא הוגדר (או "לא משנה", או מחוון על הטווח המלא) אינו נספר כלל.
// 2. נתון חסר בכרטיס אינו נספר - לא כהצלחה ולא ככישלון.
// 3. תכונות ועיסוקים נספרים אחד-אחד, כך שהתאמה חלקית מקדמת במקום לפסול.

import { candidateOccupations, normalizeTagName } from "./mockData";

export const MATCH_THRESHOLD = 70;

const hasValue = (v) => v !== null && v !== undefined && v !== "" && !Number.isNaN(Number(v));

// מחוון שנשאר על הטווח המלא = לא הוגדרה דרישה
const rangeIsOpen = ([min, max], [limitMin, limitMax]) => min <= limitMin && max >= limitMax;

export function scoreCandidate(candidate, answers, limits) {
  const checks = [];

  if (answers.ageRange && !rangeIsOpen(answers.ageRange, limits.age) && hasValue(candidate.age)) {
    const n = Number(candidate.age);
    checks.push({ label: "גיל", passed: n >= answers.ageRange[0] && n <= answers.ageRange[1] });
  }

  if (answers.heightRange && !rangeIsOpen(answers.heightRange, limits.height) && hasValue(candidate.height)) {
    const n = Number(candidate.height);
    checks.push({ label: "גובה", passed: n >= answers.heightRange[0] && n <= answers.heightRange[1] });
  }

  if (answers.religiousLevel && answers.religiousLevel !== "הכל" && candidate.religiousLevel) {
    checks.push({ label: "רמת תורניות", passed: candidate.religiousLevel === answers.religiousLevel });
  }

  const regions = (answers.regions || []).filter((r) => r !== "לא משנה");
  if (regions.length > 0 && candidate.region) {
    checks.push({ label: "אזור", passed: regions.includes(candidate.region) });
  }

  if (answers.smoking && answers.smoking !== "לא משנה" && candidate.smoking) {
    checks.push({ label: "עישון", passed: candidate.smoking === answers.smoking });
  }

  // עיסוקים - כל אחד נבדק בנפרד
  const wantedOccupations = (answers.occupations || []).filter((o) => o !== "לא משנה");
  if (wantedOccupations.length > 0) {
    const has = candidateOccupations(candidate);
    wantedOccupations.forEach((o) => checks.push({ label: o, passed: has.includes(o) }));
  }

  // תוויות סגנון חיים - כל אחת נבדקת בנפרד
  const wantedTags = (answers.tags || []).filter(Boolean);
  if (wantedTags.length > 0) {
    const tag = normalizeTagName(candidate.tag);
    wantedTags.forEach((t) => checks.push({ label: t, passed: tag === t }));
  }

  // תכונות אופי - כל אחת נבדקת בנפרד
  const wantedTraits = (answers.traits || []).filter(Boolean);
  if (wantedTraits.length > 0) {
    const traits = candidate.traits || [];
    wantedTraits.forEach((t) => checks.push({ label: t, passed: traits.includes(t) }));
  }

  if (checks.length === 0) return { score: null, checks: [], matched: [], missed: [] };

  const matched = checks.filter((c) => c.passed).map((c) => c.label);
  const missed = checks.filter((c) => !c.passed).map((c) => c.label);
  return {
    score: Math.round((matched.length / checks.length) * 100),
    checks,
    matched,
    missed,
  };
}

// מדרג את כל המועמדים. מחזיר גם את המובילים מתחת לסף, לתצוגה כשאין אף התאמה.
export function rankCandidates(candidates, answers, limits) {
  const scored = candidates
    .map((c) => ({ candidate: c, ...scoreCandidate(c, answers, limits) }))
    .filter((r) => r.score !== null)
    .sort((a, b) => b.score - a.score);

  return {
    above: scored.filter((r) => r.score >= MATCH_THRESHOLD),
    below: scored.filter((r) => r.score < MATCH_THRESHOLD).slice(0, 3),
    anyCriteria: scored.length > 0,
  };
}
