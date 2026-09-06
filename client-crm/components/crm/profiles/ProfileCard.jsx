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
  Lightbulb,
  Plus,
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
import { CANDIDATE_TAGS, normalizeTagName } from "@/lib/crm/mockData";
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
  const brainstormSummary = useCrmStore((s) => s.brainstormSummaryFor(candidate.id));
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
  // הערה פנימית: נשמרת פרטית לכל אשת צוות, ואיש מלבדה אינו רואה אותה
  const personalNote = useCrmStore((s) => s.personalNoteFor(candidate.id));
  const setPersonalNote = useCrmStore((s) => s.setPersonalNote);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(personalNote);
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
  const candidateTag = CANDIDATE_TAGS.find((t) => t.name === normalizeTagName(candidate.tag));
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

  const handleSaveNote = async () => {
    await setPersonalNote(candidate.id, noteDraft);
    setNoteOpen(false);
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
      const result = await generateCandidatePdf(exportRef.current, `${candidate.name}.pdf`);
      // אם התמונה לא הצליחה להיטמע, עדיף לומר את זה מפורשות מאשר שתגלי קובץ בלי תמונה
      if (result && result.photosTotal > 0 && result.photosEmbedded < result.photosTotal) {
        showToast("הקובץ ירד, אך התמונה לא נטענה. בדקי חיבור אינטרנט ונסי שוב");
      }
    } catch {
      showToast("יצירת ה-PDF נכשלה, נסי שוב");
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-[#EADCCB] bg-white shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
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
            <span className="rounded-full bg-[#C06E5E] px-2.5 py-1 text-[11px] font-bold text-white shadow">חדש</span>
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
          <Heart size={18} className={isFavorite ? "fill-[#C06E5E] text-[#C06E5E]" : "text-[#8C7B6B]"} />
        </button>

        <div data-tour="tour-card-info" className="absolute bottom-3 right-3 flex flex-wrap gap-1.5">
          <span className="tag-chip-crm">{candidate.age}</span>
          <span className="tag-chip-crm">{candidate.height} ס״מ</span>
          {candidate.eda && <span className="tag-chip-crm">{candidate.eda}</span>}
          {candidate.city && <span className="tag-chip-crm">{candidate.city}</span>}
        </div>
      </div>

      <div className="p-4">
        {/* מצפן הצוות: סיכום המנהלת מסבב סיעור המוחות האחרון על המועמד/ת */}
        {brainstormSummary && (
          <div className="mb-3 rounded-2xl border border-[#EFC9A8] bg-[#FDF6EC] p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#8A6A32]">
              <Lightbulb size={12} /> מסקנת הצוות מסיעור המוחות
            </p>
            <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-[#5A4A3C]">
              {brainstormSummary.summary}
            </p>
          </div>
        )}

        <h3 className="text-lg font-bold text-[#5A4A3C]">{candidate.name}</h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#8C7B6B]">{candidate.bio}</p>

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
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#8C9A78] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(32,166,107,0.25)] transition active:scale-95 hover:bg-[#6F7D5C]"
            >
              <HeartHandshake size={16} /> הצע/י התאמה עבור {firstName}
            </Link>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-[#8C9A78] bg-white px-3 py-3 text-sm font-semibold text-[#6F7D5C] transition active:scale-95 hover:bg-[#8C9A78]/5"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "הועתק!" : "העתקת טקסט"}
            </button>
            <button
              onClick={handleDownload}
              disabled={generatingPdf}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-[#8C9A78] bg-white px-3 py-3 text-sm font-semibold text-[#6F7D5C] transition active:scale-95 hover:bg-[#8C9A78]/5 disabled:opacity-60"
            >
              <Download size={16} /> {generatingPdf ? "מכינה PDF..." : "הורדת PDF"}
            </button>
          </div>

          {/* הערה פנימית לשדכניות הצוות: תובנות, סיעור מוחות ודגשים חסויים.
              נשמרת במסמך הפרטי של אשת הצוות, ולכן גלויה אך ורק לה. */}
          {canSeeFullProfile &&
            (noteOpen ? (
              <div className="rounded-2xl border border-dashed border-[#C06E5E] bg-[#F7DFD8] p-3">
                <p className="mb-1.5 text-[12px] font-semibold text-[#A05243]">
                  הערה פנימית (רק את/ה רואה אותה)
                </p>
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={3}
                  autoFocus
                  placeholder="מה חשוב לך לזכור על המועמד/ת הזה/זו..."
                  className="w-full resize-none rounded-xl border border-[#EADCCB] bg-white px-2.5 py-2 text-[13px] leading-relaxed text-[#5A4A3C] outline-none focus:border-[#C06E5E]"
                />
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={handleSaveNote}
                    className="flex-1 rounded-xl bg-[#C06E5E] py-2 text-[12px] font-semibold text-white transition active:scale-95"
                  >
                    שמירה
                  </button>
                  <button
                    onClick={() => {
                      setNoteDraft(personalNote);
                      setNoteOpen(false);
                    }}
                    className="rounded-xl border border-[#EADCCB] bg-white px-4 py-2 text-[12px] font-semibold text-[#5A4A3C] transition active:scale-95"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            ) : personalNote ? (
              <button
                onClick={() => setNoteOpen(true)}
                className="w-full rounded-2xl border border-dashed border-[#C06E5E] bg-[#F7DFD8] p-3 text-right transition active:scale-[0.99]"
              >
                <span className="flex items-center gap-1 text-[11px] font-bold text-[#C06E5E]">
                  <PenLine size={12} /> ההערה הפנימית שלי
                </span>
                <span className="mt-1 block whitespace-pre-line text-[13px] leading-relaxed text-[#5A4A3C]">
                  {personalNote}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setNoteOpen(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[#EADCCB] bg-white py-2.5 text-[13px] font-semibold text-[#C06E5E] transition active:scale-95 hover:bg-[#F7DFD8]"
              >
                <Plus size={15} /> הוספת הערה פנימית
              </button>
            ))}
        </div>

        {proposals.length > 0 && (
          <div className="mt-4 rounded-2xl bg-[#FBF3EA] p-3">
            <p className="mb-2 text-[12px] font-semibold text-[#5A4A3C]">התקדמות בהתאמות ({proposals.length})</p>
            <div className="space-y-2.5">
              {proposals.map((p) => {
                // שם הצד השני, כדי שגם רשומת היסטוריה שירדה מהפרק תהיה קריאה כאן
                const partner =
                  p.maleId === candidate.id
                    ? p.femaleName || p.externalFemale?.name
                    : p.maleName || p.externalMale?.name;
                return (
                  <div key={p.id}>
                    <p className="mb-1 text-[11px] font-semibold text-[#C06E5E]">
                      {partner ? `עם ${partner} · ` : ""}
                      {p.status}
                      {p.isHistory ? " (היסטוריה)" : ""}
                    </p>
                    <StageFunnel status={p.status} compact />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {canSeeFullProfile && (
          <div className="mt-4 border-t border-[#EADCCB] pt-3">
            <button
              data-tour="tour-staff-toggle"
              onClick={() => toggleStaffArea(candidate.id)}
              className="flex w-full items-center justify-between text-[13px] font-semibold text-[#C06E5E]"
            >
              <span>אזור פנימי לצוות</span>
              <ChevronDown size={16} className={`transition ${isExpanded ? "rotate-180" : ""}`} />
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-3">
                {role === "admin" && (
                  <Link
                    href={`/crm/edit-candidate?id=${candidate.id}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-[#C06E5E] bg-white px-4 py-2.5 text-sm font-semibold text-[#C06E5E] transition active:scale-95 hover:bg-[#F7DFD8]"
                  >
                    <PenLine size={15} /> עריכת פרטי הכרטיס
                  </Link>
                )}

                {candidate.referenceContacts && (
                  <div data-tour="tour-reference-contacts" className="rounded-2xl border-2 border-[#C06E5E] bg-[#F7DFD8] p-3">
                    <p className="mb-1.5 text-[12px] font-bold text-[#C06E5E]">מספרים לבירורים</p>
                    <p className="mb-2 whitespace-pre-wrap text-[13px] text-[#5A4A3C]">{candidate.referenceContacts}</p>
                    <button
                      onClick={handleCopyReferenceContacts}
                      className="flex w-full items-center justify-center gap-1 rounded-xl bg-[#C06E5E] py-1.5 text-[12px] font-semibold text-white transition active:scale-95"
                    >
                      {referenceCopied ? <Check size={13} /> : <Copy size={13} />}
                      {referenceCopied ? "הועתק!" : "העתקה"}
                    </button>
                  </div>
                )}

                <div data-tour="tour-voice-notes" className="rounded-2xl bg-[#FBF3EA] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#5A4A3C]">
                      <Mic size={14} /> הקלטות שמע
                    </p>
                    <div className="flex items-center gap-1.5">
                      {!recording && (
                        <label className="cursor-pointer rounded-full border border-[#C06E5E] bg-white px-2.5 py-1 text-[11px] font-bold text-[#C06E5E]">
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
                          recording ? "bg-red-500 text-white" : "bg-[#C06E5E] text-white"
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
                    <p className="text-[12px] text-[#C3B5A5]">אין הקלטות עדיין</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {candidate.voiceNotes.map((vn) => {
                        const canDelete = role === "admin" || vn.authorEmail === currentUser().email;
                        return (
                          <li key={vn.id} className="rounded-xl bg-white px-2.5 py-2 text-[12px] shadow-sm">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="font-medium text-[#5A4A3C]">{vn.author}</span>
                              <span className="mr-auto text-[#C3B5A5]">{vn.date}</span>
                              {canDelete && (
                                <button
                                  onClick={() => setPendingDeleteVoiceNoteId(vn.id)}
                                  aria-label="מחיקת הקלטה"
                                  className="rounded-full p-1 hover:bg-[#FBF3EA]"
                                >
                                  <Trash2 size={13} className="text-[#C4584C]" />
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

                <div className="rounded-2xl bg-[#FBF3EA] p-3">
                  <p className="mb-1.5 text-[12px] font-semibold text-[#5A4A3C]">סטטוס פניות</p>
                  <select
                    value={candidate.availabilityStatus}
                    onChange={(e) => {
                      setCandidateAvailability(candidate.id, e.target.value);
                      showToast("הסטטוס נשמר בהצלחה");
                    }}
                    className="w-full rounded-xl border border-[#EADCCB] bg-white px-2.5 py-2 text-[13px] text-[#5A4A3C]"
                  >
                    {AVAILABILITY_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl bg-[#FBF3EA] p-3">
                  <p className="mb-1.5 text-[12px] font-semibold text-[#5A4A3C]">מורכבויות וייחודיות</p>
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
                    className="w-full resize-none rounded-xl border border-[#EADCCB] bg-white px-2.5 py-2 text-[13px] text-[#5A4A3C] outline-none focus:border-[#C06E5E]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-[#FBF3EA] p-3">
                    <p className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#5A4A3C]">
                      <FileText size={13} /> כרטיס יבש (PDF)
                    </p>
                    {candidate.pdfUrl ? (
                      <>
                        <MediaFileLink value={candidate.pdfUrl} />
                        {role === "admin" && (
                          <div className="flex gap-1.5">
                            <label className="flex h-8 flex-1 cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#EADCCB] bg-white text-[11px] font-semibold text-[#C06E5E]">
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
                              className="flex h-8 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-2.5 text-[#C4584C]"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="mb-1.5 text-[11px] text-[#C3B5A5]">לא הועלה קובץ</p>
                        <label className="block cursor-pointer rounded-xl border border-dashed border-[#EADCCB] bg-white py-1.5 text-center text-[11px] font-semibold text-[#C06E5E]">
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

                  <div className="rounded-2xl bg-[#FBF3EA] p-3">
                    <p className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#5A4A3C]">
                      <Music size={13} /> הקלטת היכרות
                    </p>
                    {candidate.introAudioUrl ? (
                      <>
                        <MediaAudio value={candidate.introAudioUrl} onPlay={trackAudioPlay} className="mb-1.5 h-8 w-full" />
                        {role === "admin" && (
                          <div className="flex gap-1.5">
                          <label className="flex h-8 flex-1 cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#EADCCB] bg-white text-[11px] font-semibold text-[#C06E5E]">
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
                              className="flex h-8 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-2.5 text-[#C4584C]"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="mb-1.5 text-[11px] text-[#C3B5A5]">לא הועלתה הקלטה</p>
                        <label className="block cursor-pointer rounded-xl border border-dashed border-[#EADCCB] bg-white py-1.5 text-center text-[11px] font-semibold text-[#C06E5E]">
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

                <div className="rounded-2xl bg-[#FBF3EA] p-3">
                  <p className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#5A4A3C]">
                    <Link2 size={13} /> קישור אישי לעדכון סטטוס
                  </p>
                  <p dir="ltr" className="truncate text-[11px] text-[#8C7B6B]">
                    {personalLink}
                  </p>
                  <button
                    onClick={handleCopyLink}
                    className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-xl border border-[#EADCCB] bg-white py-1.5 text-[11px] font-semibold text-[#C06E5E] transition active:scale-95"
                  >
                    {linkCopied ? <Check size={13} /> : <Copy size={13} />}
                    {linkCopied ? "הועתק!" : "העתקת קישור"}
                  </button>
                </div>

                {role === "admin" && (
                  <>
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
          color: #5A4A3C;
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
  if (loading) return <p className="text-[11px] text-[#8C7B6B]">טוען הקלטה...</p>;
  if (error) return <p className="text-[11px] text-red-500">{error}</p>;
  return <audio controls src={url} onPlay={onPlay} className={className} />;
}

function MediaFileLink({ value }) {
  const { url, error, loading } = useMediaUrl(value);
  if (loading) return <p className="text-[11px] text-[#8C7B6B]">טוען קובץ...</p>;
  if (error) return <p className="text-[11px] text-red-500">{error}</p>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-1.5 block truncate rounded-xl bg-white px-2.5 py-2 text-[12px] font-semibold text-[#C06E5E] shadow-sm"
    >
      צפייה בקובץ
    </a>
  );
}
