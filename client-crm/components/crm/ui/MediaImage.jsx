"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaUrl } from "@/lib/crm/useMediaUrl";
import { photoUrlVariants } from "@/lib/crm/sheetImport";

// הצגת תמונה של מועמד/ת, בכל אחת מצורות האחסון שקיימות במערכת.
//
// למה צריך רכיב ולא פשוט <img src=...>:
// תמונה נשמרת אצלנו באחת משלוש צורות, ורק אחת מהן היא כתובת שדפדפן
// יודע לפתוח ישירות:
//   1. כתובת רגילה (Cloudinary) – עובדת כמו שהיא.
//   2. הפניית מדיה ("media:...") – הקובץ מפוצל לחלקים ב-Firestore,
//      וצריך לאחות אותו לפני שאפשר להציג. כך נשמרות תמונות שיובאו
//      מגיליון Google, ולכן כרטיסים כאלה הופיעו בלי תמונה בכלל.
//   3. קישור ל-Google Drive – לדרייב יש כמה פורמטים של כתובת ישירה,
//      וחלקם נחסמים בחלק מהדפדפנים. לכן מנסים אותם בזה אחר זה.
//
// כשלון בכל הדרכים אינו משאיר אייקון תמונה שבורה, אלא מפנה לתצוגת
// ברירת המחדל של הקורא - בדיוק כמו כרטיס בלי תמונה.
export default function MediaImage({ value, alt = "", className = "", onUnavailable, ...rest }) {
  const { url, error } = useMediaUrl(value);
  const [variantIndex, setVariantIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  // הודעה על כישלון נשלחת פעם אחת בלבד לכל כתובת, כדי שהורה שמעביר
  // פונקציה חדשה בכל רינדור לא ייכנס ללולאה.
  const notified = useRef(false);

  // כתובת חדשה - מתחילים את רשימת הניסיונות מחדש
  useEffect(() => {
    setVariantIndex(0);
    setFailed(false);
    notified.current = false;
  }, [value]);

  const variants = url ? photoUrlVariants(url) : [];
  // כתובת שאינה מזוהה כדרייב מוחזרת כרשימה בת פריט אחד, ובלוב מקומי
  // (blob:) הרשימה ריקה - ואז משתמשים בכתובת עצמה.
  const src = variants.length > 0 ? variants[Math.min(variantIndex, variants.length - 1)] : url;

  useEffect(() => {
    if ((failed || error) && !notified.current) {
      notified.current = true;
      onUnavailable?.();
    }
    // onUnavailable מכוון בכוונה אינו ברשימה: הוא נקרא פעם אחת בלבד
    // דרך הדגל שלמעלה, ולכן שינוי בזהות שלו אינו אמור להפעיל אותו שוב.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed, error]);

  if (!value || error || failed || !src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        // עוד פורמט כתובת לנסות, או ויתור מסודר
        if (variantIndex < variants.length - 1) setVariantIndex((i) => i + 1);
        else setFailed(true);
      }}
      {...rest}
    />
  );
}
