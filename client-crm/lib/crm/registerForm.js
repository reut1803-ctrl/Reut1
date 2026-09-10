// לוגיקת טופס ההרשמה החיצוני. קובץ טהור, בלי React ובלי Firebase,
// כדי שאפשר יהיה לבדוק אותו בנפרד ושלא ישבור שום מסך.
//
// עקרון המפתח: הפרדה בין שדות ליבה ובין תשובות עומק.
//   * שדות ליבה (שם, טלפון, גיל, גובה, עיר, תמונות...) נשמרים כל אחד
//     בשדה משלו, ולכן אפשר לסנן ולחפש לפיהם.
//   * תשובות העומק (אופי, יסוד, משפחה, מה מחפשים) מתמזגות לפסקה אחת
//     רציפה שנכנסת ל"תיאור אישי". כך לא נפתחות עשרות עמודות חדשות
//     במסד הנתונים, והכרטיס נשאר קריא לשדכנית.

export const MARITAL_STATUSES = ["רווק/ה", "גרוש/ה", "אלמן/ה", "אחר"];

export const LIFESTYLE_DEFINITIONS = [
  "כיפה סרוגה",
  "תורני",
  'חרד"ל',
  "חרדי",
  "חסידי",
  "ברסלב",
  "בעל/ת תשובה",
  "מסורתי",
  'דתל"ש',
  "אחר",
];

export const BRESLOV_IN_PARTNER = ["חובה", "יתרון", "לא משנה"];

export const SMOKING_SELF = ["לא מעשן/ת", "לפעמים", "מעשן/ת"];

export const ELEMENTS = [
  { key: "אש", hint: "התלהבות, יוזמה, אנרגיה" },
  { key: "רוח", hint: "מחשבה, תקשורת, תנועה" },
  { key: "מים", hint: "רגש, זרימה, חיבור" },
  { key: "עפר", hint: "יציבות, מעשיות, שורשיות" },
  { key: "אחר", hint: "משהו משלי" },
];

// שלושת מדדי האופי. כל מדד נע בין שני קטבים, ולכן מוצג כסולם ולא כבחירה.
export const CHARACTER_SCALES = [
  { id: "introExtro", label: "מופנמות מול מוחצנות", low: "מופנם/ת", high: "מוחצן/ת" },
  { id: "heartMind", label: "רגש מול שכל", low: "רגשי/ת", high: "שכלי/ת" },
  { id: "planFlow", label: "מחושב מול זורם", low: "מחושב/ת", high: "זורם/ת" },
];

// תרגום ציון 1-10 לניסוח אנושי. שדכנית קוראת "נוטה למופנמות (3/10)"
// הרבה יותר מהר מאשר מספר בודד בלי הקשר.
export function describeScale(scale, value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  if (n <= 2) return `${scale.low} מאוד (${n}/10)`;
  if (n <= 4) return `נוטה ל${scale.low} (${n}/10)`;
  if (n <= 6) return `מאוזן/ת בין ${scale.low} ל${scale.high} (${n}/10)`;
  if (n <= 8) return `נוטה ל${scale.high} (${n}/10)`;
  return `${scale.high} מאוד (${n}/10)`;
}

// גיל מתאריך לידה. מחזיר null כשאין תאריך או כשהוא אינו הגיוני,
// כדי שלא ייכנס למאגר גיל מומצא.
export function ageFromBirthDate(birthDate) {
  const d = new Date(birthDate);
  if (!birthDate || Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const before = now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate());
  if (before) age -= 1;
  return age >= 16 && age <= 99 ? age : null;
}

const clean = (v) => String(v ?? "").trim();

// מיזוג תשובות העומק לפסקה אחת. כל סעיף נכנס רק אם נענה, ולכן
// טופס שמולא חלקית מפיק תיאור קצר ותקין ולא שורות ריקות.
export function buildBio(form) {
  const parts = [];
  const add = (title, value) => {
    const v = clean(value);
    if (v) parts.push(title ? `${title}: ${v}` : v);
  };

  add("", form.selfDescription);

  const character = CHARACTER_SCALES.map((s) => describeScale(s, form[s.id])).filter(Boolean);
  if (character.length > 0) parts.push(`אופי: ${character.join(" · ")}.`);

  if (clean(form.element)) {
    const why = clean(form.elementWhy);
    parts.push(`היסוד המרכזי שלי: ${clean(form.element)}${why ? ` — ${why}` : ""}.`);
  }

  add("הגדרה דתית ואורח חיים", form.lifestyle);
  add("הקשר שלי לברסלב", form.breslov);
  add("מה אני עושה היום", form.currentOccupation);
  add("המסלול שלי", form.pathStory);
  add("רקע משפחתי", form.familyBackground);
  add("תחביבים וכישרונות", form.hobbies);
  add("דברים שחשוב להכיר עליי", form.importantToKnow);
  add("מה אני מחפש/ת", form.lookingFor);
  add("גילאים מועדפים", form.preferredAges);
  add("דרישות מרכזיות", form.mainRequirements);
  add("הקשר לברסלב אצל בן/בת הזוג", form.breslovInPartner);
  add("מצב משפחתי", form.maritalStatus);
  add("עישון", form.smokingSelf);

  return parts.join("\n\n").trim();
}

// מה חסר כדי לשלוח. מוחזר כרשימה קריאה בעברית, ולא כדגל בוליאני,
// כדי שההודעה תוכל לומר במפורש מה נשאר להשלים.
export function missingFields(form, { photos = [], agreeTerms, agreePrivacy } = {}) {
  const missing = [];
  if (!clean(form.name)) missing.push("שם מלא");
  if (!clean(form.phone)) missing.push("טלפון");
  if (!clean(form.birthDate) && !clean(form.age)) missing.push("תאריך לידה או גיל");
  if (photos.length === 0) missing.push("תמונה אחת לפחות");
  if (!agreeTerms) missing.push("אישור הסכם ההתקשרות");
  if (!agreePrivacy) missing.push("אישור מדיניות הפרטיות");
  return missing;
}

// באיזה שלב נמצא כל שדה חסר - כדי שכפתור "מה חסר" יוכל להחזיר את
// הממלא/ת בדיוק לשלב הנכון ולא רק להציג הודעה.
export const STEP_OF_FIELD = {
  "שם מלא": 0,
  טלפון: 0,
  "תאריך לידה או גיל": 0,
  "תמונה אחת לפחות": 3,
  "אישור הסכם ההתקשרות": 3,
  "אישור מדיניות הפרטיות": 3,
};
