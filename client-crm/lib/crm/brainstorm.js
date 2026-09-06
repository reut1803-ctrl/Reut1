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
  { bg: "rgba(246,228,230,0.72)", border: "#F1B3A6", dot: "#E2A396", name: "ורוד" },
  { bg: "rgba(223,238,232,0.72)", border: "#C3D0B4", dot: "#6FB79A", name: "מנטה" },
  { bg: "rgba(232,233,246,0.72)", border: "#BFC2E6", dot: "#8B90D0", name: "לבנדר" },
  { bg: "rgba(252,239,220,0.72)", border: "#EFC9A8", dot: "#C9A063", name: "חמרה" },
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
// מילים נפוצות בעברית שאינן מוסיפות מידע, ולכן אינן נספרות כמילת מפתח.
const STOPWORDS = new Set(
  `של את זה הוא היא הם הן אני אנחנו אתה את יש אין לא כן גם רק כי אם אבל או אז מה מי איך למה כמה עם בלי על אל מן כמו כדי אשר הזה הזאת האלה שלו שלה שלהם שלנו שלי אותו אותה אותם להיות היה הייתה יהיה כבר עוד מאוד יותר פחות הכי אולי כנראה בעצם ממש צריך צריכה יכול יכולה אפשר חושב חושבת נראה לי לו לה להם וגם אחד אחת שני שתי כל בין תמיד אף פעם דבר משהו מישהו הרבה קצת טוב רע שם פה כאן עכשיו אחרי לפני בתוך מתוך אצל`
    .split(/\s+/)
    .filter(Boolean)
);

const cleanWord = (w) => w.replace(/^[והבלשמכ]/, "");

// סורק את כל הטקסטים של הצוות ומחזיר את המושגים שחוזרים על עצמם.
// מילה נספרת פעם אחת לכל כרטיסייה, כדי שכרטיסייה ארוכה אחת לא "תנצח" את הלוח.
export function extractKeywords(texts, { limit = 8, minCount = 2 } = {}) {
  const counts = new Map();
  const display = new Map();

  texts.forEach((text) => {
    const seen = new Set();
    String(text || "")
      .split(/[^֐-׿a-zA-Z']+/)
      .forEach((raw) => {
        const word = raw.trim();
        if (word.length < 3) return;
        if (STOPWORDS.has(word)) return;
        const stem = cleanWord(word);
        if (stem.length < 3 || STOPWORDS.has(stem)) return;
        if (seen.has(stem)) return;
        seen.add(stem);
        counts.set(stem, (counts.get(stem) || 0) + 1);
        if (!display.has(stem)) display.set(stem, word);
      });
  });

  return [...counts.entries()]
    .filter(([, count]) => count >= minCount)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([stem, count]) => ({ word: display.get(stem) || stem, stem, count }));
}

// אילו מילות מפתח מופיעות בכרטיסייה מסוימת - הבסיס לקווים המחברים בין כרטיסיות
export function noteKeywordStems(text, keywords) {
  const words = new Set(
    String(text || "")
      .split(/[^֐-׿a-zA-Z']+/)
      .map((w) => cleanWord(w.trim()))
      .filter(Boolean)
  );
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

// מסגרת הזהב שמורה לכרטיסיות שקיבלו את מספר הלייקים הגבוה ביותר בלוח,
// ורק כשבאמת היה חיזוק אמיתי (לפחות לייק אחד).
export function topLikedIds(notes) {
  const max = Math.max(0, ...notes.map(likeCount));
  if (max < 1) return new Set();
  return new Set(notes.filter((n) => likeCount(n) === max).map((n) => n.id));
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
