// ניתוח טקסט חופשי בעברית לשדות של כרטיס מועמד/ת.
//
// שתי שכבות:
// 1. שדות מתויגים ("שם: ...", "גיל - 26") - הדרך המדויקת, ולכן נבדקת ראשונה.
// 2. זיהוי חופשי בגוף הטקסט (מספרי טלפון, גיל, גובה, ערכים מתוך הרשימות הקבועות).
//
// שדה שלא זוהה פשוט לא מוחזר, ונשאר ריק בטופס להשלמה ידנית.

import {
  REGIONS,
  LIFESTYLE_TAGS,
  TRAITS,
  EDUCATION_OPTIONS,
  YESHIVA_LEVELS,
  religiousLevelsFor,
  smokingOptionsFor,
} from "./mockData";

const LABELS = {
  name: ["שם מלא", "שם המועמד", "שם המועמדת", "שם"],
  age: ["גיל", "בן", "בת"],
  height: ["גובה"],
  city: ["עיר מגורים", "יישוב", "ישוב", "עיר", "מתגורר ב", "מתגוררת ב", "גר ב", "גרה ב"],
  region: ["אזור", "איזור"],
  eda: ["עדה", "מוצא"],
  religiousLevel: ["רמת דתיות", "רמה דתית", "השקפה", "זרם", "רמת תורניות"],
  education: ["השכלה", "לימודים", "עיסוק", "מקצוע"],
  yeshivaLevel: ["ישיבה", "רמת לימוד", "מסגרת"],
  smoking: ["עישון", "מעשן", "מעשנת"],
  phone: ["טלפון", "נייד", "פלאפון", "מספר"],
  bio: ["קצת עליו", "קצת עליה", "על עצמו", "על עצמה", "תיאור", "רקע", "אודות"],
  referenceContacts: ["ממליצים", "בירורים", "אנשי קשר", "לבירורים", "ממליץ"],
};

const EDOT = [
  "אשכנזי", "אשכנזית", "ספרדי", "ספרדיה", "ספרדייה", "תימני", "תימניה",
  "מרוקאי", "מרוקאית", "עיראקי", "עיראקית", "פרסי", "פרסית", "מעורב", "מעורבת",
  "חבד", 'חב"ד', "בוכרי", "בוכרית", "תוניסאי", "תוניסאית", "לובי", "אתיופי", "אתיופית",
];

const clean = (v) => String(v || "").replace(/\s+/g, " ").trim();

// שורה מתויגת: "תווית: ערך" או "תווית - ערך"
function labeledValue(text, labels) {
  for (const label of labels) {
    const re = new RegExp(`(?:^|\\n)\\s*${label}\\s*[:：\\-–]\\s*(.+)`, "u");
    const m = text.match(re);
    if (m && clean(m[1])) return clean(m[1]);
  }
  return null;
}

// ערך מתוך רשימה סגורה שמופיע איפשהו בטקסט. הערך הארוך ביותר מנצח,
// כדי ש"תואר שני" לא יזוהה בטעות כ"תואר ראשון" וכדומה.
function optionInText(text, options) {
  const hits = options.filter((o) => o && o !== "הכל" && o !== "לא משנה" && text.includes(o));
  if (hits.length === 0) return null;
  return hits.sort((a, b) => b.length - a.length)[0];
}

function parsePhone(text) {
  const labeled = labeledValue(text, LABELS.phone);
  const source = labeled || text;
  const m = source.match(/0\s?5\d[\s-]?\d{3}[\s-]?\d{4}|0\d{1,2}[\s-]?\d{3}[\s-]?\d{4}/);
  if (!m) return null;
  const digits = m[0].replace(/[^0-9]/g, "");
  return digits.length >= 9 && digits.length <= 10 ? digits : null;
}

function parseAge(text) {
  const labeled = labeledValue(text, ["גיל"]);
  if (labeled) {
    const n = parseInt(labeled, 10);
    if (n >= 16 && n <= 99) return String(n);
  }
  const m =
    text.match(/(?:^|\s)(?:בן|בת)\s+(\d{2})(?!\d)/u) ||
    text.match(/גיל\s*[:\-–]?\s*(\d{2})(?!\d)/u) ||
    text.match(/(\d{2})\s*שנים/u);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 16 && n <= 99) return String(n);
  }
  return null;
}

