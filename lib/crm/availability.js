// קידוד צבעים לסטטוס פניות מועמד/ת
export const AVAILABILITY_COLORS = {
  "פנוי": { bg: "bg-[#20A66B]", text: "text-white", dot: "bg-[#20A66B]" },
  "לא פנוי": { bg: "bg-[#C24545]", text: "text-white", dot: "bg-[#C24545]" },
  "בהפסקה": { bg: "bg-[#D6A93A]", text: "text-white", dot: "bg-[#D6A93A]" },
};

export function getAvailabilityColors(status) {
  return AVAILABILITY_COLORS[status] || AVAILABILITY_COLORS["פנוי"];
}
