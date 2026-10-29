// וייב חזותי מתמונות הפרופיל - שמירה בדפדפן של המנהלת בלבד (localStorage).
//
// לא נכתב שום דבר לכרטיסים או למסד הנתונים. לכל מועמד/ת נשמרים שלושת
// השדות יחד עם כתובת התמונה שנותחה: כשהתמונה מתחלפת, התוצאה הישנה כבר לא
// תקפה, והסריקה הבאה מנתחת את החדשה.

const KEY = "aiVibe:v1";

export function readVibes() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

export function writeVibes(map) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
    return true;
  } catch {
    return false;
  }
}

// התמונה הראשית של הכרטיס, רק משירות התמונות שלנו
export function mainPhoto(candidate) {
  const url = candidate?.photoUrls?.[0] || candidate?.photoUrl || "";
  return /^https:\/\/res\.cloudinary\.com\/.+\/image\/upload\//.test(url) ? url : "";
}

// תוצאה תקפה רק אם נותחה בדיוק התמונה הנוכחית
export function vibeFor(map, candidate) {
  const v = map?.[candidate?.id];
  const url = mainPhoto(candidate);
  if (!v || !url || v.url !== url || v.failed) return null;
  return { visual_style: v.visual_style, setting_vibe: v.setting_vibe, energy_vibe: v.energy_vibe };
}

export function needsScan(map, candidate) {
  const url = mainPhoto(candidate);
  if (!url) return false;
  const v = map?.[candidate.id];
  return !v || v.url !== url;
}
