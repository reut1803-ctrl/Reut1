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

// כל התחנות מותאמות לעבודת הצוות - בלי התייחסות לפעולות שמיועדות למנהלת בלבד.
function buildSteps({ hasCards, hasReferenceContacts }) {
  const steps = [
    centerStep(
      "ברוכה הבאה למאגר השידוכים",
      "נעבור יחד על כל הכלים שישמשו אותך בעבודה היומיומית: איך למצוא מועמדים, איך לקרוא כרטיס, איך לשמור מועדפים, איך עובד מבחן ההתאמות, איך עוקבים אחרי שידוך ואיך מנהלים משימות. הסיור לוקח כשתי דקות, ואפשר לעצור אותו בכל רגע בלחיצה על \"דילוג\"."
    ),
    pointStep(
      "tour-search",
      "חיפוש מהיר לפי שם",
      "כשאת כבר יודעת את מי את מחפשת - פשוט מקלידה כאן את השם או שם המשפחה. הרשימה מסתננת מיד תוך כדי ההקלדה, בלי צורך ללחוץ על כלום. למחיקת החיפוש פשוט מוחקים את הטקסט."
    ),
    pointStep(
      "tour-filter",
      "סינון מתקדם",
      "כשאת מחפשת התאמה ולא אדם מסוים - לחיצה כאן פותחת חלונית סינון. אפשר להגדיר טווח גיל, טווח גובה, רמת דתיות ואזור מגורים. הסינון נשאר פעיל עד שמאפסים אותו, כך שאפשר לעבור בין המאגרים בלי לאבד אותו."
    ),
    pointStep(
      "tour-tabs",
      "הצעות חדשות מול הצעות קודמות",
      "\"הצעות חדשות\" מציגה מועמדים שעדיין לא טיפלת בהם - שם מתחילים. \"הצעות קודמות\" מציגה את מי שכבר עבר טיפול או הוצע בעבר, לחזרה ובדיקה מחדש. שימי לב איזו לשונית מודגשת, כי היא קובעת מה את רואה."
    ),
    pointStep(
      "tour-gender",
      "מעבר בין מאגר בנים למאגר בנות",
      "המערכת מחזיקה שני מאגרים נפרדים. הכפתור הזה מחליף ביניהם. חשוב לדעת: המעבר מאפס את סינון רמת הדתיות, כי המונחים שונים בין המאגרים (למשל \"תורני\" מול \"תורנית\")."
    ),
  ];

  if (hasCards) {
    steps.push(
      pointStep(
        "tour-card-info",
        "איך קוראים כרטיס מועמד/ת",
        "השורה שמעל התמונה היא התקציר המהיר: גיל, גובה, עדה ועיר מגורים. מתחת מופיעים השם ומשפט תיאור קצר. בפינה העליונה יש תוויות צבעוניות - \"חדש\" למי שטרם טופל, תווית הזרם או ההשקפה, ותווית זמינות בירוק שמראה אם המועמד/ת פנוי/ה כרגע להצעות."
      ),
      pointStep(
        "tour-favorite-heart",
        "מועדפים - רשימת העבודה האישית שלך",
        "לחיצה על הלב מסמנת מועמד/ת כמועדפ/ת. זו רשימה אישית לגמרי - רק את רואה אותה, וכל אשת צוות מנהלת רשימה משלה. השתמשי בזה כרשימת עבודה: מי שאת מטפלת בו/ה כרגע או רוצה לחזור אליו/ה. את כל המסומנים תמצאי בלשונית \"מועדפים\" בתפריט התחתון. לחיצה נוספת על הלב מסירה מהרשימה."
      ),
      pointStep(
        "tour-read-more",
        "פתיחת הפרופיל המלא",
        "הכרטיס מציג רק תקציר. לחיצה כאן פותחת את הפרופיל המלא: כל התמונות, ההשכלה, העיסוק, ההעדפות ומה שהמועמד/ת מחפש/ת. לפני כל שיחה או הצעה - כדאי לפתוח ולקרוא הכל."
      ),
      pointStep(
        "tour-staff-toggle",
        "האזור הפנימי לצוות",
        "כאן נמצא המידע שגלוי לצוות בלבד ואף פעם לא למועמדים: הקלטות שמע, סטטוס הפניות, הערות פנימיות ומספרי טלפון לבירורים. לחיצה פותחת וסוגרת את האזור."
      ),
      pointStep(
        "tour-voice-notes",
        "הקלטות שמע",
        "כאן אפשר להאזין להקלטות קיימות של המועמד/ת - למשל הקלטה שבה הוא/היא מספר/ת על עצמו/ה. אפשר גם להקליט חדש ישירות מהטלפון בלחיצה על כפתור ההקלטה. זה חוסך המון זמן לעומת קריאת טקסט."
      )
    );

    steps.push(
      hasReferenceContacts
        ? pointStep(
            "tour-reference-contacts",
            "מספרים לבירורים",
            "אלה אנשי הקשר לבירור על המועמד/ת - רב, מורה, חברה או בן משפחה. כפתור ההעתקה מעתיק את כל הפרטים בלחיצה אחת, כך שאפשר להדביק ישר בוואטסאפ בלי להקליד מחדש. המספרים האלה חסויים ואינם יוצאים מהצוות."
          )
        : centerStep(
            "מספרים לבירורים",
            "בכרטיסים שבהם מולאו אנשי קשר לבירור, הם יופיעו באזור הפנימי לצוות - יחד עם כפתור העתקה שמעתיק את כל הפרטים בלחיצה אחת, נוח לשליחה בוואטסאפ. המידע הזה חסוי ואינו יוצא מהצוות."
          )
    );
  } else {
    steps.push(
      centerStep(
        "כרטיסי המועמדים",
        "המאגר ריק כרגע, אז אין כרטיס להדגים עליו. כשיהיו מועמדים, כל כרטיס יציג גיל, גובה, עדה ועיר מעל התמונה, ותוויות צבעוניות בפינה: \"חדש\" למי שטרם טופל, תווית הזרם, ותווית זמינות בירוק."
      ),
      centerStep(
        "מועדפים - רשימת העבודה שלך",
        "על כל כרטיס יש סמל לב. לחיצה עליו שומרת את המועמד/ת ברשימת המועדפים האישית שלך - רק את רואה אותה, ולכל אשת צוות יש רשימה נפרדת. זו למעשה רשימת העבודה שלך: מי שאת מטפלת בו/ה כרגע. הרשימה נמצאת בלשונית \"מועדפים\" בתפריט התחתון."
      ),
      centerStep(
        "האזור הפנימי לצוות",
        "בכל כרטיס יש אזור נפתח שגלוי לצוות בלבד: הקלטות שמע של המועמד/ת, סטטוס פניות, הערות פנימיות, ומספרי טלפון לבירורים עם כפתור העתקה מהיר. המידע הזה חסוי ולעולם אינו מוצג למועמדים."
      )
    );
  }

  steps.push(
    pointStep(
      "tour-nav-favorites",
      "לשונית המועדפים",
      "כאן מרוכזים כל המועמדים שסימנת בלב. זו רשימה אישית ופרטית שלך בלבד. השתמשי בה כרשימת המעקב היומית: מי ממתין לתשובה, למי הבטחת לחזור, ומי בתהליך. להסרה מהרשימה - לוחצים שוב על הלב."
    ),
    pointStep(
      "tour-nav-matches",
      "מבחן ההתאמות - איך מוצאים שידוך",
      "זה הכלי החכם של המערכת. בוחרים מועמד/ת, ועונים על שאלון קצר בן 7 שאלות על מה שמחפשים: טווח גיל, טווח גובה, רמת דתיות, אזור מגורים, השכלה, יחס לעישון ותכונות אופי. המערכת סורקת את כל המאגר ומציגה את ההצעות המתאימות ביותר, מדורגות. משם אפשר לעבור ישר ליצירת הצעת שידוך."
    ),
    pointStep(
      "tour-nav-proposals",
      "שידוכים - מעקב אחרי הצעה",
      "אחרי שיצרת הצעה בין בחור לבחורה, כאן עוקבים אחריה לאורך הדרך. כל הצעה מתקדמת בשישה שלבים: הוצע, בבדיקה, הוחלפו פרטים, נפגשו, בהמשך ומתקדמים, ואירוסין. לוחצים על השלב כדי לעדכן. לכל הצעה יש \"רציונל\" - למה חשבת שזה מתאים, וגם יומן התקדמות שבו רושמים מה קרה בכל שיחה. אפשר גם לראות מי מהצוות מטפל/ת בהצעה, ולהעתיק את פרטי שני הצדדים בלחיצה."
    ),
    pointStep(
      "tour-nav-tasks",
      "משימות - שלא ייפול כלום",
      "כאן מנהלים את המעקב היומי: להתקשר לבירור, לחזור למועמדת, לתאם פגישה. לכל משימה יש תאריך יעד, וניתן לקשר אותה למועמד/ת ספציפי/ת - כך שרואים מיד את הטלפון וקישור לכרטיס בלי לחפש. סימון V מסמן שהמשימה הושלמה. חשוב: המנהלת יכולה לשייך משימות ישירות אלייך, והן יופיעו כאן - אז שווה להציץ כל בוקר."
    ),
    pointStep(
      "tour-nav-profiles",
      "חזרה למאגר",
      "הלשונית הזו מחזירה אותך תמיד למאגר המועמדים - מסך הבית של המערכת. משם מתחילים כל תהליך."
    )
  );

  steps.push(
    centerStep(
      "טיפים ועזרה",
      "בראש מסך המאגר מופיעה קופסת \"טיפ בשידוכים\" - טיפים מקצועיים שהמנהלת מוסיפה לצוות. אם יש כמה טיפים, אפשר לדפדף ביניהם. וכפתור סימן השאלה שבפינה השמאלית התחתונה מפעיל את הסיור הזה מחדש בכל רגע, מכל מסך במערכת."
    ),
    centerStep(
      "זהו, סיימנו!",
      "עכשיו את מכירה את כל הכלים. סדר עבודה מומלץ: מתחילים במאגר, מסמנים בלב את מי שמטפלים בו, משתמשים במבחן ההתאמות כדי למצוא התאמה, יוצרים הצעה ועוקבים אחריה במסך השידוכים, ופותחים משימה לכל דבר שדורש חזרה. בהצלחה!"
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
      setSteps(buildSteps({ hasCards, hasReferenceContacts }));
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

  const handleCallback = (data) => {
    if (data.status === "finished" || data.status === "skipped") {
      setRun(false);
    }
  };

  return (
    <Joyride
      run={run}
      steps={steps}
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
