// עוזר ההתאמות - נתיב שרת. נגיש למנהלת המערכת בלבד.
//
// מה הנתיב הזה עושה, ומה הוא לא עושה:
//   * הוא לא קורא ולא כותב למסד הנתונים. את הרשימה האנונימית בונה הדפדפן
//     של המנהלת מתוך מה שכבר טעון אצלה (lib/crm/aiAnonymize.js).
//   * הוא מוודא מול Firebase שהפונה היא המנהלת, ורק אז מעביר לבינה.
//   * מפתח שירות הבינה יושב רק כאן, במשתנה הסביבה GEMINI_API_KEY ב-Vercel,
//     ולעולם אינו מגיע לדפדפן.
//
import { pickModel, rankedModels, tryOrder } from "@/lib/crm/geminiModel";
import { validateDecisions } from "@/lib/crm/aiAnonymize";

// שירות הבינה: Google Gemini API. מבנה הבקשה (contents, systemInstruction,
// generationConfig, responseJsonSchema) נבדק מול ה-SDK הרשמי של Google.

export const runtime = "nodejs";
export const maxDuration = 60;

const OWNER_EMAIL = "reut1803@gmail.com";
// מפתח הווב של פרויקט Firebase. זה מפתח ציבורי (הוא ממילא נמצא בדפדפן),
// ומשמש כאן רק כדי לבקש מ-Firebase לאמת את אסימון הכניסה של הפונה.
const FIREBASE_WEB_API_KEY = "AIzaSyBKVXp-sbfm-ZfSSmSYKiWcepTEsF_UXNY";

// המודל: אם הוגדר GEMINI_MODEL ב-Vercel - משתמשים בדיוק בו. אחרת השרת שואל
// את Google אילו מודלים זמינים במפתח הזה ובוחר מתוכם (lib/crm/geminiModel.js),
// כדי לא להיות תלויים בשם מודל שעלול להיעלם. הבחירה נשמרת לכמה שעות.
const PINNED_MODEL = String(process.env.GEMINI_MODEL || "").trim();
const MODEL_CACHE_MS = 6 * 60 * 60 * 1000;
let chosenModels = null;
let chosenAt = 0;
// כמה מודלים לנסות לכל היותר בבקשה אחת, וכמה זמן לתת לכל ניסיון
const MAX_MODELS_TO_TRY = 3;
const ATTEMPT_TIMEOUT_MS = 30_000;
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
// מגבלת השרת ב-Vercel היא 60 שניות. אם היא נחצית, Vercel קוטע את השרת בלי
// הודעה מסודרת - והדפדפן מנסה שוב ומחכה עוד דקה. לכן כל הבקשה, מתחילתה,
// חייבת להסתיים בתוך 42 שניות, וכל פנייה חיצונית מוגבלת בזמן משלה.
const TIME_BUDGET_MS = 42_000;
const SIDE_CALL_TIMEOUT_MS = 8_000;

// מאגר גדול הוא בקשה ענקית למסלול החינמי: איטית, ועלולה לחרוג ממכסת
// המילים לדקה. לכן כל תיאור נשלח בקיצור עד אורך קבוע. רוב התיאורים קצרים
// מזה ונשלחים במלואם; רק תיאורים ארוכים במיוחד מקוצרים, ומסומנים ככאלה.
const BIO_MAX_CHARS = 600;
const FIELD_MAX_CHARS = 120;

async function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function compactPool(pool) {
  const cut = (v, n) => {
    const t = String(v || "");
    return t.length > n ? `${t.slice(0, n).trim()}… [קוצר]` : t;
  };
  return pool.map((p) => ({ ...p, bio: cut(p?.bio, BIO_MAX_CHARS), currentOccupation: cut(p?.currentOccupation, FIELD_MAX_CHARS) }));
}
const MAX_POOL = 400;
const MAX_CHAT_TURNS = 24;

const log = (...args) => console.log("[ai-match]", ...args);

function fail(status, message) {
  log(`→ ${status}: ${message}`);
  return Response.json({ ok: false, error: message }, { status });
}

