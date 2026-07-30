"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { useBackToClose } from "@/lib/crm/useBackToClose";
import TagGroupPicker from "@/components/crm/ui/TagGroupPicker";

export default function TagsSidebar() {
  const [open, setOpen] = useState(false);
  useBackToClose(open, () => setOpen(false));
  const tagGroups = useCrmStore((s) => s.tagGroups);
  const selected = useCrmStore((s) => s.filters.tags);
  const toggleTagFilter = useCrmStore((s) => s.toggleTagFilter);
  const clearTagFilters = useCrmStore((s) => s.clearTagFilters);

  const activeCount = Object.values(selected || {}).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "סגירת סינון תוויות" : "פתיחת סינון תוויות"}
        style={{ right: open ? "16rem" : "0" }}
        className="fixed top-1/2 z-50 flex h-12 w-8 -translate-y-1/2 items-center justify-center rounded-r-none rounded-l-xl bg-[#8C4A55] text-white shadow-lg transition-[right] duration-300"
      >
        {open ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        {!open && activeCount > 0 && (
          <span className="absolute -top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#3A3335] text-[10px] font-bold">
            {activeCount}
          </span>
        )}
      </button>

      {open && <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />}

      <div
        className={`fixed inset-y-0 right-0 z-40 w-64 overflow-y-auto bg-white shadow-2xl transition-transform duration-300 safe-top safe-bottom ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-5">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Tag size={16} className="text-[#8C4A55]" />
            <h2 className="text-[15px] font-bold text-[#3A3335]">סינון לפי תוויות</h2>
          </div>
          <p className="mb-4 text-[11px] leading-relaxed text-[#8A8082]">
            אפשר לבחור כמה תוויות בכל קטגוריה, וגם לשלב בין קטגוריות שונות יחד.
          </p>

          <div className="space-y-4">
            {tagGroups.map((g) => (
              <TagGroupPicker
                key={g.id}
                group={g}
                selected={selected?.[g.id]}
                onToggle={(option) => toggleTagFilter(g.id, option)}
              />
            ))}
          </div>

          {activeCount > 0 && (
            <button
              onClick={clearTagFilters}
              className="mt-5 w-full rounded-2xl border border-[#EAE5E3] py-2.5 text-[13px] font-semibold text-[#3A3335] transition hover:bg-[#F6F5F4]"
            >
              ניקוי סינון
            </button>
          )}
        </div>
      </div>
    </>
  );
}
