"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Phone, MessageCircle, MessageSquare, ChevronLeft, UserCheck } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { waDigits } from "@/components/crm/profiles/ProfileCard";

// "המועמדים שלי" - רשימה אישית לכל אשת צוות, של המועמדים שהיא הנציגה
// המלווה שלהם. מנהלת רואה את כל המשויכים, מקובצים לפי נציגה.
export default function MyCandidatesPage() {
  const role = useCrmStore((s) => s.role);
  const currentStaffEmail = useCrmStore((s) => s.currentStaffEmail);
  const candidates = useCrmStore((s) => s.candidates);
  const contactStaffFor = useCrmStore((s) => s.contactStaffFor);

  const mine = useMemo(() => {
    const assigned = candidates.filter((c) => c.contactStaffEmail);
    if (role === "admin") return assigned;
    return assigned.filter((c) => c.contactStaffEmail === currentStaffEmail);
  }, [candidates, role, currentStaffEmail]);

  if (role !== "staff" && role !== "admin") {
    return <p className="px-4 py-10 text-center text-sm text-[#7C6E60]">אזור זה זמין לצוות בלבד</p>;
  }

  return (
    <div className="px-4 py-6">
      <h1 className="flex items-center gap-2 text-xl font-bold text-[#3A2E26]">
        <UserCheck size={20} /> המועמדים שלי
      </h1>
      <p className="mt-1 text-[13px] text-[#7C6E60]">
        {role === "admin"
          ? `${mine.length} מועמדים משויכים לצוות`
          : `${mine.length} מועמדים שאת/ה הנציג/ה המלווה שלהם`}
      </p>

      {mine.length === 0 ? (
        <p className="mt-16 text-center text-sm text-[#7C6E60]">
          {role === "admin"
            ? "עדיין לא שויכו מועמדים לנציגות. השיוך נעשה מתוך הכרטיס, באזור הפנימי לצוות."
            : "עדיין לא שויכו אלייך מועמדים. המנהלת משייכת נציג/ה מלווה מתוך הכרטיס."}
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {mine.map((c) => {
            const staff = role === "admin" ? contactStaffFor(c) : null;
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-[#CCBDAB] bg-white p-3 shadow-[0_2px_10px_rgba(58,51,53,0.05)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/crm?openCandidate=${c.id}`}
                    className="flex items-center gap-1 text-[13px] font-semibold text-[#844442]"
                  >
                    לכרטיס <ChevronLeft size={13} />
                  </Link>
                  <div className="min-w-0 text-right">
                    <p className="truncate text-[14px] font-bold text-[#3A2E26]">{c.name}</p>
                    {staff && <p className="text-[11px] text-[#7C6E60]">נציג/ה: {staff.name}</p>}
                  </div>
                </div>

                {c.phone && (
                  <div className="mt-2 flex items-center justify-end gap-2 border-t border-[#E8DCCB] pt-2">
                    <a
                      href={`sms:${c.phone}`}
                      aria-label={`שליחת הודעה ל${c.name}`}
                      title="הודעת SMS"
                      className="text-[#7C6E60] transition active:scale-90"
                    >
                      <MessageSquare size={17} />
                    </a>
                    <a
                      href={`https://wa.me/${waDigits(c.phone)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`וואטסאפ ל${c.name}`}
                      title="וואטסאפ"
                      className="text-[#62826B] transition active:scale-90"
                    >
                      <MessageCircle size={17} />
                    </a>
                    <a
                      href={`tel:${c.phone}`}
                      dir="ltr"
                      className="flex items-center gap-1 text-[13px] font-semibold text-[#3A2E26]"
                    >
                      <Phone size={13} className="text-[#844442]" />
                      {c.phone}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
