"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

// שומר ומשחזר את מיקום הגלילה של אלמנט (או של החלון) לפי מפתח ייחודי.
// חובה קריטית: כשחוזרים למאגר אחרי כניסה לכרטיסייה או מסך אחר, המשתמשת חוזרת
// בדיוק לנקודה שבה עצרה.
const positions = new Map();

export function useScrollRestoration(key, ref) {
  const restored = useRef(false);

  useLayoutEffect(() => {
    const el = ref?.current || window;
    const saved = positions.get(key) ?? sessionStorage.getItem(`scroll:${key}`);
    if (saved != null && !restored.current) {
      const y = Number(saved);
      requestAnimationFrame(() => {
        if (el === window) window.scrollTo(0, y);
        else el.scrollTop = y;
      });
    }
    restored.current = true;
  }, [key, ref]);

  useEffect(() => {
    const el = ref?.current || window;
    const handler = () => {
      const y = el === window ? window.scrollY : el.scrollTop;
      positions.set(key, y);
      sessionStorage.setItem(`scroll:${key}`, String(y));
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [key, ref]);
}
