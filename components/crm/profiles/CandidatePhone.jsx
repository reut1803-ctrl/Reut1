"use client";

import { UserCheck, MessageCircle, Phone, MessageSquare } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { waDigits } from "@/components/crm/profiles/ProfileCard";
import CandidateDirectContact from "@/components/crm/profiles/CandidateDirectContact";

// שתי דרכי הפנייה, זו לצד זו:
//   1. פנייה ישירה למועמד/ת - חיוג, וואטסאפ ו-SMS.
//   2. פנייה לשגריר/ה המלווה - לכל שאלה ובירור לפני שמקדמים.
//
// שתיהן גלויות לכל מי שמורשה/ית במערכת, מנהלת ושגרירים כאחד. כל שגריר/ה
// רואה/ה את כל המאגר ויכול/ה להציע התאמות בחופשיות; השגריר/ה המלווה
// אינו/ה שומר/ת סף אלא כתובת להתייעצות.

// נשמר לתאימות לאחור עבור קוד שמייבא את הבדיקה הזו.
// כיום כל אנשי הצוות רואים את מספרי המועמדים, ולכן היא בודקת הרשאה בלבד.
export function useCanSeeCandidatePhone() {
  const role = useCrmStore((s) => s.role);
  return role === "staff" || role === "admin";
}

export default function CandidatePhone({ candidate, compact = false }) {
  const role = useCrmStore((s) => s.role);
  const contactStaff = useCrmStore((s) => s.contactStaffFor(candidate));
  const isTeam = role === "staff" || role === "admin";

  if (!isTeam) return null;

  return (
    <div className="space-y-2">
      <CandidateDirectContact candidate={candidate} compact={compact} />

      {contactStaff ? (
        <div className="rounded-xl border border-[#CCBDAB] bg-[#E8DCCB] px-2.5 py-2">
          <p className="flex items-center gap-1 text-[10px] font-bold text-[#844442]">
            <UserCheck size={12} /> שגריר/ה מלווה - לשאלות ובירורים
          </p>
          <p className="mt-0.5 text-[12px] font-bold text-[#3A2E26]">{contactStaff.name}</p>
          {contactStaff.phone ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <a
                href={`tel:${contactStaff.phone}`}
                className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-[#844442]"
              >
                <Phone size={11} /> חיוג
              </a>
              <a
                href={`https://wa.me/${waDigits(contactStaff.phone)}?text=${encodeURIComponent(
                  `היי ${contactStaff.name}, רציתי להתייעץ איתך לגבי ${candidate?.name || ""} מהמאגר`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 rounded-lg bg-[#62826B] px-2 py-1 text-[11px] font-semibold text-white"
              >
                <MessageCircle size={11} /> וואטסאפ
              </a>
              <a
                href={`sms:${contactStaff.phone}`}
                title="הודעת SMS"
                className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-[#7C6E60]"
              >
                <MessageSquare size={11} /> SMS
              </a>
            </div>
          ) : (
            <p className="mt-1 text-[10px] text-[#A2937F]">לא הוזן טלפון לשגריר/ה בהגדרות הצוות</p>
          )}
        </div>
      ) : (
        <p className="rounded-xl bg-[#E8DCCB] px-2.5 py-2 text-[11px] leading-relaxed text-[#7C6E60]">
          טרם שויך/כה שגריר/ה מלווה למועמד/ת הזה/זו.
        </p>
      )}
    </div>
  );
}
