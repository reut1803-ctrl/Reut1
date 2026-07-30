"use client";

import { tagChipStyle } from "@/lib/crm/mockData";

// בחירה מרובה של תוויות בתוך קטגוריה אחת. משמש גם בטופסי הכרטיס וגם בסרגל הסינון.
export default function TagGroupPicker({ group, selected, onToggle }) {
  const chosen = selected || [];

  return (
    <div>
      <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">{group.label}</p>
      {group.options.length === 0 ? (
        <p className="text-[11px] text-[#B5AEB0]">אין אפשרויות בקטגוריה זו</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {group.options.map((option, i) => {
            const active = chosen.includes(option);
            const style = tagChipStyle(group, i);
            return (
              <button
                key={option}
                type="button"
                onClick={() => onToggle(option)}
                style={active ? { ...style, boxShadow: "0 0 0 2px #3A3335" } : undefined}
                className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition active:scale-95 ${
                  active ? "border-transparent" : "border-[#EAE5E3] bg-white text-[#3A3335]"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
