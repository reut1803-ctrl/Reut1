"use client";

import { useState } from "react";

// בורר עם חיפוש בהקלדה, ואפשרות להוסיף מישהו שאינו במאגר.
export default function SearchSelect({ value, options, onChange, placeholder, onAddExternal }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const selected = options.find((o) => o.id === value);
  const term = q.trim().toLowerCase();
  const filtered = term ? options.filter((o) => (o.label || "").toLowerCase().includes(term)) : options;
  const exists = options.some((o) => (o.label || "").trim() === q.trim());

  return (
    <div className="relative">
      <button
        type="button"
        className="field-input flex w-full items-center justify-between"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={selected ? "text-ink" : "text-ink/40"}>{selected ? selected.label : placeholder}</span>
        <span className="text-ink/40">▾</span>
      </button>
      {open && (
        <div className="absolute z-40 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-sand bg-white shadow-soft">
          <div className="sticky top-0 bg-white p-2">
            <input
              autoFocus
              className="field-input !py-2 text-sm"
              placeholder="הקלידו לחיפוש…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {onAddExternal && term && !exists && (
            <button
              type="button"
              className="block w-full px-4 py-2 text-right text-sm font-semibold text-roseDark hover:bg-blush/40"
              onClick={() => { onAddExternal(q.trim()); setOpen(false); setQ(""); }}
            >➕ הוספת «{q.trim()}» (מישהו/י מהמעגל שלי, לא במאגר)</button>
          )}
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              className="block w-full px-4 py-2 text-right text-sm hover:bg-blush/40"
              onClick={() => { onChange(o.id); setOpen(false); setQ(""); }}
            >{o.label}{o.external ? " · לא במאגר" : ""}</button>
          ))}
          {filtered.length === 0 && !onAddExternal && <p className="px-4 py-2 text-sm text-ink/40">אין תוצאות.</p>}
        </div>
      )}
    </div>
  );
}
