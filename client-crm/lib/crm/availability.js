// קידוד צבעים לסטטוס פניות מועמד/ת
export const AVAILABILITY_COLORS = {
  "פנוי": { bg: "bg-[#2FA39B]", text: "text-white", dot: "bg-[#2FA39B]" },
  "לא פנוי": { bg: "bg-[#C4584C]", text: "text-white", dot: "bg-[#C4584C]" },
  "בהפסקה": { bg: "bg-[#C9A063]", text: "text-white", dot: "bg-[#C9A063]" },
};

export function getAvailabilityColors(status) {
  return AVAILABILITY_COLORS[status] || AVAILABILITY_COLORS["פנוי"];
}
