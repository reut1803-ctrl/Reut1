"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const positions = new Map();

// כמה זמן להמתין לאזור הגלילה ולתוכן שלו לפני שמוותרים
const WAIT_MS = 2000;

/**
 * שומרת ומשחזרת את מיקום הגלילה של אלמנט לפי הנתיב הנוכחי.
 * כשגוללים בפיד, נכנסים לכרטיסייה וחוזרים - הגלילה חוזרת לאותה נקודה.
 *
 * שני דברים היו שוברים את זה, ושניהם מטופלים כאן:
 *
 * 1. אזור הגלילה נבנה מאוחר יותר. בטעינה הראשונה מוצג מסך המתנה או מסך כניסה,
 *    ורק אחר כך נבנה אזור התוכן - ולכן בניסיון הראשון לא היה למה להתחבר,
 *    ומיקום הגלילה של המסך הראשון בכלל לא נשמר. לכן ממתינים שהאזור ייווצר.
 *
 * 2. המיקום נשמר ברגע הנכון. בזמן מעבר בין מסכים הדפדפן מאפס את הגלילה לראש
 *    העמוד, וכל שמירה שמתבצעת אחרי הרגע הזה שומרת אפס ומוחקת את המיקום האמיתי.
 *    לכן המיקום נלכד ברגע שבו המשתמש/ת נוגע/ת במסך - עוד לפני שהמעבר התחיל.
 */
export function useScrollRestoration(scrollRef) {
  const pathname = usePathname();
  const key = useRef(pathname);

  useEffect(() => {
    key.current = pathname;
    let cancelled = false;
    let el = null;
    let detach = null;

    const restore = (saved) => {
      // התוכן מגיע מהשרת אחרי שהמסך כבר מוצג, ולכן לרגע העמוד קצר מדי
      // והדפדפן "חותך" את הגלילה חזרה לראש. מנסים שוב עד שיש מספיק תוכן.
      const deadline = Date.now() + WAIT_MS;
      const tryRestore = () => {
        if (cancelled || !el) return;
        if (el.scrollTop > 0) return;
        if (el.scrollHeight - el.clientHeight >= saved) {
          el.scrollTop = saved;
          return;
        }
        if (Date.now() < deadline) requestAnimationFrame(tryRestore);
      };
      requestAnimationFrame(tryRestore);
    };

    const attachDeadline = Date.now() + WAIT_MS;
    const attach = () => {
      if (cancelled) return;
      el = scrollRef.current;
      if (!el) {
        if (Date.now() < attachDeadline) requestAnimationFrame(attach);
        return;
      }

      const saved = positions.get(pathname);
      if (saved > 0) restore(saved);

      // לוכדים את המיקום בכל נגיעה במסך: זה הרגע שלפני כל מעבר מסך, ואז
      // הגלילה עדיין נכונה. בשלב מאוחר יותר הדפדפן כבר מאפס אותה.
      const remember = () => {
        if (el && el.scrollHeight - el.clientHeight > 0) {
          positions.set(key.current, el.scrollTop);
        }
      };
      const EVENTS = ["pointerdown", "touchstart", "scrollend", "keydown"];
      EVENTS.forEach((ev) => el.addEventListener(ev, remember, { passive: true }));
      detach = () => EVENTS.forEach((ev) => el.removeEventListener(ev, remember));
    };
    attach();

    return () => {
      cancelled = true;
      if (detach) detach();
      // גיבוי אחרון, ורק אם המיקום עדיין אמיתי - כדי לא לדרוס באפס
      if (el && el.scrollTop > 0 && el.scrollHeight - el.clientHeight > 0) {
        positions.set(key.current, el.scrollTop);
      }
    };
  }, [pathname, scrollRef]);
}
