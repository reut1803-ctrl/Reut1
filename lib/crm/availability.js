// קידוד צבעים לסטטוס פניות מועמד/ת
export const AVAILABILITY_COLORS = {
  "פנוי": { bg: "bg-[#62826B]", text: "text-white", dot: "bg-[#62826B]" },
  "לא פנוי": { bg: "bg-[#C24545]", text: "text-white", dot: "bg-[#C24545]" },
  "בהפסקה": { bg: "bg-[#A85D50]", text: "text-white", dot: "bg-[#A85D50]" },
};

export function getAvailabilityColors(status) {
  return AVAILABILITY_COLORS[status] || AVAILABILITY_COLORS["פנוי"];
}
