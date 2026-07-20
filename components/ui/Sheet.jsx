"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

// חלונית תחתונה (Bottom Sheet) - נפתחת מלמטה, טבעית לנייד.
export default function Sheet({ open, onClose, title, children, maxHeight = "85vh" }) {
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-ink/40 animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative z-10 w-full max-w-md rounded-t-3xl bg-surface shadow-float animate-slide-up overflow-hidden"
        style={{ maxHeight }}
      >
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="סגירה"
            className="rounded-full p-1.5 text-muted transition hover:bg-bg active:scale-90"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 no-scrollbar" style={{ maxHeight: `calc(${maxHeight} - 64px)` }}>
          {children}
        </div>
      </div>
    </div>
  );
}
