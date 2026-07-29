"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";

// ייבוא דינמי בלבד בצד הלקוח - הספרייה נשענת על window/document ולא תואמת ל-build הסטטי בזמן ה-SSR
const Joyride = dynamic(() => import("react-joyride"), { ssr: false });

const TOUR_SEEN_PREFIX = "shiduch-crm-staff-tour-seen:";

// כל התחנות מותאמות אך ורק לצוות - שום התייחסות לעריכה, מחיקה או ניהול שמיועדים למנהלת בלבד.
function buildSteps({ hasCards, hasReferenceContacts }) {
  const steps = [
    {
      target: "body",
      placement: "center",
      disableBeacon: true,
      title: "ברוכה הבאה למאגר השידוכים",
      content: "בואי נעשה סיור קצר על הכלים המרכזיים שישמשו אותך בעבודה היומיומית. זה ייקח פחות מדקה.",
    },
    {
      target: '[data-tour="tour-search"]',
      disableBeacon: true,
      title: "חיפוש מהיר",
      content: "כאן אפשר לחפש מועמד/ת ספציפית לפי שם. התוצאות מסתננות מיד תוך כדי ההקלדה.",
    },
    {
      target: '[data-tour="tour-filter"]',
      disableBeacon: true,
      title: "סינון הצעות",
      content: "לחיצה כאן פותחת סינון לפי גיל, גובה, רמת דתיות ואזור מגורים, כדי למצוא במהירות את ההצעות המתאימות.",
    },
    {
      target: '[data-tour="tour-tabs"]',
      disableBeacon: true,
      title: "הצעות חדשות מול קודמות",
      content: "בלשונית \"הצעות חדשות\" רואים מועמדים שטרם נבדקו. בלשונית \"הצעות קודמות\" רואים מי שכבר הועבר/ה בעבר.",
    },
    {
      target: '[data-tour="tour-gender"]',
      disableBeacon: true,
      title: "מעבר בין מאגרים",
      content: "כאן עוברים בין מאגר הבחורים למאגר הבחורות.",
    },
  ];

  if (hasCards) {
    steps.push(
      {
        target: '[data-tour="tour-card-info"]',
        disableBeacon: true,
        title: "קריאת כרטיס מועמד/ת",
        content: "על גבי כל תמונה מוצגים בבירור הגיל, הגובה, העדה ומקום המגורים הספציפי של המועמד/ת.",
      },
      {
        target: '[data-tour="tour-favorite-heart"]',
        disableBeacon: true,
        title: "מועדפים",
        content: "לחיצה על הלב שומרת את המועמד/ת באזור ה\"מועדפים\", לגישה מהירה בכל רגע דרך התפריט התחתון.",
      },
      {
        target: '[data-tour="tour-read-more"]',
        disableBeacon: true,
        title: "צפייה בפרופיל המלא",
        content: "לחיצה על הכפתור הזה פותחת את הפרופיל המלא, עם כל הפרטים והתמונות הנוספות.",
      },
      {
        target: '[data-tour="tour-staff-toggle"]',
        disableBeacon: true,
        title: "אזור פנימי לצוות",
        content: "כאן נמצאים כלי העבודה הפנימיים שלך: הקלטות שמע, סטטוס פניות, הערות ומספרים לבירורים.",
      },
      {
        target: '[data-tour="tour-voice-notes"]',
        disableBeacon: true,
        title: "הקלטות שמע",
        content: "כאן אפשר להאזין להקלטות קיימות של המועמד/ת, ולהוסיף הקלטה חדשה בלחיצת כפתור.",
      }
    );

    if (hasReferenceContacts) {
      steps.push({
        target: '[data-tour="tour-reference-contacts"]',
        disableBeacon: true,
        title: "מספרים לבירורים",
        content:
          "כאן מופיעים פרטי אנשי הקשר לבירור על המועמד/ת. לחיצה על כפתור ההעתקה מעתיקה את כל המידע ללוח בלחיצה אחת - נוח לשליחה בוואטסאפ או בהודעה.",
      });
    } else {
      steps.push({
        target: "body",
        placement: "center",
        disableBeacon: true,
        title: "מספרים לבירורים",
        content:
          "בכרטיסים שבהם מולאו פרטי אנשי קשר לבירור, הם יופיעו באזור הפנימי לצוות יחד עם כפתור העתקה מהיר שמעתיק את כל המידע בלחיצה אחת.",
      });
    }
  }

  steps.push(
    {
      target: '[data-tour="tour-nav-matches"]',
      disableBeacon: true,
      title: "מבחן התאמות",
      content:
        "כאן נמצא מבחן ההתאמות - שאלון קצר בן 7 שאלות. ממלאים אותו עבור מועמד/ת מסוימת, והמערכת מציגה מולו/ה את ההצעות הכי מתאימות מהמאגר לפי ההעדפות שהוזנו, כדי לעזור לייצר שידוך פוטנציאלי.",
    },
    {
      target: '[data-tour="tour-nav-proposals"]',
      disableBeacon: true,
      title: "מסך התאמות (שידוכים)",
      content:
        "אחרי שנוצרה הצעת התאמה בין שני מועמדים, כאן עוקבים אחריה: מעדכנים סטטוס (הוצע, נפגשו, מתקדמים ועוד), משייכים אישית לצוות, ורואים יומן התקדמות מלא לכל הצעה.",
    },
    {
      target: '[data-tour="tour-nav-tasks"]',
      disableBeacon: true,
      title: "משימות",
      content:
        "כאן מנהלים את המשימות השוטפות שלך מול המועמדים - כמו שיחות בירור לתאם. אפשר לסמן משימה כהושלמה, ולראות משימות שהמנהלת שייכה במיוחד אלייך.",
    }
  );

  steps.push({
    target: "body",
    placement: "center",
    disableBeacon: true,
    title: "זהו, סיימנו!",
    content: "עכשיו את מכירה את הכלים המרכזיים. אם תרצי לראות את ההדרכה שוב בכל שלב, לחצי על סימן השאלה שבפינת המסך.",
  });

  return steps;
}

