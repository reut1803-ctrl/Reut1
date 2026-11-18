// העוזרת: שרת קטן שרץ ב-Vercel. המפתח של Anthropic נשמר רק כאן (משתנה סביבה ANTHROPIC_API_KEY)
// ואף פעם לא נשלח לטלפון. לפני כל שאלה בודקים מול Firebase שהשואל/ת באמת חבר/ה בטיול.

import Anthropic from "@anthropic-ai/sdk";
import { firebaseConfig } from "@/lib/firebase-config";
import { TRIP_ID } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = "claude-opus-5-5";

// קבוע ויציב (בלי תאריכים) — כדי שהמטמון של Anthropic יעבוד ויוזיל
const SYSTEM = `את "העוזרת של קליפורניה שלנו": עוזרת טיול חכמה, חמה ומעשית של זוג ישראלי — רעות וזכריה — ושתי הבנות הקטנות שלהם, בטיול סביב סן פרנסיסקו.
על המשפחה: משפחה חב״דניקית ששומרת שבת וכשרות. בשבת ובחג לא נוסעים ולא משתמשים בטלפון — לכן לפני שבת מתכננים לחזור בזמן ללינה. אוכל רק בכשרות מהודרת או מוצרים עם הכשר מוכר; כשממליצים על מסעדה או מוצר — תמיד להזכיר לבדוק את הכשרות במקום. צניעות חשובה: לא להמליץ על מקומות לא צנועים (למשל החלק הצפוני של חוף בייקר).
איך לענות:
- תמיד בעברית, קצר וברור, בגובה העיניים. בלי הקדמות.
- 2–4 הצעות מעשיות לכל היותר, כל אחת עם: למה זה מתאים עכשיו, זמן נסיעה משוער, וטיפ מעשי אחד.
- להתחשב במידע על הרגע שמגיע בהודעה (שעה בקליפורניה, מזג אוויר, זמן עד שבת, העדפות, המסלול של היום).
- כשמזכירים מקום — שם בעברית ובסוגריים השם באנגלית (כדי שיהיה קל לחפש בווייז).
- כשצריך מידע עדכני (אירועים, שעות פתיחה, סגירות כבישים) — להשתמש בחיפוש ברשת, ולציין שכדאי לוודא באתר הרשמי.
- אם לא בטוחה במשהו — לומר זאת בפשטות, לא להמציא.
- טווח הטיול: עד כ-4 שעות נסיעה מסן פרנסיסקו.`;

type Turn = { role: "user" | "assistant"; text: string };

async function verifyMember(idToken: string): Promise<boolean> {
  // קריאה למסמך הטיול בשם המשתמש: כללי האבטחה של Firestore מאשרים רק חברי טיול.
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/trips/${TRIP_ID}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` }, cache: "no-store" });
  return r.ok;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8" } });
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return json(503, { code: "no_key" });

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !(await verifyMember(token))) return json(401, { code: "not_member" });

  let body: { history?: Turn[]; question?: string; context?: string };
  try { body = await req.json(); } catch { return json(400, { code: "bad_request" }); }
  const question = (body.question ?? "").trim().slice(0, 1500);
  if (!question) return json(400, { code: "empty" });

  const history = (body.history ?? []).slice(-10).filter((t) => t.text?.trim());
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...history.map((t) => ({ role: t.role, content: t.text.slice(0, 4000) }) as Anthropic.Beta.BetaMessageParam),
    { role: "user", content: `${body.context ? `מצב הרגע:\n${body.context.slice(0, 3000)}\n\n` : ""}השאלה: ${question}` },
  ];

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (s: string) => controller.enqueue(encoder.encode(s));
      try {
        // עד 3 סבבים: חיפוש ברשת ארוך יכול לעצור באמצע (pause_turn) ולהמשיך
        for (let round = 0; round < 3; round++) {
          const s = client.beta.messages.stream({
            model: MODEL,
            max_tokens: 8000,
            system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
            output_config: { effort: "low" },
            tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }],
            // אם המודל מסרב מסיבות בטיחות — מודל גיבוי ממשיך את אותה בקשה
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            messages,
          });
          for await (const ev of s) {
            if (ev.type === "content_block_start" && ev.content_block.type === "server_tool_use") send("\u0000search\u0000");
            if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") send(ev.delta.text);
          }
          const final = await s.finalMessage();
          if (final.stop_reason === "refusal") { send("\n\nעל השאלה הזאת אני לא יכולה לעזור. אפשר לנסח אחרת?"); break; }
          if (final.stop_reason !== "pause_turn") break;
          messages.push({ role: "assistant", content: final.content as Anthropic.Beta.BetaContentBlockParam[] });
        }
      } catch (e) {
        if (e instanceof Anthropic.AuthenticationError) send("\u0000error:key\u0000");
        else if (e instanceof Anthropic.PermissionDeniedError) send("\u0000error:key\u0000");
        else if (e instanceof Anthropic.RateLimitError) send("\u0000error:busy\u0000");
        else if (e instanceof Anthropic.BadRequestError && /credit|billing|balance/i.test(e.message)) send("\u0000error:credit\u0000");
        else send("\u0000error:other\u0000");
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
