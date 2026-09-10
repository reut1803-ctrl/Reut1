// לוגיקה טהורה של "זירת סיעור המוחות": מאגר השאלות, צבעי הצוות, ספירת הזמן,
// חילוץ מילות המפתח והקשרים בין הכרטיסיות. הקובץ הזה אינו נוגע ב-Firebase.

// משך סבב סיעור מוחות: שלושה ימים מרגע הפתיחה
export const ROUND_DAYS = 3;
export const ROUND_MS = ROUND_DAYS * 24 * 60 * 60 * 1000;

// מאגר שאלות העומק. המנהלת בוחרת שאלה אחת לכל סבב, או כותבת שאלה משלה.
export const QUESTION_BANK = [
  "הפער בין איך שהוא מציג את עצמו למה שהוא באמת צריך הוא...",
  "הדבר שהכי עלול להפחיד אותו/אותה בזוגיות הוא כנראה...",
  "אם היינו צריכים לתאר את סביבת החיים האידיאלית עבורו ב-3 מילים, הן היו...",
  "איזה סגנון של בן/בת זוג יוציא ממנו את המיטב, ואיזה סגנון עלול 'לכבות' אותו?",
  "נקודת העיוורון שלו (מה שהוא לא רואה על עצמו) היא...",
  "הצענו לו בעבר הצעה שלא עבדה. המסקנה האמיתית מזה היא ש...",
  "מה הדבר שהוא לא יוותר עליו בשום מצב, גם אם לא אמר אותו במפורש?",
  "איזו משפחה הוא צריך להיכנס אליה כדי להרגיש בבית?",
  "מה הכוח הכי גדול שלו שדווקא לא בולט בכרטיס?",
  "אם הוא היה יושב מולנו עכשיו, מה היינו רוצים לשאול אותו ולא שאלנו?",
];

// צבע פסטל קבוע לכל איש/אשת צוות, כדי שיהיה אפשר לזהות מי כתב מה במבט חטוף.
// הצבע נגזר מכתובת המייל, ולכן הוא נשאר זהה בכל מכשיר ובכל סבב.
export const TEAM_PALETTE = [
  { bg: "rgba(246,228,230,0.72)", border: "#E9B9C0", dot: "#C98894", name: "ורוד" },
  { bg: "rgba(223,238,232,0.72)", border: "#A8D5C2", dot: "#6FB79A", name: "מנטה" },
  { bg: "rgba(232,233,246,0.72)", border: "#BFC2E6", dot: "#8B90D0", name: "לבנדר" },
  { bg: "rgba(252,239,220,0.72)", border: "#F0D3A0", dot: "#D6A93A", name: "חמרה" },
  { bg: "rgba(223,236,246,0.72)", border: "#AFCDE6", dot: "#6E9FC4", name: "תכלת" },
  { bg: "rgba(241,232,245,0.72)", border: "#D8BFE4", dot: "#A97FBB", name: "סחלב" },
  { bg: "rgba(238,243,222,0.72)", border: "#CBDBA0", dot: "#9BB55C", name: "זית" },
  { bg: "rgba(250,232,228,0.72)", border: "#F2C0B4", dot: "#D18B78", name: "אפרסק" },
];

export function paletteFor(email) {
  const key = String(email || "").toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 100000;
  return TEAM_PALETTE[hash % TEAM_PALETTE.length];
}

// בחירת צבע לפי המקום ברשימת הצוות, ולא לפי חישוב על הכתובת.
// חישוב על הכתובת יכול לתת בטעות את אותו צבע לשני אנשים - וזה בדיוק מה
// שהצבעים אמורים למנוע. לפי מיקום, כל אחד מקבל גוון אחר עד שמונה אנשי צוות.
export function paletteFromRoster(email, roster = []) {
  const key = String(email || "").trim().toLowerCase();
  if (!key) return TEAM_PALETTE[0];
  const list = [...new Set(roster.map((e) => String(e || "").trim().toLowerCase()).filter(Boolean))].sort();
  const index = list.indexOf(key);
  if (index === -1) return paletteFor(key);
  return TEAM_PALETTE[index % TEAM_PALETTE.length];
}

