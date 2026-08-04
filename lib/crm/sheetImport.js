// שאיבת מועמדים מגיליון Google Sheets שפורסם לאינטרנט כ-CSV.
//
// למה CSV שפורסם ולא חיבור ישיר ל-Google: המערכת היא אתר סטטי בלי שרת משלה,
// ולכן אין מקום מאובטח להחזיק בו מפתח API של גוגל. גיליון שפורסם לצפייה מחזיר
// את הנתונים ישירות לדפדפן, בלי סיסמאות ובלי שרת ביניים.

import { REGIONS, religiousLevelsFor, EDUCATION_OPTIONS, YESHIVA_LEVELS } from "./mockData";

// המרת כל צורת קישור לגיליון לכתובת CSV שאפשר לקרוא ממנה
export function toCsvUrl(input) {
  const url = String(input || "").trim();
  if (!url) return null;
  if (url.includes("output=csv")) return url;

  // קישור "פרסום לאינטרנט": .../d/e/2PACX-.../pubhtml
  const pub = url.match(/\/spreadsheets\/d\/e\/([^/]+)\/pub/);
  if (pub) return `https://docs.google.com/spreadsheets/d/e/${pub[1]}/pub?output=csv`;

  // קישור רגיל של גיליון: .../spreadsheets/d/ID/edit#gid=0
  const normal = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (normal) {
    const gid = url.match(/[#&?]gid=(\d+)/);
    const base = `https://docs.google.com/spreadsheets/d/${normal[1]}/export?format=csv`;
    return gid ? `${base}&gid=${gid[1]}` : base;
  }
  return null;
}

// מפרק CSV כולל שדות במרכאות ושורות מרובות שורות בתוך תא
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => String(cell).trim() !== ""));
}

// ניחוש אוטומטי של העמודות לפי הכותרות בגיליון
const HEADER_HINTS = {
  name: ["שם מלא", "שם המועמד", "שם המועמדת", "שם", "name"],
  gender: ["מגדר", "בן/בת", "בחור/בחורה", "gender"],
  age: ["גיל", "age"],
  height: ["גובה", "height"],
  phone: ["טלפון", "נייד", "פלאפון", "phone"],
  city: ["עיר", "יישוב", "ישוב", "מגורים", "city"],
  region: ["אזור", "איזור", "region"],
  eda: ["עדה", "מוצא"],
  religiousLevel: ["דתיות", "השקפה", "זרם", "תורניות"],
  education: ["השכלה", "לימודים", "עיסוק"],
  yeshivaLevel: ["ישיבה", "רמת לימוד", "מסגרת"],
  bio: ["קצת", "תיאור", "אודות", "רקע", "על עצמ"],
  referenceContacts: ["ממליצים", "בירורים", "אנשי קשר"],
  photoUrl: ["תמונה", "תמונת", "photo", "image", "קישור לתמונה"],
};

export const FIELD_LABELS = {
  name: "שם מלא",
  gender: "מגדר",
  age: "גיל",
  height: "גובה",
  phone: "טלפון",
  city: "עיר",
  region: "אזור",
  eda: "עדה",
  religiousLevel: "רמת דתיות",
  education: "השכלה (בחורה)",
  yeshivaLevel: "רמת לימוד (בחור)",
  bio: "תיאור",
  referenceContacts: "מספרים לבירורים",
  photoUrl: "קישור לתמונה",
};

export function guessMapping(headers) {
  const mapping = {};
  const used = new Set();
  Object.entries(HEADER_HINTS).forEach(([field, hints]) => {
    const index = headers.findIndex(
      (h, i) => !used.has(i) && hints.some((hint) => String(h).toLowerCase().includes(hint.toLowerCase()))
    );
    if (index >= 0) {
      mapping[field] = index;
      used.add(index);
    }
  });
  return mapping;
}

const digitsOnly = (v) => String(v || "").replace(/[^0-9]/g, "");

