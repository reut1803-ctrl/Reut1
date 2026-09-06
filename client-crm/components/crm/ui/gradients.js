// גרדיאנטים לתמונות ממורקדות של מועמדים (כשאין תמונה אמיתית).
// חייב לחיות תחת components/ כדי ש-Tailwind יזהה את שמות המחלקות בסריקה.
// הגוונים נשמרים בתוך פלטת הפסטל של המערכת: ורוד, אפרסק, שמנת וירוק מרווה.
export const CANDIDATE_GRADIENTS = [
  "from-rose-300 to-orange-200",
  "from-lime-200 to-emerald-200",
  "from-orange-200 to-amber-100",
  "from-pink-200 to-rose-100",
  "from-emerald-200 to-lime-100",
  "from-amber-200 to-rose-100",
  "from-teal-200 to-emerald-100",
  "from-rose-200 to-yellow-100",
];

export function getGradientClass(index) {
  return CANDIDATE_GRADIENTS[index % CANDIDATE_GRADIENTS.length];
}
