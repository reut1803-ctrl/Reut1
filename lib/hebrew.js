// המרת תאריכים עברי<->לועזי (אלגוריתם Dershowitz-Reingold, ללא תלות בספריות חיצוניות).
// month פנימי: ניסן=1 ... תשרי=7 ... אדר/אדר א'=12, אדר ב'=13.

const HEBREW_EPOCH = -1373427;
const GREGORIAN_EPOCH = 1;
const mod = (x, y) => x - y * Math.floor(x / y);

export function hebrewLeap(year) {
  return mod(7 * year + 1, 19) < 7;
}
export function hebrewMonthsInYear(year) {
  return hebrewLeap(year) ? 13 : 12;
}

function hebrewCalendarElapsedDays(year) {
  const monthsElapsed = Math.floor((235 * year - 234) / 19);
  const partsElapsed = 12084 + 13753 * monthsElapsed;
  const day = monthsElapsed * 29 + Math.floor(partsElapsed / 25920);
  if (mod(3 * (day + 1), 7) < 3) return day + 1;
  return day;
}
function hebrewNewYearDelay(year) {
  const ny0 = hebrewCalendarElapsedDays(year - 1);
  const ny1 = hebrewCalendarElapsedDays(year);
  const ny2 = hebrewCalendarElapsedDays(year + 1);
  if (ny2 - ny1 === 356) return 2;
  if (ny1 - ny0 === 382) return 1;
  return 0;
}
function hebrewNewYear(year) {
  return HEBREW_EPOCH + hebrewCalendarElapsedDays(year) + hebrewNewYearDelay(year);
}
function hebrewDaysInYear(year) {
  return hebrewNewYear(year + 1) - hebrewNewYear(year);
}
function longHeshvan(year) {
  return mod(hebrewDaysInYear(year), 10) === 5;
}
function shortKislev(year) {
  return mod(hebrewDaysInYear(year), 10) === 3;
}
export function lastDayOfHebrewMonth(year, month) {
  if ([2, 4, 6, 10, 13].includes(month)) return 29;
  if (month === 12 && !hebrewLeap(year)) return 29;
  if (month === 8 && !longHeshvan(year)) return 29;
  if (month === 9 && shortKislev(year)) return 29;
  return 30;
}
function hebrewToFixed(year, month, day) {
  let f = hebrewNewYear(year) + day - 1;
  if (month < 7) {
    const months = hebrewMonthsInYear(year);
    for (let m = 7; m <= months; m++) f += lastDayOfHebrewMonth(year, m);
    for (let m = 1; m < month; m++) f += lastDayOfHebrewMonth(year, m);
  } else {
    for (let m = 7; m < month; m++) f += lastDayOfHebrewMonth(year, m);
  }
  return f;
}

function gregorianLeap(year) {
  return mod(year, 4) === 0 && ![100, 200, 300].includes(mod(year, 400));
}
function fixedFromGregorian(year, month, day) {
  return (
    GREGORIAN_EPOCH - 1 +
    365 * (year - 1) +
    Math.floor((year - 1) / 4) -
    Math.floor((year - 1) / 100) +
    Math.floor((year - 1) / 400) +
    Math.floor((367 * month - 362) / 12) +
    (month <= 2 ? 0 : gregorianLeap(year) ? -1 : -2) +
    day
  );
}
function gregorianYearFromFixed(date) {
  const d0 = date - GREGORIAN_EPOCH;
  const n400 = Math.floor(d0 / 146097);
  const d1 = mod(d0, 146097);
  const n100 = Math.floor(d1 / 36524);
  const d2 = mod(d1, 36524);
  const n4 = Math.floor(d2 / 1461);
  const d3 = mod(d2, 1461);
  const n1 = Math.floor(d3 / 365);
  const year = 400 * n400 + 100 * n100 + 4 * n4 + n1;
  return n100 === 4 || n1 === 4 ? year : year + 1;
}
function gregorianFromFixed(date) {
  const year = gregorianYearFromFixed(date);
  const priorDays = date - fixedFromGregorian(year, 1, 1);
  const correction = date < fixedFromGregorian(year, 3, 1) ? 0 : gregorianLeap(year) ? 1 : 2;
  const month = Math.floor((12 * (priorDays + correction) + 373) / 367);
  const day = date - fixedFromGregorian(year, month, 1) + 1;
  return { year, month, day };
}

function hebrewFromFixed(date) {
  const approx = Math.floor((98496 * (date - HEBREW_EPOCH)) / 35975351) + 1;
  let year = approx - 1;
  while (hebrewNewYear(year + 1) <= date) year++;
  const start = date < hebrewToFixed(year, 1, 1) ? 7 : 1;
  let month = start;
  while (date > hebrewToFixed(year, month, lastDayOfHebrewMonth(year, month))) month++;
  const day = date - hebrewToFixed(year, month, 1) + 1;
  return { year, month, day };
}

// ----- ממשק נוח -----
const pad = (n) => String(n).padStart(2, "0");

// המרת תאריך עברי (שנה, חודש פנימי, יום) ל-ISO לועזי.
export function hebrewToISO(year, month, day) {
  const g = gregorianFromFixed(hebrewToFixed(year, month, day));
  return `${g.year}-${pad(g.month)}-${pad(g.day)}`;
}

// המרת ISO לועזי לרכיבי תאריך עברי.
export function isoToHebrew(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return hebrewFromFixed(fixedFromGregorian(y, m, d));
}

// שמות חודשים עבריים לפי סדר אזרחי (מתשרי), תלוי בשנה מעוברת.
const MONTH_NAMES = {
  1: "ניסן", 2: "אייר", 3: "סיוון", 4: "תמוז", 5: "אב", 6: "אלול",
  7: "תשרי", 8: "חשוון", 9: "כסלו", 10: "טבת", 11: "שבט",
};
export function hebrewMonthName(year, month) {
  if (month === 12) return hebrewLeap(year) ? "אדר א׳" : "אדר";
  if (month === 13) return "אדר ב׳";
  return MONTH_NAMES[month];
}

// המרת מספר (1-999) לאותיות עבריות (גימטריה) עם גרש/גרשיים.
export function hebrewNumeral(n) {
  const units = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
  const hundreds = ["", "ק", "ר", "ש", "ת", "תק", "תר", "תש", "תת", "תתק"];
  let s = hundreds[Math.floor(n / 100)] || "";
  const r = n % 100;
  if (r === 15) s += "טו";
  else if (r === 16) s += "טז";
  else s += (tens[Math.floor(r / 10)] || "") + (units[r % 10] || "");
  if (s.length === 1) return s + "׳";
  return s.slice(0, -1) + "״" + s.slice(-1);
}

// תווית שנה עברית באותiות (ללא האלפים), למשל 5786 -> תשפ"ו
export function hebrewYearNumeral(year) {
  return hebrewNumeral(year % 1000);
}

// רשימת חודשים בסדר אזרחי: [{value: internalMonth, name}]
export function civilMonths(year) {
  const order = hebrewLeap(year)
    ? [7, 8, 9, 10, 11, 12, 13, 1, 2, 3, 4, 5, 6]
    : [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
  return order.map((m) => ({ value: m, name: hebrewMonthName(year, m) }));
}