// מפתח ייחודי לשורה, כדי שאותה שורה לא תיובא פעמיים
export function rowKey(row, mapping) {
  const phone = mapping.phone !== undefined ? digitsOnly(row[mapping.phone]) : "";
  if (phone.length >= 9) return `p:${phone}`;
  const name = mapping.name !== undefined ? String(row[mapping.name] || "").trim() : "";
  return `r:${name}|${row.join("|").slice(0, 160)}`;
}

// שליפת מזהה הקובץ מכל צורת קישור של Google Drive.
// טופס גוגל עם שאלת "העלאת קובץ" שומר בגיליון קישור בצורה משתנה,
// ולכן צריך לזהות את כולן.
export function driveFileId(value) {
  const url = String(value || "").trim();
  if (!url) return null;
  const patterns = [
    /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/,
    /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]{10,})/,
    /drive\.google\.com\/uc\?(?:[^&]*&)*id=([a-zA-Z0-9_-]{10,})/,
    /drive\.google\.com\/thumbnail\?(?:[^&]*&)*id=([a-zA-Z0-9_-]{10,})/,
    /drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]{10,})/,
    /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]{10,})/,
    /docs\.google\.com\/[^ ]*[?&]id=([a-zA-Z0-9_-]{10,})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

// כתובות חלופיות לאותה תמונה, מהאמינה ביותר לפחות אמינה.
// הכתובת הישנה (uc?export=view) נחסמת היום לעיתים קרובות ומחזירה דף HTML
// במקום תמונה, ולכן היא אחרונה ולא ראשונה.
export function photoUrlVariants(value) {
  const id = driveFileId(value);
  if (id) {
    return [
      `https://lh3.googleusercontent.com/d/${id}=w1200`,
      `https://drive.google.com/thumbnail?id=${id}&sz=w1200`,
      `https://drive.google.com/uc?export=view&id=${id}`,
    ];
  }
  const url = String(value || "").trim();
  return /^https?:\/\//.test(url) ? [url] : [];
}

export function normalizePhotoUrl(value) {
  return photoUrlVariants(value)[0] || null;
}

// תא בגיליון עשוי להכיל כמה קישורים (כשהמועמד/ת העלה/תה כמה תמונות)
export function photoUrlsFromCell(cell) {
  return String(cell || "")
    .split(/[\n,;|]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => normalizePhotoUrl(part))
    .filter(Boolean);
}

function pickOption(value, options) {
  const v = String(value || "").trim();
  if (!v) return null;
  const exact = options.find((o) => o === v);
  if (exact) return exact;
  const partial = options.find((o) => o !== "הכל" && o !== "לא משנה" && (v.includes(o) || o.includes(v)));
  return partial || null;
}

function detectGender(value) {
  const v = String(value || "").trim();
  if (/בחורה|נקבה|בת|female|f$/i.test(v)) return "female";
  if (/בחור|זכר|בן|male|m$/i.test(v)) return "male";
  return null;
}

// כותרות של שאלות טכניות/מערכתיות, שאין טעם שייכנסו לתיאור האישי
const TECHNICAL_HEADERS = [
  "חותמת זמן", "timestamp", "שעה", "תאריך",
  "טלפון", "נייד", "פלאפון", "phone",
  "מייל", "אימייל", "דואר אלקטרוני", "email",
  "תעודת זהות", "ת.ז", "ת\"ז", "מספר זהות",
  "תמונה", "קישור", "צילום", "photo", "image",
  "שם מלא", "שם פרטי", "שם משפחה",
  "אישור", "הסכמה", "תקנון", "חתימה",
];

export function isTechnicalHeader(header) {
  const h = String(header || "").trim().toLowerCase();
  if (!h) return true;
  return TECHNICAL_HEADERS.some((hint) => h.includes(hint.toLowerCase()));
}

// ברירת מחדל לעמודות התיאור: כל מה שאינו משויך לשדה אחר ואינו שאלה טכנית.
// המנהלת יכולה לסמן ולבטל כל עמודה בנפרד במסך הייבוא.
export function guessBioColumns(headers = [], mapping = {}) {
  const used = new Set(Object.values(mapping).filter((v) => v !== undefined && v !== null));
  return headers
    .map((header, index) => ({ header, index }))
    .filter(({ header, index }) => !used.has(index) && !isTechnicalHeader(header))
    .map(({ index }) => index);
}

