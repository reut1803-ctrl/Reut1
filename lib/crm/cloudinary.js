// העלאת קבצים דרך השרת שלנו (app/api/upload) ולא ישירות ל-Cloudinary.
// כך הדפדפן מדבר רק עם הדומיין של האתר שלנו, והשרת הוא שמדבר עם Cloudinary -
// מה שעוקף חסימות רשת/סינון בצד הלקוח שמנעו גישה ישירה ל-api.cloudinary.com.
// מגבלת גוף הבקשה בפונקציית שרת ב-Vercel היא 4.5MB, ולכן זו התקרה כאן.
export const MAX_UPLOAD_SIZE = 4 * 1024 * 1024;

export async function uploadToCloudinary(file) {
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new Error(`הקובץ גדול מדי (מקסימום ${Math.round(MAX_UPLOAD_SIZE / 1024 / 1024)}MB)`);
  }

  const formData = new FormData();
  formData.append("file", file);

  // סלאש בסוף במכוון: בתצורת האתר כל נתיב מקבל סלאש, ובלעדיו הבקשה עוברת הפניה מיותרת
  const res = await fetch("/api/upload/", { method: "POST", body: formData });
  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.url) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }

  return data.url;
}
