"use client";

import { useMediaUrl } from "@/lib/crm/useMediaUrl";

// תמונה שיודעת להציג גם קובץ שנשמר בחלקים ב-Firestore (הפניה מסוג "media:")
// וגם כתובת רגילה. כך אותה תצוגה עובדת בין אם הקובץ הועלה דרך שרת ובין אם לא.
export default function MediaImage({ src, alt = "", className = "", ...rest }) {
  const { url, loading } = useMediaUrl(src);

  if (loading) {
    return <div className={`animate-pulse bg-[#CCBDAB] ${className}`} aria-label="טוען תמונה" />;
  }
  if (!url) return null;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} {...rest} />;
}
