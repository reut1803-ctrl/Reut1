"use client";

import { Sparkles, Phone } from "lucide-react";
import { PERSONAL_TRACK_PRICE, PAYBOX_URL, BIT_PHONE } from "@/lib/appConfig";

// הצעת "המסלול האישי".
//
// מוצגת אך ורק אחרי שההרשמה הושלמה, ולעולם לא בתוך שלבי מילוי הטופס:
// אזכור עלות באמצע המילוי יוצר חיכוך ומוריד השלמות, וההצטרפות למאגר
// עצמה ממילא אינה כרוכה בתשלום.
//
// variant="full"    – מסך הביניים שאחרי השליחה, מלא ובולט.
// variant="compact" – האזור האישי, דיסקרטי וקבוע, למי שיעדיף לשלם מאוחר יותר.
export default function PersonalTrackOffer({ variant = "full" }) {
  const hasPayment = Boolean(PAYBOX_URL || BIT_PHONE);
  const compact = variant === "compact";

  const PayButtons = () =>
    hasPayment ? (
      <div className={compact ? "mt-2.5 space-y-2" : "mt-3 space-y-2"}>
        {PAYBOX_URL && (
          <a
            href={PAYBOX_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#2E8BA8] font-bold text-white transition active:scale-95 ${
              compact ? "py-2.5 text-[13px]" : "py-3 text-[14px]"
            }`}
          >
            תשלום מהיר ב-PayBox
          </a>
        )}
        {BIT_PHONE && (
          <p className="flex items-center justify-center gap-1.5 rounded-2xl border border-[#CFE3EC] py-2.5 text-[13px] font-semibold text-[#23414E]">
            <Phone size={14} /> ביט למספר {BIT_PHONE}
          </p>
        )}
      </div>
    ) : (
      <p
        className={`rounded-2xl border border-dashed border-[#CFE3EC] px-3.5 py-2.5 leading-relaxed text-[#5E7A87] ${
          compact ? "mt-2.5 text-[11.5px]" : "mt-3 text-[12.5px]"
        }`}
      >
        פרטי התשלום יימסרו לכם בשיחה איתנו.
      </p>
    );

  if (compact) {
    return (
      <div className="mt-4 w-full rounded-2xl border border-[#CFE3EC] bg-white p-4 text-right">
        <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-[#1F6E88]">
          <Sparkles size={15} /> המסלול האישי · {PERSONAL_TRACK_PRICE} ₪
        </p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#5E7A87]">
          שיחת היכרות מעמיקה שבה נדייק יחד את מה שאתם באמת מחפשים. אופציונלי, ואפשר להצטרף אליו
          בכל שלב.
        </p>
        <PayButtons />
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-3xl border-2 border-[#2E8BA8] bg-white p-5 shadow-[0_4px_18px_rgba(31,110,136,0.08)]">
      <p className="flex items-center gap-1.5 text-[15px] font-bold text-[#1F6E88]">
        <Sparkles size={17} /> רוצים שנדייק את החיפוש?
      </p>
      <p className="mt-2 text-[13.5px] leading-relaxed text-[#23414E]">
        <strong>המסלול האישי</strong> הוא שיחת היכרות מעמיקה איתנו, שבה נדייק יחד את מה שאתם באמת
        מחפשים. זה מה שהופך את ההצעות מ״מתאים על הנייר״ למתאים באמת.
      </p>
      <p className="mt-3 rounded-2xl bg-[#EAF5FA] px-3.5 py-2.5 text-[13px] font-semibold text-[#1F6E88]">
        מחיר השקה: {PERSONAL_TRACK_PRICE} ₪ בלבד · אופציונלי לחלוטין
      </p>
      <PayButtons />
      <p className="mt-3 text-[12px] leading-relaxed text-[#5E7A87]">
        לאחר התשלום ניצור איתכם קשר לתיאום השיחה. אפשר גם לדלג — אתם כבר במאגר, וההצטרפות אליו
        ללא עלות.
      </p>
    </div>
  );
}
