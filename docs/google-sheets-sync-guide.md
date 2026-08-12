# מנגנון סנכרון Google Sheets → מערכת — מדריך הטמעה מלא

מדריך מוכן להעתקה. כולל את המבנה, ההגדרות בצד גוגל, את כל הקוד, ואת נקודות החיבור למערכת החדשה.

---

## חלק 0 — העיקרון, בשתי פסקאות

הפתרון **לא** משתמש ב-Google Sheets API ולא במפתחות API. במקום זה, הגיליון "מפורסם לאינטרנט" כקובץ CSV, וזו כתובת ציבורית שאפשר לקרוא ממנה ישירות מהדפדפן.

**למה זה נבחר:** אין שרת. אתר סטטי אינו יכול להחזיק מפתח API בצורה מאובטחת — כל מפתח שנשלח לדפדפן חשוף לכל מי שפותח את כלי הפיתוח. גיליון שפורסם לצפייה מחזיר נתונים בלי סיסמה ובלי שרת ביניים. **המחיר:** כל מי שיש לו את הקישור יכול לקרוא את הגיליון, ולכן הגיליון חייב להכיל רק מידע שאתם מוכנים שיהיה קריא לבעל הקישור. המידע נעשה מוגן ברגע שהוא נכנס למסד הנתונים שלכם.

---

## חלק 1 — מבנה הפתרון

| רכיב | תפקיד | סוג |
|---|---|---|
| טופס Google (אופציונלי) | אוסף תשובות ומזין את הגיליון | צד גוגל |
| גיליון Google מפורסם כ-CSV | מקור הנתונים | צד גוגל |
| תיקיית Drive של התמונות | מאחסנת קבצים שהועלו בטופס | צד גוגל |
| `sheetImport.js` | כל לוגיקת השאיבה, הפענוח והמיפוי | קוד — ללא תלויות |
| מסך הייבוא | ממשק למנהל: קישור, מיפוי, תצוגה מקדימה, ייבוא | קוד — React |
| שמירת הגדרות | שומר קישור + מיפוי כדי שלא יוזנו כל פעם מחדש | מסד נתונים |
| שמירת מדיה (אופציונלי) | מוריד תמונות ושומר עותק פנימי | מסד נתונים |

**שלושת עמודי התווך של הלוגיקה:**

1. **מיפוי עמודות** — הגיליון לא יודע מה שמות השדות שלכם. המערכת מנחשת לפי הכותרות, והמנהל מתקן ידנית. המיפוי נשמר.
2. **מפתח שורה (`rowKey`)** — מונע ייבוא כפול. בלעדיו כל לחיצה על "ייבוא" תיצור כפילויות של כל הגיליון.
3. **אימות מול רשימות סגורות** — ערך מהגיליון שאינו קיים ברשימת האפשרויות שלכם נזרק ומוחלף בברירת מחדל נייטרלית, ולא נכנס כערך פסול.

---

## חלק 2 — הגדרות בצד גוגל (פעם אחת)

### 2.1 פרסום הגיליון כ-CSV

1. פותחים את הגיליון ב-Google Sheets.
2. תפריט **קובץ ← שיתוף ← פרסום באינטרנט** (File → Share → Publish to web).
3. בלשונית **קישור**: בוחרים את הגיליון הספציפי (לא "המסמך כולו").
4. בתפריט הפורמט בוחרים **ערכים מופרדים בפסיקים (.csv)**.
5. לוחצים **פרסם** ומאשרים.
6. מעתיקים את הקישור שמתקבל. הוא נראה כך:

```
https://docs.google.com/spreadsheets/d/e/2PACX-1vQ.../pub?gid=0&single=true&output=csv
```

> **הערה:** הקוד מקבל גם קישור עריכה רגיל (`.../spreadsheets/d/ID/edit#gid=0`) וממיר אותו לבד. אבל קישור עריכה עובד רק אם הגיליון משותף לצפייה ציבורית. **פרסום CSV הוא הדרך היציבה.**

### 2.2 שיתוף תיקיית התמונות ב-Drive

אם הטופס כולל שאלת "העלאת קובץ", הקבצים נשמרים בתיקייה בשם `<שם הטופס> (File responses)` ב-Drive שלכם, והם **פרטיים כברירת מחדל**.

1. פותחים את Google Drive ומאתרים את התיקייה.
2. קליק ימני ← **שיתוף**.
3. תחת "גישה כללית" משנים מ-"מוגבל" ל-**"כל מי שיש לו את הקישור"**.
4. התפקיד: **צופה** (Viewer).

**בלי הצעד הזה התמונות לא ייטענו.** זו התקלה הנפוצה ביותר במנגנון הזה.

