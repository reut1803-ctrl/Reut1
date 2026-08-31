// מפתח השבוע הנוכחי, לצורך מדדים שמתאפסים בכל תחילת שבוע.
//
// העיקרון: אין כאן שום משימה מתוזמנת שמאפסת מונים. במקום זה, כל מונה נשמר
// יחד עם השבוע שאליו הוא שייך. בתצוגה משווים את השבוע השמור לשבוע הנוכחי -
// ואם הם שונים, המונה פשוט נקרא כאפס. כך האיפוס קורה מעצמו ברגע שהשבוע
// מתחלף, גם אם איש לא פתח את המערכת, ואי אפשר להישאר עם נתון "תקוע".
//
// שבוע מתחיל ביום ראשון, כמו שבוע העבודה בישראל. תקן ISO מגדיר את תחילת
// השבוע ביום שני, אך כאן חשוב שמה שכתוב "השבוע" יתאים למה שהצוות חווה
// כשבוע. לשינוי ליום שני, יש להחליף את WEEK_START_DAY ל-1.
const WEEK_START_DAY = 0; // 0 = ראשון, 1 = שני

const pad = (n) => String(n).padStart(2, "0");

// תחילת השבוע שאליו שייך התאריך, בשעה 00:00 לפי השעון המקומי
export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() - WEEK_START_DAY + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

// מזהה השבוע: התאריך של היום הראשון בשבוע. קריא, יציב, ואינו תלוי
// בהמרות אזור זמן כמו חותמת מלאה.
export function weekKey(date = new Date()) {
  const d = startOfWeek(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// טווח השבוע להצגה למשתמשת, כדי שיהיה ברור בדיוק על איזה שבוע מדובר
export function weekRangeLabel(date = new Date()) {
  const from = startOfWeek(date);
  const to = new Date(from);
  to.setDate(to.getDate() + 6);
  const fmt = (d) => `${d.getDate()}.${d.getMonth() + 1}`;
  return `${fmt(from)} - ${fmt(to)}`;
}

// קריאת מונה שבועי: אם הרשומה שייכת לשבוע קודם, היא נקראת כאפס.
// זהו האיפוס עצמו - הוא קורה בקריאה, ולא בכתיבה או במשימה מתוזמנת.
export function weeklyValue(entry, field, date = new Date()) {
  if (!entry || entry.week !== weekKey(date)) return 0;
  return entry[field] || 0;
}
