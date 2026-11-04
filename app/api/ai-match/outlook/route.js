// הסוכן המחלץ - נתיב שרת. נגיש למנהלת המערכת בלבד.
//
// מקבל קבוצה קטנה של מועמדים (עד 5), כל אחד עם מפתח אקראי ובלי שום מזהה:
// מגדר, תווית, רמת תורניות, מסלול, עיסוק, "קצת עליי" ו"מורכבויות
// וייחודיות" - אחרי שהדפדפן ניקה מהם שמות משפחה, יישובים, טלפונים ומיילים.
// Gemini ממלא לכל אחד פרופיל השקפה בשדות סגורים (lib/crm/outlook.js), עם
// ציטוט ורמת ודאות לכל שדה.
//
// משימה פשוטה של קריאה והבנה - ולכן עובדת סביר גם כשהמודל המהיר נכנס
// במקום המלא בשעות עומס. הנתיב לא קורא ולא כותב למסד הנתונים.

import { log, verifyOwner, callGemini, explainGeminiError, BLOCKED } from "@/lib/crm/geminiServer";
import { OUTLOOK_FIELDS, FIELD_KEYS, CONFIDENCE, UNKNOWN, fieldsFor } from "@/lib/crm/outlook";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_ITEMS = 5;
const TEXT_MAX = 2000;

function fail(status, message) {
  log(`outlook → ${status}: ${message}`);
  return Response.json({ ok: false, error: message }, { status });
}

// רשת ביטחון: טלפונים (9-13 ספרות) ומיילים לא יוצאים לבינה, גם אם חמקו מהדפדפן
const safetyNet = (t) =>
  String(t || "")
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[מייל]")
    .replace(/\+?\d[\d\s\-–.()]{6,}\d/g, (m) => {
      const n = m.replace(/\D/g, "").length;
      return n >= 9 && n <= 13 ? "[טלפון]" : m;
    })
    .slice(0, TEXT_MAX);

const fieldGuide = FIELD_KEYS.map((k) => {
  const f = OUTLOOK_FIELDS[k];
  const who = f.only === "female" ? " (לבחורה בלבד)" : f.only === "male" ? " (לבחור בלבד)" : "";
  return `- ${k} = ${f.label}${who}: ${f.options.join(" / ")}`;
}).join("\n");

const PROMPT = `את/ה עוזר/ת של שדכנית במגזר הדתי והחרדי-לאומי בישראל.
לפניך כמה מועמדים, כל אחד עם מפתח. קרא/י את כל הטקסט - "קצת עליי" ו"מורכבויות וייחודיות" -
ומלא/י לכל אחד פרופיל השקפה ואורח חיים, בשדות הבאים בלבד:
${fieldGuide}

כללים:
- כל ערך חייב להישען על משהו שכתוב. אם אין בסיס - "${UNKNOWN}". אל תנחש/י.
- התווית ורמת התורניות שהשדכנית בחרה הן רק נקודת פתיחה. אם הטקסט מראה אחרת (למשל "תורני" אבל
  לובשת מכנסיים או חיה בחברה מעורבת) - הטקסט קובע. זה בדיוק מה שחשוב לזהות.
- סימנים טיפוסיים: "עברתי מסע תשובה" - חוזר/ת בתשובה; "סניף מעורב", "חברים וחברות" - חברה מעורבת;
  "מקפיד על קלה כבחמורה", "דוס" - קלה כבחמורה; "חשוב לי שבן הזוג שירת" - שירות חשוב.
- שדה שאינו רלוונטי למגדר (לבחורה בלבד / לבחור בלבד) - "${UNKNOWN}".
- quote: ציטוט קצר (עד 12 מילים) מהטקסט שעליו נשען הערך. אם "${UNKNOWN}" - ריק.
- confidence: ${CONFIDENCE.join(" / ")}. "נמוכה" כשמדובר בהסקה עקיפה.
- key = המפתח של המועמד/ת, בדיוק כפי שהוא.`;

