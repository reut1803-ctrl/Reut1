"use client";

// מד שימוש יומי בשירות הבינה, ותקציב לפעולות הגדולות.
//
// Google סופרת את המכסה החינמית לפי מספר הפניות ביום, ומאפסת אותה בחצות
// שעון קליפורניה. כאן נספרות הפניות של היום הנוכחי (לפי אותו שעון), באוסף
// הנפרד aiMatchCache - מסמך usage_<תאריך>. כך המונה משותף לכל המכשירים.
// אם השרת מסרב (הכלל עוד לא פורסם) - נספר במכשיר בלבד, בלי שגיאה.
//
// הפעולות הגדולות (חילוץ פרופילים, סריקת תמונות) נעצרות כשהמונה מגיע
// ל-BULK_LIMIT, ומשאירות רזרבה לעבודה השוטפת: "מצא/י התאמה", הכרעות, וואטסאפ.

import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, setDoc, increment } from "firebase/firestore";
import { crmDb } from "@/lib/crm/firebaseClient";

export const AI_CACHE_COLLECTION = "aiMatchCache";
export const BULK_LIMIT = 100;
const LOCAL_KEY = "aiUsage:v1";
const USAGE_EVENT = "ai-usage-recorded";

// התאריך לפי שעון קליפורניה - שם מתאפסת המכסה
export const quotaDay = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

// מתי בדיוק מתאפסת המכסה, בשעון ישראל: חצות הבא בקליפורניה, לפי ההפרש
// בין השעונים באותו רגע (כולל שעון קיץ/חורף בשני הצדדים)
export function nextResetText() {
  try {
    const now = new Date();
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Los_Angeles",
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
        .formatToParts(now)
        .map((x) => [x.type, x.value])
    );
    const laAsUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    const offset = laAsUtc - Math.floor(now.getTime() / 1000) * 1000;
    const nextMidnight = Date.UTC(+parts.year, +parts.month - 1, +parts.day + 1) - offset;
    return new Date(nextMidnight).toLocaleTimeString("he-IL", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "10:00";
  }
}

const usageRef = (day) => doc(crmDb, AI_CACHE_COLLECTION, `usage_${day}`);

const readLocal = () => {
  try {
    const v = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "{}");
    return v && v.day === quotaDay() ? v : { day: quotaDay(), count: 0, exhausted: false };
  } catch {
    return { day: quotaDay(), count: 0, exhausted: false };
  }
};
const writeLocal = (v) => {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(v));
  } catch {
    /* לא קריטי */
  }
};

let cloudOk = true;

// רישום פניות (n = כמה פניות נשלחו בפועל). לעולם לא זורק שגיאה.
export async function recordAiUsage(n = 1, { exhausted = false } = {}) {
  const day = quotaDay();
  const local = readLocal();
  writeLocal({ day, count: local.count + n, exhausted: local.exhausted || exhausted });
  // עדכון מיידי של המונה שעל המסך
  try {
    window.dispatchEvent(new Event(USAGE_EVENT));
  } catch {
    /* לא קריטי */
  }
  if (!cloudOk) return;
  try {
    await setDoc(usageRef(day), { day, count: increment(n), ...(exhausted ? { exhausted: true } : {}) }, { merge: true });
  } catch {
    cloudOk = false;
  }
}

// המונה של היום (לבדיקה לפני כל קבוצה בפעולה גדולה)
export async function getTodayUsage() {
  const local = readLocal();
  if (!cloudOk) return local;
  try {
    const snap = await getDoc(usageRef(quotaDay()));
    const d = snap.exists() ? snap.data() : {};
    return { day: quotaDay(), count: Math.max(d.count || 0, local.count), exhausted: !!d.exhausted || local.exhausted };
  } catch {
    cloudOk = false;
    return local;
  }
}

// הודעת שגיאה מהשרת שמשמעה "המכסה היומית נגמרה"
export const isDailyQuotaError = (msg) => /המכסה היומית/.test(String(msg || ""));

// תצוגה חיה של המונה
export function useAiUsage(enabled = true) {
  const [usage, setUsage] = useState({ day: "", count: 0, exhausted: false });
  useEffect(() => {
    if (!enabled) return undefined;
    setUsage(readLocal());
    let unsub = () => {};
    try {
      unsub = onSnapshot(
        usageRef(quotaDay()),
        (snap) => {
          const d = snap.exists() ? snap.data() : {};
          const local = readLocal();
          setUsage({ day: quotaDay(), count: Math.max(d.count || 0, local.count), exhausted: !!d.exhausted || local.exhausted });
        },
        () => {
          cloudOk = false;
          setUsage(readLocal());
        }
      );
    } catch {
      setUsage(readLocal());
    }
    // כל רישום במכשיר הזה מעדכן מיד; ובמעבר יום - המונה מתאפס
    const refresh = () =>
      setUsage((u) => {
        const local = readLocal();
        const sameDay = u.day === local.day;
        return { day: local.day, count: Math.max(sameDay ? u.count : 0, local.count), exhausted: (sameDay && u.exhausted) || local.exhausted };
      });
    window.addEventListener(USAGE_EVENT, refresh);
    const timer = setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener(USAGE_EVENT, refresh);
      clearInterval(timer);
      unsub();
    };
  }, [enabled]);
  return usage;
}
