// ============================================================================
//  טריטוריה ושיגור חכם: איזו אשת צוות אחראית על איזו משפחה.
//  ההתאמה לפי שם משפחה (מילה שלמה) או לפי רחוב.
// ============================================================================

const FINALS = { ך: "כ", ם: "מ", ן: "נ", ף: "פ", ץ: "צ" };

// "משפחת בן-דוד" -> "בנ דוד" (אותיות סופיות מנורמלות, בלי ניקוד וסימנים)
export function normKey(s) {
  return String(s || "")
    .replace(/[֑-ׇ]/g, "")
    .replace(/[ךםןףץ]/g, (c) => FINALS[c])
    .replace(/משפחת|משפ'|רחוב|רח'/g, " ")
    .replace(/[^א-ת0-9]+/g, " ")
    .trim();
}

export function parseList(text) {
  return Array.from(
    new Set(
      String(text || "")
        .split(/[,\n،;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
}

function familyMatches(family, term) {
  const t = normKey(term);
  if (!t) return false;
  const last = normKey(family.lastName);
  if (!last) return false;
  if (last === t) return true;
  // מילה שלמה בתוך שם משפחה כפול ("כהן" מתאים ל"כהן צדק" אבל לא ל"כהנא")
  return ` ${last} `.includes(` ${t} `);
}

function streetMatches(family, term) {
  const t = normKey(term);
  const st = normKey(family.street);
  return Boolean(t && st && ` ${st} `.includes(` ${t} `));
}

/** מחזיר את רשימת המזהים של אנשות הצוות שהמשפחה שייכת לטריטוריה שלהן. */
export function assigneesFor(family, staffUsers) {
  const out = [];
  for (const u of staffUsers) {
    const terr = u.territory;
    if (!terr) continue;
    const fam = (terr.families || []).some((t) => familyMatches(family, t));
    const str = (terr.streets || []).some((t) => streetMatches(family, t));
    if (fam || str) out.push(u.id);
  }
  return out.sort();
}

/** מזהה מסמך יציב: אותה משפחה שמועלית שוב מתעדכנת ולא נוצרת כפולה. */
export function familyDocId(f) {
  const phone = (f.phones && f.phones[0] ? f.phones[0] : "").replace(/\D/g, "");
  const raw = `${normKey(f.lastName)}_${normKey(f.firstName)}_${phone}`.replace(/\s+/g, "-");
  return raw.slice(0, 140) || `f-${Date.now()}`;
}
