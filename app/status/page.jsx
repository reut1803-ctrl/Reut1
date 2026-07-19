"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
import { useCrmStore, AVAILABILITY_STATUSES } from "@/lib/crm/store";
import { getAvailabilityColors } from "@/lib/crm/availability";

function StatusForm() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const findCandidateById = useCrmStore((s) => s.findCandidateById);
  const updateCandidateOverride = useCrmStore((s) => s.updateCandidateOverride);
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    useCrmStore.persist.rehydrate();
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const candidate = id ? findCandidateById(id) : null;

  if (!candidate) {
    return <p className="text-sm text-[#8A8285]">הקישור לא נמצא. נא לוודא שהועתק במלואו.</p>;
  }

  const handleSelect = (status) => {
    updateCandidateOverride(id, { availabilityStatus: status });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="w-full max-w-sm rounded-3xl border border-[#EAE5E3] bg-white p-6 text-center shadow-[0_4px_18px_rgba(58,51,53,0.06)]">
      <p className="text-sm text-[#8A8285]">שלום {candidate.name.split(" ")[0]},</p>
      <h1 className="mt-1 text-xl font-bold text-[#3A3335]">מה הסטטוס שלך כרגע?</h1>
      <p className="mt-2 text-[13px] text-[#8A8285]">לחיצה על אחד הכפתורים תעדכן את הצוות מיידית</p>

      <div className="mt-6 flex flex-col gap-2.5">
        {AVAILABILITY_STATUSES.map((status) => {
          const colors = getAvailabilityColors(status);
          const active = candidate.availabilityStatus === status;
          return (
            <button
              key={status}
              onClick={() => handleSelect(status)}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-base font-bold transition active:scale-95 ${
                active ? `${colors.bg} ${colors.text}` : "border border-[#EAE5E3] bg-white text-[#3A3335]"
              }`}
            >
              {active && <Check size={18} />}
              {status}
            </button>
          );
        })}
      </div>

      {saved && <p className="mt-4 text-[13px] font-semibold text-[#20A66B]">הסטטוס עודכן, תודה!</p>}
    </div>
  );
}

export default function CandidateStatusPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[#F6F5F4] px-6 py-12" dir="rtl">
      <Suspense fallback={null}>
        <StatusForm />
      </Suspense>
    </div>
  );
}
