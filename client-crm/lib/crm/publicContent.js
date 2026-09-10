// תוכן שהמנהלת עורכת בעצמה, בלי נגיעה בקוד ובלי פריסה מחדש.
//
// הקובץ טהור: אין בו React ואין בו Firebase. הוא מגדיר את מבנה התוכן,
// את ברירות המחדל, ואת המיזוג ביניהן לבין מה שנשמר במסד הנתונים.
//
// למה ברירות מחדל ולא מסד נתונים ריק: כך המערכת עובדת במלואה גם לפני
// שנגעו בממשק הניהול ולו פעם אחת, וגם אם שדה בודד נמחק בטעות. תוכן
// חסר נופל תמיד לברירת המחדל שבקוד, ולעולם לא למסך ריק.

// ===================================================================
//  שדות ליבה - נעולים
// ===================================================================
// אלה השדות שמבנה מסד הנתונים נשען עליהם. אי אפשר למחוק אותם, לשנות
// את המזהה שלהם או את סוגם דרך ממשק הניהול, כי כל אחד מהם נשמר בעמודה
// משלו ומשמש לסינון, לחיפוש ולהתאמות. מה שכן ניתן לעריכה: הכיתוב
// שמוצג למועמד/ת, וההסבר שמתחתיו.
//
// locked=true פירושו שגם חובה/רשות נעול: בלי שם, טלפון, תאריך לידה,
// תמונה ואישורים אין כרטיס תקין ואין דרך ליצור קשר.
export const CORE_FIELDS = [
  { id: "gender", label: "אני", step: 0, locked: true },
  { id: "name", label: "שם מלא", step: 0, locked: true },
  { id: "phone", label: "מספר טלפון", step: 0, locked: true },
  { id: "birthDate", label: "תאריך לידה", step: 0, locked: true },
  { id: "maritalStatus", label: "מצב משפחתי", step: 0, locked: false },
  { id: "height", label: 'גובה (ס"מ)', step: 0, locked: false },
  { id: "eda", label: "עדה", step: 0, locked: false },
  { id: "region", label: "אזור מגורים", step: 0, locked: false },
  { id: "city", label: "עיר / יישוב", step: 0, locked: false },
  { id: "lifestyle", label: "הגדרה דתית ואורח חיים", step: 1, locked: false },
  { id: "currentOccupation", label: "מה אני עושה היום", step: 1, locked: false },
  { id: "photos", label: "תמונות", step: 3, locked: true },
  { id: "referenceContacts", label: "אנשי קשר לבירורים", step: 3, locked: false },
  { id: "consents", label: "אישורים משפטיים", step: 3, locked: true },
];

export const CORE_FIELD_IDS = new Set(CORE_FIELDS.map((f) => f.id));

// סוגי שאלה שאפשר להוסיף. כל אחד מהם יודע להיכנס לתיאור האישי.
export const QUESTION_TYPES = [
  { value: "text", label: "שורה אחת" },
  { value: "textarea", label: "טקסט ארוך" },
  { value: "chips", label: "בחירה מרשימה" },
  { value: "scale", label: "סולם 1 עד 10" },
];

