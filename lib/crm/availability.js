// קידוד צבעים לסטטוס פניות מועמד/ת
export const AVAILABILITY_COLORS = {
  "פנוי": { bg: "bg-[#7FB33F]", text: "text-white", dot: "bg-[#7FB33F]" },
  "לא פנוי": { bg: "bg-[#C24545]", text: "text-white", dot: "bg-[#C24545]" },
  "בהפסקה": { bg: "bg-[#C9A227]", text: "text-white", dot: "bg-[#C9A227]" },
};

export function getAvailabilityColors(status) {
  return AVAILABILITY_COLORS[status] || AVAILABILITY_COLORS["פנוי"];
}
