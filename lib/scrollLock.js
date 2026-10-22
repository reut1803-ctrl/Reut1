// נעילת גלילת הרקע כשחלון קופץ פתוח — משותף לכל החלונות באתר.
// משתמשים ב-position:fixed על ה-body (ולא רק overflow:hidden) כי ב-iOS Safari
// overflow:hidden לבדו לא עוצר את גלילת הרקע. בשחרור מחזירים את המשתמש לאותה נקודה.
// עם מונה — כדי שחלון בתוך חלון לא ישחרר את הנעילה מוקדם מדי.
let lockCount = 0;
let savedScrollY = 0;

export function lockBodyScroll() {
  if (typeof document === "undefined") return;
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

export function unlockBodyScroll() {
  if (typeof document === "undefined") return;
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
