"use client";

import { useMemo } from "react";
import { Tag, X } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { visibleTags } from "@/lib/crm/tags";
import { mergeContent } from "@/lib/crm/publicContent";

// רצועת סינון מהירה לפי קהילה ומגזר.
// גלויה תמיד ומיד מתחת לחיפוש, כדי שסינון לפי תווית יהיה לחיצה אחת
// ולא יסתתר מאחורי תפריט. נגללת לצדדים כשיש יותר תוויות מרוחב המסך.
export default function TagFilterStrip() {
  const activeTag = useCrmStore((s) => s.filters.tag);
  const setFilters = useCrmStore((s) => s.setFilters);
  const publicContent = useCrmStore((s) => s.publicContent);
  // התוויות נערכות בלוח הבקרה. עד שהתוכן נטען - ברירת המחדל שבקוד,
  // כך שהרצועה לעולם אינה מוצגת ריקה.
  const tags = useMemo(() => visibleTags(mergeContent(publicContent)), [publicContent]);

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
        {tags.map((tag) => {
          const active = activeTag === tag.name;
          return (
            <button
              key={tag.id || tag.name}
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
