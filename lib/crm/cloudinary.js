// העלאת קבצים דרך השרת שלנו (app/api/upload) ולא ישירות ל-Cloudinary.
// כך הדפדפן מדבר רק עם הדומיין של האתר שלנו, והשרת הוא שמדבר עם Cloudinary -
// מה שעוקף חסימות רשת/סינון בצד הלקוח שמנעו גישה ישירה ל-api.cloudinary.com.
//
// לפונקציית שרת ב-Vercel יש מגבלת גוף בקשה (כ-4.5MB), ולכן קובץ גדול נשלח
// בחלקים קטנים ברצף, והשרת מרכיב אותם מול Cloudinary. כך אין תקרת גודל מעשית.

const CHUNK_SIZE = 3 * 1024 * 1024;

// שם קובץ בטוח באנגלית - שמות בעברית עלולים להישבר בכותרות של בקשת ההעלאה
function safeName(file) {
  const dot = file.name?.lastIndexOf(".") ?? -1;
  const ext = dot > 0 ? file.name.slice(dot) : "";
  return `upload${ext}`;
}

async function postChunk(chunk, { filename, uploadId, start, end, total }) {
  const formData = new FormData();
  formData.append("file", chunk, filename);

  const headers = {};
  if (uploadId) {
    headers["x-upload-id"] = uploadId;
    headers["x-chunk-range"] = `bytes ${start}-${end}/${total}`;
  }

  const res = await fetch("/api/upload/", { method: "POST", body: formData, headers });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}

export async function uploadToCloudinary(file) {
  const filename = safeName(file);

  if (file.size <= CHUNK_SIZE) {
    const data = await postChunk(file, { filename });
    if (!data?.url) throw new Error("לא התקבל קישור לקובץ");
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
  }

  if (!lastData?.url) throw new Error("לא התקבל קישור לקובץ");
  return lastData.url;
}
