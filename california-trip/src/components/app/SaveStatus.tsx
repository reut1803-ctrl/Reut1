"use client";

import { useEffect, useState } from "react";
import { useSaveStatus } from "@/lib/saveStatus";

// חיווי קטן בסרגל העליון: האם מה שסימנתם כבר נשמר
export default function SaveStatus() {
  const { pending, lastSaved, failed, online } = useSaveStatus();
  const [recent, setRecent] = useState(false);
  useEffect(() => {
    if (!lastSaved) return;
    setRecent(true);
    const t = setTimeout(() => setRecent(false), 2200);
    return () => clearTimeout(t);
  }, [lastSaved]);

  let text = "";
  let cls = "";
  if (!online) { text = pending ? "אין קליטה · יישמר כשתחזור" : "אין קליטה"; cls = "save--off"; }
  else if (failed) { text = "השמירה נכשלה"; cls = "save--err"; }
  else if (pending) { text = "שומר…"; cls = "save--busy"; }
  else if (recent) { text = "נשמר ✓"; cls = "save--ok"; }
  if (!text) return null;
  return <span className={`save-chip ${cls}`} role="status" aria-live="polite">{text}</span>;
}