const fieldSchema = (k) => ({
  type: "object",
  properties: {
    value: { type: "string", enum: OUTLOOK_FIELDS[k].options },
    quote: { type: "string" },
    confidence: { type: "string", enum: CONFIDENCE },
  },
  required: ["value", "quote", "confidence"],
});

const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          ...Object.fromEntries(FIELD_KEYS.map((k) => [k, fieldSchema(k)])),
        },
        required: ["key", ...FIELD_KEYS],
      },
    },
  },
  required: ["items"],
};

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
  if (!process.env.GEMINI_API_KEY) return fail(503, "עוד לא הוגדר מפתח לשירות הבינה (GEMINI_API_KEY ב-Vercel).");

  const items = (Array.isArray(body?.items) ? body.items : [])
    .filter((it) => typeof it?.key === "string" && /^k\d{1,2}$/.test(it.key) && (it.gender === "male" || it.gender === "female"))
    .slice(0, MAX_ITEMS)
    .map((it) => ({
      key: it.key,
      gender: it.gender === "male" ? "בחור" : "בחורה",
      tag: safetyNet(it.tag).slice(0, 60),
      religiousLevel: safetyNet(it.religiousLevel).slice(0, 40),
      path: (Array.isArray(it.occupations) ? it.occupations : []).map((o) => safetyNet(o).slice(0, 40)).slice(0, 12),
      occupation: safetyNet(it.currentOccupation).slice(0, 200),
      about: safetyNet(it.bio),
      complexity: safetyNet(it.complexity),
    }));
  if (items.length === 0) return fail(400, "אין מועמדים לחילוץ");
  const genderOf = Object.fromEntries(items.map((it) => [it.key, it.gender === "בחור" ? "male" : "female"]));

  try {
    // חילוץ הוא משימת קריאה פשוטה: המודל הקל קודם, כדי לא לשרוף את המכסה של החזק
    const { data, model, attempts } = await callGemini(
      {
        systemInstruction: { parts: [{ text: PROMPT }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(items) }] }],
        generationConfig: { maxOutputTokens: 8192, responseMimeType: "application/json", responseJsonSchema: SCHEMA },
      },
      started,
      { prefer: "lite" }
    );
    const cand = data?.candidates?.[0];
    const finish = cand?.finishReason;
    if (data?.promptFeedback?.blockReason || BLOCKED.has(finish)) return fail(502, "שירות הבינה סירב לנתח את הקבוצה הזו.");
    if (finish === "MAX_TOKENS") return fail(502, "התשובה נקטעה באמצע. נסי שוב.");
    const text = (cand?.content?.parts || [])
      .filter((p) => typeof p?.text === "string" && !p.thought)
      .map((p) => p.text)
      .join("");
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return fail(502, "התשובה מהבינה לא הגיעה בפורמט הצפוי. נסי שוב.");
    }

    // רק ערכים מהרשימות, ושדה שאינו רלוונטי למגדר - לא ידוע
    const results = {};
    (Array.isArray(parsed?.items) ? parsed.items : []).forEach((r) => {
      const gender = genderOf[r?.key];
      if (!gender || results[r.key]) return;
      const allowed = new Set(fieldsFor(gender));
      const fields = {};
      FIELD_KEYS.forEach((k) => {
        const f = r[k] || {};
        const value = allowed.has(k) && OUTLOOK_FIELDS[k].options.includes(f.value) ? f.value : UNKNOWN;
        fields[k] = {
          value,
          quote: value === UNKNOWN ? "" : String(f.quote || "").slice(0, 160),
          confidence: CONFIDENCE.includes(f.confidence) ? f.confidence : "נמוכה",
        };
      });
      results[r.key] = fields;
    });
    log(`outlook done in ${Date.now() - started}ms model=${model} items=${items.length} results=${Object.keys(results).length}`);
    return Response.json({ ok: true, results, model, attempts });
  } catch (err) {
    const { status, msg } = explainGeminiError(err);
    log(`outlook error after ${Date.now() - started}ms:`, err?.status ?? "", err?.message ?? err);
    return fail(status, msg);
  }
}
