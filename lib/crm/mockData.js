// נתוני דמה להדגמת המערכת - CRM שידוכים
// כל התוכן כאן פיקטיבי לחלוטין ומיועד להדגמה בלבד.

export const ADMIN_USER = {
  id: "admin-reut",
  name: "רעות",
  role: "admin",
  email: "reut@example.com",
  phone: "050-1234567",
  joinDate: "2023-01-15",
};

export const STAFF_USERS = [
  { id: "staff-roni", name: "רוני", role: "staff", email: "roni@example.com", phone: "050-2223344", joinDate: "2023-03-01" },
  { id: "staff-ohad", name: "אוהד", role: "staff", email: "ohad@example.com", phone: "050-3334455", joinDate: "2023-05-20" },
  { id: "staff-elazar", name: "אלעזר", role: "staff", email: "elazar@example.com", phone: "050-4445566", joinDate: "2023-08-10" },
];

export const VIEWER_USER = {
  id: "viewer-guest",
  name: "אורחת",
  role: "viewer",
  email: "guest@example.com",
  phone: "050-0000000",
  joinDate: "2024-02-01",
};

export const ALL_DEMO_USERS = [ADMIN_USER, ...STAFF_USERS, VIEWER_USER];

export const REGIONS = ["ירושלים", "מרכז", "שפלה", "שרון", "דרום", "צפון"];
export const RELIGIOUS_LEVELS = ["חרד\"ל", "תורני", "דתי", "הכל"];
export const EDUCATION_OPTIONS = ["סמינר / מכינה", "לומד בישיבה / כולל", "תואר ראשון", "תואר שני ומעלה", "עובד, לא לומד", "לא משנה"];
export const YESHIVA_LEVELS = ["ישיבה גבוהה", "הסדר", "עובד ולומד", "עובד", "לא משנה"];
export const SMOKING_OPTIONS = ["לא מעשן - חובה", "לא מפריע לי", "לא משנה"];
export const TRAITS = ["הומור", "רוגע", "משפחתיות", "רגישות", "שאפתנות", "רוחניות", "ביטחון עצמי", "מנהיגות"];

const maleNames = ["יונתן כהן", "עידו לוי", "דניאל ברק", "נריה אשכנזי", "אורי שפירא", "בנימין הלר", "שלומי אזולאי", "מאור ביטון"];
const femaleNames = ["שירה מזרחי", "נועה גולן", "תמר וייס", "אביגיל רוזן", "יעל שמעוני", "מיכל דגן", "עדי פרידמן", "רותם כרמלי"];

// אינדקס בלבד - מיפוי הצבע בפועל נמצא ב-components/crm/ui/gradients.js
// (Tailwind סורק מחלקות רק מתוך app/ ו-components/, לא מתוך lib/)
function seededImageGradient(seed) {
  return seed % 8;
}

function fakePhone(gender, i) {
  const prefix = gender === "male" ? "052" : "054";
  const num = (2000000 + i * 111111) % 10000000;
  return `${prefix}-${String(num).padStart(7, "0")}`;
}

function buildCandidates(names, gender) {
  return names.map((name, i) => {
    const age = gender === "male" ? 24 + (i % 8) : 21 + (i % 8);
    const height = gender === "male" ? 172 + (i % 15) : 158 + (i % 15);
    return {
      id: `${gender}-${i + 1}`,
      gender,
      name,
      initials: name.split(" ").map((p) => p[0]).join(""),
      age,
      height,
      phone: fakePhone(gender, i),
      region: REGIONS[i % REGIONS.length],
      religiousLevel: RELIGIOUS_LEVELS[i % RELIGIOUS_LEVELS.length],
      education: EDUCATION_OPTIONS[i % (EDUCATION_OPTIONS.length - 1)],
      yeshivaLevel: gender === "male" ? YESHIVA_LEVELS[i % (YESHIVA_LEVELS.length - 1)] : undefined,
      smoking: SMOKING_OPTIONS[i % SMOKING_OPTIONS.length],
      traits: [TRAITS[i % TRAITS.length], TRAITS[(i + 3) % TRAITS.length]],
      isNew: i < 3,
      isPrevious: i >= 3,
      bio:
        gender === "male"
          ? "בחור נעים הליכות, לומד ברצינות ומחפש בת זוג יציבה ובעלת ערכים דומים. משפחה חמה ותומכת."
          : "בחורה עדינה ורגישה, בעלת חוש הומור ואישיות חמה. מחפשת בן זוג שאפתן עם רגליים על הקרקע.",
      gradient: seededImageGradient(i),
      matchScore: 65 + ((i * 7) % 34),
      staffNote:
        i % 2 === 0
          ? "דיברתי עם האמא - ממתינים לתשובה עד סוף השבוע. רושם ראשוני מצוין!"
          : "צריך לבדוק המלצות נוספות לפני שממשיכים הלאה.",
      adminNote: i % 3 === 0 ? "לחזור אליה אחרי החג, לא לשכוח!" : "",
      voiceNotes:
        i % 2 === 0
          ? [
              { id: `vn-${gender}-${i}-1`, author: "רוני", duration: "0:42", date: "2026-07-02" },
              { id: `vn-${gender}-${i}-2`, author: "אוהד", duration: "1:15", date: "2026-07-05" },
            ]
          : [],
    };
  });
}

