// תוויות הסינון המהיר, ושיוכן לשאלות בשאלון.
//
// עד כה התווית הייתה שדה ידני בלבד בכרטיס: מי שמילא/ה את הטופס החיצוני
// והגדיר/ה את עצמו/ה "תורני" לא קיבל/ה תווית כלל, ולכן סינון לפי
// "תורני" החזיר מסך ריק. ההפרדה הזו בין מה שנשאל בשאלון לבין מה
// שמסננים לפיו היא שגרמה לתוויות "לא להתאים לשאלות".
//
// כאן כל תווית יכולה להצביע על שאלה ועל התשובות שמתאימות לה, ולכן
// הסינון מתיישר מאליו עם מה שהמועמד/ת ענו בפועל. התווית הידנית ממשיכה
// לעבוד במקביל, ולכן שום כרטיס קיים אינו מאבד את הסיווג שלו.
//
// קובץ טהור: בלי React ובלי Firebase.

import { normalizeTagName } from "./mockData";

// ברירת המחדל: בדיוק התוויות שהיו, עם שיוך לשאלות שמתאים לתשובות
// האפשריות בשאלון. הכל ניתן לשינוי מלוח הבקרה.
export const DEFAULT_TAGS = [
  { id: "t-torani", name: "תורני", color: "#13455A", textColor: "#FFFFFF", questionId: "lifestyle", values: ["תורני", 'חרד"ל'] },
  { id: "t-datlash", name: 'דתל"שים ומסורתיים', color: "#1F6E88", textColor: "#FFFFFF", questionId: "lifestyle", values: ['דתל"ש', "מסורתי"] },
  { id: "t-chabad", name: 'חב"ד', color: "#2E8BA8", textColor: "#FFFFFF", questionId: "lifestyle", values: [] },
  { id: "t-returnee", name: "חוזר/ת בתשובה", color: "#4E9CB8", textColor: "#FFFFFF", questionId: "lifestyle", values: ["בעל/ת תשובה"] },
  { id: "t-breslov", name: "ברסלב", color: "#74B9CE", textColor: "#23414E", questionId: "lifestyle", values: ["ברסלב"] },
  { id: "t-second", name: "פרק ב'", color: "#D6EEF6", textColor: "#23414E", questionId: "maritalStatus", values: ["גרוש/ה", "אלמן/ה"] },
];

export const TAG_COLORS = [
  { color: "#13455A", textColor: "#FFFFFF" },
  { color: "#1F6E88", textColor: "#FFFFFF" },
  { color: "#2E8BA8", textColor: "#FFFFFF" },
  { color: "#4E9CB8", textColor: "#FFFFFF" },
  { color: "#74B9CE", textColor: "#23414E" },
  { color: "#D6EEF6", textColor: "#23414E" },
  { color: "#7E9B5A", textColor: "#FFFFFF" },
  { color: "#C4894C", textColor: "#FFFFFF" },
  { color: "#9A6FA8", textColor: "#FFFFFF" },
  { color: "#C4584C", textColor: "#FFFFFF" },
];

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const str = (v) => String(v ?? "").trim();

export const newTag = () => ({
  id: `tag-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
  name: "",
  color: TAG_COLORS[2].color,
  textColor: TAG_COLORS[2].textColor,
  questionId: "",
  values: [],
});

// ניקוי רשומת תווית שהגיעה ממסד הנתונים. ערך פגום לא יפיל מסך.
//
// שם ריק מותר בכוונה: תווית חדשה נולדת בלי שם, והמנהלת מקלידה אותו
// אחרי שהיא נוספה. פסילה על שם ריק הייתה מוחקת אותה באותו רגע.
// ההסתרה של תווית בלי שם נעשית בתצוגה (visibleTags), לא כאן.
export function cleanTag(raw) {
  if (!isObj(raw) || !str(raw.id)) return null;
  return {
    id: str(raw.id),
    name: str(raw.name),
    color: /^#[0-9a-fA-F]{3,8}$/.test(str(raw.color)) ? str(raw.color) : TAG_COLORS[2].color,
    textColor: /^#[0-9a-fA-F]{3,8}$/.test(str(raw.textColor)) ? str(raw.textColor) : "#FFFFFF",
    questionId: str(raw.questionId),
    values: Array.isArray(raw.values) ? raw.values.map(str).filter(Boolean) : [],
  };
}

// התוויות בפועל: מה שהוגדר בלוח הבקרה, ואם לא הוגדר דבר - ברירת המחדל.
export function resolveTags(content) {
  const saved = Array.isArray(content?.tags) ? content.tags.map(cleanTag).filter(Boolean) : [];
  return saved.length > 0 ? saved : DEFAULT_TAGS;
}

// שם השדה בכרטיס שבו יושבת התשובה לשאלה. רוב השאלות נשמרות תחת אותו
// מזהה, ולכן מצוינים כאן רק החריגים.
const FIELD_ALIAS = {
  lifestyle: "religiousLevel",
  photos: null,
  consents: null,
};

// כל הערכים שהמועמד/ת ענו לשאלה מסוימת, כרשימה. שאלה שנשמרה כמערך
// (למשל "מסגרות שעברתי") מוחזרת כפי שהיא, וכך תווית יכולה להתאים לכל
// אחד מהערכים שנבחרו.
export function candidateValuesFor(candidate, questionId) {
  if (!candidate || !questionId) return [];
  const key = questionId in FIELD_ALIAS ? FIELD_ALIAS[questionId] : questionId;
  const raw = key ? candidate[key] : undefined;
  const fromCustom = isObj(candidate.customAnswers) ? candidate.customAnswers[questionId] : undefined;
  const value = raw === undefined || raw === null || raw === "" ? fromCustom : raw;
  if (Array.isArray(value)) return value.map(str).filter(Boolean);
  const one = str(value);
  return one ? [one] : [];
}

// כרטיס מתאים לתווית אם התווית סומנה בו ידנית, או אם התשובה שלו
// לשאלה המשויכת היא אחת מהתשובות שהוגדרו לתווית.
export function tagMatches(candidate, tag) {
  if (!tag) return false;
  if (normalizeTagName(candidate?.tag) === tag.name) return true;
  if (!tag.questionId || tag.values.length === 0) return false;
  const values = candidateValuesFor(candidate, tag.questionId);
  if (values.length === 0) return false;
  return tag.values.some((wanted) => values.includes(wanted));
}

// התוויות שמוצגות למשתמשים. תווית שעדיין אין לה שם קיימת בלוח הבקרה
// אך אינה מופיעה ברצועת הסינון ובכרטיסים, כדי שלא יופיע כפתור ריק.
export const visibleTags = (content) => resolveTags(content).filter((t) => t.name);

// מציאת התווית לפי שם, לצורך סינון שנשמר לפי שם ולא לפי מזהה
export const findTagByName = (tags, name) => tags.find((t) => t.name === name) || null;
