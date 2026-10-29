// הערות השדכנית לדיוק עוזר ההתאמות.
//
// נשמרות בדפדפן של המנהלת בלבד (localStorage) - בלי שום כתיבה למסד הנתונים.
// בכל פנייה לעוזר נשלחות ההערות האחרונות, אחרי ניקוי פרטים מזהים, ומוצגות
// לבינה כ"דגשים וכללי אצבע של השדכנית מהתאמות קודמות".

import { scrubText } from "@/lib/crm/aiAnonymize";

const KEY = "aiMatchFeedback:v1";
export const FEEDBACK_MAX_CHARS = 500;
// כמה הערות שמורות לכל היותר, וכמה מהן (האחרונות) נשלחות לבינה בכל פנייה
const MAX_STORED = 200;
export const FEEDBACK_SENT = 25;

export function readFeedback() {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((n) => n && typeof n.text === "string" && n.id) : [];
  } catch {
    return [];
  }
}

function writeFeedback(list) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX_STORED)));
    return true;
  } catch {
    return false;
  }
}

// מחזיר את הרשימה המעודכנת, או null אם הדפדפן חסם את השמירה
export function addFeedback(note) {
  const text = String(note?.text || "").trim().slice(0, FEEDBACK_MAX_CHARS);
  if (!text) return null;
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    text,
    candidateId: note.candidateId || "",
    optionAId: note.optionAId || "",
    optionBId: note.optionBId || "",
    winnerId: note.winnerId || "",
  };
  const next = [...readFeedback(), entry];
  return writeFeedback(next) ? next : null;
}

export function removeFeedback(id) {
  const next = readFeedback().filter((n) => n.id !== id);
  return writeFeedback(next) ? next : null;
}

// ההערות האחרונות בצורה שאפשר לשלוח החוצה:
// * שמות המשפחה והיישובים של שלושת האנשים בהכרעה מוחלפים, וכן טלפונים ומיילים
// * האנשים מזוהים בקוד האנונימי של היום אם הם עדיין במאגר, ואחרת בשם פרטי בלבד
export function feedbackForPrompt(list, { byId, idToCode }) {
  const label = (id) => {
    if (!id) return "";
    if (idToCode[id]) return idToCode[id];
    return String(byId.get(id)?.name || "").trim().split(/\s+/)[0] || "";
  };
  return (Array.isArray(list) ? list : []).slice(-FEEDBACK_SENT).map((n) => {
    const people = [n.candidateId, n.optionAId, n.optionBId].map((id) => byId.get(id)).filter(Boolean);
    const surnames = people.flatMap((c) => String(c.name || "").trim().split(/\s+/).slice(1));
    const places = people.flatMap((c) => {
      const city = String(c.city || "").trim();
      return [city, ...city.split(/\s+/)];
    }).filter((w) => w.length >= 2);
    const options = [label(n.optionAId), label(n.optionBId)].filter(Boolean).join(" מול ");
    const context = [
      label(n.candidateId) && `על ${label(n.candidateId)}`,
      options && `(אפשרויות: ${options}${label(n.winnerId) ? `, נבחר/ה: ${label(n.winnerId)}` : ""})`,
    ].filter(Boolean).join(" ");
    return { text: scrubText(n.text, { surnames, places }), context };
  });
}