// --- ספירה לאחור ---
export function timeLeft(closesAt, now = Date.now()) {
  const end = new Date(closesAt || 0).getTime();
  const ms = Math.max(0, end - now);
  return {
    ms,
    expired: ms <= 0,
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms % 86400000) / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
    seconds: Math.floor((ms % 60000) / 1000),
  };
}

// טיוטה: הסבב הוכן על ידי המנהלת אך עדיין לא שוגר לצוות, ולכן אינו גלוי לאיש.
// שלושת הימים מתחילים לרוץ רק מרגע השיגור.
export function isRoundDraft(round) {
  return round?.status === "draft";
}

// סבב נעול כשהמנהלת סגרה אותו ידנית או כששלושת הימים חלפו.
// טיוטה אינה נעולה - היא פשוט עוד לא התחילה.
export function isRoundClosed(round, now = Date.now()) {
  if (!round) return true;
  if (isRoundDraft(round)) return false;
  if (round.status === "closed") return true;
  return new Date(round.closesAt || 0).getTime() <= now;
}

// --- מילות מפתח ---
// המטרה: לחלץ מהדיון שמות עצם ותארים בעלי משמעות בלבד.
// מה שנפסל כאן: מילות קישור, כינויי גוף, מילות שאלה, מספרים, פעלים
// (בעיקר בצורת שם הפועל: "להכיל", "להתפתח"), מילים כלליות של השיח
// ("הדברים", "מישהי"), ומילות המקצוע שחוזרות בכל דיון ("בחורה", "שידוך").
// בנוסף נפסלים שמות של אנשים - שם המועמד/ת ושמות הצוות.
//
// עיקרון חשוב: הנרמול כאן שמרני בכוונה. ניסיון "חכם" לקלף כל אות תחילית
// הורס מילים שבהן האות הזו היא חלק מהשורש ("בגרות" -> "גרות", "בשלות" -> "שלות"),
// ולכן מקלפים רק תחיליות ודאיות (ו', ה' הידיעה) וסיומות ריבוי/נקבה.
// אות תחילית בודדת (ב/ל/כ/מ/ש) מוסרת רק אם המילה שנשארת אחריה
// באמת מופיעה בדיון בפני עצמה - ראו canonicalize.

// מילות תפל בעברית. הנרמול מביא אליהן גם את הצורות המיודעות והרבות
// (למשל "הדברים" -> "דבר", "בחורה" -> "בחור").
const STOPWORDS = new Set(
  `
  של את זה זו זאת הוא היא הם הן אני אנחנו אנו אתה אתם אתן
  יש אין לא כן גם רק כי אם אבל או אז אך אלא למרות בגלל לכן כלומר בנוסף
  מה מי איך למה מדוע כמה מתי היכן איפה האם
  עם בלי על אל מן אצל כמו כדי אשר לפי מול בתוך מתוך בעצם בכלל
  הזה הזאת האלה ההוא ההיא אותו אותה אותם אותן עצמו עצמה עצמם עצמן
  שלו שלה שלהם שלהן שלנו שלי שלך שלכם אצלו אצלה
  איתו איתה איתם איתנו מאיתנו אלינו אליו אליה אליהם עליו עליה עליהם
  להיות היה הייתה היו יהיה תהיה נהיה
  כבר עוד מאוד יותר פחות הכי ממש אולי כנראה בטח ודאי כמעט כמובן בהחלט לגמרי חלוטין
  צריך צריכה צריכים חייב חייבת רוצה רוצים יכול יכולה יכולים אפשר
  חושב חושבת חושבים מרגיש מרגישה נראה נראית נשמע נשמעת אומר אומרת
  ראיתי שמעתי נדמה מבחינתי לדעתי בעיניי לענ"ד
  לי לו לה להם לנו לך לכם וגם
  אחד אחת שני שתי שלוש ארבע חמש שש שבע שמונה תשע עשר ראשון ראשונה
  כל בין תמיד אף פעם לעולם שוב עדיין כרגע לבסוף בסוף בסופו
  דבר משהו מישהו מישהי כלום שום עניין נושא סוג צורה אופן כיוון נקודה מסקנה
  הרבה קצת מעט המון רוב מיעוט חלק כמות רווח
  טוב רע יפה נחמד סבבה בסדר ממוצע רגיל פשוט קשה קל חסר חוסר
  שם פה כאן שמה עכשיו אחרי לפני היום אתמול מחר
  זמן פעם מקרה מצב מקום איזור אזור צד קטע שלב חיים
  איש אישה אנשים בן בת ילד ילדה אדם
  בחור מועמד שידוך הצעה זוג חתן כלה
  אמר ענה שאל כתב הוסיף סיפר שיתף ביקש יזם עשה קיבל בחן ראה
  מצד מחד מאידך לעומת בעוד בזמן במקום כלפי לגבי בנוגע בקשר
  חשוב חשובה נכון נכונה ברור ברורה מעניין מיוחד ממשי אמיתי
  חיבור קשר מפגש פגישה שיחה ראיון בירור בירורים
  הקלטה הקלטות כרטיס כרטיסייה מאגר מערכת סבב דיון
  מחפש מחפשת מוצא מוצאת מביא מביאה נותן נותנת לוקח לוקחת
  יודע יודעת מבין מבינה זוכר זוכרת מכיר מכירה
  המשך להמשיך התחלה סוף תחילה
  `
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean)
);

