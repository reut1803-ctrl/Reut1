"use client";

import { Check, X } from "lucide-react";
import { PROPOSAL_STAGES, PROPOSAL_DROPPED } from "@/lib/crm/store";

// כשמועבר onSelect, כל שלב הופך לכפתור לחיץ שמעדכן את סטטוס ההצעה.
// בלי onSelect (למשל בתצוגה המוקטנת בכרטיס המועמד/ת) הסרגל נשאר לתצוגה בלבד.
export default function StageFunnel({ status, compact = false, onSelect = null }) {
  if (status === PROPOSAL_DROPPED) {
    return (
      <div className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600">
        <X size={14} /> ירד מהפרק
      </div>
    );
  }

  const currentIndex = PROPOSAL_STAGES.indexOf(status);
  const clickable = typeof onSelect === "function";

  return (
    <div className={`flex items-start ${compact ? "gap-1" : "gap-1.5"}`}>
      {PROPOSAL_STAGES.map((stage, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const circle = (
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition ${
              active
                ? "bg-[#C06E5E] text-white ring-4 ring-[#C06E5E]/20"
                : done
                ? "bg-[#8C9A78] text-white"
                : "bg-[#EADCCB] text-[#C3B5A5]"
            }`}
          >
            {done ? <Check size={12} /> : i + 1}
          </span>
        );
        const caption = !compact && (
          <span className={`text-center text-[9px] leading-tight ${active ? "font-bold text-[#C06E5E]" : "text-[#C3B5A5]"}`}>
            {stage}
          </span>
        );

        if (!clickable) {
          return (
            <div key={stage} className="flex flex-1 flex-col items-center gap-1">
              {circle}
              {caption}
            </div>
          );
        }

        return (
          <button
            key={stage}
            type="button"
            onClick={() => !active && onSelect(stage)}
            aria-label={`עדכון סטטוס ל${stage}`}
            aria-current={active ? "step" : undefined}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1 transition ${
              active ? "cursor-default" : "cursor-pointer hover:bg-[#FBF3EA] active:scale-95"
            }`}
          >
            {circle}
            {caption}
          </button>
        );
      })}
    </div>
  );
}
