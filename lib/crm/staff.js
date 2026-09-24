// איתור רשומת איש/אשת צוות ברשימת ההרשאות, לפי סדר דיוק יורד.
// המטרה: שמספר הטלפון יימצא גם בהצעות ותיקות שנשמרו לפני שהמייל נשמר בשיוך,
// וגם כששם החשבון בגוגל אינו זהה לשם שהוזן ברשימת ההרשאות.
export function findStaffEntry(allowlist, email, name) {
  const list = allowlist || [];
  const key = String(email || "").trim().toLowerCase();
  if (key) {
    const byEmail = list.find((e) => String(e.email || e.id || "").trim().toLowerCase() === key);
    if (byEmail) return byEmail;
  }

  const wanted = String(name || "").trim();
  if (!wanted) return null;
  const norm = (v) => String(v || "").trim().replace(/\s+/g, " ").toLowerCase();

  const exact = list.find((e) => String(e.name || "").trim() === wanted);
  if (exact) return exact;

  const loose = list.find((e) => norm(e.name) === norm(wanted));
  if (loose) return loose;

  // שם פרטי: "דבורה" מול "דבורה כהן". נבחר רק אם יש התאמה יחידה,
  // כדי לא לשלוח נדנוד לאדם הלא נכון כששני אנשי צוות חולקים שם פרטי.
  const firstOf = (v) => norm(v).split(" ")[0];
  const wantedFirst = firstOf(wanted);
  if (!wantedFirst) return null;
  const byFirst = list.filter((e) => firstOf(e.name) === wantedFirst);
  return byFirst.length === 1 ? byFirst[0] : null;
}
