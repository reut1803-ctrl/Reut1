// הקטנת תמונות לפני הצגה.
//
// הבעיה: התמונות נשמרות בגודל המקורי שיצא מהטלפון - לעיתים 4 עד 8 מגה-בייט
// לתמונה. מסך המאגר מציג עשרות כרטיסים יחד, וכל אחד מהם הוריד את הקובץ
// המלא. בחיבור סלולרי או ברשת עמוסה חלק מההורדות פשוט לא מסתיימות, ואז
// הכרטיס נשאר בלי תמונה - וזה נראה כאילו "התמונה נעלמה".
//
// הפתרון: שירות התמונות יודע להקטין ולהמיר לפורמט יעיל לפי הכתובת עצמה.
// מוסיפים לכתובת הוראה קצרה, והשרת מחזיר תמונה במשקל של עשירית ומטה,
// בדיוק ברוחב שצריך למסך. התמונה המקורית נשמרת ואינה משתנה.
//
// f_auto = הפורמט היעיל ביותר שהדפדפן תומך בו
// q_auto = איכות מותאמת אוטומטית, בלי פגיעה נראית לעין
// w_...  = רוחב מקסימלי בפיקסלים
// dpr_auto = חדות מלאה גם במסכים צפופים

const CLOUDINARY_UPLOAD = "/image/upload/";

export function optimizedImage(url, width = 800) {
  const src = String(url || "");
  if (!src) return src;
  // רק כתובות של שירות התמונות שלנו. כל כתובת אחרת מוחזרת כמו שהיא.
  if (!src.includes("res.cloudinary.com") || !src.includes(CLOUDINARY_UPLOAD)) return src;
  // כתובת שכבר עברה טיפול לא מטופלת שוב
  if (/\/upload\/(f_auto|q_auto|w_\d|dpr_)/.test(src)) return src;
  const w = Math.max(80, Math.round(width));
  return src.replace(CLOUDINARY_UPLOAD, `${CLOUDINARY_UPLOAD}f_auto,q_auto,dpr_auto,w_${w},c_limit/`);
}
