// העלאת קבצים דרך השרת שלנו (app/api/upload) ולא ישירות ל-Cloudinary.
// כך הדפדפן מדבר רק עם הדומיין של האתר שלנו, והשרת הוא שמדבר עם Cloudinary -
// מה שעוקף חסימות רשת/סינון בצד הלקוח שמנעו גישה ישירה ל-api.cloudinary.com.
//
// הערה חשובה על גודל: ניסינו לשלוח את הקובץ בחלקים קטנים כדי לעקוף רשת חלשה,
// אבל Cloudinary דורש שכל חלק (חוץ מהאחרון) יהיה מעל 5MB, ולפונקציית שרת ב-Vercel
// יש תקרה של כ-4.5MB לבקשה - כלומר שתי הדרישות סותרות ולא ניתן לחתוך לחלקים.
// לכן הקובץ נשלח בבקשה אחת, עם ניסיונות חוזרים שמתגברים על נפילות רשת רגעיות.

//
// גיבוי לאתר ללא שרת: המערכת מתפרסמת כאתר סטטי (GitHub Pages), ושם נתיב ההעלאה
// שבשרת פשוט אינו קיים. במקרה כזה הקובץ נשמר בחלקים ב-Firestore, בדיוק כמו
// ההקלטות וקובצי ה-PDF. אם בעתיד האתר יעבור לשרת מלא עם Cloudinary, הקוד
// יזהה זאת לבד וישתמש בו - בלי שינוי נוסף.
import { saveMedia } from "./mediaStore";

const MAX_UPLOAD_SIZE = 4 * 1024 * 1024;
const ATTEMPTS = 4;

// נבדק פעם אחת בלבד לכל טעינת עמוד, כדי לא לבזבז ניסיונות חוזרים על כל קובץ
let serverUploadAvailable = null;

async function hasUploadServer() {
  if (serverUploadAvailable !== null) return serverUploadAvailable;
  try {
    const res = await fetch("/api/upload/", { method: "GET" });
    // באתר סטטי הבקשה מחזירה 404 (או דף HTML), ולא תשובת JSON מהשרת
    serverUploadAvailable = res.ok && (res.headers.get("content-type") || "").includes("json");
  } catch {
    serverUploadAvailable = false;
  }
  return serverUploadAvailable;
}

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

// onProgress מקבל טקסט מצב להצגה, כדי שהמשתמשת תראה שמשהו קורה ולא כפתור "תקוע"
export async function uploadToCloudinary(file, onProgress) {
  if (file.size > MAX_UPLOAD_SIZE) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    throw new Error(`הקובץ שוקל ${mb}MB. המקסימום הוא 4MB - נסי קובץ קצר או קטן יותר.`);
  }

  // אין שרת העלאה (אתר סטטי) - שומרים בחלקים ב-Firestore במקום
  if (!(await hasUploadServer())) {
    return saveMedia(file, onProgress);
  }

  const filename = safeName(file);
  let lastErr = null;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      onProgress?.(attempt === 1 ? "מעלה..." : `מנסה שוב (${attempt} מתוך ${ATTEMPTS})...`);

      // בונים FormData חדש בכל ניסיון - אובייקט שכבר נשלח אינו ניתן לשליחה חוזרת
      const formData = new FormData();
      formData.append("file", file, filename);

      const res = await fetch("/api/upload/", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      if (!data?.url) throw new Error("לא התקבל קישור לקובץ");

      return data.url;
    } catch (err) {
      lastErr = err;
      // המתנה עולה בין ניסיונות, כדי לתת לרשת להתאושש
      if (attempt < ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 800 * attempt));
      }
    }
  }

  throw lastErr;
}
