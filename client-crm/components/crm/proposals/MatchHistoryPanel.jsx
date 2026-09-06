"use client";

import { useMemo, useState } from "react";
import { Archive, ChevronDown, Plus, RotateCcw, Trash2 } from "lucide-react";
import SearchableSelect from "@/components/crm/ui/SearchableSelect";
import ConfirmDialog from "@/components/crm/ui/ConfirmDialog";
import { useCrmStore, PROPOSAL_STAGES, PROPOSAL_DROPPED } from "@/lib/crm/store";

const hebrewDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("he-IL");
};

// שורה אחת בארכיון: זוג שירד מהפרק, בין אם בתוך המערכת ובין אם הוזן כהיסטוריה.
function ArchiveRow({ proposal }) {
  const role = useCrmStore((s) => s.role);
  const updateProposalStatus = useCrmStore((s) => s.updateProposalStatus);
  const deleteProposal = useCrmStore((s) => s.deleteProposal);
  const showToast = useCrmStore((s) => s.showToast);
  const findCandidateById = useCrmStore((s) => s.findCandidateById);
  const candidateExistsInDb = useCrmStore((s) => s.candidateExistsInDb);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const male = findCandidateById(proposal.maleId);
  const female = findCandidateById(proposal.femaleId);

  // כרטיס חסוי שאין למשתמש/ת הרשאה לראות - ההצעה כולה נעלמת גם מהארכיון.
  const maleHidden = !male && !proposal.externalMale && candidateExistsInDb(proposal.maleId);
  const femaleHidden = !female && !proposal.externalFemale && candidateExistsInDb(proposal.femaleId);
  if (maleHidden || femaleHidden) return null;

  const maleName = male?.name || proposal.externalMale?.name || proposal.maleName || "כרטיס שנמחק";
  const femaleName = female?.name || proposal.externalFemale?.name || proposal.femaleName || "כרטיס שנמחק";

  const handleRestore = async () => {
    await updateProposalStatus(proposal.id, PROPOSAL_STAGES[0], "ההצעה הוחזרה ללוח הפעיל");
    showToast("ההצעה חזרה ללוח הפעיל");
  };

  const handleDelete = async () => {
    await deleteProposal(proposal.id);
    setConfirmingDelete(false);
    showToast("הרשומה נמחקה מההיסטוריה");
  };

  return (
    <li className="flex items-center justify-between gap-2 rounded-2xl bg-white px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-[#5A4A3C]">
          {maleName} ⚭ {femaleName}
        </p>
        <p className="mt-0.5 text-[11px] text-[#C3B5A5]">
          {proposal.isHistory ? "היסטוריה שהוזנה ידנית" : "ירד מהפרק במערכת"}
          {hebrewDate(proposal.createdAt) && ` · ${hebrewDate(proposal.createdAt)}`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={handleRestore}
          className="rounded-full p-1.5 text-[#C06E5E] transition hover:bg-[#F7DFD8]"
          aria-label="החזרה ללוח הפעיל"
          title="החזרה ללוח הפעיל"
        >
          <RotateCcw size={15} />
        </button>
        {role === "admin" && (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="rounded-full p-1.5 text-[#C4584C] transition hover:bg-red-50"
            aria-label="מחיקת הרשומה"
            title="מחיקה לצמיתות"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          message="למחוק את הרשומה הזו מההיסטוריה לצמיתות? התראת הכפילות על הזוג הזה תיפסק."
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </li>
  );
}

// ממשק המנהלת להזנת היסטוריית התאמות מלפני הקמת המערכת, יחד עם הארכיון
// של כל מה שירד מהפרק. הפאנל סגור כברירת מחדל ואינו חלק מהלוח הפעיל.
export default function MatchHistoryPanel() {
  const role = useCrmStore((s) => s.role);
  const addProposalHistory = useCrmStore((s) => s.addProposalHistory);
  const droppedProposalFor = useCrmStore((s) => s.droppedProposalFor);
  const showToast = useCrmStore((s) => s.showToast);
  const allCandidates = useCrmStore((s) => s.allCandidates);
  const proposals = useCrmStore((s) => s.proposals);
  const candidates_ = useCrmStore((s) => s.candidates);

  const [open, setOpen] = useState(false);
  const [maleId, setMaleId] = useState("");
  const [femaleId, setFemaleId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const maleCandidates = useMemo(() => allCandidates("male"), [allCandidates, candidates_]);
  const femaleCandidates = useMemo(() => allCandidates("female"), [allCandidates, candidates_]);
  const dropped = useMemo(
    () =>
      [...proposals.filter((p) => p.status === PROPOSAL_DROPPED)].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      ),
    [proposals]
  );

  const isAdmin = role === "admin";
  const alreadyExists = !!(maleId && femaleId && droppedProposalFor(maleId, femaleId));
  const canSave = !!maleId && !!femaleId && !alreadyExists && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const saved = await addProposalHistory(maleId, femaleId, note);
    setSaving(false);
    if (!saved) {
      showToast("הזוג הזה כבר מופיע בהיסטוריה");
      return;
    }
    // משאירים את הפאנל פתוח כדי שאפשר יהיה להזין רשומה נוספת מיד
    setMaleId("");
    setFemaleId("");
    setNote("");
    showToast("נשמר בהיסטוריה. הזוג הזה לא יופיע בלוח הפעיל");
  };

  return (
    <div className="mt-6 rounded-3xl border border-[#EADCCB] bg-[#FBF3EA] p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-right"
      >
        <span className="flex items-center gap-1.5 text-[13px] font-bold text-[#5A4A3C]">
          <Archive size={15} className="text-[#C06E5E]" />
          היסטוריית התאמות שירדו מהפרק ({dropped.length})
        </span>
        <ChevronDown size={18} className={`shrink-0 text-[#8C7B6B] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {!open && (
        <p className="mt-1.5 text-[11px] leading-relaxed text-[#8C7B6B]">
          כל ההצעות שירדו מהפרק נשמרות כאן ואינן מוצגות בלוח הפעיל.
        </p>
      )}

      {open && (
        <div className="mt-3 space-y-4">
          {isAdmin && (
            <div className="rounded-2xl border border-[#EADCCB] bg-white p-3">
              <p className="text-[12px] font-bold text-[#5A4A3C]">הזנת התאמה מהעבר</p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#8C7B6B]">
                זוגות שהוצעו עוד לפני שהמערכת קמה וירדו מהפרק. הרשומה נשמרת כהיסטוריה בלבד, לא נכנסת
                ללוח הפעיל, ומרגע השמירה הצוות יקבל התראה אם ינסה להציע את הזוג הזה שוב.
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <p className="mb-1.5 text-[12px] font-semibold text-[#5A4A3C]">בחור</p>
                  <SearchableSelect
                    value={maleId}
                    onChange={(v) => setMaleId(v || "")}
                    placeholder="בחירת בחור..."
                    emptyText="לא נמצא בחור בשם הזה"
                    options={maleCandidates.map((c) => ({ value: c.id, label: c.name }))}
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-[12px] font-semibold text-[#5A4A3C]">בחורה</p>
                  <SearchableSelect
                    value={femaleId}
                    onChange={(v) => setFemaleId(v || "")}
                    placeholder="בחירת בחורה..."
                    emptyText="לא נמצאה בחורה בשם הזה"
                    options={femaleCandidates.map((c) => ({ value: c.id, label: c.name }))}
                  />
                </div>
              </div>

              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="מה קרה שם? (לא חובה)"
                className="mt-2 w-full rounded-xl border border-[#EADCCB] bg-white px-3 py-2.5 text-[13px] outline-none focus:border-[#C06E5E]"
              />

              {alreadyExists && (
                <p className="mt-2 rounded-xl bg-[#FDF6EC] px-3 py-2 text-[11px] font-semibold text-[#8A6A32]">
                  הזוג הזה כבר רשום בהיסטוריה. אין צורך להזין אותו שוב.
                </p>
              )}

              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#C06E5E] py-2.5 text-[13px] font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
              >
                <Plus size={15} /> {saving ? "שומרת..." : "שמירה בהיסטוריה"}
              </button>
            </div>
          )}

          <div>
            <p className="mb-2 text-[12px] font-semibold text-[#5A4A3C]">הרשומות ששמורות בהיסטוריה</p>
            {dropped.length === 0 ? (
              <p className="rounded-2xl bg-white px-3 py-4 text-center text-[12px] text-[#8C7B6B]">
                עדיין אין רשומות בהיסטוריה
              </p>
            ) : (
              <ul className="space-y-1.5">
                {dropped.map((p) => (
                  <ArchiveRow key={p.id} proposal={p} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
