// המרת תאריך לועזי (YYYY-MM-DD) לתאריך עברי לתצוגה.
export function toHebrewDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("he-u-ca-hebrew", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch (e) {
    return "";
  }
}
