// ניתוח וייב חזותי מתמונת הפרופיל - נתיב שרת. נגיש למנהלת המערכת בלבד.
//
// הדפדפן של המנהלת שולח כאן קבוצה קטנה של כתובות תמונה (משירות התמונות
// Cloudinary בלבד), כל אחת עם מפתח אנונימי. השרת מוריד גרסה מוקטנת של כל
// תמונה, ושולח את כולן ל-Gemini בבקשה אחת, לחילוץ שלושה שדות סגנון בלבד.
//
// מה הנתיב לא עושה: לא קורא ולא כותב למסד הנתונים, לא שולח שם, טלפון או
// כל פרט מזהה אחר, ולא שומר את התמונות. התוצאה נשמרת בדפדפן של המנהלת.

import { log, verifyOwner, callGemini, explainGeminiError, BLOCKED, fetchWithTimeout } from "@/lib/crm/geminiServer";
import { optimizedImage } from "@/lib/crm/imageUrl";
import { VIBE_OPTIONS } from "@/lib/crm/aiMatchMethod";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_IMAGES = 6;
const IMAGE_WIDTH = 384;
const MAX_IMAGE_BYTES = 400 * 1024;
const IMAGE_TIMEOUT_MS = 6_000;

function fail(status, message) {
  log(`vibe → ${status}: ${message}`);
  return Response.json({ ok: false, error: message }, { status });
}

const PROMPT = `לפניך תמונות פרופיל של מועמדים לשידוך, כל אחת עם מספר.
לכל תמונה, אפיין/י רק את הסגנון החזותי הכללי, בשלושה שדות, ובחר/י מתוך הרשימות בלבד:
- visual_style: ${VIBE_OPTIONS.visual_style.join(" / ")}
- setting_vibe: ${VIBE_OPTIONS.setting_vibe.join(" / ")}
- energy_vibe: ${VIBE_OPTIONS.energy_vibe.join(" / ")}
כללים:
- תאר/י סגנון, לבוש, סביבה ואווירה בלבד. אל תזהה/י אנשים, אל תעריך/י מראה, יופי, גוף או גיל.
- אם התמונה לא ברורה, אינה של אדם, או שיש בה כמה אנשים בלי שברור מי המועמד/ת - "לא ברור".
- index = המספר של התמונה.`;

const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          index: { type: "integer" },
          visual_style: { type: "string", enum: VIBE_OPTIONS.visual_style },
          setting_vibe: { type: "string", enum: VIBE_OPTIONS.setting_vibe },
          energy_vibe: { type: "string", enum: VIBE_OPTIONS.energy_vibe },
        },
        required: ["index", "visual_style", "setting_vibe", "energy_vibe"],
      },
    },
  },
  required: ["items"],
};

// רק תמונות משירות התמונות שלנו, בכתובת https
function allowedUrl(url) {
  try {
    const u = new URL(String(url || ""));
    return u.protocol === "https:" && u.hostname === "res.cloudinary.com" && u.pathname.includes("/image/upload/");
  } catch {
    return false;
  }
}

async function loadImage(url) {
  const res = await fetchWithTimeout(optimizedImage(url, IMAGE_WIDTH), {}, IMAGE_TIMEOUT_MS);
  if (!res.ok) throw new Error(`image ${res.status}`);
  const type = String(res.headers.get("content-type") || "").split(";")[0].trim();
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(type)) throw new Error(`type ${type || "?"}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_IMAGE_BYTES) throw new Error("too big");
  return { mimeType: type, data: buf.toString("base64") };
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
  if (!process.env.GEMINI_API_KEY) return fail(503, "עוד לא הוגדר מפתח לשירות הבינה (GEMINI_API_KEY ב-Vercel).");

  const items = (Array.isArray(body?.items) ? body.items : [])
    .filter((it) => typeof it?.key === "string" && /^[\w-]{1,80}$/.test(it.key) && allowedUrl(it.url))
    .slice(0, MAX_IMAGES);
  if (items.length === 0) return fail(400, "אין תמונות לניתוח");

  // הורדת התמונות במקביל. תמונה שלא נטענה מסומנת "לא נותחה" ולא מפילה את השאר.
  const loaded = await Promise.all(
    items.map(async (it) => {
      try {
        return { key: it.key, image: await loadImage(it.url) };
      } catch (err) {
        log(`vibe image skipped: ${err?.message || err}`);
        return { key: it.key, image: null };
      }
    })
  );
  const usable = loaded.filter((x) => x.image);
  const skipped = loaded.filter((x) => !x.image).map((x) => x.key);
  if (usable.length === 0) return Response.json({ ok: true, results: {}, skipped });

  const parts = [{ text: PROMPT }];
  usable.forEach((x, i) => {
    parts.push({ text: `תמונה ${i + 1}:` });
    parts.push({ inlineData: { mimeType: x.image.mimeType, data: x.image.data } });
  });

  try {
    const { data, model } = await callGemini(
      {
        contents: [{ role: "user", parts }],
        generationConfig: { maxOutputTokens: 2048, responseMimeType: "application/json", responseJsonSchema: SCHEMA },
      },
      started
    );
    const cand = data?.candidates?.[0];
    const finish = cand?.finishReason;
    if (data?.promptFeedback?.blockReason || BLOCKED.has(finish)) {
      log(`vibe blocked: ${data?.promptFeedback?.blockReason || finish}`);
      return Response.json({ ok: true, results: {}, skipped: items.map((x) => x.key) });
    }
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
    // רק ערכים מתוך הרשימות, ורק למספר תמונה שקיים
    const results = {};
    (Array.isArray(parsed?.items) ? parsed.items : []).forEach((r) => {
      const x = usable[Number(r?.index) - 1];
      if (!x) return;
      const ok = (field) => (VIBE_OPTIONS[field].includes(r?.[field]) ? r[field] : "לא ברור");
      results[x.key] = { visual_style: ok("visual_style"), setting_vibe: ok("setting_vibe"), energy_vibe: ok("energy_vibe") };
    });
    log(`vibe done in ${Date.now() - started}ms model=${model} images=${usable.length} results=${Object.keys(results).length}`);
    return Response.json({ ok: true, results, skipped });
  } catch (err) {
    const { status, msg } = explainGeminiError(err);
    log(`vibe error after ${Date.now() - started}ms:`, err?.status ?? "", err?.message ?? err);
    return fail(status, msg);
  }
}
