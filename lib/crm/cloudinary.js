// העלאת קבצים (תמונות, PDF, הקלטות) לאחסון חיצוני ב-Cloudinary במקום שמירתם כ-base64 בתוך Firestore.
// זה עוקף לגמרי את מגבלת ה-1MB למסמך ב-Firestore - במסד הנתונים נשמר רק קישור קצר לקובץ.
const CLOUD_NAME = "ewx9uylu";
const UPLOAD_PRESET = "shiduchim_uploads";

export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const detail = data?.error?.message || `HTTP ${res.status}`;
    throw new Error(detail);
  }

  return data.secure_url;
}
