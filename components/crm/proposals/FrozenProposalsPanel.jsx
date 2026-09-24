"use client";

import { useMemo, useState } from "react";
import { ChevronDown, PauseCircle } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { isFrozenProposal } from "@/lib/crm/proposalStatus";
import ProposalCard from "./ProposalCard";

// אזור ההצעות שבהשהיה.
//
// הצעה מוקפאת יוצאת מהלוח הפעיל כדי שלא תתפוס מקום ותיצור עומס, אבל
// היא לא הולכת לשום מקום: היא ממתינה כאן במלואה - עם הרציונל, היומן
// והשלב שבו נעצרה - וכפתור אחד מחזיר אותה לפעילות.
//
// הפאנל סגור כברירת מחדל ונפתח בלחיצה, בדיוק כמו פאנל ההיסטוריה,
// כדי שהמסך הראשי יישאר קצר בטלפון.
export default function FrozenProposalsPanel() {
  const proposals = useCrmStore((s) => s.proposals);
  const [open, setOpen] = useState(false);

  const frozen = useMemo(
    () =>
      [...proposals.filter(isFrozenProposal)].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ),
    [proposals]
  );

  if (frozen.length === 0) return null;

  return (
    <div className="mt-6 rounded-3xl border border-[#F0C9A0] bg-[#FFF8F0] p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-right"
      >
        <span className="flex items-center gap-1.5 text-[13px] font-bold text-[#3A3335]">
          <PauseCircle size={15} className="text-[#B45309]" />
          מוקפאים / בהשהיה ({frozen.length})
        </span>
        <ChevronDown size={18} className={`shrink-0 text-[#8A8285] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {!open && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-[#8A8285]">
          הצעות שממתינות. הן אינן בלוח הפעיל, והמועמדים שבהן נשארים פנויים להצעות אחרות.
        </p>
      )}

      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-[11px] leading-relaxed text-[#8A8285]">
            כל הצעה כאן שמורה במלואה. &quot;החזרה לפעילות&quot; מחזירה אותה ללוח הפעיל, בדיוק לשלב שבו היתה
            לפני ההשהיה.
          </p>
          {frozen.map((p) => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </div>
      )}
    </div>
  );
}
