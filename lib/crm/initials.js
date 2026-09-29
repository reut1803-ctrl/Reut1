// ראשי תיבות לכרטיס בלי תמונה. בלי זה הכרטיס נשאר ריק לגמרי,
// כי שדה initials מעולם לא נשמר במסד ותמיד חוזר ריק.
export function candidateInitials(name) {
  const clean = String(name || "").trim();
  if (!clean) return "?";
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return words[0][0] + words[1][0];
  return words[0].slice(0, 2);
}