### 2.3 שורת כותרות

השורה הראשונה בגיליון חייבת להיות שורת כותרות. הכותרות לא חייבות להיות מדויקות — יש ניחוש אוטומטי — אבל ככל שהן ברורות יותר, כך פחות תיקון ידני.

---

## חלק 3 — הקוד

### קובץ 1: `sheetImport.js` — כל הלוגיקה

**קובץ עצמאי לחלוטין, בלי שום ייבוא חיצוני.** את בלוק ההגדרות שבראשו מתאימים לתחום שלכם.

```js
// ============================================================================
//  שאיבת רשומות מגיליון Google Sheets שפורסם לאינטרנט כ-CSV.
//
//  למה CSV שפורסם ולא חיבור ישיר ל-Google API: מערכת ללא שרת אינה יכולה
//  להחזיק מפתח API בצורה מאובטחת. גיליון שפורסם לצפייה מחזיר את הנתונים
//  ישירות לדפדפן, בלי סיסמאות ובלי שרת ביניים.
// ============================================================================

// ----------------------------------------------------------------------------
//  אזור ההגדרות - זה כל מה שצריך להתאים לתחום שלכם
// ----------------------------------------------------------------------------

// רשימות סגורות: ערך מהגיליון שאינו מופיע כאן יוחלף בברירת מחדל נייטרלית
export const REGIONS = ["ירושלים", "מרכז", "צפון", "דרום"];
export const CATEGORY_OPTIONS = ["אפשרות א", "אפשרות ב", "לא משנה"];

// רמזים לניחוש אוטומטי של עמודות. מפתח = שם השדה במערכת שלכם,
// ערך = מילים שאם הן מופיעות בכותרת בגיליון, זו כנראה העמודה.
// ההתאמה היא "מכיל" ולא "שווה", ולכן "מה הגיל שלך?" יזוהה מהרמז "גיל".
const HEADER_HINTS = {
  name: ["שם מלא", "שם", "name"],
  gender: ["מגדר", "בן/בת", "gender"],
  age: ["גיל", "age"],
  height: ["גובה", "height"],
  phone: ["טלפון", "נייד", "פלאפון", "phone"],
  city: ["עיר", "יישוב", "ישוב", "מגורים", "city"],
  region: ["אזור", "איזור", "region"],
  eda: ["עדה", "מוצא"],
  category: ["קטגוריה", "סוג", "השקפה"],
  bio: ["קצת", "תיאור", "אודות", "רקע", "על עצמ"],
  referenceContacts: ["ממליצים", "בירורים", "אנשי קשר"],
  photoUrl: ["תמונה", "תמונת", "photo", "image", "קישור לתמונה"],
};

// התוויות שיוצגו במסך המיפוי, ליד כל תפריט בחירה
export const FIELD_LABELS = {
  name: "שם מלא",
  gender: "מגדר",
  age: "גיל",
  height: "גובה",
  phone: "טלפון",
  city: "עיר",
  region: "אזור",
  eda: "עדה",
  category: "קטגוריה",
  bio: "תיאור",
  referenceContacts: "מספרים לבירורים",
  photoUrl: "קישור לתמונה",
};

// כותרות של שאלות טכניות/מערכתיות, שאין טעם שייכנסו לתיאור החופשי
const TECHNICAL_HEADERS = [
  "חותמת זמן", "timestamp", "שעה", "תאריך",
  "טלפון", "נייד", "פלאפון", "phone",
  "מייל", "אימייל", "דואר אלקטרוני", "email",
  "תעודת זהות", "ת.ז", "ת\"ז", "מספר זהות",
  "תמונה", "קישור", "צילום", "photo", "image",
  "שם מלא", "שם פרטי", "שם משפחה",
  "אישור", "הסכמה", "תקנון", "חתימה",
];

// ----------------------------------------------------------------------------
//  1. המרת קישור לכתובת CSV
// ----------------------------------------------------------------------------

export function toCsvUrl(input) {
  const url = String(input || "").trim();
  if (!url) return null;
  if (url.includes("output=csv")) return url;

  // קישור "פרסום לאינטרנט": .../d/e/2PACX-.../pubhtml
  const pub = url.match(/\/spreadsheets\/d\/e\/([^/]+)\/pub/);
  if (pub) return `https://docs.google.com/spreadsheets/d/e/${pub[1]}/pub?output=csv`;

  // קישור עריכה רגיל: .../spreadsheets/d/ID/edit#gid=0
  const normal = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (normal) {
    const gid = url.match(/[#&?]gid=(\d+)/);
    const base = `https://docs.google.com/spreadsheets/d/${normal[1]}/export?format=csv`;
    return gid ? `${base}&gid=${gid[1]}` : base;
  }
  return null;
}

// ----------------------------------------------------------------------------
//  2. פענוח CSV
//
//  אל תשתמשו ב-split(",") - תשובה חופשית בטופס מכילה פסיקים וירידות שורה,
//  והן עטופות במרכאות. פענוח נאיבי ישבור כל שורה כזו לרסיסים.
// ----------------------------------------------------------------------------

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
          // מרכאות כפולות בתוך שדה מייצגות מרכאה אחת
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
  // שורות ריקות לגמרי נזרקות
  return rows.filter((r) => r.some((cell) => String(cell).trim() !== ""));
}

