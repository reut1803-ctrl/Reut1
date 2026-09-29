// המרה לתאריך עברי אמיתי.
// חישוב הלוח העברי עצמו (שנים מעוברות, חודשי אדר א' וב', אורך החודשים)
// נעשה על ידי לוח השנה העברי המובנה בדפדפן, ולא בטבלה שאנחנו מתחזקים -
// כך התאריך תמיד נכון גם בעוד עשר שנים. כאן רק ממירים את המספרים לאותיות.

const ONES = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
const TENS = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
const HUNDREDS = ["", "ק", "ר", "ש", "ת"];

// מספר לאותיות: 12 -> יב, 786 -> תשפו
function toLetters(value) {
  let rest = Math.floor(value);
  let out = "";
  while (rest >= 400) {
    out += "ת";
    rest -= 400;
  }
  out += HUNDREDS[Math.floor(rest / 100)] || "";
  rest %= 100;
  // ט"ו ו-ט"ז ולא י"ה / י"ו, כדי לא לכתוב צירוף של שם ה'
  if (rest === 15) return out + "טו";
  if (rest === 16) return out + "טז";
  out += TENS[Math.floor(rest / 10)] || "";
  rest %= 10;
  out += ONES[rest] || "";
  return out;
}

// גרש לאות בודדת, גרשיים לפני האות האחרונה: כ' , י"ב , תשפ"ו
function punctuate(letters) {
  if (!letters) return "";
  if (letters.length === 1) return `${letters}׳`;
  return `${letters.slice(0, -1)}״${letters.slice(-1)}`;
}

export function hebrewNumeral(value) {
  const n = Number(value);
  if (!n || n < 1) return "";
  return punctuate(toLetters(n));
}

// שנה עברית נכתבת בלי האלפים: 5786 -> תשפ"ו
export function hebrewYearNumeral(year) {
  const n = Number(year);
  if (!n) return "";
  return punctuate(toLetters(n % 1000));
}

function hebrewParts(date) {
  try {
    const parts = new Intl.DateTimeFormat("he-IL-u-ca-hebrew", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).formatToParts(date);
    const find = (type) => parts.find((p) => p.type === type)?.value || "";
    return { day: find("day"), month: find("month"), year: find("year") };
  } catch {
    // דפדפן ישן שאין בו לוח שנה עברי - מוותרים על התאריך העברי בלבד
    return null;
  }
}

const isValid = (date) => date instanceof Date && !Number.isNaN(date.getTime());

// "כ׳ באלול תשפ״ו". withYear=false מחזיר "כ׳ באלול".
export function toHebrewDate(value, { withYear = true } = {}) {
  if (!value) return "";
  const date = new Date(value);
  if (!isValid(date)) return "";
  const parts = hebrewParts(date);
  if (!parts || !parts.month) return "";
  const day = hebrewNumeral(parts.day);
  const year = withYear ? hebrewYearNumeral(parts.year) : "";
  // שם החודש כבר מגיע מהדפדפן בעברית ובלי ה"א הידיעה
  return [day, `ב${parts.month}`, year].filter(Boolean).join(" ");
}

// "25.8.2026"
export function toGregorianDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (!isValid(date)) return "";
  return date.toLocaleDateString("he-IL");
}

// "16:04"
export function toClock(value) {
  if (!value) return "";
  const date = new Date(value);
  if (!isValid(date)) return "";
  return date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
}

// השורה המלאה שמוצגת במסך: "כ׳ באלול תשפ״ו · 25.8.2026, 16:04"
// ערך חסר מחזיר מחרוזת ריקה - ולא 1.1.1970, שזה מה שקורה כשממירים "כלום" לתאריך.
export function fullDateLine(value, { withYear = true, withTime = true } = {}) {
  if (!value) return "";
  const date = new Date(value);
  if (!isValid(date)) return "";
  const hebrew = toHebrewDate(value, { withYear });
  const civil = toGregorianDate(value);
  const clock = withTime ? toClock(value) : "";
  const right = clock ? `${civil}, ${clock}` : civil;
  return hebrew ? `${hebrew} · ${right}` : right;
}
