// פרופיל השקפה ואורח חיים - שדות סגורים שהסוכן המחלץ ממלא מתוך התיאור
// ושדה המורכבויות, והמנהלת מאשרת או מתקנת.
//
// הפרופיל נשמר באוסף נפרד (aiOutlookProfiles), לא בכרטיס עצמו. כאן רק
// ההגדרות, ובדיקת ההתנגשויות בין שני פרופילים - בקוד, בלי בינה, כך שהיא
// עקבית ואינה תלויה בעומס על Google. הקובץ טהור: אין בו רשת ולא מסד נתונים.

export const UNKNOWN = "לא ידוע";

export const OUTLOOK_FIELDS = {
  dress: { label: "לבוש", options: ["חצאית בלבד", "מכנסיים לפעמים", "מכנסיים", UNKNOWN], only: "female" },
  partnerDress: { label: "דרישת לבוש מבת הזוג", options: ["חצאית בלבד", "גמיש", UNKNOWN], only: "male" },
  society: { label: "חברה", options: ["נפרדת", "מעורבת חלקית", "מעורבת", UNKNOWN] },
  observance: { label: "רמת הקפדה", options: ["קלה כבחמורה", "מקפיד/ה", "גמיש/ה", "מסורתי/ת", UNKNOWN] },
  background: { label: "רקע", options: ["נולד/ה דתי/ה", "חוזר/ת בתשובה", UNKNOWN] },
  service: { label: "שירות", options: ["צבא", "שירות לאומי", "לא שירת/ה", UNKNOWN] },
  serviceImportance: { label: "שירות אצל בן/בת הזוג", options: ["חשוב", "לא חשוב", UNKNOWN] },
  openness: { label: "פתיחות לעולם", options: ["סגור/ה", "מתון/ה", "פתוח/ה", UNKNOWN] },
  style: { label: "סגנון חיים", options: ["ישיבתי-תורני", "אקדמי-מקצועי", "התיישבותי-טבע", "עירוני-מודרני", UNKNOWN] },
};
export const FIELD_KEYS = Object.keys(OUTLOOK_FIELDS);
export const CONFIDENCE = ["גבוהה", "בינונית", "נמוכה"];

// השדות שרלוונטיים למגדר מסוים
export const fieldsFor = (gender) =>
  FIELD_KEYS.filter((k) => !OUTLOOK_FIELDS[k].only || OUTLOOK_FIELDS[k].only === gender);

// "חתימה" של הטקסט שממנו חולץ הפרופיל. כשהתיאור או המורכבויות משתנים -
// החתימה משתנה, והפרופיל מסומן "התיאור השתנה".
export function sourceHash(c) {
  const s = [c?.gender, c?.tag, c?.religiousLevel, c?.bio, c?.complexityNotes, (c?.occupations || []).join(",")].join("|");
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// הערך שבפועל: תיקון ידני של המנהלת גובר; ערך בוודאות נמוכה שלא אושר - נחשב לא ידוע
export function effectiveOutlook(doc) {
  if (!doc || typeof doc !== "object") return null;
  const out = {};
  FIELD_KEYS.forEach((k) => {
    const manual = doc.manual?.[k];
    if (manual && OUTLOOK_FIELDS[k].options.includes(manual)) {
      out[k] = manual;
      return;
    }
    const f = doc.fields?.[k];
    const v = f?.value;
    const ok = v && OUTLOOK_FIELDS[k].options.includes(v);
    out[k] = ok && (doc.approved || f?.confidence !== "נמוכה") ? v : UNKNOWN;
  });
  return out;
}

const OBSERVANCE_SCALE = { "קלה כבחמורה": 0, "מקפיד/ה": 1, "גמיש/ה": 2, "מסורתי/ת": 3 };
const known = (v) => v && v !== UNKNOWN;

// מטריצת תנאי הסף. a ו-b הם פרופילים אפקטיביים; maleFirst - מי מהם הבחור.
// מחזיר את סיבת הפסילה, או null. ערך לא ידוע לעולם אינו פוסל.
export function outlookClash(male, female) {
  if (!male || !female) return null;
  const om = OBSERVANCE_SCALE[male.observance];
  const of = OBSERVANCE_SCALE[female.observance];
  if (om !== undefined && of !== undefined && Math.abs(om - of) >= 2) return "רמת הקפדה";
  const soc = [male.society, female.society];
  if (soc.includes("נפרדת") && soc.includes("מעורבת")) return "חברה נפרדת/מעורבת";
  const pants = female.dress === "מכנסיים" || female.dress === "מכנסיים לפעמים";
  if (pants && (male.partnerDress === "חצאית בלבד" || male.observance === "קלה כבחמורה")) return "לבוש";
  if (female.dress === "מכנסיים" && male.observance === "מקפיד/ה") return "לבוש";
  if (male.serviceImportance === "חשוב" && female.service === "לא שירת/ה") return "ערכי שירות";
  if (female.serviceImportance === "חשוב" && male.service === "לא שירת/ה") return "ערכי שירות";
  const open = [male.openness, female.openness];
  if (open.includes("סגור/ה") && open.includes("פתוח/ה")) return "פתיחות לעולם";
  return null;
}

// סתירה בין התווית בכרטיס לבין מה שעולה מהטקסט - להתראה בלבד, לא לפסילה
const STRICT_TAG = /תורני|חרדי|חב"ד|ברסלב|חרד"ל|חסידי/;
const LIGHT_TAG = /דתל"ש|מסורתי/;
export function labelConflict(c, o) {
  if (!c || !o) return "";
  const label = [c.tag, c.religiousLevel].filter(Boolean).join(" / ").replace(/[״]/g, '"');
  const signs = [];
  if (STRICT_TAG.test(label)) {
    if (o.dress === "מכנסיים" || o.dress === "מכנסיים לפעמים") signs.push(`לבוש: ${o.dress}`);
    if (o.society === "מעורבת") signs.push("חברה מעורבת");
    if (o.observance === "גמיש/ה" || o.observance === "מסורתי/ת") signs.push(`הקפדה: ${o.observance}`);
  } else if (LIGHT_TAG.test(label)) {
    if (o.observance === "קלה כבחמורה") signs.push("הקפדה: קלה כבחמורה");
    if (o.society === "נפרדת") signs.push("חברה נפרדת");
  }
  return signs.length ? `בכרטיס: "${label}", אבל מהטקסט עולה: ${signs.join(", ")}` : "";
}

// תקציר קריא לפרופיל - לשליחה לבינה השופטת ולתצוגה
export function outlookSummary(o) {
  if (!o) return null;
  const out = {};
  FIELD_KEYS.forEach((k) => {
    if (known(o[k])) out[OUTLOOK_FIELDS[k].label] = o[k];
  });
  return Object.keys(out).length ? out : null;
}
