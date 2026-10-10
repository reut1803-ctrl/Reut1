"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// מניפה חכמה (Accordion) לחשיפה הדרגתית: כותרת + תקציר כשסגורה + זיכרון מצב מקומי.
export default function Accordion({ icon: Icon, title, summary, defaultOpen = false, storageKey, children }) {
  const key = storageKey ? `acc_${storageKey}` : null;
  const [open, setOpen] = useState(() => {
    if (!key || typeof window === "undefined") return defaultOpen;
    try {
      const v = localStorage.getItem(key);
      return v === null ? defaultOpen : v === "1";
    } catch (e) {
      return defaultOpen;
    }
  });

  function toggle() {
    setOpen((o) => {
      const n = !o;
      try { if (key) localStorage.setItem(key, n ? "1" : "0"); } catch (e) {}
      return n;
    });
  }

  return (
    <div>
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between gap-2 rounded-2xl border border-white/60 bg-white/75 px-5 py-3.5 text-right shadow-soft backdrop-blur-sm transition hover:bg-white/90"
      >
        <span className="flex items-center gap-2 text-base font-bold text-roseDark">
          {Icon && <Icon className="h-5 w-5" strokeWidth={1.75} />} {title}
        </span>
        <span className="flex items-center gap-2">
          {summary && !open && (
            <span className="rounded-full bg-blush px-2.5 py-0.5 text-xs font-semibold text-roseDark">{summary}</span>
          )}
          {open ? <ChevronUp className="h-5 w-5 shrink-0 text-ink/40" /> : <ChevronDown className="h-5 w-5 shrink-0 text-ink/40" />}
        </span>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}
