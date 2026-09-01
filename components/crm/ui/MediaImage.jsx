"use client";

import { useEffect, useRef, useState } from "react";
import { useMediaUrl } from "@/lib/crm/useMediaUrl";
import { photoUrlVariants } from "@/lib/crm/sheetImport";

// תמונה שיודעת להציג גם קובץ שנשמר בחלקים ב-Firestore (הפניה מסוג "media:")
// וגם כתובת רגילה.
//
// בנוסף: לתמונה שמגיעה מ-Google Drive יש כמה צורות כתובת, וגוגל חוסמת חלק מהן
// לפי הקובץ ולפי הזמן. לכן אם הכתובת הראשונה נכשלת, מנסים אוטומטית את הצורות
// החלופיות לפני שמוותרים - כך גם כרטיסים שיובאו בעבר עם כתובת ישנה נטענים.
//
// חוויית הטעינה: עד שהתמונה מוכנה מוצג משטח בהיר ורגוע בגוון הקרם של המערכת,
// ולא צבע בולט. התמונה עצמה נכנסת בהבהרה עדינה ברגע שהיא באמת מוכנה, כדי
// שמעבר בין מסכים לא ייראה כהבזק צבעוני.
export default function MediaImage({ src, alt = "", className = "", fallback = null, ...rest }) {
  const { url, loading } = useMediaUrl(src);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const imgRef = useRef(null);

  const variants = photoUrlVariants(url);
  const hasVariants = variants.length > 1;
  const current = hasVariants ? variants[Math.min(attempt, variants.length - 1)] : url;

  const goToNextVariant = () => {
    setAttempt((a) => {
      if (a < variants.length - 1) return a + 1;
      setFailed(true);
      return a;
    });
  };

  useEffect(() => {
    setAttempt(0);
    setFailed(false);
    setReady(false);
  }, [url]);

  // הטעינה מתחילה כבר בזמן הצגת ה-HTML, לפני ש-React מחבר את המטפלים,
  // ולכן גם הצלחה וגם כישלון מוקדמים עלולים "להתפספס". כאן בודקים את
  // המצב בפועל אחרי הרינדור: תמונה שכבר במטמון תסומן כמוכנה מיד, ותמונה
  // שנכשלה תעבור לצורת הכתובת הבאה.
  useEffect(() => {
    const el = imgRef.current;
    if (!el || failed) return;
    if (!el.complete || el.getAttribute("src") !== current) return;
    if (el.naturalWidth > 0) setReady(true);
    else if (hasVariants) goToNextVariant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, hasVariants, failed]);

  // משטח ההמתנה: קרם בהיר עם פעימה עדינה, בלי שום צבע בולט.
  //
  // הוא נצבע על התמונה עצמה ולא באלמנט נפרד - כך אין שום שינוי במבנה
  // הדף, והמשטח נעלם מאליו ברגע שהתמונה נצבעת מעליו.
  const wait = "animate-pulse bg-[#F5EFE6]";

  if (loading) return <div className={`${wait} ${className}`} aria-label="טוען תמונה" />;
  if (!url || failed) return fallback;

  const handleError = () => {
    if (hasVariants) goToNextVariant();
    else setFailed(true);
  };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={current}
      alt={alt}
      className={`${className} ${ready ? "" : wait}`}
      onLoad={() => setReady(true)}
      onError={handleError}
      referrerPolicy="no-referrer"
      {...rest}
    />
  );
}
