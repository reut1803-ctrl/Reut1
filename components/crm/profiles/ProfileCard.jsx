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
  Clock3,
  Star,
  Inbox,
  PhoneCall,
  EyeOff,
} from "lucide-react";
import { useCrmStore, AVAILABILITY_STATUSES, PROPOSAL_DROPPED } from "@/lib/crm/store";
import Button from "@/components/crm/ui/Button";
import CandidatePhoto from "@/components/crm/ui/CandidatePhoto";
import { candidateInitials } from "@/lib/crm/initials";
import { candidatePhoto } from "@/lib/crm/photos";
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
import { daysSinceActivity, needsAttention, isProposalRowVisible, droppedHoursLeft } from "@/lib/crm/attention";

export default function ProfileCard({ candidate, onReadMore }) {
  const role = useCrmStore((s) => s.role);
  const board = useCrmStore((s) => s.board);
  const isFavorite = useCrmStore((s) => s.isFavorite(candidate.id));
  const toggleFavorite = useCrmStore((s) => s.toggleFavorite);
  const expandedId = useCrmStore((s) => s.expandedStaffAreaId);
  const toggleStaffArea = useCrmStore((s) => s.toggleStaffArea);
  const allProposals = useCrmStore((s) => s.proposalsForCandidate(candidate.id));
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

  // חיווי "דורש התייחסות": מבוסס על חותמת זמן של השרת בלבד (ראו lib/crm/attention.js).
  // מוצג רק לצוות ולמנהלת, ובעיצוב עדין - זו תזכורת, לא אזהרה.
  const serverOffsetMs = useCrmStore((s) => s.serverOffsetMs);
  // מפת הפעילות כוללת גם הצעות שידוך וסבבי סיעור מוחות, ולא רק עריכות כרטיס
  const attentionData = useCrmStore((s) => s.attentionData);
  const now = Date.now() + serverOffsetMs;
  const untouchedDays = daysSinceActivity(candidate, now, attentionData);
  const showAttention = (role === "staff" || role === "admin") && needsAttention(candidate, now, attentionData);

  // הצעה שירדה מהפרק מוצגת כאן יומיים בלבד ואז נעלמת, כדי שהכרטיס יישאר נקי.
  // ההצעה עצמה נשמרת במסד הנתונים, והתראת הכפילות ממשיכה לעבוד גם אחרי שהיא
  // כבר אינה מוצגת - ראו droppedProposalFor בחנות הנתונים.
  const proposals = allProposals.filter((p) => isProposalRowVisible(p, now, PROPOSAL_DROPPED));
  // כרטיס שהגיע מטופס ההרשמה החיצוני. התווית גלויה למנהלת בלבד:
  // כל עוד לא נוצר קשר ראשוני היא בולטת, ואחריו היא הופכת לציון עובדתי שקט.
  const markIntakeContacted = useCrmStore((s) => s.markIntakeContacted);
  const [markingContacted, setMarkingContacted] = useState(false);
  const fromIntakeForm = candidate.source === "register-form";
  const intakeContacted = !!candidate.intakeContactedAt;
  const showIntakeTag = role === "admin" && fromIntakeForm;

  const handleMarkContacted = async () => {
    if (markingContacted) return;
    setMarkingContacted(true);
    try {
      await markIntakeContacted(candidate.id);
      showToast("סומן שנוצר קשר ראשוני");
    } catch {
      showToast("הסימון לא נשמר");
    } finally {
      setMarkingContacted(false);
    }
  };

  // "הזרקור היומי": שליטה ידנית מהירה, ישירות על הכרטיס ברשימה, למנהלת בלבד.
  const [spotlightSaving, setSpotlightSaving] = useState(false);
  const inSpotlight = candidate.spotlight === true;
  const handleToggleSpotlight = async () => {
    if (spotlightSaving) return;
    setSpotlightSaving(true);
    try {
      // touch: false בכוונה - סימון לזרקור אינו "טיפול" במועמד/ת. אם הוא היה
      // נספר כטיפול, כל סימון היה מאפס את מונה הימים ומוציא את הכרטיס
      // מהבחירה האוטומטית של 14 הימים.
      await updateCandidate(candidate.id, { spotlight: !inSpotlight }, { touch: false });
      showToast(inSpotlight ? "הוסר מהזרקור היומי" : "נוסף לזרקור היומי");
    } catch {
      showToast("לא הצלחנו לעדכן את הזרקור");
    } finally {
      setSpotlightSaving(false);
    }
  };

  // התמונה הראשית, עם נפילה לרשימת התמונות אם השדה הראשי חסר
  const cardPhoto = candidatePhoto(candidate);

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
    <div className="overflow-hidden rounded-3xl border border-[#EAE5E3] bg-white shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
      <CandidatePhoto candidate={candidate} className="aspect-[4/5] w-full">

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

        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <button
            data-tour="tour-favorite-heart"
            onClick={() => toggleFavorite(candidate.id)}
            aria-label="הוספה למועדפים"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow transition active:scale-90"
          >
            <Heart size={18} className={isFavorite ? "fill-[#8C4A55] text-[#8C4A55]" : "text-[#8A8285]"} />
          </button>

          {role === "admin" && (
            <button
              onClick={handleToggleSpotlight}
              disabled={spotlightSaving}
              title={inSpotlight ? "הסרה מהזרקור היומי" : "הוספה לזרקור היומי"}
              aria-label={inSpotlight ? "הסרה מהזרקור היומי" : "הוספה לזרקור היומי"}
              aria-pressed={inSpotlight}
              className={`flex h-9 items-center gap-1 rounded-full px-2.5 shadow transition active:scale-90 disabled:opacity-60 ${
                inSpotlight ? "bg-[#D9B45F] text-white" : "bg-white/90 text-[#946200]"
              }`}
            >
              <Star size={16} className={inSpotlight ? "fill-white" : ""} />
              <span className="text-[11px] font-bold">{inSpotlight ? "בזרקור" : "לזרקור"}</span>
            </button>
          )}
        </div>

        <div data-tour="tour-card-info" className="absolute bottom-3 right-3 flex flex-wrap gap-1.5">
          <span className="tag-chip-crm">{candidate.age}</span>
          <span className="tag-chip-crm">{candidate.height} ס״מ</span>
          {candidate.eda && <span className="tag-chip-crm">{candidate.eda}</span>}
          {candidate.city && <span className="tag-chip-crm">{candidate.city}</span>}
        </div>
      </CandidatePhoto>

      <div className="p-4">
        {/* מצפן הצוות: סיכום המנהלת מסבב סיעור המוחות האחרון על המועמד/ת */}
        {brainstormSummary && (
          <div className="mb-3 rounded-2xl border border-[#F0D3A0] bg-[#FFF8E7] p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#946200]">
              <Lightbulb size={12} /> מסקנת הצוות מסיעור המוחות
            </p>
            <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-[#3A3335]">
              {brainstormSummary.summary}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold text-[#3A3335]">{candidate.name}</h3>
          {showAttention && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F6E4E6] px-2 py-0.5 text-[10px] font-semibold text-[#8C4A55]">
              <Clock3 size={11} /> דורש התייחסות · {untouchedDays} ימים
            </span>
          )}
        </div>

        {/* תווית מקור הכרטיס - למנהלת בלבד. הצוות אינו רואה אותה כלל. */}
        {showIntakeTag &&
          (intakeContacted ? (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#F6F5F4] px-2 py-0.5 text-[10px] font-semibold text-[#B5AEB0]">
              <Inbox size={11} /> הגיע/ה מהטופס החיצוני
            </span>
          ) : (
            <div className="mt-2 rounded-2xl border border-[#E7CE93] bg-[#FFFCF5] px-2.5 py-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#946200]">
                  <Inbox size={12} /> הרשמה עצמית · ממתין/ה לשיחה ראשונה
                </span>
                <button
                  onClick={handleMarkContacted}
                  disabled={markingContacted}
                  className="mr-auto inline-flex items-center gap-1 rounded-full bg-[#946200] px-2.5 py-1 text-[10px] font-bold text-white transition active:scale-95 disabled:opacity-50"
                >
                  <PhoneCall size={11} /> {markingContacted ? "שומר..." : "יצרתי קשר · פתיחה לצוות"}
                </button>
              </div>
              <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-[#8A8285]">
                <EyeOff size={11} /> הכרטיס גלוי לך בלבד. הצוות יראה אותו רק אחרי שתסמני שנוצר קשר.
              </p>
            </div>
          ))}
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-[#8A8285]">{candidate.bio}</p>

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
              {proposals.map((p) => {
                // שם הצד השני, כדי שגם רשומת היסטוריה שירדה מהפרק תהיה קריאה כאן
                const partner =
                  p.maleId === candidate.id
                    ? p.femaleName || p.externalFemale?.name
                    : p.maleName || p.externalMale?.name;
                return (
                  <div key={p.id}>
                    <p className="mb-1 text-[11px] font-semibold text-[#8C4A55]">
                      {partner ? `עם ${partner} · ` : ""}
                      {p.status}
                      {p.isHistory ? " (היסטוריה)" : ""}
                      {p.status === PROPOSAL_DROPPED && (
                        <span className="font-normal text-[#B5AEB0]">
                          {" "}
                          · יוסתר בעוד {droppedHoursLeft(p, now, PROPOSAL_DROPPED)} שעות
                        </span>
                      )}
                    </p>
                    <StageFunnel status={p.status} compact />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {canSeeFullProfile && (
          <div className="mt-4 border-t border-[#EAE5E3] pt-3">
            <button
              data-tour="tour-staff-toggle"
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
                  <div data-tour="tour-reference-contacts" className="rounded-2xl border-2 border-[#8C4A55] bg-[#F6E4E6] p-3">
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

                <div data-tour="tour-voice-notes" className="rounded-2xl bg-[#F6F5F4] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#3A3335]">
                      <Mic size={14} /> הקלטות שמע
                    </p>
                    <div className="flex items-center gap-1.5">
                      {!recording && (
                        <label className="cursor-pointer rounded-full border border-[#8C4A55] bg-white px-2.5 py-1 text-[11px] font-bold text-[#8C4A55]">
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
                          recording ? "bg-red-500 text-white" : "bg-[#8C4A55] text-white"
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
                            <MediaAudio value={vn.audioUrl} className="h-8 w-full" />
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
                      <>
                        <MediaFileLink value={candidate.pdfUrl} />
                        {role === "admin" && (
                          <div className="flex gap-1.5">
                            <label className="flex h-8 flex-1 cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#EAE5E3] bg-white text-[11px] font-semibold text-[#8C4A55]">
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
                        <p className="mb-1.5 text-[11px] text-[#B5AEB0]">לא הועלה קובץ</p>
                        <label className="block cursor-pointer rounded-xl border border-dashed border-[#EAE5E3] bg-white py-1.5 text-center text-[11px] font-semibold text-[#8C4A55]">
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

                  <div className="rounded-2xl bg-[#F6F5F4] p-3">
                    <p className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#3A3335]">
                      <Music size={13} /> הקלטת היכרות
                    </p>
                    {candidate.introAudioUrl ? (
                      <>
                        <MediaAudio value={candidate.introAudioUrl} onPlay={trackAudioPlay} className="mb-1.5 h-8 w-full" />
                        {role === "admin" && (
                          <div className="flex gap-1.5">
                          <label className="flex h-8 flex-1 cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#EAE5E3] bg-white text-[11px] font-semibold text-[#8C4A55]">
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
                        <p className="mb-1.5 text-[11px] text-[#B5AEB0]">לא הועלתה הקלטה</p>
                        <label className="block cursor-pointer rounded-xl border border-dashed border-[#EAE5E3] bg-white py-1.5 text-center text-[11px] font-semibold text-[#8C4A55]">
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
  if (loading) return <p className="text-[11px] text-[#8A8285]">טוען הקלטה...</p>;
  if (error) return <p className="text-[11px] text-red-500">{error}</p>;
  return <audio controls src={url} onPlay={onPlay} className={className} />;
}

function MediaFileLink({ value }) {
  const { url, error, loading } = useMediaUrl(value);
  if (loading) return <p className="text-[11px] text-[#8A8285]">טוען קובץ...</p>;
  if (error) return <p className="text-[11px] text-red-500">{error}</p>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-1.5 block truncate rounded-xl bg-white px-2.5 py-2 text-[12px] font-semibold text-[#8C4A55] shadow-sm"
    >
      צפייה בקובץ
    </a>
  );
}
