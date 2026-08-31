// טקסטים בגוף פנייה (ציווי) המותאמים למגדר הצופה, לפי המאגר הנצפה:
// מאגר בנים (board === "male") נצפה בד"כ ע"י בחורה - לשון נקבה.
// מאגר בנות (board === "female") נצפה בד"כ ע"י בחור - לשון זכר.
export function viewerActionText(board, { male, female }) {
  return board === "female" ? male : female;
}
