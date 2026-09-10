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

export function characterSentence(form, gender) {
  const parts = ["introExtro", "heartMind", "planFlow"]
    .map((id) => {
      const b = bucketOf(form[id]);
      return b === null ? null : SCALE_PHRASES[id][b];
    })
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
export function narrativeFromForm(form = {}) {
  const gender = form.gender === "female" ? "female" : "male";
  const paragraphs = [];
  const push = (text) => {
    const t = clean(text);
    if (t) paragraphs.push(t);
  };

  push(form.selfDescription);

  push([characterSentence(form, gender), elementSentence(form.element, form.elementWhy)].filter(Boolean).join(" "));

  push(
    [
      clean(form.breslov) ? endSentence(`הקשר שלי לברסלב — ${clean(form.breslov)}`) : "",
      clean(form.pathStory) ? endSentence(`הדרך שעברתי — ${clean(form.pathStory)}`) : "",
    ]
      .filter(Boolean)
      .join(" ")
  );

  push(
    [
      clean(form.familyBackground) ? endSentence(`על הבית שלי — ${clean(form.familyBackground)}`) : "",
      clean(form.hobbies) ? endSentence(`בזמן הפנוי — ${clean(form.hobbies)}`) : "",
      clean(form.importantToKnow) ? endSentence(`ומשהו שחשוב לי שתדעו — ${clean(form.importantToKnow)}`) : "",
    ]
      .filter(Boolean)
      .join(" ")
  );

  const wants = [
    clean(form.lookingFor) ? endSentence(`מה שאני מחפש${gender === "female" ? "ת" : ""} — ${clean(form.lookingFor)}`) : "",
    clean(form.preferredAges) ? endSentence(`הגילאים שנוחים לי — ${clean(form.preferredAges)}`) : "",
    clean(form.mainRequirements) ? endSentence(`חשוב לי במיוחד — ${clean(form.mainRequirements)}`) : "",
    clean(form.breslovInPartner) ? endSentence(`קשר לברסלב אצל בן או בת הזוג — ${clean(form.breslovInPartner)}`) : "",
  ].filter(Boolean);
  push(wants.join(" "));

  // עישון מצוין רק כשהוא רלוונטי. "לא מעשן" אינו מידע שמוסיף משהו.
  if (clean(form.smokingSelf) && clean(form.smokingSelf) !== "לא מעשן/ת") {
    push(endSentence(`לגבי עישון — ${clean(form.smokingSelf)}`));
  }

  return paragraphs.join("\n\n").trim();
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
