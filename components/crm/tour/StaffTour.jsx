"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useCrmStore } from "@/lib/crm/store";

// ייבוא דינמי בלבד בצד הלקוח - הספרייה נשענת על window/document ולא תואמת ל-build הסטטי בזמן ה-SSR
const Joyride = dynamic(() => import("react-joyride"), { ssr: false });

const TOUR_SEEN_PREFIX = "shiduch-crm-staff-tour-seen:";

// תחנה שמוצגת במרכז המסך, בלי להצביע על אלמנט מסוים.
// משמשת גם כגיבוי כשאין עדיין מועמדים במאגר ואין על מה להצביע.
const centerStep = (title, content) => ({
  target: "body",
  placement: "center",
  disableBeacon: true,
  title,
  content,
});

const pointStep = (selector, title, content) => ({
  target: `[data-tour="${selector}"]`,
  disableBeacon: true,
  title,
  content,
});

// הסיור מותאם להרשאות: שגריר/ה מקבל/ת הדרכה אך ורק על מסכים שפתוחים לו/ה.
// תחנות של מנהלת (לוח בקרה, דוח שיוכים, לוח הבקשות החסוי) נבנות רק כש-isAdmin.
function buildSteps({ hasCards, hasReferenceContacts, hasContactStaff, isAdmin }) {
  const steps = [
    centerStep(
      "ברוכה הבאה למאגר השידוכים",
      isAdmin
        ? "סיור קצר על כל הכלים, כולל אזורי הניהול. אפשר לעצור ב\"דילוג\"."
        : "סיור קצר על הכלים המרכזיים. אפשר לעצור בכל רגע ב\"דילוג\"."
    ),
    pointStep(
      "tour-search",
      "חיפוש מהיר לפי שם",
      "מקלידים שם, והרשימה מסתננת מיד."
    ),
    pointStep(
      "tour-filter",
      "סינון מתקדם",
      "סינון לפי גיל, גובה, רמת דתיות ואזור. נשאר פעיל עד שמאפסים."
    ),
    pointStep(
      "tour-tabs",
      "הצעות חדשות מול הצעות קודמות",
      "\"חדשות\" - מי שטרם טופל. \"קודמות\" - מי שכבר הוצע בעבר."
    ),
    pointStep(
      "tour-gender",
      "מעבר בין מאגר בנים למאגר בנות",
      "מחליף בין שני המאגרים. שימי לב שסינון הדתיות מתאפס."
    ),
  ];

  if (hasCards) {
    steps.push(
      pointStep(
        "tour-card-info",
        "איך קוראים כרטיס מועמד/ת",
        "מעל התמונה: גיל, גובה, עדה ועיר. בפינה: תוויות \"חדש\", זרם וזמינות."
      ),
      pointStep(
        "tour-favorite-heart",
        "מועדפים - רשימת העבודה האישית שלך",
        "הלב שומר לרשימה אישית שרק את רואה. זו רשימת העבודה שלך."
      ),
      pointStep(
        "tour-read-more",
        "פתיחת הפרופיל המלא",
        "פותח את כל הפרטים והתמונות. כדאי לקרוא לפני כל הצעה."
      ),
      pointStep(
        "tour-staff-toggle",
        "האזור הפנימי לצוות",
        isAdmin
          ? "גלוי לצוות בלבד: הקלטות, סטטוס, הערות, בירורים, ושיוך נציג/ה מלווה."
          : "מידע שגלוי לצוות בלבד: הקלטות, סטטוס, הערות ומספרים לבירורים."
      ),
      pointStep(
        "tour-voice-notes",
        "הקלטות שמע",
        "האזנה להקלטות קיימות, או הוספת הקלטה חדשה."
      )
    );

    // שיוך נציג/ה מלווה הוא פעולה של המנהלת בלבד, ולכן התחנה הזו כלל אינה
    // נבנית עבור אשת צוות - גם לא בגרסה "רכה" של צפייה בלבד.
    if (isAdmin) {
      steps.push(
        hasContactStaff
          ? pointStep(
              "tour-contact-staff",
              "נציג/ה מלווה",
              "מי מהצוות מלווה את המועמד/ת. השיוך נעשה באזור הפנימי שבכרטיס."
            )
          : centerStep(
              "נציג/ה מלווה",
              "לכל מועמד/ת אפשר לשייך נציג/ה מלווה, מתוך האזור הפנימי שבכרטיס."
            )
      );
    }

    steps.push(
      hasReferenceContacts
        ? pointStep(
            "tour-reference-contacts",
            "מספרים לבירורים",
            "אנשי הקשר לבירור, עם כפתור שמעתיק הכל בלחיצה. חסוי לצוות."
          )
        : centerStep(
            "מספרים לבירורים",
            "יופיעו באזור הפנימי לצוות, עם כפתור שמעתיק הכל בלחיצה. חסוי לצוות."
          )
    );
  } else {
    steps.push(
      centerStep(
        "כרטיסי המועמדים",
        "כשיהיו מועמדים, כל כרטיס יציג גיל, גובה, עדה ועיר, ותוויות בפינה."
      ),
      centerStep(
        "מועדפים - רשימת העבודה שלך",
        "הלב שבכרטיס שומר לרשימה אישית שרק את רואה."
      ),
      centerStep(
        "האזור הפנימי לצוות",
        "אזור נפתח בכל כרטיס, גלוי לצוות בלבד: הקלטות, סטטוס, הערות ובירורים."
      )
    );
    if (isAdmin) {
      steps.push(
        centerStep(
          "נציג/ה מלווה",
          "לכל מועמד/ת אפשר לשייך נציג/ה מלווה, מתוך האזור הפנימי שבכרטיס."
        )
      );
    }
  }

  steps.push(
    pointStep(
      "tour-nav-favorites",
      "לשונית המועדפים",
      "כל מי שסימנת בלב. רשימה פרטית שלך - נוח למעקב יומי."
    ),
    pointStep(
      "tour-nav-matches",
      "מבחן ההתאמות - איך מוצאים שידוך",
      "שאלון קצר על מה שמחפשים, כולל סגנון חיים, והמערכת מדרגת התאמות."
    ),
    pointStep(
      "tour-nav-proposals",
      "שידוכים - מעקב אחרי הצעה",
      "מעקב בשישה שלבים עם רציונל. אפשר גם להציע מישהו/י מהמעגל האישי."
    ),
    pointStep(
      "tour-nav-my-candidates",
      "\"שלי\" - המועמדים שבאחריותך",
      isAdmin
        ? "כל המועמדים המשויכים, מקובצים לפי נציג/ה, עם חיוג, וואטסאפ ו-SMS."
        : "המועמדים שאת/ה מלווה, עם חיוג, וואטסאפ ו-SMS בלחיצה אחת."
    ),
    pointStep(
      "tour-nav-tasks",
      "משימות - שלא ייפול כלום",
      isAdmin
        ? "כל משימות הצוות. אפשר לפתוח משימה ולשייך אותה לאשת צוות מסוימת."
        : "כאן רק המשימות שלך. אחרים לא רואים אותן, וגם את/ה לא רואה אחרות."
    ),
    pointStep(
      "tour-nav-requests",
      "בקשות מיוחדות",
      isAdmin
        ? "כאן מרוכזות כל בקשות הצוות, עם סימון \"חדש\", \"בטיפול\" ו\"טופל\"."
        : "מגישים כאן בקשה עבור מועמד/ת. היא נשלחת ישירות למנהלת בלבד."
    )
  );

  if (isAdmin) {
    steps.push(
      pointStep(
        "tour-nav-dashboard",
        "לוח בקרה - למנהלת בלבד",
        "הרשאות כניסה, יעדים, תקנון, טיפים וכספים. הצוות אינו רואה מסך זה."
      ),
      centerStep(
        "דוח שיוכים",
        "בראש לוח הבקרה: מי מלווה את מי, מי נשאר בלי שיוך, והורדה כ-PDF או הדפסה."
      )
    );
  }

  steps.push(
    pointStep(
      "tour-nav-profiles",
      "חזרה למאגר",
      "מחזיר תמיד למסך הבית של המערכת."
    )
  );

  steps.push(
    centerStep(
      "טיפים ועזרה",
      "קופסת הטיפים בראש המאגר, וסימן השאלה מפעיל את הסיור מחדש מכל מסך."
    ),
    centerStep(
      "זהו, סיימנו!",
      "מאגר ← מסמנים בלב ← מבחן התאמות ← יוצרים הצעה ← עוקבים ← פותחים משימה. בהצלחה!"
    )
  );

  return steps;
}

