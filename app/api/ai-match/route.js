// עוזר ההתאמות - נתיב שרת. נגיש למנהלת המערכת בלבד.
//
// מה הנתיב הזה עושה, ומה הוא לא עושה:
//   * הוא לא קורא ולא כותב למסד הנתונים. את הרשימה האנונימית בונה הדפדפן
//     של המנהלת מתוך מה שכבר טעון אצלה (lib/crm/aiAnonymize.js).
//   * הוא מוודא מול Firebase שהפונה היא המנהלת, ורק אז מעביר לבינה.
//   * מפתח שירות הבינה יושב רק כאן, במשתנה הסביבה ANTHROPIC_API_KEY ב-Vercel,
//     ולעולם אינו מגיע לדפדפן.
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 60;

const OWNER_EMAIL = "reut1803@gmail.com";
// מפתח הווב של פרויקט Firebase. זה מפתח ציבורי (הוא ממילא נמצא בדפדפן),
// ומשמש כאן רק כדי לבקש מ-Firebase לאמת את אסימון הכניסה של הפונה.
const FIREBASE_WEB_API_KEY = "AIzaSyBKVXp-sbfm-ZfSSmSYKiWcepTEsF_UXNY";

const MODEL = "claude-opus-5-5";
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
        additionalProperties: false,
      },
    },
    note: { type: "string" },
  },
  required: ["decisions", "note"],
  additionalProperties: false,
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

// מחלקות השגיאה של ה-SDK, מהספציפית לכללית
function explainApiError(err) {
  if (err instanceof Anthropic.AuthenticationError) return { status: 502, msg: "מפתח שירות הבינה אינו תקין. יש לבדוק את ANTHROPIC_API_KEY ב-Vercel." };
  if (err instanceof Anthropic.PermissionDeniedError) return { status: 502, msg: "למפתח שירות הבינה אין הרשאה לפעולה הזו." };
  if (err instanceof Anthropic.RateLimitError) return { status: 429, msg: "שירות הבינה עמוס כרגע. נסי שוב בעוד דקה." };
  if (err instanceof Anthropic.BadRequestError) return { status: 502, msg: `הבקשה לשירות הבינה נדחתה: ${err.message}` };
  if (err instanceof Anthropic.APIConnectionTimeoutError) return { status: 504, msg: "שירות הבינה לא ענה בזמן. נסי שוב." };
  if (err instanceof Anthropic.APIConnectionError) return { status: 502, msg: "אין חיבור לשירות הבינה. נסי שוב." };
  if (err instanceof Anthropic.APIError) return { status: 502, msg: `שגיאה בשירות הבינה (${err.status ?? "?"}). נסי שוב.` };
  return { status: 500, msg: "שגיאה לא צפויה בעוזר ההתאמות." };
}

// בדיקת בריאות: האם הנתיב חי, והאם הוגדר מפתח - בלי לחשוף אותו.
export async function GET() {
  return Response.json({ ok: true, keyConfigured: !!process.env.ANTHROPIC_API_KEY, model: MODEL });
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

  if (!process.env.ANTHROPIC_API_KEY) {
    return fail(503, "עוד לא הוגדר מפתח לשירות הבינה (ANTHROPIC_API_KEY ב-Vercel).");
  }

  // שתי ההנחיות הקבועות קודמות, והמאגר אחריהן עם נקודת מטמון - כך שיחה
  // חוזרת על אותו מאגר נקראת מהמטמון במקום להיות מחויבת מחדש במלואה.
  const system = [
    { type: "text", text: METHOD },
    { type: "text", text: poolBlock(pool, forbiddenPairs), cache_control: { type: "ephemeral" } },
  ];

  let messages;
  const outputConfig = { effort: "medium" };
  if (mode === "picks") {
    messages = [{ role: "user", content: picksPrompt(body?.focusGender) }];
    outputConfig.format = { type: "json_schema", schema: DECISIONS_SCHEMA };
  } else {
    const history = Array.isArray(body?.messages) ? body.messages.slice(-MAX_CHAT_TURNS) : [];
    messages = history
      .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m?.content === "string" && m.content.trim())
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
    if (messages.length === 0 || messages[0].role !== "user" || messages[messages.length - 1].role !== "user") {
      return fail(400, "השיחה לא תקינה");
    }
  }

  log(`mode=${mode} pool=${pool.length} forbidden=${forbiddenPairs.length} turns=${messages.length}`);

  // ה-SDK מנסה שוב לבד בשגיאות זמניות (429, 5xx, ניתוק) עם השהיה הולכת וגדלה.
  // ניסיון חוזר אחד בלבד, כדי להישאר בתוך מגבלת 60 השניות של השרת.
  const client = new Anthropic({ maxRetries: 1, timeout: 55_000 });

  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 16000,
      // אם מסנן הבטיחות של המודל דוחה בקשה, השרת מריץ אותה על המודל המומלץ במקום
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: outputConfig,
      system,
      messages,
    });
    const message = await stream.finalMessage();
    const u = message.usage || {};
    log(
      `done in ${Date.now() - started}ms stop=${message.stop_reason} in=${u.input_tokens} cache_read=${u.cache_read_input_tokens} out=${u.output_tokens}`
    );

    if (message.stop_reason === "refusal") return fail(502, "שירות הבינה סירב לבקשה הזו.");
    const text = (message.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    if (message.stop_reason === "max_tokens") return fail(502, "התשובה נקטעה באמצע. נסי שוב.");

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
    const { status, msg } = explainApiError(err);
    log(`error after ${Date.now() - started}ms:`, err?.status ?? "", err?.message ?? err);
    return fail(status, msg);
  }
}
