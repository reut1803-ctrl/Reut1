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

// כשאנחנו עצמנו מבצעים "חזור" בסגירה, הדפדפן מודיע על כך רגע אחר כך.
// ההודעה הזו אינה לחיצה של המשתמש/ת, ואסור לה לסגור חלונית אחרת שנפתחה
// בינתיים. בלי הסימון הזה, פתיחת חלונית מיד אחרי סגירת קודמתה הייתה
// נסגרת מעצמה באותו רגע.
let selfBackPending = false;

export function useBackToClose(isOpen, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    window.history.pushState({ [MARKER]: true }, "");

    const handlePopState = () => {
      if (selfBackPending) {
        selfBackPending = false;
        return;
      }
      onCloseRef.current();
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (window.history.state?.[MARKER]) {
        selfBackPending = true;
        // רשת ביטחון: אם מסיבה כלשהי לא תגיע הודעה מהדפדפן, הסימון מתנקה
        // מעצמו כדי שלחיצת "חזור" אמיתית לא תיבלע.
        setTimeout(() => {
          selfBackPending = false;
        }, 500);
        window.history.back();
      }
    };
  }, [isOpen]);
}