// אימות זהות: Firebase בודק את האסימון ומחזיר את המייל המאומת של בעליו.
async function verifyOwner(idToken) {
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

// --- ההנחיות לבינה. קבועות לחלוטין, כדי שהשירות ישמור אותן במטמון. ---
const METHOD = `את/ה שותף/ת חשיבה שקט/ה של שדכנית מנוסה במגזר הדתי והחרדי-לאומי בישראל.
המאגר שתקבל/י אנונימי: כל מועמד/ת מזוהה רק בקוד (M = בחור, F = בחורה) ובשם פרטי.

איך שוקלים התאמה, לפי סדר החשיבות:
1. "אותו ראש דתי" - ליבת ההכרעה. בדוק/י את עבודת ה' (שכל והלכה מול רגש וחסידות),
   את המפגש עם העולם (פתיחות, עבודה, לימודים מול סגירות), ואת חזון הבית ושולחן השבת.
   רמת התורניות והשיוך הם נקודת פתיחה, לא תחליף לקריאת התיאור.
2. השלמה רגשית - איזון של אנרגיות וקצבים, לא שכפול. שאל/י מה כל אחד צריך ומה כל אחד מביא.
3. התאמה מעשית - גיל, גובה, אזור ושלב בחיים, כמסננת שכל הגיונית.

חוקי ברזל:
- כל טענה על אדם חייבת להישען על משהו שכתוב בכרטיס שלו. אם אין מספיק מידע - כתוב/כתבי זאת במפורש.
  אל תמציא/י תכונות, רקע או משפחה.
- לעולם אל תציע/י זוג שמופיע ברשימת "זוגות שכבר ירדו מהפרק".
- השתמש/י רק בקודים שמופיעים במאגר. בחור מול בחורה בלבד.
- התייחס/י לאנשים בכבוד, בשפה עדינה. זה כלי עזר לשדכנית - ההחלטה שלה.
- כתוב/כתבי בעברית.`;

function poolBlock(pool, forbiddenPairs) {
  return [
    "מאגר המועמדים הפנויים (אנונימי):",
    JSON.stringify(pool),
    "",
    "זוגות שכבר ירדו מהפרק - אסור להציע אותם שוב:",
    forbiddenPairs.length ? forbiddenPairs.map(([a, b]) => `${a}+${b}`).join(", ") : "(אין)",
  ].join("\n");
}

const DECISIONS_SCHEMA = {
  type: "object",
  properties: {
    decisions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          candidate: { type: "string" },
          optionA: { type: "string" },
          optionB: { type: "string" },
          winner: { type: "string" },
          religiousFit: { type: "string" },
          emotionalFit: { type: "string" },
          whyNotOther: { type: "string" },
          blindSpot: { type: "string" },
          questionToCheck: { type: "string" },
          evidence: { type: "string" },
        },
        required: [
          "candidate", "optionA", "optionB", "winner", "religiousFit",
          "emotionalFit", "whyNotOther", "blindSpot", "questionToCheck", "evidence",
        ],
      },
    },
    note: { type: "string" },
  },
  required: ["decisions", "note"],
};

function picksPrompt(focusGender) {
  const who = focusGender === "female" ? "בחורות (קוד F)" : "בחורים (קוד M)";
  return `הפק/י את 6 ההכרעות החזקות ביותר שאפשר למצוא היום במאגר, מהחזקה לחלשה. המועמדים שבמוקד: ${who}.
לכל הכרעה: בחר/י מועמד/ת אחד/ת מהמוקד (כל מועמד/ת פעם אחת לכל היותר), ומצא/י את שתי האפשרויות הבולטות ביותר מהצד השני (optionA, optionB).
עמת/י ביניהן ראש בראש והכרע/י מי מנצחת (winner = הקוד שלה).
- religiousFit: למה זה "אותו ראש דתי" (עבודת ה', מפגש עם העולם, חזון הבית).
- emotionalFit: איך האנרגיות והקצבים משלימים.
- whyNotOther: משפט אחד - למה האפשרות השנייה הפסידה.
- blindSpot: נקודה עיוורת אחת שהשדכנית צריכה לבדוק מראש.
- questionToCheck: שאלה אחת לבירור.
- evidence: ציטוט קצר מהכרטיסים שעליו נשענת ההכרעה.
המאגר גדול, ולכן תמיד יש הכרעות להציג: אל תחזיר/י רשימה ריקה רק כי אין התאמה מושלמת.
בחר/י את הטובות ביותר שיש. אם המידע בכרטיסים חלקי - אמור/אמרי זאת ב-blindSpot, ואל תמציא/י.
רשימה ריקה מותרת רק אם אין במאגר אף מועמד/ת מאחד הצדדים.
ב-note: משפט אחד על מצב המאגר (למשל אם חסר מידע בתיאורים).`;
}

// --- הפנייה ל-Gemini ---

