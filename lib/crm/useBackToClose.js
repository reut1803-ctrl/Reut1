"use client";

import { useEffect, useRef } from "react";

// גורם ללחיצה על כפתור "חזור" (של הדפדפן/הטלפון) לסגור מסך קופץ/חלונית
// במקום לצאת מהעמוד ולאבד את המקום שהיינו בו.
//
// בפתיחה מוסיפים "צעד" מדומה להיסטוריית הדפדפן; לחיצה על "חזור" מסירה אותו
// ומפעילה סגירה במקום ניווט אחורה. אם החלונית נסגרה בדרך אחרת (כפתור X / לחיצה
// על הרקע), מסירים את הצעד המדומה בעצמנו - אבל רק אם הוא עדיין הצעד הנוכחי,
// כדי לא לבצע "חזור" כפול ולזרוק את המשתמשת אחורה מהעמוד.
const MARKER = "crmOverlayStep";

export function useBackToClose(isOpen, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ [MARKER]: true }, "");

    const handlePopState = () => onCloseRef.current();
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (window.history.state?.[MARKER]) {
        window.history.back();
      }
    };
  }, [isOpen]);
}
