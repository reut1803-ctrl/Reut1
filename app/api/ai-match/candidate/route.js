// "מצא/י התאמה" למועמד/ת אחד/ת - נתיב שרת. נגיש למנהלת המערכת בלבד.
//
// הדפדפן כבר עשה את הסינון הראשון בקוד (lib/crm/aiShortlist.js) ושולח לכאן
// רק את המועמד/ת שבמוקד ועד 12 אפשרויות רלוונטיות, ברשימה האנונימית. כך
// הבינה מקבלת משימה קטנה וממוקדת, וחושבת על כל אפשרות לעומק - במקום לרפרף
// על כל המאגר.
//
// לא קורא ולא כותב למסד הנתונים, ולא שומר דבר.

import { log, verifyOwner, callGemini, explainGeminiError, BLOCKED } from "@/lib/crm/geminiServer";
import { scrubText } from "@/lib/crm/aiAnonymize";
import { internalPairProblem, blindSpotAdmitsGap } from "@/lib/crm/dealBreakers";
import { GATE_AND_AXES, CORE_VALUES, MEMORY_HEADER, NO_MATCH_TEXT } from "@/lib/crm/aiMatchMethod";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_OPTIONS = 15;
const MAX_RECOMMENDATIONS = 3;
const BIO_MAX_CHARS = 1200;

function fail(status, message) {
  log(`candidate → ${status}: ${message}`);
  return Response.json({ ok: false, error: message }, { status });
}

const METHOD = `את/ה שותף/ת חשיבה של שדכנית מנוסה במגזר הדתי והחרדי-לאומי בישראל.
תקבל/י מועמד/ת אחד/ת שבמוקד, ורשימה קצרה של אפשרויות מהצד השני, שכבר עברו סינון בסיסי בקוד
(מגדר, גיל, גובה, מגזר, ולא זוג שכבר ירד מהפרק). המידע אנונימי: קוד ושם פרטי בלבד.
המשימה: לבחון כל אפשרות לעומק, אחת-אחת, ולהמליץ רק על מי שמתאים/ה באמת.

${CORE_VALUES}

${GATE_AND_AXES}

חוקי ברזל:
- כל טענה חייבת להישען על מה שכתוב בכרטיסים. אם אין מספיק מידע - כתוב/כתבי זאת, ואל תמציא/י.
- השתמש/י רק בקודים שברשימה.
- עדיף "${NO_MATCH_TEXT}" מאשר המלצת סרק. אל תמליץ/י על מישהו רק כדי שתהיה המלצה.
- כתוב/כתבי בעברית, בשפה עדינה ומכבדת. ההחלטה של השדכנית.`;

const SCHEMA = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          candidate: { type: "string" },
          fitScore: { type: "integer" },
          lifestyle: { type: "string" },
          coreValues: { type: "string" },
          energy: { type: "string" },
          communication: { type: "string" },
          blindSpot: { type: "string" },
          question: { type: "string" },
          evidence: { type: "string" },
        },
        required: ["candidate", "fitScore", "lifestyle", "coreValues", "energy", "communication", "blindSpot", "question", "evidence"],
      },
    },
    rejected: {
      type: "array",
      items: {
        type: "object",
        properties: { candidate: { type: "string" }, reason: { type: "string" } },
        required: ["candidate", "reason"],
      },
    },
    note: { type: "string" },
  },
  required: ["recommendations", "rejected", "note"],
};

const TASK = `בחן/י כל אפשרות ברשימה מול המועמד/ת שבמוקד, לפי הסדר: אורח חיים וערכי ליבה, שער הסינון, ורק אז שלושת הצירים.
- recommendations: עד ${MAX_RECOMMENDATIONS} ההתאמות הטובות באמת, מהחזקה לחלשה. לכל אחת:
  fitScore (0-10, ורק 7 ומעלה נכנס), lifestyle (אורח חיים בפועל), coreValues (ערכי ליבה ושירות),
  energy (עוגן מול תנועה), communication (מה כל צד מבקש ומה השני מביא), blindSpot, question (שאלה לבירור),
  evidence (ציטוט קצר מהכרטיסים).
- rejected: כל אפשרות אחרת ברשימה, עם סיבה קצרה וממוקדת (משפט אחד) - למה לא.
- אם אף אחד/ת לא מתאים/ה באמת: recommendations ריק, וב-note: "${NO_MATCH_TEXT}".
- note: משפט אחד על התמונה הכללית (למשל אם חסר מידע בתיאור של מי שבמוקד).`;

const compact = (p) => {
  const bio = String(p?.bio || "");
  return { ...p, bio: bio.length > BIO_MAX_CHARS ? `${bio.slice(0, BIO_MAX_CHARS).trim()}… [קוצר]` : bio };
};

