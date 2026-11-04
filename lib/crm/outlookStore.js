"use client";

// שמירה וסנכרון של פרופילי ההשקפה, באוסף נפרד ב-Firestore: aiOutlookProfiles.
// מזהה המסמך = מזהה הכרטיס. המסמך לא מכיל שם, טלפון או פרט מזהה אחר -
// רק את שדות הפרופיל, ציטוטים קצרים, ותיקונים ואישור של המנהלת.
// הכרטיסים עצמם (candidates) לא נקראים ולא נכתבים כאן.
//
// מנגנון הגנה: אם השרת מסרב (כלל הגישה עוד לא פורסם ב-Firebase) - הכל
// נשמר במכשיר (localStorage), והמסך מציין זאת. כלום לא נשבר, ואחרי פרסום
// הכלל אפשר להעביר את מה שנשמר במכשיר לאוסף בלחיצה.

import { useEffect, useRef, useState } from "react";
import { collection, doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { crmDb } from "@/lib/crm/firebaseClient";

export const OUTLOOK_COLLECTION = "aiOutlookProfiles";
const LOCAL_KEY = "aiOutlook:v1";

const readLocal = () => {
  try {
    const v = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
};
const writeLocal = (map) => {
  try {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(map));
    return true;
  } catch {
    return false;
  }
};

// mode: "loading" | "cloud" (מסונכרן) | "local" (במכשיר בלבד, הכלל עוד לא פורסם)
export function useOutlookProfiles(enabled = true) {
  const [profiles, setProfiles] = useState({});
  const [mode, setMode] = useState("loading");
  const modeRef = useRef("loading");

  useEffect(() => {
    if (!enabled) return undefined;
    let unsub = () => {};
    try {
      unsub = onSnapshot(
        collection(crmDb, OUTLOOK_COLLECTION),
        (snap) => {
          const map = {};
          snap.forEach((d) => {
            map[d.id] = d.data();
          });
          modeRef.current = "cloud";
          setMode("cloud");
          setProfiles(map);
        },
        () => {
          // אין הרשאה או אין חיבור - עובדים מהמכשיר, בלי שגיאה למשתמשת
          modeRef.current = "local";
          setMode("local");
          setProfiles(readLocal());
        }
      );
    } catch {
      modeRef.current = "local";
      setMode("local");
      setProfiles(readLocal());
    }
    // אם השרת לא עונה תוך 15 שניות - עובדים מהמכשיר בינתיים. אם הוא עונה
    // אחר כך, עוברים לענן, ומה שנשמר במכשיר מוצע להעברה.
    const timer = setTimeout(() => {
      if (modeRef.current === "loading") {
        modeRef.current = "local";
        setMode("local");
        setProfiles(readLocal());
      }
    }, 15_000);
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, [enabled]);

  // שמירה (מיזוג) של מסמך אחד. בענן - עם זמן שרת; במכשיר - עם זמן מקומי.
  const save = async (candidateId, partial) => {
    if (!candidateId) return false;
    if (modeRef.current === "cloud") {
      try {
        await setDoc(doc(crmDb, OUTLOOK_COLLECTION, candidateId), { ...partial, updatedAt: serverTimestamp() }, { merge: true });
        return true;
      } catch {
        modeRef.current = "local";
        setMode("local");
      }
    }
    const map = readLocal();
    map[candidateId] = { ...(map[candidateId] || {}), ...partial, manual: { ...(map[candidateId]?.manual || {}), ...(partial.manual || {}) }, updatedAt: Date.now() };
    const ok = writeLocal(map);
    setProfiles({ ...map });
    return ok;
  };

  // העברת מה שנשמר במכשיר לענן, אחרי שהכלל פורסם
  const localCount = typeof window === "undefined" ? 0 : Object.keys(readLocal()).length;
  const migrateLocal = async () => {
    if (modeRef.current !== "cloud") return 0;
    const map = readLocal();
    let n = 0;
    for (const [id, data] of Object.entries(map)) {
      try {
        const { updatedAt, ...rest } = data;
        await setDoc(doc(crmDb, OUTLOOK_COLLECTION, id), { ...rest, updatedAt: serverTimestamp() }, { merge: true });
        n += 1;
      } catch {
        return n;
      }
    }
    try {
      window.localStorage.removeItem(LOCAL_KEY);
    } catch {
      /* לא קריטי */
    }
    return n;
  };

  return { profiles, mode, save, localCount, migrateLocal };
}
