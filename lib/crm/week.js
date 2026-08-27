// חישוב "השבוע הנוכחי" עבור מדדי מעורבות הצוות בלוח הבקרה.
// השבוע מתחיל ביום ראשון, כמקובל בישראל, ומסתיים ברגע זה.
//
// המדדים נשמרים לצד מפתח השבוע שבו נצברו. כשמגיע שבוע חדש, המפתח משתנה
// והמונים מתחילים מאפס מעצמם - בלי משימת ניקוי ובלי מחיקת נתונים.

// מפתח השבוע: תאריך יום ראשון שפותח אותו, בפורמט YYYY-MM-DD.
// מחושב לפי השעון המקומי, שהוא מה שהצוות רואה בפועל.
export function weekKey(nowMs = Date.now()) {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // 0 = ראשון
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// המדדים של השבוע הנוכחי בלבד.
// רשומה ששייכת לשבוע קודם מוצגת כאפס, כי השבוע שלה כבר נסגר.
export function weeklyMetrics(entry, key = weekKey()) {
  if (!entry || entry.weekStart !== key) return { profileViews: 0, audioPlays: 0 };
  return {
    profileViews: entry.weekProfileViews || 0,
    audioPlays: entry.weekAudioPlays || 0,
  };
}

// הערך הבא של מונה שבועי: ממשיך לספור באותו שבוע, ומתחיל מאחד בשבוע חדש.
export function nextWeeklyCount(entry, field, key = weekKey()) {
  if (!entry || entry.weekStart !== key) return 1;
  return (entry[field] || 0) + 1;
}
