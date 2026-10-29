// בחירת מודל Gemini מתוך הרשימה שהחשבון באמת מחזיר.
//
// הרקע: שמות המודלים של Google מתחלפים, ומודל שקיים היום יכול להיעלם מחר.
// במקום לנחש שם קבוע, השרת שואל את Google אילו מודלים זמינים במפתח הזה
// (GET /v1beta/models) ובוחר מתוכם לפי כללים קבועים:
//   1. רק מודלים שתומכים ביצירת טקסט (generateContent)
//   2. רק משפחת gemini, בלי מודלים ייעודיים (תמונה, קול, הטמעות וכו')
//   3. Flash קודם ל-Pro: מהיר יותר, ומספיק בתוך מגבלת 60 השניות של השרת
//      ובמכסות של המסלול החינמי
//   4. הכינוי "latest" (שמתעדכן לבד) קודם לכל השאר
//   5. גרסה יציבה קודמת לניסיונית, וגרסה חדשה קודמת לישנה
//   6. "lite" - רק כשאין אחר
// הקובץ טהור: אין בו פניות לרשת, ולכן אפשר לבדוק אותו ישירות.

const EXCLUDE = /(embed|image|imagen|veo|tts|audio|live|aqa|robotics|computer-use|learnlm|gemma)/i;

export function textModelNames(models) {
  return (Array.isArray(models) ? models : [])
    .filter((m) => (m?.supportedGenerationMethods || m?.supportedActions || []).includes("generateContent"))
    .map((m) => String(m?.name || "").replace(/^models\//, ""))
    .filter((n) => n.startsWith("gemini") && !EXCLUDE.test(n));
}

function score(name) {
  const isFlash = /flash/i.test(name);
  const isPro = /pro/i.test(name);
  const isLite = /lite/i.test(name);
  const isLatest = /latest/i.test(name);
  const unstable = /(preview|exp|experimental|\d{4}-\d{2}|-\d{3}$)/i.test(name);
  const ver = Number((/gemini-(\d+(?:\.\d+)?)/i.exec(name) || [])[1] || 0);
  return [
    isFlash && !isLite ? 3 : isPro ? 2 : isLite ? 1 : 0, // משפחה
    isLatest ? 1 : 0, // כינוי שמתעדכן לבד
    unstable ? 0 : 1, // יציבות
    ver, // גרסה
  ];
}

const compare = (a, b) => {
  const sa = score(a);
  const sb = score(b);
  for (let i = 0; i < sa.length; i += 1) if (sa[i] !== sb[i]) return sb[i] - sa[i];
  return a.localeCompare(b);
};

// מחזיר את המודל המועדף, או null אם אין אף מודל טקסט מתאים בחשבון
export function pickModel(models) {
  const names = textModelNames(models).sort(compare);
  return names[0] || null;
}

export function rankedModels(models) {
  return textModelNames(models).sort(compare);
}

// סדר הניסיונות כשמודל עמוס. כינויים שונים של אותו מודל (למשל
// "gemini-flash-latest" ו-"gemini-2.5-flash") חולקים את אותו עומס, ולכן
// אין טעם לנסות אותם אחד אחרי השני. הסדר:
//   1. המודל המועדף
//   2. הקל ביותר (lite) - שבדרך כלל פנוי גם כשהאחרים עמוסים
//   3. מודל מגרסה ישנה יותר, שאינו כינוי - עם קיבולת נפרדת
//   ואם אין כאלה - הבא ברשימה
const verOf = (name) => Number((/gemini-(\d+(?:\.\d+)?)/i.exec(name) || [])[1] || 0);

export function tryOrder(ranked, max = 3) {
  const list = Array.isArray(ranked) ? ranked : [];
  const out = [];
  const add = (n) => {
    if (n && out.length < max && !out.includes(n)) out.push(n);
  };
  const full = list.filter((n) => !/lite/i.test(n));
  const lite = list.filter((n) => /lite/i.test(n));
  add(full[0] || lite[0]);
  add(lite.find((n) => !out.includes(n)));
  // הגרסה הגבוהה מבין היציבות (גרסת preview לא נחשבת "החדשה")
  const top = Math.max(0, ...full.filter((n) => !/(preview|exp)/i.test(n)).map(verOf));
  add(full.find((n) => verOf(n) > 0 && verOf(n) < top));
  list.forEach(add);
  return out;
}
