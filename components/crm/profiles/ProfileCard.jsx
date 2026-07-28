"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Heart,
  Mic,
  PenLine,
  ChevronDown,
  Copy,
  Download,
  HeartHandshake,
  Check,
  FileText,
  Music,
  Link2,
  Trash2,
} from "lucide-react";
import { useCrmStore, AVAILABILITY_STATUSES } from "@/lib/crm/store";
import Button from "@/components/crm/ui/Button";
import { getGradientClass } from "@/components/crm/ui/gradients";
import { viewerActionText } from "@/lib/crm/genderText";
import { buildProfileShareText } from "@/lib/crm/shareText";
import { getAvailabilityColors } from "@/lib/crm/availability";
import StageFunnel from "@/components/crm/proposals/StageFunnel";
import ProfileDetailModal from "@/components/crm/profiles/ProfileDetailModal";
import CandidateExportTemplate from "@/components/crm/profiles/CandidateExportTemplate";
import { generateCandidatePdf } from "@/lib/crm/generatePdf";
import { CANDIDATE_TAGS } from "@/lib/crm/mockData";
import ConfirmDialog from "@/components/crm/ui/ConfirmDialog";

const MAX_FILE_SIZE = 400 * 1024; // בייטים - PDF/הקלטה בכרטיס קיים

