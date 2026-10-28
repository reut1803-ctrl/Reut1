// עוזר ההתאמות - נתיב שרת. נגיש למנהלת המערכת בלבד.
//
// מה הנתיב הזה עושה, ומה הוא לא עושה:
//   * הוא לא קורא ולא כותב למסד הנתונים. את הרשימה האנונימית בונה הדפדפן
//     של המנהלת מתוך מה שכבר טעון אצלה (lib/crm/aiAnonymize.js).
//   * הוא מוודא מול Firebase שהפונה היא המנהלת, ורק אז מעביר לבינה.
//   * מפתח שירות הבינה יושב רק כאן, במשתנה הסביבה GEMINI_API_KEY ב-Vercel,
//     ולעולם אינו מגיע לדפדפן.
//
// שירות הבינה: Google Gemini API. מבנה הבקשה (contents, systemInstruction,
// generationConfig, responseJsonSchema) נבדק מול ה-SDK הרשמי של Google.

export const runtime = "nodejs";
export const maxDuration = 60;

const OWNER_EMAIL = "reut1803@gmail.com";
// מפתח הווב של פרויקט Firebase. זה מפתח ציבורי (הוא ממילא נמצא בדפדפן),
// ומשמש כאן רק כדי לבקש מ-Firebase לאמת את אסימון הכניסה של הפונה.
const FIREBASE_WEB_API_KEY = "AIzaSyBKVXp-sbfm-ZfSSmSYKiWcepTEsF_UXNY";