// ----------------------------------------------------------------------------
//  3. שאיבת הגיליון
// ----------------------------------------------------------------------------

export async function fetchSheetRows(csvUrl) {
  const res = await fetch(csvUrl, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`הגיליון לא נגיש (שגיאה ${res.status}). ודאו שהוא פורסם לאינטרנט.`);
  }
  const text = await res.text();
  // אם גוגל מחזיר דף HTML במקום נתונים, הגיליון לא פורסם כ-CSV
  if (text.trim().startsWith("<")) {
    throw new Error("הכתובת מחזירה דף אינטרנט ולא נתונים. יש לפרסם את הגיליון כ-CSV.");
  }
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error("הגיליון ריק או מכיל רק שורת כותרות");
  return { headers: rows[0].map((h) => String(h).trim()), rows: rows.slice(1) };
}

// ----------------------------------------------------------------------------
//  4. ניחוש מיפוי העמודות
//
//  used מבטיח שכל עמודה תשויך לשדה אחד בלבד. בלעדיו כותרת כמו
//  "עיר מגורים" הייתה נתפסת גם כ-city וגם כ-region.
// ----------------------------------------------------------------------------

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

// ----------------------------------------------------------------------------
//  5. מפתח שורה - מניעת ייבוא כפול
//
//  זה הרכיב הקריטי ביותר. הוא נשמר על כל רשומה שנוצרת, וההשוואה מולו
//  היא מה שמונע יצירת כפילויות בכל לחיצה על "ייבוא".
//
//  טלפון הוא המזהה המועדף: הוא יציב גם אם המועמד תיקן ניסוח בתשובה.
//  בלעדיו נופלים לטביעת אצבע של תוכן השורה - פחות יציב, אבל עדיף מכלום.
// ----------------------------------------------------------------------------

const digitsOnly = (v) => String(v || "").replace(/[^0-9]/g, "");

export function rowKey(row, mapping) {
  const phone = mapping.phone !== undefined ? digitsOnly(row[mapping.phone]) : "";
  if (phone.length >= 9) return `p:${phone}`;
  const name = mapping.name !== undefined ? String(row[mapping.name] || "").trim() : "";
  return `r:${name}|${row.join("|").slice(0, 160)}`;
}

// ----------------------------------------------------------------------------
//  6. קישורי תמונות מ-Google Drive
//
//  טופס גוגל שומר בגיליון קישור בצורה משתנה, ולכן צריך לזהות את כולן.
// ----------------------------------------------------------------------------

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

// שלוש כתובות חלופיות לאותה תמונה, מהאמינה ביותר לפחות אמינה.
// הכתובת הישנה (uc?export=view) נחסמת היום לעיתים קרובות ומחזירה דף HTML
// במקום תמונה, ולכן היא אחרונה ולא ראשונה. אל תשנו את הסדר הזה.
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

// תא בגיליון עשוי להכיל כמה קישורים (כשהועלו כמה קבצים)
export function photoUrlsFromCell(cell) {
  return String(cell || "")
    .split(/[\n,;|]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => normalizePhotoUrl(part))
    .filter(Boolean);
}

// ----------------------------------------------------------------------------
//  7. אימות מול רשימה סגורה
//
//  התאמה מדויקת קודמת. אחריה התאמה חלקית, שמצילה מקרים כמו
//  "אזור המרכז" מול הערך "מרכז". אם שום דבר לא מתאים - null, ולא ניחוש.
// ----------------------------------------------------------------------------

function pickOption(value, options) {
  const v = String(value || "").trim();
  if (!v) return null;
  const exact = options.find((o) => o === v);
  if (exact) return exact;
  const partial = options.find(
    (o) => o !== "הכל" && o !== "לא משנה" && (v.includes(o) || o.includes(v))
  );
  return partial || null;
}

