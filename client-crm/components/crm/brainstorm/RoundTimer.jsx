"use client";

import { useEffect, useState } from "react";
import { Hourglass, Lock } from "lucide-react";
import { timeLeft, isRoundClosed } from "@/lib/crm/brainstorm";

// שעון החול של הסבב: סופר לאחור שלושה ימים מרגע הפתיחה.
// כשהזמן נגמר, הלוח ננעל להוספת תגובות והשעון מציג זאת במפורש.
export default function RoundTimer({ round }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const closed = isRoundClosed(round, now);
  const left = timeLeft(round?.closesAt, now);
  const total = 3 * 24 * 60 * 60 * 1000;
  const pct = closed ? 0 : Math.max(0, Math.min(100, Math.round((left.ms / total) * 100)));
  // ביום האחרון השעון עובר לגוון מתריע, כדי שיהיה ברור שנשאר מעט זמן
  const urgent = !closed && left.ms < 24 * 60 * 60 * 1000;

  if (closed) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#F5EDE3] px-3 py-2.5 text-[12px] font-bold text-[#8C7B6B]">
        <Lock size={14} /> הסבב נסגר. אפשר לקרוא הכל, אך לא להוסיף.
      </div>
    );
  }

  // מנוסח כמשפט אחד קריא במקום ארבעה מונים מתקתקים. על פני שלושה ימים,
  // שניות שרצות הן רעש - מה שחשוב זה כמה זמן נשאר בגדול.
  const text = left.days > 0
    ? `נשארו ${left.days} ימים ו-${left.hours} שעות`
    : left.hours > 0
    ? `נשארו ${left.hours} שעות ו-${left.minutes} דקות`
    : `נשארו ${left.minutes} דקות`;

  return (
    <div
      className={`rounded-2xl px-3 py-2.5 ${urgent ? "bg-[#FBEDE9] text-[#C4584C]" : "bg-white/70 text-[#A05243]"} backdrop-blur`}
    >
      <span className="flex items-center gap-1.5 text-[12.5px] font-bold">
        <Hourglass size={14} /> {text}
      </span>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${urgent ? "bg-[#C4584C]" : "bg-[#C06E5E]"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
