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

// נרמול עברי להשוואת טקסט (הסרת ניקוד/סימנים/רווחים כפולים).
function normHeb(s) {
  return (s || "")
    .replace(/[֑-ׇ]/g, "")
    .replace(/["'׳״“”‚.,:;!?()\[\]{}\-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// בונה "מרקרים" זיהוי לכל שאלה פתוחה (מהניסוח לזכר ולנקבה), לזיהוי השאלה בטקסט שהודבק.
function buildQMarkers(openQuestions) {
  const markers = [];
  (openQuestions || []).forEach((q) => {
    [q.male, q.female].forEach((txt) => {
      const n = normHeb(txt);
      if (n.length >= 8) markers.push({ key: q.key, marker: n.slice(0, 16) });
    });
  });
  return markers;
}

// מילות מפתch נושאיות לכל שאלה (ברירת המחדל) - לניתוב חכם של משפטים לפי הקשר.
const Q_KEYWORDS = {
  q1: ["רב יצחק", "גינזבורג", "אמונה", "רוחני", "רוחניות", "השראה", "חסידות", "פנימי", "פנימיות", "נשמה", "דבקות", "תורה"],
  q2: ["חבד", "הנהגות", "יומיום", "מצוות", "קבלה", "הידור", "מנהג", "שליחות", "חסידי", "התוועדות"],
  q3: ["מתייעצים", "התייעצות", "כתובת", "עזרה", "עצה", "עצות", "מקשיב", "מקשיבה", "תמיכה", "קשרים", "חברויות", "חברים", "חברות", "יוזם", "יוזמת", "נותן", "נותנת", "מארגן", "מארגנת", "אחראי", "אחראית"],
  q4: ["תקציב", "כסף", "חלום", "מטרה", "מקדיש", "מקדישה", "פרויקט", "עשייה", "להשקיע", "לתרום"],
  q5: ["פקק", "וייז", "נהיגה", "רכב", "תנועה", "סבלנות", "מוזיקה", "שירים", "פודקאסט"],
  q6: ["תכונות", "תכונה", "מעריך", "מעריכה", "בינאישי", "אישיות", "ערכים", "נאמנות", "כנות", "הומור", "נתינה", "רגישות", "אמינות", "צניעות", "ענווה"],
  q8: ["להוסיף", "חשוב שתדעו", "חשוב לי שתדעו", "עוד משהו", "בנוסף", "לסיכום", "הערה"],
};

const EDA_TERMS = ["אשכנזי", "אשכנזיה", "ספרדי", "ספרדיה", "תימני", "תימניה", "מרוקאי", "מרוקאית", "חבדי", "ליטאי", "פרסי", "עיראקי", "מעורב", "חסידי"];

function keywordsForQuestion(q) {
  const base = Q_KEYWORDS[q.key] || [];
  const derived = normHeb(`${q.male || ""} ${q.female || ""}`).split(" ").filter((w) => w.length >= 4);
  return [...new Set([...base.map((b) => normHeb(b)), ...derived])];
}

function scoreSentence(nSentence, keywords, baseSet) {
  let score = 0;
  for (const k of keywords) {
    if (k && nSentence.includes(k)) score += baseSet.has(k) ? 2 : 1;
  }
  return score;
}

function splitSentences(text) {
  return text
    .split(/\n|(?<=[.!?])\s+|[•·]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

// ניסיון לתפוס שדות מטקסט חופשי (בלי תווית) לפי דפוסים נפוצים.
function inferFreeTextFields(text, fields) {
  if (!fields.parentsWork) {
    const m = text.match(/ההור(?:ים|ה)\s+(?:עוסק(?:ים|ת)|עובד(?:ים|ת)|מתפרנס(?:ים|ת))\s*(?:ב|כ|בתחום|עם)?\s*([^.,\n]{2,40})/);
    if (m) fields.parentsWork = m[1].trim();
  }
  if (!fields.work) {
    const m = text.match(/(?:^|\s)(?:עובד(?:ת)?|מועסק(?:ת)?|מלמד(?:ת)?)\s+(?:ב|כ|בתור|בתחום|כמו)\s*([^.,\n]{2,40})/);
    if (m) fields.work = m[1].trim();
  }
  if (!fields.degree) {
    const m = text.match(/(?:לומד(?:ת)?|סטודנט(?:ית)?)\s+(?:ב|ל|לתואר|לתעודת)?\s*([^.,\n]{2,40})/);
    if (m) fields.degree = m[1].trim();
  }
  if (!fields.community) {
    for (const t of EDA_TERMS) {
      if (new RegExp(`(^|\\s)${t}(\\s|$|[.,])`).test(text)) { fields.community = t; break; }
    }
  }
  if (!fields.height) {
    const m = text.match(/\b(1[.,]\d{2})\b/) || text.match(/\b(1\d{2})\s*(?:סמ|ס"מ|סנטימטר)/);
    if (m) fields.height = m[1].replace(",", ".");
  }
}

// הפונקציה הראשית: מחזירה {fields, answers, description}.
// מפזרת מידע לשדות ולשאלות - גם מתוויות מפורשות וגם מהבנת הקשר (ניתוב משפטים לפי מילות מפתח).
export function parseCandidateText(rawText, openQuestions = []) {
  const text = (rawText || "").replace(/\r/g, "");
  const fields = {};

  // ----- שדות אישיים (לפי תווית בתחילת שורה) -----
  const flatLines = text.split(/\n|•|·|\t/).map((l) => l.trim()).filter(Boolean);
  for (const line of flatLines) {
    const hit = extractFromLine(line);
    if (!hit) continue;
    const val = normalizeValue(hit.field, hit.value);
    if (val && !fields[hit.field]) fields[hit.field] = val;
  }
  if (!fields.phone) {
    const p = cleanPhone(text);
    if (p) fields.phone = p;
  }
  const g = detectGender(text);
  if (g) fields.gender = g;

  // שדות מטקסט חופשי (הבנת הקשר בסיסית)
  inferFreeTextFields(text, fields);

  // ----- שאלות פתוחות -----
  const answers = {};
  const consumed = new Set();
  const qMarkers = buildQMarkers(openQuestions);
  const rawLines = text.split("\n");
  const lineIsQuestion = (line) => {
    const n = normHeb(line);
    if (n.length < 8) return null;
    return qMarkers.find((m) => n.includes(m.marker)) || null;
  };

  // 1) שיבוץ מפורש: שאלה שמופיעה כלשונה בטקסט, ואחריה התשובה.
  for (let i = 0; i < rawLines.length; i++) {
    const qm = lineIsQuestion(rawLines[i]);
    if (!qm) continue;
    consumed.add(i);
    const parts = [];
    for (let j = i + 1; j < rawLines.length; j++) {
      const lj = rawLines[j];
      if (!lj.trim()) { if (parts.length) break; else continue; }
      if (lineIsQuestion(lj)) break;
      if (extractFromLine(lj.trim())) break;
      parts.push(lj.trim());
      consumed.add(j);
    }
    if (parts.length && !answers[qm.key]) answers[qm.key] = parts.join("\n");
  }

  // 2) ניתוב חכם לפי הקשר: משפטים שלא שובצו - מנותבים לשאלה בעלת ההתאמה הגבוהה ביותר.
  if (openQuestions && openQuestions.length) {
    const qData = openQuestions.map((q) => ({
      key: q.key,
      keywords: keywordsForQuestion(q),
      baseSet: new Set((Q_KEYWORDS[q.key] || []).map((b) => normHeb(b))),
    }));
    const leftover = rawLines
      .map((l, idx) => ({ l, idx }))
      .filter(({ l, idx }) => !consumed.has(idx) && l.trim() && !extractFromLine(l.trim()) && !lineIsQuestion(l))
      .map(({ l }) => l.trim())
      .join(" ");
    for (const sentence of splitSentences(leftover)) {
      const n = normHeb(sentence);
      let best = null;
      let bestScore = 0;
      for (const q of qData) {
        const s = scoreSentence(n, q.keywords, q.baseSet);
        if (s > bestScore) { bestScore = s; best = q.key; }
      }
      if (best && bestScore >= 2) {
        answers[best] = answers[best] ? `${answers[best]} ${sentence}` : sentence;
      }
    }
  }

  return { fields, answers, description: (rawText || "").trim() };
}

// ניחוש חכם של שדה מערכת מתוך כותרת עמודה (לייבוא מ-Google Sheets).
// מחזיר: מפתח שדה מוכר, "image", "timestamp", או "" (עמודה רגילה - מועמדת לתיאור).
export function classifyHeader(header) {
  const h = (header || "").trim();
  if (!h) return "";
  if (/חותמת\s*זמן|timestamp|תאריך\s*שליחה|שעה\b/i.test(h)) return "timestamp";
  if (/תמונ|image|photo|תצלום|צילום|drive|קישור.*(תמונה|קובץ)/i.test(h)) return "image";
  for (const { field, label } of FLAT_LABELS) {
    if (h === label || h.includes(label)) return field;
  }
  return "";
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
