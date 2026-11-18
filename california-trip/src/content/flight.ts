// פרטי הטיסה — מקום אחד לכל האתר. כל המספרים בעמוד הבית מחושבים מכאן.
// כדי לשנות יעד: מחליפים את "to" (שם, קוד שדה, קואורדינטות ואזור זמן) — והמרחק והפרש השעות יתעדכנו לבד.

export type Airport = { city: string; code: string; lat: number; lng: number; timeZone: string };

export const FLIGHT = {
  from: { city: "תל אביב", code: "TLV", lat: 32.0114, lng: 34.8867, timeZone: "Asia/Jerusalem" } as Airport,
  to: { city: "סן פרנסיסקו", code: "SFO", lat: 37.6213, lng: -122.379, timeZone: "America/Los_Angeles" } as Airport,
  /** משך טיסה ישירה בכיוון מערב, בקירוב (לפי לוחות הזמנים של הטיסות הישירות בקו) */
  approxHours: 15,
};

/** מרחק אווירי בקו ישר (מעגל גדול), בקילומטרים */
export function distanceKm(a: Airport = FLIGHT.from, b: Airport = FLIGHT.to): number {
  const R = 6371.0088;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dp = rad(b.lat - a.lat);
  const dl = rad(b.lng - a.lng);
  const x = Math.sin(dp / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function offsetMinutes(timeZone: string, at: Date): number {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(at);
  const g = (t: string) => Number(p.find((x) => x.type === t)?.value ?? 0);
  const asUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute"));
  return Math.round((asUtc - Math.floor(at.getTime() / 60000) * 60000) / 60000);
}

/** כמה שעות ישראל מקדימה את היעד — מחושב לפי התאריך (שעון קיץ/חורף בשתי המדינות) */
export function hoursDifference(at: Date = new Date()): number {
  return (offsetMinutes(FLIGHT.from.timeZone, at) - offsetMinutes(FLIGHT.to.timeZone, at)) / 60;
}
