"use client";

// מטמון לתוצאות "מצא/י התאמה", באוסף הנפרד aiMatchCache (מסמך finder_<מזהה כרטיס>).
//
// לכל תוצאה נשמרת "חתימה" של כל מה שנשלח לבינה: המועמד/ת שבמוקד, הרשימה
// הקצרה (לפי מזהי הכרטיסים, לא לפי הקודים המתחלפים), פרופילי ההשקפה והזיכרון.
// פותחים שוב את אותו כרטיס ושום דבר לא השתנה - התוצאה מוצגת מיד, בלי פנייה
// לבינה. השתנה משהו - מוצגת התוצאה הקודמת כ"ישנה", ואפשר לבדוק מחדש.
//
// התוצאה נשמרת עם מזהי כרטיסים ושמות פרטיים בלבד. אם השרת מסרב (הכלל עוד
// לא פורסם) - נשמר במכשיר בלבד, בלי שגיאה.

import { doc, getDoc, setDoc } from "firebase/firestore";
import { crmDb } from "@/lib/crm/firebaseClient";
import { AI_CACHE_COLLECTION } from "@/lib/crm/aiUsage";

const LOCAL_KEY = "aiFinderCache:v1";
const MAX_LOCAL = 80;

export function hashInput(value) {
  const s = JSON.stringify(value);
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return `${h.toString(36)}-${s.length.toString(36)}`;
}

const readLocal = () => {
  try {
    const v = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
};

export async function readFinderCache(candidateId) {
  try {
    const snap = await getDoc(doc(crmDb, AI_CACHE_COLLECTION, `finder_${candidateId}`));
    if (snap.exists()) return snap.data();
  } catch {
    /* נופלים למכשיר */
  }
  return readLocal()[candidateId] || null;
}

export async function writeFinderCache(candidateId, entry) {
  const value = { ...entry, at: Date.now() };
  try {
    await setDoc(doc(crmDb, AI_CACHE_COLLECTION, `finder_${candidateId}`), value);
    return;
  } catch {
    /* נופלים למכשיר */
  }
  try {
    const map = readLocal();
    map[candidateId] = value;
    const keys = Object.keys(map).sort((a, b) => (map[a].at || 0) - (map[b].at || 0));
    keys.slice(0, Math.max(0, keys.length - MAX_LOCAL)).forEach((k) => delete map[k]);
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(map));
  } catch {
    /* לא קריטי - פשוט לא נשמר */
  }
}