export const MALE_CANDIDATES = buildCandidates(maleNames, "male");
export const FEMALE_CANDIDATES = buildCandidates(femaleNames, "female");

export function getCandidates(board) {
  return board === "male" ? MALE_CANDIDATES : FEMALE_CANDIDATES;
}

export const MOCK_NOTIFICATIONS = [
  { id: "n1", title: "הצעות חדשות באתר!", body: "3 מועמדים חדשים נוספו למאגר השבוע.", time: "לפני שעה", read: false },
  { id: "n2", title: "התאמה חדשה", body: "נמצאה התאמה של 87% לפי השאלון שלך.", time: "אתמול", read: false },
  { id: "n3", title: "תזכורת", body: "רעות ביקשה לחזור לאמא של דניאל עד סוף השבוע.", time: "לפני יומיים", read: true },
  { id: "n4", title: "עדכון סטטוס", body: "המעמד עם שירה עבר לשלב פגישה שנייה.", time: "לפני 3 ימים", read: true },
];

export const MOCK_TASKS = [
  { id: "t1", title: "לחזור לאמא של דניאל ברק", dueDate: "2026-07-10", done: false, owner: "רעות" },
  { id: "t2", title: "לתאם פגישה שנייה - שירה ויונתן", dueDate: "2026-07-09", done: false, owner: "רוני" },
  { id: "t3", title: "לבדוק המלצות - עידו לוי", dueDate: "2026-07-12", done: false, owner: "אוהד" },
  { id: "t4", title: "לעדכן תמונה בפרופיל של נועה", dueDate: "2026-07-08", done: true, owner: "אלעזר" },
];

export const DEFAULT_TERMS_TEXT = `נהלי עבודה וסודיות - צוות השידוכים

1. כל מידע אישי על מועמדים ומועמדות (שמות, טלפונים, תמונות, הקלטות) חסוי ואסור בשיתוף מחוץ לצוות.
2. אין להעביר פרטי קשר של מועמד/ת לצד שלישי ללא אישור מפורש מהמנהלת.
3. יש לעדכן סטטוס ותיעוד בכרטיס המועמד/ת באופן שוטף ומיידי לאחר כל שיחה או פגישה.
4. פנייה למועמדים תיעשה בשפה מכבדת ורגישה בכל שלב בתהליך.

באישור התיבה למטה, הנך מאשר/ת שקראת את הנהלים ומתחייב/ת לפעול לפיהם.`;

export const DEFAULT_DAILY_TIP =
  "טיפ השבוע: בשיחה ראשונה עם מועמד/ת חדש/ה, התחילו בשאלות פתוחות על התחביבים והיומיום שלהם לפני שעוברים לשאלות על ציפיות מבן/בת הזוג - זה בונה אמון ומוציא תשובות אמיתיות יותר.";

export const DEFAULT_SERVICE_TYPES = [
  { id: "svc-screening", name: "שיחת סינון", price: 150, commission: 40 },
  { id: "svc-deep", name: "מסלול עומק", price: 600, commission: 150 },
];

export const PAYMENT_STATUSES = ["ממתין לתשלום", "שולם"];

export const DASHBOARD_STATS = {
  closedMatches: 12,
  activeCandidates: MALE_CANDIDATES.length + FEMALE_CANDIDATES.length,
  openTasks: MOCK_TASKS.filter((t) => !t.done).length,
  meetingsThisWeek: 5,
};
