"use client";

// פנייה ישירה למועמד/ת: מספר הטלפון שלו/ה יחד עם חיוג, וואטסאפ ו-SMS.
//
// מוצג לכל מי שמורשה/ית להיכנס למערכת - מנהלת ושגרירים כאחד. כל שגריר/ה
// יכול/ה לראות את כל המאגר ולפנות ישירות, ולא רק למי שמשויך/ת אליו/ה.
//
// זו אינה החלופה לשגריר/ה המלווה אלא תוספת לצידו/ה: שתי דרכי הפנייה
// מוצגות במקביל, כדי שאפשר יהיה גם לפנות למועמד/ת וגם להתייעץ עם מי
// שמכיר/ה אותו/ה אישית לפני שמקדמים.

import { Phone, MessageCircle, MessageSquare } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { waDigits } from "@/components/crm/profiles/ProfileCard";
import { prettyPhone } from "@/components/crm/ui/CopyStaffButton";

export default function CandidateDirectContact({ candidate, compact = false }) {
  const role = useCrmStore((s) => s.role);
  const isTeam = role === "staff" || role === "admin";

  if (!isTeam || !candidate?.phone) return null;

  const size = compact ? 13 : 15;
  const pad = compact ? "py-2" : "py-2.5";
  const text = compact ? "text-[11px]" : "text-[13px]";

  return (
    <div>
      <p dir="ltr" className={`mb-1.5 text-right font-bold text-[#3A2E26] ${compact ? "text-[12px]" : "text-[13px]"}`}>
        {prettyPhone(candidate.phone)}
      </p>
      <div className="flex gap-1.5">
        <a
          href={`tel:${candidate.phone}`}
          aria-label={`חיוג ל${candidate.name}`}
          className={`flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#844442] px-2 ${pad} ${text} font-semibold text-white transition active:scale-95`}
        >
          <Phone size={size - 2} /> חיוג
        </a>
        <a
          href={`https://wa.me/${waDigits(candidate.phone)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`וואטסאפ ל${candidate.name}`}
          className={`flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#62826B] px-2 ${pad} ${text} font-semibold text-white transition active:scale-95`}
        >
          <MessageCircle size={size - 2} /> וואטסאפ
        </a>
        <a
          href={`sms:${candidate.phone}`}
          aria-label={`הודעה ל${candidate.name}`}
          title="הודעת SMS"
          className={`flex ${compact ? "h-8 w-8" : "h-10 w-10"} shrink-0 items-center justify-center rounded-xl border border-[#CCBDAB] bg-white text-[#7C6E60] transition active:scale-95`}
        >
          <MessageSquare size={size - 1} />
        </a>
      </div>
    </div>
  );
}
