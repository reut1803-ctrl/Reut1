// מנוע ההמלצות — רץ על הטלפון עצמו, בלי שרת ובלי מפתח.
// מדרג כל מקום לפי ההעדפות שלכם, מצב הרוח של הבנות, המרחק, השעה, מזג האוויר והזמן עד שבת,
// ומחזיר גם את הסיבות — כדי שתמיד יהיה ברור למה זה הומלץ.

import { SPOTS, type Interest, type KidsMood, type Spot } from "@/content/sfGuide";
import { driveHours, formatDrive, type Origin, type ShabbatClock, type Weather } from "./context";
import { caNow } from "./time";

export type Pace = "calm" | "balanced" | "active";
export type Prefs = { interests: Interest[]; kids: KidsMood[]; pace: Pace; maxDrive: number };
export const DEFAULT_PREFS: Prefs = { interests: ["nature", "views", "animals"], kids: ["play", "animals"], pace: "balanced", maxDrive: 2 };

export type Situation = {
  now: number;
  origin: Origin;
  weather: Weather | null;
  shabbat: ShabbatClock | null;
};

export type Rec = { spot: Spot; score: number; drive: number; reasons: string[]; fitsBefore: boolean };

function hourCA(now: number) {
  return Number(caNow(now).time.slice(0, 2));
}

/** כמה שעות פנויות יש עד שצריך לחזור (שבת / לילה) */
export function freeHours(s: Situation): { hours: number; limit: "shabbat" | "night" | null } {
  const h = hourCA(s.now);
  const toNight = Math.max(0, 21 - h);
  if (s.shabbat?.candles && s.shabbat.candles > s.now) {
    const toShabbat = (s.shabbat.candles - s.now) / 3600000 - 0.75; // חוזרים 45 דק׳ לפני הדלקת נרות
    if (toShabbat < toNight) return { hours: Math.max(0, toShabbat), limit: "shabbat" };
  }
  return { hours: toNight, limit: "night" };
}

export function isShabbatNow(s: Situation) {
  const { candles, havdalah } = s.shabbat ?? {};
  return !!(havdalah && s.now < havdalah && (!candles || candles < s.now || candles > havdalah));
}

export function rank(prefs: Prefs, s: Situation, saved: Set<string> = new Set()): Rec[] {
  const h = hourCA(s.now);
  const free = freeHours(s);
  const wx = s.weather;
  const paceDrive = prefs.pace === "calm" ? 1.6 : prefs.pace === "active" ? 0.6 : 1;
  const out: Rec[] = [];

  for (const spot of SPOTS) {
    const drive = driveHours(s.origin, spot);
    if (drive > prefs.maxDrive + 0.15) continue;
    const reasons: string[] = [];
    let score = 0;

    const likes = spot.interests.filter((i) => prefs.interests.includes(i)).length;
    if (likes) { score += likes * 3; reasons.push("מתאים למה שאתם אוהבים"); }
    const kidsHit = spot.kids.filter((k) => prefs.kids.includes(k)).length;
    if (kidsHit) { score += kidsHit * 2.5; reasons.push("הבנות ייהנו"); }
    if (spot.mustSee) { score += 2; reasons.push("מקום חובה"); }
    if (saved.has(spot.id)) score += 1.5;

    // מזג אוויר
    if (wx) {
      if (wx.kind === "rain" || wx.kind === "storm" || wx.rainSoon) {
        if (spot.indoor) { score += 5; reasons.push("מקורה — טוב כשיורד גשם"); } else score -= 9;
      } else if (wx.kind === "fog") {
        if (spot.interests.includes("views") && !spot.indoor) score -= 4;
        if (spot.indoor) { score += 1.5; reasons.push("טוב ליום ערפילי"); }
        if (spot.cat === "nature" && !spot.interests.includes("views")) score += 1;
      } else if (wx.kind === "clear") {
        if (spot.interests.includes("views") || spot.interests.includes("beach")) { score += 2; reasons.push("יום בהיר — הנוף פתוח"); }
      }
      if (wx.temp <= 10 && spot.interests.includes("beach")) score -= 1.5;
    }

    // שעה ביום
    const sunsetIn = s.weather?.sunset ? (s.weather.sunset - s.now) / 3600000 : null;
    if (spot.best === "sunset" && sunsetIn !== null && sunsetIn > drive && sunsetIn < drive + 2.5) { score += 3; reasons.push("תגיעו בזמן לשקיעה"); }
    if (spot.best === "morning" && h >= 13) score -= 2.5;
    if (spot.best === "morning" && h < 11) score += 1;

    // זמן פנוי (כולל חזרה)
    const need = drive * 2 + Math.min(spot.hours, 3);
    const fitsBefore = need <= free.hours;
    if (!fitsBefore) score -= free.limit === "shabbat" ? 8 : 4;
    else if (free.hours < 4 && drive < 0.5) score += 1.5;

    score -= drive * paceDrive * 1.2;
    reasons.push(`נסיעה ${formatDrive(drive)}`);
    out.push({ spot, score, drive, reasons, fitsBefore });
  }
  return out.sort((a, b) => b.score - a.score);
}

