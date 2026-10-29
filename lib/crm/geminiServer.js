// שכבת החיבור ל-Gemini בצד השרת, עבור נתיבי העוזר החדשים (כרגע: ניתוח
// וואטסאפ). זהו עותק מדויק של המנגנונים שכבר נבדקו בנתיב /api/ai-match -
// אימות המנהלת, בחירת מודל, מעבר למודל אחר בעומס, תקציב זמן והסבר שגיאות.
// הנתיב הקיים לא שונה ואינו משתמש בקובץ הזה, כדי לא לסכן אותו.
//
// הקובץ מיועד לשרת בלבד: מפתח GEMINI_API_KEY נקרא כאן ולעולם לא מגיע לדפדפן.

import { rankedModels, tryOrder } from "@/lib/crm/geminiModel";

export const log = (...args) => console.log("[ai-whatsapp]", ...args);

export const OWNER_EMAIL = "reut1803@gmail.com";
// מפתח הווב של פרויקט Firebase. זה מפתח ציבורי (הוא ממילא נמצא בדפדפן),
// ומשמש כאן רק כדי לבקש מ-Firebase לאמת את אסימון הכניסה של הפונה.
const FIREBASE_WEB_API_KEY = "AIzaSyBKVXp-sbfm-ZfSSmSYKiWcepTEsF_UXNY";

// המודל: אם הוגדר GEMINI_MODEL ב-Vercel - משתמשים בדיוק בו. אחרת השרת שואל
// את Google אילו מודלים זמינים במפתח הזה ובוחר מתוכם (lib/crm/geminiModel.js),
// כדי לא להיות תלויים בשם מודל שעלול להיעלם. הבחירה נשמרת לכמה שעות.
export const PINNED_MODEL = String(process.env.GEMINI_MODEL || "").trim();
const MODEL_CACHE_MS = 6 * 60 * 60 * 1000;
let chosenModels = null;
let chosenAt = 0;
// כמה מודלים לנסות לכל היותר בבקשה אחת, וכמה זמן לתת לכל ניסיון
export const MAX_MODELS_TO_TRY = 3;
const ATTEMPT_TIMEOUT_MS = 30_000;
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
// מגבלת השרת ב-Vercel היא 60 שניות. אם היא נחצית, Vercel קוטע את השרת בלי
// הודעה מסודרת - והדפדפן מנסה שוב ומחכה עוד דקה. לכן כל הבקשה, מתחילתה,
// חייבת להסתיים בתוך 42 שניות, וכל פנייה חיצונית מוגבלת בזמן משלה.
export const TIME_BUDGET_MS = 42_000;
const SIDE_CALL_TIMEOUT_MS = 8_000;

export async function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// אימות זהות: Firebase בודק את האסימון ומחזיר את המייל המאומת של בעליו.
export async function verifyOwner(idToken) {
  if (!idToken || typeof idToken !== "string") return { ok: false, reason: "חסר אסימון כניסה" };
  try {
    const res = await fetchWithTimeout(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) },
      SIDE_CALL_TIMEOUT_MS
    );
    const data = await res.json().catch(() => null);
    const user = data?.users?.[0];
    if (!res.ok || !user) return { ok: false, reason: "אסימון הכניסה אינו תקף" };
    const email = String(user.email || "").trim().toLowerCase();
    if (email !== OWNER_EMAIL) return { ok: false, reason: "גישה למנהלת המערכת בלבד" };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: "אימות הזהות נכשל", detail: err?.message };
  }
}

export class GeminiError extends Error {
  constructor(status, message, retryAfterMs = 0) {
    super(message);
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

// Gemini מחזיר במכסת החינם הוראה כמה לחכות ("retryDelay": "30s")
function retryDelayFrom(errorBody) {
  const details = errorBody?.error?.details || [];
  for (const d of details) {
    const m = /^(\d+(?:\.\d+)?)s$/.exec(String(d?.retryDelay || ""));
    if (m) return Math.ceil(Number(m[1]) * 1000);
  }
  return 0;
}

async function listModels() {
  const res = await fetchWithTimeout(
    `${GEMINI_BASE}/models?pageSize=200`,
    { headers: { "x-goog-api-key": process.env.GEMINI_API_KEY } },
    SIDE_CALL_TIMEOUT_MS
  );
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new GeminiError(res.status, data?.error?.message || `HTTP ${res.status}`);
  return data?.models || [];
}

// רשימת המודלים לפי סדר העדפה, מתוך מה שזמין בחשבון בפועל
async function resolveModels({ refresh = false } = {}) {
  if (PINNED_MODEL) return [PINNED_MODEL];
  if (!refresh && chosenModels && Date.now() - chosenAt < MODEL_CACHE_MS) return chosenModels;
  const ranked = rankedModels(await listModels());
  if (ranked.length === 0) throw new GeminiError(404, "no text model in account");
  chosenModels = ranked;
  chosenAt = Date.now();
  log(`models to try: ${tryOrder(ranked, MAX_MODELS_TO_TRY).join(", ")}`);
  return ranked;
}

async function callGeminiOnce(payload, timeoutMs, model) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${GEMINI_BASE}/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new GeminiError(res.status, data?.error?.message || `HTTP ${res.status}`, retryDelayFrom(data));
    }
    return data;
  } catch (err) {
    if (err instanceof GeminiError) throw err;
    if (err?.name === "AbortError") throw new GeminiError(504, "timeout");
    throw new GeminiError(0, err?.message || "network");
  } finally {
    clearTimeout(timer);
  }
}

