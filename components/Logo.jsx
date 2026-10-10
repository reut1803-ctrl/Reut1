"use client";

import { useEffect, useState } from "react";

// לוגו המערכת. קובץ PNG עם רקע שקוף - מוטמע באתר ללא מסגרת וללא רקע.
// animate=true -> אנימציית חשיפת צבעי מים + הבלחת זהב, פעם אחת בכל סשן (מכבד prefers-reduced-motion).
const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function Logo({ className = "", animate = false }) {
  const [play, setPlay] = useState(false);

  useEffect(() => {
    if (!animate) return;
    try {
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const seen = sessionStorage.getItem("logo_played");
      if (!reduce && !seen) {
        setPlay(true);
        sessionStorage.setItem("logo_played", "1");
      }
    } catch (e) {
      /* אחסון חסום - פשוט לא נריץ אנימציה */
    }
  }, [animate]);

  if (!play) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={`${BASE}/logo-v2.png`} alt="לוגו" className={`object-contain ${className}`} />;
  }

  return (
    <div className={`relative ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${BASE}/logo-v2.png`} alt="לוגו" className="logo-animate block h-auto w-full object-contain" />
      {/* שכבת הבלחת הזהב - ממוסכת לצורת הלוגו */}
      <div
        className="logo-gold"
        style={{ WebkitMaskImage: `url(${BASE}/logo-v2.png)`, maskImage: `url(${BASE}/logo-v2.png)` }}
      />
    </div>
  );
}

export const LOGO_SRC = `${BASE}/logo-v2.png`;
