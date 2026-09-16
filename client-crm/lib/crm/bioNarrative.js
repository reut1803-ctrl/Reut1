// ניסוח התיאור האישי כטקסט אנושי וזורם.
//
// שני תפקידים, ושניהם טהורים - בלי React ובלי Firebase:
//
// 1. narrativeFromForm  – מרכיב את התיאור מתשובות טופס ההרשמה, כפסקאות
//    שנקראות כמו אדם שכותב על עצמו ולא כמו שאלון שמולא.
//
// 2. humanizeBio        – מרכך לתצוגה תיאורים שכבר נשמרו בפורמט הישן
//    ("שדה: ערך" בכל שורה). זו פעולת תצוגה בלבד: הנתון במסד הנתונים
//    אינו משתנה ואינו נמחק, וטקסט שאינו מזוהה עובר כמות שהוא.
//    כך שום מידע קיים אינו הולך לאיבוד.

const clean = (v) => String(v ?? "").trim();

// סיום משפט רק אם אין כבר סימן פיסוק, כדי שלא ייווצר "טקסט.."
const endSentence = (text) => {
  const t = clean(text);
  if (!t) return "";
  return /[.!?…]$/.test(t) ? t : `${t}.`;
};

// --- מדדי האופי, מנוסחים כתיאור ולא כציון ---
const SCALE_PHRASES = {
  introExtro: [
    "מאוד פנימי",
    "נוטה יותר פנימה מאשר החוצה",
    "משלב בין פנימיות לחברותיות",
    "נוטה להיות חברותי ופתוח",
    "חברותי ומוחצן מאוד",
  ],
  heartMind: [
    "מוביל בעיקר מהרגש",
    "יותר רגש מאשר שכל",
    "משלב בין הרגש לשכל",
    "יותר שכל מאשר רגש",
    "מוביל בעיקר מהשכל",
  ],
  planFlow: [
    "מתוכנן ומסודר מאוד",
    "נוטה לתכנן מראש",
    "משלב בין תכנון לזרימה",
    "נוטה לזרום עם מה שבא",
    "זורם וספונטני מאוד",
  ],
};

// התאמת לשון לנקבה. הביטויים נכתבים בלשון זכר ומותאמים כאן, במקום
// לכתוב כל אחד מהם פעמיים.
const FEMALE_FORMS = [
  ["פנימי", "פנימית"], ["חברותי ומוחצן", "חברותית ומוחצנת"], ["חברותי ופתוח", "חברותית ופתוחה"],
  ["מוביל", "מובילה"], ["משלב", "משלבת"], ["נוטה", "נוטה"],
  ["מתוכנן ומסודר", "מתוכננת ומסודרת"], ["זורם וספונטני", "זורמת וספונטנית"],
];

function toGender(text, gender) {
  if (gender !== "female") return text;
  return FEMALE_FORMS.reduce((acc, [m, f]) => acc.split(m).join(f), text);
}

const bucketOf = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n <= 2) return 0;
  if (n <= 4) return 1;
  if (n <= 6) return 2;
  if (n <= 8) return 3;
  return 4;
};

// ניסוח מדד אחד. לשלושת המדדים שבקוד יש נוסח כתוב ביד, שנקרא טוב
// יותר מכל ניסוח אוטומטי - אבל הוא בתוקף רק כל עוד הקטבים לא שונו.
// ברגע שהמנהלת מנסחת את הקטבים מחדש, או מוסיפה מדד משלה, הניסוח
// נגזר מהקטבים שלה עצמם. כך מה שכתוב בכרטיס תמיד תואם למה שנשאל.
export function scalePhrase(scale, value) {
  const b = bucketOf(value);
  if (b === null) return "";
  const written = SCALE_PHRASES[scale?.id];
  const base = DEFAULT_POLES[scale?.id];
  if (written && base && scale.low === base.low && scale.high === base.high) return written[b];

  const low = clean(scale?.low);
  const high = clean(scale?.high);
  if (!low || !high) return "";
  return [`${low} מאוד`, `נוטה ל${low}`, `משלב בין ${low} ל${high}`, `נוטה ל${high}`, `${high} מאוד`][b];
}

// הקטבים המקוריים של שלושת המדדים שבקוד, לצורך ההשוואה שלמעלה בלבד
const DEFAULT_POLES = {
  introExtro: { low: "מופנם/ת", high: "מוחצן/ת" },
  heartMind: { low: "רגשי/ת", high: "שכלי/ת" },
  planFlow: { low: "מחושב/ת", high: "זורם/ת" },
};

