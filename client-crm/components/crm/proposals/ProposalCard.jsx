"use client";

import { useState } from "react";
import { ChevronDown, Clock, Copy, Check, Download, Phone, Sparkles, Trash2, UserCheck, X } from "lucide-react";
import { useCrmStore, PROPOSAL_STAGES, PROPOSAL_DROPPED } from "@/lib/crm/store";
import { buildProfileShareText } from "@/lib/crm/shareText";
import { useMediaUrl } from "@/lib/crm/useMediaUrl";
import ConfirmDialog from "@/components/crm/ui/ConfirmDialog";
import StageFunnel from "./StageFunnel";

// כתובת גיבוי שכופה הורדה בצד השרת. חשוב: בלי שם קובץ מותאם - שם בעברית
// בתוך הכתובת נדחה על ידי שרת התמונות ומחזיר שגיאה 400.
function forcedDownloadUrl(url) {
  if (!url) return null;
  return url.includes("/upload/") ? url.replace("/upload/", "/upload/fl_attachment/") : url;
}

// מורידים את התמונה עצמה ואז שומרים אותה מקומית, כך שאפשר לתת לקובץ שם בעברית
// בלי לשלוח את השם לשרת. אם ההורדה הישירה נחסמת - נופלים לכתובת הגיבוי.
async function downloadPhoto(url, fileName) {
  try {
    const res = await fetch(url, { mode: "cors", cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `${fileName || "תמונה"}.jpg`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    // משאירים את הקישור רגע בעמוד: הסרה מיידית מבטלת לפעמים את שם הקובץ המבוקש
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(objectUrl);
    }, 1500);
    return true;
  } catch {
    window.open(forcedDownloadUrl(url), "_blank", "noopener");
    return false;
  }
}

