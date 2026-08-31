// נתיב העלאה בצד השרת: הדפדפן שולח את הקובץ לכאן, והשרת שלנו (שאינו חסום ע"י
// סינון/חסימות רשת בצד הלקוח) הוא זה שמעלה בפועל ל-Cloudinary ומחזיר את הקישור.
const CLOUD_NAME = "ewx9uylu";
const UPLOAD_PRESET = "shiduchim_uploads";

export const runtime = "nodejs";
export const maxDuration = 60;

// בדיקת בריאות: מאשרת שנתיב השרת קיים ופעיל, ובודקת אם השרת עצמו מצליח להגיע ל-Cloudinary.
// משמשת את מסך "בדיקת מערכת" כדי לאבחן היכן בדיוק נתקעת העלאה.
export async function GET() {
  const result = { serverAlive: true, cloudinaryReachable: false, detail: "" };
  try {
    const probe = new FormData();
    probe.append("file", new Blob(["diag"], { type: "text/plain" }), "diag.txt");
    probe.append("upload_preset", UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
      method: "POST",
      body: probe,
    });
    const data = await res.json().catch(() => null);

    if (res.ok && data?.secure_url) {
      result.cloudinaryReachable = true;
      result.detail = "העלאת בדיקה ל-Cloudinary הצליחה";
    } else {
      result.detail = data?.error?.message || `Cloudinary החזיר שגיאה ${res.status}`;
    }
  } catch (err) {
    result.detail = `השרת לא הצליח להגיע ל-Cloudinary: ${err?.message || String(err)}`;
  }
  return Response.json(result);
}

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

    if (!res.ok) {
      const detail = data?.error?.message || `Cloudinary HTTP ${res.status}`;
      return Response.json({ error: detail }, { status: 502 });
    }

    if (!data?.secure_url) {
      return Response.json({ error: "Cloudinary לא החזיר קישור לקובץ" }, { status: 502 });
    }

    return Response.json({ url: data.secure_url });
  } catch (err) {
    return Response.json({ error: err?.message || "העלאה נכשלה בשרת" }, { status: 500 });
  }
}
