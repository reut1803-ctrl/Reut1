"use client";

import { useEffect, useRef } from "react";
import "driver.js/dist/driver.css";

// ----- תחנות הסיור (תבנית גמישה) -----
// להוספת תחנה בעתיד: מוסיפים כאן פריט חדש עם element (בורר CSS), title ו-intro.
// כלל ברזל: אך ורק פיצ'רים הפתוחים לנציגים - בלי שום אזכור של פונקציות ניהול.
const TOUR_STEPS = [
  { element: null, title: "ברוכים הבאים 🌸", intro: "סיור קצר שיכיר לך את המערכת. אפשר לדלג בכל שלב, ולחזור אליו מתי שרוצים." },
  { element: '[data-tour="search"]', title: "חיפוש מועמד", intro: "כאן מחפשים מועמד לפי שם, מקום, עדה, עיסוק או טלפון. החיפוש סורק את כל המאגר." },
  { element: '[data-tour="gender"]', title: "סינון בנים / בנות", intro: "מתג מהיר לסינון הרשימה: «הכל», «בנים» או «בנות». הסינון חל רק על «מועמדים קודמים» - «מועמדים חדשים» תמיד מציג את כולם." },
  { element: '[data-tour="candviews"]', title: "חדשים / קודמים", intro: "«מועמדים חדשים» מציג את המצטרפים האחרונים; «מועמדים קודמים» מציג את שאר המאגר (וגם עליו פועל מתג הסינון)." },
  { element: '[data-tour="add"]', title: "הוספת מועמד", intro: "כאן מוסיפים מועמד חדש וממלאים את הפרטים והשאלון." },
  { element: '[data-tour="tip"]', title: "טיפ בשידוכים", intro: "טיפ שימושי שמתחלף - אפשר להחליק עם האצבע בין כל הטיפים." },
  { element: '[data-tour="nav-candidates"]', title: "מועמדים", intro: "רשימת המועמדים - לחיצה על כרטיס פותחת את כל הפרטים." },
  { element: '[data-tour="nav-matches"]', title: "התאמות", intro: "כאן יוצרים ומנהלים הצעות התאמה - עם נימוק (הרציונל), שלבי התקדמות, פרטי קשר ויומן עדכונים." },
  { element: '[data-tour="nav-tasks"]', title: "משימות", intro: "כאן רשימת המשימות שלך עם תאריכי יעד." },
  { element: '[data-tour="help"]', title: "הסיור תמיד כאן", intro: "בכל רגע אפשר ללחוץ על הכפתור הזה כדי לצפות בסיור שוב." },
];

const SEEN_KEY = "shidduch_tour_seen_v1";
let sessionStarted = false; // גיבוי אם האחסון חסום - שלא יחזור על עצמו באותו ביקור

export default function GuidedTour({ role, onBeforeStart }) {
  const startedRef = useRef(false);

  async function runTour() {
    const { driver } = await import("driver.js");
    // מציגים רק תחנות שהאלמנט שלהן קיים במסך (תחנת הפתיחה ללא אלמנט תמיד מוצגת).
    const steps = TOUR_STEPS
      .filter((s) => !s.element || document.querySelector(s.element))
      .map((s) => ({
        element: s.element || undefined,
        popover: { title: s.title, description: s.intro },
      }));
    const d = driver({
      showProgress: true,
      nextBtnText: "הבא",
      prevBtnText: "הקודם",
      doneBtnText: "סיום",
      progressText: "{{current}} מתוך {{total}}",
      steps,
    });
    d.drive();
  }

  function start() {
    if (onBeforeStart) onBeforeStart();
    // המתנה קצרה כדי שהמסך יתעדכן (מעבר ללשונית המועמדים) לפני תחילת הסיור.
    setTimeout(runTour, 250);
  }

  // קפיצה אוטומטית בכניסה הראשונה - לנציגים בלבד, לעולם לא למנהלת.
  useEffect(() => {
    if (role !== "rep") return;
    if (startedRef.current) return;
    let seen = false;
    try { seen = !!localStorage.getItem(SEEN_KEY); } catch (e) { seen = sessionStarted; }
    if (seen) return;
    startedRef.current = true;
    sessionStarted = true;
    try { localStorage.setItem(SEEN_KEY, "1"); } catch (e) {}
    const t = setTimeout(start, 700); // המתנה לטעינת המסך
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  return (
    <button
      data-tour="help"
      aria-label="עזרה - סיור מודרך"
      onClick={start}
      className="fixed bottom-20 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-roseDark text-xl font-bold text-white shadow-soft"
    >?</button>
  );
}
