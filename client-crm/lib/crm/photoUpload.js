// העלאת תמונה מטופס ההרשמה, בדרך שאינה מאבדת תמונות.
//
// שני כשלים שנצפו בשטח וטופלו כאן:
//
// 1. פורמט שהדפדפן אינו יודע לפענח. תמונות מאייפון נשמרות כ-HEIC,
//    ודפדפנים מסוימים אינם מציירים אותן על קנבס. הכיווץ נכשל, ואיתו
//    כל ההעלאה. עכשיו: כיווץ שנכשל אינו מפיל את ההעלאה, אלא הקובץ
//    המקורי נשלח כמות שהוא ושירות האחסון ממיר אותו בעצמו.
//
// 2. תמונה שנשלחה כטקסט ולא כבייטים. ראו ההערה ב-compressImage.js.
//
// בנוסף, קובץ שגדול מדי אחרי הכיווץ מנוסה שוב בכיווץ אגרסיבי יותר
// לפני שמוותרים, כדי שתמונה כבדה מהמצלמה לא תיפסל סתם.

import { compressImageBlob } from "./compressImage";
import { uploadToCloudinary } from "./cloudinary";

const LIMIT = 4 * 1024 * 1024;

const STEPS = [
  { maxDimension: 1400, quality: 0.82 },
  { maxDimension: 1100, quality: 0.72 },
  { maxDimension: 800, quality: 0.6 },
];

export async function uploadPhoto(file, onProgress) {
  let payload = null;

  for (const step of STEPS) {
    try {
      const blob = await compressImageBlob(file, step);
      if (blob.size <= LIMIT) {
        payload = new File([blob], "photo.jpg", { type: "image/jpeg" });
        break;
      }
      // עדיין כבד מדי - ננסה כיווץ חזק יותר בסיבוב הבא
      payload = new File([blob], "photo.jpg", { type: "image/jpeg" });
    } catch {
      // הדפדפן לא הצליח לפענח את הפורמט. אין טעם לנסות רזולוציה אחרת.
      payload = null;
      break;
    }
  }

  // ללא כיווץ אפשרי: הקובץ המקורי. עדיף להעלות תמונה כבדה מלא להעלות כלום.
  if (!payload) payload = file;

  return uploadToCloudinary(payload, onProgress);
}
