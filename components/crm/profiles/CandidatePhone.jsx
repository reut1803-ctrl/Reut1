"use client";

// דרך הפנייה היחידה בכרטיס המועמד/ת: השגריר/ה המלווה.
//
// כלל ברזל: בכרטיס הפרופיל לעולם אין להציג את מספר הטלפון של המועמד/ת
// עצמו/ה ואין כפתורי פנייה ישירה אליו/ה. מי שרוצה לברר משהו פונה לשגריר/ה
// המלווה - זה שמכיר/ה אותו/ה אישית - וההיכרות הראשונית עוברת דרכו/ה.
//
// זהו מקור אמת יחיד: גם כרטיס המאגר וגם כרטיס ההצעה מרנדרים את הרכיב הזה,
// כדי ששתי התצוגות לא יוכלו להיפרד זו מזו ולהציג כללי חשיפה שונים.

import { UserCheck, MessageCircle, Phone, MessageSquare, Mail } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";
import { waDigits } from "@/components/crm/profiles/ProfileCard";
import { prettyPhone } from "@/components/crm/ui/CopyStaffButton";

// נשמר לתאימות לאחור עבור קוד שמייבא את הבדיקה הזו.
export function useCanSeeCandidatePhone() {
  const role = useCrmStore((s) => s.role);
  return role === "staff" || role === "admin";
}

export default function CandidatePhone({ candidate, compact = false }) {
  const role = useCrmStore((s) => s.role);
  const contactStaff = useCrmStore((s) => s.contactStaffFor(candidate));
  const isTeam = role === "staff" || role === "admin";

  if (!isTeam) return null;

  // כרטיס בלי שגריר/ה משויך/ת: אומרים זאת במפורש במקום להשאיר אזור ריק,
  // כדי שיהיה ברור שזו הגדרה חסרה ולא תקלה.
  if (!contactStaff) {
    return (
      <div className="rounded-xl border border-[#CCBDAB] bg-[#E8DCCB] px-2.5 py-2">
        <p className="flex items-center gap-1 text-[10px] font-bold text-[#844442]">
          <UserCheck size={12} /> איש קשר בצוות לבירורים
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-[#7C6E60]">
          טרם שויך/כה שגריר/ה מלווה למועמד/ת הזה/זו. אפשר לשייך באזור הפנימי לצוות.
        </p>
      </div>
    );
  }

  // שלוש עמודות שוות שמתכווצות עם המסגרת. בעמודה צרה (כרטיס ההצעה, שתי
  // עמודות זו לצד זו) אין מקום למילים ולכן מוצגים אייקונים בלבד, עם שם
  // נגיש לקורא מסך ו-title בריחוף.
  const btn = "flex min-w-0 items-center justify-center gap-1 rounded-lg px-1 font-semibold transition active:scale-95";
  const shape = compact ? "h-8 flex-row" : "flex-col gap-0.5 py-1.5 text-[10px]";
  const Label = ({ children }) => (compact ? null : <span className="truncate">{children}</span>);

  return (
    <div className="min-w-0 rounded-xl border border-[#CCBDAB] bg-[#E8DCCB] px-2.5 py-2">
      <p className="flex items-center gap-1 text-[10px] font-bold text-[#844442]">
        <UserCheck size={12} /> איש קשר בצוות לבירורים
      </p>
      <p className="mt-0.5 text-[12px] font-bold text-[#3A2E26]">{contactStaff.name}</p>
      <p className="text-[10px] leading-snug text-[#7C6E60]">
        מכיר/ה את המועמד/ת אישית - זו הכתובת לכל שאלה ולתיאום לפני שמקדמים
      </p>

      {contactStaff.phone ? (
        <>
          <p dir="ltr" className="mt-1 text-right text-[12px] font-bold text-[#3A2E26]">
            {prettyPhone(contactStaff.phone)}
          </p>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            <a
              href={`tel:${contactStaff.phone}`}
              aria-label={`חיוג ל${contactStaff.name}`}
              title="חיוג"
              className={`${btn} ${shape} bg-[#844442] text-white`}
            >
              <Phone size={14} />
              <Label>חיוג</Label>
            </a>
            <a
              href={`https://wa.me/${waDigits(contactStaff.phone)}?text=${encodeURIComponent(
                `היי ${contactStaff.name}, רציתי להתייעץ איתך לגבי ${candidate?.name || ""} מהמאגר`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`וואטסאפ ל${contactStaff.name}`}
              title="וואטסאפ"
              className={`${btn} ${shape} bg-[#62826B] text-white`}
            >
              <MessageCircle size={14} />
              <Label>וואטסאפ</Label>
            </a>
            <a
              href={`sms:${contactStaff.phone}`}
              aria-label={`הודעה ל${contactStaff.name}`}
              title="הודעת SMS"
              className={`${btn} ${shape} border border-[#CCBDAB] bg-white text-[#7C6E60]`}
            >
              <MessageSquare size={14} />
              <Label>SMS</Label>
            </a>
          </div>
        </>
      ) : (
        <p className="mt-1 text-[10px] text-[#A2937F]">לא הוזן טלפון לשגריר/ה בהגדרות הצוות</p>
      )}

      {contactStaff.email && (
        <a
          href={`mailto:${contactStaff.email}`}
          className="mt-1.5 flex items-center justify-center gap-1 rounded-lg border border-[#CCBDAB] bg-white py-1 text-[11px] font-semibold text-[#844442]"
        >
          <Mail size={12} /> מייל
        </a>
      )}
    </div>
  );
}
