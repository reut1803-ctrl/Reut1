// רשימת התמונות של כרטיס, כמקור אמת אחד.
//
// במאגר יש שני שדות: photoUrls הוא מערך כל התמונות, ו-photoUrl הוא התמונה
// הראשית - שהיא בפועל הראשונה במערך. כרטיסים ותיקים, שנוצרו לפני שהמערך
// היה קיים, מחזיקים רק את photoUrl.
//
// לכן מאחדים את השניים ומסירים כפילויות: כך כרטיס רגיל לא מוריד את התמונה
// הראשית פעמיים, וכרטיס ותיק עדיין מחזיר את התמונה היחידה שיש לו.
export function candidatePhotos(entity) {
  const list = Array.isArray(entity?.photoUrls) ? entity.photoUrls : [];
  const all = [...list, entity?.photoUrl].filter(Boolean).map(String);
  return [...new Set(all)];
}
