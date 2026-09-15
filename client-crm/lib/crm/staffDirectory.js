// ספריית האנשים של המערכת - מי קיים, ומי יכול/ה לקבל משימה.
//
// הרקע לקובץ הזה: staffList שבסטור מסנן role === "staff" בדיוק, והוא
// משרת מסכים אחרים (עמלות, ביצועי צוות). אבל לשיוך משימה הסינון הזה
// שגוי משתי סיבות:
//
//   1. מנהלת נוספת (role: "admin") היא אשת צוות לכל דבר שאפשר וצריך
//      לשייך אליה משימות - ובכל זאת היא נעדרה מהרשימה.
//   2. רשומה שנוספה ידנית דרך הקונסולה של Firebase מגיעה לעיתים בלי
//      שדה role כלל. הכניסה למערכת מתייחסת אליה כצוות (ראו applyEntry
//      בסטור), ולכן היא מחוברת ועובדת - אבל ההשוואה המדויקת כאן
//      הותירה אותה מחוץ לרשימה, והמסך הודיע "לא נמצאה נציגה בשם הזה".
//
// כלומר הפער היה בין מי שהמערכת מכניסה לבין מי שהיא מוכנה לשייך אליו.
// כאן הכלל אחד: מי שיש לו/לה גישה - יכול/ה לקבל משימה.
//
// הקובץ טהור: אין בו React ואין בו Firebase, ולכן אפשר לבדוק אותו
// בנפרד והוא אינו יכול לשבור מסך.

const clean = (v) =>
  String(v || "")
    // תווי כיווניות נדבקים לכתובות שהודבקו מוואטסאפ ומעברית
    .replace(/[‎‏‪-‮⁦-⁩]/g, "")
    .trim();

const emailOf = (entry) => clean(entry?.email || entry?.id).toLowerCase();

// מנהלת מזוהה כך גם כשהשדה נשמר עם רווחים או באותיות גדולות
export const isAdminEntry = (entry) => clean(entry?.role).toLowerCase() === "admin";

// כל מי שרשום/ה בהרשאות ויש לו/לה כתובת תקינה. כפילויות מאוחדות,
// והמיון לפי שם כדי שהרשימה תיקרא כמו רשימת אנשים ולא כמו מסד נתונים.
export function assignableMembers(allowlist = []) {
  const byEmail = new Map();
  (Array.isArray(allowlist) ? allowlist : []).forEach((entry) => {
    const email = emailOf(entry);
    if (!email) return;
    const existing = byEmail.get(email);
    const name = clean(entry?.name);
    // כשאותה כתובת מופיעה פעמיים, שומרים את הרשומה שיש בה שם
    if (!existing || (!existing.name && name)) {
      byEmail.set(email, { email, name, isAdmin: isAdminEntry(entry) });
    } else if (isAdminEntry(entry)) {
      existing.isAdmin = true;
    }
  });
  return [...byEmail.values()].sort((a, b) =>
    (a.name || a.email).localeCompare(b.name || b.email, "he")
  );
}

// אפשרויות הבחירה בטופס שיוך המשימה.
//
// me הוא המשתמש/ת המחובר/ת. היא תמיד ראשונה ברשימה ומסומנת pinned,
// כדי ששיוך עצמי יהיה לחיצה אחת גם כשהרשימה ארוכה - וגם כשהכתובת
// שלה אינה מופיעה כלל בהרשאות (המנהלות הראשיות מזוהות מתוך הקוד).
export function assigneeOptions(allowlist = [], me = {}) {
  const myEmail = clean(me.email).toLowerCase();
  const members = assignableMembers(allowlist);
  const mine = members.find((m) => m.email === myEmail);

  const label = (m) => `${m.name || m.email}${m.isAdmin ? " · מנהלת" : ""}`;
  const rest = members.filter((m) => m.email !== myEmail).map((m) => ({ value: m.email, label: label(m) }));

  if (!myEmail) return rest;
  const myName = mine?.name || clean(me.name) || myEmail;
  return [{ value: myEmail, label: `לעצמי · ${myName}`, pinned: true }, ...rest];
}
