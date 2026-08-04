// בניית דוח השיוכים: מקבצת את המועמדים לפי הנציג/ה המלווה שלהם,
// ומחזירה בנפרד את מי שנשאר בלי שיוך כלל.
// פונקציה טהורה (בלי גישה למסד או ל-store), כדי שאפשר יהיה לבדוק אותה בנפרד.

export const reportEmail = (value) =>
  String(value ?? "")
    .replace(/[‎‏‪-‮]/g, "")
    .trim()
    .toLowerCase();

const byName = (a, b) => String(a?.name || "").localeCompare(String(b?.name || ""), "he");

export function buildAssignmentGroups({ candidates = [], staffList = [], allowlist = [] } = {}) {
  const groups = new Map();

  staffList.forEach((s) => {
    const email = reportEmail(s.email || s.id);
    if (!email) return;
    groups.set(email, { email, name: s.name || email, items: [], removed: false });
  });

  const unassigned = [];

  candidates.forEach((c) => {
    const email = reportEmail(c.contactStaffEmail);
    if (!email) {
      unassigned.push(c);
      return;
    }
    if (!groups.has(email)) {
      // שיוך לכתובת שכבר אינה ברשימת הצוות - מוצג בנפרד כדי שלא ייעלם מהדוח
      const known = allowlist.find((e) => reportEmail(e.email || e.id) === email);
      groups.set(email, { email, name: known?.name || email, items: [], removed: !known });
    }
    groups.get(email).items.push(c);
  });

  const list = Array.from(groups.values());
  list.forEach((g) => g.items.sort(byName));
  list.sort((a, b) => b.items.length - a.items.length || byName(a, b));
  unassigned.sort(byName);

  return {
    groups: list,
    unassigned,
    assignedCount: candidates.length - unassigned.length,
    total: candidates.length,
  };
}
