"use client";

import { useState } from "react";
import { ChevronDown, Clock, Copy, Check, Phone, Sparkles, Trash2, UserCheck, X } from "lucide-react";
import { useCrmStore, PROPOSAL_STAGES, PROPOSAL_DROPPED } from "@/lib/crm/store";
import { buildProfileShareText } from "@/lib/crm/shareText";
import { useMediaUrl } from "@/lib/crm/useMediaUrl";
import ConfirmDialog from "@/components/crm/ui/ConfirmDialog";
import StageFunnel from "./StageFunnel";

function ContactCard({ candidate }) {
  const [copied, setCopied] = useState(false);
  const [referenceCopied, setReferenceCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildProfileShareText(candidate));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyReferenceContacts = async () => {
    await navigator.clipboard.writeText(candidate.referenceContacts || "");
    setReferenceCopied(true);
    setTimeout(() => setReferenceCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-[#F6F5F4] p-3">
      <p className="text-[13px] font-bold text-[#3A3335]">{candidate.name}</p>
      <p dir="ltr" className="mt-0.5 flex items-center gap-1 text-[12px] text-[#8A8285]">
        <Phone size={12} /> {candidate.phone}
      </p>
      <button
        onClick={handleCopy}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-[#EAE5E3] bg-white py-1.5 text-[11px] font-semibold text-[#8C4A55] transition active:scale-95 hover:bg-[#F6F5F4]"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? "הועתק!" : "העתקת כרטיס"}
      </button>

      {candidate.referenceContacts && (
        <div className="mt-2 rounded-xl border-2 border-[#8C4A55] bg-white p-2">
          <p className="mb-1 text-[10px] font-bold text-[#8C4A55]">מספרים לבירורים</p>
          <p className="mb-1.5 whitespace-pre-wrap text-[11px] text-[#3A3335]">{candidate.referenceContacts}</p>
          <button
            onClick={handleCopyReferenceContacts}
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-[#8C4A55] py-1.5 text-[11px] font-semibold text-white transition active:scale-95"
          >
            {referenceCopied ? <Check size={12} /> : <Copy size={12} />}
            {referenceCopied ? "הועתק!" : "העתקה"}
          </button>
        </div>
      )}
    </div>
  );
}

// מועמד/ת שאינו/ה במאגר: הפרטים נשמרו בתוך ההצעה עצמה בלבד
function ExternalContactCard({ person }) {
  const { url } = useMediaUrl(person.audioUrl);

  return (
    <div className="rounded-2xl border border-dashed border-[#C98894] bg-[#FDF7F8] p-3">
      <p className="text-[13px] font-bold text-[#3A3335]">{person.name}</p>
      <p className="mt-0.5 text-[10px] font-semibold text-[#8C4A55]">מהמעגל האישי · לא במאגר</p>
      {person.notes && <p className="mt-1.5 whitespace-pre-line text-[11px] leading-relaxed text-[#3A3335]">{person.notes}</p>}
      {person.audioUrl &&
        (url ? <audio controls src={url} className="mt-2 h-9 w-full" /> : <p className="mt-2 text-[11px] text-[#8A8285]">טוען הקלטה...</p>)}
    </div>
  );
}

export default function ProposalCard({ proposal }) {
  const role = useCrmStore((s) => s.role);
  const updateProposalStatus = useCrmStore((s) => s.updateProposalStatus);
  const updateProposalRationale = useCrmStore((s) => s.updateProposalRationale);
  const assignProposal = useCrmStore((s) => s.assignProposal);
  const assignProposalToSelf = useCrmStore((s) => s.assignProposalToSelf);
  const deleteProposal = useCrmStore((s) => s.deleteProposal);
  const showToast = useCrmStore((s) => s.showToast);
  const findCandidateById = useCrmStore((s) => s.findCandidateById);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [rationaleDraft, setRationaleDraft] = useState(proposal.rationale || "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const male = findCandidateById(proposal.maleId);
  const female = findCandidateById(proposal.femaleId);
  const externalMale = proposal.externalMale || null;
  const externalFemale = proposal.externalFemale || null;
  // צד תקין הוא מועמד/ת מהמאגר או אדם חיצוני שנשמר בתוך ההצעה
  if ((!male && !externalMale) || (!female && !externalFemale)) return null;

  const maleName = male?.name || externalMale?.name;
  const femaleName = female?.name || externalFemale?.name;

  const handleDelete = async () => {
    await deleteProposal(proposal.id);
    showToast("ההתאמה נמחקה");
    setConfirmingDelete(false);
  };

  // עדכון סטטוס - גם מלחיצה על עיגול בסרגל ההתקדמות וגם מכפתורי השלבים ביומן.
  // ההערה שהוקלדה (אם יש) מצורפת ליומן ומתאפסת אחרי השמירה.
  const handleStageChange = async (stage) => {
    if (stage === proposal.status) return;
    await updateProposalStatus(proposal.id, stage, note);
    setNote("");
    showToast(`הסטטוס עודכן ל"${stage}"`);
  };

  return (
    <div className="rounded-3xl border border-[#EAE5E3] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-[#3A3335]">
          {maleName} ⚭ {femaleName}
        </h3>
        <div className="flex items-center gap-1">
          {role === "admin" && (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="rounded-full p-1.5 hover:bg-red-50"
              aria-label="מחיקת התאמה"
            >
              <Trash2 size={16} className="text-[#C24545]" />
            </button>
          )}
          <button onClick={() => setOpen((v) => !v)} className="rounded-full p-1.5 hover:bg-[#F6F5F4]" aria-label="פתיחת יומן">
            <ChevronDown size={18} className={`transition ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        {proposal.assignee ? (
          <span className="flex items-center gap-1.5 rounded-full bg-[#F6E4E6] px-2.5 py-1 text-[11px] font-bold text-[#6E3540]">
            <UserCheck size={12} /> מטופל/ת ע״י {proposal.assignee}
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-[#B5AEB0]">טרם שויך לאיש צוות</span>
        )}
        {proposal.assignee ? (
          <button
            onClick={() => assignProposal(proposal.id, null)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#B5AEB0] hover:text-[#8C4A55]"
          >
            <X size={12} /> שחרור שיוך
          </button>
        ) : (
          <button
            onClick={() => assignProposalToSelf(proposal.id)}
            className="rounded-full bg-[#8C4A55] px-3 py-1 text-[11px] font-bold text-white transition active:scale-95"
          >
            לקחתי על עצמי
          </button>
        )}
      </div>

      <div className="relative mt-3">
        <StageFunnel status={proposal.status} onSelect={handleStageChange} />
      </div>

      <div className="mt-4 rounded-2xl bg-[#FFF8E7] p-3">
        <p className="mb-1 flex items-center gap-1 text-[11px] font-bold text-[#946200]">
          <Sparkles size={12} /> הרציונל (הניצוץ)
        </p>
        <textarea
          value={rationaleDraft}
          onChange={(e) => setRationaleDraft(e.target.value)}
          onBlur={() => updateProposalRationale(proposal.id, rationaleDraft)}
          rows={2}
          placeholder="מה משלים בין הצדדים, למה נוצר החיבור..."
          className="w-full resize-none rounded-xl border-none bg-transparent text-[12px] text-[#3A3335] outline-none placeholder:text-[#B5AEB0]"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {male ? <ContactCard candidate={male} /> : <ExternalContactCard person={externalMale} />}
        {female ? <ContactCard candidate={female} /> : <ExternalContactCard person={externalFemale} />}
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-[#EAE5E3] pt-3">
          <div>
            <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">עדכון סטטוס</p>
            <div className="flex flex-wrap gap-1.5">
              {[...PROPOSAL_STAGES, PROPOSAL_DROPPED].map((stage) => (
                <button
                  key={stage}
                  onClick={() => handleStageChange(stage)}
                  className={`rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                    proposal.status === stage
                      ? "border-[#8C4A55] bg-[#8C4A55] text-white"
                      : "border-[#EAE5E3] bg-white text-[#3A3335] hover:bg-[#F6F5F4]"
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>

          <div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="הערה לעדכון הבא (אופציונלי)..."
              className="w-full rounded-xl border border-[#EAE5E3] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#8C4A55]"
            />
          </div>

          <div>
            <p className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#3A3335]">
              <Clock size={13} /> יומן התקדמות
            </p>
            <ul className="space-y-1.5">
              {[...proposal.journal].reverse().map((entry) => (
                <li key={entry.id} className="rounded-xl bg-[#F6F5F4] px-3 py-2 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#3A3335]">{entry.status}</span>
                    <span className="text-[#B5AEB0]">{new Date(entry.date).toLocaleDateString("he-IL")}</span>
                  </div>
                  {entry.note && <p className="mt-0.5 text-[#8A8285]">{entry.note}</p>}
                  <p className="mt-0.5 text-[10px] text-[#B5AEB0]">עודכן ע״י {entry.author}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {confirmingDelete && (
        <ConfirmDialog
          message="האם את בטוחה שברצונך למחוק התאמה זו לצמיתות?"
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
