import { occupationsOf } from "./mockData";

// בניית טקסט מלא לשיתוף/העתקה של פרופיל מועמד/ת - כולל כל פרטי התיאור, לא רק שם וטלפון.
// טלפון מוצג רק לצוות (includePhone), כדי לא לחשוף אותו לצופה שאינה מורשית.
export function buildProfileShareText(candidate, { includePhone = true } = {}) {
  const lines = [candidate.name, `גיל ${candidate.age} | ${candidate.height} ס״מ | ${candidate.region}`];
  lines.push(`רמת דתיות: ${candidate.religiousLevel}`);
  const occupations = occupationsOf(candidate);
  if (occupations.length) lines.push(`עיסוק ורקע: ${occupations.join(", ")}`);
  if (candidate.traits?.length) lines.push(`תכונות: ${candidate.traits.join(", ")}`);
  lines.push("");
  lines.push(candidate.bio);
  if (candidate.phone && includePhone) {
    lines.push("");
    lines.push(`טלפון: ${candidate.phone}`);
  }
  // עישון יורד להערת שוליים עדינה בסוף, ולא ככותרת בולטת - מטעמי טאקט
  // בשליחת הכרטיס למועמדים. בתוך המערכת התצוגה נשארת רגילה.
  if (candidate.smoking) {
    lines.push("");
    lines.push(`* ${candidate.smoking}`);
  }
  return lines.join("\n");
}
