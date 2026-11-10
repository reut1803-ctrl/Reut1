// ============================================================================
//  מנוע ה-AI Vision: מקבל אריח אחד של צילום דף קשר, ומחזיר רק את הרשימה
//  השמית (שם משפחה, שם פרטי, טלפונים, רחוב) ואת כותרת הכיתה/השנתון אם יש.
//
//  אבטחה: רק אשת הנהלה מחוברת יכולה להפעיל. הבקשה נושאת את אסימון
//  ההתחברות של Firebase; האסימון נבדק כאן, והתפקיד נקרא ממסמך המשתמשת
//  עם אותו אסימון — כך שכללי Firestore הם שמכריעים, בלי מפתח שירות נוסף.
//  מפתח ה-AI (ANTHROPIC_API_KEY) יושב רק בשרת ולא מגיע לדפדפן.
// ============================================================================

import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { createRemoteJWKSet, jwtVerify } from "jose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

const SheetSchema = z.object({
  heading: z.object({
    title: z.string().nullable(),
    classGrade: z.string().nullable(),
    hebrewYear: z.string().nullable(),
  }),
  rows: z.array(
    z.object({
      lastName: z.string(),
      firstName: z.string(),
      phones: z.array(z.string()),
      street: z.string().nullable(),
    })
  ),
});

const SYSTEM = `You read photographed or screenshotted Hebrew community contact sheets ("דף קשר", "אלפון") and return only the list of people/families in it.

The image is often one tile cut from a larger page, so rows at the top or bottom edge may be cut off. The pages are dense and noisy. Extract ONLY entries of the name list: a family name and/or private name(s) with their phone number(s), and the street if it is printed next to the entry.

Ignore completely, never return as rows:
- advertisements, business listings, logos, banners, service providers and their phones
- institutions: yeshivot, schools, kollelim, synagogues, offices, clinics, emergency numbers, municipal or community services
- headings, section titles, page numbers, alphabet index letters, decorative text, footnotes, tiny print that is not part of an entry
- rows cut off so badly that the name cannot be read with confidence

Field rules:
- lastName: the family name exactly as printed in Hebrew. firstName: the private name(s) as printed (for a couple, keep both, e.g. "יעקב ושרה"). Use "" when a part is genuinely absent.
- phones: every phone number of that entry, digits and dashes only, as printed. Do not invent or complete digits you cannot read; leave a number out instead.
- street: only if printed for that entry, else null.
- Keep the reading order of the page (right to left, top to bottom, column by column).

heading: if the tile shows the sheet's title, return it in "title". If it names a school class and Hebrew year (for example "כתה ח' תשפ"ב"), put the class letters in classGrade ("ח") and the Hebrew year letters in hebrewYear ("תשפ"ב"). Otherwise null.`;

async function requireAdmin(req) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !PROJECT_ID) return { ok: false, status: 401 };
  let uid;
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
    });
    uid = payload.sub;
  } catch {
    return { ok: false, status: 401 };
  }
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  if (!res.ok) return { ok: false, status: 403 };
  const doc = await res.json();
  return doc?.fields?.role?.stringValue === "admin" ? { ok: true } : { ok: false, status: 403 };
}

export async function POST(req) {
  const gate = await requireAdmin(req);
  if (!gate.ok) return Response.json({ error: "not-allowed" }, { status: gate.status });

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ai-not-configured" }, { status: 503 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }
  const { data, mediaType } = body || {};
  if (!data || !["image/jpeg", "image/png", "image/webp"].includes(mediaType)) {
    return Response.json({ error: "bad-request" }, { status: 400 });
  }

  const client = new Anthropic();
  try {
    const message = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "high", format: betaZodOutputFormat(SheetSchema) },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data } },
            { type: "text", text: "Extract the name list from this tile." },
          ],
        },
      ],
    });

    if (message.stop_reason === "refusal") {
      return Response.json({ error: "refused" }, { status: 422 });
    }
    if (!message.parsed_output) {
      return Response.json({ error: "unreadable" }, { status: 422 });
    }
    return Response.json(message.parsed_output);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "busy" }, { status: 429 });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "ai-not-configured" }, { status: 503 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error("extract api error", error.status, error.message);
      return Response.json({ error: "ai-error" }, { status: 502 });
    }
    console.error("extract failed", error);
    return Response.json({ error: "ai-error" }, { status: 500 });
  }
}
