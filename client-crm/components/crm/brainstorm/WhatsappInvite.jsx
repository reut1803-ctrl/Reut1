"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, PhoneOff, X } from "lucide-react";
import { useCrmStore, allowlistEmail } from "@/lib/crm/store";
import { buildInviteMessage, whatsappNumber } from "@/lib/crm/brainstorm";
import Overlay from "@/components/crm/ui/Overlay";

// שליחת ההזמנה לצוות בוואטסאפ. הודעה אחת מוכנה מראש, וכפתור לכל איש/אשת צוות
// שפותח את וואטסאפ עם ההודעה כבר כתובה - נשאר רק ללחוץ "שלח".
export default function WhatsappInvite({ round, onClose }) {
  const authAllowlist = useCrmStore((s) => s.authAllowlist);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState({});

  const link = typeof window !== "undefined" ? `${window.location.origin}/crm/brainstorm` : "";
  const message = buildInviteMessage({
    candidateName: round?.candidateName,
    question: round?.question,
    secondQuestion: round?.secondQuestion,
    link,
  });

  // כולם חוץ מהמנהלת שפתחה את הסבב - היא כבר יודעת עליו
  const recipients = authAllowlist.filter((e) => allowlistEmail(e) !== round?.openedByEmail);
  const withPhone = recipients.filter((e) => whatsappNumber(e.phone));
  const withoutPhone = recipients.filter((e) => !whatsappNumber(e.phone));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Overlay>

    <div className="fixed inset-0 z-[210] flex items-end justify-center sm:items-center" dir="rtl">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-[#5A4A3C]">
            <MessageCircle size={17} className="text-[#8C9A78]" /> עדכון הצוות בוואטסאפ
          </h2>
          <button onClick={onClose} aria-label="סגירה" className="rounded-full p-1.5 hover:bg-[#FBF3EA]">
            <X size={18} className="text-[#8C7B6B]" />
          </button>
        </div>

        <p className="mt-1.5 text-[12px] leading-relaxed text-[#8C7B6B]">
          ההודעה כבר מוכנה. לחיצה על שם פותחת את וואטסאפ עם ההודעה כתובה - נשאר רק ללחוץ שלח.
        </p>

        <div className="mt-3 rounded-2xl bg-[#FBF3EA] p-3">
          <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-[#5A4A3C]">{message}</p>
          <button
            onClick={handleCopy}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white py-2 text-[12px] font-semibold text-[#C06E5E] shadow-sm transition active:scale-[0.98]"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "ההודעה הועתקה" : "העתקת ההודעה"}
          </button>
        </div>

        {withPhone.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <p className="text-[12px] font-semibold text-[#5A4A3C]">שליחה לאיש/אשת צוות</p>
            {withPhone.map((entry) => {
              const number = whatsappNumber(entry.phone);
              const key = allowlistEmail(entry);
              return (
                <a
                  key={key}
                  href={`https://wa.me/${number}?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setSent((s) => ({ ...s, [key]: true }))}
                  className="flex items-center justify-between rounded-2xl border border-[#EADCCB] bg-white px-3 py-2.5 transition active:scale-[0.99]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-[#5A4A3C]">
                      {entry.name || key}
                    </span>
                    <span dir="ltr" className="block text-right text-[11px] text-[#8C7B6B]">
                      {entry.phone}
                    </span>
                  </span>
                  <span
                    className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold text-white ${
                      sent[key] ? "bg-[#C3B5A5]" : "bg-[#8C9A78]"
                    }`}
                  >
                    {sent[key] ? <Check size={13} /> : <MessageCircle size={13} />}
                    {sent[key] ? "נפתח" : "שליחה"}
                  </span>
                </a>
              );
            })}
          </div>
        )}

        {withoutPhone.length > 0 && (
          <div className="mt-4 rounded-2xl bg-[#FDF6EC] p-3">
            <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#8A6A32]">
              <PhoneOff size={14} /> חסר מספר טלפון
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#8C7B6B]">
              לאנשי הצוות האלה אין מספר טלפון שמור, ולכן אי אפשר לשלוח להם הודעה. אפשר להשלים את
              המספר בלוח בקרה ← הרשאות כניסה.
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {withoutPhone.map((entry) => (
                <li key={allowlistEmail(entry)} className="text-[11px] font-semibold text-[#5A4A3C]">
                  {entry.name || allowlistEmail(entry)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {recipients.length === 0 && (
          <p className="mt-4 rounded-2xl bg-[#FBF3EA] px-3 py-4 text-center text-[12px] text-[#8C7B6B]">
            אין עדיין אנשי צוות נוספים ברשימת ההרשאות.
          </p>
        )}

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-2xl bg-[#C06E5E] py-2.5 text-[13px] font-semibold text-white transition active:scale-[0.98]"
        >
          סיימתי
        </button>
      </div>
    </div>
    </Overlay>
  );
}
