"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";

// שדה בחירה שאפשר להקליד בתוכו כדי לחפש ולסנן שמות מתוך רשימה ארוכה.
// אפשרויות מסומנות pinned מוצגות תמיד בראש הרשימה.
export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "בחירה...",
  emptyText = "לא נמצאו תוצאות",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  const term = query.trim();
  const matching = term ? options.filter((o) => o.label.includes(term)) : options;
  const ordered = [...matching.filter((o) => o.pinned), ...matching.filter((o) => !o.pinned)];

  const openList = () => {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const pick = (option) => {
    onChange(option.value);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {open ? (
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#C3B5A5]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="הקלידו לחיפוש..."
            className="w-full rounded-2xl border border-[#C06E5E] bg-white py-2.5 pr-9 pl-3 text-sm outline-none"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={openList}
          className="flex w-full items-center justify-between gap-1 rounded-2xl border border-[#EADCCB] bg-white px-3 py-2.5 text-right text-sm outline-none transition focus:border-[#C06E5E]"
        >
          <span className={`truncate ${selected ? "text-[#5A4A3C]" : "text-[#C3B5A5]"}`}>
            {selected ? selected.label : placeholder}
          </span>
          <span className="flex shrink-0 items-center gap-0.5">
            {selected && (
              <span
                role="button"
                tabIndex={0}
                aria-label="ניקוי הבחירה"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                className="rounded-full p-0.5 text-[#C3B5A5] hover:text-[#C4584C]"
              >
                <X size={14} />
              </span>
            )}
            <ChevronDown size={16} className="text-[#C06E5E]" />
          </span>
        </button>
      )}

      {open && (
        <div className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-2xl border border-[#EADCCB] bg-white shadow-xl">
          {ordered.length === 0 ? (
            <p className="px-3 py-3 text-center text-[12px] text-[#C3B5A5]">{emptyText}</p>
          ) : (
            ordered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => pick(o)}
                className={`block w-full px-3 py-2.5 text-right text-[13px] transition hover:bg-[#FBF3EA] ${
                  o.value === value ? "bg-[#F7DFD8] font-bold text-[#A05243]" : "text-[#5A4A3C]"
                } ${o.pinned ? "border-b border-[#EADCCB] font-semibold text-[#C06E5E]" : ""}`}
              >
                {o.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
