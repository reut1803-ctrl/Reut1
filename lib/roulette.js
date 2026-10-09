// רולטת אנשי קשר / אתגר יומי — לוגיקה בלבד (ללא רכיבי תצוגה).
// עיקרון פרטיות: אנשי הקשר נשמרים אך ורק ב-LocalStorage של המכשיר, תחת מזהה
// הנציגה המחוברת, עם תפוגה של 24 שעות. אין שמירה בשרת, אין נגיעה במאגר המועמדים.

const DAY_MS = 24 * 60 * 60 * 1000;
const DRAW_SIZE = 5;

function keyFor(repId) {
  return `roulette_${repId || "anon"}_v1`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// טעינת מצב היום. מחזיר null אם אין מצב, אם פג תוקף, או אם עבר יום — כדי שתיווצר הגרלה חדשה.
export function loadRoulette(repId) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(keyFor(repId));
    if (!raw) return null;
    const state = JSON.parse(raw);
    if (!state || state.date !== todayKey() || !state.expiresAt || Date.now() > state.expiresAt) {
      localStorage.removeItem(keyFor(repId)); // ניקוי אוטומטי של נתונים שפג תוקפם
      return null;
    }
    return state;
  } catch (e) {
    return null;
  }
}

// שמירת מצב עם חותמת תפוגה מתחדשת של 24 שעות.
export function saveRoulette(repId, state) {
  if (typeof window === "undefined") return;
  try {
    const toSave = { ...state, date: todayKey(), expiresAt: Date.now() + DAY_MS };
    localStorage.setItem(keyFor(repId), JSON.stringify(toSave));
  } catch (e) {
    /* אחסון חסום (גלישה פרטית וכו') — נתעלם בשקט */
  }
}

export function clearRoulette(repId) {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(keyFor(repId)); } catch (e) {}
}

// יצירת מצב חדש מתוך רשימת שמות (מהבוחר או מהקלדה ידנית): מגרילים עד 5.
export function buildDraw(names) {
  const clean = (names || [])
    .map((n) => (n || "").toString().trim())
    .filter(Boolean);
  // ערבוב והגבלה ל-5
  const shuffled = clean.sort(() => Math.random() - 0.5).slice(0, DRAW_SIZE);
  const contacts = shuffled.map((name, i) => ({
    id: `c${Date.now()}_${i}`,
    name,
    status: null,       // null | "couple" | "single"
    networking: null,   // { style, consult }
    trait: "",          // טקסט התכונה (מסלול רווק/ה)
    insight: "",        // תובנת "השלמת הפאזל"
    message: "",        // משפט העצמה (מסלול בזוגיות)
    done: false,        // טופל
    followUp: false,    // במעקב ("הזכר לי מחר")
  }));
  return { date: todayKey(), contacts };
}

export const DRAW_SIZE_MAX = DRAW_SIZE;

// ----- משפטי העצמה למסלול ה-Networking (בזוגיות) -----
const EMPOWER = [
  "מהלך חכם! הרשת החברתית הזו תפתח לנו דלתות בדיוק איפה שצריך 🚪",
  "יופי! כל קשר כזה הוא עוד זוג עיניים שמחפש בשבילנו 👀",
  "מצוין! ככה נבנית רשת שידוכים אמיתית — אדם אחד בכל פעם 🤝",
  "אלופה! ההתייעצות הזו שווה זהב — לפעמים הפתרון מגיע מכיוון לא צפוי ✨",
  "כל הכבוד! עוד שותף בדרך, עוד הזדמנות לזיווג מוצלח 💞",
  "נהדר! הזרעת עכשיו קשר שיכול לצמוח להתאמה מושלמת 🌱",
];

export function randomEmpower() {
  return EMPOWER[Math.floor(Math.random() * EMPOWER.length)];
}

