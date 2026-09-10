// תוכן שהמנהלת עורכת בעצמה, בלי נגיעה בקוד ובלי פריסה מחדש.
//
// הקובץ טהור: אין בו React ואין בו Firebase. הוא מגדיר את מבנה התוכן,
// את ברירות המחדל, ואת המיזוג ביניהן לבין מה שנשמר במסד הנתונים.
//
// למה ברירות מחדל ולא מסד נתונים ריק: כך המערכת עובדת במלואה גם לפני
// שנגעו בלוח הבקרה ולו פעם אחת, וגם אם שדה בודד נמחק בטעות. תוכן
// חסר נופל תמיד לברירת המחדל שבקוד, ולעולם לא למסך ריק.
//
// מפת השאלות עצמה יושבת ב-lib/crm/formSchema.js.

import { BUILTIN_BY_ID, RESERVED_IDS, orderOf, CUSTOM_WIDGET } from "./formSchema";

// סוגי שאלה שאפשר להוסיף ידנית
export const QUESTION_TYPES = [
  { value: "textarea", label: "טקסט ארוך" },
  { value: "text", label: "שורה אחת" },
  { value: "chips", label: "בחירה מרשימה" },
  { value: "scale", label: "סולם 1 עד 10" },
];

const uid = () => `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export function newQuestion(step = 2) {
  // סדר המפתחות זהה לזה שמחזיר cleanQuestion, כדי שהשוואת "יש שינוי\n  // שלא נשמר" תשווה תפוחים לתפוחים ולא תדליק את עצמה לשווא.
  return { id: uid(), type: "textarea", label: "", hint: "", options: [], step, required: false, enabled: true };
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

  // הערה קצרה שמופיעה בראש כל שלב. ריק = לא מוצג כלום.
  stepNotes: [
    "",
    "",
    "החלק הזה עוזר לנו להכיר אתכם לעומק. התשובות נכנסות לתיאור האישי בכרטיס, ונקראות רק בידי צוות השדכניות.",
    "",
  ],

  // שינויים לשאלות המובנות: נוסח, הסבר, שלב, חובה, ודלוק/כבוי.
  // המפתח הוא מזהה השאלה. שאלה שאינה מופיעה כאן מוצגת כברירת המחדל.
  items: {},

  // שאלות שנוספו ידנית
  questions: [],

  // סדר התצוגה המלא, מזהה אחרי מזהה. נשמר בשלמותו בכל שמירה, ולכן
  // הסידור נשאר יציב גם אחרי הוספה, מחיקה או העברה בין שלבים.
  order: [],

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
const str = (v, fallback = "") => (typeof v === "string" ? v : fallback);

// ===================================================================
//  שדרוג מהמבנה הישן
// ===================================================================
// עד הגרסה הזו הכיתובים נשמרו בשלוש מפות נפרדות (coreLabels/coreHints/
// coreOptional) וכיסו רק חלק מהשאלות. כאן הן מתורגמות פעם אחת למבנה
// האחיד, כך ששום דבר שהמנהלת כבר הגדירה אינו הולך לאיבוד.
function migrateLegacy(saved) {
  const out = {};
  const put = (id, patch) => {
    if (!BUILTIN_BY_ID.has(id)) return;
    out[id] = { ...out[id], ...patch };
  };
  if (isObj(saved?.coreLabels)) {
    Object.entries(saved.coreLabels).forEach(([id, v]) => {
      if (str(v).trim()) put(id, { label: str(v).trim() });
    });
  }
  if (isObj(saved?.coreHints)) {
    Object.entries(saved.coreHints).forEach(([id, v]) => {
      if (typeof v === "string") put(id, { hint: v });
    });
  }
  if (isObj(saved?.coreOptional)) {
    Object.entries(saved.coreOptional).forEach(([id, v]) => {
      const base = BUILTIN_BY_ID.get(id);
      if (base && !base.locked) put(id, { required: !v });
    });
  }
  return out;
}

// שינוי תקין לשאלה מובנית: רק המפתחות המוכרים, ורק בסוג הנכון.
// כך ערך פגום שהגיע ממסד הנתונים אינו יכול להפיל את הטופס.
function cleanOverride(raw) {
  if (!isObj(raw)) return null;
  const o = {};
  if (typeof raw.label === "string") o.label = raw.label;
  if (typeof raw.hint === "string") o.hint = raw.hint;
  if (Number.isInteger(Number(raw.step))) o.step = Number(raw.step);
  if (typeof raw.required === "boolean") o.required = raw.required;
  if (typeof raw.enabled === "boolean") o.enabled = raw.enabled;
  return Object.keys(o).length ? o : null;
}

function cleanQuestion(raw) {
  if (!isObj(raw) || typeof raw.id !== "string" || !raw.id || RESERVED_IDS.has(raw.id)) return null;
  const type = Object.prototype.hasOwnProperty.call(CUSTOM_WIDGET, raw.type) ? raw.type : "textarea";
  return {
    id: raw.id,
    type,
    label: str(raw.label),
    hint: str(raw.hint),
    options: Array.isArray(raw.options) ? raw.options.map((o) => String(o)).filter(Boolean) : [],
    step: Number.isInteger(Number(raw.step)) ? Number(raw.step) : 2,
    required: raw.required === true,
    enabled: raw.enabled !== false,
  };
}

// מיזוג בטוח: מה שנשמר גובר, ומה שחסר נופל לברירת המחדל.
// שום שדה פגום אינו מפיל את המסך.
export function mergeContent(saved) {
  const s = isObj(saved) ? saved : {};
  const d = DEFAULT_CONTENT;

  const items = { ...migrateLegacy(s) };
  if (isObj(s.items)) {
    Object.entries(s.items).forEach(([id, raw]) => {
      if (!BUILTIN_BY_ID.has(id)) return;
      const o = cleanOverride(raw);
      if (o) items[id] = { ...items[id], ...o };
    });
  }

  const questions = Array.isArray(s.questions) ? s.questions.map(cleanQuestion).filter(Boolean) : [];

  const merged = {
    externalFormUrl: str(s.externalFormUrl, d.externalFormUrl).trim(),
    intro: { ...d.intro, ...(isObj(s.intro) ? s.intro : {}) },
    stepTitles:
      Array.isArray(s.stepTitles) && s.stepTitles.length === 4
        ? s.stepTitles.map((t, i) => String(t || d.stepTitles[i]))
        : d.stepTitles,
    stepNotes:
      Array.isArray(s.stepNotes) && s.stepNotes.length === 4
        ? s.stepNotes.map((t) => String(t ?? ""))
        : d.stepNotes,
    items,
    questions,
    order: Array.isArray(s.order) ? s.order.filter((id) => typeof id === "string") : [],
    thankYou: { ...d.thankYou, ...(isObj(s.thankYou) ? s.thankYou : {}) },
    payment: { ...d.payment, ...(isObj(s.payment) ? s.payment : {}) },
    legal: { ...d.legal, ...(isObj(s.legal) ? s.legal : {}) },
  };

  // הסדר מנורמל תמיד לרשימה מלאה, כדי ששאלה חדשה או מחוקה לא תשאיר
  // חור ברשימה ותזיז בטעות שאלות אחרות ממקומן.
  merged.order = orderOf(merged);
  return merged;
}
