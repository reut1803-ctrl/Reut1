"use client";

// כיווץ תמונה בצד הדפדפן, לפני שליחה מהטופס הציבורי.
//
// למה זה נחוץ: הטופס פתוח בלי התחברות, ולכן אינו יכול לכתוב לאוסף המדיה -
// כללי האבטחה מרשים זאת לצוות בלבד. במקום לפתוח כתיבה למשתמש אנונימי,
// התמונה נשמרת מכווצת בתוך מסמך הפנייה עצמו, שממילא מותר ליצור.
//
// מסמך ב-Firestore מוגבל למגה-בייט אחד, וקידוד base64 מנפח את הקובץ בכ-37%.
// לכן מכווצים עד שהתוצאה נכנסת בנוחות מתחת למגבלה, עם מרווח ביטחון גדול
// לשאר שדות הטופס.

// תקרת אורך המחרוזת של התמונה. כ-260KB של תמונה בפועל.
export const MAX_PHOTO_CHARS = 360000;

const MAX_SIDE = 1000;
const QUALITY_STEPS = [0.78, 0.68, 0.58, 0.48, 0.38];

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("לא הצלחנו לקרוא את התמונה"));
    };
    img.src = url;
  });
}

// מחזיר כתובת data של JPEG מכווץ, או זורק שגיאה עם הסבר בעברית
export async function compressToDataUrl(file) {
  if (!file) throw new Error("לא נבחרה תמונה");
  if (!String(file.type || "").startsWith("image/")) {
    throw new Error("הקובץ אינו תמונה. אפשר לצלם או לבחור תמונה מהגלריה");
  }

  const img = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("הדפדפן לא אפשר לעבד את התמונה");
  // רקע לבן, כדי ששקיפות ב-PNG לא תהפוך לשחור בהמרה ל-JPEG
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  // יורדים באיכות עד שהתוצאה נכנסת מתחת לתקרה
  for (const q of QUALITY_STEPS) {
    const dataUrl = canvas.toDataURL("image/jpeg", q);
    if (dataUrl.length <= MAX_PHOTO_CHARS) return dataUrl;
  }

  // עדיין גדול מדי: מקטינים גם את המידות ומנסים שוב
  const small = document.createElement("canvas");
  small.width = Math.max(1, Math.round(w * 0.6));
  small.height = Math.max(1, Math.round(h * 0.6));
  const sctx = small.getContext("2d");
  sctx.fillStyle = "#ffffff";
  sctx.fillRect(0, 0, small.width, small.height);
  sctx.drawImage(canvas, 0, 0, small.width, small.height);
  const last = small.toDataURL("image/jpeg", 0.5);
  if (last.length <= MAX_PHOTO_CHARS) return last;

  throw new Error("התמונה גדולה מדי. אפשר לנסות תמונה אחרת");
}

// המרה חזרה לקובץ, כדי שהמנהלת תוכל לשמור אותה כמדיה רגילה באישור הפנייה
export function dataUrlToFile(dataUrl, filename = "photo.jpg") {
  const [head, body] = String(dataUrl || "").split(",");
  if (!body) throw new Error("כתובת התמונה אינה תקינה");
  const mime = /data:([^;]+)/.exec(head)?.[1] || "image/jpeg";
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}
