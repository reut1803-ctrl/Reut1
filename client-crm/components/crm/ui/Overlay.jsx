"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// חלון צף חייב להיפתח ביחס למסך כולו. כרטיס עם טשטוש רקע (backdrop-blur)
// יוצר "מסגרת" משלו, וכל חלון שנפתח בתוכו נכלא לגבולות הכרטיס - הרקע הכהה
// לא מכסה את כל המסך והחלון מופיע במקום הלא נכון.
// הרכיב הזה מוציא את החלון החוצה, ישירות לראש העמוד.
export default function Overlay({ children }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
