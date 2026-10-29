// ניתוח מהיר מקבוצת וואטסאפ - נתיב שרת. נגיש למנהלת המערכת בלבד.
//
// אין כאן שום חיבור לוואטסאפ: המנהלת מייצאת את הצ'אט בעצמה (ייצוא רשמי של
// וואטסאפ) ומעלה או מדביקה אותו. לכן אין בוט, אין האזנה ברקע, ואין סיכון
// לחסימת המספר.
//
// מה הנתיב מקבל:
//   * הצ'אט, אחרי שהדפדפן כבר החליף טלפונים, מיילים ושמות שולחים בתגים
//     (lib/crm/whatsappChat.js). המיפוי חזרה נשאר בדפדפן.
//   * המאגר האנונימי, אותו מאגר שעוזר ההתאמות שולח (lib/crm/aiAnonymize.js)
// מה הוא לא עושה: לא קורא ולא כותב למסד הנתונים, ולא שומר שום דבר.
// התוצאה מוצגת למנהלת בלבד; שמירה למאגר נעשית רק ידנית, בטופס ההוספה הרגיל.

import {
  log,
  verifyOwner,
  callGemini,
  explainGeminiError,
  BLOCKED,
} from "@/lib/crm/geminiServer";
import { scrubText } from "@/lib/crm/aiAnonymize";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_CHAT_CHARS = 45_000;
const MAX_POOL = 400;
const MAX_PROFILES = 20;
const MAX_MATCHES = 12;
const BIO_MAX_CHARS = 400;
const TOKEN_RE = /\[(?:טלפון|מייל|שולח) \d+\]/g;

function fail(status, message) {
  log(`→ ${status}: ${message}`);
  return Response.json({ ok: false, error: message }, { status });
}

const METHOD = `את/ה עוזר/ת של שדכנית מנוסה במגזר הדתי והחרדי-לאומי בישראל.
תקבל/י שני דברים:
1. הודעות מקבוצת וואטסאפ של שדכנים. פרטי הקשר ושמות השולחים הוחלפו בתגים בסוגריים מרובעים,
   כמו [טלפון 3], [מייל 1], [שולח 2]. אלה אינם שמות - אל תנחש/י מי עומד מאחוריהם.
2. מאגר פנימי אנונימי של מועמדים פנויים (M = בחור, F = בחורה), עם שם פרטי בלבד.

המשימה:
א. לסרוק את ההודעות ולחלץ רק הודעות שמציגות מועמד/ת אחד/ת ספציפי/ת לשידוך
   (גיל, מגזר, תיאור, דרישות). להתעלם מצ'אט כללי, ברכות, פרסומות, שאלות, ובקשות בלי מועמד/ת.
   הודעה שמציגה כמה מועמדים - כל אחד/ת כרטיס נפרד.
ב. להצליב כל כרטיס חיצוני מול המאגר הפנימי - רק מול המין השני.
ג. להציע את "ההתאמות המובילות מהוואטסאפ": רק חיבורים שיש להם בסיס אמיתי בכתוב.

חוקי ברזל:
- כל פרט בכרטיס חיצוני חייב להופיע בהודעה עצמה. אם גיל או מגזר לא כתובים - השאר/י ריק. אל תמציא/י.
- contact: העתק/י רק תגים שמופיעים בהודעה או בשולח שלה, בדיוק כפי שהם (למשל "[טלפון 3]"). אם אין - ריק.
- התאמה נשענת על "אותו ראש דתי" קודם כל, אחר כך השלמה רגשית, ואז גיל, אזור ושלב בחיים.
- השתמש/י רק בקודים שמופיעים במאגר. בחור מול בחורה בלבד.
- כתוב/כתבי בעברית, בשפה עדינה ומכבדת.`;

const SCHEMA = {
  type: "object",
  properties: {
    profiles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          ref: { type: "string" },
          gender: { type: "string", enum: ["בחור", "בחורה"] },
          age: { type: "string" },
          sector: { type: "string" },
          location: { type: "string" },
          summary: { type: "string" },
          requirements: { type: "string" },
          contact: { type: "string" },
          source: { type: "string" },
          quote: { type: "string" },
        },
        required: ["ref", "gender", "age", "sector", "location", "summary", "requirements", "contact", "source", "quote"],
      },
    },
    matches: {
      type: "array",
      items: {
        type: "object",
        properties: {
          profile: { type: "string" },
          candidate: { type: "string" },
          reasoning: { type: "string" },
          blindSpot: { type: "string" },
        },
        required: ["profile", "candidate", "reasoning", "blindSpot"],
      },
    },
    note: { type: "string" },
  },
  required: ["profiles", "matches", "note"],
};

