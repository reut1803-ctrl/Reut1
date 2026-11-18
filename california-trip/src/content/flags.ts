// הטקסטים של מסך הדגלים — הנוסח המקורי.
//
// הדרך הקלה לשנות אותם: באתר עצמו, בתחתית מסך הדגלים, לוחצים "עריכת הטקסטים".
// השינוי נשמר במסד הנתונים ומופיע מיד אצל שניכם.
// הקובץ הזה הוא רק נקודת המוצא (וגם מה שחוזר כשלוחצים "חזרה לנוסח המקורי").

export type FlagsContent = {
  eyebrow: string;
  /** כותרת. שורה חדשה (Enter) = ירידת שורה בכותרת */
  title: string;
  lede: string;
  moshiachTitle: string;
  moshiachText: string;
  usTitle: string;
  usText: string;
};

export const FLAGS_DEFAULT: FlagsContent = {
  eyebrow: "הדגלים שלנו",
  title: "שני דגלים.\nמסע אחד.",
  lede: "הדגל הצהוב עם הכתר, ולצידו הכוכבים והפסים של אמריקה. לכל מקום שנגיע בקליפורניה, נביא איתנו את בשורת הגאולה.",
  moshiachTitle: "משיח",
  moshiachText: "הכתר הסגול על רקע צהוב. בשורת הגאולה, בכל מקום.",
  usTitle: "ארצות הברית",
  usText: "חמישים כוכבים ושלושה עשר פסים. הארץ שמארחת אותנו.",
};

/** אורך מקסימלי לכל שדה, כדי שהעיצוב יישאר נקי */
export const FLAGS_LIMITS: Record<keyof FlagsContent, number> = {
  eyebrow: 40,
  title: 60,
  lede: 260,
  moshiachTitle: 30,
  moshiachText: 120,
  usTitle: 30,
  usText: 120,
};
