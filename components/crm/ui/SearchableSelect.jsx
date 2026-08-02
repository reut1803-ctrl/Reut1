"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";

// שדה בחירה שאפשר להקליד בתוכו כדי לחפש ברשימה.
// מתנהג כמו תפריט רגיל, אבל עם סינון מיידי לפי מה שמקלידים - נוח כשיש הרבה שמות.
//
// options: [{ value, label }]
// extraOptions: אפשרויות קבועות שיופיעו בראש הרשימה ולא ייכללו בסינון הרגיל
export default function SearchableSelect({
  value,
  onChange,
  options = [],
  extraOptions = [],
  placeholder = "בחירה...",
  searchPlaceholder = "הקלידו לחיפוש...",
  emptyText = "לא נמצאה התאמה",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const boxRef = useRef(null);
  const inputRef = useRef(null);

  const all = useMemo(() => [...extraOptions, ...options], [extraOptions, options]);
  const selected = all.find((o) => o.value === value) || null;

  const filtered = useMemo(() => {
    const q = term.trim();
    if (!q) return all;
    // האפשרויות הקבועות תמיד נשארות זמינות בראש הרשימה
    return [...extraOptions, ...options.filter((o) => String(o.label).includes(q))];
  }, [term, all, options, extraOptions]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTerm("");
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-1 rounded-2xl border border-[#CCBDAB] bg-white px-3 py-2.5 text-right text-sm text-[#3A2E26] outline-none focus:border-[#844442]"
      >
        <ChevronDown size={16} className={`shrink-0 text-[#7C6E60] transition ${open ? "rotate-180" : ""}`} />
        <span className={`truncate ${selected ? "" : "text-[#A2937F]"}`}>{selected ? selected.label : placeholder}</span>
      </button>

      {open && (
        <div className="absolute z-40 mt-1 max-h-72 w-full overflow-hidden rounded-2xl border border-[#CCBDAB] bg-white shadow-xl">
          <div className="relative border-b border-[#CCBDAB] p-2">
            <Search size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#A2937F]" />
            <input
              ref={inputRef}
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl bg-[#E8DCCB] py-2 pr-8 pl-7 text-[13px] outline-none placeholder:text-[#A2937F]"
            />
            {term && (
              <button
                type="button"
                onClick={() => setTerm("")}
                aria-label="ניקוי החיפוש"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7C6E60]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-center text-[13px] text-[#7C6E60]">{emptyText}</p>
            )}
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-right text-[13px] transition hover:bg-[#F0E2DE] ${
                  o.value === value ? "bg-[#F0E2DE] font-bold text-[#5E2F2D]" : "text-[#3A2E26]"
                } ${o.highlight ? "font-semibold text-[#844442]" : ""}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
