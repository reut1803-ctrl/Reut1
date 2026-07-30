// העלאת קבצים דרך השרת שלנו (app/api/upload) ולא ישירות ל-Cloudinary.
// כך הדפדפן מדבר רק עם הדומיין של האתר שלנו, והשרת הוא שמדבר עם Cloudinary -
// מה שעוקף חסימות רשת/סינון בצד הלקוח שמנעו גישה ישירה ל-api.cloudinary.com.
//
// כל קובץ נשלח בחלקים קטנים ברצף, והשרת מרכיב אותם מול Cloudinary.
// החלקים קטנים במכוון (ולא בגודל המקסימלי שהשרת מתיר): ברשתות איטיות או עם סינון,
// בקשה אחת "כבדה" נופלת עם "Failed to fetch" עוד לפני שהיא מגיעה לשרת, בעוד
// בקשות קטנות עוברות. חלוקה לחלקים קטנים + ניסיון חוזר לכל חלק הופכת את ההעלאה
// לעמידה בהרבה, וגם מסירה כל תקרת גודל מעשית.

const CHUNK_SIZE = 256 * 1024;
const CHUNK_RETRIES = 3;

// גזירת סיומת מסוג הקובץ - הקלטות קוליות (למשל מוואטסאפ) מגיעות לעיתים בלי סיומת בשם,
// ואז Cloudinary לא מזהה את הפורמט ומחזיר "Unsupported video format or file".
const EXT_BY_TYPE = {
  "audio/ogg": ".ogg",
  "audio/opus": ".ogg",
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/mp4": ".m4a",
  "audio/x-m4a": ".m4a",
  "audio/aac": ".aac",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/webm": ".webm",
  "audio/flac": ".flac",
  "video/webm": ".webm",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/heic": ".heic",
};

// שם קובץ בטוח באנגלית - שמות בעברית עלולים להישבר בכותרות של בקשת ההעלאה
function safeName(file) {
  const name = file.name || "";
  const dot = name.lastIndexOf(".");
  // סיומת תקינה היא קצרה ובאנגלית; אחרת נגזור אותה מסוג הקובץ
  const fromName = dot > 0 && /^\.[a-zA-Z0-9]{1,5}$/.test(name.slice(dot)) ? name.slice(dot) : "";
  // סוג הקובץ עשוי לכלול פרמטרים (למשל "audio/webm;codecs=opus") - לוקחים רק את החלק הבסיסי
  const baseType = (file.type || "").toLowerCase().split(";")[0].trim();
  const ext = fromName || EXT_BY_TYPE[baseType] || "";
  return `upload${ext}`;
}

async function postChunk(chunk, { filename, uploadId, start, end, total }) {
  const headers = {};
  if (uploadId) {
    headers["x-upload-id"] = uploadId;
    headers["x-chunk-range"] = `bytes ${start}-${end}/${total}`;
  }

  let lastErr = null;
  for (let attempt = 1; attempt <= CHUNK_RETRIES; attempt++) {
    try {
      // בונים FormData חדש בכל ניסיון - אובייקט שכבר נשלח אינו ניתן לשליחה חוזרת
      const formData = new FormData();
      formData.append("file", chunk, filename);

      const res = await fetch("/api/upload/", { method: "POST", body: formData, headers });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      return data;
    } catch (err) {
      lastErr = err;
      // המתנה קצרה ועולה בין ניסיונות, כדי לתת לרשת להתאושש
      if (attempt < CHUNK_RETRIES) {
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  }
  throw lastErr;
}

// onProgress מקבל אחוז (0-100) כדי שניתן להציג התקדמות למשתמשת במקום כפתור "תקוע"
export async function uploadToCloudinary(file, onProgress) {
  const filename = safeName(file);

  if (file.size <= CHUNK_SIZE) {
    const data = await postChunk(file, { filename });
    if (!data?.url) throw new Error("לא התקבל קישור לקובץ");
    onProgress?.(100);
    return data.url;
  }

  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let lastData = null;

  for (let start = 0; start < file.size; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE, file.size);
    lastData = await postChunk(file.slice(start, end), {
      filename,
      uploadId,
      start,
      end: end - 1,
      total: file.size,
    });
    onProgress?.(Math.round((end / file.size) * 100));
  }

  if (!lastData?.url) throw new Error("לא התקבל קישור לקובץ");
  return lastData.url;
}
