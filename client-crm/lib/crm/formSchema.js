// מפת השאלות של טופס ההרשמה - נקודת האמת היחידה.
//
// עד כה חלק מהשאלות היו כתובות ישירות בתוך העמוד, ולכן אי אפשר היה
// לכבות אותן, לשנות את הנוסח או להזיז אותן בלי לגעת בקוד. כאן כל
// שאלה בטופס - בלי יוצאת דופן - מתוארת כרשומה אחת, והעמוד רק מצייר
// את מה שכתוב כאן. התוצאה: המנהלת שולטת בכל שאלה מלוח הבקרה.
//
// הקובץ טהור: אין בו React ואין בו Firebase, ולכן אפשר לבדוק אותו
// בנפרד והוא אינו יכול לשבור מסך.

import {
  MARITAL_STATUSES,
  LIFESTYLE_DEFINITIONS,
  BRESLOV_IN_PARTNER,
  SMOKING_SELF,
  CHARACTER_SCALES,
} from "./registerForm";
import { REGIONS, OCCUPATION_OPTIONS } from "./mockData";

// רשימות הבחירה, לפי שם. השאלה מצביעה על שם הרשימה ולא מחזיקה
// עותק שלה, כדי שרשימה תתעדכן במקום אחד ותשפיע בכל מקום.
export const OPTION_SETS = {
  MARITAL_STATUSES,
  LIFESTYLE_DEFINITIONS,
  BRESLOV_IN_PARTNER,
  SMOKING_SELF,
  REGIONS,
  OCCUPATION_OPTIONS,
};

export const optionsOf = (item) =>
  Array.isArray(item?.options) ? item.options : OPTION_SETS[item?.options] || [];