function detectGender(value) {
  const v = String(value || "").trim();
  if (/בחורה|נקבה|בת|female|f$/i.test(v)) return "female";
  if (/בחור|זכר|בן|male|m$/i.test(v)) return "male";
  return null;
}

// ----------------------------------------------------------------------------
//  8. בניית התיאור החופשי מכל שאר העמודות
// ----------------------------------------------------------------------------

export function isTechnicalHeader(header) {
  const h = String(header || "").trim().toLowerCase();
  if (!h) return true;
  return TECHNICAL_HEADERS.some((hint) => h.includes(hint.toLowerCase()));
}

// ברירת מחדל: כל עמודה שאינה משויכת לשדה אחר ואינה שאלה טכנית.
// המנהל יכול לסמן ולבטל כל עמודה בנפרד במסך הייבוא.
export function guessBioColumns(headers = [], mapping = {}) {
  const used = new Set(Object.values(mapping).filter((v) => v !== undefined && v !== null));
  return headers
    .map((header, index) => ({ header, index }))
    .filter(({ header, index }) => !used.has(index) && !isTechnicalHeader(header))
    .map(({ index }) => index);
}

// התיאור נבנה מהתשובות בלבד, בלי כותרות השאלות, כטקסט רציף ונקי.
// שורה ריקה כפולה בין תשובות היא מה שנותן טקסט קריא ולא גוש אחד.
export function buildBioText(row, bioColumns = []) {
  return bioColumns
    .map((index) => String(row[index] ?? "").trim())
    .filter(Boolean)
    .join("\n\n");
}

// ----------------------------------------------------------------------------
//  9. המרת שורה לרשומה
//
//  options.headers      - שורת הכותרות
//  options.forcedGender - "male"/"female" כשכל הגיליון שייך לקבוצה אחת
//  options.bioColumns   - העמודות שייכנסו לתיאור החופשי
// ----------------------------------------------------------------------------

export function rowToCandidate(row, mapping, options = {}) {
  const { headers = [], forcedGender = "", bioColumns } = options;
  const bioIndexes = Array.isArray(bioColumns) ? bioColumns : guessBioColumns(headers, mapping);
  const get = (field) => (mapping[field] === undefined ? "" : String(row[mapping[field]] ?? "").trim());

  const gender = forcedGender || detectGender(get("gender")) || "male";

  const age = parseInt(digitsOnly(get("age")), 10);

  // גובה מתקבל גם כ-"1.80" וגם כ-"180"
  const heightRaw = get("height").replace(",", ".");
  let height = parseInt(digitsOnly(heightRaw), 10);
  if (/^1[.]\d/.test(heightRaw)) height = Math.round(parseFloat(heightRaw) * 100);

  const photos = photoUrlsFromCell(get("photoUrl"));

  return {
    gender,
    name: get("name"),
    // ערך מספרי מחוץ לטווח הגיוני נזרק ולא נשמר כזבל
    age: Number.isFinite(age) && age >= 16 && age <= 99 ? age : null,
    height: Number.isFinite(height) && height >= 130 && height <= 220 ? height : null,
    phone: get("phone"),
    city: get("city"),
    eda: get("eda"),
    bio: [get("bio"), buildBioText(row, bioIndexes)].filter(Boolean).join("\n\n"),
    referenceContacts: get("referenceContacts"),
    region: pickOption(get("region"), REGIONS) || REGIONS[0],
    // כשאין נתון בגיליון נשמר ערך נייטרלי ולא ערך מומצא - אחרת כל
    // המיובאים היו מסומנים בטעות בערך שלא נאמר עליהם
    category: pickOption(get("category"), CATEGORY_OPTIONS) || "לא משנה",
    photoUrl: photos[0] || null,
    photoUrls: photos,
    // שדות שאינם מגיעים מהגיליון נשמרים בערך נייטרלי ולא נשארים undefined.
    // Firestore דוחה undefined ומפיל את כל השמירה.
    traits: [],
    // המפתח שמונע ייבוא כפול - חובה לשמור אותו על הרשומה
    sheetRowKey: rowKey(row, mapping),
  };
}
```

---

### קובץ 2: מסך הייבוא (React)

```jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  toCsvUrl,
  fetchSheetRows,
  guessMapping,
  rowKey,
  rowToCandidate,
  photoUrlVariants,
  guessBioColumns,
  FIELD_LABELS,
} from "./sheetImport";

// ============================================================================
//  שלוש נקודות החיבור למערכת שלכם - החליפו אותן במימוש שלכם:
//
//  records          - מערך הרשומות הקיימות (לזיהוי מה כבר יובא)
//  addRecord(data)  - יוצר רשומה חדשה
//  updateRecord(id, patch) - מעדכן רשומה קיימת
//  savedConfig / saveConfig - שמירת הקישור והמיפוי בין ביקורים
//  saveMedia(blob)  - אופציונלי: שומר תמונה במסד הנתונים ומחזיר הפניה
// ============================================================================

