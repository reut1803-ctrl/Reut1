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
export default function MediaImage({ src, alt = "", className = "", ...rest }) {
  const { url, loading } = useMediaUrl(src);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
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
  }, [url]);

  // הטעינה מתחילה כבר בזמן הצגת ה-HTML, לפני ש-React מחבר את מטפל השגיאות,
  // ולכן כישלון מוקדם עלול "להתפספס". כאן בודקים את המצב בפועל אחרי הרינדור.
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !hasVariants || failed) return;
    if (el.complete && el.naturalWidth === 0 && el.getAttribute("src") === current) {
      goToNextVariant();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, hasVariants, failed]);

  if (loading) {
    return <div className={`animate-pulse bg-[#CCBDAB] ${className}`} aria-label="טוען תמונה" />;
  }
  if (!url || failed) return null;

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
      className={className}
      onError={handleError}
      referrerPolicy="no-referrer"
      {...rest}
    />
  );
}
