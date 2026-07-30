"use client";

import MediaImage from "@/components/crm/ui/MediaImage";
import { useRef, useState } from "react";
import Link from "next/link";
import {
  Heart,
  Mic,
  PenLine,
  UserCheck,
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
import { saveMedia } from "@/lib/crm/mediaStore";
import { useMediaUrl } from "@/lib/crm/useMediaUrl";

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
  const contactStaff = useCrmStore((s) => s.contactStaffFor(candidate));
  const setContactStaff = useCrmStore((s) => s.setContactStaff);
  const staffList = useCrmStore((s) => s.staffList());
  const canEdit = useCrmStore((s) => s.canEditCandidate(candidate));
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
  const [adminNoteDraft, setAdminNoteDraft] = useState(candidate.adminNote || "");
  const [showDetail, setShowDetail] = useState(false);
  const [referenceCopied, setReferenceCopied] = useState(false);
  const [pendingDeleteVoiceNoteId, setPendingDeleteVoiceNoteId] = useState(null);
  const [pendingDeleteField, setPendingDeleteField] = useState(null);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [recordStatus, setRecordStatus] = useState("");

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
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setUploadingRecording(true);
        try {
          const audioUrl = await saveMedia(blob, setRecordStatus);
          const newNote = {
            id: `${Date.now()}`,
            author: currentUser().name,
            authorEmail: currentUser().email,
            date: new Date().toLocaleDateString("he-IL"),
            audioUrl,
          };
          await updateCandidate(candidate.id, { voiceNotes: [...(candidate.voiceNotes || []), newNote] });
          showToast("ההקלטה נשמרה בהצלחה");
        } catch (err) {
          setRecordError(`שמירת ההקלטה נכשלה: ${err?.message || String(err)}`);
        } finally {
          setUploadingRecording(false);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      recordTimeoutRef.current = setTimeout(stopRecording, MAX_RECORD_MS);
    } catch (e) {
      setRecordError("אין גישה למיקרופון - יש לאשר הרשאה בדפדפן ולנסות שוב");
    }
  };

  const handleFileUpload = (field) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingField(field);
    try {
      const ref = await saveMedia(file, setUploadStatus);
      await updateCandidate(candidate.id, { [field]: ref });
      showToast("הקובץ נשמר בהצלחה");
    } catch (err) {
      showToast(`העלאת הקובץ נכשלה: ${err?.message || String(err)}`);
    } finally {
      setUploadingField(null);
    }
  };

  // הוספת הקלטה קיימת מהמכשיר לרשימת הקלטות השמע - כדי שאפשר יהיה לצבור כמה הקלטות
  // ממקורות שונים (למשל הקלטות קוליות שהתקבלו בוואטסאפ), ולא רק להקליט חי.
  const handleAddVoiceNoteFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setRecordError("");
    setUploadingRecording(true);
    try {
      const audioUrl = await saveMedia(file, setRecordStatus);
      const newNote = {
        id: `${Date.now()}`,
        author: currentUser().name,
        authorEmail: currentUser().email,
        date: new Date().toLocaleDateString("he-IL"),
        audioUrl,
      };
      await updateCandidate(candidate.id, { voiceNotes: [...(candidate.voiceNotes || []), newNote] });
      showToast("ההקלטה נוספה בהצלחה");
    } catch (err) {
      setRecordError(`הוספת ההקלטה נכשלה: ${err?.message || String(err)}`);
    } finally {
      setUploadingRecording(false);
    }
  };

  const handleRemoveFile = async (field) => {
    await updateCandidate(candidate.id, { [field]: null });
    showToast("הקובץ נמחק");
    setPendingDeleteField(null);
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
    <div className="overflow-hidden rounded-3xl border border-[#CCBDAB] bg-white shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
      <div className={`relative aspect-[4/5] w-full bg-gradient-to-br ${getGradientClass(candidate.gradient)}`}>
        {candidate.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <MediaImage src={candidate.photoUrl} alt={candidate.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-bold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]">
              {candidate.initials}
            </span>
          </div>
        )}

        <div className="absolute right-3 top-3 flex flex-col items-start gap-1.5">
          {candidate.isNew && (
            <span className="rounded-full bg-[#844442] px-2.5 py-1 text-[11px] font-bold text-white shadow">חדש</span>
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
          data-tour="tour-favorite-heart"
          onClick={() => toggleFavorite(candidate.id)}
          aria-label="הוספה למועדפים"
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition active:scale-90"
        >
          <Heart size={18} className={isFavorite ? "fill-[#844442] text-[#844442]" : "text-[#7C6E60]"} />
        </button>

        <div data-tour="tour-card-info" className="absolute bottom-3 right-3 flex flex-wrap gap-1.5">
          <span className="tag-chip-crm">{candidate.age}</span>
          <span className="tag-chip-crm">{candidate.height} ס״מ</span>
          {candidate.eda && <span className="tag-chip-crm">{candidate.eda}</span>}
          {candidate.city && <span className="tag-chip-crm">{candidate.city}</span>}
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-bold text-[#3A2E26]">{candidate.name}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#7C6E60]">{candidate.bio}</p>

        <div className="mt-4 flex flex-col gap-2">
          <Button
            data-tour="tour-read-more"
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
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#62826B] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(32,166,107,0.25)] transition active:scale-95 hover:bg-[#4A6552]"
            >
              <HeartHandshake size={16} /> הצע/י התאמה עבור {firstName}
            </Link>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-[#62826B] bg-white px-3 py-3 text-sm font-semibold text-[#4A6552] transition active:scale-95 hover:bg-[#62826B]/5"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "הועתק!" : "העתקת טקסט"}
            </button>
            <button
              onClick={handleDownload}
              disabled={generatingPdf}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-[#62826B] bg-white px-3 py-3 text-sm font-semibold text-[#4A6552] transition active:scale-95 hover:bg-[#62826B]/5 disabled:opacity-60"
            >
              <Download size={16} /> {generatingPdf ? "מכינה PDF..." : "הורדת PDF"}
            </button>
          </div>
        </div>

        {proposals.length > 0 && (
          <div className="mt-4 rounded-2xl bg-[#E8DCCB] p-3">
            <p className="mb-2 text-[12px] font-semibold text-[#3A2E26]">התקדמות בהתאמות ({proposals.length})</p>
            <div className="space-y-2.5">
              {proposals.map((p) => (
                <div key={p.id}>
                  <p className="mb-1 text-[11px] font-semibold text-[#844442]">{p.status}</p>
                  <StageFunnel status={p.status} compact />
                </div>
              ))}
            </div>
          </div>
        )}

        {contactStaff && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border-2 border-[#844442] bg-[#F0E2DE] px-3 py-2">
            <UserCheck size={15} className="mt-0.5 shrink-0 text-[#844442]" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#844442]">איש קשר בצוות לבירורים</p>
              <p className="text-[13px] font-bold text-[#3A2E26]">{contactStaff.name}</p>
              {contactStaff.phone && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <a
                    href={`tel:${contactStaff.phone}`}
                    className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-[#844442]"
                  >
                    חיוג
                  </a>
                  <a
                    href={`https://wa.me/${String(contactStaff.phone).replace(/[^0-9]/g, "").replace(/^0/, "972")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-[#62826B] px-2 py-1 text-[11px] font-semibold text-white"
                  >
                    וואטסאפ
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {canSeeFullProfile && (
          <div className="mt-4 border-t border-[#CCBDAB] pt-3">
            <button
              data-tour="tour-staff-toggle"
              onClick={() => toggleStaffArea(candidate.id)}
              className="flex w-full items-center justify-between text-[13px] font-semibold text-[#844442]"
            >
              <span>אזור פנימי לצוות</span>
              <ChevronDown size={16} className={`transition ${isExpanded ? "rotate-180" : ""}`} />
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-3">
                {role === "admin" && (
                  <div>
                    <p className="mb-1 text-[11px] font-bold text-[#844442]">נציג/ה מלווה - איש קשר לבירורים</p>
                    <select
                      value={candidate.contactStaffEmail || ""}
                      onChange={(e) => {
                        setContactStaff(candidate.id, e.target.value || null);
                        showToast(e.target.value ? "הנציג/ה שויכ/ה לכרטיס" : "השיוך הוסר");
                      }}
                      className="w-full rounded-xl border border-[#CCBDAB] bg-white px-3 py-2 text-sm outline-none focus:border-[#844442]"
                    >
                      <option value="">ללא נציג/ה מלווה</option>
                      {staffList.map((st) => (
                        <option key={st.email} value={st.email}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {canEdit && (
                  <Link
                    href={`/crm/edit-candidate?id=${candidate.id}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-[#844442] bg-white px-4 py-2.5 text-sm font-semibold text-[#844442] transition active:scale-95 hover:bg-[#F0E2DE]"
                  >
                    <PenLine size={15} /> עריכת פרטי הכרטיס
                  </Link>
                )}

                {candidate.referenceContacts && (
                  <div data-tour="tour-reference-contacts" className="rounded-2xl border-2 border-[#844442] bg-[#F0E2DE] p-3">
                    <p className="mb-1.5 text-[12px] font-bold text-[#844442]">מספרים לבירורים</p>
                    <p className="mb-2 whitespace-pre-wrap text-[13px] text-[#3A2E26]">{candidate.referenceContacts}</p>
                    <button
                      onClick={handleCopyReferenceContacts}
                      className="flex w-full items-center justify-center gap-1 rounded-xl bg-[#844442] py-1.5 text-[12px] font-semibold text-white transition active:scale-95"
                    >
                      {referenceCopied ? <Check size={13} /> : <Copy size={13} />}
                      {referenceCopied ? "הועתק!" : "העתקה"}
                    </button>
                  </div>
                )}

                <div data-tour="tour-voice-notes" className="rounded-2xl bg-[#E8DCCB] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#3A2E26]">
                      <Mic size={14} /> הקלטות שמע
                    </p>
                    <div className="flex items-center gap-1.5">
                      {!recording && (
                        <label className="cursor-pointer rounded-full border border-[#844442] bg-white px-2.5 py-1 text-[11px] font-bold text-[#844442]">
                          {uploadingRecording ? recordStatus || "שומרת..." : "הוספת קובץ"}
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={handleAddVoiceNoteFile}
                            disabled={uploadingRecording}
                            className="hidden"
                          />
                        </label>
                      )}
                      <button
                        onClick={recording ? stopRecording : startRecording}
                        disabled={uploadingRecording}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-60 ${
                          recording ? "bg-red-500 text-white" : "bg-[#844442] text-white"
                        }`}
                      >
                        {uploadingRecording && !recording
                          ? recordStatus || "שומרת..."
                          : recording
                          ? "עצירת הקלטה"
                          : candidate.voiceNotes?.length > 0
                          ? "הקלטה נוספת"
                          : "הקלטה חדשה"}
                      </button>
                    </div>
                  </div>
                  {recording && <p className="mb-2 animate-pulse text-[11px] text-red-500">מקליטה כעת... (נעצרת אוטומטית אחרי 10 דקות)</p>}
                  {recordError && <p className="mb-2 text-[11px] text-red-500">{recordError}</p>}
                  {!candidate.voiceNotes || candidate.voiceNotes.length === 0 ? (
                    <p className="text-[12px] text-[#A2937F]">אין הקלטות עדיין</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {candidate.voiceNotes.map((vn) => {
                        const canDelete = role === "admin" || vn.authorEmail === currentUser().email;
                        return (
                          <li key={vn.id} className="rounded-xl bg-white px-2.5 py-2 text-[12px] shadow-sm">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="font-medium text-[#3A2E26]">{vn.author}</span>
                              <span className="mr-auto text-[#A2937F]">{vn.date}</span>
                              {canDelete && (
                                <button
                                  onClick={() => setPendingDeleteVoiceNoteId(vn.id)}
                                  aria-label="מחיקת הקלטה"
                                  className="rounded-full p-1 hover:bg-[#E8DCCB]"
                                >
                                  <Trash2 size={13} className="text-[#C24545]" />
                                </button>
                              )}
                            </div>
                            <MediaAudio value={vn.audioUrl} className="h-8 w-full" />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="rounded-2xl bg-[#E8DCCB] p-3">
                  <p className="mb-1.5 text-[12px] font-semibold text-[#3A2E26]">סטטוס פניות</p>
                  <select
                    value={candidate.availabilityStatus}
                    onChange={(e) => {
                      setCandidateAvailability(candidate.id, e.target.value);
                      showToast("הסטטוס נשמר בהצלחה");
                    }}
                    className="w-full rounded-xl border border-[#CCBDAB] bg-white px-2.5 py-2 text-[13px] text-[#3A2E26]"
                  >
                    {AVAILABILITY_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl bg-[#E8DCCB] p-3">
                  <p className="mb-1.5 text-[12px] font-semibold text-[#3A2E26]">מורכבויות וייחודיות</p>
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
                    className="w-full resize-none rounded-xl border border-[#CCBDAB] bg-white px-2.5 py-2 text-[13px] text-[#3A2E26] outline-none focus:border-[#844442]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-[#E8DCCB] p-3">
                    <p className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#3A2E26]">
                      <FileText size={13} /> כרטיס יבש (PDF)
                    </p>
                    {candidate.pdfUrl ? (
                      <>
                        <MediaFileLink value={candidate.pdfUrl} />
                        {role === "admin" && (
                          <div className="flex gap-1.5">
                            <label className="flex h-8 flex-1 cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#CCBDAB] bg-white text-[11px] font-semibold text-[#844442]">
                              {uploadingField === "pdfUrl" ? uploadStatus || "מעלה..." : "החלפה"}
                              <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileUpload("pdfUrl")}
                                disabled={uploadingField === "pdfUrl"}
                                className="hidden"
                              />
                            </label>
                            <button
                              onClick={() => setPendingDeleteField("pdfUrl")}
                              aria-label="מחיקת קובץ"
                              className="flex h-8 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-2.5 text-[#C24545]"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="mb-1.5 text-[11px] text-[#A2937F]">לא הועלה קובץ</p>
                        <label className="block cursor-pointer rounded-xl border border-dashed border-[#CCBDAB] bg-white py-1.5 text-center text-[11px] font-semibold text-[#844442]">
                          {uploadingField === "pdfUrl" ? uploadStatus || "מעלה..." : "העלאת PDF"}
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleFileUpload("pdfUrl")}
                            disabled={uploadingField === "pdfUrl"}
                            className="hidden"
                          />
                        </label>
                      </>
                    )}
                  </div>

                  <div className="rounded-2xl bg-[#E8DCCB] p-3">
                    <p className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#3A2E26]">
                      <Music size={13} /> הקלטת היכרות
                    </p>
                    {candidate.introAudioUrl ? (
                      <>
                        <MediaAudio value={candidate.introAudioUrl} onPlay={trackAudioPlay} className="mb-1.5 h-8 w-full" />
                        {role === "admin" && (
                          <div className="flex gap-1.5">
                          <label className="flex h-8 flex-1 cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#CCBDAB] bg-white text-[11px] font-semibold text-[#844442]">
                            {uploadingField === "introAudioUrl" ? uploadStatus || "מעלה..." : "החלפה"}
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={handleFileUpload("introAudioUrl")}
                              disabled={uploadingField === "introAudioUrl"}
                              className="hidden"
                            />
                          </label>
                            <button
                              onClick={() => setPendingDeleteField("introAudioUrl")}
                              aria-label="מחיקת הקלטה"
                              className="flex h-8 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-2.5 text-[#C24545]"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="mb-1.5 text-[11px] text-[#A2937F]">לא הועלתה הקלטה</p>
                        <label className="block cursor-pointer rounded-xl border border-dashed border-[#CCBDAB] bg-white py-1.5 text-center text-[11px] font-semibold text-[#844442]">
                          {uploadingField === "introAudioUrl" ? uploadStatus || "מעלה..." : "העלאת אודיו"}
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={handleFileUpload("introAudioUrl")}
                            disabled={uploadingField === "introAudioUrl"}
                            className="hidden"
                          />
                        </label>
                      </>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl bg-[#E8DCCB] p-3">
                  <p className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#3A2E26]">
                    <Link2 size={13} /> קישור אישי לעדכון סטטוס
                  </p>
                  <p dir="ltr" className="truncate text-[11px] text-[#7C6E60]">
                    {personalLink}
                  </p>
                  <button
                    onClick={handleCopyLink}
                    className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-xl border border-[#CCBDAB] bg-white py-1.5 text-[11px] font-semibold text-[#844442] transition active:scale-95"
                  >
                    {linkCopied ? <Check size={13} /> : <Copy size={13} />}
                    {linkCopied ? "הועתק!" : "העתקת קישור"}
                  </button>
                </div>

                {canEdit && (
                  <>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[11px] font-bold not-italic text-amber-800">
                          <PenLine size={12} /> הערה פנימית {role === "admin" ? "(מנהלת)" : "(נציג/ה מלווה)"}
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
          color: #3A2E26;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
        }
        .handwritten-note-crm {
          transform: rotate(-1deg);
          border-radius: 12px;
          border: 1px solid #E0C478;
          background: #F5E7E2;
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
      {pendingDeleteField && (
        <ConfirmDialog
          message={
            pendingDeleteField === "introAudioUrl"
              ? "האם את בטוחה שברצונך למחוק את הקלטת ההיכרות?"
              : "האם את בטוחה שברצונך למחוק את קובץ ה-PDF?"
          }
          onConfirm={() => handleRemoveFile(pendingDeleteField)}
          onCancel={() => setPendingDeleteField(null)}
        />
      )}
      <CandidateExportTemplate candidate={candidate} forwardedRef={exportRef} />
    </div>
  );
}

// נגן/קישור שמתמודד גם עם מדיה שנשמרה בחלקים ב-Firestore וגם עם כתובת רגילה
function MediaAudio({ value, onPlay, className }) {
  const { url, error, loading } = useMediaUrl(value);
  if (loading) return <p className="text-[11px] text-[#7C6E60]">טוען הקלטה...</p>;
  if (error) return <p className="text-[11px] text-red-500">{error}</p>;
  return <audio controls src={url} onPlay={onPlay} className={className} />;
}

function MediaFileLink({ value }) {
  const { url, error, loading } = useMediaUrl(value);
  if (loading) return <p className="text-[11px] text-[#7C6E60]">טוען קובץ...</p>;
  if (error) return <p className="text-[11px] text-red-500">{error}</p>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-1.5 block truncate rounded-xl bg-white px-2.5 py-2 text-[12px] font-semibold text-[#844442] shadow-sm"
    >
      צפייה בקובץ
    </a>
  );
}