// התיאור האישי נבנה מהתשובות בלבד, בלי כותרות השאלות, כטקסט רציף ונקי.
export function buildBioText(row, bioColumns = []) {
  return bioColumns
    .map((index) => String(row[index] ?? "").trim())
    .filter(Boolean)
    .join("\n\n");
}

// הופך שורה בגיליון לאובייקט מועמד/ת מוכן לשמירה.
// options.headers   - שורת הכותרות, לצורך ריכוז שאר השאלות בתיאור
// options.forcedGender - "male"/"female" כשכל הגיליון שייך למאגר אחד
// options.bioColumns   - העמודות שייכנסו לתיאור האישי (תשובות בלבד)
export function rowToCandidate(row, mapping, options = {}) {
  const { headers = [], forcedGender = "", bioColumns } = options;
  const bioIndexes = Array.isArray(bioColumns) ? bioColumns : guessBioColumns(headers, mapping);
  const get = (field) => (mapping[field] === undefined ? "" : String(row[mapping[field]] ?? "").trim());

  const gender = forcedGender || detectGender(get("gender")) || "male";
  const age = parseInt(digitsOnly(get("age")), 10);
  const heightRaw = get("height").replace(",", ".");
  let height = parseInt(digitsOnly(heightRaw), 10);
  if (/^1[.]\d/.test(heightRaw)) height = Math.round(parseFloat(heightRaw) * 100);

  const photos = photoUrlsFromCell(get("photoUrl"));
  const photo = photos[0] || null;

  const candidate = {
    gender,
    name: get("name"),
    age: Number.isFinite(age) && age >= 16 && age <= 99 ? age : null,
    height: Number.isFinite(height) && height >= 130 && height <= 220 ? height : null,
    phone: get("phone"),
    city: get("city"),
    eda: get("eda"),
    bio: [get("bio"), buildBioText(row, bioIndexes)].filter(Boolean).join("\n\n"),
    referenceContacts: get("referenceContacts"),
    region: pickOption(get("region"), REGIONS) || REGIONS[0],
    // כשאין נתון בגיליון נשמר הערך הנייטרלי ("הכל"), ולא ערך מומצא -
    // אחרת כל המיובאים היו מסומנים בטעות ברמת דתיות שלא נאמרה עליהם.
    religiousLevel: pickOption(get("religiousLevel"), religiousLevelsFor(gender)) || "הכל",
    photoUrl: photo,
    photoUrls: photos,
    // שדות שאינם מגיעים מהגיליון נשמרים בערך נייטרלי ולא נשארים ריקים,
    // אחרת עריכה של הכרטיס נכשלת בשמירה.
    smoking: "לא משנה",
    traits: [],
    lifestyle: [],
    sheetRowKey: rowKey(row, mapping),
  };

  if (gender === "female") {
    candidate.education = pickOption(get("education"), EDUCATION_OPTIONS) || "לא משנה";
    candidate.yeshivaLevel = null;
  } else {
    candidate.yeshivaLevel = pickOption(get("yeshivaLevel"), YESHIVA_LEVELS) || "לא משנה";
    candidate.education = null;
  }

  return candidate;
}

export async function fetchSheetRows(csvUrl) {
  const res = await fetch(csvUrl, { cache: "no-store" });
  if (!res.ok) throw new Error(`הגיליון לא נגיש (שגיאה ${res.status}). ודאי שהוא פורסם לאינטרנט.`);
  const text = await res.text();
  if (text.trim().startsWith("<")) {
    throw new Error("הכתובת מחזירה דף אינטרנט ולא נתונים. יש לפרסם את הגיליון כ-CSV.");
  }
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error("הגיליון ריק או מכיל רק שורת כותרות");
  return { headers: rows[0].map((h) => String(h).trim()), rows: rows.slice(1) };
}
