"use client";

import { useMemo, useState } from "react";
import { ChevronDown, PauseCircle, RotateCcw } from "lucide-react";
import { useCrmStore, PROPOSAL_ON_HOLD } from "@/lib/crm/store";

const hebrewDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("he-IL");
};

// שורה אחת באזור ההשהיה: זוג שהוקפא, עם החזרה מיידית לפעילות.
function OnHoldRow({ proposal }) {
  const restoreProposal = useCrmStore((s) => s.restoreProposal);
  const showToast = useCrmStore((s) => s.showToast);
  const [restoring, setRestoring] = useState(false);

  // השמות נלקחים ממה שנשמר על ההצעה, כדי שהשורה תהיה קריאה גם כשאחד
  // הצדדים אינו במאגר או שהכרטיס שלו נמחק.
  const maleName = proposal.maleName || proposal.externalMale?.name || "?";
  const femaleName = proposal.femaleName || proposal.externalFemale?.name || "?";

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      await restoreProposal(proposal.id);
      showToast("ההצעה חזרה ללוח הפעיל");
    } catch {
      showToast("החזרת ההצעה נכשלה");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#EAE5E3] bg-white p-3">
      <p className="text-[13px] font-bold text-[#3A3335]">
        {maleName} <span className="text-[#C98894]">✦</span> {femaleName}
      </p>
      <p className="mt-0.5 text-[11px] text-[#8A8285]">
        הוקפאה {hebrewDate(proposal.heldAt) && `ב-${hebrewDate(proposal.heldAt)}`}
        {proposal.heldFrom && ` · חוזרת לשלב "${proposal.heldFrom}"`}
      </p>
      <button
        type="button"
        onClick={handleRestore}
        disabled={restoring}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl bg-[#20A66B] py-1.5 text-[11px] font-semibold text-white transition active:scale-95 disabled:opacity-60"
      >
        <RotateCcw size={13} /> {restoring ? "מחזירה..." : "החזרה לפעילות"}
      </button>
    </div>
  );
}

// אזור "מוקפאים / בהשהיה".
//
// הצעה מוקפאת יוצאת מהפיד הפעיל כדי לא להעמיס את המסך, ואינה מוצגת בכרטיס
// המועמד/ת - כך הוא/היא נשאר/ת פנוי/ה כלפי שאר הצוות ויכול/ה לקבל הצעות
// חדשות במקביל. האזור הזה הוא המקום היחיד שבו ההצעות האלה מרוכזות, וממנו
// אפשר להחזיר כל אחת מהן לפעילות בלחיצה.
export default function OnHoldPanel() {
  const proposals = useCrmStore((s) => s.proposals);
  const [open, setOpen] = useState(false);

  const held = useMemo(
    () =>
      [...proposals.filter((p) => p.status === PROPOSAL_ON_HOLD)].sort(
        (a, b) => new Date(b.heldAt || b.createdAt || 0) - new Date(a.heldAt || a.createdAt || 0)
      ),
    [proposals]
  );

  if (held.length === 0) return null;

  return (
    <div className="mt-6 rounded-3xl border border-[#EAE5E3] bg-white p-4 shadow-[0_8px_26px_rgba(58,51,53,0.07)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between"
      >
        <span className="flex items-center gap-1.5 text-[14px] font-bold text-[#3A3335]">
          <PauseCircle size={15} className="text-[#8A8285]" /> מוקפאים / בהשהיה ({held.length})
        </span>
        <ChevronDown size={16} className={`text-[#8A8285] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <p className="mt-2 text-[11.5px] leading-relaxed text-[#8A8285]">
            הצעות שממתינות. הן אינן מופיעות בלוח הפעיל ואינן מוצגות בכרטיס המועמד/ת, כך שאפשר
            להציע לו/ה הצעות נוספות במקביל. ההצעה נשמרת במלואה וחוזרת לשלב שממנו הוקפאה.
          </p>
          <div className="mt-3 space-y-2">
            {held.map((p) => (
              <OnHoldRow key={p.id} proposal={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
