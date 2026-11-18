import { TRIP_TIMEZONE } from "./types";

// כל התאריכים והשעות בטיול נשמרים כ"שעון קליפורניה" (תאריך YYYY-MM-DD ושעה HH:mm).

function parts(ts: number, timeZone = TRIP_TIMEZONE) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(new Date(ts));
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
  return { y: g("year"), m: g("month"), d: g("day"), h: g("hour") % 24, mi: g("minute"), s: g("second") };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** התאריך והשעה עכשיו בקליפורניה */
export function caNow(ts = Date.now()) {
  const p = parts(ts);
  return { date: `${p.y}-${pad(p.m)}-${pad(p.d)}`, time: `${pad(p.h)}:${pad(p.mi)}` };
}

function offsetMinutes(ts: number) {
  const p = parts(ts);
  return (Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - ts) / 60000;
}

/** הופך "תאריך + שעה בקליפורניה" לרגע אמיתי בזמן */
export function caToDate(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let t = guess - offsetMinutes(guess) * 60000;
  const off2 = offsetMinutes(t);
  t = guess - off2 * 60000;
  return new Date(t);
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function daysBetween(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = start;
  for (let i = 0; i < 120 && cur <= end; i++) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export function heDate(date: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }) {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("he-IL", { ...opts, timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d, 12)));
}

export function heShort(date: string) {
  return heDate(date, { weekday: "short", day: "numeric", month: "numeric" });
}
