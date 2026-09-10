"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { useCrmStore, AVAILABILITY_STATUSES } from "@/lib/crm/store";
import { getAvailabilityColors } from "@/lib/crm/availability";
import PersonalTrackOffer from "@/components/crm/register/PersonalTrackOffer";
import { cleanTrackMessage } from "@/lib/crm/personalTrack";
import { usePublicContent } from "@/lib/crm/usePublicContent";

function StatusForm() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const setCandidateAvailability = useCrmStore((s) => s.setCandidateAvailability);
  const setCandidateTrack = useCrmStore((s) => s.setCandidateTrack);
  const { content } = usePublicContent();
  const [candidate, setCandidate] = useState(undefined);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) {
      setCandidate(null);
      return;
    }
    const unsubscribe = useCrmStore.getState().subscribeCandidateStatus(id, setCandidate);
    return unsubscribe;
  }, [id]);

  if (candidate === undefined) return null;

  if (!candidate) {
    return <p className="text-sm text-[#5E7A87]">הקישור לא נמצא. נא לוודא שהועתק במלואו.</p>;
  }

  const handleSelect = (status) => {
    setCandidateAvailability(id, status);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="w-full max-w-sm">
    <div className="rounded-3xl border border-[#CFE3EC] bg-white p-6 text-center shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
      <p className="text-sm text-[#5E7A87]">שלום {candidate.name.split(" ")[0]},</p>
      <h1 className="mt-1 text-xl font-bold text-[#23414E]">מה הסטטוס שלך כרגע?</h1>
      <p className="mt-2 text-[13px] text-[#5E7A87]">לחיצה על אחד הכפתורים תעדכן את הצוות מיידית</p>

      <div className="mt-6 flex flex-col gap-2.5">
        {AVAILABILITY_STATUSES.map((status) => {
          const colors = getAvailabilityColors(status);
          const active = candidate.availabilityStatus === status;
          return (
            <button
              key={status}
              onClick={() => handleSelect(status)}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-base font-bold transition active:scale-95 ${
                active ? `${colors.bg} ${colors.text}` : "border border-[#CFE3EC] bg-white text-[#23414E]"
              }`}
            >
              {active && <Check size={18} />}
              {status}
            </button>
          );
        })}
      </div>

      {saved && <p className="mt-4 text-[13px] font-semibold text-[#2FA39B]">הסטטוס עודכן, תודה!</p>}
    </div>

    {/* ההצעה נשארת זמינה כאן באופן קבוע, למי שיעדיף להצטרף למסלול מאוחר
        יותר. מי שכבר במסלול אינו רואה אותה - הרכיב מסתיר את עצמו. */}
    <PersonalTrackOffer
      variant="compact"
      currentTrack={candidate.personalTrack || ""}
      payment={content?.payment}
      onChoose={(value, message) => setCandidateTrack(id, value, cleanTrackMessage(message))}
    />
    </div>
  );
}

export default function CandidateStatusPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[#F2F8FB] px-6 py-12" dir="rtl">
      <Suspense fallback={null}>
        <StatusForm />
      </Suspense>
    </div>
  );
}
