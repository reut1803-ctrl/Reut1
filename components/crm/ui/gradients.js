// רשימת גרדיאנטים לתמונות ממורקדות של מועמדים (נתוני דמה בלבד).
// חייב לחיות תחת components/ כדי ש-Tailwind יזהה את שמות המחלקות בסריקה.
// שימו לב: המילה "rose" תפוסה כצבע מותאם אישית במערכת הישנה (tailwind.config.js),
// ולכן במתכוון לא משתמשים כאן ב-rose-* של Tailwind, כדי לא להתנגש איתה.
export const CANDIDATE_GRADIENTS = [
  "from-red-400 to-orange-300",
  "from-sky-400 to-indigo-300",
  "from-emerald-400 to-teal-300",
  "from-amber-400 to-yellow-300",
  "from-fuchsia-400 to-pink-300",
  "from-violet-400 to-purple-300",
  "from-cyan-400 to-blue-300",
  "from-lime-400 to-green-300",
];

// כרטיסים ותיקים, וכאלה שנוצרו מחוץ לטופס הראשי, נשמרו בלי שדה gradient.
// אז החישוב הישן החזיר "כלום", הרקע נשאר לבן, וכרטיס בלי תמונה נראה כמו
// ריבוע ריק לגמרי. כאן לעולם לא מוחזר ערך ריק: ערך חסר נגזר מהטקסט שהועבר
// (בדרך כלל השם), כך שלכל מועמד/ת יש גוון קבוע משלו/ה.
export function getGradientClass(value) {
  const n = Number(value);
  if (Number.isFinite(n) && n >= 0) {
    return CANDIDATE_GRADIENTS[Math.floor(n) % CANDIDATE_GRADIENTS.length];
  }
  const key = String(value ?? "");
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 100000;
  return CANDIDATE_GRADIENTS[hash % CANDIDATE_GRADIENTS.length];
}
