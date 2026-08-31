"use client";

import Link from "next/link";
import {
  Briefcase,
  ChevronLeft,
  Globe,
  MapPin,
  Mic,
  Phone,
  Route,
  Sparkles,
  X,
} from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { useMediaUrl } from "@/lib/crm/useMediaUrl";
import { useBackToClose } from "@/lib/crm/useBackToClose";
import { candidateOccupations } from "@/lib/crm/mockData";
import Overlay from "@/components/crm/ui/Overlay";

// נגן להקלטה ששמורה במסד בחלקים. נטען רק כשהחלון פתוח.
function VoicePlayer({ value }) {
  const { url, error, loading } = useMediaUrl(value);
  if (loading) return <p className="text-[11px] text-[#B5AEB0]">טוען הקלטה...</p>;
  if (error || !url) return <p className="text-[11px] text-[#C24545]">ההקלטה לא נטענה</p>;
  return <audio controls src={url} className="h-8 w-full" />;
}

function Row({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2.5 rounded-xl bg-[#F6F5F4] px-3 py-2.5">
      <Icon size={15} className="shrink-0 text-[#8C4A55]" />
      <span className="w-24 shrink-0 text-[12px] text-[#8A8285]">{label}</span>
      <span className="text-[13px] font-medium text-[#3A3335]">{value}</span>
    </div>
  );
}

// הצצה לכרטיס המועמד/ת מתוך זירת סיעור המוחות, בלי לצאת מהזירה.
// לקריאה בלבד: אפשר להתרשם מהכל, לסגור, ולהמשיך לכתוב באותו רגע.
export default function CandidatePeek({ candidateId, onClose }) {
  const findCandidateById = useCrmStore((s) => s.findCandidateById);
  const candidateExistsInDb = useCrmStore((s) => s.candidateExistsInDb);
  const candidatesLoaded = useCrmStore((s) => s.candidatesLoaded);
  const role = useCrmStore((s) => s.role);
  useBackToClose(true, onClose);

  const candidate = findCandidateById(candidateId);
  const canSeeInternal = role === "staff" || role === "admin";
  const occupations = candidate ? candidateOccupations(candidate) : [];
  const photos = candidate?.photoUrls?.length
    ? candidate.photoUrls
    : candidate?.photoUrl
    ? [candidate.photoUrl]
    : [];

  // המצב הזה קורה כשהכרטיס נמחק מהמאגר, או כשהוא חסוי למשתמש/ת הנוכחי/ת
  const missing = candidatesLoaded && !candidate;

  return (
    <Overlay>

    <div className="fixed inset-0 z-[160] flex items-end justify-center sm:items-center" dir="rtl">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {/* כפתור סגירה תמיד באותו מקום, גם כשגוללים */}
        <button
          onClick={onClose}
          aria-label="סגירה וחזרה לדיון"
          className="sticky top-3 z-10 ml-3 mr-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md"
        >
          <X size={18} className="text-[#3A3335]" />
        </button>

        {!candidatesLoaded ? (
          <p className="px-5 pb-6 pt-2 text-center text-[13px] text-[#8A8285]">טוען את הכרטיס...</p>
        ) : missing ? (
          <div className="px-5 pb-6 pt-2 text-center">
            <p className="text-[14px] font-bold text-[#3A3335]">הכרטיס אינו זמין</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-[#8A8285]">
              הכרטיס נמחק מהמאגר, או שהוא מסומן כחסוי ואין לך הרשאה לצפות בו.
            </p>
          </div>
        ) : (
          <>
            <div className="-mt-9 px-5 pb-5 pt-2">
              {photos.length > 0 && (
                <div className="mb-4 flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-2xl [&::-webkit-scrollbar]:hidden">
                  {photos.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt={candidate.name}
                      className="h-56 w-full shrink-0 snap-center rounded-2xl object-cover"
                    />
                  ))}
                </div>
              )}

              <h2 className="text-xl font-bold text-[#3A3335]">{candidate.name}</h2>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {candidate.age && <span className="peek-chip">{candidate.age}</span>}
                {candidate.height && <span className="peek-chip">{candidate.height} ס״מ</span>}
                {candidate.city && (
                  <span className="peek-chip flex items-center gap-1">
                    <MapPin size={11} /> {candidate.city}
                  </span>
                )}
                {candidate.eda && (
                  <span className="peek-chip flex items-center gap-1">
                    <Globe size={11} /> {candidate.eda}
                  </span>
                )}
                {candidate.availabilityStatus && <span className="peek-chip">{candidate.availabilityStatus}</span>}
              </div>

              <div className="mt-4 space-y-2">
                <Row icon={Sparkles} label="רמת תורניות" value={candidate.religiousLevel} />
                <Row icon={Briefcase} label="עיסוק נוכחי" value={candidate.currentOccupation} />
                {canSeeInternal && <Row icon={Phone} label="טלפון" value={candidate.phone} />}
              </div>

              {candidate.bio && (
                <div className="mt-4">
                  <p className="mb-1 text-[12px] font-semibold text-[#3A3335]">קצת עליי</p>
                  <p className="whitespace-pre-line text-[13px] leading-relaxed text-[#8A8285]">{candidate.bio}</p>
                </div>
              )}

              {occupations.length > 0 && (
                <div className="mt-4">
                  <p className="mb-1.5 flex items-center gap-1 text-[12px] font-semibold text-[#3A3335]">
                    <Route size={13} className="text-[#8C4A55]" /> המסלול שלי
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {occupations.map((o) => (
                      <span key={o} className="peek-chip">
                        {o}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {candidate.traits?.length > 0 && (
                <div className="mt-4">
                  <p className="mb-1.5 text-[12px] font-semibold text-[#3A3335]">תכונות</p>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.traits.map((t) => (
                      <span key={t} className="rounded-full bg-[#F6E4E6] px-2.5 py-1 text-[11px] font-semibold text-[#6E3540]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {candidate.smoking && (
                <p className="mt-3 text-[11px] text-[#8A8285]">* עישון: {candidate.smoking}</p>
              )}

              {/* האזור הפנימי: הקלטות ומידע שמור לצוות בלבד */}
              {canSeeInternal && (
                <div className="mt-4 space-y-3 border-t border-[#EAE5E3] pt-4">
                  <div className="rounded-2xl bg-[#F6F5F4] p-3">
                    <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-[#3A3335]">
                      <Mic size={14} /> הקלטות שמע
                    </p>
                    {!candidate.voiceNotes || candidate.voiceNotes.length === 0 ? (
                      <p className="text-[12px] text-[#B5AEB0]">אין הקלטות</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {candidate.voiceNotes.map((vn) => (
                          <li key={vn.id} className="rounded-xl bg-white px-2.5 py-2 shadow-sm">
                            <div className="mb-1 flex items-center gap-2 text-[11px]">
                              <span className="font-medium text-[#3A3335]">{vn.author}</span>
                              <span className="mr-auto text-[#B5AEB0]">{vn.date}</span>
                            </div>
                            <VoicePlayer value={vn.audioUrl} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {candidate.referenceContacts && (
                    <div className="rounded-2xl border-2 border-[#8C4A55] bg-[#F6E4E6] p-3">
                      <p className="mb-1 text-[12px] font-bold text-[#8C4A55]">מספרים לבירורים</p>
                      <p className="whitespace-pre-wrap text-[13px] text-[#3A3335]">{candidate.referenceContacts}</p>
                    </div>
                  )}

                  {candidate.complexityNotes && (
                    <div className="rounded-2xl bg-[#F6F5F4] p-3">
                      <p className="mb-1 text-[12px] font-semibold text-[#3A3335]">מורכבויות וייחודיות</p>
                      <p className="whitespace-pre-wrap text-[13px] text-[#8A8285]">{candidate.complexityNotes}</p>
                    </div>
                  )}

                  {role === "admin" && candidate.adminNote && (
                    <div className="rounded-2xl bg-[#FFF8E7] p-3">
                      <p className="mb-1 text-[12px] font-semibold text-[#946200]">הערת מנהלת</p>
                      <p className="whitespace-pre-wrap text-[13px] text-[#3A3335]">{candidate.adminNote}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-2xl bg-[#8C4A55] py-2.5 text-[13px] font-semibold text-white transition active:scale-[0.98]"
                >
                  חזרה לדיון
                </button>
                <Link
                  href={`/crm?openCandidate=${candidate.id}`}
                  className="flex shrink-0 items-center justify-center gap-1 rounded-2xl border border-[#EAE5E3] bg-white px-3 py-2.5 text-[12px] font-semibold text-[#8C4A55]"
                >
                  לכרטיס המלא <ChevronLeft size={14} />
                </Link>
              </div>
            </div>

            <style jsx>{`
              .peek-chip {
                border-radius: 999px;
                background: #f6f5f4;
                padding: 4px 10px;
                font-size: 11px;
                font-weight: 700;
                color: #3a3335;
              }
            `}</style>
          </>
        )}
      </div>
    </div>
    </Overlay>
  );
}
