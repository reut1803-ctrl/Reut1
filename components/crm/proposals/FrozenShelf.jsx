"use client";

// אזור ההצעות המוקפאות.
//
// הצעה בהשהיה אינה סגורה - היא רק ממתינה, למשל כשאחד הצדדים בהפסקה.
// היא יורדת מהלוח הפעיל כדי לא להעמיס, ויושבת כאן עד שמחזירים אותה.
//
// בכוונה אין כאן מחיקה: מוקפא הוא מצב זמני, ומי שרוצה לסגור הצעה
// סופית מעביר אותה ל"ירד מהפרק" ומשם היא מגיעה להיסטוריה.

import { useState } from "react";
import { PauseCircle, ChevronDown, RotateCcw } from "lucide-react";
import { useCrmStore, PROPOSAL_FROZEN } from "@/lib/crm/store";
import { lastDropInfo, toMillis } from "@/lib/crm/attention";

function FrozenRow({ proposal }) {
  const findCandidateById = useCrmStore((s) => s.findCandidateById);
  const unfreezeProposal = useCrmStore((s) => s.unfreezeProposal);
  const showToast = useCrmStore((s) => s.showToast);
  const [busy, setBusy] = useState(false);

  const maleName = findCandidateById(proposal.maleId)?.name || proposal.externalMale?.name || "מועמד שהוסר";
  const femaleName = findCandidateById(proposal.femaleId)?.name || proposal.externalFemale?.name || "מועמדת שהוסרה";
  // אותה שליפה מהיומן ששימשה את ההיסטוריה, הפעם על רשומת ההקפאה
  const info = lastDropInfo(proposal, PROPOSAL_FROZEN);
  const dateMs = info?.dateMs || toMillis(proposal.createdAt);

  const handleRestore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await unfreezeProposal(proposal.id);
      showToast("ההצעה חזרה ללוח הפעיל");
    } catch {
      showToast("החזרת ההצעה נכשלה, נסי שוב");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-2xl border border-[#CCBDAB] bg-white px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-[#3A2E26]">
            {maleName} ⚭ {femaleName}
          </p>
          <p className="mt-0.5 text-[11px] text-[#A2937F]">
            בהשהיה מ-{dateMs ? new Date(dateMs).toLocaleDateString("he-IL") : "תאריך לא ידוע"}
          </p>
        </div>
        <button
          onClick={handleRestore}
          disabled={busy}
          aria-label="החזרת ההצעה לפעילות"
          title="החזרה לפעילות"
          className="flex shrink-0 items-center gap-1 rounded-xl bg-[#62826B] px-2.5 py-1.5 text-[11px] font-bold text-white transition active:scale-95 disabled:opacity-40"
        >
          <RotateCcw size={13} /> החזרה לפעילות
        </button>
      </div>

      {info?.note && (
        <p className="mt-1 whitespace-pre-line text-[11px] leading-relaxed text-[#7C6E60]">
          הסיבה שנרשמה: {info.note}
        </p>
      )}
    </li>
  );
}

export default function FrozenShelf({ proposals }) {
  const [open, setOpen] = useState(false);

  const rows = [...proposals].sort(
    (a, b) =>
      (lastDropInfo(b, PROPOSAL_FROZEN)?.dateMs || toMillis(b.createdAt)) -
      (lastDropInfo(a, PROPOSAL_FROZEN)?.dateMs || toMillis(a.createdAt))
  );

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-2xl border border-[#CCBDAB] bg-[#EFE7DA] px-3.5 py-3 text-right transition active:scale-[0.99]"
      >
        <span className="flex items-center gap-1.5 text-[13px] font-bold text-[#3A2E26]">
          <PauseCircle size={15} /> מוקפאים / בהשהיה ({rows.length})
        </span>
        <ChevronDown size={18} className={`shrink-0 text-[#7C6E60] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <p className="mt-2 px-1 text-[11px] leading-relaxed text-[#7C6E60]">
            {rows.length === 0
              ? "אין כרגע הצעות בהשהיה. הצעה שתעבירי לבהשהיה תרד מהלוח הפעיל ותחכה כאן."
              : "ההצעות האלה ממתינות ואינן מוצגות בלוח הפעיל. הן לא נסגרו, והמועמדים שבהן ממשיכים להיראות פנויים ויכולים לקבל הצעות אחרות במקביל."}
          </p>
          {rows.length > 0 && (
            <ul className="mt-2 space-y-2">
              {rows.map((p) => (
                <FrozenRow key={p.id} proposal={p} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