// משפט האופי, מכל הסולמות שהוצגו בפועל - אלה שבקוד ואלה שנוספו.
// scales הוא מערך של {id, label, low, high, value}.
export function characterSentence(scales = [], gender) {
  const parts = (Array.isArray(scales) ? scales : [])
    .map((sc) => scalePhrase(sc, sc?.value))
    .filter(Boolean);
  if (parts.length === 0) return "";
  const joined = parts.length > 1 ? `${parts.slice(0, -1).join(", ")}, ו${parts[parts.length - 1]}` : parts[0];
  return toGender(`מבחינת אופי — ${joined}.`, gender);
}

const ELEMENT_TRAIT = {
  אש: "התלהבות ויוזמה",
  רוח: "מחשבה ותנועה",
  מים: "רגש, זרימה וחיבור",
  עפר: "יציבות ומעשיות",
};

export function elementSentence(element, why) {
  const e = clean(element);
  if (!e || e === "אחר") return clean(why) ? endSentence(`אם צריך לתאר את הכוח המרכזי שלי — ${clean(why)}`) : "";
  const trait = clean(why) || ELEMENT_TRAIT[e] || "";
  return endSentence(`היסוד שהכי מדבר אליי הוא ${e}${trait ? ` — ${trait}` : ""}`);
}

// --- הרכבת התיאור מטופס ההרשמה ---
//
// נכללים כאן רק דברים שאין להם תג משלהם בראש הכרטיס. גיל, גובה, עדה,
// אזור, רמה תורנית, עיסוק ומצב משפחתי נשמרים ומוצגים כשדות נפרדים,
// וחזרה עליהם בתוך הטקסט הייתה כפילות מיותרת.
// activeIds: מזהי השאלות שמוצגות כרגע בטופס. שאלה שכובתה בלוח הבקרה
// אינה נשאלת, ולכן גם אסור לה להופיע בתיאור האישי - אחרת נוצר טקסט
// שמתאר תשובה שאיש לא נתן. כשלא מועבר דבר, הכל נכלל (התנהגות קודמת).
// ===================================================================
//  הרכבת התיאור מהשאלון
// ===================================================================
// פתיחים ספרותיים לשאלות שבקוד. הם נקראים טוב יותר מהשאלה עצמה
// ("על הבית שלי" במקום "רקע משפחתי"), אבל הם בתוקף אך ורק כל עוד
// המנהלת לא ניסחה את השאלה מחדש. ברגע שהיא שינתה אותה, הפתיח נגזר
// מהנוסח שלה - אחרת הכרטיס נושא כותרת שאינה קשורה למה שנשאל.
const LEAD_IN = {
  breslov: "הקשר שלי לברסלב",
  pathStory: "הדרך שעברתי",
  familyBackground: "על הבית שלי",
  hobbies: "בזמן הפנוי",
  importantToKnow: "ומשהו שחשוב לי שתדעו",
  preferredAges: "הגילאים שנוחים לי",
  mainRequirements: "חשוב לי במיוחד",
  breslovInPartner: "קשר לברסלב אצל בן או בת הזוג",
  smokingSelf: "לגבי עישון",
};

// פתיח שתלוי במגדר
const LEAD_IN_BY_GENDER = {
  lookingFor: { male: "מה שאני מחפש", female: "מה שאני מחפשת" },
};

// שאלה מנוסחת ככותרת: בלי סימן שאלה ובלי נקודתיים בסוף
const asLead = (label) => clean(label).replace(/[?？:：]+\s*$/, "").trim();

export function leadFor(item, gender) {
  if (item?.labelChanged) return asLead(item.label);
  const byGender = LEAD_IN_BY_GENDER[item?.id];
  if (byGender) return byGender[gender === "female" ? "female" : "male"];
  return LEAD_IN[item?.id] || asLead(item?.label);
}

const valueText = (value) => {
  if (Array.isArray(value)) return clean(value.filter(Boolean).join(", "));
  return clean(value);
};

