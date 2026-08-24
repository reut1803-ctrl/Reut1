"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Copy, Check, LogOut, RefreshCw } from "lucide-react";
import { useCrmStore } from "@/lib/crm/store";

// מסך ברור למי שנכנס/ה עם גוגל אבל אינו/ה נכנס/ת למערכת.
// יש כאן שני מצבים שונים לגמרי, וחשוב שלא יתבלבלו ביניהם:
// 1. unverified - השרת לא ענה (תקלת רשת/תקשורת). ההרשאה אולי תקינה לחלוטין.
// 2. ברירת המחדל - השרת ענה בבירור שהכתובת אינה ברשימת ההרשאות.
export default function AccessDeniedGate({ unverified = false }) {
  const googleUser = useCrmStore((s) => s.googleUser);
  const signOutGoogle = useCrmStore((s) => s.signOutGoogle);
  const errorCode = useCrmStore((s) => s.allowlistErrorCode);
  const [copied, setCopied] = useState(false);
  const [siteAddress, setSiteAddress] = useState("");

  const email = googleUser?.email || "";

  // הכתובת שממנה האתר נטען. אם היא לא הכתובת המוכרת - זה בדיוק מה שצריך לבדוק.
  useEffect(() => {
    if (typeof window !== "undefined") setSiteAddress(window.location.hostname);
  }, []);

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
    <div className="flex h-dvh flex-col items-center justify-center overflow-y-auto bg-[#F6F5F4] px-6 py-8 safe-top safe-bottom" dir="rtl">
      <div className="w-full max-w-xs text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F6E4E6]">
          <ShieldAlert size={26} className="text-[#8C4A55]" />
        </div>
        <h1 className="text-[19px] font-bold text-[#3A3335]">
          {unverified ? "החיבור לשרת לא הצליח" : "החשבון עדיין לא מאושר לכניסה"}
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[#8A8285]">
          {unverified
            ? "ההתחברות לגוגל הצליחה, אבל לא הצלחנו להגיע לשרת הנתונים. זו תקלת תקשורת - לא ביטול הרשאה. לרוב זה נפתר במעבר מרשת סלולרית ל-Wi-Fi (או להפך) ולחיצה על 'ניסיון נוסף'."
            : "ההתחברות לגוגל הצליחה, אבל השרת השיב שהכתובת הזו אינה נמצאת ברשימת ההרשאות של הצוות. שלחו את הכתובת שמופיעה כאן למנהלת, והיא תאשר אותה תוך רגע."}
        </p>

        {unverified && (
          <button
            onClick={() => window.location.reload()}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#8C4A55] py-2.5 text-[13px] font-semibold text-white transition active:scale-[0.98]"
          >
            <RefreshCw size={15} /> ניסיון נוסף
          </button>
        )}

        <div className="mt-5 rounded-2xl border border-[#EAE5E3] bg-white p-3">
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
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#EAE5E3] bg-white py-2.5 text-[13px] font-semibold text-[#3A3335] transition active:scale-[0.98]"
        >
          <LogOut size={15} /> כניסה עם חשבון אחר
        </button>

        {!unverified && (
          <p className="mt-4 text-[11px] leading-relaxed text-[#B5AEB0]">
            אם המנהלת כבר אישרה את הכתובת - רעננו את הדף. חשוב שהכתובת ברשימה תהיה בדיוק אותה כתובת
            גוגל, אות באות.
          </p>
        )}

        {/* פרטים טכניים קצרים - כדי שאפשר יהיה לשלוח צילום מסך אחד ולדעת מיד מה קרה */}
        <div className="mt-4 rounded-2xl bg-[#EFEDEB] px-3 py-2 text-right">
          <p className="text-[10px] font-semibold text-[#8A8285]">פרטים לצילום מסך</p>
          <p dir="ltr" className="mt-0.5 break-all text-left text-[10px] text-[#8A8285]">
            {siteAddress || "-"}
          </p>
          <p dir="ltr" className="text-left text-[10px] text-[#8A8285]">
            {unverified ? errorCode || "no-response" : "not-on-list"}
          </p>
        </div>
      </div>
    </div>
  );
}
