// דחיסת תמונה בדפדפן, לפני העלאה לשירות התמונות (קובץ לקובץ).
// נפרד מ-compressImage.js, שמחזיר טקסט (data URL) לשמירה בתוך הכרטיס.
//
// תמונה מהטלפון שוקלת 3-8 מגה-בייט. בהעלאה מהסלולר זה לוקח עשרות שניות,
// והיא עוברת פעמיים: מהטלפון לשרת שלנו, ומשם לשירות התמונות. תמונה מעל
// 4.5 מגה-בייט אף נחסמת בשרת לגמרי.
// כאן התמונה מוקטנת ל-1600 פיקסלים בצלע הארוכה ונשמרת כ-JPEG - בדרך כלל
// 200-500 קילו-בייט, בלי הבדל נראה לעין במסכי המערכת (שמציגים עד 1000).
//
// בטוח: בכל מקרה שהדחיסה לא מצליחה או לא משתלמת - מוחזר הקובץ המקורי,
// וההעלאה ממשיכה בדיוק כמו קודם.

const MAX_SIDE = 1600;
const QUALITY = 0.82;
const SKIP_BELOW_BYTES = 400 * 1024;

async function decode(file) {
  // createImageBitmap מסובב לפי נתוני הצילום (טלפון שהוחזק לאורך/לרוחב)
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* נופלים לדרך החלופית */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function compressForUpload(file) {
  try {
    if (!file || !/^image\//.test(file.type) || /gif|svg/.test(file.type)) return file;
    if (file.size <= SKIP_BELOW_BYTES) return file;
    const img = await decode(file);
    const w = img.width || img.naturalWidth;
    const h = img.height || img.naturalHeight;
    if (!w || !h) return file;
    const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // רקע לבן, למקרה של PNG שקוף
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
    if (!blob || blob.size >= file.size) return file;
    const name = String(file.name || "photo").replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
