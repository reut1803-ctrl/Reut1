"use client";

import { Check, X } from "lucide-react";
import { PROPOSAL_STAGES, PROPOSAL_DROPPED } from "@/lib/crm/store";

// מד ההתקדמות של הצעה.
//
// שני מצבים, לפי אם הועברה פונקציית onSelect:
//   בלי onSelect - תצוגה בלבד. כך הוא מוצג בתוך כרטיס המועמד/ת, שם זו
//                  רק אינדיקציה ואין מקום לשנות ממנה שלב.
//   עם onSelect  - כל עיגול הוא כפתור שמעדכן את השלב, ולצידם כפתור
//                  "ירד מהפרק". כך זה מוצג בכרטיס ההצעה עצמו.
//
// המראה זהה לחלוטין בשני המצבים; ההבדל הוא רק במה שקורה בלחיצה.
export default function StageFunnel({ status, compact = false, onSelect = null, busyStage = "" }) {
  const interactive = typeof onSelect === "function";
  const dropped = status === PROPOSAL_DROPPED;

  // תצוגה בלבד, והצעה שירדה מהפרק: שלט אדום קצר, בדיוק כפי שהיה
  if (dropped && !interactive) {
    return (
      <div className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600">
        <X size={14} /> ירד מהפרק
      </div>
    );
  }

  const currentIndex = dropped ? -1 : PROPOSAL_STAGES.indexOf(status);

  // עיגול אחד. באותו מבנה בשני המצבים, כדי שהמראה לא ישתנה.
  const Circle = ({ stage, label, cls, icon, active, busy }) => {
    const inner = (
      <>
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition ${cls} ${
            busy ? "animate-pulse" : ""
          } ${interactive ? "group-active:scale-90" : ""}`}
        >
          {icon}
        </span>
        {!compact && (
          <span
            className={`text-center text-[9px] leading-tight ${
              active ? "font-bold text-[#844442]" : "text-[#A2937F]"
            }`}
          >
            {label}
          </span>
        )}
      </>
    );

    if (!interactive) {
      return <div className="flex flex-1 flex-col items-center gap-1">{inner}</div>;
    }
    return (
      <button
        type="button"
        onClick={() => onSelect(stage)}
        disabled={!!busyStage}
        aria-label={`העברת ההצעה לשלב ${label}`}
        aria-current={active ? "step" : undefined}
        title={label}
        className="group flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-lg py-0.5 transition hover:bg-[#F5EFE6] disabled:cursor-wait"
      >
        {inner}
      </button>
    );
  };

  return (
    <div className={`flex items-start ${compact ? "gap-1" : "gap-1.5"}`}>
      {PROPOSAL_STAGES.map((stage, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <Circle
            key={stage}
            stage={stage}
            label={stage}
            active={active}
            busy={busyStage === stage}
            icon={done ? <Check size={12} /> : i + 1}
            cls={
              active
                ? "bg-[#844442] text-white ring-4 ring-[#844442]/20"
                : done
                ? "bg-[#62826B] text-white"
                : "bg-[#CCBDAB] text-[#A2937F]"
            }
          />
        );
      })}

      {/* "ירד מהפרק" מוצג רק כשאפשר ללחוץ, כדי שיהיה אפשר גם להוריד מהפרק
          וגם לחזור ממנו לשלב רגיל - בלי לצאת מהכרטיס. */}
      {interactive && (
        <Circle
          stage={PROPOSAL_DROPPED}
          label={PROPOSAL_DROPPED}
          active={dropped}
          busy={busyStage === PROPOSAL_DROPPED}
          icon={<X size={12} />}
          cls={dropped ? "bg-[#C24545] text-white ring-4 ring-[#C24545]/20" : "bg-[#E8DCCB] text-[#A2937F]"}
        />
      )}
    </div>
  );
}
