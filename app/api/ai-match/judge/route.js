// הסוכן השופט - נתיב שרת. נגיש למנהלת המערכת בלבד.
//
// מקבל את המועמד/ת שבמוקד ועד 6 אפשרויות שכבר עברו את המשפך בקוד
// (lib/crm/aiShortlist.js), ברשימה האנונימית. הבינה לא נותנת ציון: היא
// קוראת את הטקסטים ונותנת לכל אפשרות "פסק דין" לכל ציר - מתאים / פער קל /
// פער מהותי / לא ידוע - עם נימוק וציטוט. הציון מחושב בקוד
// (lib/crm/judgeScore.js), ותנאי הסף נבדקים שוב בקוד (lib/crm/dealBreakers.js).
//
// מידע חסר אינו פוסל ואינו מוריד: "לא ידוע" מעביר את ההכרעה לשדכנית.
// ברירת המחדל: רק המודל החזק. במודל הקל - רק כשהשדכנית מבקשת במפורש,
// והתוצאה מסומנת ככזו. לא קורא ולא כותב למסד הנתונים.

import { log, verifyOwner, callGemini, explainGeminiError, BLOCKED } from "@/lib/crm/geminiServer";
import { scrubText } from "@/lib/crm/aiAnonymize";
import { internalPairProblem } from "@/lib/crm/dealBreakers";
import { CORE_VALUES, MEMORY_HEADER } from "@/lib/crm/aiMatchMethod";
import { AXES, AXIS_KEYS, VERDICTS, scoreVerdicts } from "@/lib/crm/judgeScore";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_OPTIONS = 6;
const BIO_MAX_CHARS = 1500;

function fail(status, message, extra = {}) {
  log(`judge → ${status}: ${message}`);
  return Response.json({ ok: false, error: message, ...extra }, { status });
}

const axisGuide = AXIS_KEYS.map((k) => `- ${k} = ${AXES[k].label}`).join("\n");

const METHOD = `את/ה שופט/ת עמיתה של שדכנית מנוסה במגזר הדתי והחרדי-לאומי בישראל.
תקבל/י מועמד/ת אחד/ת שבמוקד, ועד 6 אפשרויות מהצד השני שכבר עברו סינון בסיסי בקוד.
המידע אנונימי: קוד ושם פרטי בלבד. לחלק מהמועמדים יש outlook - פרופיל השקפה שאושר או חולץ מהטקסט;
הוא גובר על התווית היבשה. השדה service מסכם מה כתוב על שירות.

התפקיד שלך: לא לתת ציון. רק לקרוא, ולתת לכל אפשרות "פסק דין" בכל אחד מהצירים:
${axisGuide}
פסק דין: ${VERDICTS.join(" / ")}.

${CORE_VALUES}

כללי פסק הדין:
- "מתאים" - יש בטקסטים בסיס ברור לכך שבציר הזה השניים באותו עולם או משלימים.
- "פער קל" - הבדל שאפשר לגשר עליו, ושכדאי לבדוק.
- "פער מהותי" - פער שבמציאות פוסל: רמת הקפדה שונה מהותית, חברה נפרדת מול מעורבת, מכנסיים מול מי שדורש
  חצאית בלבד או מקפיד קלה כבחמורה, ערכי ליבה מנוגדים (למשל שירות חשוב לאחד והשני לא שירת), עולמות חיים שונים.
- "לא ידוע" - כשאין בטקסט של אחד הצדדים מספיק מידע על הציר הזה. זה לגיטימי ונפוץ: לא לכל מועמד/ת יש תיאור מלא.
  חוסר מידע אינו פער ואינו סיבה לפסול - לעולם אל תכתוב/תכתבי "פער" רק כי משהו לא כתוב.
  אל תנחש/י ואל תמלא/י פערים מהדמיון. "לא ידוע" מעביר את ההכרעה לשדכנית, וזה בסדר גמור.
- תכונה משותפת (יצירתיות, טבע, "זורמים") לעולם אינה מכסה על פער בציר של הקפדה, חברה או ערכים.
- reason: משפט אחד, ממוקד. evidence: ציטוט קצר מהטקסט שעליו נשען פסק הדין (ריק אם "לא ידוע").
- כתוב/כתבי בעברית, בשפה עדינה ומכבדת. ההחלטה של השדכנית.`;

const verdictSchema = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: VERDICTS },
    reason: { type: "string" },
    evidence: { type: "string" },
  },
  required: ["verdict", "reason", "evidence"],
};

const SCHEMA = {
  type: "object",
  properties: {
    evaluations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          candidate: { type: "string" },
          ...Object.fromEntries(AXIS_KEYS.map((k) => [k, verdictSchema])),
          summary: { type: "string" },
          blindSpot: { type: "string" },
          question: { type: "string" },
        },
        required: ["candidate", ...AXIS_KEYS, "summary", "blindSpot", "question"],
      },
    },
  },
  required: ["evaluations"],
};

