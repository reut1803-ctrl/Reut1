// בחירת התמונה שמוצגת על כרטיס מועמד/ת.
//
// הכרטיס מחזיק שני שדות: photoUrl (התמונה הראשית) ו-photoUrls (כל התמונות).
// ברוב המקרים הם מסונכרנים, אבל כשהראשי חסר והרשימה מלאה - התמונה פשוט
// לא הוצגה, והכרטיס נראה כאילו אין לו תמונה בכלל. זה קרה רק בחלק מהמסכים,
// ולכן אותה מועמדת נראתה עם תמונה במסך אחד ובלי תמונה במסך אחר.
//
// כאן יש מקור אמת אחד לכל המסכים.
export function candidatePhoto(candidate) {
  return candidate?.photoUrl || candidate?.photoUrls?.[0] || null;
}

// כל התמונות של הכרטיס, בלי כפילויות ובלי ערכים ריקים
export function candidatePhotos(candidate) {
  const list = [candidate?.photoUrl, ...(candidate?.photoUrls || [])].filter(Boolean);
  return [...new Set(list)];
}
