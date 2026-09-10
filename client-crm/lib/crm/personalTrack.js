// מצב "המסלול האישי" של מועמד/ת.
//
// הנתון נשמר במסמך הסטטוס הציבורי (candidateStatus) ובמסמך הפנייה
// (intakeSubmissions), ולכן הוא נגיש גם למי שאינו מחובר - בדיוק כמו
// סטטוס הזמינות. אין כאן שום מידע רגיש.

export const TRACK_NONE = "";
export const TRACK_PAID = "paid";
export const TRACK_MESSAGE = "message";

// הבחירות שהמועמד/ת יכול/ה לעשות במסך הסיום ובאזור האישי
export const TRACK_CHOICES = [
  { value: TRACK_PAID, label: "שילמתי / אני מצטרף/ת למסלול", hint: "נעדכן ונחזור אליכם לתיאום השיחה" },
  { value: TRACK_MESSAGE, label: "אשמח שתחזרו אליי", hint: "תיאום תשלום בדרך אחרת, שאלה, או בקשה לשיחה" },
];

// תווית לתצוגה בלוח הבקרה. הצבעים מגיעים מפלטת המערכת.
export function trackBadge(track) {
  if (track === TRACK_PAID) {
    return { label: "במסלול האישי", bg: "bg-[#2FA39B]", text: "text-white" };
  }
  if (track === TRACK_MESSAGE) {
    return { label: "ביקש/ה שנחזור", bg: "bg-[#C9A063]", text: "text-white" };
  }
  return null;
}

// האם להציג את הצעת השדרוג. מי שכבר במסלול לא רואה אותה שוב,
// וכך האזור האישי נשאר נקי ובלי כפילות.
export const shouldOfferTrack = (track) => track !== TRACK_PAID;

// תקרה על אורך ההודעה. נאכפת גם כאן וגם בכללי האבטחה בשרת,
// כי ולידציה שקיימת רק במסך אינה ולידציה.
export const MAX_TRACK_MESSAGE = 1500;

export const cleanTrackMessage = (text) => String(text || "").trim().slice(0, MAX_TRACK_MESSAGE);
