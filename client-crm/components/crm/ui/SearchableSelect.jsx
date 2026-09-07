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
          <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9FBAC7]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="הקלידו לחיפוש..."
            className="w-full rounded-2xl border border-[#2E8BA8] bg-white py-2.5 pr-9 pl-3 text-sm outline-none"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={openList}
          className="flex w-full items-center justify-between gap-1 rounded-2xl border border-[#CFE3EC] bg-white px-3 py-2.5 text-right text-sm outline-none transition focus:border-[#2E8BA8]"
        >
          <span className={`truncate ${selected ? "text-[#23414E]" : "text-[#9FBAC7]"}`}>
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
                className="rounded-full p-0.5 text-[#9FBAC7] hover:text-[#C4584C]"
              >
                <X size={14} />
              </span>
            )}
            <ChevronDown size={16} className="text-[#2E8BA8]" />
          </span>
        </button>
      )}

      {open && (
        <div className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-2xl border border-[#CFE3EC] bg-white shadow-xl">
          {ordered.length === 0 ? (
            <p className="px-3 py-3 text-center text-[12px] text-[#9FBAC7]">{emptyText}</p>
          ) : (
            ordered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => pick(o)}
                className={`block w-full px-3 py-2.5 text-right text-[13px] transition hover:bg-[#F2F8FB] ${
                  o.value === value ? "bg-[#DCEEF5] font-bold text-[#1F6E88]" : "text-[#23414E]"
                } ${o.pinned ? "border-b border-[#CFE3EC] font-semibold text-[#2E8BA8]" : ""}`}
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
