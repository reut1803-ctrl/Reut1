"use client";

import { useRef, useState } from "react";
import { ChevronDown, Clock, Copy, Check, ImageDown, Mic, Pencil, Sparkles, Trash2, UserCheck, X, Phone, MessageCircle, MessageSquare } from "lucide-react";
import { useCrmStore, PROPOSAL_STAGES, PROPOSAL_DROPPED } from "@/lib/crm/store";
import { useMediaUrl } from "@/lib/crm/useMediaUrl";
import { buildProfileShareText } from "@/lib/crm/shareText";
import ConfirmDialog from "@/components/crm/ui/ConfirmDialog";
import StageFunnel from "./StageFunnel";
import CandidatePhone from "@/components/crm/profiles/CandidatePhone";
import { waDigits } from "@/components/crm/profiles/ProfileCard";
import { downloadMedia } from "@/lib/crm/mediaStore";

function ExternalContactCard({ data }) {
  const { url } = useMediaUrl(data.audioUrl);
  const showToast = useCrmStore((s) => s.showToast);
  const [copied, setCopied] = useState(false);

  // לכרטיס מהמעגל האישי אין תמונה, אלא הקלטה - ולכן הכפתור כאן הוא הורדת ההקלטה
  const handleDownloadAudio = async () => {
    if (!data.audioUrl) return;
    try {
      await downloadMedia(data.audioUrl, `${data.name || "הקלטה"}.webm`);
      showToast("ההקלטה יורדת למכשיר");
    } catch {
      showToast("הורדת ההקלטה נכשלה, נסי שוב");
    }
  };

  const handleCopy = async () => {
    const text = [`${data.name} (מהמעגל האישי - לא במאגר)`, data.notes || null].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("ההעתקה נכשלה, נסי שוב");
    }
  };

  return (
    <div className="rounded-2xl border-2 border-dashed border-[#844442] bg-[#E8DCCB] p-3">
      <p className="text-[10px] font-bold text-[#844442]">מהמעגל האישי - לא במאגר</p>
      <p className="mt-0.5 text-[13px] font-bold text-[#3A2E26]">{data.name}</p>
      {data.notes && (
        <p className="mt-1 whitespace-pre-line text-[11px] leading-relaxed text-[#3A2E26]">{data.notes}</p>
      )}
      {url && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio src={url} controls className="mt-2 h-8 w-full" />
      )}

      <button
        onClick={handleCopy}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-[#CCBDAB] bg-white py-1.5 text-[11px] font-semibold text-[#844442] transition active:scale-95 hover:bg-[#E8DCCB]"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? "הועתק!" : "העתקת הפרטים"}
      </button>

      {data.audioUrl && (
        <button
          onClick={handleDownloadAudio}
          className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-xl border border-[#CCBDAB] bg-white py-1.5 text-[11px] font-semibold text-[#844442] transition active:scale-95 hover:bg-[#E8DCCB]"
        >
          <Mic size={13} /> הורדת ההקלטה
        </button>
      )}
    </div>
  );
}