function parseHeight(text) {
  // 1.78 / 178 ס"מ / גובה 178
  const meters = text.match(/(?:^|\s)(1[.,]\d{2})(?:\s|$)/u);
  if (meters) {
    const cm = Math.round(parseFloat(meters[1].replace(",", ".")) * 100);
    if (cm >= 130 && cm <= 220) return String(cm);
  }
  const cmMatch =
    text.match(/(\d{3})\s*(?:ס[״"']?מ|סנטימטר)/u) || text.match(/גובה\s*[:\-–]?\s*(\d{3})(?!\d)/u);
  if (cmMatch) {
    const cm = parseInt(cmMatch[1], 10);
    if (cm >= 130 && cm <= 220) return String(cm);
  }
  return null;
}

function parseName(text) {
  const labeled = labeledValue(text, LABELS.name);
  if (labeled) return labeled.split(/[,،|]/)[0].trim();

  // "דוד לוי בן 27..." - השם הוא מה שמופיע לפני "בן/בת" ומיד אחריו גיל
  const beforeAge = text.match(/(?:^|\n)\s*([֐-׿'"’\s]{2,28}?)\s+(?:בן|בת)\s+\d{2}(?!\d)/u);
  if (beforeAge) {
    const candidateName = clean(beforeAge[1]);
    const words = candidateName.split(" ").filter(Boolean);
    if (words.length >= 1 && words.length <= 4) return candidateName;
  }

  // גיבוי: השורה הראשונה, אם היא קצרה ונראית כמו שם (בלי ספרות ובלי נקודתיים)
  const first = clean(text.split("\n")[0]);
  if (first && first.length <= 30 && !/\d/.test(first) && !first.includes(":")) {
    const words = first.split(" ").filter(Boolean);
    if (words.length >= 1 && words.length <= 4) return first;
  }
  return null;
}

function parseBio(text) {
  const labeled = labeledValue(text, LABELS.bio);
  if (labeled) return labeled;

  // גיבוי: הפסקה הארוכה ביותר שאינה שורת "תווית: ערך"
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => clean(p))
    .filter((p) => p.length > 60 && !/^[^\s:]{1,12}\s*[:：]/u.test(p));
  if (paragraphs.length === 0) return null;
  return paragraphs.sort((a, b) => b.length - a.length)[0];
}

// gender קובע מאיזו רשימה נשלפים ערכי הדתיות והעישון
export function parseCandidateText(rawText, gender = "male") {
  const text = String(rawText || "").replace(/\r/g, "");
  if (!text.trim()) return { fields: {}, traits: [], lifestyle: [], found: [] };

  const fields = {};
  const put = (key, value) => {
    if (value !== null && value !== undefined && String(value).trim() !== "") fields[key] = value;
  };

  put("name", parseName(text));
  put("age", parseAge(text));
  put("height", parseHeight(text));
  put("phone", parsePhone(text));
  put("city", labeledValue(text, LABELS.city));
  put("region", labeledValue(text, LABELS.region) || optionInText(text, REGIONS));
  put("eda", labeledValue(text, LABELS.eda) || optionInText(text, EDOT));
  put(
    "religiousLevel",
    optionInText(text, religiousLevelsFor(gender)) || labeledValue(text, LABELS.religiousLevel)
  );
  put("smoking", optionInText(text, smokingOptionsFor(gender)));
  put("referenceContacts", labeledValue(text, LABELS.referenceContacts));
  put("bio", parseBio(text));

  if (gender === "female") {
    put("education", optionInText(text, EDUCATION_OPTIONS) || labeledValue(text, LABELS.education));
  } else {
    put("yeshivaLevel", optionInText(text, YESHIVA_LEVELS) || labeledValue(text, LABELS.yeshivaLevel));
  }

  // ערך שנשלף מתווית חייב להתקיים ברשימה הסגורה, אחרת הוא ייצור בחירה לא תקינה
  const closed = {
    region: REGIONS,
    religiousLevel: religiousLevelsFor(gender),
    education: EDUCATION_OPTIONS,
    yeshivaLevel: YESHIVA_LEVELS,
    smoking: smokingOptionsFor(gender),
  };
  Object.entries(closed).forEach(([key, options]) => {
    if (fields[key] && !options.includes(fields[key])) delete fields[key];
  });

  const traits = TRAITS.filter((t) => text.includes(t));
  const lifestyle = LIFESTYLE_TAGS.filter((t) => text.includes(t));

  const labelsHe = {
    name: "שם",
    age: "גיל",
    height: "גובה",
    phone: "טלפון",
    city: "עיר",
    region: "אזור",
    eda: "עדה",
    religiousLevel: "רמת דתיות",
    education: "השכלה",
    yeshivaLevel: "רמת לימוד",
    smoking: "עישון",
    referenceContacts: "מספרים לבירורים",
    bio: "תיאור",
  };
  const found = Object.keys(fields).map((k) => labelsHe[k] || k);
  if (traits.length) found.push("תכונות");
  if (lifestyle.length) found.push("סגנון חיים");

  return { fields, traits, lifestyle, found };
}