export default function StaffTour() {
  const role = useCrmStore((s) => s.role);
  const currentUser = useCrmStore((s) => s.currentUser);
  const board = useCrmStore((s) => s.board);
  const allCandidates = useCrmStore((s) => s.allCandidates);
  const expandedId = useCrmStore((s) => s.expandedStaffAreaId);
  const toggleStaffArea = useCrmStore((s) => s.toggleStaffArea);
  const tourTick = useCrmStore((s) => s.tourTick);

  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [steps, setSteps] = useState([]);
  const lastTick = useRef(0);

  const email = currentUser()?.email || null;
  const storageKey = email ? `${TOUR_SEEN_PREFIX}${email}` : null;

  const startTour = () => {
    // פותחים את האזור הפנימי של הכרטיס הראשון, כדי שתחנות ההקלטות והבירורים
    // יוכלו להצביע על אלמנטים שקיימים בפועל על המסך.
    const list = allCandidates ? allCandidates(board) : [];
    const first = list[0];
    if (first && expandedId !== first.id) {
      toggleStaffArea(first.id);
    }
    setTimeout(() => {
      const hasCards = !!document.querySelector('[data-tour="tour-card-info"]');
      const hasReferenceContacts = !!document.querySelector('[data-tour="tour-reference-contacts"]');
      const hasContactStaff = !!document.querySelector('[data-tour="tour-contact-staff"]');
      setSteps(buildSteps({ hasCards, hasReferenceContacts, hasContactStaff, isAdmin: role === "admin" }));
      setStepIndex(0);
      setRun(true);
    }, 400);
  };

  // הפעלה יזומה מכפתור סימן השאלה שבסרגל הכפתורים הצפים
  useEffect(() => {
    if (tourTick === 0 || tourTick === lastTick.current) return;
    lastTick.current = tourTick;
    setRun(false);
    startTour();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourTick]);

  // הפעלה אוטומטית פעם אחת בלבד, בכניסה הראשונה של אשת צוות
  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    if (role !== "staff" && role !== "admin") return;
    if (window.localStorage.getItem(storageKey)) return;
    const t = setTimeout(() => {
      startTour();
      window.localStorage.setItem(storageKey, "1");
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, role]);

  if (role !== "staff" && role !== "admin") return null;

  // Joyride מדלג לשלב הבא בעצמו, אבל כשהתחנה הבאה נטענת לפני שהקודמת יורדת
  // מהמסך נוצרת חפיפה של שתי חלוניות. לכן שולטים בשלב ידנית: מורידים את
  // החלונית הנוכחית, מקדמים את המונה, ורק אז מציגים את הבאה.
  const handleCallback = (data) => {
    const { status, type, action, index } = data;

    if (status === "finished" || status === "skipped" || action === "close") {
      setRun(false);
      setStepIndex(0);
      return;
    }

    if (type === "step:after") {
      const next = index + (action === "prev" ? -1 : 1);
      setRun(false);
      setTimeout(() => {
        setStepIndex(next);
        setRun(true);
      }, 120);
      return;
    }

    if (type === "error:target_not_found") {
      const next = index + (action === "prev" ? -1 : 1);
      setStepIndex(next);
    }
  };

  return (
    <Joyride
      run={run}
      steps={steps}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      disableScrollParentFix
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
        tooltipTitle: { fontSize: 17, fontWeight: 700, color: "#5E2F2D" },
        tooltipContent: { fontSize: 14, lineHeight: 1.7, paddingTop: 6 },
        buttonNext: { borderRadius: 12, padding: "9px 16px" },
        buttonBack: { color: "#7C6E60" },
        buttonSkip: { color: "#7C6E60" },
      }}
    />
  );
}