class GeminiError extends Error {
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
async function callGemini(payload, started) {
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

function explainGeminiError(err) {
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

const BLOCKED = new Set(["SAFETY", "PROHIBITED_CONTENT", "SPII", "BLOCKLIST", "OTHER", "RECITATION", "LANGUAGE"]);

// בדיקת בריאות: האם הנתיב חי, האם הוגדר מפתח, ואיזה מודל ייבחר בפועל
// מתוך מה שזמין בחשבון - בלי לחשוף את המפתח עצמו.
export async function GET() {
  const keyConfigured = !!process.env.GEMINI_API_KEY;
  const result = {
    ok: true,
    keyConfigured,
    pinnedModel: PINNED_MODEL || null,
    selectedModel: null,
    modelAvailable: null,
    textModels: [],
  };
  if (!keyConfigured) return Response.json(result);
  try {
    const models = await listModels();
    const ranked = rankedModels(models);
    result.textModels = ranked;
    if (PINNED_MODEL) {
      const all = models.map((m) => String(m?.name || "").replace(/^models\//, ""));
      result.selectedModel = PINNED_MODEL;
      result.modelAvailable = all.includes(PINNED_MODEL);
    } else {
      result.selectedModel = pickModel(models);
      result.modelAvailable = !!result.selectedModel;
      result.fallbackOrder = tryOrder(ranked, MAX_MODELS_TO_TRY);
    }
  } catch (err) {
    result.ok = false;
    result.error = err?.message || "network";
  }
  return Response.json(result);
}

export async function POST(request) {
  const started = Date.now();
  let body;
  try {
    body = await request.json();
  } catch {
    return fail(400, "בקשה לא תקינה");
  }

  const auth = await verifyOwner(body?.idToken);
  if (!auth.ok) return fail(auth.reason === "אימות הזהות נכשל" ? 502 : 403, auth.reason);

  const mode = body?.mode;
  const pool = Array.isArray(body?.pool) ? body.pool : null;
  const forbiddenPairs = (Array.isArray(body?.forbiddenPairs) ? body.forbiddenPairs : []).filter(
    (p) => Array.isArray(p) && typeof p[0] === "string" && typeof p[1] === "string"
  );
  if (mode !== "picks" && mode !== "chat") return fail(400, "מצב לא מוכר");
  if (!pool || pool.length === 0) return fail(400, "אין מועמדים פנויים במאגר");
  if (pool.length > MAX_POOL) return fail(400, "המאגר גדול מהצפוי");

  if (!process.env.GEMINI_API_KEY) {
    return fail(503, "עוד לא הוגדר מפתח לשירות הבינה (GEMINI_API_KEY ב-Vercel).");
  }

  // ההנחיות הקבועות קודמות והמאגר אחריהן, באותו סדר בכל בקשה - כך ש-Gemini
  // יכול לזהות את החלק החוזר ולשמור אותו במטמון בעצמו.
  const promptPool = compactPool(pool);
  const systemInstruction = { parts: [{ text: `${METHOD}\n\n${poolBlock(promptPool, forbiddenPairs)}` }] };
  const trimmed = promptPool.filter((p, i) => p.bio !== String(pool[i]?.bio || "")).length;

  let contents;
  const generationConfig = { maxOutputTokens: 16384 };
  if (mode === "picks") {
    contents = [{ role: "user", parts: [{ text: picksPrompt(body?.focusGender) }] }];
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseJsonSchema = DECISIONS_SCHEMA;
  } else {
    const history = Array.isArray(body?.messages) ? body.messages.slice(-MAX_CHAT_TURNS) : [];
    const turns = history
      .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string" && m.content.trim())
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
    if (turns.length === 0 || turns[0].role !== "user" || turns[turns.length - 1].role !== "user") {
      return fail(400, "השיחה לא תקינה");
    }
    // ב-Gemini תפקיד העוזר נקרא "model"
    contents = turns.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  }

  log(
    `mode=${mode} pool=${pool.length} trimmedBios=${trimmed} chars=${systemInstruction.parts[0].text.length} forbidden=${forbiddenPairs.length} turns=${contents.length}`
  );

  try {
    const { data, model } = await callGemini({ systemInstruction, contents, generationConfig }, started);
    const u = data?.usageMetadata || {};
    const cand = data?.candidates?.[0];
    const finish = cand?.finishReason || "";
    log(
      `done in ${Date.now() - started}ms model=${model} finish=${finish} in=${u.promptTokenCount} cached=${u.cachedContentTokenCount ?? 0} out=${u.candidatesTokenCount} thoughts=${u.thoughtsTokenCount ?? 0}`
    );

    if (data?.promptFeedback?.blockReason) return fail(502, "שירות הבינה סירב לבקשה הזו.");
    if (BLOCKED.has(finish)) return fail(502, "שירות הבינה עצר את התשובה (מסנן התוכן שלו).");
    if (finish === "MAX_TOKENS") return fail(502, "התשובה נקטעה באמצע. נסי שוב.");

    // חלקי "מחשבה" של המודל אינם חלק מהתשובה
    const text = (cand?.content?.parts || [])
      .filter((part) => typeof part?.text === "string" && !part.thought)
      .map((part) => part.text)
      .join("");
    if (!text.trim()) return fail(502, "התקבלה תשובה ריקה משירות הבינה. נסי שוב.");

    if (mode === "picks") {
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        return fail(502, "התשובה מהבינה לא הגיעה בפורמט הצפוי.");
      }
      // אותה בדיקה שהדפדפן עושה, כבר כאן: מבקשים 6 ומחזירים את 3 התקינות
      // הראשונות - כך שהכרעה שנפסלה (קוד שגוי, זוג שירד מהפרק) מתחלפת בבאה
      const raw = Array.isArray(parsed.decisions) ? parsed.decisions : [];
      const decisions = validateDecisions(raw, { pool, forbiddenPairs });
      log(`picks: model returned ${raw.length}, valid ${decisions.length}`);
      return Response.json({ ok: true, decisions, note: parsed.note || "" });
    }
    return Response.json({ ok: true, reply: text });
  } catch (err) {
    const { status, msg } = explainGeminiError(err);
    log(`error after ${Date.now() - started}ms:`, err?.status ?? "", err?.message ?? err);
    return fail(status, msg);
  }
}