// תחיליות ודאיות בלבד. ב/ל/כ/מ/ש הבודדות אינן כאן בכוונה - ראו canonicalize.
const SAFE_PREFIXES = ["וכשה", "כשה", "וה", "שה", "ה", "ו"];
// סיומות ריבוי/נקבה. סדר יורד לפי אורך, כדי ש"התלבטויות" ו"התלבטות" יתאחדו.
const SAFE_SUFFIXES = ["ויות", "יות", "ים", "ות", "ה"];
// האותיות שעשויות להיות תחילית בודדת, ומוסרות רק בבדיקה מול אוצר המילים של הדיון
const WEAK_PREFIXES = ["ב", "ל", "כ", "מ", "ש", "ו"];

const MIN_STEM = 3;

// נרמול שמרני: אות יידוע/וי"ו החיבור בהתחלה, וסיומת ריבוי/נקבה בסוף -
// ורק כשנשאר גזע באורך סביר.
export function normalizeWord(raw) {
  let w = String(raw || "").trim();
  if (!w) return "";
  for (const p of SAFE_PREFIXES) {
    if (w.startsWith(p) && w.length - p.length >= MIN_STEM) {
      w = w.slice(p.length);
      break;
    }
  }
  for (const suf of SAFE_SUFFIXES) {
    if (w.endsWith(suf) && w.length - suf.length >= MIN_STEM) {
      w = w.slice(0, -suf.length);
      break;
    }
  }
  return w;
}

// אותה רשימה, גם בצורתה המנורמלת. בלי זה "המסקנה" (שנורמלה ל"מסקנ")
// לא הייתה נתפסת מול "מסקנה" שברשימה.
const STOPWORD_FORMS = new Set([...STOPWORDS, ...[...STOPWORDS].map(normalizeWord)].filter(Boolean));

// "שהוא", "ובחור", "מהחיים" - מילת תפל שנדבקה לה אות חיבור בהתחלה.
// מסירים עד שתי אותיות ובודקים אם מה שנשאר הוא מילת תפל.
function stripsToStopword(word) {
  for (let n = 1; n <= 2; n += 1) {
    // מילות תפל רבות הן בנות שתי אותיות ("לא", "של", "את"), ולכן אין כאן
    // דרישת אורך מינימלי - היא זו שגרמה ל"ולא" ו"ומצד" לעבור את הסינון.
    if (word.length - n < 2) break;
    if (!WEAK_PREFIXES.includes(word[n - 1]) && word[n - 1] !== "ה") break;
    const rest = word.slice(n);
    if (STOPWORD_FORMS.has(rest) || STOPWORD_FORMS.has(normalizeWord(rest))) return true;
    // גם שם פועל שנדבקה לו אות חיבור: "ולהמשיך", "ולתת"
    if (isInfinitive(rest)) return true;
  }
  return false;
}

