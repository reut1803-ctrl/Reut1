// בדיקת תקינות תעודת זהות ישראלית (ספרת ביקורת) - בדיקת פורמט בלבד, לא בדיקה מול משרד הפנים.
export function isValidIsraeliId(id) {
  const clean = String(id || "").trim();
  if (!/^\d{5,9}$/.test(clean)) return false;
  const padded = clean.padStart(9, "0");
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = Number(padded[i]) * ((i % 2) + 1);
    if (digit > 9) digit -= 9;
    sum += digit;
  }
  return sum % 10 === 0;
}
