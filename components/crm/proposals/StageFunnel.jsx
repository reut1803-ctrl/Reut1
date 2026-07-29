"use client";

import { Check, X } from "lucide-react";
import { PROPOSAL_STAGES, PROPOSAL_DROPPED } from "@/lib/crm/store";

export default function StageFunnel({ status, compact = false }) {
  if (status === PROPOSAL_DROPPED) {
    return (
      <div className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600">
        <X size={14} /> ירד מהפרק
      </div>
    );
  }

  const currentIndex = PROPOSAL_STAGES.indexOf(status);

  return (
    <div className={`flex items-center ${compact ? "gap-1" : "gap-1.5"}`}>
      {PROPOSAL_STAGES.map((stage, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={stage} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition ${
                active
                  ? "bg-[#5B3418] text-white ring-4 ring-[#5B3418]/20"
                  : done
                  ? "bg-[#7FB33F] text-white"
                  : "bg-[#D9C6A5] text-[#A08D74]"
              }`}
            >
              {done ? <Check size={12} /> : i + 1}
            </div>
            {!compact && (
              <span className={`text-center text-[9px] leading-tight ${active ? "font-bold text-[#5B3418]" : "text-[#A08D74]"}`}>
                {stage}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
