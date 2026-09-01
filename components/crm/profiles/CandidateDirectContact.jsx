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

  // הכפתורים יושבים בשלוש עמודות שוות. בעמודה צרה (כרטיס ההצעה, שתי עמודות
  // זו לצד זו) אין מקום למילה "וואטסאפ" - נמדד שהיא דורשת 42px והעמודה נותנת
  // כ-30px - ולכן שם מוצגים אייקונים בלבד, עם שם נגיש לקורא מסך ו-title בריחוף.
  // בכרטיס הרחב, שבו יש מקום, מוצגת גם המילה.
  const btn = "flex min-w-0 items-center justify-center gap-1 rounded-xl px-1 font-semibold transition active:scale-95";
  const shape = compact ? "h-9 flex-row" : "flex-col gap-0.5 py-1.5 text-[10px]";

  const Label = ({ children }) => (compact ? null : <span className="truncate">{children}</span>);

  return (
    <div className="min-w-0">
      <p dir="ltr" className={`mb-1.5 text-right font-bold text-[#3A2E26] ${compact ? "text-[12px]" : "text-[13px]"}`}>
        {prettyPhone(candidate.phone)}
      </p>

      <div className="grid grid-cols-3 gap-1.5">
        <a
          href={`tel:${candidate.phone}`}
          aria-label={`חיוג ל${candidate.name}`}
          title="חיוג"
          className={`${btn} ${shape} bg-[#844442] text-white`}
        >
          <Phone size={15} />
          <Label>חיוג</Label>
        </a>
        <a
          href={`https://wa.me/${waDigits(candidate.phone)}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`וואטסאפ ל${candidate.name}`}
          title="וואטסאפ"
          className={`${btn} ${shape} bg-[#62826B] text-white`}
        >
          <MessageCircle size={15} />
          <Label>וואטסאפ</Label>
        </a>
        <a
          href={`sms:${candidate.phone}`}
          aria-label={`הודעה ל${candidate.name}`}
          title="הודעת SMS"
          className={`${btn} ${shape} border border-[#CCBDAB] bg-white text-[#7C6E60]`}
        >
          <MessageSquare size={15} />
          <Label>SMS</Label>
        </a>
      </div>
    </div>
  );
}
