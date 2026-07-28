// כיווץ תמונה בדפדפן לפני שמירה - כדי שכמה תמונות + PDF + הקלטה לא יחרגו ממגבלת הגודל של מסמך ב-Firestore.
export function compressImage(file, { maxDimension = 1000, quality = 0.75 } = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("קריאת הקובץ נכשלה"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("טעינת התמונה נכשלה"));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
