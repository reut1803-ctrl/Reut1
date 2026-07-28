// העלאת קבצים ל-Firebase Storage במקום שמירתם כטקסט (base64) בתוך מסמך ב-Firestore -
// כדי שכמה תמונות/PDF/הקלטה ביחד לא יחרגו ממגבלת הגודל של מסמך ב-Firestore.
import { ref, uploadString, uploadBytes, getDownloadURL } from "firebase/storage";
import { crmStorage } from "./firebaseClient";

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export async function uploadDataUrl(dataUrl, folder) {
  const r = ref(crmStorage, `${folder}/${uid()}`);
  await uploadString(r, dataUrl, "data_url");
  return getDownloadURL(r);
}

export async function uploadRawFile(file, folder) {
  const r = ref(crmStorage, `${folder}/${uid()}-${file.name}`);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}