const TASK = `חלץ/י את הכרטיסים החיצוניים מההודעות (עד ${MAX_PROFILES}), ותן/י לכל אחד ref בצורה W1, W2, W3...
- gender: "בחור" או "בחורה"
- age, sector (מגזר/שיוך), location (אזור/יישוב כפי שנכתב) - רק אם כתוב
- summary: משפט או שניים - מי זה/זו
- requirements: מה מחפשים, כפי שנכתב
- contact: תגי פרטי הקשר
- source: תג השולח של ההודעה (למשל "[שולח 2]")
- quote: ציטוט קצר מההודעה
אחר כך matches: עד ${MAX_MATCHES} ההתאמות המובילות בין כרטיס חיצוני (profile = ה-ref) למועמד/ת מהמאגר (candidate = הקוד),
מהחזקה לחלשה, לכל כרטיס לכל היותר 2. לכל התאמה:
- reasoning: נימוק שדכני קצר - למה החיבור הזה (2-3 משפטים)
- blindSpot: מה חשוב לברר לפני שמציעים
אם אין בהודעות אף כרטיס - החזר/י רשימות ריקות, וב-note הסבר/י במשפט.
ב-note: משפט אחד על מה שנמצא.`;

// רק רצפים של 9-13 ספרות (טלפון) ומיילים - כדי לא לפגוע בגילאים, גבהים ותאריכים
function safetyNet(text) {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[מייל]")
    .replace(/\+?\d[\d\s\-–.()]{6,}\d/g, (m) => {
      const n = m.replace(/\D/g, "").length;
      return n >= 9 && n <= 13 ? "[טלפון]" : m;
    });
}

