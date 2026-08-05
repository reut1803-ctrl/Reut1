"use client";

// מנוע חילוץ מבוסס-חוקים (ללא ניחוש) לטקסט חופשי בעברית.
// עיקרון: שדה מתמלא אך ורק ממבנה/תווית מפורשים מרשימה סגורה. מה שלא זוהה - נשאר ריק.
// הטקסט המלא נשמר כלשונו בשדה "תיאור".

// תוויות מוכרות לכל שדה (רשימה סגורה). ניתן להרחיב בעתיד.
const FIELD_LABELS = {
  fullName: ["שם מלא", "שם המועמד", "שם המועמדת", "שם פרטי ומשפחה", "שם"],
  location: ["מקום מגורים נוכחי", "מקום מגורים", "עיר מגורים", "מגורים", "יישוב", "ישוב", "עיר", "כתובת"],
  age: ["גיל"],
  birthDate: ["תאריך לידה", "תאריך הלידה", "ת.לידה", "ת. לידה"],
  height: ["גובה"],
  community: ["עדה/מוצא", "עדה", "מוצא"],
  work: ["במה אתה עובד", "במה את עובדת", "במה עובד", "במה עובדת", "עיסוק", "תעסוקה", "מקצוע", "מקום עבודה", "עבודה"],
  degree: ["איזה תואר או תעודה אתה לומד", "איזה תואר או תעודה את לומדת", "תואר או תעודה", "תואר", "תעודה", "לימודים", "לומד", "לומדת"],
  parentsWork: ["במה ההורים עוסקים", "עיסוק ההורים", "ההורים עוסקים", "עיסוק הורים", "עבודת ההורים"],
  phone: ["טלפון אישי", "מספר טלפון", "מס' טלפון", "טלפון", "נייד", "פלאפון", "פל'"],
};

const PREFIX = "[בהלומשכ]?"; // אות שימוש אפשרית לפני התווית (ב/ה/ל/ו/מ/ש/כ)

function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// רשימה שטוחה של (שדה, תווית) ממוינת מהתווית הארוכה לקצרה - כדי שהספציפי ינצח.
const FLAT_LABELS = [];
for (const [field, labels] of Object.entries(FIELD_LABELS)) {
  for (const label of labels) FLAT_LABELS.push({ field, label });
}
FLAT_LABELS.sort((a, b) => b.label.length - a.label.length);

// טלפון ישראלי - תבנית מפורשת בלבד (מספר שלם).
const PHONE_RE = /0\d{1,2}[-.\s]?\d{3}[-.\s]?\d{3,4}/;

function cleanPhone(s) {
  const m = String(s).match(PHONE_RE);
  return m ? m[0].replace(/[.\s]/g, "").replace(/(\d{3})(\d)/, "$1-$2") : "";
}

// חילוץ ערך משורה בודדת לפי תווית בתחילת השורה, עם גבול מילה (התו שאחרי התווית אינו אות).
function extractFromLine(line) {
  for (const { field, label } of FLAT_LABELS) {
    const re = new RegExp("^\\s*" + PREFIX + esc(label) + "(?=[\\s:：\\-–—.]|$)\\s*[:：\\-–—]?\\s*(.*)$");
    const m = line.match(re);
    if (m) {
      let value = (m[1] || "").trim();
      return { field, value };
    }
  }
  return null;
}

function normalizeValue(field, value) {
  if (field === "age") {
    const m = value.match(/\d{1,3}/);
    return m ? m[0] : "";
  }
  if (field === "phone") {
    return cleanPhone(value);
  }
  return value.trim();
}

// זיהוי מסלול (מגדר) - רק ממבנה מפורש: "מסלול: בחור/בחורה" או מילה שלמה בשורה.
function detectGender(text) {
  if (/מסלול\s*[:：\-]?\s*בחורה/.test(text) || /(^|\s)בחורה(\s|$|[.,])/.test(text) || /(^|\s)נקבה(\s|$)/.test(text)) return "female";
  if (/מסלול\s*[:：\-]?\s*בחור/.test(text) || /(^|\s)בחור(\s|$|[.,])/.test(text) || /(^|\s)זכר(\s|$)/.test(text)) return "male";
  return "";
}

// הפונקציה הראשית: מחזירה {fields, description}. ממלאת שדות רק בהתאמה מפורשת.
export function parseCandidateText(rawText) {
  const text = (rawText || "").replace(/\r/g, "");
  const fields = {};

  const lines = text.split(/\n|•|·|\t/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const hit = extractFromLine(line);
    if (!hit) continue;
    const val = normalizeValue(hit.field, hit.value);
    if (val && !fields[hit.field]) fields[hit.field] = val; // לא דורסים ערך שכבר זוהה
  }

  // טלפון - אם לא זוהה מתווית, סורקים את כל הטקסט לתבנית מפורשת של מספר.
  if (!fields.phone) {
    const p = cleanPhone(text);
    if (p) fields.phone = p;
  }

  // מסלול (מגדר)
  const g = detectGender(text);
  if (g) fields.gender = g;

  return { fields, description: (rawText || "").trim() };
}

// רשימת תוויות השדות שזוהו - לצורך הצגת חיווי למשתמש/ת אילו שדות מולאו.
export const PARSE_FIELD_NAMES = {
  gender: "מסלול",
  fullName: "שם מלא",
  location: "מקום מגורים",
  age: "גיל",
  birthDate: "תאריך לידה",
  height: "גובה",
  community: "עדה",
  work: "עיסוק",
  degree: "תואר / לימודים",
  parentsWork: "עיסוק ההורים",
  phone: "טלפון",
};
