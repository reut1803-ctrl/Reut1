// פענוח קובץ צ'אט שיוצא מוואטסאפ ("ייצוא צ'אט" הרשמי, ללא מדיה) או טקסט מודבק.
//
// הקובץ טהור: אין בו פניות לרשת, לא קריאה ולא כתיבה למסד הנתונים.
// הכל קורה בדפדפן של המנהלת, לפני שמשהו נשלח החוצה:
//   * טלפונים ומיילים מוחלפים בתגים ([טלפון 1], [מייל 1])
//   * שמות השולחים מוחלפים בתגים ([שולח 1])
// המיפוי חזרה לפרטים האמיתיים נשאר אצל המנהלת, ומשמש רק לתצוגה אצלה.

// שורת פתיחה של הודעה, בשני הפורמטים של וואטסאפ:
//   אנדרואיד: 12/05/2024, 22:15 - שם: טקסט
//   אייפון:   [12/05/2024, 22:15:03] שם: טקסט
const LINE_RE =
  /^\[?(\d{1,2})[./-](\d{1,2})[./-](\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp]\.?[Mm]\.?|לפנה"צ|אחה"צ)?\]?\s*[-–]?\s*(.*)$/;
const INVISIBLE = /[‎‏‪-‮⁦-⁩﻿]/g;

function toYear(y) {
  const n = Number(y);
  return n < 100 ? 2000 + n : n;
}

// סדר יום/חודש: אם יש בקובץ מספר גדול מ-12 באחד המקומות - הוא מכריע.
// אחרת, ברירת המחדל הישראלית: יום קודם.
function detectDayFirst(heads) {
  for (const h of heads) {
    if (Number(h[1]) > 12) return true;
    if (Number(h[2]) > 12) return false;
  }
  return true;
}

export function parseChat(raw) {
  const lines = String(raw || "").replace(INVISIBLE, "").split(/\r?\n/);
  const heads = lines.map((l) => LINE_RE.exec(l.trim())).filter(Boolean);
  if (heads.length === 0) {
    // טקסט מודבק בלי חותמות זמן - הודעה אחת גדולה, בלי סינון לפי זמן
    const text = lines.join("\n").trim();
    return { messages: text ? [{ at: null, sender: "", text }] : [], timed: false };
  }
  const dayFirst = detectDayFirst(heads);
  const messages = [];
  for (const line of lines) {
    const m = LINE_RE.exec(line.trim());
    if (!m) {
      // שורת המשך של הודעה ארוכה
      if (messages.length && line.trim()) messages[messages.length - 1].text += `\n${line.trim()}`;
      continue;
    }
    const [, a, b, y, hh, mm, ss, ampm, rest] = m;
    const day = Number(dayFirst ? a : b);
    const month = Number(dayFirst ? b : a);
    let hour = Number(hh);
    const pm = ampm && (/^[Pp]/.test(ampm) || ampm === 'אחה"צ');
    const am = ampm && (/^[Aa]/.test(ampm) || ampm === 'לפנה"צ');
    if (pm && hour < 12) hour += 12;
    if (am && hour === 12) hour = 0;
    // השעה בקובץ היא שעון ישראל; הסטייה מחושבת לפי התאריך עצמו (קיץ/חורף)
    const at = israelTime(toYear(y), month, day, hour, Number(mm), Number(ss || 0));
    // "שם: טקסט". שורה בלי נקודתיים היא הודעת מערכת (הצטרפות, הצפנה וכו')
    const colon = rest.indexOf(": ");
    if (colon <= 0) continue;
    const sender = rest.slice(0, colon).trim();
    const text = rest.slice(colon + 2).trim();
    if (!text || /^<(?:המדיה הושמטה|Media omitted)>$/.test(text)) continue;
    messages.push({ at, sender, text });
  }
  return { messages, timed: true };
}