function ContactCard({ candidate }) {
  const [copied, setCopied] = useState(false);
  const [referenceCopied, setReferenceCopied] = useState(false);
  const contactStaff = useCrmStore((s) => s.contactStaffFor(candidate));
  const showToast = useCrmStore((s) => s.showToast);
  const waLink = contactStaff?.phone ? `https://wa.me/${waDigits(contactStaff.phone)}` : null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildProfileShareText(candidate));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasPhoto = !!(candidate.photoUrl || candidate.photoUrls?.length);
  const recordingRef = candidate.introAudioUrl || candidate.voiceNotes?.[0]?.audioUrl || null;

  const handleDownloadRecording = async () => {
    if (!recordingRef) return;
    try {
      await downloadMedia(recordingRef, `${candidate.name}.webm`);
      showToast("ההקלטה יורדת למכשיר");
    } catch {
      showToast("הורדת ההקלטה נכשלה, נסי שוב");
    }
  };

  const handleDownloadPhoto = async () => {
    const source = candidate.photoUrl || candidate.photoUrls?.[0] || null;
    if (!source) {
      showToast("אין תמונה לכרטיס הזה");
      return;
    }
    try {
      await downloadMedia(source, `${candidate.name}.jpg`);
      showToast("התמונה יורדת למכשיר");
    } catch {
      showToast("הורדת התמונה נכשלה, נסי שוב");
    }
  };

  const handleCopyReferenceContacts = async () => {
    await navigator.clipboard.writeText(candidate.referenceContacts || "");
    setReferenceCopied(true);
    setTimeout(() => setReferenceCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-[#E8DCCB] p-3">
      <p className="text-[13px] font-bold text-[#3A2E26]">{candidate.name}</p>
      <div className="mt-0.5">
        <CandidatePhone candidate={candidate} compact />
      </div>


      <button
        onClick={handleCopy}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-[#CCBDAB] bg-white py-1.5 text-[11px] font-semibold text-[#844442] transition active:scale-95 hover:bg-[#E8DCCB]"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? "הועתק!" : "העתקת כרטיס"}
      </button>
      {hasPhoto && (
        <button
          onClick={handleDownloadPhoto}
          className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-xl border border-[#CCBDAB] bg-white py-1.5 text-[11px] font-semibold text-[#844442] transition active:scale-95 hover:bg-[#E8DCCB]"
        >
          <ImageDown size={13} /> הורדת תמונה
        </button>
      )}

      {recordingRef && (
        <button
          onClick={handleDownloadRecording}
          className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-xl border border-[#CCBDAB] bg-white py-1.5 text-[11px] font-semibold text-[#844442] transition active:scale-95 hover:bg-[#E8DCCB]"
        >
          <Mic size={13} /> הורדת ההקלטה
        </button>
      )}

      {contactStaff && (
        <div className="mt-2 rounded-xl border-2 border-[#844442] bg-white p-2">
          <p className="mb-0.5 flex items-center gap-1 text-[10px] font-bold text-[#844442]">
            <UserCheck size={11} /> איש קשר בצוות לבירורים
          </p>
          <p className="text-[12px] font-bold text-[#3A2E26]">{contactStaff.name}</p>
          <p className="text-[10px] leading-snug text-[#7C6E60]">
            מכיר/ה את המועמד/ת אישית - כדאי לדבר לפני שמקדמים את ההצעה
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {contactStaff.phone && (
              <>
                <a
                  href={`tel:${contactStaff.phone}`}
                  className="rounded-lg bg-[#E8DCCB] px-2 py-1 text-[11px] font-semibold text-[#3A2E26]"
                >
                  חיוג
                </a>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[#62826B] px-2 py-1 text-[11px] font-semibold text-white"
                >
                  וואטסאפ
                </a>
                <a
                  href={`sms:${contactStaff.phone}`}
                  title="הודעת SMS"
                  className="rounded-lg bg-[#E8DCCB] px-2 py-1 text-[11px] font-semibold text-[#3A2E26]"
                >
                  SMS
                </a>
              </>
            )}
            {contactStaff.email && (
              <a
                href={`mailto:${contactStaff.email}`}
                className="rounded-lg bg-[#E8DCCB] px-2 py-1 text-[11px] font-semibold text-[#3A2E26]"
              >
                מייל
              </a>
            )}
          </div>
          {!contactStaff.phone && (
            <p className="mt-1 text-[10px] text-[#A2937F]">לא הוזן טלפון לנציג/ה בהגדרות הצוות</p>
          )}
        </div>
      )}

      {candidate.referenceContacts && (
        <div className="mt-2 rounded-xl border-2 border-[#844442] bg-white p-2">
          <p className="mb-1 text-[10px] font-bold text-[#844442]">מספרים לבירורים</p>
          <p className="mb-1.5 whitespace-pre-wrap text-[11px] text-[#3A2E26]">{candidate.referenceContacts}</p>
          <button
            onClick={handleCopyReferenceContacts}
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-[#844442] py-1.5 text-[11px] font-semibold text-white transition active:scale-95"
          >
            {referenceCopied ? <Check size={12} /> : <Copy size={12} />}
            {referenceCopied ? "הועתק!" : "העתקה"}
          </button>
        </div>
      )}
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
  const [proposalCopied, setProposalCopied] = useState(false);
  const rationaleRef = useRef(null);

  const male = proposal.maleId ? findCandidateById(proposal.maleId) : null;
  const female = proposal.femaleId ? findCandidateById(proposal.femaleId) : null;
  const extMale = proposal.externalMale || null;
  const extFemale = proposal.externalFemale || null;
  // הצעה מוצגת כל עוד לכל צד יש מקור - כרטיס במאגר או פרטים מהמעגל האישי
  if ((!male && !extMale) || (!female && !extFemale)) return null;
  const maleName = male?.name || extMale?.name || "";
  const femaleName = female?.name || extFemale?.name || "";

  const handleDelete = async () => {
    await deleteProposal(proposal.id);
    showToast("ההתאמה נמחקה");
    setConfirmingDelete(false);
  };

  const handleEditRationale = () => {
    setOpen(true);
    // ממתינים לרינדור של הכרטיס הפתוח לפני שממקדים את השדה
    setTimeout(() => {
      const el = rationaleRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
  };

  // העתקת ההצעה כטקסט, להדבקה בוואטסאפ או בכל מקום אחר.
  // בכוונה אין כאן שכפול של הכרטיס - כדי לא ליצור הצעות כפולות במערכת.
  const handleCopyProposal = async () => {
    const lines = [
      `${maleName} ⚭ ${femaleName}`,
      `שלב: ${proposal.status}`,
      proposal.assignee ? `מטופל/ת ע״י: ${proposal.assignee}` : null,
      extMale?.notes ? `\n${maleName} (מהמעגל האישי):\n${extMale.notes}` : null,
      extFemale?.notes ? `\n${femaleName} (מהמעגל האישי):\n${extFemale.notes}` : null,
      rationaleDraft.trim() ? `\nהרציונל:\n${rationaleDraft.trim()}` : null,
      proposal.journal?.length
        ? `\nיומן התקדמות:\n${proposal.journal
            .map((j) => `· ${new Date(j.date).toLocaleDateString("he-IL")} - ${j.status}${j.note ? `: ${j.note}` : ""}`)
            .join("\n")}`
        : null,
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setProposalCopied(true);
      showToast("פרטי ההצעה הועתקו");
      setTimeout(() => setProposalCopied(false), 2000);
    } catch {
      showToast("ההעתקה נכשלה, נסי שוב");
    }
  };

  return (
    <div className="rounded-3xl border border-[#CCBDAB] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-[#3A2E26]">
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
          {/* עריכת הרציונל: פותח את הכרטיס וממקד את שדה הטקסט, כדי שיהיה ברור שאפשר לערוך */}
          <button
            onClick={handleEditRationale}
            className="rounded-full p-1.5 hover:bg-[#E8DCCB]"
            aria-label="עריכת הרציונל"
            title="עריכת הרציונל"
          >
            <Pencil size={15} className="text-[#7C6E60]" />
          </button>
          {/* העתקת פרטי ההצעה כטקסט, להדבקה בוואטסאפ */}
          <button
            onClick={handleCopyProposal}
            className="rounded-full p-1.5 hover:bg-[#E8DCCB]"
            aria-label="העתקת פרטי ההצעה כטקסט"
            title="העתקת פרטי ההצעה כטקסט"
          >
            {proposalCopied ? <Check size={15} className="text-[#4A6552]" /> : <Copy size={15} className="text-[#7C6E60]" />}
          </button>
          <button onClick={() => setOpen((v) => !v)} className="rounded-full p-1.5 hover:bg-[#E8DCCB]" aria-label="פתיחת יומן">
            <ChevronDown size={18} className={`transition ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        {proposal.assignee ? (
          <span className="flex items-center gap-1.5 rounded-full bg-[#F0E2DE] px-2.5 py-1 text-[11px] font-bold text-[#5E2F2D]">
            <UserCheck size={12} /> מטופל/ת ע״י {proposal.assignee}
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-[#A2937F]">טרם שויך לאיש צוות</span>
        )}
        {proposal.assignee ? (
          <button
            onClick={() => assignProposal(proposal.id, null)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#A2937F] hover:text-[#844442]"
          >
            <X size={12} /> שחרור שיוך
          </button>
        ) : (
          <button
            onClick={() => assignProposalToSelf(proposal.id)}
            className="rounded-full bg-[#844442] px-3 py-1 text-[11px] font-bold text-white transition active:scale-95"
          >
            לקחתי על עצמי
          </button>
        )}
      </div>

      <div className="relative mt-3">
        <StageFunnel status={proposal.status} />
      </div>

      <div className="mt-4 rounded-2xl bg-[#F5E7E2] p-3">
        <p className="mb-1 flex items-center gap-1 text-[11px] font-bold text-[#6B3A34]">
          <Sparkles size={12} /> הרציונל (הניצוץ)
        </p>
        <textarea
          ref={rationaleRef}
          value={rationaleDraft}
          onChange={(e) => setRationaleDraft(e.target.value)}
          onBlur={() => updateProposalRationale(proposal.id, rationaleDraft)}
          rows={2}
          placeholder="מה משלים בין הצדדים, למה נוצר החיבור..."
          className="w-full resize-none rounded-xl border-none bg-transparent text-[12px] text-[#3A2E26] outline-none placeholder:text-[#A2937F]"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {male ? <ContactCard candidate={male} /> : <ExternalContactCard data={extMale} />}
        {female ? <ContactCard candidate={female} /> : <ExternalContactCard data={extFemale} />}
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-[#CCBDAB] pt-3">
          <div>
            <p className="mb-1.5 text-[12px] font-semibold text-[#3A2E26]">עדכון סטטוס</p>
            <div className="flex flex-wrap gap-1.5">
              {[...PROPOSAL_STAGES, PROPOSAL_DROPPED].map((stage) => (
                <button
                  key={stage}
                  onClick={() => updateProposalStatus(proposal.id, stage, note)}
                  className={`rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                    proposal.status === stage
                      ? "border-[#844442] bg-[#844442] text-white"
                      : "border-[#CCBDAB] bg-white text-[#3A2E26] hover:bg-[#E8DCCB]"
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
              className="w-full rounded-xl border border-[#CCBDAB] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#844442]"
            />
          </div>

          <div>
            <p className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#3A2E26]">
              <Clock size={13} /> יומן התקדמות
            </p>
            <ul className="space-y-1.5">
              {[...proposal.journal].reverse().map((entry) => (
                <li key={entry.id} className="rounded-xl bg-[#E8DCCB] px-3 py-2 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#3A2E26]">{entry.status}</span>
                    <span className="text-[#A2937F]">{new Date(entry.date).toLocaleDateString("he-IL")}</span>
                  </div>
                  {entry.note && <p className="mt-0.5 text-[#7C6E60]">{entry.note}</p>}
                  <p className="mt-0.5 text-[10px] text-[#A2937F]">עודכן ע״י {entry.author}</p>
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