// התיאור האישי, מורכב מהשאלון עצמו.
//
// items הוא הרשימה המסודרת שמחזיר narrativeItems: אותן שאלות, באותו
// סדר ועם אותן כותרות כמו בטופס שמולא. לכן אין מצב שבו הסיכום מציג
// כותרת שכבר אינה קיימת בשאלון, או מדלג על שאלה שנוספה.
//
// הפסקאות נחתכות לפי שלבי השאלון, וכך הסיכום נקרא באותו קצב שבו
// השאלות נשאלו.
export function narrativeFromItems(items = [], gender = "male") {
  const list = Array.isArray(items) ? items : [];
  const her = gender === "female" ? "female" : "male";
  const paragraphs = [];
  let current = [];
  let currentStep = null;
  let scalesDone = false;

  const flush = () => {
    const text = current.filter(Boolean).join(" ").trim();
    if (text) paragraphs.push(text);
    current = [];
  };

  list.forEach((item) => {
    if (currentStep !== null && item.step !== currentStep) flush();
    currentStep = item.step;

    // כל הסולמות מתנסחים יחד במשפט אחד, במקום הראשון שבו מופיע סולם
    if (item.widget === "scale") {
      if (scalesDone) return;
      scalesDone = true;
      const scales = list.filter((x) => x.widget === "scale");
      const sentence = characterSentence(scales, her);
      if (sentence) current.push(sentence);
      return;
    }

    if (item.id === "element") {
      const sentence = elementSentence(item.value, item.elementWhy ?? item.why ?? "");
      if (sentence) current.push(sentence);
      return;
    }

    const text = valueText(item.value);
    if (!text) return;

    // "לא מעשן/ת" אינו מידע שמוסיף משהו לכרטיס, ולכן אינו נכתב.
    // רק עישון בפועל מצוין. אם המנהלת מנסחת את השאלה מחדש, הכלל הזה
    // אינו חל יותר - כי אז אין לנו מושג מה המשמעות של התשובה.
    if (item.id === "smokingSelf" && !item.labelChanged && text === "לא מעשן/ת") return;

    // התיאור החופשי נכתב בלשון המועמד/ת ואינו צריך כותרת מעליו
    if (item.id === "selfDescription" && !item.labelChanged) {
      flush();
      paragraphs.push(text);
      return;
    }

    const lead = leadFor(item, her);
    current.push(lead ? endSentence(`${lead} — ${text}`) : endSentence(text));
  });

  flush();
  return paragraphs.join("\n\n").trim();
}

// גרסה נוחה לקריאה מהטופס: מקבלת את הרשימה המסודרת יחד עם היסוד
// המרכזי, שהוא שאלה עם שאלת המשך משלה.
export function narrativeFromForm(form = {}, items = null, _legacy = null) {
  const gender = form.gender === "female" ? "female" : "male";
  if (!Array.isArray(items)) return "";
  const withElement = items.map((it) =>
    it.id === "element" ? { ...it, elementWhy: form.elementWhy } : it
  );
  return narrativeFromItems(withElement, gender);
}

// --- ריכוך תיאורים ישנים, לתצוגה בלבד ---
//
// המפתח הוא התווית שנשמרה בפורמט הישן. הערך הוא איך היא נקראת עכשיו:
//   null  – נשמט מהתצוגה, כי אותו מידע כבר מופיע כתג בראש הכרטיס.
//   מחרוזת – פתיח אנושי שמחליף את "שדה: ערך".
const LEGACY_LABELS = {
  "הגדרה דתית ואורח חיים": null,
  "מה אני עושה היום": null,
  "מצב משפחתי": null,
  אופי: "מבחינת אופי —",
  "היסוד המרכזי שלי": "היסוד שהכי מדבר אליי הוא",
  "הקשר שלי לברסלב": "הקשר שלי לברסלב —",
  "המסלול שלי": "הדרך שעברתי —",
  "רקע משפחתי": "על הבית שלי —",
  "תחביבים וכישרונות": "בזמן הפנוי —",
  "דברים שחשוב להכיר עליי": "ומשהו שחשוב לי שתדעו —",
  "מה אני מחפש/ת": "מה שאני מחפש/ת —",
  "גילאים מועדפים": "הגילאים שנוחים לי —",
  "דרישות מרכזיות": "חשוב לי במיוחד —",
  "הקשר לברסלב אצל בן/בת הזוג": "קשר לברסלב אצל בן או בת הזוג —",
  עישון: "לגבי עישון —",
};

// ניקוי הציונים המספריים מתוך תיאור אופי ישן: "(5/10)" אינו טקסט אנושי.
const stripScores = (text) => text.replace(/\s*\(\d{1,2}\/10\)/g, "").replace(/\s*·\s*/g, ", ");

export function humanizeBio(bio, candidate = {}) {
  const raw = clean(bio);
  if (!raw) return "";

  const coreValues = new Set(
    [candidate.religiousLevel, candidate.currentOccupation, candidate.city, candidate.eda]
      .map(clean)
      .filter(Boolean)
  );

  const out = [];
  raw
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .forEach((block) => {
      const match = block.match(/^([^:\n]{2,40}):\s*([\s\S]+)$/);
      if (!match) {
        // טקסט חופשי - נשאר בדיוק כפי שנכתב
        out.push(block);
        return;
      }
      const [, label, valueRaw] = match;
      const key = label.trim();
      if (!(key in LEGACY_LABELS)) {
        out.push(block);
        return;
      }
      const lead = LEGACY_LABELS[key];
      const value = clean(valueRaw).replace(/\.$/, "");
      // אותו מידע כבר מוצג כתג בראש הכרטיס
      if (lead === null || coreValues.has(value)) return;
      const body = key === "אופי" ? stripScores(value) : value;
      out.push(endSentence(`${lead} ${body}`));
    });

  return out.join("\n\n").trim();
}
