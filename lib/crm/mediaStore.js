"use client";

import { collection, doc, getDoc, getDocs, query, where, setDoc, writeBatch } from "firebase/firestore";
import { crmDb } from "./firebaseClient";

// שמירת מדיה (הקלטות, PDF) בחלקים קטנים ב-Firestore.
//
// למה כך: הרשת של המשתמשת אינה מעבירה בקשה אחת "כבדה" (כ-900KB נכשל שוב ושוב עם
// "Failed to fetch"), אבל בקשות קטנות עוברות מצוין - וכל נתוני המערכת ממילא נטענים
// מ-Firestore בהצלחה. Cloudinary מצידו דורש שחלקים יהיו מעל 5MB, כלומר אי אפשר
// לחתוך את ההעלאה אליו. לכן הקובץ נשמר כאן בחלקים קטנים, כל חלק בכתיבה נפרדת,
// ומורכב בחזרה בדפדפן בזמן ההשמעה.
//
// מגבלת מסמך ב-Firestore היא 1MB, ולכן כל חלק קטן בהרבה ממנה.

const CHUNK_CHARS = 180 * 1024;
const REF_PREFIX = "media:";

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("קריאת הקובץ נכשלה"));
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}

// onProgress מקבל טקסט מצב להצגה למשתמשת
export async function saveMedia(file, onProgress) {
  const base64 = await fileToBase64(file);
  const id = newId();
  const mimeType = (file.type || "application/octet-stream").split(";")[0].trim();

  const parts = [];
  for (let i = 0; i < base64.length; i += CHUNK_CHARS) {
    parts.push(base64.slice(i, i + CHUNK_CHARS));
  }

  // כל חלק בכתיבה קטנה ונפרדת, כדי שרשת חלשה תעביר אותו בהצלחה
  for (let i = 0; i < parts.length; i++) {
    onProgress?.(`שומרת ${i + 1} מתוך ${parts.length}...`);
    await setDoc(doc(crmDb, "mediaChunks", `${id}_${String(i).padStart(4, "0")}`), {
      mediaId: id,
      index: i,
      data: parts[i],
    });
  }

  // מסמך הכתר נכתב אחרון - קיומו מסמן שכל החלקים נשמרו במלואם
  await setDoc(doc(crmDb, "media", id), {
    mimeType,
    chunks: parts.length,
    createdAt: new Date().toISOString(),
  });

  onProgress?.("הושלם");
  return `${REF_PREFIX}${id}`;
}

export function isMediaRef(value) {
  return typeof value === "string" && value.startsWith(REF_PREFIX);
}

// הפיכת הפניה לכתובת שניתן לנגן/לפתוח. כתובות רגילות (Cloudinary או data:) מוחזרות כמו שהן,
// כדי שקבצים שנשמרו בעבר ימשיכו לעבוד.
async function loadMediaParts(value) {
  const id = value.slice(REF_PREFIX.length);
  const head = await getDoc(doc(crmDb, "media", id));
  if (!head.exists()) throw new Error("הקובץ לא נמצא");
  const { mimeType, chunks } = head.data();

  // בכוונה בלי orderBy בשאילתה: שילוב של where+orderBy מחייב אינדקס מורכב ב-Firestore
  // (והגדרה נוספת בקונסולה). סינון לפי שדה בודד מאונדקס אוטומטית, והמיון נעשה כאן.
  const snap = await getDocs(query(collection(crmDb, "mediaChunks"), where("mediaId", "==", id)));
  const ordered = snap.docs.map((d) => d.data()).sort((a, b) => a.index - b.index);
  if (ordered.length !== chunks) throw new Error("הקובץ נשמר חלקית - יש להעלות שוב");

  return { base64: ordered.map((c) => c.data).join(""), mimeType: mimeType || "application/octet-stream" };
}

export async function resolveMediaUrl(value) {
  if (!isMediaRef(value)) return value || null;
  const { base64, mimeType } = await loadMediaParts(value);
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

// כתובת data: מלאה. נחוצה לייצוא ל-PDF: html2canvas מצייר על קנבס, ותמונה
// שמגיעה מכתובת חיצונית "מלכלכת" אותו וחוסמת את הייצוא. data: תמיד בטוח.
export async function resolveMediaDataUrl(value) {
  if (!value) return null;
  if (!isMediaRef(value)) {
    if (String(value).startsWith("data:")) return value;
    // כתובת חיצונית (למשל Cloudinary) - מורידים ומקודדים מקומית
    try {
      const res = await fetch(value, { mode: "cors" });
      if (!res.ok) return null;
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result || "") || null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }
  const { base64, mimeType } = await loadMediaParts(value);
  return `data:${mimeType};base64,${base64}`;
}

// הורדת קובץ מדיה למכשיר, בשם קובץ קריא
export async function downloadMedia(value, filename) {
  const url = await resolveMediaUrl(value);
  if (!url) throw new Error("אין קובץ להורדה");
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  if (isMediaRef(value)) setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function deleteMedia(value) {
  if (!isMediaRef(value)) return;
  const id = value.slice(REF_PREFIX.length);
  const snap = await getDocs(query(collection(crmDb, "mediaChunks"), where("mediaId", "==", id)));
  const batch = writeBatch(crmDb);
  snap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(crmDb, "media", id));
  await batch.commit();
}