// שם פועל בעברית. "לה"/"לת" בפתיחה הוא סימן כמעט ודאי (להכיל, להתפתח,
// להרגיש), ולצידו רשימה של שמות פועל נפוצים בבניין קל שאין להם סימן כזה.
const COMMON_INFINITIVES = new Set(
  `
  לשמוע לראות לדעת לחשוב לבדוק לדחות לתת לקחת לבוא ללכת לצאת לחזור לעשות
  לומר לספר לשאול לענות לכתוב לקרוא לפגוש לחכות לנסות לרצות לאהוב לשנוא
  לחיות לגור לעבוד ללמוד לסמוך לוותר לבחור לבנות לשבת לקום לזוז לשים
  לפתוח לסגור לשלוח לקבל לתפוס לעזור לשמור לחפש למצוא לאבד לעבור לגמור
  לעצור לרדת לעלות לדבר לשבור לגעת לנסוע לחזק לבדוק לסיים לפעול
  `
    .split(/\s+/)
    .filter(Boolean)
);

export function isInfinitive(word) {
  const w = String(word || "");
  if (w.length < 3) return false;
  // "לה"/"לת" בפתיחה הוא סימן כמעט ודאי לשם פועל, גם במילים קצרות כמו "לתת".
  if (/^ל[הת]/.test(w)) return true;
  if (w.length < 4) return false;
  return COMMON_INFINITIVES.has(w);
}

// בונה את קבוצת השמות שאין להציג כמילות מפתח (שם המועמד/ת, שמות הצוות)
function buildExcluded(names) {
  const set = new Set();
  (names || []).forEach((full) => {
    String(full || "")
      .split(/\s+/)
      .forEach((part) => {
        const w = part.trim();
        if (w.length < 2) return;
        set.add(w);
        set.add(normalizeWord(w));
      });
  });
  return set;
}

// מילה חסרת משמעות ולכן אינה מועמדת להיות מילת מפתח
function isNoise(word, form, excluded) {
  if (word.length < 3 || form.length < MIN_STEM) return true;
  if (STOPWORD_FORMS.has(word) || STOPWORD_FORMS.has(form)) return true;
  if (stripsToStopword(word)) return true;
  if (isInfinitive(word)) return true;
  if (excluded.has(word) || excluded.has(form)) return true;
  return false;
}

const WORD_SPLIT = /[^֐-׿a-zA-Z']+/;

// איחוד "בכנות" עם "כנות": אות תחילית בודדת מוסרת אך ורק אם המילה שנשארת
// אחריה באמת נאמרה בדיון בפני עצמה. כך "בגרות" לעולם לא הופכת ל"גרות",
// כי אף אחד לא כתב "גרות".
function canonicalize(form, vocabulary) {
  if (vocabulary.has(form)) return form;
  for (const p of WEAK_PREFIXES) {
    if (form.startsWith(p) && form.length - p.length >= MIN_STEM) {
      const rest = form.slice(p.length);
      if (vocabulary.has(rest)) return rest;
    }
  }
  return form;
}

// סורק את כל הטקסטים של הצוות ומחזיר את המושגים שחוזרים על עצמם.
// מילה נספרת פעם אחת לכל כרטיסייה, כדי שכרטיסייה ארוכה אחת לא "תנצח" את הלוח.
// exclude = שמות שאין להציג (שם המועמד/ת ושמות הצוות).
export function extractKeywords(texts, { limit = 8, minCount = 2, exclude = [] } = {}) {
  const excluded = buildExcluded(exclude);
  const list = (texts || []).map((t) => String(t || ""));

  // מעבר ראשון: אוצר המילים של הדיון, בצורתן המנורמלת
  const vocabulary = new Set();
  list.forEach((text) => {
    text.split(WORD_SPLIT).forEach((raw) => {
      const word = raw.trim();
      const form = normalizeWord(word);
      if (!isNoise(word, form, excluded)) vocabulary.add(form);
    });
  });

  // מעבר שני: ספירה לפי הצורה המאוחדת
  const counts = new Map();
  const surfaces = new Map();
  list.forEach((text) => {
    const seen = new Set();
    text.split(WORD_SPLIT).forEach((raw) => {
      const word = raw.trim();
      const form = normalizeWord(word);
      if (isNoise(word, form, excluded)) return;
      const stem = canonicalize(form, vocabulary);
      if (!surfaces.has(stem)) surfaces.set(stem, new Map());
      const forms = surfaces.get(stem);
      forms.set(word, (forms.get(word) || 0) + 1);
      if (seen.has(stem)) return;
      seen.add(stem);
      counts.set(stem, (counts.get(stem) || 0) + 1);
    });
  });

  // מציגים את צורת הכתיב הנפוצה ביותר, ובשוויון - הקצרה ביותר
  const bestSurface = (stem) => {
    const forms = surfaces.get(stem);
    if (!forms) return stem;
    return [...forms.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].length - b[0].length || a[0].localeCompare(b[0])
    )[0][0];
  };

  return [...counts.entries()]
    .filter(([, count]) => count >= minCount)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([stem, count]) => ({ word: bestSurface(stem), stem, count }));
}

