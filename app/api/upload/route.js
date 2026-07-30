// נתיב העלאה בצד השרת: הדפדפן שולח את הקובץ לכאן, והשרת שלנו (שאינו חסום ע"י
// סינון/חסימות רשת בצד הלקוח) הוא זה שמעלה בפועל ל-Cloudinary ומחזיר את הקישור.
const CLOUD_NAME = "ewx9uylu";
const UPLOAD_PRESET = "shiduchim_uploads";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const incoming = await request.formData();
    const file = incoming.get("file");

    if (!file || typeof file === "string") {
      return Response.json({ error: "לא נשלח קובץ" }, { status: 400 });
    }

    const outgoing = new FormData();
    outgoing.append("file", file);
    outgoing.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
      method: "POST",
      body: outgoing,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.secure_url) {
      const detail = data?.error?.message || `Cloudinary HTTP ${res.status}`;
      return Response.json({ error: detail }, { status: 502 });
    }

    return Response.json({ url: data.secure_url });
  } catch (err) {
    return Response.json({ error: err?.message || "העלאה נכשלה בשרת" }, { status: 500 });
  }
}
