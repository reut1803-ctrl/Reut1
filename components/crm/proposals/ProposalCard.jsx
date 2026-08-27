"use client";

import { useState } from "react";
import {
  AlertTriangle,
  BellRing,
  ChevronDown,
  Clock,
  Copy,
  Check,
  Download,
  Sparkles,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { useCrmStore, PROPOSAL_STAGES, PROPOSAL_DROPPED } from "@/lib/crm/store";
import { buildProfileShareText } from "@/lib/crm/shareText";
import { whatsappNumber } from "@/lib/crm/brainstorm";
import { daysSinceStatusChange, isProposalStuck, wasNudged } from "@/lib/crm/attention";
import { WhatsappIcon, PhoneCallIcon, SmsIcon } from "@/components/crm/ui/BrandIcons";
import { findStaffEntry } from "@/lib/crm/staff";
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

// סרגל תקשורת מהיר: חיוג, וואטסאפ ו-SMS ישירות מהכרטיס, בלי להעתיק מספר
// ובלי לצאת מהמערכת. כל הקישורים נפתחים באפליקציה החיצונית של המכשיר,
// ולכן המסך שמאחור אינו נטען מחדש ומיקום הגלילה נשמר.
//
// העיצוב: הסמל למעלה והכיתוב מתחתיו. כך אין שאלה של סדר מימין לשמאל -
// גם "SMS" באותיות לועזיות יושב במקומו הנכון - וכל כפתור נקרא במבט אחד.
function QuickContactBar({ phone, name }) {
  const clean = String(phone || "").replace(/[^\d+]/g, "");
  if (!clean) {
    return <p className="mt-1 text-[11px] text-[#B5AEB0]">לא הוזן מספר טלפון</p>;
  }
  const wa = whatsappNumber(phone);
  // רקעים פסטליים רכים, בלי מסגרות קשיחות, כדי שהכפתורים ישבו בהרמוניה
  // בתוך פלטת הבורדו-ניוד של המערכת. הצורה של כל סמל נשארת המוכרת -
  // רק הגוון מרוכך, כך שהוא לא "זורח" מול שאר המסך.
  const item =
    "flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2.5 transition active:scale-95";

  return (
    <div className="mt-1.5">
      <p dir="ltr" className="mb-1.5 text-right text-[11px] tracking-wide text-[#B5AEB0]">{clean}</p>
      {/* הסדר מימין לשמאל: חיוג, וואטסאפ, SMS.
          הסמל יושב מעל הכיתוב, ולכן אין שאלה של כיווניות בתוך הכפתור -
          גם "SMS" באותיות לועזיות נשאר במקומו. */}
      <div className="flex gap-1.5">
        <a
          href={`tel:${clean}`}
          aria-label={`חיוג ל${name}`}
          className={`${item} bg-[#E9EEF4]`}
        >
          <PhoneCallIcon size={22} color="#6E8CAE" />
          <span className="text-[10px] font-bold text-[#4C617A]">חיוג</span>
        </a>
        {wa && (
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`וואטסאפ ל${name}`}
            className={`${item} bg-[#E5F0E8]`}
          >
            <WhatsappIcon size={22} color="#5EA37C" />
            <span className="text-[10px] font-bold text-[#3F7757]">וואטסאפ</span>
          </a>
        )}
        <a
          href={`sms:${clean}`}
          aria-label={`הודעת SMS ל${name}`}
          className={`${item} bg-[#F5EEE1]`}
        >
          <SmsIcon size={22} color="#C6A461" />
          <span dir="ltr" className="text-[10px] font-bold text-[#8A6E36]">SMS</span>
        </a>
      </div>
    </div>
  );
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
    <div className="rounded-2xl bg-[#F6F5F4] p-3">
      <p className="text-[13px] font-bold text-[#3A3335]">{candidate.name}</p>
      <QuickContactBar phone={candidate.phone} name={candidate.name} />
      <button
        onClick={handleCopy}
        className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl border border-[#EAE5E3] bg-white py-1.5 text-[11px] font-semibold text-[#8C4A55] transition active:scale-95 hover:bg-[#F6F5F4]"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? "הועתק!" : "העתקת כרטיס"}
      </button>

      {photo && (
        <button
          type="button"
          onClick={handleDownloadPhoto}
          disabled={downloading}
          className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-xl border border-[#EAE5E3] bg-white py-1.5 text-[11px] font-semibold text-[#8C4A55] transition active:scale-95 hover:bg-[#F6F5F4] disabled:opacity-60"
        >
          <Download size={13} /> {downloading ? "מוריד..." : "הורדת תמונה"}
        </button>
      )}

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

// כרטיס מועמד/ת שנמחק מהמאגר. ההצעה עצמה נשמרת ומוצגת, כדי שהרציונל והיומן לא ילכו לאיבוד.
function MissingContactCard({ name }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#EAE5E3] bg-[#F6F5F4] p-3">
      <p className="text-[13px] font-bold text-[#3A3335]">{name}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-[#8A8285]">
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
  const nudgeProposal = useCrmStore((s) => s.nudgeProposal);
  const authAllowlist = useCrmStore((s) => s.authAllowlist);
  const setAllowlistPhone = useCrmStore((s) => s.setAllowlistPhone);
  const serverOffsetMs = useCrmStore((s) => s.serverOffsetMs);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [rationaleDraft, setRationaleDraft] = useState(proposal.rationale || "");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // חותמת הנדנוד נכתבת בשרת ולכן חוזרת אלינו רגע אחרי הלחיצה. עד שהיא מגיעה,
  // הסימון המקומי הזה כבר מעמעם את הכפתור - כדי שלא תישלח לחיצה כפולה.
  const [nudgedNow, setNudgedNow] = useState(false);
  // מילוי מספר טלפון חסר לאיש/אשת הצוות, ישירות מכאן
  const [phoneDraft, setPhoneDraft] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

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

  // --- חיווי "תקוע" ונדנוד ---
  // הצעה שלא זזה שבוע ומעלה. הצעה שירדה מהפרק אינה "תקועה" - היא נגמרה.
  const now = Date.now() + serverOffsetMs;
  const stuckDays = daysSinceStatusChange(proposal, now);
  const stuck = proposal.status !== PROPOSAL_DROPPED && isProposalStuck(proposal, now);
  const alreadyNudged = nudgedNow || wasNudged(proposal);

  // מציאת רשומת איש/אשת הצוות שמטפל/ת בהצעה, ברשימת ההרשאות.
  // השם שנשמר בשיוך הוא שם החשבון בגוגל, והוא לא תמיד זהה לשם שברשימה
  // ("דבורה" מול "דבורה כהן"), ולכן מנסים כמה דרכים לפי סדר הדיוק:
  // המייל, שם מלא זהה, שם ללא רגישות לאותיות, ולבסוף שם פרטי.
  const assigneeEntry = findStaffEntry(authAllowlist, proposal.assigneeEmail, proposal.assignee);
  const assigneeWhatsapp = whatsappNumber(assigneeEntry?.phone);

  const handleSavePhone = async () => {
    const value = phoneDraft.trim();
    if (!value || !assigneeEntry || savingPhone) return;
    setSavingPhone(true);
    try {
      await setAllowlistPhone(assigneeEntry.email || assigneeEntry.id, value);
      setPhoneDraft("");
      showToast(`המספר נשמר בכרטיס הצוות של ${assigneeEntry.name || proposal.assignee}`);
    } catch {
      showToast("שמירת המספר נכשלה");
    } finally {
      setSavingPhone(false);
    }
  };
  const nudgeText = encodeURIComponent(
    `היי! שמתי לב שההצעה מתעכבת. מה קורה עם זה?\n(ההצעה: ${maleName} ⚭ ${femaleName})`
  );
  // הנדנוד מוצג למנהלת בלבד, רק על הצעה תקועה, ורק כשיש למי לשלוח אותו
  const canNudge = role === "admin" && stuck && !!proposal.assignee;

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

      {/* חיווי תקיעות: הצעה שלא שינתה שלב שבוע ומעלה */}
      {stuck && (
        <div className="mt-2 flex items-center gap-1.5 rounded-xl border border-[#F0C9A0] bg-[#FFF3E4] px-2.5 py-1.5">
          <AlertTriangle size={13} className="shrink-0 text-[#B45309]" />
          <p className="text-[11px] font-bold text-[#B45309]">תקוע {stuckDays} ימים ללא שינוי סטטוס</p>
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {proposal.assignee ? (
            <span className="flex items-center gap-1.5 rounded-full bg-[#F6E4E6] px-2.5 py-1 text-[11px] font-bold text-[#6E3540]">
              <UserCheck size={12} /> מטופל/ת ע״י {proposal.assignee}
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-[#B5AEB0]">טרם שויך לאיש צוות</span>
          )}

          {/* כפתור הנדנוד יושב כאן בלבד - בשורת הכותרת, ליד תגית השיוך */}
          {canNudge &&
            (alreadyNudged ? (
              <span className="flex items-center gap-1 rounded-full bg-[#EFEDEB] px-2.5 py-1 text-[11px] font-semibold text-[#B5AEB0]">
                <Check size={12} /> נדנוד נשלח
              </span>
            ) : assigneeWhatsapp ? (
              <a
                href={`https://wa.me/${assigneeWhatsapp}?text=${nudgeText}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setNudgedNow(true);
                  nudgeProposal(proposal.id);
                }}
                className="flex items-center gap-1 rounded-full bg-[#20A66B] px-2.5 py-1 text-[11px] font-bold text-white transition active:scale-95"
              >
                <BellRing size={12} /> נדנוד ל{proposal.assignee}
              </a>
            ) : assigneeEntry ? (
              // הרשומה נמצאה אבל אין בה מספר. במקום להיתקע - ממלאים אותו כאן
              // פעם אחת, הוא נשמר בכרטיס הצוות, וכפתור הנדנוד מופיע מיד.
              <span className="flex items-center gap-1 rounded-full bg-[#FFF3E4] py-0.5 pr-2.5 pl-0.5 text-[11px] font-semibold text-[#B45309]">
                <BellRing size={12} className="shrink-0" />
                <input
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSavePhone()}
                  placeholder={`טלפון של ${assigneeEntry.name || proposal.assignee}`}
                  inputMode="tel"
                  className="w-32 bg-transparent text-[11px] outline-none placeholder:text-[#C79A55]"
                />
                <button
                  onClick={handleSavePhone}
                  disabled={!phoneDraft.trim() || savingPhone}
                  className="rounded-full bg-[#B45309] px-2.5 py-1 text-[10px] font-bold text-white transition active:scale-95 disabled:opacity-40"
                >
                  {savingPhone ? "שומר..." : "שמירה"}
                </button>
              </span>
            ) : (
              <span
                title="לא נמצאה רשומה תואמת ברשימת ההרשאות. אפשר לתקן את השם בלוח הבקרה."
                className="flex items-center gap-1 rounded-full bg-[#EFEDEB] px-2.5 py-1 text-[11px] font-semibold text-[#B5AEB0]"
              >
                <BellRing size={12} /> לא זוהה איש הצוות
              </span>
            ))}
        </div>

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