function cleanFeedback(raw) {
  try {
    return (Array.isArray(raw) ? raw : [])
      .slice(-25)
      .filter((n) => typeof n?.text === "string")
      .map((n) => ({
        text: scrubText(n.text.slice(0, 500)),
        context: typeof n.context === "string" ? scrubText(n.context.slice(0, 200)) : "",
      }))
      .filter((n) => n.text);
  } catch {
    return [];
  }
}

const isEntry = (p) => p && typeof p.code === "string" && /^[MF]\d{1,3}$/.test(p.code) && (p.gender === "בחור" || p.gender === "בחורה");

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

  const focus = isEntry(body?.focus) ? body.focus : null;
  const options = (Array.isArray(body?.options) ? body.options : [])
    .filter(isEntry)
    .filter((p) => focus && p.gender !== focus.gender)
    .slice(0, MAX_OPTIONS);
  if (!focus) return fail(400, "לא התקבל/ה מועמד/ת");
  if (options.length === 0) return Response.json({ ok: true, recommendations: [], rejected: [], note: NO_MATCH_TEXT });

  const feedback = cleanFeedback(body?.feedback);
  const parts = [
    METHOD,
    "",
    "המועמד/ת שבמוקד:",
    JSON.stringify(compact(focus)),
    "",
    "האפשרויות (אחרי סינון בסיסי בקוד):",
    JSON.stringify(options.map(compact)),
  ];
  if (feedback.length) {
    parts.push("", ...MEMORY_HEADER, ...feedback.map((n) => `- ${n.context ? `${n.context}: ` : ""}${n.text}`));
  }
  const system = parts.join("\n");
  log(`candidate focus=${focus.code} options=${options.length} feedback=${feedback.length} chars=${system.length}`);

  try {
    const { data, model } = await callGemini(
      {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: TASK }] }],
        generationConfig: { maxOutputTokens: 16384, responseMimeType: "application/json", responseJsonSchema: SCHEMA },
      },
      started
    );
    const cand = data?.candidates?.[0];
    const finish = cand?.finishReason;
    if (data?.promptFeedback?.blockReason) return fail(502, "שירות הבינה סירב לבקשה הזו.");
    if (BLOCKED.has(finish)) return fail(502, "שירות הבינה עצר את התשובה (מסנן התוכן שלו).");
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

    // בדיקה שאינה סומכת על הבינה: קוד מהרשימה בלבד, ציון 7 ומעלה, ודרישות הסף שוב
    const byCode = new Map(options.map((p) => [p.code, p]));
    const seen = new Set();
    const dropped = [];
    const recommendations = [];
    (Array.isArray(parsed?.recommendations) ? parsed.recommendations : []).forEach((r) => {
      const p = byCode.get(r?.candidate);
      if (!p || seen.has(p.code) || recommendations.length >= MAX_RECOMMENDATIONS) return;
      const fitScore = Math.max(0, Math.min(10, Math.round(Number(r.fitScore) || 0)));
      const problem =
        (fitScore < 7 && "ציון") || internalPairProblem(focus, p) || (blindSpotAdmitsGap(r.blindSpot) && "בירור") || null;
      if (problem) {
        dropped.push(`${p.code}:${problem}`);
        return;
      }
      seen.add(p.code);
      const s = (v, n) => String(v || "").slice(0, n);
      recommendations.push({
        candidate: p.code,
        fitScore,
        lifestyle: s(r.lifestyle, 600),
        coreValues: s(r.coreValues, 600),
        energy: s(r.energy, 600),
        communication: s(r.communication, 600),
        blindSpot: s(r.blindSpot, 400),
        question: s(r.question, 300),
        evidence: s(r.evidence, 400),
      });
    });
    const rejected = (Array.isArray(parsed?.rejected) ? parsed.rejected : [])
      .filter((r) => byCode.has(r?.candidate) && !seen.has(r.candidate))
      .map((r) => ({ candidate: r.candidate, reason: String(r.reason || "").slice(0, 300) }));
    log(
      `candidate done in ${Date.now() - started}ms model=${model} recs=${recommendations.length}` +
        (dropped.length ? ` dropped=${dropped.join(",")}` : "")
    );
    const note = recommendations.length === 0 ? NO_MATCH_TEXT : String(parsed?.note || "").slice(0, 400);
    return Response.json({ ok: true, recommendations, rejected, note, model });
  } catch (err) {
    const { status, msg } = explainGeminiError(err);
    log(`candidate error after ${Date.now() - started}ms:`, err?.status ?? "", err?.message ?? err);
    return fail(status, msg);
  }
}