export default function SheetImportPage({
  records = [],
  addRecord,
  updateRecord,
  savedConfig = {},
  saveConfig = async () => {},
  saveMedia = null,
  isMediaRef = () => false,
  showToast = (msg) => alert(msg),
}) {
  const [linkDraft, setLinkDraft] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [bioColumns, setBioColumns] = useState([]);
  const [forcedGender, setForcedGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  // שחזור ההגדרות השמורות
  useEffect(() => {
    setLinkDraft(savedConfig?.csvUrl || "");
    if (savedConfig?.mapping && Object.keys(savedConfig.mapping).length) setMapping(savedConfig.mapping);
    if (savedConfig?.forcedGender) setForcedGender(savedConfig.forcedGender);
    if (Array.isArray(savedConfig?.bioColumns)) setBioColumns(savedConfig.bioColumns);
  }, [savedConfig]);

  // מפתחות השורות שכבר יובאו - הלב של מניעת הכפילויות
  const importedKeys = useMemo(
    () => new Set(records.map((c) => c.sheetRowKey).filter(Boolean)),
    [records]
  );

  const newRows = useMemo(
    () => rows.filter((r) => !importedKeys.has(rowKey(r, mapping))),
    [rows, mapping, importedKeys]
  );

  const alreadyImported = rows.filter((r) => importedKeys.has(rowKey(r, mapping))).length;

  const toCandidate = (row) => rowToCandidate(row, mapping, { headers, forcedGender, bioColumns });

  const load = async (rawUrl) => {
    const csvUrl = toCsvUrl(rawUrl);
    if (!csvUrl) {
      setError("הקישור אינו נראה כמו קישור לגיליון Google");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { headers: h, rows: r } = await fetchSheetRows(csvUrl);
      setHeaders(h);
      setRows(r);
      const nextMapping = Object.keys(mapping).length ? mapping : guessMapping(h);
      setMapping(nextMapping);
      const savedBio = Array.isArray(savedConfig?.bioColumns) ? savedConfig.bioColumns : null;
      const nextBio = savedBio && savedBio.length ? savedBio : guessBioColumns(h, nextMapping);
      setBioColumns(nextBio);
      await saveConfig({ csvUrl, mapping: nextMapping, bioColumns: nextBio });
    } catch (e) {
      setError(e?.message || "שאיבת הגיליון נכשלה");
      setHeaders([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  // מוריד את התמונה מהקישור בגיליון ושומר עותק בתוך המערכת, כדי שהיא
  // לא תהיה תלויה בהרשאות Drive ולא תיעלם בעתיד. אם ההורדה נחסמת -
  // נשמר הקישור הישיר כגיבוי.
  const storePhotoLocally = async (value) => {
    if (!saveMedia) return null;
    for (const candidateUrl of photoUrlVariants(value)) {
      try {
        const res = await fetch(candidateUrl, { mode: "cors" });
        if (!res.ok) continue;
        const blob = await res.blob();
        if (!blob.type.startsWith("image/")) continue;
        return await saveMedia(blob);
      } catch {
        // ממשיכים לצורת הכתובת הבאה
      }
    }
    return null;
  };

  const withStoredPhotos = async (data) => {
    const sources = data.photoUrls?.length ? data.photoUrls : data.photoUrl ? [data.photoUrl] : [];
    if (sources.length === 0) return { data, stored: 0, linked: 0 };
    let stored = 0;
    let linked = 0;
    const saved = [];
    for (const source of sources) {
      if (isMediaRef(source)) {
        saved.push(source);
        continue;
      }
      const ref = await storePhotoLocally(source);
      if (ref) {
        saved.push(ref);
        stored++;
      } else {
        saved.push(source);
        linked++;
      }
    }
    return { data: { ...data, photoUrls: saved, photoUrl: saved[0] || null }, stored, linked };
  };

  const changeMapping = async (field, value) => {
    const next = { ...mapping };
    if (value === "") delete next[field];
    else next[field] = Number(value);
    setMapping(next);
    await saveConfig({ mapping: next });
  };

  const toggleBioColumn = async (index) => {
    const next = bioColumns.includes(index)
      ? bioColumns.filter((i) => i !== index)
      : [...bioColumns, index].sort((a, b) => a - b);
    setBioColumns(next);
    await saveConfig({ bioColumns: next });
  };

  const setAllBioColumns = async (all) => {
    const next = all ? headers.map((_, i) => i) : [];
    setBioColumns(next);
    await saveConfig({ bioColumns: next });
  };

  const chooseGender = async (value) => {
    setForcedGender(value);
    await saveConfig({ forcedGender: value });
  };

  const runImport = async () => {
    if (newRows.length === 0 || importing) return;
    if (mapping.name === undefined) {
      setError("חובה לבחור עמודה של שם מלא לפני הייבוא");
      return;
    }
    if (!forcedGender && mapping.gender === undefined) {
      setError("חובה לבחור לאיזו קבוצה שייכות השורות בגיליון הזה");
      return;
    }
    setImporting(true);
    setError("");
    let ok = 0;
    let skipped = 0;
    let photosStored = 0;
    let photosLinked = 0;
    for (let i = 0; i < newRows.length; i++) {
      setProgress(`מייבא ${i + 1} מתוך ${newRows.length}...`);
      const parsed = toCandidate(newRows[i]);
      if (!parsed.name) {
        skipped++;
        continue;
      }
      try {
        const { data, stored, linked } = await withStoredPhotos(parsed);
        photosStored += stored;
        photosLinked += linked;
        await addRecord(data);
        ok++;
      } catch {
        skipped++;
      }
    }
    setProgress("");
    setImporting(false);
    showToast(
      `יובאו ${ok} רשומות${skipped ? `, ${skipped} דולגו` : ""}` +
        (photosStored ? ` · ${photosStored} תמונות נשמרו במערכת` : "") +
        (photosLinked ? ` · ${photosLinked} תמונות לא ניתנות להורדה` : "")
    );
  };

  // עדכון רשומות שכבר יובאו: משלים תיאור ותמונות בלי ליצור כפילויות
  const runRepair = async () => {
    if (rows.length === 0 || repairing) return;
    setRepairing(true);
    setError("");
    const byKey = new Map();
    records.forEach((c) => {
      if (c.sheetRowKey) byKey.set(c.sheetRowKey, c);
    });

    let updated = 0;
    for (let i = 0; i < rows.length; i++) {
      setProgress(`מעדכן ${i + 1} מתוך ${rows.length}...`);
      const existing = byKey.get(rowKey(rows[i], mapping));
      if (!existing) continue;
      const fresh = toCandidate(rows[i]);
      const patch = {};
      if (fresh.bio && fresh.bio !== existing.bio) patch.bio = fresh.bio;

      const hasStoredPhoto = isMediaRef(existing.photoUrl);
      if (fresh.photoUrls?.length && !hasStoredPhoto) {
        const { data } = await withStoredPhotos(fresh);
        if (data.photoUrl && data.photoUrl !== existing.photoUrl) {
          patch.photoUrl = data.photoUrl;
          patch.photoUrls = data.photoUrls;
        }
      }
      if (forcedGender && existing.gender !== forcedGender) patch.gender = forcedGender;
      if (Object.keys(patch).length === 0) continue;
      try {
        await updateRecord(existing.id, patch);
        updated++;
      } catch {
        // ממשיכים לשורה הבאה
      }
    }
    setProgress("");
    setRepairing(false);
    showToast(updated ? `עודכנו ${updated} רשומות קיימות` : "לא נמצאו רשומות לעדכון");
  };

  return (
    <div style={{ padding: 16 }} dir="rtl">
      <h1>ייבוא מגיליון Google</h1>
      <p>שואב שורות חדשות מהגיליון ופותח מהן רשומות. שורה שכבר יובאה לא תיובא שוב.</p>

      {/* --- קישור לגיליון --- */}
      <input
        type="url"
        dir="ltr"
        value={linkDraft}
        onChange={(e) => setLinkDraft(e.target.value)}
        placeholder="https://docs.google.com/spreadsheets/..."
        style={{ width: "100%" }}
      />
      <button onClick={() => load(linkDraft)} disabled={loading}>
        {loading ? "טוען מהגיליון..." : "בדיקת הגיליון ורענון"}
      </button>

      <ol>
        <li>פותחים את הגיליון ב-Google Sheets</li>
        <li>קובץ ← שיתוף ← פרסום באינטרנט</li>
        <li>בוחרים את הגיליון הרצוי, ובפורמט בוחרים CSV</li>
        <li>לוחצים פרסם, מעתיקים את הקישור ומדביקים כאן</li>
      </ol>

      {error && <p style={{ color: "#C24545" }}>{error}</p>}

      {headers.length > 0 && (
        <>
          {/* --- מיפוי עמודות --- */}
          <h2>התאמת עמודות</h2>
          <p>המערכת ניחשה לפי הכותרות. אפשר לתקן, והבחירה נשמרת לפעם הבאה.</p>
          {Object.entries(FIELD_LABELS).map(([field, label]) => (
            <div key={field}>
              <span>{label}</span>
              <select
                value={mapping[field] === undefined ? "" : String(mapping[field])}
                onChange={(e) => changeMapping(field, e.target.value)}
              >
                <option value="">-- אין עמודה --</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>{h || `עמודה ${i + 1}`}</option>
                ))}
              </select>
            </div>
          ))}

          {/* --- בחירת עמודות התיאור --- */}
          <h2>מה ייכנס לתיאור החופשי?</h2>
          <button onClick={() => setAllBioColumns(true)}>סימון הכל</button>
          <button onClick={() => setAllBioColumns(false)}>ניקוי הכל</button>
          <span>{bioColumns.length} עמודות נבחרו</span>
          {headers.map((header, index) => (
            <label key={index} style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={bioColumns.includes(index)}
                onChange={() => toggleBioColumn(index)}
              />
              {header || `עמודה ${index + 1}`}
            </label>
          ))}

          {/* --- בחירת קבוצה --- */}
          <h2>לאיזו קבוצה השורות שייכות?</h2>
          {[
            { key: "female", label: "בנות" },
            { key: "male", label: "בנים" },
            ...(mapping.gender !== undefined ? [{ key: "", label: "לפי העמודה בגיליון" }] : []),
          ].map((option) => (
            <button
              key={option.key || "column"}
              onClick={() => chooseGender(option.key)}
              style={{ fontWeight: forcedGender === option.key ? "bold" : "normal" }}
            >
              {option.label}
            </button>
          ))}

          {/* --- עדכון קיימות --- */}
          {alreadyImported > 0 && (
            <>
              <h2>עדכון רשומות שכבר יובאו</h2>
              <p>{alreadyImported} שורות כבר קיימות. הכפתור משלים בהן תיאור ותמונות. לא נוצרות רשומות חדשות.</p>
              <button onClick={runRepair} disabled={repairing}>
                {repairing ? progress || "מעדכן..." : `עדכון ${alreadyImported} הרשומות הקיימות`}
              </button>
            </>
          )}

          {/* --- ייבוא חדשות --- */}
          <h2>שורות חדשות לייבוא ({newRows.length} מתוך {rows.length})</h2>
          {newRows.length === 0 ? (
            <p>הכל מסונכרן - אין שורות חדשות בגיליון</p>
          ) : (
            <>
              {newRows.slice(0, 25).map((r, i) => {
                const preview = toCandidate(r);
                return (
                  <div key={i}>
                    <b>{preview.name || "(ללא שם - ידולג)"}</b>
                    <span>
                      {[preview.age ? `גיל ${preview.age}` : null, preview.city, preview.photoUrl ? "כולל תמונה" : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </div>
                );
              })}
              {newRows.length > 25 && <p>ועוד {newRows.length - 25} שורות...</p>}
              <button onClick={runImport} disabled={importing}>
                {importing ? progress || "מייבא..." : `ייבוא ${newRows.length} רשומות`}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}
```

---

## חלק 4 — נקודות החיבור למערכת שלכם

### 4.1 שמירת ההגדרות

הקישור, המיפוי, עמודות התיאור ובחירת הקבוצה נשמרים במסמך הגדרות אחד. בלי זה המנהל יצטרך למפות מחדש בכל פעם.

```js
// זהו המימוש ב-Firestore. אפשר גם localStorage לגרסה פשוטה.
sheetImport: { csvUrl: "", mapping: {} },

setSheetImportConfig: async (config) => {
  await setDoc(
    doc(db, "settings", "app"),
    { sheetImport: { ...get().sheetImport, ...config } },
    { merge: true }
  );
},
```

מאזין שמחזיר את ההגדרות בטעינה:

```js
onSnapshot(doc(db, "settings", "app"), (d) => {
  const data = d.exists() ? d.data() : {};
  set({ sheetImport: data.sheetImport ?? { csvUrl: "", mapping: {} } });
});
```

### 4.2 יצירת רשומה

`addRecord` חייב:

1. לשמור את `sheetRowKey` כפי שהתקבל — **בלעדיו כל ייבוא ייצור כפילויות**.
2. להמיר `undefined` ל-`null` לפני השמירה. Firestore דוחה `undefined` ומפיל את כל הפעולה:

```js
function stripUndefined(value) {
  if (Array.isArray(value)) return value.map(stripUndefined);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, v === undefined ? null : stripUndefined(v)])
    );
  }
  return value === undefined ? null : value;
}

addRecord: async (data) => {
  const ref = await addDoc(collection(db, "records"), stripUndefined({
    createdAt: new Date().toISOString(),
    ...data,
  }));
  return { id: ref.id, ...data };
},
```

### 4.3 כללי אבטחה (Firestore)

ההגדרות נשמרות במסמך הגדרות שכבר קיים, ולכן **לא נדרש כלל אבטחה חדש**:

```
match /settings/{id} {
  allow read: if isStaff();
  allow write: if isAdmin();
}
```

---

## חלק 5 — סדר ההפעלה

| # | פעולה | היכן |
|---|---|---|
| 1 | פרסום הגיליון כ-CSV | Google Sheets |
| 2 | שיתוף תיקיית התמונות כ"כל מי שיש לו הקישור / צופה" | Google Drive |
| 3 | הוספת `sheetImport.js` והתאמת בלוק ההגדרות | קוד |
| 4 | הוספת מסך הייבוא וחיבור שלוש נקודות החיבור | קוד |
| 5 | הגבלת המסך למנהל בלבד | קוד |
| 6 | הדבקת הקישור ולחיצה על "בדיקת הגיליון" | ממשק |
| 7 | תיקון המיפוי האוטומטי במידת הצורך | ממשק |
| 8 | סימון עמודות התיאור ובחירת הקבוצה | ממשק |
| 9 | בדיקת התצוגה המקדימה | ממשק |
| 10 | לחיצה על "ייבוא" | ממשק |

**מהריצה השנייה ואילך:** רק שלבים 6 ו-10. כל ההגדרות נשמרו.

---

## חלק 6 — טבלת תקלות

| תסמין | סיבה | פתרון |
|---|---|---|
| "הכתובת מחזירה דף אינטרנט ולא נתונים" | הגיליון לא פורסם כ-CSV | חזרה לשלב 2.1, לוודא שנבחר פורמט CSV |
| "הגיליון לא נגיש (שגיאה 401/403)" | הגיליון פרטי | לפרסם לאינטרנט, לא רק לשתף |
| כל השורות מיובאות שוב בכל פעם | `sheetRowKey` לא נשמר על הרשומה | לוודא שהשדה מגיע למסד הנתונים |
| השדות מתערבבים בין עמודות | הניחוש טעה | לתקן ידנית במסך המיפוי — הבחירה נשמרת |
| התמונות ריקות / רקע כתום | תיקיית Drive פרטית | שלב 2.2 |
| תשובות ארוכות נשברות לרסיסים | פענוח CSV נאיבי | להשתמש ב-`parseCsv` שכאן, לא ב-`split(",")` |
| שגיאת "Unsupported field value: undefined" | Firestore דוחה `undefined` | להפעיל `stripUndefined` לפני השמירה |
| כל השורות נכנסו לקבוצה הלא נכונה | לא נבחרה קבוצה, נלקחה ברירת המחדל | לבחור קבוצה לפני הייבוא ולהריץ "עדכון קיימות" |

---

## חלק 7 — התאמה לתחום אחר

כדי להעביר את זה לתחום שאינו שידוכים, נגעו רק בשלושה מקומות ב-`sheetImport.js`:

1. **`HEADER_HINTS`** — שמות השדות שלכם והמילים שמזהות אותם בכותרות.
2. **`FIELD_LABELS`** — התוויות שיוצגו במסך המיפוי.
3. **`rowToCandidate`** — מבנה הרשומה שהמערכת שלכם מצפה לו, כולל טווחי התקינות.

`parseCsv`, `toCsvUrl`, `rowKey`, `driveFileId` ו-`photoUrlVariants` הם גנריים לחלוטין ואינם דורשים שינוי.

---

## חלק 8 — מגבלות שכדאי להכיר מראש

- **הסנכרון ידני.** אין רענון אוטומטי. מישהו לוחץ על כפתור. זו החלטה מכוונת: ייבוא אוטומטי לתוך מאגר אמיתי בלי עין אנושית הוא מתכון לזיהום נתונים.
- **כיוון אחד בלבד.** שינוי במערכת אינו חוזר לגיליון.
- **הגיליון קריא לבעל הקישור.** אין להכניס אליו מידע שאסור שייחשף.
- **ייבוא גדול לוקח זמן.** כל רשומה היא כתיבה נפרדת, ותמונה מוסיפה הורדה ושמירה. 40 שורות עם תמונות — כמה דקות.
- **`rowKey` תלוי בטלפון.** אם אין עמודת טלפון, המפתח נשען על תוכן השורה, ותיקון בגיליון עלול להיראות כשורה חדשה.
