import { occupationsOf, locationOf } from "./mockData";

// דיסקרטיות בייצוא: מספר טלפון של מועמד/ת לעולם אינו יוצא מהמערכת.
// הוא ממשיך להופיע על המסך למי שמורשה/ית לראותו, אך אינו נכלל בטקסט
// המועתק ואינו נכלל בקובץ ה-PDF - כדי שכרטיס שנשלח החוצה לא יחשוף אותו.
//
// הניקוי חל גם על הטקסט החופשי: לפעמים מספר נכתב בתוך התיאור עצמו
// (למשל בתשובה מהטופס), ואז חסימת השדה בלבד אינה מספיקה.
const PHONE_PATTERN = /(?:\+?972[-.\s]?|0)\d{1,2}[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

export function stripPhoneNumbers(text) {
  return String(text || "")
    .replace(PHONE_PATTERN, "")
    // ניקוי שאריות הפיסוק והרווחים שנשארו במקום המספר שהוסר
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([,.;:])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// בניית טקסט מלא לשיתוף/העתקה של פרופיל מועמד/ת - כולל כל פרטי התיאור.
export function buildProfileShareText(candidate) {
  const lines = [
    candidate.name,
    [`גיל ${candidate.age}`, `${candidate.height} ס״מ`, locationOf(candidate), candidate.eda]
      .filter(Boolean)
      .join(" | "),
  ];
  lines.push(`רמת דתיות: ${candidate.religiousLevel}`);
  if (candidate.currentOccupation) lines.push(`עיסוק נוכחי: ${candidate.currentOccupation}`);
  const route = occupationsOf(candidate);
  if (route.length) lines.push(`המסלול שלי: ${route.join(", ")}`);
  if (candidate.traits?.length) lines.push(`תכונות: ${candidate.traits.join(", ")}`);
  lines.push("");
  lines.push(stripPhoneNumbers(candidate.bio));
  // עישון יורד להערת שוליים עדינה בסוף, ולא ככותרת בולטת - מטעמי טאקט
  // בשליחת הכרטיס למועמדים. בתוך המערכת התצוגה נשארת רגילה.
  if (candidate.smoking) {
    lines.push("");
    lines.push(`* ${candidate.smoking}`);
  }
  return lines.join("\n");
}