const uid = () => `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function newQuestion(step = 2) {
  return { id: uid(), step, type: "textarea", label: "", hint: "", options: [], required: false, enabled: true };
}

// ===================================================================
//  ברירות המחדל
// ===================================================================
export const DEFAULT_CONTENT = {
  // קישור לטופס חיצוני. כשהוא מלא, כפתורי ההרשמה באתר מפנים אליו
  // במקום לטופס הפנימי. כשהוא ריק, הטופס הפנימי הוא שפעיל.
  externalFormUrl: "",

  intro: {
    title: "שלום וברוכים הבאים",
    body: "מיזם להקמת בתים בישראל. אנחנו כאן כדי להכיר אתכם באמת — לא רק שורה בטבלה.",
    note: "ההצטרפות למאגר ללא עלות ואינה כוללת התחייבות.",
  },

  stepTitles: ["פרטים אישיים", "עולם דתי ולימודים", "אופי ותחומי עניין", "מה מחפשים ואישורים"],

  // כיתובים של שדות הליבה. המפתח הוא מזהה השדה, והערך מחליף את
  // ברירת המחדל שבקוד. שדה שאינו מופיע כאן מוצג כרגיל.
  coreLabels: {},
  coreHints: {},
  coreOptional: {},

  // שאלות עומק דינמיות, שנוספות על אלה שבקוד
  questions: [],

  thankYou: {
    title: "קיבלנו, תודה רבה!",
    body: "הפרטים שלכם הגיעו אלינו. נעבור עליהם בעיון וניצור איתכם קשר.",
  },

  payment: {
    payboxUrl: "",
    bitPhone: "",
    personalTrackPrice: 60,
    successFee: 2500,
  },

  legal: { terms: "", privacy: "" },
};

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

// מיזוג בטוח: מה שנשמר גובר, ומה שחסר נופל לברירת המחדל.
// שום שדה פגום אינו מפיל את המסך.
export function mergeContent(saved) {
  const s = isObj(saved) ? saved : {};
  const d = DEFAULT_CONTENT;
  return {
    externalFormUrl: typeof s.externalFormUrl === "string" ? s.externalFormUrl.trim() : d.externalFormUrl,
    intro: { ...d.intro, ...(isObj(s.intro) ? s.intro : {}) },
    stepTitles:
      Array.isArray(s.stepTitles) && s.stepTitles.length === 4
        ? s.stepTitles.map((t, i) => String(t || d.stepTitles[i]))
        : d.stepTitles,
    coreLabels: isObj(s.coreLabels) ? s.coreLabels : {},
    coreHints: isObj(s.coreHints) ? s.coreHints : {},
    coreOptional: isObj(s.coreOptional) ? s.coreOptional : {},
    questions: Array.isArray(s.questions) ? s.questions.filter(isValidQuestion) : d.questions,
    thankYou: { ...d.thankYou, ...(isObj(s.thankYou) ? s.thankYou : {}) },
    payment: { ...d.payment, ...(isObj(s.payment) ? s.payment : {}) },
    legal: { ...d.legal, ...(isObj(s.legal) ? s.legal : {}) },
  };
}

// שאלה נחשבת תקינה רק אם היא לא מתחזה לשדה ליבה. זו ההגנה שמונעת
// שבירה של מבנה הכרטיס דרך ממשק הניהול.
export function isValidQuestion(q) {
  return (
    isObj(q) &&
    typeof q.id === "string" &&
    q.id.length > 0 &&
    !CORE_FIELD_IDS.has(q.id) &&
    typeof q.label === "string" &&
    QUESTION_TYPES.some((t) => t.value === q.type)
  );
}

// כיתוב שדה ליבה: מה שהמנהלת הגדירה, ואם לא - מה שבקוד
export const coreLabel = (content, id, fallback) =>
  String(content?.coreLabels?.[id] || fallback || CORE_FIELDS.find((f) => f.id === id)?.label || "");

export const coreHint = (content, id, fallback = "") => String(content?.coreHints?.[id] ?? fallback);

// שדה ליבה נעול הוא תמיד חובה. שדה פתוח - לפי מה שהוגדר.
export function isCoreRequired(content, id) {
  const field = CORE_FIELDS.find((f) => f.id === id);
  if (!field) return false;
  if (field.locked) return true;
  return !content?.coreOptional?.[id];
}

// השאלות הדינמיות של שלב מסוים, לפי הסדר שנקבע
export const questionsForStep = (content, step) =>
  (content?.questions || []).filter((q) => q.enabled !== false && Number(q.step) === Number(step));

// תשובות השאלות הדינמיות, מנוסחות לתוך התיאור האישי.
// המנגנון עצמו נשאר קבוע - רק מה שנכנס אליו דינמי.
export function customAnswersToText(content, answers = {}) {
  return (content?.questions || [])
    .filter((q) => q.enabled !== false)
    .map((q) => {
      const raw = answers[q.id];
      const value = Array.isArray(raw) ? raw.join(", ") : String(raw ?? "").trim();
      if (!value) return "";
      if (q.type === "scale") return `${q.label} — ${value} מתוך 10.`;
      const label = String(q.label || "").trim().replace(/[:：]$/, "");
      return label ? `${label} — ${value}${/[.!?]$/.test(value) ? "" : "."}` : value;
    })
    .filter(Boolean)
    .join(" ");
}

// מה חסר מבין השאלות הדינמיות שסומנו כחובה
export function missingCustom(content, answers = {}) {
  return (content?.questions || [])
    .filter((q) => q.enabled !== false && q.required)
    .filter((q) => {
      const raw = answers[q.id];
      const value = Array.isArray(raw) ? raw.join("") : String(raw ?? "").trim();
      return !value;
    })
    .map((q) => q.label || "שאלה");
}
