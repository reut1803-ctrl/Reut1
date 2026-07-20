// נתוני דמה לתצוגה בלבד — בשלב הבא יוחלפו בנתונים אמיתיים מ-Supabase.

export const ADMIN = {
  id: "admin-1",
  name: "רעות",
  fullName: "רעות כהן",
  role: "admin",
  email: "reut1803@gmail.com",
  phone: "050-1234567",
  joinedAt: "2023-01-15",
};

export const STAFF = [
  { id: "staff-1", name: "רוני", role: "staff" },
  { id: "staff-2", name: "אוהד", role: "staff" },
  { id: "staff-3", name: "אלעזר", role: "staff" },
];

export const VIEWER_DEMO = {
  id: "viewer-1",
  name: "משתמשת",
  role: "viewer",
};

export const REGIONS = ["ירושלים", "מרכז", "שפלה", "שרון", "דרום", "צפון"];

export const RELIGIOUS_LEVELS = ["דתי", "תורני", "חרד\"ל"];

const MALE_NAMES = [
  "יהודה", "נתנאל", "עידו", "שמעון", "אריאל", "בנימין", "יוסף", "עמיחי", "אלישע", "גדי",
];
const FEMALE_NAMES = [
  "שירה", "תמר", "נעמי", "אביגיל", "הדס", "יעל", "רות", "עדי", "מיכל", "אורית",
];

const ABOUT_SNIPPETS = [
  "בחור/ה נעים/ה, בעל/ת חוש הומור, קרוב/ה למשפחה וחברים.",
  "רציני/ת, שאפתן/ית, אוהב/ת ללמוד ולהתפתח כל הזמן.",
  "אווירה חמה, פשוט/ה ואמיתי/ת, מחפש/ת קשר יציב ובריא.",
  "רגוע/ה, קשוב/ה, בעל/ת עולם רוחני עשיר.",
  "בעל/ת ביטחון עצמי, אנרגטי/ת ואוהב/ת אנשים.",
];

function seededScore(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

function buildCandidates(names, gender) {
  const studies = ["ישיבה גבוהה", "הסדר", "עובד ולומד", "עובד"];
  const educations = ["סמינר / מכינה", "לומד בישיבה / כולל", "תואר ראשון", "תואר שני", "עובד/ת"];

  return names.map((name, i) => {
    const seed = `${gender}-${name}-${i}`;
    const h = seededScore(seed);
    const age = 21 + (h % 14);
    const height = gender === "male" ? 168 + (h % 22) : 155 + (h % 20);
    const region = REGIONS[h % REGIONS.length];
    const religiousLevel = RELIGIOUS_LEVELS[h % RELIGIOUS_LEVELS.length];
    return {
      id: `${gender}-${i + 1}`,
      gender,
      name,
      age,
      height,
      region,
      religiousLevel,
      study: gender === "male" ? studies[h % studies.length] : educations[h % educations.length],
      smoking: h % 3 === 0 ? "לא מעשן/ת" : "לא מעשן/ת בקביעות",
      traits: ["הומור", "רוגע", "משפחתיות", "רגישות", "שאפתנות", "רוחניות", "ביטחון עצמי", "מנהיגות"].filter(
        (_, idx) => (h >> idx) % 3 === 0
      ),
      about: ABOUT_SNIPPETS[h % ABOUT_SNIPPETS.length],
      image: `https://picsum.photos/seed/${gender}-${i + 12}/600/800`,
      isNew: i < 3,
      isPrevious: i >= 6,
      staffNote: `שיחה עם המשפחה התקדמה יפה, ${STAFF[h % STAFF.length].name} מלווה/ת את התיק.`,
      adminNote: i % 2 === 0 ? "לחזור לבדוק המלצות נוספות בשבוע הבא." : "",
      matchSeed: h,
    };
  });
}

export const MALE_CANDIDATES = buildCandidates(MALE_NAMES, "male");
export const FEMALE_CANDIDATES = buildCandidates(FEMALE_NAMES, "female");

export function getCandidates(gender) {
  return gender === "male" ? MALE_CANDIDATES : FEMALE_CANDIDATES;
}

export const NOTIFICATIONS_SEED = [
  { id: "n1", text: "הצעות חדשות באתר!", time: "לפני שעה", read: false },
  { id: "n2", text: "רוני הוסיפה הערה חדשה לתיק שאת עוקבת אחריו.", time: "אתמול", read: false },
  { id: "n3", text: "התאמה חדשה מתאימה להעדפות שמילאת.", time: "לפני יומיים", read: true },
];

export const PIPELINE_STATUSES = ["בבירורים", "החלפת מספרים", "פגישה ראשונה", "פגישה שנייה", "מתקדם"];