// ===================================================================
//  השאלות שבנויות במערכת
// ===================================================================
// locked=true פירושו שהשאלה אינה ניתנת לכיבוי והיא תמיד חובה. אלה
// חמשת הדברים שבלעדיהם אין כרטיס תקין ואין דרך ליצור קשר: שם, טלפון,
// תאריך לידה, תמונה ואישורים משפטיים (וכן המגדר, שכל המאגר מסונן לפיו).
// כל השאר פתוח לחלוטין: כיבוי, שינוי נוסח, חובה או רשות, וסדר.
//
// step ו-required כאן הם ברירת המחדל בלבד. מה שהמנהלת קובעת בלוח
// הבקרה גובר עליהם תמיד.
export const BUILTIN_ITEMS = [
  // ---------- שלב 1 ----------
  { id: "gender", step: 0, widget: "genderChips", label: "אני", locked: true },
  { id: "name", step: 0, widget: "text", label: "שם מלא", placeholder: "שם פרטי ומשפחה", locked: true },
  {
    id: "phone", step: 0, widget: "tel", label: "מספר טלפון",
    hint: "נשמר בנפרד ומשמש אותנו ליצירת קשר בלבד.", placeholder: "050-1234567", locked: true,
  },
  { id: "birthDate", step: 0, widget: "birthDate", label: "תאריך לידה", locked: true },
  { id: "maritalStatus", step: 0, widget: "chips", label: "מצב משפחתי", options: "MARITAL_STATUSES", required: true },
  { id: "height", step: 0, widget: "number", label: 'גובה (ס"מ)', placeholder: "170", half: true, required: true },
  { id: "eda", step: 0, widget: "text", label: "עדה", placeholder: "אשכנזי / ספרדי / מעורב", half: true, required: true },
  { id: "region", step: 0, widget: "select", label: "אזור מגורים", options: "REGIONS", half: true, required: true },
  { id: "city", step: 0, widget: "text", label: "עיר / יישוב", placeholder: "שם היישוב", half: true, required: true },

  // ---------- שלב 2 ----------
  { id: "lifestyle", step: 1, widget: "chips", label: "הגדרה דתית ואורח חיים", options: "LIFESTYLE_DEFINITIONS", required: true },
  {
    id: "breslov", step: 1, widget: "textarea", rows: 3, label: "הקשר שלי לברסלב",
    hint: "רשות. אם יש זיקה או קשר — נשמח לשמוע.",
    placeholder: "למשל: נוסע לאומן, לומד ליקוטי מוהר״ן, גדלתי בבית ברסלבי...",
  },
  {
    id: "currentOccupation", step: 1, widget: "text", label: "מה אני עושה היום",
    hint: "ישיבה, כולל, עבודה, לימודים אקדמיים, מדרשה וכדומה.",
    placeholder: "לדוגמה: לומדת בסמינר ועובדת בהוראה", required: true,
  },
  {
    id: "occupations", step: 1, widget: "multiChips", label: "מסגרות שעברתי",
    hint: "אפשר לסמן כמה שרוצים.", options: "OCCUPATION_OPTIONS",
  },
  {
    id: "pathStory", step: 1, widget: "textarea", label: "המסלול שלי",
    hint: "תחנות חיים מרכזיות, בקצרה.",
    placeholder: "למשל: אולפנה, שירות לאומי, מדרשה, ועכשיו לימודים...",
  },

  // ---------- שלב 3 ----------
  // הקטבים נשאבים מ-CHARACTER_SCALES כדי שלא יהיו כתובים פעמיים.
  // מכאן והלאה הם שדה ככל שדה אחר, וניתנים לעריכה בלוח הבקרה.
  ...CHARACTER_SCALES.map((sc) => ({
    id: sc.id, step: 2, widget: "scale", label: sc.label, low: sc.low, high: sc.high,
  })),
  // שאלת היסודות (אש/רוח/מים/עפר). כיבוי כאן מסתיר גם את שאלת ההמשך
  // "התכונה הבולטת שלי", כי בלי היסוד היא חסרת משמעות.
  { id: "element", step: 2, widget: "element", label: "היסוד המרכזי שלי" },
  { id: "familyBackground", step: 2, widget: "textarea", rows: 3, label: "רקע משפחתי", hint: "בקצרה — מאיפה הבית שלי." },
  {
    id: "hobbies", step: 2, widget: "textarea", rows: 3, label: "תחביבים וכישרונות",
    placeholder: "למשל: נגינה, טבע, בישול, כתיבה...",
  },
  { id: "importantToKnow", step: 2, widget: "textarea", rows: 3, label: "דברים שחשוב להכיר עליי" },
  {
    id: "selfDescription", step: 2, widget: "textarea", rows: 5, label: "קצת עליי, במילים שלי",
    hint: "שאיפות, דרך חיים, מה מניע אותי.",
  },

  // ---------- שלב 4 ----------
  { id: "lookingFor", step: 3, widget: "textarea", rows: 4, label: "מה אני מחפש/ת", hint: "קווים לדמותו/ה של בן/בת הזוג." },
  { id: "preferredAges", step: 3, widget: "text", label: "גילאים מועדפים", placeholder: "למשל 22-27", half: true },
  { id: "smokingSelf", step: 3, widget: "select", label: "עישון", options: "SMOKING_SELF", allowEmpty: true, half: true },
  { id: "mainRequirements", step: 3, widget: "textarea", rows: 3, label: "דרישות מרכזיות" },
  { id: "breslovInPartner", step: 3, widget: "chips", label: "הקשר לברסלב אצל בן/בת הזוג", options: "BRESLOV_IN_PARTNER" },
  {
    id: "referenceContacts", step: 3, widget: "textarea", rows: 3, label: "אנשי קשר לבירורים",
    hint: "שמות וטלפונים של רבנים, מחנכים או מכרים שאפשר לפנות אליהם.", required: true,
  },
  {
    id: "photos", step: 3, widget: "photos", label: "תמונות (עד 4)",
    hint: "הראשונה תשמש כתמונה הראשית בכרטיס. התמונות מוצגות לצוות המאגר בלבד.", locked: true,
  },
  { id: "consents", step: 3, widget: "consents", label: "אישורים משפטיים", locked: true },
];

export const BUILTIN_BY_ID = new Map(BUILTIN_ITEMS.map((it) => [it.id, it]));

// מזהים תפוסים: כל שאלה מובנית, ובנוסף שדות עזר שיושבים על אותו
// אובייקט טופס. שאלה חדשה שתקבל אחד מהם הייתה דורסת שדה קיים.
export const RESERVED_IDS = new Set([
  ...BUILTIN_ITEMS.map((it) => it.id),
  "age",
  "elementWhy",
  "id",
  "status",
]);

export const scaleOf = (id) => CHARACTER_SCALES.find((s) => s.id === id) || null;

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const clampStep = (n, fallback) => {
  const v = Number(n);
  return Number.isInteger(v) && v >= 0 && v <= 3 ? v : fallback;
};

// סוגי השאלות שאפשר להוסיף ידנית, והוידג'ט שמצייר כל אחת
export const CUSTOM_WIDGET = {
  text: "text",
  textarea: "textarea",
  chips: "chips",
  scale: "scale",
};

