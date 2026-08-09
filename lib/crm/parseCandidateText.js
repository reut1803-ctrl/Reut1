// חילוץ עובדות מטקסט חופשי בעברית לשדות של כרטיס מועמד/ת.
//
// עקרונות המנוע:
// 1. אפס ניחושים - שדה מתמלא רק אם המידע מופיע במפורש בטקסט.
// 2. אפס יצירתיות - שום ערך אינו מומצא, משוכתב או מסוכם. הכל נשלף כלשונו
//    או נבחר מתוך רשימה סגורה שקיימת ממילא במערכת.
// 3. הקשר ושלילה - כל מונח נבדק בתוך המשפט שבו הוא מופיע. "לא עשה צבא"
//    או "פטור מצבא" לא יסומנו כשירות צבאי, ו"בלי פאות" לא יסומן כ"פאות".
// 4. הטקסט המלא נשמר כלשונו בשדה התיאור החופשי, בלי קיצור.

import {
  REGIONS,
  LIFESTYLE_TAGS,
  TRAITS,
  occupationTagsFor,
  religiousLevelsFor,
  smokingOptionsFor,
} from "./mockData";

const clean = (v) => String(v || "").replace(/[ \t]+/g, " ").trim();

// אותיות שימוש שנדבקות לתחילת מילה בעברית (בית, למד, מם, הא, וו, כף, שין).
// מותרות עד שתיים, כדי שגם "מהצבא" או "ולישיבה" יזוהו.
const PREFIX = "בלמהוכש";