function cleanFeedback(raw) {
  try {
    return (Array.isArray(raw) ? raw : [])
      .slice(-25)
      .filter((n) => typeof n?.text === "string")
      .map((n) => scrubText(n.text.slice(0, 500)))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function systemText(pool, feedback) {
  const compact = pool.map((p) => {
    const bio = String(p?.bio || "");
    return { ...p, bio: bio.length > BIO_MAX_CHARS ? `${bio.slice(0, BIO_MAX_CHARS).trim()}… [קוצר]` : bio };
  });
  const parts = [METHOD, "", "המאגר הפנימי (אנונימי):", JSON.stringify(compact)];
  if (feedback.length) {
    parts.push(
      "",
      "זיכרון ותובנות קודמות של השדכנית:",
      "התייחס לתובנות אלו כשיקולי סינון מנחים בעת בחירת ההתאמות, כדי לא להציע שוב שילובים שאינם מתאימים לפי ניסיון העבר.",
      ...feedback.map((t) => `- ${t}`)
    );
  }
  return parts.join("\n");
}

// בדיקה שאינה סומכת על הבינה: כרטיס בלי ref תקין או מין ברור נזרק; תג קשר
// שלא מופיע בצ'אט נמחק; התאמה לכרטיס לא קיים, לקוד לא קיים, או בין שני
// אנשים מאותו מין - נזרקת.
function validate(parsed, pool, chat) {
  const chatTokens = new Set(chat.match(TOKEN_RE) || []);
  const keepTokens = (s) => (String(s || "").match(TOKEN_RE) || []).filter((t) => chatTokens.has(t));
  const seen = new Set();
  const profiles = [];
  (Array.isArray(parsed?.profiles) ? parsed.profiles : []).forEach((p) => {
    if (profiles.length >= MAX_PROFILES) return;
    const ref = String(p?.ref || "").trim();
    if (!/^W\d{1,3}$/.test(ref) || seen.has(ref)) return;
    if (p.gender !== "בחור" && p.gender !== "בחורה") return;
    if (!String(p.summary || "").trim()) return;
    seen.add(ref);
    profiles.push({
      ref,
      gender: p.gender,
      age: String(p.age || "").slice(0, 20),
      sector: String(p.sector || "").slice(0, 80),
      location: String(p.location || "").slice(0, 80),
      summary: String(p.summary || "").slice(0, 600),
      requirements: String(p.requirements || "").slice(0, 400),
      contact: [...new Set(keepTokens(p.contact))],
      source: keepTokens(p.source)[0] || "",
      quote: String(p.quote || "").slice(0, 400),
    });
  });

  const byRef = new Map(profiles.map((p) => [p.ref, p]));
  const byCode = new Map(pool.map((c) => [c?.code, c]));
  const perProfile = {};
  const pairs = new Set();
  const matches = [];
  (Array.isArray(parsed?.matches) ? parsed.matches : []).forEach((m) => {
    if (matches.length >= MAX_MATCHES) return;
    const p = byRef.get(m?.profile);
    const c = byCode.get(m?.candidate);
    if (!p || !c) return;
    if (c.gender === p.gender) return;
    const key = `${p.ref}|${c.code}`;
    if (pairs.has(key) || (perProfile[p.ref] || 0) >= 2) return;
    pairs.add(key);
    perProfile[p.ref] = (perProfile[p.ref] || 0) + 1;
    matches.push({
      profile: p.ref,
      candidate: c.code,
      reasoning: String(m.reasoning || "").slice(0, 800),
      blindSpot: String(m.blindSpot || "").slice(0, 400),
    });
  });
  return { profiles, matches };
}

export async function GET() {
  return Response.json({ ok: true, keyConfigured: !!process.env.GEMINI_API_KEY });
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

  const chat = typeof body?.chat === "string" ? body.chat.trim() : "";
  const pool = Array.isArray(body?.pool) ? body.pool : null;
  if (!chat) return fail(400, "לא התקבל טקסט מהצ'אט");
  if (chat.length > MAX_CHAT_CHARS) return fail(400, "הצ'אט ארוך מדי לניתוח אחד");
  if (!pool || pool.length === 0) return fail(400, "אין מועמדים פנויים במאגר");
  if (pool.length > MAX_POOL) return fail(400, "המאגר גדול מהצפוי");
  if (!process.env.GEMINI_API_KEY) {
    return fail(503, "עוד לא הוגדר מפתח לשירות הבינה (GEMINI_API_KEY ב-Vercel).");
  }

  // רשת ביטחון: גם אם משהו חמק מהדפדפן - טלפונים ומיילים לא יוצאים לבינה
  const safeChat = safetyNet(chat);
  const feedback = cleanFeedback(body?.feedback);
  const system = systemText(pool, feedback);
  log(`chat=${safeChat.length} pool=${pool.length} feedback=${feedback.length} chars=${system.length}`);

  try {
    const { data, model } = await callGemini(
      {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: `${TASK}\n\nההודעות:\n${safeChat}` }] }],
        generationConfig: { maxOutputTokens: 16384, responseMimeType: "application/json", responseJsonSchema: SCHEMA },
      },
      started
    );
    const cand = data?.candidates?.[0];
    const finish = cand?.finishReason;
    log(`done in ${Date.now() - started}ms model=${model} finish=${finish}`);
    if (data?.promptFeedback?.blockReason) return fail(502, "שירות הבינה סירב לבקשה הזו.");
    if (BLOCKED.has(finish)) return fail(502, "שירות הבינה עצר את התשובה (מסנן התוכן שלו).");
    if (finish === "MAX_TOKENS") return fail(502, "התשובה נקטעה באמצע. נסי עם פחות הודעות.");
    const text = (cand?.content?.parts || [])
      .filter((part) => typeof part?.text === "string" && !part.thought)
      .map((part) => part.text)
      .join("");
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return fail(502, "התשובה מהבינה לא הגיעה בפורמט הצפוי. נסי שוב.");
    }
    const { profiles, matches } = validate(parsed, pool, safeChat);
    log(`profiles ${parsed?.profiles?.length ?? 0}→${profiles.length}, matches ${parsed?.matches?.length ?? 0}→${matches.length}`);
    return Response.json({ ok: true, profiles, matches, note: String(parsed?.note || "").slice(0, 400) });
  } catch (err) {
    const { status, msg } = explainGeminiError(err);
    log(`error after ${Date.now() - started}ms:`, err?.status ?? "", err?.message ?? err);
    return fail(status, msg);
  }
}