// ===================================================================
//  הרכבת הרשימה בפועל
// ===================================================================
// מחזירה את כל השאלות, מובנות ומוספות כאחת, לפי הסדר שנקבע ועם
// הנוסח שנקבע. שאלה כבויה נשארת ברשימה עם enabled=false, כדי שמסך
// הניהול יוכל להציג אותה ולהדליק אותה בחזרה.
export function resolveItems(content) {
  const overrides = isObj(content?.items) ? content.items : {};
  const customs = Array.isArray(content?.questions) ? content.questions : [];

  const builtins = BUILTIN_ITEMS.map((base) => {
    const o = isObj(overrides[base.id]) ? overrides[base.id] : {};
    const locked = base.locked === true;
    return {
      ...base,
      kind: "builtin",
      locked,
      label: typeof o.label === "string" && o.label.trim() ? o.label.trim() : base.label,
      hint: typeof o.hint === "string" ? o.hint : base.hint || "",
      step: clampStep(o.step, base.step),
      enabled: locked ? true : o.enabled !== false,
      required: locked ? true : o.required === undefined ? base.required === true : o.required === true,
      // רשימת הבחירה ניתנת לעריכה גם בשאלות המובנות, כדי שאפשר יהיה
      // להוסיף אפשרות (למשל קהילה נוספת) ולשייך אליה תווית סינון.
      options: Array.isArray(o.options) && o.options.length > 0 ? o.options : base.options,
      // קטבי הסולם. ריק חוזר לברירת המחדל, ולכן אי אפשר להישאר עם סולם
      // בלי צדדים בגלל מחיקה בטעות.
      low: typeof o.low === "string" && o.low.trim() ? o.low.trim() : base.low || "",
      high: typeof o.high === "string" && o.high.trim() ? o.high.trim() : base.high || "",
    };
  });

  const extras = customs.filter(isValidCustom).map((q) => ({
    id: q.id,
    kind: "custom",
    widget: CUSTOM_WIDGET[q.type] || "textarea",
    type: q.type,
    label: String(q.label || "").trim() || "שאלה",
    hint: typeof q.hint === "string" ? q.hint : "",
    options: Array.isArray(q.options) ? q.options : [],
    step: clampStep(q.step, 2),
    enabled: q.enabled !== false,
    required: q.required === true,
    locked: false,
    rows: 4,
    low: typeof q.low === "string" ? q.low.trim() : "",
    high: typeof q.high === "string" ? q.high.trim() : "",
  }));

  const all = [...builtins, ...extras];
  const saved = Array.isArray(content?.order) ? content.order : [];
  const pos = new Map();
  saved.forEach((id, i) => {
    if (!pos.has(id)) pos.set(id, i);
  });
  // שאלה שאינה מופיעה ברשימת הסדר השמורה - למשל שאלה חדשה שנוספה
  // בגרסת תוכנה - נכנסת אחרי כל מה שכבר מסודר, ולעולם לא נעלמת.
  const rank = (item, index) => (pos.has(item.id) ? pos.get(item.id) : saved.length + index);
  return all
    .map((item, index) => ({ item, key: rank(item, index) }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.item);
}

// סדר מלא של כל המזהים - נשמר כדי שהסידור יישאר יציב לאורך זמן
export const orderOf = (content) => resolveItems(content).map((it) => it.id);

// השאלות שבאמת מוצגות בשלב מסוים
export const visibleItems = (content, step) =>
  resolveItems(content).filter((it) => it.enabled && Number(it.step) === Number(step));

// שאלה מוספת תקינה רק אם היא אינה מתחזה לשדה קיים. זו ההגנה שמונעת
// שבירה של מבנה הכרטיס דרך לוח הבקרה.
export function isValidCustom(q) {
  return (
    isObj(q) &&
    typeof q.id === "string" &&
    q.id.length > 0 &&
    !RESERVED_IDS.has(q.id) &&
    typeof q.label === "string" &&
    Object.prototype.hasOwnProperty.call(CUSTOM_WIDGET, q.type)
  );
}

// ===================================================================
//  מה חסר כדי לשלוח
// ===================================================================
const filled = (v) => (Array.isArray(v) ? v.length > 0 : String(v ?? "").trim().length > 0);

// ערך של שאלה, לפי המקום שבו הוא באמת יושב
function valueOf(item, form, custom, photos) {
  if (item.kind === "custom") return custom?.[item.id];
  switch (item.id) {
    case "birthDate":
      return form.birthDate || form.age;
    case "photos":
      return photos;
    case "occupations":
      return form.occupations;
    default:
      return form[item.id];
  }
}

// רשימת מה שחסר, בעברית, יחד עם השלב שאליו צריך לחזור. מוחזר כרשימה
// ולא כדגל, כדי שההודעה תוכל לומר במפורש מה נשאר וכפתור "מה חסר"
// יוכל לקפוץ בדיוק לשלב הנכון.
export function missingItems(content, form, { photos = [], custom = {}, agreeTerms, agreePrivacy } = {}) {
  const out = [];
  resolveItems(content).forEach((item) => {
    if (!item.enabled || !item.required) return;
    if (item.id === "consents") {
      if (!agreeTerms) out.push({ id: item.id, label: "אישור הסכם ההתקשרות", step: item.step });
      if (!agreePrivacy) out.push({ id: item.id, label: "אישור מדיניות הפרטיות", step: item.step });
      return;
    }
    // סולם תמיד מגיע עם ערך התחלתי, ולכן אינו יכול להיות חסר
    if (item.widget === "scale" || item.widget === "simpleScale") return;
    if (!filled(valueOf(item, form, custom, photos))) {
      // המזהה נדרש כדי לגלול בדיוק אל השדה החסר ולסמן אותו, ולא רק
      // לקפוץ לראש השלב ולהשאיר את המשתמש/ת לחפש מה פספסו.
      out.push({ id: item.id, label: item.label, step: item.step });
    }
  });
  return out;
}

// התשובות לשאלות שהמנהלת הוסיפה, מנוסחות לתוך התיאור האישי
export function customAnswersText(content, custom = {}) {
  return resolveItems(content)
    .filter((it) => it.kind === "custom" && it.enabled)
    .map((q) => {
      const raw = custom[q.id];
      const value = Array.isArray(raw) ? raw.join(", ") : String(raw ?? "").trim();
      if (!value) return "";
      // סולמות מנוסחים במשפט האופי (ראו scaleAnswers), ולכן אינם
      // חוזרים כאן בשנית.
      if (q.widget === "scale") return "";
      const label = q.label.trim().replace(/[:：]$/, "");
      return label ? `${label} — ${value}${/[.!?]$/.test(value) ? "" : "."}` : value;
    })
    .filter(Boolean)
    .join(" ");
}

// ===================================================================
//  פעולות סידור - טהורות, כדי שאפשר יהיה לבדוק אותן בנפרד
// ===================================================================

// הזזת שאלה מעלה או מטה בתוך השלב שלה בלבד. שאלות של שלבים אחרים
// נשארות במקומן, ולכן חץ אינו יכול "להבריח" שאלה לשלב שכן.
export function movedOrder(content, id, dir) {
  const items = resolveItems(content);
  const order = items.map((it) => it.id);
  const i = order.indexOf(id);
  if (i < 0) return order;
  const step = items[i].step;
  let j = i + dir;
  while (j >= 0 && j < items.length && items[j].step !== step) j += dir;
  if (j < 0 || j >= items.length) return order;
  [order[i], order[j]] = [order[j], order[i]];
  return order;
}

// מיקום לשאלה חדשה: בסוף השלב שאליו היא שייכת, ולא בסוף הטופס.
// המזהה מוסר מהרשימה לפני החישוב, כדי שקריאה על שאלה שכבר קיימת
// תזיז אותה ולא תשכפל אותה.
export function orderWithInserted(content, id, step) {
  const items = resolveItems(content).filter((it) => it.id !== id);
  const order = items.map((it) => it.id);
  let at = order.length;
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (items[i].step === step) {
      at = i + 1;
      break;
    }
  }
  order.splice(at, 0, id);
  return order;
}

