"use client";

import { useEffect } from "react";

// נעילת גלילת הרקע — עם מונה, כדי שמודאל בתוך מודאל לא ישחרר את הנעילה מוקדם.
// משתמשים ב-position:fixed על ה-body (ולא רק overflow:hidden) כי ב-iOS Safari
// overflow:hidden לבדו לא עוצר את גלילת הרקע. בסגירה מחזירים את המשתמש לאותה נקודה.
let lockCount = 0;
let savedScrollY = 0;
function lockBody() {
  if (lockCount++ > 0) return;
  savedScrollY = window.scrollY;
  const b = document.body.style;
  b.position = "fixed";
  b.top = `-${savedScrollY}px`;
  b.left = "0";
  b.right = "0";
  b.width = "100%";
  b.overflow = "hidden";
}
function unlockBody() {
  if (--lockCount > 0) return;
  lockCount = 0;
  const b = document.body.style;
  b.position = "";
  b.top = "";
  b.left = "";
  b.right = "";
  b.width = "";
  b.overflow = "";
  window.scrollTo(0, savedScrollY);
}

// מעטפת מודאל גלובלית.
// - גובה דינמי (100dvh) כדי שסרגל הדפדפן במובייל לא יסתיר את התחתית.
// - כותרת קבועה, ותוכן שנגלל בתוך המודאל בלבד (overscroll-contain = בלי "גומי").
// - כפתורי פעולה דביקים: עטפו אותם ב-className="modal-footer" (ראו globals.css).
export default function Modal({ title, onClose, children }) {
  useEffect(() => {
    lockBody();
    return unlockBody;
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex h-[100dvh] items-center justify-center overscroll-contain bg-black/40 p-3"
      onClick={onClose}
    >
      <div
        className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-cream shadow-soft"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-center justify-between px-5 pb-3 pt-5">
          <h2 className="text-lg font-bold text-roseDark">{title}</h2>
          <button onClick={onClose} aria-label="סגירה" className="text-2xl leading-none text-ink/50 hover:text-ink">×</button>
        </div>
        <div className="modal-body min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 [-webkit-overflow-scrolling:touch]">
          {children}
        </div>
      </div>
    </div>
  );
}
