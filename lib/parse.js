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

// חילוץ "תווית: ערך" מפורש (חובה מפריד :/-) - לשורות מובנות בלבד. הערך נגמר לפני סוף משפט.
function extractInline(line) {
  for (const { field, label } of FLAT_LABELS) {
    const re = new RegExp("^\\s*" + PREFIX + esc(label) + "\\s*[:：\\-–—]\\s*([^.!?\\n]{1,80})");
    const m = line.match(re);
    if (m) return { field, value: (m[1] || "").trim() };
  }
  return null;
}

// שורה שכולה תווית מוכרת (עם/בלי נקודתיים בסוף) - הערך יגיע בשורה הבאה (טופס גוגל).
function lineFieldLabel(line) {
  const t = (line || "").replace(/[:：\-–—]\s*$/, "").trim();
  for (const { field, label } of FLAT_LABELS) {
    if (new RegExp("^" + PREFIX + esc(label) + "$").test(t)) return field;
  }
  return null;
}

// האם השורה היא גבול של שדה (תווית מובנית או שורת-תווית) - לצורך עצירת איסוף תשובות.
function isFieldBoundary(line) {
  return !!(extractInline(line) || lineFieldLabel(line));
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

// זיהוי שדות ממשפט בודד בטקסט חופשי. מחזיר true אם נתפס שדה "מהותי" (עיסוק/לימודים/הורים),
// כלומר תוכן המשפט נכנס לשדה ואין צורך לשמור אותו שוב בתיאור.
function inferFromSentence(sentence, fields) {
  let substantial = false;
  if (!fields.parentsWork) {
    const m = sentence.match(/ההור(?:ים|ה)\s+(?:עוסק(?:ים|ת)|עובד(?:ים|ת)|מתפרנס(?:ים|ת)|בתחום)\s*(?:ב|כ|בתחום|עם|של)?\s*([^.,\n]{2,45})/);
    if (m) { fields.parentsWork = m[1].trim(); substantial = true; }
  }
  if (!fields.work) {
    const m = sentence.match(/(?:^|\s)(?:עובד(?:ת)?|מועסק(?:ת)?|מלמד(?:ת)?|עוסק(?:ת)?)\s+(?:ב|כ|בתור|בתחום|כמו)\s*([^.,\n]{2,45})/);
    if (m) { fields.work = m[1].trim(); substantial = true; }
  }
  if (!fields.degree) {
    const m = sentence.match(/(?:לומד(?:ת)?|סטודנט(?:ית)?|משלים(?:ה)?|תלמיד(?:ת)?)\s+(?:ב|ל|לתואר|לתעודת|במסלול)?\s*([^.,\n]{2,45})/);
    if (m) { fields.degree = m[1].trim(); substantial = true; }
  }
  if (!fields.community) {
    for (const t of EDA_TERMS) {
      if (new RegExp(`(^|\\s)${t}(\\s|$|[.,])`).test(sentence)) { fields.community = t; break; }
    }
  }
  if (!fields.height) {
    const m = sentence.match(/\b(1[.,]\d{2})\b/) || sentence.match(/\b(1\d{2})\s*(?:סמ|ס"מ|סנטימטר)/);
    if (m) fields.height = m[1].replace(",", ".");
  }
  if (!fields.location) {
    const m = sentence.match(/(?:גר(?:ה)?|מתגורר(?:ת)?|מגורים)\s+(?:ב|בעיר|ביישוב)\s*([^.,\n]{2,25})/);
    if (m) { fields.location = m[1].trim(); substantial = true; }
  }
  return substantial;
}

// הפונקציה הראשית: מחזירה {fields, answers, description}.
// מפזרת מידע לשדות ולשאלות בהבנת הקשר. התיאור מכיל אך ורק טקסט שנשאר בלי שדה ייעודי.
export function parseCandidateText(rawText, openQuestions = []) {
  const text = (rawText || "").replace(/\r/g, "");
  const rawLines = text.split("\n");
  const fields = {};
  const answers = {};
  const consumed = new Set(); // אינדקסי שורות שנוצלו (לא ייכנסו לתיאור)

  const qMarkers = buildQMarkers(openQuestions);
  const lineIsQuestion = (line) => {
    const n = normHeb(line);
    if (n.length < 8) return null;
    return qMarkers.find((m) => n.includes(m.marker)) || null;
  };
  const setField = (f, v) => { const val = normalizeValue(f, v); if (val && !fields[f]) fields[f] = val; };

  // ----- 1) שדות מובנים: "תווית: ערך", וגם "תווית" בשורה והערך בשורה הבאה (טופס) -----
  for (let i = 0; i < rawLines.length; i++) {
    if (consumed.has(i)) continue;
    const t = rawLines[i].trim();
    if (!t) { consumed.add(i); continue; }
    const inline = extractInline(t);
    if (inline && inline.value) { setField(inline.field, inline.value); consumed.add(i); continue; }
    if (lineIsQuestion(t)) continue; // שאלה - מטופלת בשלב 2
    const lf = lineFieldLabel(t);
    if (lf) {
      consumed.add(i);
      for (let j = i + 1; j < rawLines.length; j++) {
        if (!rawLines[j].trim()) { consumed.add(j); continue; }
        if (isFieldBoundary(rawLines[j].trim()) || lineIsQuestion(rawLines[j])) break;
        setField(lf, rawLines[j].trim()); consumed.add(j); break;
      }
    }
  }
  if (!fields.phone) { const p = cleanPhone(text); if (p) fields.phone = p; }
  const g = detectGender(text);
  if (g) fields.gender = g;

  // ----- 2) שאלות פתוחות: שיבוץ מפורש (שאלה כלשונה + התשובה שאחריה) -----
  for (let i = 0; i < rawLines.length; i++) {
    if (consumed.has(i)) continue;
    const qm = lineIsQuestion(rawLines[i]);
    if (!qm) continue;
    consumed.add(i);
    const parts = [];
    for (let j = i + 1; j < rawLines.length; j++) {
      const lj = rawLines[j];
      if (!lj.trim()) { if (parts.length) break; else { consumed.add(j); continue; } }
      if (lineIsQuestion(lj) || isFieldBoundary(lj.trim())) break;
      parts.push(lj.trim());
      consumed.add(j);
    }
    if (parts.length && !answers[qm.key]) answers[qm.key] = parts.join("\n");
  }

  // ----- 3) ניתוב חכם לפי הקשר + זיהוי שדות מטקסט חופשי -----
  const qData = (openQuestions || []).map((q) => ({
    key: q.key,
    keywords: keywordsForQuestion(q),
    baseSet: new Set((Q_KEYWORDS[q.key] || []).map((b) => normHeb(b))),
  }));
  const leftover = [];
  rawLines.forEach((line, idx) => {
    if (consumed.has(idx)) return;
    const t = line.trim();
    if (!t) return;
    let anyUsed = false;
    for (const sentence of splitSentences(t)) {
      const captured = inferFromSentence(sentence, fields); // שדות מהמשפט
      // ניתוב לשאלה המתאימה ביותר
      let best = null, bestScore = 0;
      const n = normHeb(sentence);
      for (const q of qData) {
        const s = scoreSentence(n, q.keywords, q.baseSet);
        if (s > bestScore) { bestScore = s; best = q.key; }
      }
      if (best && bestScore >= 2) {
        answers[best] = answers[best] ? `${answers[best]} ${sentence}` : sentence;
        anyUsed = true;
      } else if (captured) {
        anyUsed = true; // התוכן נכנס לשדה מהותי
      } else if (PHONE_RE.test(sentence) && sentence.replace(PHONE_RE, "").replace(/[^א-ת]/g, "").length < 4) {
        anyUsed = true; // משפט שהוא בעצם רק מספר טלפון - כבר נתפס
      } else {
        leftover.push(sentence); // אין שדה ייעודי - נשאר בתיאור
      }
    }
    if (anyUsed) consumed.add(idx);
  });

  return { fields, answers, description: leftover.join("\n").trim() };
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
