// ============================================================================
// מחלץ אנשי קשר מדפי קשר — לוגיקה טהורה (בלי ממשק ובלי מסד נתונים).
// מקבל שורות טקסט מזוהות (OCR) עם מיקומים, ומרכיב מהן: כותרת (כיתה + שנה עברית),
// רשימת אנשי קשר (שם משפחה, שם פרטי, טלפונים), גיל מוערך כיום, ניחוש מגדר והודעה.
// ============================================================================

const GEM = { א: 1, ב: 2, ג: 3, ד: 4, ה: 5, ו: 6, ז: 7, ח: 8, ט: 9, י: 10, כ: 20, ך: 20, ל: 30, מ: 40, ם: 40, נ: 50, ן: 50, ס: 60, ע: 70, פ: 80, ף: 80, צ: 90, ץ: 90, ק: 100, ר: 200, ש: 300, ת: 400 };
const gematria = (s) => [...(s || "")].reduce((n, ch) => n + (GEM[ch] || 0), 0);

// השנה העברית הנוכחית (למשל 5787 = תשפ"ז), לפי לוח השנה של הדפדפן.
export function currentHebrewYear(date = new Date()) {
  try {
    const y = parseInt(new Intl.DateTimeFormat("en-u-ca-hebrew", { year: "numeric" }).format(date).replace(/\D/g, ""), 10);
    if (y > 5700 && y < 5900) return y;
  } catch (e) {}
  // גיבוי: ראש השנה נופל בערך בספטמבר
  return date.getFullYear() + 3760 + (date.getMonth() >= 8 ? 1 : 0);
}

// "תשפ"ב" → 5782 (null אם לא נראה כמו שנה סבירה)
export function parseHebrewYear(s) {
  const letters = (s || "").replace(/[^א-ת]/g, "");
  if (!letters.startsWith("ת")) return null;
  const y = 5000 + gematria(letters);
  return y >= 5740 && y <= 5800 ? y : null;
}

// "ח" → 8, "יא" → 11
export function parseGrade(s) {
  const g = gematria((s || "").replace(/[^א-ת]/g, ""));
  return g >= 1 && g <= 12 ? g : null;
}

export const GRADE_LETTERS = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "יא", "יב"];
export function hebrewYearLabel(y) {
  if (!y) return "";
  let n = y - 5000; let out = "";
  for (const [ch, v] of [["ת", 400], ["ש", 300], ["ר", 200], ["ק", 100], ["צ", 90], ["פ", 80], ["ע", 70], ["ס", 60], ["נ", 50], ["מ", 40], ["ל", 30], ["כ", 20], ["י", 10], ["ט", 9], ["ח", 8], ["ז", 7], ["ו", 6], ["ה", 5], ["ד", 4], ["ג", 3], ["ב", 2], ["א", 1]]) {
    while (n >= v) { out += ch; n -= v; }
  }
  out = out.replace("יה", "טו").replace("יו", "טז");
  return out.length > 1 ? `${out.slice(0, -1)}"${out.slice(-1)}` : `${out}'`;
}