// אפשר להחליף מודל בלי לגעת בקוד: משתנה הסביבה GEMINI_MODEL ב-Vercel.
// בדיקת הבריאות (GET על הנתיב) מראה אם המודל קיים בפועל בחשבון.
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
// מגבלת השרת היא 60 שניות. משאירים מרווח לאימות הזהות ולתשובה.
const TIME_BUDGET_MS = 52_000;
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
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) }
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
  return `הפק/י עד 3 "הכרעות שיא" להיום. המועמדים שבמוקד: ${who}.
לכל הכרעה: בחר/י מועמד/ת אחד/ת מהמוקד, ומצא/י את שתי האפשרויות הבולטות ביותר מהצד השני (optionA, optionB).
עמת/י ביניהן ראש בראש והכרע/י מי מנצחת (winner = הקוד שלה).
- religiousFit: למה זה "אותו ראש דתי" (עבודת ה', מפגש עם העולם, חזון הבית).
- emotionalFit: איך האנרגיות והקצבים משלימים.
- whyNotOther: משפט אחד - למה האפשרות השנייה הפסידה.
- blindSpot: נקודה עיוורת אחת שהשדכנית צריכה לבדוק מראש.
- questionToCheck: שאלה אחת לבירור.
- evidence: ציטוט קצר מהכרטיסים שעליו נשענת ההכרעה.
הצג/י רק הכרעות שעומדות ברף "וואו". אם יש פחות משלוש כאלה - החזר/י פחות, ואף אחת אם אין.
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

async function callGeminiOnce(payload, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${GEMINI_BASE}/models/${encodeURIComponent(MODEL)}:generateContent`, {
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

// ניסיון חוזר עם השהיה הולכת וגדלה (1, 2, 4 שניות) בשגיאות זמניות בלבד:
// עומס (429), תקלה בצד השרת (500/503), זמן קצוב או ניתוק. אם השירות מבקש
// לחכות יותר ממה שנשאר בתקציב הזמן - עוצרים מיד ומסבירים, במקום להיתקע.
async function callGemini(payload, started) {
  const RETRYABLE = new Set([0, 429, 500, 502, 503, 504]);
  let delay = 1000;
  for (let attempt = 1; ; attempt += 1) {
    const left = TIME_BUDGET_MS - (Date.now() - started);
    try {
      return await callGeminiOnce(payload, Math.max(5000, left));
    } catch (err) {
      const wait = Math.max(delay, err.retryAfterMs || 0);
      const leftAfter = TIME_BUDGET_MS - (Date.now() - started);
      log(`attempt ${attempt} failed: ${err.status} ${err.message}`);
      if (!RETRYABLE.has(err.status) || attempt >= 3 || wait + 8000 > leftAfter) throw err;
      await new Promise((r) => setTimeout(r, wait));
      delay *= 2;
    }
  }
}

function explainGeminiError(err) {
  const s = err?.status;
  const raw = String(err?.message || "");
  if (s === 400 && /api key/i.test(raw)) return { status: 502, msg: "מפתח Gemini אינו תקין. יש לבדוק את GEMINI_API_KEY ב-Vercel." };
  if (s === 403) return { status: 502, msg: "למפתח Gemini אין הרשאה לשירות הזה. ייתכן שה-API לא הופעל בפרויקט." };
  if (s === 404) return { status: 502, msg: `המודל ${MODEL} לא זמין בחשבון. פתחי את בדיקת הבריאות של הנתיב כדי לראות אילו מודלים זמינים.` };
  if (s === 429) {
    const sec = err.retryAfterMs ? ` נסי שוב בעוד כ-${Math.ceil(err.retryAfterMs / 1000)} שניות.` : " נסי שוב בעוד דקה.";
    return { status: 429, msg: `הגעת למגבלת השימוש של המסלול החינמי.${sec}` };
  }
  if (s === 504) return { status: 504, msg: "שירות הבינה לא ענה בזמן. נסי שוב." };
  if (s === 0) return { status: 502, msg: "אין חיבור לשירות הבינה. נסי שוב." };
  if (s === 400) return { status: 502, msg: `הבקשה לשירות הבינה נדחתה: ${raw}` };
  return { status: 502, msg: `שגיאה בשירות הבינה (${s ?? "?"}). נסי שוב.` };
}

const BLOCKED = new Set(["SAFETY", "PROHIBITED_CONTENT", "SPII", "BLOCKLIST", "OTHER", "RECITATION", "LANGUAGE"]);

// בדיקת בריאות: האם הנתיב חי, האם הוגדר מפתח, והאם המודל שנבחר קיים
// בחשבון בפועל - בלי לחשוף את המפתח עצמו.
export async function GET() {
  const keyConfigured = !!process.env.GEMINI_API_KEY;
  const result = { ok: true, keyConfigured, model: MODEL, modelAvailable: null, availableModels: [] };
  if (!keyConfigured) return Response.json(result);
  try {
    const res = await fetch(`${GEMINI_BASE}/models?pageSize=200`, {
      headers: { "x-goog-api-key": process.env.GEMINI_API_KEY },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      result.ok = false;
      result.error = data?.error?.message || `HTTP ${res.status}`;
      return Response.json(result);
    }
    const names = (data?.models || [])
      .filter((m) => (m.supportedGenerationMethods || m.supportedActions || []).includes("generateContent"))
      .map((m) => String(m.name || "").replace(/^models\//, ""));
    result.availableModels = names;
    result.modelAvailable = names.includes(MODEL);
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
  const forbiddenPairs = Array.isArray(body?.forbiddenPairs) ? body.forbiddenPairs : [];
  if (mode !== "picks" && mode !== "chat") return fail(400, "מצב לא מוכר");
  if (!pool || pool.length === 0) return fail(400, "אין מועמדים פנויים במאגר");
  if (pool.length > MAX_POOL) return fail(400, "המאגר גדול מהצפוי");

  if (!process.env.GEMINI_API_KEY) {
    return fail(503, "עוד לא הוגדר מפתח לשירות הבינה (GEMINI_API_KEY ב-Vercel).");
  }

  // ההנחיות הקבועות קודמות והמאגר אחריהן, באותו סדר בכל בקשה - כך ש-Gemini
  // יכול לזהות את החלק החוזר ולשמור אותו במטמון בעצמו.
  const systemInstruction = { parts: [{ text: `${METHOD}\n\n${poolBlock(pool, forbiddenPairs)}` }] };

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

  log(`mode=${mode} model=${MODEL} pool=${pool.length} forbidden=${forbiddenPairs.length} turns=${contents.length}`);

  try {
    const data = await callGemini({ systemInstruction, contents, generationConfig }, started);
    const u = data?.usageMetadata || {};
    const cand = data?.candidates?.[0];
    const finish = cand?.finishReason || "";
    log(
      `done in ${Date.now() - started}ms finish=${finish} in=${u.promptTokenCount} cached=${u.cachedContentTokenCount ?? 0} out=${u.candidatesTokenCount} thoughts=${u.thoughtsTokenCount ?? 0}`
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
      return Response.json({ ok: true, decisions: parsed.decisions || [], note: parsed.note || "" });
    }
    return Response.json({ ok: true, reply: text });
  } catch (err) {
    const { status, msg } = explainGeminiError(err);
    log(`error after ${Date.now() - started}ms:`, err?.status ?? "", err?.message ?? err);
    return fail(status, msg);
  }
}
