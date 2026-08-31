"use client";

import { Phone, UserCheck, MessageCircle, Lock } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { waDigits } from "@/components/crm/profiles/ProfileCard";
import { prettyPhone } from "@/components/crm/ui/CopyStaffButton";

// מספר הטלפון הישיר של מועמד/ת מוצג לפי הרשאה:
//   מנהלת            - תמיד רואה את כולם.
//   שגריר/ה מלווה    - רואה את המספר של מי שמשויך אליו/ה אישית.
//   שאר הצוות        - במקום המספר מופנה/ית לשגריר/ה המטפל/ת, עם וואטסאפ ישיר.
// כך נשמר סדר בארגון: כל פנייה למועמד/ת עוברת דרך מי שמכיר/ה אותו/ה.
// אותו כלל הרשאה בדיוק, זמין גם לרכיבים אחרים - כדי שלא ייווצרו שתי גרסאות
// שונות של אותה החלטה. כל מי שמציג מספר של מועמד/ת חייב לעבור דרך כאן.
export function useCanSeeCandidatePhone(candidate) {
  const role = useCrmStore((s) => s.role);
  const currentStaffEmail = useCrmStore((s) => s.currentStaffEmail);
  const norm = (v) => String(v || "").trim().toLowerCase();
  const isMine = !!candidate?.contactStaffEmail && norm(candidate.contactStaffEmail) === norm(currentStaffEmail);
  return role === "admin" || isMine;
}

export default function CandidatePhone({ candidate, compact = false }) {
  const contactStaff = useCrmStore((s) => s.contactStaffFor(candidate));
  const canSeeNumber = useCanSeeCandidatePhone(candidate);

  if (!candidate?.phone) return null;

  if (canSeeNumber) {
    return (
      <a
        href={`tel:${candidate.phone}`}
        dir="ltr"
        className={`flex items-center gap-1 font-semibold text-[#3A2E26] ${compact ? "text-[12px]" : "text-[13px]"}`}
      >
        <Phone size={compact ? 12 : 13} className="text-[#844442]" />
        {prettyPhone(candidate.phone)}
      </a>
    );
  }

  // אין שגריר/ה מלווה כלל - אין למי להפנות, ולכן מפנים למנהלת
  if (!contactStaff) {
    return (
      <div className="flex items-start gap-1.5 rounded-xl bg-[#E8DCCB] px-2.5 py-2">
        <Lock size={13} className="mt-0.5 shrink-0 text-[#7C6E60]" />
        <p className="text-[11px] leading-relaxed text-[#7C6E60]">
          טרם שויך שגריר מטפל למועמד/ת הזה/זו. לפניות, פנו למנהלת.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#CCBDAB] bg-[#E8DCCB] px-2.5 py-2">
      <p className="flex items-center gap-1 text-[11px] font-bold text-[#844442]">
        <UserCheck size={12} /> לפניות, פנה לשגריר המטפל
      </p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {contactStaff.phone && (
            <>
              <a
                href={`https://wa.me/${waDigits(contactStaff.phone)}?text=${encodeURIComponent(
                  `היי ${contactStaff.name}, רציתי להתייעץ איתך לגבי ${candidate.name} מהמאגר`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`וואטסאפ ל${contactStaff.name}`}
                title={`וואטסאפ ל${contactStaff.name}`}
                className="rounded-lg bg-[#62826B] px-2 py-1 text-[11px] font-semibold text-white transition active:scale-95"
              >
                <MessageCircle size={13} className="inline" /> וואטסאפ
              </a>
              <a
                href={`tel:${contactStaff.phone}`}
                className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-[#844442] transition active:scale-95"
              >
                חיוג
              </a>
            </>
          )}
        </div>
        <p className="min-w-0 truncate text-[12px] font-bold text-[#3A2E26]">{contactStaff.name}</p>
      </div>
      {!contactStaff.phone && (
        <p className="mt-1 text-[10px] text-[#A2937F]">לא הוזן טלפון לשגריר/ה בהגדרות הצוות</p>
      )}
    </div>
  );
}
