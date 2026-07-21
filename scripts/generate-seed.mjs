// מייצר את supabase/seed.sql עם אותם נתוני דמה שמופיעים בהדגמה (lib/data.js),
// כדי שהמידע במסד הנתונים האמיתי יהיה זהה למה שכבר נראה. הרצה: node scripts/generate-seed.mjs > supabase/seed.sql

const REGIONS = ["ירושלים", "מרכז", "שפלה", "שרון", "דרום", "צפון"];
const RELIGIOUS_LEVELS = ["דתי", "תורני", 'חרד"ל'];
const MALE_NAMES = ["יהודה", "נתנאל", "עידו", "שמעון", "אריאל", "בנימין", "יוסף", "עמיחי", "אלישע", "גדי"];
const FEMALE_NAMES = ["שירה", "תמר", "נעמי", "אביגיל", "הדס", "יעל", "רות", "עדי", "מיכל", "אורית"];
const ABOUT_SNIPPETS = [
  "בחור/ה נעים/ה, בעל/ת חוש הומור, קרוב/ה למשפחה וחברים.",
  "רציני/ת, שאפתן/ית, אוהב/ת ללמוד ולהתפתח כל הזמן.",
  "אווירה חמה, פשוט/ה ואמיתי/ת, מחפש/ת קשר יציב ובריא.",
  "רגוע/ה, קשוב/ה, בעל/ת עולם רוחני עשיר.",
  "בעל/ת ביטחון עצמי, אנרגטי/ת ואוהב/ת אנשים.",
];
const STAFF_NAMES = ["רוני", "אוהד", "אלעזר"];

function seededScore(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

function escape(value) {
  if (value == null) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `ARRAY[${value.map((v) => `'${v.replace(/'/g, "''")}'`).join(",")}]::text[]`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildCandidates(names, gender) {
  const studies = ["ישיבה גבוהה", "הסדר", "עובד ולומד", "עובד"];
  const educations = ["סמינר / מכינה", "לומד בישיבה / כולל", "תואר ראשון", "תואר שני", "עובד/ת"];

  return names.map((name, i) => {
    const seed = `${gender}-${name}-${i}`;
    const h = seededScore(seed);
    const age = 21 + (h % 14);
    const height = gender === "male" ? 168 + (h % 22) : 155 + (h % 20);
    const region = REGIONS[h % REGIONS.length];
    const religiousLevel = RELIGIOUS_LEVELS[h % RELIGIOUS_LEVELS.length];
    const genderDigit = gender === "male" ? "a" : "b";
    const id = `00000000-0000-0000-000${genderDigit}-${String(i + 1).padStart(12, "0")}`;
    return {
      id,
      gender,
      name,
      age,
      height,
      region,
      religiousLevel,
      study: gender === "male" ? studies[h % studies.length] : educations[h % educations.length],
      smoking: h % 3 === 0 ? "לא מעשן/ת" : "לא מעשן/ת בקביעות",
      traits: ["הומור", "רוגע", "משפחתיות", "רגישות", "שאפתנות", "רוחניות", "ביטחון עצמי", "מנהיגות"].filter(
        (_, idx) => (h >> idx) % 3 === 0
      ),
      about: ABOUT_SNIPPETS[h % ABOUT_SNIPPETS.length],
      image: `https://picsum.photos/seed/${gender}-${i + 12}/600/800`,
      isNew: i < 3,
      isPrevious: i >= 6,
      staffNote: `שיחה עם המשפחה התקדמה יפה, ${STAFF_NAMES[h % STAFF_NAMES.length]} מלווה/ת את התיק.`,
      adminNote: i % 2 === 0 ? "לחזור לבדוק המלצות נוספות בשבוע הבא." : "",
    };
  });
}

function buildInsert(candidates) {
  return candidates
    .map(
      (c) => `insert into candidates (id, gender, name, age, height, region, religious_level, study, smoking, traits, about, image_url, is_new, is_previous)
values ('${c.id}', ${escape(c.gender)}, ${escape(c.name)}, ${escape(c.age)}, ${escape(c.height)}, ${escape(c.region)}, ${escape(c.religiousLevel)}, ${escape(c.study)}, ${escape(c.smoking)}, ${escape(c.traits)}, ${escape(c.about)}, ${escape(c.image)}, ${escape(c.isNew)}, ${escape(c.isPrevious)})
on conflict (id) do nothing;

insert into candidate_internal_notes (candidate_id, staff_note, admin_note)
values ('${c.id}', ${escape(c.staffNote)}, ${escape(c.adminNote)})
on conflict (candidate_id) do nothing;
`
    )
    .join("\n");
}

const sql = `-- קובץ זה נוצר אוטומטית ע"י scripts/generate-seed.mjs
-- מריצים אותו ב-Supabase SQL Editor אחרי שהרצת את schema.sql

${buildInsert(buildCandidates(MALE_NAMES, "male"))}
${buildInsert(buildCandidates(FEMALE_NAMES, "female"))}
`;

console.log(sql);
