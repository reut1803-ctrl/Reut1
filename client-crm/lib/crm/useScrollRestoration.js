"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const positions = new Map();

/**
 * שומרת ומשחזרת את מיקום הגלילה של אלמנט לפי הנתיב הנוכחי.
 * כשגוללים בפיד, נכנסים לכרטיסייה וחוזרים - הגלילה חוזרת בדיוק לאותה נקודה.
 */
export function useScrollRestoration(scrollRef) {
  const pathname = usePathname();
  const key = useRef(pathname);

  useEffect(() => {
    key.current = pathname;
    const el = scrollRef.current;
    if (!el) return;

    const saved = positions.get(pathname);
    if (saved != null) {
      requestAnimationFrame(() => {
        el.scrollTop = saved;
      });
    }

    const handleScroll = () => {
      positions.set(key.current, el.scrollTop);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      positions.set(key.current, el.scrollTop);
      el.removeEventListener("scroll", handleScroll);
    };
  }, [pathname, scrollRef]);
}