// כש-Google עמוס (503), חורג ממכסה (429) או נכשל זמנית (500/502/504/ניתוק),
// לא מנסים שוב את אותו מודל - עוברים מיד למודל הבא ברשימה של החשבון.
// במסלול החינמי לכל מודל מכסה ועומס משלו, ולכן המודל הבא לרוב פנוי.
// מודל שנעלם (404) גורם לרענון הרשימה. כל זה בתוך תקציב הזמן הכולל.
export async function callGemini(payload, started) {
  const SWITCH = new Set([0, 429, 500, 502, 503, 504]);
  let models = tryOrder(await resolveModels(), MAX_MODELS_TO_TRY);
  let refreshed = false;
  const tried = [];
  let lastErr = null;

  for (let i = 0; i < models.length && tried.length < MAX_MODELS_TO_TRY; i += 1) {
    const model = models[i];
    if (tried.includes(model)) continue;
    const left = TIME_BUDGET_MS - (Date.now() - started);
    if (left < 6000) break;
    tried.push(model);
    try {
      const data = await callGeminiOnce(payload, Math.min(ATTEMPT_TIMEOUT_MS, left), model);
      if (tried.length > 1) log(`succeeded on fallback model ${model} after: ${tried.slice(0, -1).join(", ")}`);
      return { data, model };
    } catch (err) {
      lastErr = err;
      log(`model ${model} failed: ${err.status} ${err.message}`);
      if (err.status === 404 && !PINNED_MODEL && !refreshed) {
        refreshed = true;
        models = tryOrder(await resolveModels({ refresh: true }), MAX_MODELS_TO_TRY + 1);
        i = -1; // מתחילים מחדש ברשימה המעודכנת, בלי לחזור על מה שכבר נוסה
        continue;
      }
      if (!SWITCH.has(err.status)) throw err;
    }
  }
  const err = lastErr || new GeminiError(503, "no model attempted");
  err.tried = tried;
  throw err;
}

export function explainGeminiError(err) {
  const s = err?.status;
  const raw = String(err?.message || "");
  if (s === 400 && /api key/i.test(raw)) return { status: 502, msg: "מפתח Gemini אינו תקין. יש לבדוק את GEMINI_API_KEY ב-Vercel." };
  if (s === 403) return { status: 502, msg: "למפתח Gemini אין הרשאה לשירות הזה. ייתכן שה-API לא הופעל בפרויקט." };
  if (s === 404) {
    return PINNED_MODEL
      ? { status: 502, msg: `המודל ${PINNED_MODEL} (שהוגדר ב-GEMINI_MODEL ב-Vercel) לא זמין בחשבון. אפשר למחוק את ההגדרה והמערכת תבחר מודל זמין לבד.` }
      : { status: 502, msg: "לא נמצא בחשבון ה-Gemini מודל טקסט זמין. פתחי את בדיקת הבריאות של הנתיב כדי לראות מה קיים." };
  }
  if (s === 429) {
    const sec = err.retryAfterMs ? ` נסי שוב בעוד כ-${Math.ceil(err.retryAfterMs / 1000)} שניות.` : " נסי שוב בעוד דקה.";
    // 503 ולא 429: הדפדפן מנסה שוב אוטומטית על 429, ובמסלול החינמי ניסיון
    // חוזר אחרי שתי שניות כמעט תמיד נכשל שוב - וההמתנה רק מתארכת.
    return { status: 503, msg: `הגעת למגבלת השימוש של המסלול החינמי.${sec}` };
  }
  if (s === 504) return { status: 503, msg: "שירות הבינה לא ענה בזמן (כ-40 שניות). נסי שוב בעוד רגע." };
  const triedCount = err?.tried?.length || 1;
  if (s === 503 || s === 500 || s === 502) {
    return {
      status: 503,
      msg: `השרתים של Google עמוסים כרגע${triedCount > 1 ? ` (נוסו ${triedCount} מודלים)` : ""}. זה קורה במסלול החינמי בשעות עומס - נסי שוב בעוד כמה דקות.`,
    };
  }
  if (s === 0) return { status: 502, msg: "אין חיבור לשירות הבינה. נסי שוב." };
  if (s === 400) return { status: 502, msg: `הבקשה לשירות הבינה נדחתה: ${raw}` };
  return { status: 502, msg: `שגיאה בשירות הבינה (${s ?? "?"}). נסי שוב.` };
}

export const BLOCKED = new Set(["SAFETY", "PROHIBITED_CONTENT", "SPII", "BLOCKLIST", "OTHER", "RECITATION", "LANGUAGE"]);

