// רשימת גרדיאנטים לתמונות ממורקדות של מועמדים (נתוני דמה בלבד).
// חייב לחיות תחת components/ כדי ש-Tailwind יזהה את שמות המחלקות בסריקה.
// הגוונים נשמרים במשפחת החום, הזהב והירוק של המערכת.
export const CANDIDATE_GRADIENTS = [
  "from-amber-600 to-yellow-300",
  "from-lime-500 to-green-300",
  "from-orange-500 to-amber-300",
  "from-yellow-600 to-amber-200",
  "from-emerald-500 to-lime-300",
  "from-amber-800 to-orange-300",
  "from-green-600 to-lime-300",
  "from-stone-500 to-amber-300",
];

export function getGradientClass(index) {
  return CANDIDATE_GRADIENTS[index % CANDIDATE_GRADIENTS.length];
}
