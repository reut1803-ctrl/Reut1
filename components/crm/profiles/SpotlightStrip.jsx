"use client";

import { Sun, ChevronLeft } from "lucide-react";
import { getGradientClass } from "@/components/crm/ui/gradients";
import { candidateInitials } from "@/lib/crm/initials";
import { daysSinceActivity } from "@/lib/crm/attention";

// "הזרקור היומי" - מקטע נפרד מעל הרשימה. הכרטיסים שמופיעים כאן נשארים
// גם ברשימה הרגילה שמתחת; זו תזכורת, לא הוצאה מהמאגר.
// לחיצה על כרטיס בזרקור גוללת אל אותו כרטיס ברשימה שמתחת ומדגישה אותו,
// בלי שום ניווט ובלי רענון.
export default function SpotlightStrip({ candidates, now, attentionData, onSelect }) {
  if (!candidates || candidates.length === 0) return null;

  return (
    <section className="mt-4 overflow-hidden rounded-3xl border border-[#E7CE93] bg-[#FFFCF5]">
      {/* פס הזהב */}
      <div className="h-1 w-full bg-gradient-to-l from-[#E7CE93] via-[#D9B45F] to-[#E7CE93]" />
      <div className="px-4 py-3.5">
        <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#946200]">
          <Sun size={14} /> הזרקור היומי - כדאי להעיף מבט!
        </p>

        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {candidates.map((c) => {
            const days = daysSinceActivity(c, now, attentionData);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect?.(c.id)}
                className="flex w-[132px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#EFDFBC] bg-white text-right shadow-sm transition active:scale-[0.97]"
              >
                <div className={`relative h-20 w-full bg-gradient-to-br ${getGradientClass(c.gradient ?? c.name)}`}>
                  {c.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.photoUrl} alt={c.name} className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white drop-shadow">{candidateInitials(c.name)}</span>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="truncate text-[13px] font-bold text-[#3A3335]">{c.name}</p>
                  <p className="mt-0.5 truncate text-[11px] text-[#8A8285]">
                    {[c.age, c.city].filter(Boolean).join(" · ")}
                  </p>
                  {days !== null && days > 0 && (
                    <p className="mt-1 text-[10px] font-semibold text-[#946200]">
                      {c.spotlight ? "נבחר/ה על ידי המנהלת" : `${days} ימים ללא טיפול`}
                    </p>
                  )}
                  <p className="mt-1.5 flex items-center gap-0.5 text-[10px] font-semibold text-[#8C4A55]">
                    לכרטיס המלא <ChevronLeft size={11} />
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