export default function StaffTour() {
  const role = useCrmStore((s) => s.role);
  const currentUser = useCrmStore((s) => s.currentUser);
  const board = useCrmStore((s) => s.board);
  const candidates_ = useCrmStore((s) => s.candidates);
  const allCandidates = useCrmStore((s) => s.allCandidates);
  const expandedId = useCrmStore((s) => s.expandedStaffAreaId);
  const toggleStaffArea = useCrmStore((s) => s.toggleStaffArea);

  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);

  const email = role === "staff" ? currentUser()?.email : null;
  const storageKey = email ? `${TOUR_SEEN_PREFIX}${email}` : null;

  const startTour = () => {
    const list = allCandidates(board);
    const first = list[0];
    if (first && expandedId !== first.id) {
      toggleStaffArea(first.id);
    }
    setTimeout(() => {
      const hasCards = !!document.querySelector('[data-tour="tour-card-info"]');
      const hasReferenceContacts = !!document.querySelector('[data-tour="tour-reference-contacts"]');
      setSteps(buildSteps({ hasCards, hasReferenceContacts }));
      setRun(true);
    }, 300);
  };

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    const seen = window.localStorage.getItem(storageKey);
    if (seen) return;
    const t = setTimeout(() => {
      startTour();
      window.localStorage.setItem(storageKey, "1");
    }, 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  if (role !== "staff" && role !== "admin") return null;

  const handleCallback = (data) => {
    if (data.status === "finished" || data.status === "skipped") {
      setRun(false);
    }
  };

  return (
    <>
      <button
        onClick={startTour}
        aria-label={role === "admin" ? "הפעלת סיור הדרכה - תצוגת צוות" : "הפעלת סיור הדרכה"}
        className="safe-bottom fixed bottom-28 left-20 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-[#844442] text-white shadow-lg transition active:scale-90"
      >
        <HelpCircle size={20} />
      </button>

      <Joyride
        run={run}
        steps={steps}
        continuous
        showSkipButton
        showProgress
        scrollToFirstStep
        callback={handleCallback}
        locale={{
          back: "חזרה",
          close: "סגירה",
          last: "סיום",
          next: "הבא",
          nextLabelWithProgress: "הבא ({step} מתוך {steps})",
          skip: "דילוג",
        }}
        styles={{
          options: { primaryColor: "#844442", zIndex: 10000, arrowColor: "#fff", textColor: "#3A2E26" },
          tooltip: { direction: "rtl", textAlign: "right", borderRadius: 16 },
          buttonNext: { borderRadius: 12 },
        }}
      />
    </>
  );
}
