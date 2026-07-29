// העלאת קבצים (הקלטות שמע שמוקלטות בדפדפן) לאחסון חיצוני ב-Cloudinary במקום שמירתם כ-base64 בתוך Firestore.
// זה עוקף לגמרי את מגבלת ה-1MB למסמך ב-Firestore - במסד הנתונים נשמר רק קישור קצר לקובץ.
// משתמשים כאן ב-XMLHttpRequest (ולא fetch) כדי לעקוף חסימות רשת/אבטחה ספציפיות ל-fetch שנתקלנו בהן בשטח.
const CLOUD_NAME = "ewx9uylu";
const UPLOAD_PRESET = "shiduchim_uploads";

export function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);

    xhr.onload = () => {
      let data = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // תשובה לא תקינה - נטפל כשגיאה למטה
      }
      if (xhr.status >= 200 && xhr.status < 300 && data?.secure_url) {
        resolve(data.secure_url);
      } else {
        reject(new Error(data?.error?.message || `HTTP ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("שגיאת רשת בהעלאה"));

    xhr.send(formData);
  });
}