function ContactCard({ candidate }) {
  const [copied, setCopied] = useState(false);
  const [referenceCopied, setReferenceCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const photo = candidate.photoUrl || candidate.photoUrls?.[0] || null;

  const handleDownloadPhoto = async () => {
    if (downloading) return;
    setDownloading(true);
    await downloadPhoto(photo, candidate.name);
    setDownloading(false);
  };

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
    <div className="rounded-2xl bg-[#FBF3EA] p-3">
      <p className="text-[13px] font-bold text-[#5A4A3C]">{candidate.name}</p>
      <p dir="ltr" className="mt-0.5 flex items-center gap-1 text-[12px] text-[#8C7B6B]">
        <Phone size={12} /> {candidate.phone}
      </p>
      <button
        onClick={handleCopy}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-[#EADCCB] bg-white py-1.5 text-[11px] font-semibold text-[#C06E5E] transition active:scale-95 hover:bg-[#FBF3EA]"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? "הועתק!" : "העתקת כרטיס"}
      </button>

      {photo && (
        <button
          type="button"
          onClick={handleDownloadPhoto}
          disabled={downloading}
          className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-xl border border-[#EADCCB] bg-white py-1.5 text-[11px] font-semibold text-[#C06E5E] transition active:scale-95 hover:bg-[#FBF3EA] disabled:opacity-60"
        >
          <Download size={13} /> {downloading ? "מוריד..." : "הורדת תמונה"}
        </button>
      )}

      {candidate.referenceContacts && (
        <div className="mt-2 rounded-xl border-2 border-[#C06E5E] bg-white p-2">
          <p className="mb-1 text-[10px] font-bold text-[#C06E5E]">מספרים לבירורים</p>
          <p className="mb-1.5 whitespace-pre-wrap text-[11px] text-[#5A4A3C]">{candidate.referenceContacts}</p>
          <button
            onClick={handleCopyReferenceContacts}
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-[#C06E5E] py-1.5 text-[11px] font-semibold text-white transition active:scale-95"
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
    <div className="rounded-2xl border border-dashed border-[#E2A396] bg-[#FDF7F4] p-3">
      <p className="text-[13px] font-bold text-[#5A4A3C]">{person.name}</p>
      <p className="mt-0.5 text-[10px] font-semibold text-[#C06E5E]">מהמעגל האישי · לא במאגר</p>
      {person.notes && <p className="mt-1.5 whitespace-pre-line text-[11px] leading-relaxed text-[#5A4A3C]">{person.notes}</p>}
      {person.audioUrl &&
        (url ? <audio controls src={url} className="mt-2 h-9 w-full" /> : <p className="mt-2 text-[11px] text-[#8C7B6B]">טוען הקלטה...</p>)}
    </div>
  );
}

// כרטיס מועמד/ת שנמחק מהמאגר. ההצעה עצמה נשמרת ומוצגת, כדי שהרציונל והיומן לא ילכו לאיבוד.
function MissingContactCard({ name }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#EADCCB] bg-[#FBF3EA] p-3">
      <p className="text-[13px] font-bold text-[#5A4A3C]">{name}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-[#8C7B6B]">
        הכרטיס אינו קיים יותר במאגר, ולכן אין פרטי קשר להצגה. ההצעה עצמה נשמרה במלואה.
      </p>
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
  const candidateExistsInDb = useCrmStore((s) => s.candidateExistsInDb);
  const candidatesLoaded = useCrmStore((s) => s.candidatesLoaded);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [rationaleDraft, setRationaleDraft] = useState(proposal.rationale || "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const male = findCandidateById(proposal.maleId);
  const female = findCandidateById(proposal.femaleId);
  const externalMale = proposal.externalMale || null;
  const externalFemale = proposal.externalFemale || null;

  // ממתינים לטעינת המאגר, אחרת כל ההצעות ייראו לרגע כאילו הכרטיסים שלהן נמחקו
  if (!candidatesLoaded) return null;

  // צד חסר יכול לנבוע משתי סיבות שונות לגמרי:
  // 1. הכרטיס קיים אבל חסוי למשתמש/ת הנוכחי/ת - אז מסתירים את ההצעה כולה (שמירה על סודיות).
  // 2. הכרטיס נמחק מהמאגר - אז ההצעה עדיין מוצגת עם השם השמור, כדי שהרציונל,
  //    היומן והסטטוס לא ייעלמו מהמסך.
  const maleHidden = !male && !externalMale && candidateExistsInDb(proposal.maleId);
  const femaleHidden = !female && !externalFemale && candidateExistsInDb(proposal.femaleId);
  if (maleHidden || femaleHidden) return null;

  const maleMissing = !male && !externalMale;
  const femaleMissing = !female && !externalFemale;
  const maleName = male?.name || externalMale?.name || proposal.maleName || "כרטיס שנמחק מהמאגר";
  const femaleName = female?.name || externalFemale?.name || proposal.femaleName || "כרטיס שנמחק מהמאגר";

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
    // "ירד מהפרק" מוציא את ההצעה מהלוח הפעיל. מסבירים לאן היא הלכה,
    // כדי שהיעלמות הכרטיסייה מהמסך לא תיראה כמו מחיקה.
    if (stage === PROPOSAL_DROPPED) showToast("ההצעה ירדה מהפרק ועברה להיסטוריה שבתחתית העמוד");
    else showToast(`הסטטוס עודכן ל"${stage}"`);
  };

  return (
    <div className="rounded-3xl border border-[#EADCCB] bg-white p-4 shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-[#5A4A3C]">
          {maleName} ⚭ {femaleName}
        </h3>
        <div className="flex items-center gap-1">
          {role === "admin" && (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="rounded-full p-1.5 hover:bg-red-50"
              aria-label="מחיקת התאמה"
            >
              <Trash2 size={16} className="text-[#C4584C]" />
            </button>
          )}
          <button onClick={() => setOpen((v) => !v)} className="rounded-full p-1.5 hover:bg-[#FBF3EA]" aria-label="פתיחת יומן">
            <ChevronDown size={18} className={`transition ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        {proposal.assignee ? (
          <span className="flex items-center gap-1.5 rounded-full bg-[#F7DFD8] px-2.5 py-1 text-[11px] font-bold text-[#A05243]">
            <UserCheck size={12} /> מטופל/ת ע״י {proposal.assignee}
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-[#C3B5A5]">טרם שויך לאיש צוות</span>
        )}
        {proposal.assignee ? (
          <button
            onClick={() => assignProposal(proposal.id, null)}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#C3B5A5] hover:text-[#C06E5E]"
          >
            <X size={12} /> שחרור שיוך
          </button>
        ) : (
          <button
            onClick={() => assignProposalToSelf(proposal.id)}
            className="rounded-full bg-[#C06E5E] px-3 py-1 text-[11px] font-bold text-white transition active:scale-95"
          >
            לקחתי על עצמי
          </button>
        )}
      </div>

      <div className="relative mt-3">
        <StageFunnel status={proposal.status} onSelect={handleStageChange} />
      </div>

      <div className="mt-4 rounded-2xl bg-[#FDF6EC] p-3">
        <p className="mb-1 flex items-center gap-1 text-[11px] font-bold text-[#8A6A32]">
          <Sparkles size={12} /> הרציונל (הניצוץ)
        </p>
        <textarea
          value={rationaleDraft}
          onChange={(e) => setRationaleDraft(e.target.value)}
          onBlur={() => updateProposalRationale(proposal.id, rationaleDraft)}
          rows={2}
          placeholder="מה משלים בין הצדדים, למה נוצר החיבור..."
          className="w-full resize-none rounded-xl border-none bg-transparent text-[12px] text-[#5A4A3C] outline-none placeholder:text-[#C3B5A5]"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {male ? (
          <ContactCard candidate={male} />
        ) : maleMissing ? (
          <MissingContactCard name={maleName} />
        ) : (
          <ExternalContactCard person={externalMale} />
        )}
        {female ? (
          <ContactCard candidate={female} />
        ) : femaleMissing ? (
          <MissingContactCard name={femaleName} />
        ) : (
          <ExternalContactCard person={externalFemale} />
        )}
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-[#EADCCB] pt-3">
          <div>
            <p className="mb-1.5 text-[12px] font-semibold text-[#5A4A3C]">עדכון סטטוס</p>
            <div className="flex flex-wrap gap-1.5">
              {[...PROPOSAL_STAGES, PROPOSAL_DROPPED].map((stage) => (
                <button
                  key={stage}
                  onClick={() => handleStageChange(stage)}
                  className={`rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                    proposal.status === stage
                      ? "border-[#C06E5E] bg-[#C06E5E] text-white"
                      : "border-[#EADCCB] bg-white text-[#5A4A3C] hover:bg-[#FBF3EA]"
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
              className="w-full rounded-xl border border-[#EADCCB] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#C06E5E]"
            />
          </div>

          <div>
            <p className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#5A4A3C]">
              <Clock size={13} /> יומן התקדמות
            </p>
            <ul className="space-y-1.5">
              {[...proposal.journal].reverse().map((entry) => (
                <li key={entry.id} className="rounded-xl bg-[#FBF3EA] px-3 py-2 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#5A4A3C]">{entry.status}</span>
                    <span className="text-[#C3B5A5]">{new Date(entry.date).toLocaleDateString("he-IL")}</span>
                  </div>
                  {entry.note && <p className="mt-0.5 text-[#8C7B6B]">{entry.note}</p>}
                  <p className="mt-0.5 text-[10px] text-[#C3B5A5]">עודכן ע״י {entry.author}</p>
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