// מזהה בכותרת "כתה ח' תשפ"ב" (גם בלי רווחים, כפי שה-OCR לפעמים מחזיר)
export function parseHeading(text) {
  const t = (text || "").replace(/[״”“]/g, '"').replace(/[׳`’]/g, "'");
  const m = t.match(/כי?תה\s*([א-ת]{1,2})\s*'?\s*(ת[א-ת]{0,2}\s*"?\s*[א-ת])/);
  if (!m) return null;
  // ה-OCR קורא לפעמים את הגרש כ-י' או ו' ("חי" במקום "ח'") — אם שתי האותיות אינן כיתה, לוקחים את הראשונה
  const grade = parseGrade(m[1]) || (m[1].length === 2 && /[יו]$/.test(m[1]) ? parseGrade(m[1][0]) : null);
  const year = parseHebrewYear(m[2]);
  return grade || year ? { grade, year } : null;
}

// גיל משוער כיום: בכיתה ח' הילדים בני 13–14; מוסיפים את מספר השנים שעברו.
export function estimateAge(grade, year, nowYear = currentHebrewYear()) {
  if (!grade || !year) return null;
  const low = grade + 5 + (nowYear - year);
  return low > 0 ? { low, high: low + 1 } : null;
}

// ---------- מגדר לפי שם פרטי ----------
const FEMALE = new Set("חיה מושקא שרה רבקה רחל לאה מרים אסתר דבורה חנה יהודית שושנה שירה תמר נועה מיכל יעל הדסה הדס אביגיל טובה נחמה שיינא ברוריה אפרת הודיה הודיה אמונה מנוחה תהילה תפארת עטרה מלכה רננה אורית אוריה יסכה צוריה מעין ורד ציפורה ענווה יערה יפעה הללי פנינה בתיה גילה דינה זיסל פייגא פרומט גיטל ריקי חוי בילא בלומה נעמי רות איילת אילת שלומית אסנת אלישבע חדוה פליאה טליה אורה אורטל אורלי בת שבע בתשבע מירב מיכאלה רינה רוני ליבא דבורי חני שפרה שפרה נחמי צביה צפורה ציפי חגית אלה אלינור אביטל אביה הילה ליאורה ליאת מאיה מיה נגה נוגה נטע עדי עדינה עלמה פזית צופיה קרן רעות שולמית שמחה שני שקד תהלה תחיה רבקי חוה גאולה ברכה זהבה זלטה יוכבד יוכי הינדי הענא רייזל פערל רבקהלה".split(" "));
const MALE = new Set("משה יוסף דוד אברהם יצחק יעקב שמואל אליהו מנחם מענדל לוי יהודה שלמה אהרן אהרון חיים מאיר ישראל בנימין נחום שניאור זלמן דובער דב ברוך אליעזר יחזקאל נתן מרדכי שמעון ראובן גרשון צבי אריה זאב דניאל אלחנן יונתן אורי נועם איתן אליה אלימלך אפרים בצלאל גבריאל גדליה הלל הרשל זלמן חנוך טוביה יהושע יואל יחיאל יחזקאל ירמיהו ישעיהו ישי כתריאל מיכאל מתתיהו נחמיה נפתלי עזריאל עמרם פנחס פסח קלמן רפאל שאול שבתאי שלום שמחה שמריהו שניאורזלמן אשר דן גד זבולון יששכר עובדיה עמנואל אליקים אלעזר יחזקיהו יונה אבישי אביעד אלקנה הראל ינון נריה עקיבא חננאל אוריאל אלישע מנשה".split(" "));
// "שמחה" ו"יונה" מופיעים אצל שניהם — הרשימות למעלה קובעות; כאן רק מה שחסר בהן.
export function guessGender(firstName, defaultGender = "") {
  const words = (firstName || "").replace(/[^א-ת\s]/g, " ").split(/\s+/).filter(Boolean);
  for (const w of words) {
    if (FEMALE.has(w)) return "female";
    if (MALE.has(w)) return "male";
  }
  if (defaultGender) return defaultGender;
  const w = words[0] || "";
  return /(ה|ית|לה|נה|ת)$/.test(w) ? "female" : "male";
}

// ---------- טלפונים ----------
export function normalizePhone(raw) {
  let d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("972")) d = "0" + d.slice(3);
  if (/^5\d{8}$/.test(d)) d = "0" + d; // נייד שנכתב בלי 0 בהתחלה
  // נייד (05) — 10 ספרות בדיוק; קווי (02/03/04/08/09) — 9; קווי 07x — 10
  if (!(/^05\d{8}$/.test(d) || /^0[2-489]\d{7}$/.test(d) || /^07\d{8}$/.test(d))) return "";
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 2)}-${d.slice(2)}`;
}
export const isMobile = (p) => /^05/.test(p || "");
export function waNumber(p) {
  const d = (p || "").replace(/\D/g, "");
  return d.startsWith("0") ? "972" + d.slice(1) : d;
}

// בצילומי מסך ה-OCR מדביק לפעמים כמה מספרים למילה אחת:
// "050-6355672050-540918802-5630769" → שלושה מספרים, כל אחד עם המיקום המשוער שלו בשורה.
export function splitPhones(word) {
  const t = word.t || "";
  const out = [];
  const used = new Array(t.length).fill(false);
  const pos = (i, len) => word.x0 + ((i + len / 2) / Math.max(1, t.length)) * (word.x1 - word.x0);
  // קודם מספרים עם מקף — הכי אמינים
  for (const m of t.matchAll(/0\d{1,2}-\d{7}/g)) {
    const p = normalizePhone(m[0]);
    if (p) { out.push({ p, x: pos(m.index, m[0].length) }); for (let k = m.index; k < m.index + m[0].length; k++) used[k] = true; }
  }
  // ואז רצפי ספרות בלי מקף (למשל 0545985611, או שני מספרים צמודים)
  for (const m of t.replace(/./g, (ch, i) => (used[i] ? " " : ch)).matchAll(/\d{9,}/g)) {
    let run = m[0], base = m.index;
    while (run.length >= 9) {
      const take = /^05|^07/.test(run) ? 10 : /^0[2-489]/.test(run) ? 9 : run.length === 9 && /^5/.test(run) ? 9 : 0;
      if (!take || run.length < take) { run = run.slice(1); base++; continue; }
      const p = normalizePhone(run.slice(0, take));
      if (p) out.push({ p, x: pos(base, take) });
      run = run.slice(take); base += take;
    }
  }
  return out;
}

// ---------- הרכבת הטבלה מתוך שורות ה-OCR ----------
// heb/eng: מערכי שורות { t, y0, y1, words:[{t,x0,x1}] } — מזיהוי עברית ומזיהוי ספרות בלבד.
const HEADERS = [
  ["last", /משפחה/], ["first", /פרטי/], ["home", /בבית|בית$/], ["dad", /אבא/], ["mom", /אמא/], ["address", /כתובת/],
];
const cx = (w) => (w.x0 + w.x1) / 2;
const overlap = (a, b) => Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)) / Math.max(1, Math.min(a.y1 - a.y0, b.y1 - b.y0));
const HEB_WORD = /^[א-ת][א-ת'"׳״-]*$/;

export function buildSheet(heb, eng) {
  // כותרת
  let heading = null;
  for (const l of heb.slice(0, 6)) { heading = parseHeading(l.t); if (heading) break; }

  // שורת הכותרות של הטבלה — מרכז כל עמודה
  const headerLine = heb.find((l) => /משפחה/.test(l.t) && /פרטי/.test(l.t));
  const cols = {};
  if (headerLine) {
    for (const [key, re] of HEADERS) {
      const w = headerLine.words.find((x) => re.test(x.t.replace(/[^א-ת]/g, "")));
      if (w) cols[key] = cx(w);
    }
    // "שם משפחה" — שתי מילים; המרכז האמיתי בין "שם" ל"משפחה"
    const i = headerLine.words.findIndex((x) => /משפחה/.test(x.t));
    if (i > 0 && /שם/.test(headerLine.words[i - 1].t)) cols.last = (cx(headerLine.words[i]) + cx(headerLine.words[i - 1])) / 2;
    const j = headerLine.words.findIndex((x) => /פרטי/.test(x.t));
    if (j > 0 && /שם/.test(headerLine.words[j - 1].t)) cols.first = (cx(headerLine.words[j]) + cx(headerLine.words[j - 1])) / 2;
  }
  const nearest = (x, keys) => keys.filter((k) => cols[k] != null).sort((a, b) => Math.abs(cols[a] - x) - Math.abs(cols[b] - x))[0];
  const startY = headerLine ? headerLine.y1 : (heb[2] ? heb[2].y0 : 0);

  const rows = [];
  for (const line of heb) {
    if (line.y0 <= startY) continue;
    // שמות
    let last = []; let first = [];
    const hebWords = line.words.map((w) => ({ ...w, t: w.t.replace(/^[^א-ת]+|[^א-ת'"׳״]+$/g, "") })).filter((w) => HEB_WORD.test(w.t));
    if (cols.last != null && cols.first != null) {
      for (const w of hebWords) {
        const k = nearest(cx(w), ["last", "first", "home", "dad", "mom", "address"]);
        if (k === "last") last.push(w); else if (k === "first") first.push(w);
      }
      // סדר קריאה מימין לשמאל
      last = last.sort((a, b) => b.x0 - a.x0).map((w) => w.t);
      first = first.sort((a, b) => b.x0 - a.x0).map((w) => w.t);
    } else {
      const ws = hebWords.sort((a, b) => b.x0 - a.x0).map((w) => w.t).filter((t) => t !== "אין");
      last = ws.slice(0, 1); first = ws.slice(1, 3);
    }
    if (!last.length && !first.length) continue;

    // טלפונים מזיהוי הספרות באותו גובה שורה
    const phones = { home: "", dad: "", mom: "" };
    const nums = eng.filter((e) => overlap(e, line) > 0.4).flatMap((e) => e.words)
      .flatMap(splitPhones)
      .sort((a, b) => b.x - a.x);
    for (const n of nums) {
      let k = cols.home != null || cols.dad != null || cols.mom != null ? nearest(n.x, ["home", "dad", "mom"]) : null;
      if (!k) k = !isMobile(n.p) ? "home" : !phones.dad ? "dad" : "mom";
      if (!phones[k]) phones[k] = n.p;
    }
    rows.push({ last: last.join(" "), first: first.join(" "), ...phones });
  }
  return { heading, rows };
}

// ---------- נוסחי ההודעה ----------
export const DEFAULT_TEMPLATES = {
  female:
    "היי {שם}, שמי רעות פריד, שדכנית ב\"הקהילה איתך\" 🌸\nאני פונה אלייך כי למדת במוסדות של {מוסד}.\nאנחנו מאגר שידוכים קהילתי — אישי, חם ודיסקרטי — ואשמח מאוד לעזור לך למצוא את הזיווג.\nלהצטרפות למאגר (2 דקות): {קישור}\nאם זה לא רלוונטי כרגע, פשוט כתבי לי ולא אפנה שוב 🙏",
  male:
    "היי {שם}, שמי רעות פריד, שדכנית ב\"הקהילה איתך\" 🌸\nאני פונה אליך כי למדת במוסדות של {מוסד}.\nאנחנו מאגר שידוכים קהילתי — אישי, חם ודיסקרטי — ואשמח מאוד לעזור לך למצוא את הזיווג.\nלהצטרפות למאגר (2 דקות): {קישור}\nאם זה לא רלוונטי כרגע, פשוט כתוב לי ולא אפנה שוב 🙏",
  parent:
    "שלום, שמי רעות פריד, שדכנית ב\"הקהילה איתך\" 🌸\nאני פונה אליכם בנוגע ל{שם}, {שלמד} במוסדות של {מוסד}.\nאנחנו מאגר שידוכים קהילתי — אישי, חם ודיסקרטי — ואשמח לעזור במציאת הזיווג.\nלהצטרפות למאגר (2 דקות): {קישור}\nאם זה לא רלוונטי כרגע, פשוט כתבו לי ולא אפנה שוב 🙏",
};
export function buildMessage(tpl, { name, institution, gender, link }) {
  return (tpl || "")
    .replaceAll("{שם}", name || "")
    .replaceAll("{מוסד}", institution || "")
    .replaceAll("{קישור}", link || "")
    .replaceAll("{שלמד}", gender === "female" ? "שלמדה" : "שלמד");
}
