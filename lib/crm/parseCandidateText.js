// זיהוי אוטומטי של פרטי מועמד/ת מתוך טקסט חופשי (למשל הודעת וואטסאפ שהודבקה).
// מה שלא מזוהה בוודאות פשוט לא מוחזר, והשדה נשאר ריק למילוי ידני.

import { REGIONS, RELIGIOUS_LEVELS_MALE, RELIGIOUS_LEVELS_FEMALE, EDUCATION_OPTIONS, YESHIVA_LEVELS, TRAITS } from "./mockData";

const LABELS = {
  name: ["שם מלא", "שם המועמד", "שם המועמדת", "שם"],
  age: ["גיל", "בן", "בת"],
  height: ["גובה"],
  city: ["עיר מגורים", "מקום מגורים", "יישוב", "ישוב", "עיר", "גר ב", "גרה ב", "מתגורר ב", "מתגוררת ב"],
  region: ["אזור"],
  eda: ["עדה", "מוצא"],
  phone: ["טלפון", "נייד", "פלאפון", "מספר"],
  religiousLevel: ["רמה דתית", "רמת תורניות", "השקפה", "זרם"],
  education: ["השכלה", "לימודים", "מסלול"],
  yeshivaLevel: ["ישיבה", "רמת לימוד", "מסגרת"],
  bio: ["קצת עלי", "קצת עליי", "תיאור", "אודות", "על עצמו", "על עצמה", "רקע"],
  referenceContacts: ["ממליצים", "לבירורים", "בירורים", "המלצות"],
};

const EDOT = ["אשכנזי", "אשכנזיה", "ספרדי", "ספרדיה", "תימני", "תימניה", "מרוקאי", "מרוקאית", "חבד", "מעורב", "מעורבת", "בוכרי", "פרסי", "עיראקי", "תוניסאי", "לובי", "אתיופי"];

const clean = (s) => String(s || "").replace(/[‎‏‪-‮]/g, "").trim();

// "052-1234567", "0521234567", "052 123 4567"
function findPhone(text) {
  const m = text.match(/0\s?5\d[\s-]?\d{3}[\s-]?\d{4}/) || text.match(/0\d{1,2}[\s-]?\d{3}[\s-]?\d{4}/);
  if (!m) return null;
  const digits = m[0].replace(/\D/g, "");
  return digits.length === 10 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits;
}

function findAge(text) {
  const labeled = text.match(/(?:גיל|בן|בת)\s*:?\s*(\d{2})/);
  if (labeled) {
    const n = Number(labeled[1]);
    if (n >= 17 && n <= 75) return n;
  }
  return null;
}

function findHeight(text) {
  const meters = text.match(/(?:גובה\s*:?\s*)?(1[.,]\d{2})\s*(?:מ')?/);
  if (meters) {
    const n = Math.round(Number(meters[1].replace(",", ".")) * 100);
    if (n >= 130 && n <= 220) return n;
  }
  const cm = text.match(/(?:גובה\s*:?\s*)?(\d{3})\s*(?:ס"מ|ס״מ|סמ|cm)?/);
  if (cm) {
    const n = Number(cm[1]);
    if (n >= 130 && n <= 220) return n;
  }
  return null;
}

// שימו לב: גבול מילה (\b) אינו עובד על אותיות עבריות, ולכן ההתאמה כאן על הטקסט עצמו
function findGender(text) {
  if (/(בחורה|מועמדת|רווקה|היא |בת\s*:?\s*\d)/.test(text)) return "female";
  if (/(בחור|מועמד|רווק|הוא |בן\s*:?\s*\d)/.test(text)) return "male";
  return null;
}

// "גר בפתח תקווה", "מתגוררת בבית שמש" - בלי נקודתיים
function findCityInSentence(text) {
  const m = text.match(/(?:גר|גרה|מתגורר|מתגוררת)\s+ב([א-ת]+(?:\s[א-ת]+){0,2})/);
  return m ? clean(m[1]) : null;
}

// מחפש ערך מתוך רשימת אפשרויות סגורה בתוך הטקסט (הארוך ביותר מנצח)
function findFromOptions(text, options) {
  const hits = options.filter((o) => o !== "הכל" && o !== "לא משנה" && text.includes(o));
  if (hits.length === 0) return null;
  return hits.sort((a, b) => b.length - a.length)[0];
}

function findLabeledValue(lines, labels) {
  for (const line of lines) {
    for (const label of labels) {
      const re = new RegExp(`^\\s*${label}\\s*[:\\-–]\\s*(.+)$`);
      const m = line.match(re);
      if (m) {
        const value = clean(m[1]);
        if (value) return { value, line };
      }
    }
  }
  return null;
}

export function parseCandidateText(rawText) {
  const text = clean(rawText).replace(/\r/g, "");
  if (!text) return { fields: {}, traits: [], usedLines: [] };

  const lines = text.split("\n").map(clean).filter(Boolean);
  const fields = {};
  const usedLines = new Set();

  const take = (key, labels) => {
    const hit = findLabeledValue(lines, labels);
    if (hit) {
      fields[key] = hit.value;
      usedLines.add(hit.line);
    }
  };

  Object.entries(LABELS).forEach(([key, labels]) => take(key, labels));

  const gender = findGender(text);
  if (gender) fields.gender = gender;

  // שם: אם אין שורת "שם:", לוקחים את השורה הראשונה אם היא קצרה ונראית כמו שם
  if (!fields.name && lines.length > 0) {
    const first = lines[0];
    if (first.length <= 30 && !/\d/.test(first) && first.split(" ").length <= 4) {
      fields.name = first;
      usedLines.add(first);
    }
  }

  const age = findAge(fields.age ? String(fields.age) : text) ?? findAge(text);
  if (age) fields.age = String(age);
  else delete fields.age;

  const height = findHeight(fields.height ? String(fields.height) : text) ?? findHeight(text);
  if (height) fields.height = String(height);
  else delete fields.height;

  const phone = findPhone(fields.phone ? String(fields.phone) : text) || findPhone(text);
  if (phone) fields.phone = phone;
  else delete fields.phone;

  const region = findFromOptions(text, REGIONS);
  if (region) fields.region = region;
  else delete fields.region;

  if (!fields.eda) {
    const eda = findFromOptions(text, EDOT);
    if (eda) fields.eda = eda;
  }

  const levels = gender === "female" ? RELIGIOUS_LEVELS_FEMALE : RELIGIOUS_LEVELS_MALE;
  const level = findFromOptions(text, levels);
  if (level) fields.religiousLevel = level;
  else delete fields.religiousLevel;

  const education = findFromOptions(text, EDUCATION_OPTIONS);
  if (education) fields.education = education;
  else delete fields.education;

  const yeshiva = findFromOptions(text, YESHIVA_LEVELS);
  if (yeshiva) fields.yeshivaLevel = yeshiva;
  else delete fields.yeshivaLevel;

  if (/לא\s*מעש/.test(text)) fields.smoking = gender === "female" ? "לא מעשנת - חובה" : "לא מעשן - חובה";

  if (!fields.city) {
    const city = findCityInSentence(text);
    if (city) fields.city = city;
  }

  const traits = TRAITS.filter((t) => text.includes(t));

  // כל מה שלא זוהה כשדה מסומן הופך לתיאור החופשי, כדי שלא ילך לאיבוד מידע
  if (!fields.bio) {
    const leftovers = lines.filter((l) => !usedLines.has(l) && l.length > 25);
    if (leftovers.length > 0) fields.bio = leftovers.join("\n");
  }

  return { fields, traits, usedLines: [...usedLines] };
}
