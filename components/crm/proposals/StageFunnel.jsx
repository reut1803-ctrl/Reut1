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
                ? "bg-[#8C4A55] text-white ring-4 ring-[#8C4A55]/20"
                : done
                ? "bg-[#20A66B] text-white"
                : "bg-[#EAE5E3] text-[#B5AEB0]"
            }`}
          >
            {done ? <Check size={12} /> : i + 1}
          </span>
        );
        const caption = !compact && (
          <span className={`text-center text-[9px] leading-tight ${active ? "font-bold text-[#8C4A55]" : "text-[#B5AEB0]"}`}>
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
              active ? "cursor-default" : "cursor-pointer hover:bg-[#F6F5F4] active:scale-95"
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