// אילו מילות מפתח מופיעות בכרטיסייה מסוימת - הבסיס לקווים המחברים בין כרטיסיות
export function noteKeywordStems(text, keywords) {
  // הצורה המאוחדת של מילת מפתח עשויה להיות בלי אות תחילית בודדת ("כנות"
  // עבור "בכנות"), ולכן נבדקות כאן גם הצורות המקוצרות של כל מילה בטקסט.
  const words = new Set();
  String(text || "")
    .split(WORD_SPLIT)
    .forEach((raw) => {
      const form = normalizeWord(raw.trim());
      if (!form) return;
      words.add(form);
      WEAK_PREFIXES.forEach((p) => {
        if (form.startsWith(p) && form.length - p.length >= MIN_STEM) words.add(form.slice(p.length));
      });
    });
  return keywords.filter((k) => words.has(k.stem)).map((k) => k.stem);
}

// זוגות כרטיסיות שמדברות על אותו כיוון - מהן נמתחים הקווים בלוח
export function relatedPairs(notes, keywords) {
  const stems = notes.map((n) => new Set(noteKeywordStems(n.text, keywords)));
  const pairs = [];
  for (let i = 0; i < notes.length; i += 1) {
    for (let j = i + 1; j < notes.length; j += 1) {
      const shared = [...stems[i]].filter((s) => stems[j].has(s));
      if (shared.length > 0) pairs.push({ from: notes[i].id, to: notes[j].id, shared });
    }
  }
  return pairs;
}

// --- לייקים ומסגרת הזהב ---
export const likeCount = (note) => (Array.isArray(note?.likes) ? note.likes.length : 0);

// כמה חיזוקים צריך כדי שכרטיסייה תיחשב "מהדהדת" בצוות.
// חיזוק בודד אינו הסכמה של הצוות, ולכן הוא אינו מזכה בתווית.
export const MIN_LIKES_FOR_TOP = 2;

// מסגרת הזהב שמורה לכרטיסייה אחת ויחידה בכל סבב.
// קודם לכן כל הכרטיסיות שהיו בתיקו קיבלו אותה יחד, מה שהעמיס את הלוח
// והחמיץ את המטרה - להבליט כיוון מוביל אחד.
// שובר שוויון: הכרטיסייה שנכתבה ראשונה מבין אלה שבתיקו.
export function topLikedId(notes) {
  let best = null;
  let bestLikes = 0;
  notes.forEach((note) => {
    const likes = likeCount(note);
    if (likes < MIN_LIKES_FOR_TOP) return;
    if (!best || likes > bestLikes) {
      best = note;
      bestLikes = likes;
      return;
    }
    if (likes === bestLikes && new Date(note.createdAt || 0) < new Date(best.createdAt || 0)) {
      best = note;
    }
  });
  return best ? best.id : null;
}

// --- וואטסאפ ---
// המרת מספר ישראלי לפורמט בינלאומי שוואטסאפ מבין. מספר שאינו תקין מוחזר כ-null
// כדי שלא ייווצר קישור שבור.
export function whatsappNumber(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("972")) return digits.length >= 11 ? digits : null;
  if (digits.startsWith("0")) return digits.length === 10 ? `972${digits.slice(1)}` : null;
  if (digits.length === 9) return `972${digits}`;
  return digits.length >= 10 ? digits : null;
}