// חיפוש מונח כמילה שלמה: מותר שיהיה לפניו אות שימוש אחת, אסור שיהיה
// צמוד לאותיות עבריות נוספות. כך "דתי" לא ייתפס בתוך "דתיות".
function findTerm(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^\\u0590-\\u05FF])[${PREFIX}]{0,2}${escaped}(?![\\u0590-\\u05FF])`, "g");
  const hits = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    hits.push(m.index + m[1].length);
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return hits;
}

// מילות שלילה. נבדקות רק בסמוך למונח עצמו, כדי ש"לא מעשן ועשה צבא"
// לא ייחשב בטעות כשלילה של הצבא.
// "שוחרר" בכוונה אינו כאן: "שוחרר מהצבא" מעיד בדרך כלל שהשירות הושלם.
const NEGATION_WORDS = [
  "לא", "אינו", "אינה", "אין", "בלי", "ללא", "חסר", "חסרת",
  "פטור", "פטורה", "טרם", "מעולם", "נמנע",
];

const CLAUSE_SPLIT = /[.\n;!?()]|,\s|\bאבל\b|\bאך\b|\bלמרות\b/;

// גבולות המשפט שבתוכו נמצא המונח
function clauseAround(text, index) {
  let start = 0;
  let end = text.length;
  const re = new RegExp(CLAUSE_SPLIT.source, "g");
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index + m[0].length <= index) start = m.index + m[0].length;
    else if (m.index >= index) {
      end = m.index;
      break;
    }
  }
  return { start, end };
}

const stripPrefix = (word) => {
  const bare = word.replace(/["'״׳]/g, "");
  return PREFIX.includes(bare[0]) && bare.length > 2 ? bare.slice(1) : bare;
};

// שלילה מזוהה אם אחת משתי המילים שלפני המונח היא מילת שלילה,
// או אם במשפט מופיעה מילת פטור מפורשת.
function isNegated(text, index, extraPatterns = []) {
  const { start, end } = clauseAround(text, index);
  const before = text.slice(start, index);
  const clause = text.slice(start, end);

  const words = before.split(/\s+/).filter(Boolean).slice(-2);
  if (words.some((w) => NEGATION_WORDS.includes(stripPrefix(w)))) return true;
  if (/\bפטור(?:ה)?\b/.test(clause)) return true;
  return extraPatterns.some((re) => re.test(clause));
}

// מונח נחשב "נמצא" רק אם יש לו הופעה אחת לפחות שאינה שלולה
function termPresent(text, terms, extraNegations = []) {
  for (const term of terms) {
    for (const index of findTerm(text, term)) {
      if (!isNegated(text, index, extraNegations)) return term;
    }
  }
  return null;
}

// ----- אוצר מילים של עולם השידוכים והמגזר -----
// כל ערך ברשימה הסגורה של המערכת, והביטויים שמעידים עליו במפורש.

const MILITARY_NEGATIONS = [/לא\s+(?:עשה|עשתה|שירת|שירתה|התגייס|התגייסה)/, /פטור/, /דחיית\s*שירות/];

const LIFESTYLE_TERMS = {
  "חווה": ["חווה", "חוות"],
  "גבעה": ["גבעה", "גבעות", "היאחזות"],
  "פאות": ["פאות", "פאות נגללות", "פאה"],
  "בלי פאות": [],
  "עשה צבא": ["צבא", "צה\"ל", "צהל", "שירות צבאי", "התגייס", "התגייסה", "קרבי", "לוחם", "מילואים"],
  "אברך בישיבה": ["אברך", "כולל", "אברך בישיבה"],
};

const TRAIT_TERMS = {
  "הומור": ["הומור", "מצחיק", "שנון"],
  "רוגע": ["רוגע", "רגוע", "רגועה", "נינוח", "נינוחה"],
  "משפחתיות": ["משפחתיות", "משפחתי", "משפחתית"],
  "רגישות": ["רגישות", "רגיש", "רגישה"],
  "שאפתנות": ["שאפתנות", "שאפתן", "שאפתנית"],
  "רוחניות": ["רוחניות", "רוחני", "רוחנית"],
  "ביטחון עצמי": ["ביטחון עצמי", "בטחון עצמי"],
  "מנהיגות": ["מנהיגות", "מנהיג", "מנהיגה"],
};

// עיסוק ורקע - בחירה מרובה: כל תגית שמוזכרת במפורש בטקסט מסומנת בנפרד,
// כך ש"למד בישיבת הסדר, שירת בצבא ויש לו תואר ראשון" מסמן שלוש תגיות.
const OCCUPATION_TERMS = {
  "ישיבה גבוהה": ["ישיבה גבוהה", "ישיבה גדולה"],
  "ישיבת הסדר": ["הסדר", "ישיבת הסדר"],
  "כולל / אברך": ["אברך", "כולל"],
  "מכינה": ["מכינה", "מכינה קדם צבאית"],
  "צבא": ["צבא", "צה\"ל", "צהל", "שירות צבאי", "התגייס", "התגייסה", "קרבי", "לוחם", "מילואים"],
  "שירות לאומי": ["שירות לאומי", "בת שירות", "שנת שירות"],
  "עבודה": ["עובד", "עובדת", "עבודה", "מועסק", "מועסקת"],
  "תואר ראשון": ["תואר ראשון", "ב.א", "בוגר", "בוגרת"],
  "תואר שני": ["תואר שני", "מ.א", "מוסמך", "מוסמכת"],
  "תעודה מקצועית": ["תעודה", "תעודה מקצועית", "הנדסאי", "הנדסאית", "מקצועי"],
  "סמינר": ["סמינר"],
  "מדרשה": ["מדרשה"],
  "אולפנה": ["אולפנה", "אולפנא"],
  "תיכון": ["תיכון"],
};

const RELIGIOUS_TERMS_MALE = {
  "חרד\"ל": ["חרד\"ל", "חרדל", "חרדלי"],
  "חסידי": ["חסידי", "חסיד"],
  "תורני": ["תורני"],
  "דתי": ["דתי", "דתי לאומי"],
};

const RELIGIOUS_TERMS_FEMALE = {
  "חרד\"לית": ["חרד\"לית", "חרדלית"],
  "חסידית": ["חסידית", "חסידה"],
  "תורנית": ["תורנית"],
  "דתייה": ["דתייה", "דתיה"],
};

const EDOT = [
  "אשכנזי", "אשכנזית", "ספרדי", "ספרדיה", "ספרדייה", "תימני", "תימניה",
  "מרוקאי", "מרוקאית", "עיראקי", "עיראקית", "פרסי", "פרסית", "מעורב", "מעורבת",
  "בוכרי", "בוכרית", "תוניסאי", "תוניסאית", "לובי", "אתיופי", "אתיופית", "חב\"ד",
];

// בוחר ערך אחד מתוך מילון מונחים. הביטוי הארוך ביותר מנצח, כדי ש"תואר שני"
// לא ייקרא בטעות כ"תואר ראשון" ו"ישיבה גבוהה" יגבר על "צבא".
function pickFromDictionary(text, dictionary, allowed, extraNegations = []) {
  const matches = [];
  Object.entries(dictionary).forEach(([value, terms]) => {
    if (!allowed.includes(value)) return;
    const hit = termPresent(text, terms, extraNegations);
    if (hit) matches.push({ value, length: hit.length });
  });
  if (matches.length === 0) return null;
  matches.sort((a, b) => b.length - a.length);
  return matches[0].value;
}

const LABELS = {
  name: ["שם מלא", "שם המועמד", "שם המועמדת", "שם"],
  height: ["גובה"],
  city: ["עיר מגורים", "מקום מגורים", "יישוב", "ישוב", "עיר"],
  region: ["אזור", "איזור"],
  eda: ["עדה", "מוצא"],
  religiousLevel: ["רמת דתיות", "רמה דתית", "השקפה", "זרם", "רמת תורניות"],
  phone: ["טלפון", "נייד", "פלאפון", "מספר"],
  referenceContacts: ["ממליצים", "בירורים", "אנשי קשר", "לבירורים", "ממליץ"],
};

function labeledValue(text, labels) {
  for (const label of labels) {
    const re = new RegExp(`(?:^|\\n)\\s*${label}\\s*[:：\\-–]\\s*(.+)`, "u");
    const m = text.match(re);
    if (m && clean(m[1])) return clean(m[1]);
  }
  return null;
}

function parsePhone(text) {
  const source = labeledValue(text, LABELS.phone) || text;
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

// שם נלקח רק ממבנה מפורש: שורת "שם: ..." או "<שם> בן/בת <גיל>".
// שורה ראשונה סתמית אינה נחשבת שם, כדי לא לנחש.
function parseName(text) {
  const labeled = labeledValue(text, LABELS.name);
  if (labeled) return labeled.split(/[,،|]/)[0].trim();

  const beforeAge = text.match(/(?:^|\n)\s*([֐-׿'"’\s]{2,28}?)\s+(?:בן|בת)\s+\d{2}(?!\d)/u);
  if (beforeAge) {
    const candidateName = clean(beforeAge[1]);
    const words = candidateName.split(" ").filter(Boolean);
    if (words.length >= 1 && words.length <= 4) return candidateName;
  }
  return null;
}

// עיר נלקחת מתווית מפורשת או ממבנה "גר/מתגורר ב<מקום>"
function parseCity(text) {
  const labeled = labeledValue(text, LABELS.city);
  if (labeled) return labeled.split(/[,،|]/)[0].trim();
  const m = text.match(/(?:גר|גרה|מתגורר|מתגוררת|מתגוררים)\s+ב[־-]?\s*([֐-׿' ]{2,20})/u);
  if (m) {
    const value = clean(m[1]).split(/\s+(?:עם|ו|אבל)\s+/)[0].trim();
    if (value.length >= 2) return value;
  }
  return null;
}

export function parseCandidateText(rawText, gender = "male") {
  const text = String(rawText || "").replace(/\r/g, "");
  if (!text.trim()) return { fields: {}, traits: [], lifestyle: [], occupations: [], found: [], negated: [] };

  const fields = {};
  const put = (key, value) => {
    if (value !== null && value !== undefined && String(value).trim() !== "") fields[key] = value;
  };

  put("name", parseName(text));
  put("age", parseAge(text));
  put("height", parseHeight(text));
  put("phone", parsePhone(text));
  put("city", parseCity(text));
  put("eda", labeledValue(text, LABELS.eda) || termPresent(text, EDOT));
  put("referenceContacts", labeledValue(text, LABELS.referenceContacts));

  // הטקסט המודבק נשמר במלואו, מילה במילה, בשדה התיאור החופשי
  put("bio", text.trim());

  put("region", termPresent(text, REGIONS) || labeledValue(text, LABELS.region));

  const religiousDictionary = gender === "female" ? RELIGIOUS_TERMS_FEMALE : RELIGIOUS_TERMS_MALE;
  put(
    "religiousLevel",
    pickFromDictionary(text, religiousDictionary, religiousLevelsFor(gender)) ||
      labeledValue(text, LABELS.religiousLevel)
  );

  // ערכי העישון בטופס הם העדפה לגבי בן/בת הזוג, ולכן נלקחים רק בהתאמה מדויקת
  put("smoking", termPresent(text, smokingOptionsFor(gender).filter((o) => o !== "לא משנה")));


  // ערך שנשלף מתווית חייב להתקיים ברשימה הסגורה, אחרת הוא ייצור בחירה לא תקינה
  const closed = {
    region: REGIONS,
    religiousLevel: religiousLevelsFor(gender),
    smoking: smokingOptionsFor(gender),
  };
  Object.entries(closed).forEach(([key, options]) => {
    if (fields[key] && !options.includes(fields[key])) delete fields[key];
  });

  // --- תכונות וסגנון חיים, עם בדיקת שלילה לכל מונח בנפרד ---
  const negated = [];

  const traits = TRAITS.filter((trait) => {
    const terms = TRAIT_TERMS[trait] || [trait];
    if (termPresent(text, terms)) return true;
    // הוזכר אך נשלל ("חסר ביטחון עצמי") - לא מסמנים, ומדווחים למשתמשת
    if (terms.some((t) => findTerm(text, t).length > 0)) negated.push(trait);
    return false;
  });

  // עיסוק ורקע: כל תגית נבדקת בנפרד, עם בדיקת שלילה משלה. "לא עשה צבא" לא יסמן "צבא".
  const occupations = [];
  occupationTagsFor(gender).forEach((tag) => {
    const terms = OCCUPATION_TERMS[tag] || [tag];
    const extra = tag === "צבא" ? MILITARY_NEGATIONS : [];
    if (termPresent(text, terms, extra)) occupations.push(tag);
    else if (terms.some((t) => findTerm(text, t).length > 0)) negated.push(tag);
  });

  const lifestyle = [];
  LIFESTYLE_TAGS.forEach((tag) => {
    if (tag === "בלי פאות") return;
    const terms = LIFESTYLE_TERMS[tag] || [tag];
    const extra = tag === "עשה צבא" ? MILITARY_NEGATIONS : [];
    if (termPresent(text, terms, extra)) lifestyle.push(tag);
    else if (terms.some((t) => findTerm(text, t).length > 0)) negated.push(tag);
  });

  // "בלי פאות" הוא ערך בפני עצמו ברשימה, ולכן נבדק במפורש
  if (/(?:בלי|ללא)\s*פאות|(?:בלי|ללא)\s*פאה/.test(text)) {
    const index = lifestyle.indexOf("פאות");
    if (index >= 0) lifestyle.splice(index, 1);
    if (!lifestyle.includes("בלי פאות")) lifestyle.push("בלי פאות");
    const n = negated.indexOf("פאות");
    if (n >= 0) negated.splice(n, 1);
  }

  const labelsHe = {
    name: "שם",
    age: "גיל",
    height: "גובה",
    phone: "טלפון",
    city: "עיר",
    region: "אזור",
    eda: "עדה",
    religiousLevel: "רמת דתיות",
    smoking: "עישון",
    referenceContacts: "מספרים לבירורים",
    bio: "תיאור חופשי (הטקסט המלא)",
  };
  const found = Object.keys(fields).map((k) => labelsHe[k] || k);
  if (occupations.length) found.push("עיסוק ורקע");
  if (traits.length) found.push("תכונות");
  if (lifestyle.length) found.push("סגנון חיים");

  return { fields, traits, lifestyle, occupations, found, negated: Array.from(new Set(negated)) };
}