// ---------- "הצעד הבא" ----------

export type Plan = { id: string; date: string; time: string; title: string; status?: string; lat?: number | null; lng?: number | null; address?: string };
export type NextStep = { tone: "shabbat" | "go" | "rest" | "idea" | "info"; title: string; text: string; spot?: Spot; plan?: Plan };

export function nextStep(s: Situation, plans: Plan[], top: Rec | undefined, lodging?: string | null): NextStep {
  const now = s.now;
  const { date, time } = caNow(now);
  const h = hourCA(now);

  if (isShabbatNow(s)) {
    return { tone: "shabbat", title: "שבת שלום", text: "מנוחה, סעודה וזמן ביחד. ההמלצות יחכו למוצאי שבת." };
  }
  if (s.shabbat?.candles && s.shabbat.candles > now) {
    const left = (s.shabbat.candles - now) / 3600000;
    if (left <= 3) {
      const t = new Intl.DateTimeFormat("he-IL", { timeZone: "America/Los_Angeles", hour: "2-digit", minute: "2-digit", hour12: false }).format(s.shabbat.candles);
      return { tone: "shabbat", title: `שבת נכנסת ב-${t}`, text: left <= 1.5 ? `עוד ${Math.round(left * 60)} דקות. זמן לחזור${lodging ? ` ל${lodging}` : " ללינה"} ולהתכונן.` : "כדאי לתכנן רק משהו קרוב ולחזור בזמן להכנות." };
    }
  }

  const upcoming = plans
    .filter((p) => p.date === date && p.status !== "done" && p.status !== "paused" && p.time >= time)
    .sort((a, b) => a.time.localeCompare(b.time))[0];
  if (upcoming) {
    const [ph, pm] = upcoming.time.split(":").map(Number);
    const [nh, nm] = time.split(":").map(Number);
    const mins = ph * 60 + pm - (nh * 60 + nm);
    const drive = typeof upcoming.lat === "number" && typeof upcoming.lng === "number" ? driveHours(s.origin, { lat: upcoming.lat, lng: upcoming.lng }) * 60 : null;
    if (mins <= 120) {
      const leave = drive !== null ? Math.round(mins - drive) : null;
      return {
        tone: "go",
        title: `${upcoming.time} · ${upcoming.title}`,
        text: leave !== null ? (leave <= 5 ? `הגיע הזמן לצאת (נסיעה ${formatDrive(drive! / 60)}).` : `לצאת בעוד כ-${leave} דקות (נסיעה ${formatDrive(drive! / 60)}).`) : `בעוד ${mins} דקות.`,
        plan: upcoming,
      };
    }
  }

  if (h >= 21 || h < 6) {
    return { tone: "rest", title: "לילה טוב", text: `זמן לנוח${lodging ? ` ב${lodging}` : ""}. מחר מתחילים מחדש.` };
  }

  if (top) {
    const wx = s.weather;
    const lead = wx?.kind === "rain" || wx?.rainSoon ? "יורד גשם — " : wx?.kind === "fog" ? "יש ערפל — " : wx?.kind === "clear" ? "יום בהיר — " : "";
    const free = freeHours(s);
    const before = free.limit === "shabbat" ? ` יש לכם ${formatDrive(free.hours).replace("כ-", "כ")} עד ההכנות לשבת.` : "";
    return {
      tone: "idea",
      title: top.spot.name,
      text: `${lead}${top.spot.why} ${top.reasons.filter((r) => r.startsWith("נסיעה")).join("")}.${before}`,
      spot: top.spot,
    };
  }
  return { tone: "info", title: "יום פתוח", text: "אפשר לבחור משהו מ״אסור לפספס״, או סתם לנוח." };
}
