"use client";

import { useState } from "react";
import { ShieldAlert, Copy, Check, LogOut } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";

// מסך ברור למי שנכנס/ה עם גוגל אבל עדיין לא ברשימת ההרשאות.
// קודם לכן במצב הזה נפתח המאגר כשהוא ריק לגמרי, וזה נראה כאילו אין נתונים במערכת.
export default function AccessDeniedGate() {
  const googleUser = useCrmStore((s) => s.googleUser);
  const signOutGoogle = useCrmStore((s) => s.signOutGoogle);
  const [copied, setCopied] = useState(false);

  const email = googleUser?.email || "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-[#F6F5F4] px-6 safe-top safe-bottom" dir="rtl">
      <div className="w-full max-w-xs text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F6E4E6]">
          <ShieldAlert size={26} className="text-[#8C4A55]" />
        </div>
        <h1 className="text-[19px] font-bold text-[#3A3335]">החשבון עדיין לא מאושר לכניסה</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[#8A8285]">
          ההתחברות לגוגל הצליחה, אבל הכתובת הזו עדיין לא נמצאת ברשימת ההרשאות של הצוות. שלחו את הכתובת
          שמופיעה כאן למנהלת, והיא תאשר אותה תוך רגע.
        </p>

        <div className="mt-5 rounded-2xl border border-[#EAE5E3] bg-white p-3 shadow-sm">
          <p className="mb-1 text-[11px] font-semibold text-[#8A8285]">הכתובת שאיתה נכנסת:</p>
          <p dir="ltr" className="break-all text-left text-[13px] font-bold text-[#3A3335]">
            {email}
          </p>
          <button
            onClick={handleCopy}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#8C4A55] py-2.5 text-[13px] font-semibold text-white transition active:scale-[0.98]"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? "הכתובת הועתקה" : "העתקת הכתובת"}
          </button>
        </div>

        <button
          onClick={signOutGoogle}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#EAE5E3] bg-white py-2.5 text-[13px] font-semibold text-[#3A3335] transition active:scale-[0.98]"
        >
          <LogOut size={15} /> כניסה עם חשבון אחר
        </button>

        <p className="mt-4 text-[11px] leading-relaxed text-[#B5AEB0]">
          אם המנהלת כבר אישרה את הכתובת - רעננו את הדף. חשוב שהכתובת ברשימה תהיה בדיוק אותה כתובת גוגל.
        </p>
      </div>
    </div>
  );
}