// מזהי השאלות המובנות שמוצגות כרגע. משמש את מנוע ניסוח התיאור האישי,
// כדי שהטקסט ייבנה אך ורק משאלות שנשאלו בפועל.
export const activeBuiltinIds = (content) =>
  new Set(resolveItems(content).filter((it) => it.kind === "builtin" && it.enabled).map((it) => it.id));

// שאלות שהתשובה עליהן היא בחירה מרשימה סגורה. רק אליהן אפשר לשייך
// תווית סינון, כי רק בהן יש קבוצת ערכים ידועה מראש לבחור מתוכה.
export const CHOICE_WIDGETS = new Set(["chips", "select", "multiChips"]);

export function choiceItems(content) {
  return resolveItems(content)
    .filter((it) => CHOICE_WIDGETS.has(it.widget))
    .map((it) => ({ id: it.id, label: it.label, enabled: it.enabled, options: optionsOf(it) }));
}

// ===================================================================
//  סולמות
// ===================================================================
// כל שאלות הסולם שמוצגות כרגע, מובנות ומוספות כאחת, עם הקטבים שלהן
// והתשובה שניתנה. זה מה שמנוע ניסוח התיאור האישי מקבל, ולכן סולם
// שהמנהלת הוסיפה נכנס לטקסט בדיוק כמו השלושה שבקוד.
export function scaleAnswers(content, form = {}, custom = {}) {
  return resolveItems(content)
    .filter((it) => it.widget === "scale" && it.enabled)
    .map((it) => ({
      id: it.id,
      label: it.label,
      low: it.low,
      high: it.high,
      value: it.kind === "custom" ? custom[it.id] : form[it.id],
    }));
}

// שאלות סולם לעריכה בלוח הבקרה
export const isScaleItem = (item) => item?.widget === "scale";
