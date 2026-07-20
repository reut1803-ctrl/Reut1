export const WIZARD_STEPS = [
  { key: "ageRange", title: "טווח גילאים", subtitle: "באיזה טווח גילאים תרצי לראות הצעות?" },
  { key: "heightRange", title: "טווח גובה", subtitle: "מה טווח הגובה המועדף עלייך?" },
  { key: "torahLevel", title: "רמת תורניות", subtitle: "מה חשוב לך בעולם הלימוד והעבודה?" },
  { key: "regions", title: "אזור מועדף", subtitle: "אפשר לבחור כמה אזורים שנוחים לך." },
  { key: "education", title: "לימודים", subtitle: "מה רמת ההשכלה שמתאימה לך?" },
  { key: "smoking", title: "עישון", subtitle: "מה ההעדפה שלך בנושא עישון?" },
  { key: "traits", title: "תכונות אופי", subtitle: "בחרי עד 3 תכונות שהכי חשובות לך." },
];

export const TORAH_LEVEL_OPTIONS = ["ישיבה גבוהה", "הסדר", "עובד ולומד", "עובד", "לא משנה"];

export const EDUCATION_OPTIONS = [
  "סמינר / מכינה",
  "לומד בישיבה / כולל",
  "תואר ראשון",
  "תואר שני ומעלה",
  "עובד/ת ולא לומד/ת",
  "לא משנה",
];

export const SMOKING_OPTIONS = ["לא מעשן/ת - חובה", "לא מפריע לי", "לא משנה"];

export const TRAIT_OPTIONS = [
  "הומור",
  "רוגע",
  "משפחתיות",
  "רגישות",
  "שאפתנות",
  "רוחניות",
  "ביטחון עצמי",
  "מנהיגות",
];

export const REGION_OPTIONS = ["ירושלים", "מרכז", "שפלה", "שרון", "דרום", "צפון", "לא משנה"];

export const DEFAULT_WIZARD_ANSWERS = {
  ageRange: [21, 30],
  heightRange: [160, 185],
  torahLevel: "לא משנה",
  regions: [],
  education: "לא משנה",
  smoking: "לא משנה",
  traits: [],
};
