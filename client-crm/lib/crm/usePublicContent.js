"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { crmDb } from "./firebaseClient";
import { mergeContent, DEFAULT_CONTENT } from "./publicContent";

// טעינת התוכן שהמנהלת ערכה, לעמודים הציבוריים שאינם דורשים התחברות.
//
// קריאה חד-פעמית ולא מנוי חי: העמודים האלה נטענים פעם אחת לביקור,
// ומנוי מתמשך היה רק מחזיק חיבור פתוח בלי תועלת.
//
// עד שהתוכן מגיע - ואם הוא נכשל - מוחזרות ברירות המחדל שבקוד.
// כך העמוד תמיד מוצג במלואו, ולעולם לא נשאר ריק בגלל תקלת רשת.
export function usePublicContent() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDoc(doc(crmDb, "publicContent", "form"))
      .then((d) => {
        if (cancelled) return;
        setContent(mergeContent(d.exists() ? d.data() : null));
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { content, loaded };
}