const TASK = `תן/י פסק דין לכל אחת מהאפשרויות ברשימה - כולן, בלי לדלג - מול המועמד/ת שבמוקד.
לכל אפשרות: פסק דין לכל ציר, summary (משפט אחד על התמונה הכוללת), blindSpot (מה לבדוק מראש),
question (שאלה אחת לבירור). candidate = הקוד של האפשרות.`;

const compact = (p) => {
  const bio = String(p?.bio || "");
  return { ...p, bio: bio.length > BIO_MAX_CHARS ? `${bio.slice(0, BIO_MAX_CHARS).trim()}… [קוצר]` : bio };
};
const isEntry = (p) => p && typeof p.code === "string" && /^[MF]\d{1,3}$/.test(p.code) && (p.gender === "בחור" || p.gender === "בחורה");

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

const RANK = { מומלץ: 0, "פחות מתאים": 1, "חסר מידע": 2, "פער מהותי": 3, "נפסל בתנאי סף": 4 };

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
  if (!focus) return fail(400, "לא התקבל/ה מועמד/ת");
  const options = (Array.isArray(body?.options) ? body.options : [])
    .filter(isEntry)
    .filter((p) => p.gender !== focus.gender)
    .slice(0, MAX_OPTIONS);
  if (options.length === 0) return Response.json({ ok: true, evaluations: [], attempts: 0 });
  const allowLite = body?.allowLite === true;

  const feedback = cleanFeedback(body?.feedback);
  const parts = [METHOD, "", "המועמד/ת שבמוקד:", JSON.stringify(compact(focus)), "", "האפשרויות:", JSON.stringify(options.map(compact))];
  if (feedback.length) parts.push("", ...MEMORY_HEADER, ...feedback.map((n) => `- ${n.context ? `${n.context}: ` : ""}${n.text}`));
  const system = parts.join("\n");
  log(`judge focus=${focus.code} options=${options.length} allowLite=${allowLite} chars=${system.length}`);

  try {
    const { data, model, attempts } = await callGemini(
      {
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: TASK }] }],
        generationConfig: { maxOutputTokens: 16384, responseMimeType: "application/json", responseJsonSchema: SCHEMA },
      },
      started,
      { prefer: allowLite ? "strong" : "strongOnly" }
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

    const byCode = new Map(options.map((p) => [p.code, p]));
    const seen = new Set();
    const s = (v, n) => String(v || "").slice(0, n);
    const evaluations = [];
    (Array.isArray(parsed?.evaluations) ? parsed.evaluations : []).forEach((e) => {
      const p = byCode.get(e?.candidate);
      if (!p || seen.has(p.code)) return;
      seen.add(p.code);
      const verdicts = {};
      AXIS_KEYS.forEach((k) => {
        const v = e[k] || {};
        const verdict = VERDICTS.includes(v.verdict) ? v.verdict : "לא ידוע";
        verdicts[k] = { verdict, reason: s(v.reason, 300), evidence: verdict === "לא ידוע" ? "" : s(v.evidence, 200) };
      });
      // הציון - בקוד. ותנאי הסף - שוב בקוד, גם אם הבינה לא זיהתה אותם
      const scored = scoreVerdicts(verdicts);
      const hard = internalPairProblem(focus, p);
      evaluations.push({
        candidate: p.code,
        verdicts,
        ...scored,
        ...(hard ? { score: 0, status: "נפסל בתנאי סף", hardReason: hard } : {}),
        summary: s(e.summary, 400),
        blindSpot: s(e.blindSpot, 400),
        question: s(e.question, 300),
      });
    });
    evaluations.sort((a, b) => RANK[a.status] - RANK[b.status] || (b.score ?? -1) - (a.score ?? -1));
    const missing = options.filter((p) => !seen.has(p.code)).map((p) => p.code);
    log(
      `judge done in ${Date.now() - started}ms model=${model} evals=${evaluations.length}` +
        ` statuses=${evaluations.map((e) => `${e.candidate}:${e.status}:${e.score ?? "-"}`).join(",")}` +
        (missing.length ? ` missing=${missing.join(",")}` : "")
    );
    return Response.json({ ok: true, evaluations, missing, model, lite: /lite/i.test(model), attempts });
  } catch (err) {
    const { status, msg } = explainGeminiError(err);
    log(`judge error after ${Date.now() - started}ms:`, err?.status ?? "", err?.message ?? err);
    // המודל החזק לא זמין - מציעים לשדכנית במפורש לנסות במודל הקל
    const strongUnavailable = !allowLite && [429, 503, 500, 502, 504, 0].includes(err?.status);
    // כמה פניות נשלחו בפועל לפני הכישלון - כדי שמד השימוש היומי יהיה מדויק
    const attempts = Array.isArray(err?.tried) ? err.tried.length : 1;
    return fail(status, msg, { attempts, ...(strongUnavailable ? { canUseLite: true } : {}) });
  }
}