export default function ProfileCard({ candidate, onReadMore }) {
  const role = useCrmStore((s) => s.role);
  const board = useCrmStore((s) => s.board);
  const isFavorite = useCrmStore((s) => s.isFavorite(candidate.id));
  const toggleFavorite = useCrmStore((s) => s.toggleFavorite);
  const expandedId = useCrmStore((s) => s.expandedStaffAreaId);
  const toggleStaffArea = useCrmStore((s) => s.toggleStaffArea);
  const proposals = useCrmStore((s) => s.proposalsForCandidate(candidate.id));
  const updateCandidate = useCrmStore((s) => s.updateCandidate);
  const setCandidateAvailability = useCrmStore((s) => s.setCandidateAvailability);
  const showToast = useCrmStore((s) => s.showToast);
  const trackProfileView = useCrmStore((s) => s.trackProfileView);
  const trackAudioPlay = useCrmStore((s) => s.trackAudioPlay);
  const currentUser = useCrmStore((s) => s.currentUser);
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState("");
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordTimeoutRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const exportRef = useRef(null);
  const [complexityDraft, setComplexityDraft] = useState(candidate.complexityNotes || "");
  const [edaDraft, setEdaDraft] = useState(candidate.eda || "");
  const [adminNoteDraft, setAdminNoteDraft] = useState(candidate.adminNote || "");
  const [showDetail, setShowDetail] = useState(false);
  const [referenceCopied, setReferenceCopied] = useState(false);
  const [pendingDeleteVoiceNoteId, setPendingDeleteVoiceNoteId] = useState(null);

  const availability = getAvailabilityColors(candidate.availabilityStatus);
  const candidateTag = CANDIDATE_TAGS.find((t) => t.name === candidate.tag);
  const personalLink = typeof window !== "undefined" ? `${window.location.origin}/status?id=${candidate.id}` : "";

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(personalLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const MAX_RECORD_MS = 10 * 60 * 1000;

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    clearTimeout(recordTimeoutRef.current);
    setRecording(false);
  };

  const startRecording = async () => {
    setRecordError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (blob.size > MAX_FILE_SIZE) {
          setRecordError(`ההקלטה גדולה מדי (מקסימום ${Math.round(MAX_FILE_SIZE / 1024)}KB) - נסי הקלטה קצרה יותר`);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const newNote = {
            id: `${Date.now()}`,
            author: currentUser().name,
            authorEmail: currentUser().email,
            date: new Date().toLocaleDateString("he-IL"),
            audioUrl: reader.result,
          };
          updateCandidate(candidate.id, { voiceNotes: [...(candidate.voiceNotes || []), newNote] });
          showToast("ההקלטה נשמרה בהצלחה");
        };
        reader.readAsDataURL(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      recordTimeoutRef.current = setTimeout(stopRecording, MAX_RECORD_MS);
    } catch (e) {
      setRecordError("אין גישה למיקרופון - יש לאשר הרשאה בדפדפן ולנסות שוב");
    }
  };

  const handleFileUpload = (field) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    if (file.size > MAX_FILE_SIZE) {
      showToast(`הקובץ גדול מדי (מקסימום ${Math.round(MAX_FILE_SIZE / 1024)}KB)`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateCandidate(candidate.id, { [field]: reader.result });
      showToast("הקובץ נשמר בהצלחה");
    };
    reader.readAsDataURL(file);
  };

  const canSeeFullProfile = role === "staff" || role === "admin";
  const isExpanded = expandedId === candidate.id;
  const firstName = candidate.name.split(" ")[0];

  const shareText = buildProfileShareText(candidate, { includePhone: canSeeFullProfile });

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyReferenceContacts = async () => {
    await navigator.clipboard.writeText(candidate.referenceContacts || "");
    setReferenceCopied(true);
    setTimeout(() => setReferenceCopied(false), 2000);
  };

  const handleDeleteVoiceNote = (voiceNoteId) => {
    updateCandidate(candidate.id, {
      voiceNotes: candidate.voiceNotes.filter((n) => n.id !== voiceNoteId),
    });
    showToast("ההקלטה נמחקה");
    setPendingDeleteVoiceNoteId(null);
  };

  const handleDownload = async () => {
    if (generatingPdf) return;
    setGeneratingPdf(true);
    try {
      await generateCandidatePdf(exportRef.current, `${candidate.name}.pdf`);
    } catch {
      showToast("יצירת ה-PDF נכשלה, נסי שוב");
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-[#EAE5E3] bg-white shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
      <div className={`relative aspect-[4/5] w-full bg-gradient-to-br ${getGradientClass(candidate.gradient)}`}>
        {candidate.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={candidate.photoUrl} alt={candidate.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
              {candidate.initials}
            </span>
          </div>
        )}

        <div className="absolute right-3 top-3 flex flex-col items-start gap-1.5">
          {candidate.isNew && (
            <span className="rounded-full bg-[#8C4A55] px-2.5 py-1 text-[11px] font-bold text-white shadow">חדש</span>
          )}
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold shadow ${availability.bg} ${availability.text}`}>
            {candidate.availabilityStatus}
          </span>
          {candidateTag && (
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-bold shadow"
              style={{ backgroundColor: candidateTag.color, color: candidateTag.textColor }}
            >
              {candidateTag.name}
            </span>
          )}
        </div>

        <button
          onClick={() => toggleFavorite(candidate.id)}
          aria-label="הוספה למועדפים"
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition active:scale-90"
        >
          <Heart size={18} className={isFavorite ? "fill-[#8C4A55] text-[#8C4A55]" : "text-[#8A8285]"} />
        </button>

        <div className="absolute bottom-3 right-3 flex flex-wrap gap-1.5">
          <span className="tag-chip-crm">{candidate.age}</span>
          <span className="tag-chip-crm">{candidate.height} ס״מ</span>
          {candidate.eda && <span className="tag-chip-crm">{candidate.eda}</span>}
          {candidate.city && <span className="tag-chip-crm">{candidate.city}</span>}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-[#3A3335]">{candidate.name}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#8A8285]">{candidate.bio}</p>

        <div className="mt-4 flex flex-col gap-2">
          <Button
            variant="pink"
            className="w-full"
            onClick={() => {
              trackProfileView();
              setShowDetail(true);
              onReadMore?.(candidate);
            }}
          >
            {viewerActionText(board, { male: "קרא", female: "קראי" })} עוד על {firstName}
          </Button>

          {canSeeFullProfile && (
            <Link
              href={`/crm/proposals?select=${candidate.id}`}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#20A66B] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(32,166,107,0.25)] transition active:scale-95 hover:bg-[#178A57]"
            >
              <HeartHandshake size={16} /> הצע/י התאמה עבור {firstName}
            </Link>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-[#20A66B] bg-white px-3 py-3 text-sm font-semibold text-[#178A57] transition active:scale-95 hover:bg-[#20A66B]/5"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "הועתק!" : "העתקת טקסט"}
            </button>
            <button
              onClick={handleDownload}
              disabled={generatingPdf}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-[#20A66B] bg-white px-3 py-3 text-sm font-semibold text-[#178A57] transition active:scale-95 hover:bg-[#20A66B]/5 disabled:opacity-60"
            >
              <Download size={16} /> {generatingPdf ? "מכינה PDF..." : "הורדת PDF"}
            </button>
          </div>
        </div>

        {proposals.length > 0 && (
          <div className="mt-4 rounded-2xl bg-[#F6F5F4] p-3">
            <p className="mb-2 text-[12px] font-semibold text-[#3A3335]">התקדמות בהתאמות ({proposals.length})</p>
            <div className="space-y-2.5">
              {proposals.map((p) => (
                <div key={p.id}>
                  <p className="mb-1 text-[11px] font-semibold text-[#8C4A55]">{p.status}</p>
                  <StageFunnel status={p.status} compact />
                </div>
              ))}
            </div>
          </div>
        )}

        {canSeeFullProfile && (
          <div className="mt-4 border-t border-[#EAE5E3] pt-3">
            <button
              onClick={() => toggleStaffArea(candidate.id)}
              className="flex w-full items-center justify-between text-[13px] font-semibold text-[#8C4A55]"
            >
              <span>אזור פנימי לצוות</span>
              <ChevronDown size={16} className={`transition ${isExpanded ? "rotate-180" : ""}`} />
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-3">
                {role === "admin" && (
                  <Link
                    href={`/crm/edit-candidate?id=${candidate.id}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-[#8C4A55] bg-white px-4 py-2.5 text-sm font-semibold text-[#8C4A55] transition active:scale-95 hover:bg-[#F6E4E6]"
                  >
                    <PenLine size={15} /> עריכת פרטי הכרטיס
                  </Link>
                )}

                {candidate.referenceContacts && (
                  <div className="rounded-2xl border-2 border-[#8C4A55] bg-[#F6E4E6] p-3">
                    <p className="mb-1.5 text-[12px] font-bold text-[#8C4A55]">מספרים לבירורים</p>
                    <p className="mb-2 whitespace-pre-wrap text-[13px] text-[#3A3335]">{candidate.referenceContacts}</p>
                    <button
                      onClick={handleCopyReferenceContacts}
                      className="flex w-full items-center justify-center gap-1 rounded-xl bg-[#8C4A55] py-1.5 text-[12px] font-semibold text-white transition active:scale-95"
                    >
                      {referenceCopied ? <Check size={13} /> : <Copy size={13} />}
                      {referenceCopied ? "הועתק!" : "העתקה"}
                    </button>
                  </div>
                )}

                <div className="rounded-2xl bg-[#F6F5F4] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#3A3335]">
                      <Mic size={14} /> הקלטות שמע
                    </p>
                    <button
                      onClick={recording ? stopRecording : startRecording}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition ${
                        recording ? "bg-red-500 text-white" : "bg-[#8C4A55] text-white"
                      }`}
                    >
                      {recording ? "עצירת הקלטה" : candidate.voiceNotes?.length > 0 ? "הקלטה נוספת" : "הקלטה חדשה"}
                    </button>
                  </div>
                  {recording && <p className="mb-2 animate-pulse text-[11px] text-red-500">מקליטה כעת... (נעצרת אוטומטית אחרי 10 דקות)</p>}
                  {recordError && <p className="mb-2 text-[11px] text-red-500">{recordError}</p>}
                  {!candidate.voiceNotes || candidate.voiceNotes.length === 0 ? (
                    <p className="text-[12px] text-[#B5AEB0]">אין הקלטות עדיין</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {candidate.voiceNotes.map((vn) => {
                        const canDelete = role === "admin" || vn.authorEmail === currentUser().email;
                        return (
                          <li key={vn.id} className="rounded-xl bg-white px-2.5 py-2 text-[12px] shadow-sm">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="font-medium text-[#3A3335]">{vn.author}</span>
                              <span className="mr-auto text-[#B5AEB0]">{vn.date}</span>
                              {canDelete && (
                                <button
                                  onClick={() => setPendingDeleteVoiceNoteId(vn.id)}
                                  aria-label="מחיקת הקלטה"
                                  className="rounded-full p-1 hover:bg-[#F6F5F4]"
                                >
                                  <Trash2 size={13} className="text-[#C24545]" />
                                </button>
                              )}
                            </div>
                            <audio controls src={vn.audioUrl} className="h-8 w-full" />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="rounded-2xl bg-[#F6F5F4] p-3">
                  <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">סטטוס פניות</p>
                  <select
                    value={candidate.availabilityStatus}
                    onChange={(e) => {
                      setCandidateAvailability(candidate.id, e.target.value);
                      showToast("הסטטוס נשמר בהצלחה");
                    }}
                    className="w-full rounded-xl border border-[#EAE5E3] bg-white px-2.5 py-2 text-[13px] text-[#3A3335]"
                  >
                    {AVAILABILITY_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl bg-[#F6F5F4] p-3">
                  <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">מורכבויות וייחודיות</p>
                  <textarea
                    value={complexityDraft}
                    onChange={(e) => setComplexityDraft(e.target.value)}
                    onBlur={() => {
                      if (complexityDraft !== (candidate.complexityNotes || "")) {
                        updateCandidate(candidate.id, { complexityNotes: complexityDraft });
                        showToast("ההערה נשמרה בהצלחה");
                      }
                    }}
                    rows={3}
                    placeholder="מה מיוחד או מורכב אצל המועמד/ת - לשימוש פנימי בלבד..."
                    className="w-full resize-none rounded-xl border border-[#EAE5E3] bg-white px-2.5 py-2 text-[13px] text-[#3A3335] outline-none focus:border-[#8C4A55]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-[#F6F5F4] p-3">
                    <p className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#3A3335]">
                      <FileText size={13} /> כרטיס יבש (PDF)
                    </p>
                    {candidate.pdfUrl ? (
                      <a
                        href={candidate.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate rounded-xl bg-white px-2.5 py-2 text-[12px] font-semibold text-[#8C4A55] shadow-sm"
                      >
                        צפייה בקובץ
                      </a>
                    ) : (
                      <p className="mb-1.5 text-[11px] text-[#B5AEB0]">לא הועלה קובץ</p>
                    )}
                    <label className="mt-1.5 block cursor-pointer rounded-xl border border-dashed border-[#EAE5E3] bg-white py-1.5 text-center text-[11px] font-semibold text-[#8C4A55]">
                      העלאת PDF
                      <input type="file" accept="application/pdf" onChange={handleFileUpload("pdfUrl")} className="hidden" />
                    </label>
                  </div>

                  <div className="rounded-2xl bg-[#F6F5F4] p-3">
                    <p className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#3A3335]">
                      <Music size={13} /> הקלטת היכרות
                    </p>
                    {candidate.introAudioUrl ? (
                      <audio controls src={candidate.introAudioUrl} onPlay={trackAudioPlay} className="mb-1.5 h-8 w-full" />
                    ) : (
                      <p className="mb-1.5 text-[11px] text-[#B5AEB0]">לא הועלתה הקלטה</p>
                    )}
                    <label className="block cursor-pointer rounded-xl border border-dashed border-[#EAE5E3] bg-white py-1.5 text-center text-[11px] font-semibold text-[#8C4A55]">
                      העלאת אודיו
                      <input type="file" accept="audio/*" onChange={handleFileUpload("introAudioUrl")} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#F6F5F4] p-3">
                  <p className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#3A3335]">
                    <Link2 size={13} /> קישור אישי לעדכון סטטוס
                  </p>
                  <p dir="ltr" className="truncate text-[11px] text-[#8A8285]">
                    {personalLink}
                  </p>
                  <button
                    onClick={handleCopyLink}
                    className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-xl border border-[#EAE5E3] bg-white py-1.5 text-[11px] font-semibold text-[#8C4A55] transition active:scale-95"
                  >
                    {linkCopied ? <Check size={13} /> : <Copy size={13} />}
                    {linkCopied ? "הועתק!" : "העתקת קישור"}
                  </button>
                </div>

                {role === "admin" && (
                  <>
                    <div className="rounded-2xl bg-[#F6F5F4] p-3">
                      <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">עדה</p>
                      <input
                        type="text"
                        value={edaDraft}
                        onChange={(e) => setEdaDraft(e.target.value)}
                        onBlur={() => {
                          if (edaDraft !== (candidate.eda || "")) {
                            updateCandidate(candidate.id, { eda: edaDraft });
                            showToast("העדה נשמרה בהצלחה");
                          }
                        }}
                        placeholder="תימני, אשכנזי..."
                        className="w-full rounded-xl border border-[#EAE5E3] bg-white px-2.5 py-2 text-[13px] text-[#3A3335] outline-none focus:border-[#8C4A55]"
                      />
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[11px] font-bold not-italic text-amber-800">
                          <PenLine size={12} /> הערת מנהלת
                        </span>
                      </div>
                      <textarea
                        value={adminNoteDraft}
                        onChange={(e) => setAdminNoteDraft(e.target.value)}
                        onBlur={() => {
                          if (adminNoteDraft !== (candidate.adminNote || "")) {
                            updateCandidate(candidate.id, { adminNote: adminNoteDraft });
                            showToast("ההערה נשמרה בהצלחה");
                          }
                        }}
                        rows={3}
                        placeholder="אין הערה עדיין - לחצי לעריכה"
                        className="handwritten-note-crm w-full resize-none border-0 outline-none"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .tag-chip-crm {
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.92);
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 700;
          color: #3a3335;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
        }
        .handwritten-note-crm {
          transform: rotate(-1deg);
          border-radius: 12px;
          border: 1px solid #fde68a;
          background: #fffbeb;
          padding: 10px 12px;
          font-size: 13px;
          font-style: italic;
          line-height: 1.4;
          color: #78350f;
        }
      `}</style>

      {showDetail && <ProfileDetailModal candidate={candidate} onClose={() => setShowDetail(false)} />}
      {pendingDeleteVoiceNoteId && (
        <ConfirmDialog
          message="האם את בטוחה שברצונך למחוק הקלטה זו?"
          onConfirm={() => handleDeleteVoiceNote(pendingDeleteVoiceNoteId)}
          onCancel={() => setPendingDeleteVoiceNoteId(null)}
        />
      )}
      <CandidateExportTemplate candidate={candidate} forwardedRef={exportRef} />
    </div>
  );
}
