import { candidateOccupations } from "./mockData";

// בניית טקסט מלא לשיתוף/העתקה של פרופיל מועמד/ת - כולל כל פרטי התיאור, לא רק שם וטלפון.
// טלפון מוצג רק לצוות (includePhone), כדי לא לחשוף אותו לצופה שאינה מורשית.
export function buildProfileShareText(candidate, { includePhone = true } = {}) {
  const lines = [candidate.name, `גיל ${candidate.age} | ${candidate.height} ס״מ | ${candidate.region}`];
  lines.push(`רמת דתיות: ${candidate.religiousLevel}`);
  if (candidate.currentOccupation) lines.push(`עיסוק נוכחי: ${candidate.currentOccupation}`);
  const occupations = candidateOccupations(candidate);
  if (occupations.length > 0) lines.push(`המסלול שלי: ${occupations.join(" · ")}`);
  lines.push(`עישון: ${candidate.smoking}`);
  if (candidate.traits?.length) lines.push(`תכונות: ${candidate.traits.join(", ")}`);
  lines.push("");
  lines.push(candidate.bio);
  if (candidate.phone && includePhone) {
    lines.push("");
    lines.push(`טלפון: ${candidate.phone}`);
  }
  return lines.join("\n");
}