export function buildInviteMessage({ candidateName, question, secondQuestion, link, days = ROUND_DAYS }) {
  const extra = String(secondQuestion || "").trim();
  return [
    `היי צוות, מתקיים עכשיו סיעור מוחות על ${candidateName || "מועמד/ת"} 💡`,
    "",
    `השאלה לסבב: ${question}`,
    extra ? "" : null,
    extra ? `זווית נוספת שפתוחה לכולם: ${extra}` : null,
    "",
    `יש ${days} ימים להיכנס, לכתוב ולהגיב.`,
    link ? `לכניסה: ${link}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n")
    .trim();
}

// --- חיווי השתתפות ---
// ראשי תיבות לעיגול: שתי מילים ראשונות בשם, או שתי אותיות מהכתובת.
export function initialsOf(name, email) {
  const clean = String(name || "").trim();
  if (clean) {
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length >= 2) return words[0][0] + words[1][0];
    return words[0].slice(0, 2);
  }
  return String(email || "?").slice(0, 2).toUpperCase();
}

// מי מהצוות כבר כתב בסבב ומי עדיין לא. הרשימה נבנית מרשימת ההרשאות,
// כדי שגם מי שטרם נכנס יופיע - זו כל המטרה של החיווי.
export function participationOf(roster, notes) {
  const wrote = new Set(
    notes.map((n) => String(n.authorEmail || "").trim().toLowerCase()).filter(Boolean)
  );
  const people = roster
    .map((entry) => {
      const email = String(entry.email || entry.id || "").trim().toLowerCase();
      return email ? { email, name: entry.name || email, joined: wrote.has(email) } : null;
    })
    .filter(Boolean);
  // מי שכבר השתתף מוצג ראשון, כדי שהחסרים בולטים בסוף
  people.sort((a, b) => (a.joined === b.joined ? 0 : a.joined ? -1 : 1));
  return { people, joinedCount: people.filter((p) => p.joined).length, total: people.length };
}

// --- שרשור התגובות ---
// תגובה נצמדת לכרטיסייה שאליה הגיבו. מותר עומק אחד בלבד: תגובה על תגובה
// נצמדת לאותה כרטיסייה מקורית, כדי שהלוח יישאר קריא גם בנייד.
export function buildThreads(notes) {
  const byId = new Map(notes.map((n) => [n.id, n]));
  const rootIdOf = (note) => {
    let current = note;
    let guard = 0;
    while (current?.parentId && byId.has(current.parentId) && guard < 10) {
      current = byId.get(current.parentId);
      guard += 1;
    }
    return current?.id;
  };

  const roots = notes.filter((n) => !n.parentId || !byId.has(n.parentId));
  const repliesByRoot = new Map();
  notes.forEach((n) => {
    if (!n.parentId || !byId.has(n.parentId)) return;
    const root = rootIdOf(n);
    if (!root || root === n.id) return;
    if (!repliesByRoot.has(root)) repliesByRoot.set(root, []);
    repliesByRoot.get(root).push(n);
  });

  const byTime = (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  return roots.sort(byTime).map((root) => ({
    note: root,
    replies: (repliesByRoot.get(root.id) || []).sort(byTime),
  }));
}

// --- תיוגים ---
// כרטיסיות שתייגו אותי ושעדיין לא ראיתי. משמש לסימון הכתום בתפריט התחתון.
export function unseenMentions(notes, myEmail, seenAt) {
  const me = String(myEmail || "").trim().toLowerCase();
  if (!me) return [];
  const since = new Date(seenAt || 0).getTime() || 0;
  return notes.filter(
    (n) =>
      Array.isArray(n.mentions) &&
      n.mentions.includes(me) &&
      String(n.authorEmail || "").toLowerCase() !== me &&
      new Date(n.createdAt || 0).getTime() > since
  );
}

export const mentionsMe = (note, myEmail) => {
  const me = String(myEmail || "").trim().toLowerCase();
  return !!me && Array.isArray(note?.mentions) && note.mentions.includes(me);
};
