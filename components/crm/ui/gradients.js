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

export function getGradientClass(index) {
  return CANDIDATE_GRADIENTS[index % CANDIDATE_GRADIENTS.length];
}
