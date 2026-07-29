"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { CANDIDATE_TAGS } from "@/lib/crm/mockData";

export default function TagsSidebar() {
  const [open, setOpen] = useState(false);
  const activeTag = useCrmStore((s) => s.filters.tag);
  const setFilters = useCrmStore((s) => s.setFilters);

  const handleSelect = (tagName) => {
    setFilters({ tag: activeTag === tagName ? null : tagName });
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "סגירת סינון תוויות" : "פתיחת סינון תוויות"}
        style={{ right: open ? "16rem" : "0" }}
        className="fixed top-1/2 z-50 flex h-12 w-8 -translate-y-1/2 items-center justify-center rounded-r-none rounded-l-xl bg-[#6F4A2E] text-white shadow-lg transition-[right] duration-300"
      >
        {open ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {open && <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />}

      <div
        className={`fixed inset-y-0 right-0 z-40 w-64 overflow-y-auto bg-white shadow-2xl transition-transform duration-300 safe-top safe-bottom ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-5">
          <div className="mb-4 flex items-center gap-1.5">
            <Tag size={16} className="text-[#6F4A2E]" />
            <h2 className="text-[15px] font-bold text-[#3B332A]">סינון לפי תווית</h2>
          </div>

          <div className="space-y-2">
            {CANDIDATE_TAGS.map((tag) => {
              const active = activeTag === tag.name;
              return (
                <button
                  key={tag.name}
                  onClick={() => handleSelect(tag.name)}
                  style={{
                    backgroundColor: tag.color,
                    color: tag.textColor,
                    boxShadow: active ? "0 0 0 2px #3B332A" : "none",
                  }}
                  className="w-full rounded-2xl px-4 py-3 text-right text-sm font-semibold transition active:scale-[0.98]"
                >
                  {tag.name}
                </button>
              );
            })}
          </div>

          {activeTag && (
            <button
              onClick={() => setFilters({ tag: null })}
              className="mt-4 w-full rounded-2xl border border-[#E7DECD] py-2.5 text-[13px] font-semibold text-[#3B332A] transition hover:bg-[#FAF6EE]"
            >
              ניקוי סינון
            </button>
          )}
        </div>
      </div>
    </>
  );
}
