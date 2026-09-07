"use client";

import { Tag, X } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { CANDIDATE_TAGS } from "@/lib/crm/mockData";

// רצועת סינון מהירה לפי קהילה ומגזר.
// גלויה תמיד ומיד מתחת לחיפוש, כדי שסינון לפי תווית יהיה לחיצה אחת
// ולא יסתתר מאחורי תפריט. נגללת לצדדים כשיש יותר תוויות מרוחב המסך.
export default function TagFilterStrip() {
  const activeTag = useCrmStore((s) => s.filters.tag);
  const setFilters = useCrmStore((s) => s.setFilters);

  const select = (name) => setFilters({ tag: activeTag === name ? null : name });

  return (
    <div className="mt-3" data-tour="tour-tags">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1 text-[11.5px] font-bold text-[#5E7A87]">
          <Tag size={13} /> סינון מהיר לפי קהילה
        </span>
        {activeTag && (
          <button
            type="button"
            onClick={() => setFilters({ tag: null })}
            className="flex items-center gap-1 text-[11.5px] font-semibold text-[#2E8BA8]"
          >
            <X size={12} /> ניקוי
          </button>
        )}
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CANDIDATE_TAGS.map((tag) => {
          const active = activeTag === tag.name;
          return (
            <button
              key={tag.name}
              type="button"
              onClick={() => select(tag.name)}
              aria-pressed={active}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition active:scale-95 ${
                active ? "shadow-md ring-2 ring-[#23414E]/25" : "opacity-85 hover:opacity-100"
              }`}
              style={{ backgroundColor: tag.color, color: tag.textColor }}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