// ----- מנוע תובנות "השלמת הפאזל" (מקומי, חינמי, מיידי) -----
// מזהה את קבוצת התכונה לפי מילות מפתח ומנסח משפט אחד חם על בן/בת הזוג המשלים —
// לא רק מאזן, אלא מי שייצר כימיה טובה, נוחות, הנאה וכיף משותף.
const PROFILES = [
  {
    keys: ["רגיש", "רגש", "אכפת", "חם", "חמה", "נתינה", "לב", "רך", "רכה", "אמפת", "עדין"],
    complements: [
      "מישהו יציב ושורשי, שיעניק בית בטוח שבו הרוך שלו/ה פשוט יוכל לזרום בלי חשש",
      "בן/בת זוג קרקעי/ת ונינוח/ה, שליד/ה הרגישות הופכת ממעמסה למתנה",
    ],
  },
  {
    keys: ["שאפתן", "שאפתני", "קריירה", "מצליח", "נחוש", "חזק", "דומיננט", "מנהיג", "יזם", "פורץ"],
    complements: [
      "מישהו/י רך/כה וקשוב/ה, שיראה/תראה את האדם שמאחורי ההישגים ויזכיר/תזכיר לעצור וליהנות",
      "בן/בת זוג שמביא/ה חום ושקט הביתה, אוזן קשבת שמולה אפשר סוף-סוף להניח את השריון",
    ],
  },
  {
    keys: ["שמח", "מצחיק", "הומור", "חיים", "אנרגיה", "כיף", "ספונטני", "שובב", "מצחיקה", "חייכן"],
    complements: [
      "מישהו/י עם עומק ורוגע, עוגן יציב שממנו הקלילות והשמחה רק יזהרו עוד יותר",
      "בן/בת זוג שקט/ה ומעמיק/ה, שנהנה/ת להיסחף אחרי האנרגיה ולתת לה מקום לנחות",
    ],
  },
  {
    keys: ["חכם", "חכמה", "אינטלקט", "עמוק", "עמוקה", "חושב", "רציני", "למדן", "למדנית", "שכלתני", "מעמיק"],
    complements: [
      "מישהו/י קליל/ה וחם/מה, שיוציא/תוציא אותו/ה מהראש אל הלב ויזכיר/תזכיר כמה כיף פשוט לחיות",
      "בן/בת זוג ספונטני/ת ומחייך/כת, שמביא/ה קלילות וצחוק אל תוך העומק",
    ],
  },
  {
    keys: ["טוב לב", "חסד", "עוזר", "עוזרת", "נדיב", "נדיבה", "מתחשב", "אכפתי", "נותן", "נותנת"],
    complements: [
      "מישהו/י שיזכיר/תזכיר לו/לה גם לקבל ולא רק לתת, ויעטוף/תעטוף אותו/ה באותה דאגה שהוא/היא מעניק/ה לעולם",
      "בן/בת זוג חם/מה ומוקיר/ה, שיודע/ת להחזיר אהבה במלוא הידיים",
    ],
  },
  {
    keys: ["רגוע", "רגועה", "יציב", "יציבה", "שקט", "שקטה", "סבלני", "סבלנית", "מתון", "נינוח"],
    complements: [
      "מישהו/י עם ניצוץ וחיוּת, שיביא/תביא קצת הרפתקה והתרגשות אל תוך השלווה",
      "בן/בת זוג אנרגטי/ת וחייכן/ית, שמולה/שמולו הרוגע הופך לבית חם ומזמין",
    ],
  },
  {
    keys: ["אמונ", "יראת", "רוחני", "רוחנית", "תורה", "דתי", "חסידי", "ירא שמים", "צדיק"],
    complements: [
      "בן/בת זוג שחולק/ת את אותו עולם ערכים, אבל מביא/ה גם חום אנושי וחיבור מהלב שמעבר למילים",
      "מישהו/י שמחבר/ת בין הרוח הגבוהה לבין היום-יום החמים והשמח של בית יהודי",
    ],
  },
];

const OPENERS = [
  "מולו/ה תפרח/ייפרח דווקא",
  "ה'השלמה' המושלמת כאן היא",
  "הכימיה האמיתית תיווצר עם",
  "מה שישלים את הפאזל הוא",
  "דווקא לצד",
];

const CLOSERS = [
  "ומשם מגיעים הנוחות, ההנאה והכיף המשותף שהופכים זוגיות לבית 🧩",
  "וביחד נבנית אותה תחושה נעימה שפשוט כיף להיות בה 💛",
  "וזו בדיוק הכימיה שמייצרת חיבור חם ולא רק התאמה על הנייר ✨",
  "ומכאן צומחת זוגיות שמרגישה טבעית, קלה ומלאת שמחה 🌿",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// מקבל את תיאור התכונה ומחזיר משפט תובנה אחד, חם ומגוון.
export function puzzleInsight(traitText) {
  const t = (traitText || "").toString();
  const lower = t.toLowerCase();
  let profile = PROFILES.find((p) => p.keys.some((k) => lower.includes(k)));
  const complement = profile
    ? pick(profile.complements)
    : "מישהו/י שמביא/ה בדיוק את מה שחסר כדי לאזן, אבל בעיקר להצחיק, לחמם ולהרגיש בבית";
  const opener = pick(OPENERS);
  const closer = pick(CLOSERS);
  // מכניסים גם רמז לתכונה שהוקלדה, כדי שהתובנה תרגיש אישית.
  const echo = t.trim() ? `על רקע ה${t.trim()} שתיארת, ` : "";
  return `${echo}${opener} ${complement} — ${closer}`;
}
