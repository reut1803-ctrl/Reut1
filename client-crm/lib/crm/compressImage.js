// כיווץ תמונה בדפדפן לפני העלאה או שמירה.
//
// שתי צורות פלט, ולכל אחת תפקיד:
//
//   compressImage      – מחזיר מחרוזת data:image/jpeg. מיועד למקומות
//                        שמאחסנים את התמונה בתוך מסמך (Firestore).
//   compressImageBlob  – מחזיר Blob בינארי אמיתי. זה מה שצריך לשלוח
//                        לשירות אחסון קבצים.
//
// למה ההפרדה חשובה: קודם נשלחה לשרת ההעלאה תוצאה של toDataURL עטופה
// ב-File. כלומר תוכן הקובץ היה הטקסט "data:image/jpeg;base64,..." ולא
// בייטים של תמונה, וגם נפח הקובץ תפח בשליש בגלל הקידוד. זה מקור
// התופעה של תמונות שנשמרות ריקות או נכשלות בהעלאה.

const decode = async (file) => {
  // createImageBitmap מפענח בעצמו יותר פורמטים, כולל כאלה שהדפדפן
  // אינו יודע להציג כתמונה רגילה, ואינו טוען את כל הקובץ לזיכרון כטקסט.
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // ממשיכים לדרך הוותיקה
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("טעינת התמונה נכשלה"));
      img.src = url;
    });
  } finally {
    // שחרור מיידי: בטלפון עם כמה תמונות גדולות זה ההבדל בין עבודה
    // תקינה לבין דפדפן שנחנק.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
};

function drawScaled(bitmap, maxDimension) {
  const w = bitmap.width || maxDimension;
  const h = bitmap.height || maxDimension;
  const scale = Math.min(1, maxDimension / (Math.max(w, h) || maxDimension));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d");
  // רקע לבן: תמונת PNG שקופה שהומרה ל-JPEG הייתה מקבלת רקע שחור.
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  if (typeof bitmap.close === "function") bitmap.close();
  return canvas;
}

export async function compressImage(file, { maxDimension = 800, quality = 0.6 } = {}) {
  const canvas = drawScaled(await decode(file), maxDimension);
  return canvas.toDataURL("image/jpeg", quality);
}

// Blob בינארי להעלאה. toBlob אינו נתמך בדפדפנים ישנים מאוד, ולכן יש
// נפילה חזרה ל-data URL שמפוענח לבייטים - ובשני המקרים מה שנשלח הוא
// תמונה אמיתית ולא טקסט.
export async function compressImageBlob(file, { maxDimension = 1400, quality = 0.82 } = {}) {
  const canvas = drawScaled(await decode(file), maxDimension);

  if (typeof canvas.toBlob === "function") {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size > 0) return blob;
  }

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: "image/jpeg" });
}