// ממיר שעה מקומית בישראל לזמן אחיד, בלי ספריות: מנחשים, ובודקים מה השעה
// בישראל ברגע הזה, ומתקנים את ההפרש.
function israelTime(y, mo, d, h, mi, s) {
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  if (!Number.isFinite(guess)) return null;
  try {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Jerusalem",
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
        .formatToParts(new Date(guess))
        .map((p) => [p.type, p.value])
    );
    const shown = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    return guess - (shown - guess);
  } catch {
    return guess;
  }
}

// ההודעות שבחלון הזמן: 24 השעות שלפני "עכשיו" (לפי שעון השרת).
// מחזיר גם את זמן ההודעה האחרונה בקובץ, כדי להציע חלון חלופי כשהקובץ ישן.
export function messagesInWindow(messages, endMs, hours = 24) {
  const start = endMs - hours * 3600 * 1000;
  return messages.filter((m) => m.at === null || (m.at > start && m.at <= endMs + 5 * 60 * 1000));
}

export function lastMessageAt(messages) {
  return messages.reduce((max, m) => (m.at && m.at > max ? m.at : max), 0);
}

// טלפון: 9 עד 13 ספרות, עם או בלי קידומת, מקפים ורווחים
const PHONE_RE = /\+?\d[\d\s\-–.()]{6,}\d/g;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const digitsOf = (s) => s.replace(/\D/g, "");

// החלפת פרטי הקשר ושמות השולחים בתגים. מחזיר את הטקסט לשליחה ואת המיפוי
// חזרה - שנשאר בדפדפן בלבד.
export function tokenizeChat(messages, { maxChars = 40_000 } = {}) {
  const contacts = {}; // "[טלפון 1]" -> "052-1234567"
  const byDigits = {};
  const senders = {}; // "[שולח 1]" -> השם כפי שמופיע בקובץ
  const bySender = {};
  let phones = 0;
  let mails = 0;

  const phoneToken = (raw) => {
    const digits = digitsOf(raw);
    if (digits.length < 9 || digits.length > 13) return null;
    // 972501234567 ו-0501234567 הם אותו מספר
    const key = digits.replace(/^972/, "0");
    if (!byDigits[key]) {
      phones += 1;
      byDigits[key] = `[טלפון ${phones}]`;
      contacts[byDigits[key]] = raw.trim();
    }
    return byDigits[key];
  };
  const clean = (text) =>
    String(text || "")
      .replace(EMAIL_RE, (raw) => {
        mails += 1;
        const token = `[מייל ${mails}]`;
        contacts[token] = raw;
        return token;
      })
      .replace(PHONE_RE, (raw) => phoneToken(raw) || raw);

  const senderToken = (name) => {
    if (!name) return "";
    if (!bySender[name]) {
      const n = Object.keys(senders).length + 1;
      bySender[name] = `[שולח ${n}]`;
      senders[bySender[name]] = name;
      // שולח שאינו שמור באנשי הקשר מופיע כמספר טלפון - גם הוא פרט קשר
      const asPhone = phoneToken(name);
      if (asPhone) contacts[bySender[name]] = contacts[asPhone];
    }
    return bySender[name];
  };

  // אם הטקסט ארוך מדי - נשמרות ההודעות האחרונות. קודם קובעים מאיפה להתחיל
  // (מהסוף להתחלה), ואז ממספרים את התגים לפי סדר הכתיבה.
  let start = messages.length;
  let size = 0;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    const len = String(m.sender || "").length + String(m.text || "").length + 16;
    if (size + len > maxChars && start < messages.length) break;
    size += len;
    start = i;
  }
  const out = messages
    .slice(start)
    .map((m) => `${m.sender ? `${senderToken(m.sender)}: ` : ""}${clean(m.text)}`);
  return { text: out.join("\n").slice(-maxChars), contacts, senders, used: out.length, total: messages.length };
}

// מחזיר טקסט עם התגים מוחלפים בחזרה בפרטים האמיתיים - לתצוגה אצל המנהלת בלבד
export function restoreTokens(text, { contacts = {}, senders = {} } = {}) {
  return String(text || "").replace(/\[(?:טלפון|מייל|שולח) \d+\]/g, (t) => contacts[t] || senders[t] || t);
}
